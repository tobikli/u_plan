"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  Minus,
  Plus,
  LoaderCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { useData } from "@/lib/data-provider";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ProgramForm } from "./program-form";
import { CourseForm } from "./course-form";
import { CourseTable } from "@/app/app/courses/courses";
import { getCourseColumns } from "@/app/app/courses/columns";
import {
  OverviewLoading,
  OverviewStats,
} from "@/components/workspace/overview";
import { CircularProgress } from "@/components/customized/progress/progress-08";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatStudyPeriod, getStudyPeriodLabel } from "@/lib/study-period";

const chartConfig = {
  credits: { label: "Credits", color: "var(--study-accent)" },
  average: { label: "Average grade", color: "var(--study-accent)" },
  count: { label: "Courses", color: "var(--study-accent)" },
} satisfies ChartConfig;
function EmptyTrend({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm leading-6 text-muted-foreground">
      {children}
    </div>
  );
}

export default function StudyDetail() {
  const { id } = useParams<{ id: string }>();
  const { studyPrograms, courses, loading, preferences, refreshStudyPrograms } =
    useData();
  const [updatingPeriod, setUpdatingPeriod] = useState(false);
  const program = studyPrograms.find((program) => program.id === id);
  const programCourses = useMemo(
    () => courses.filter((course) => course.program_id === id),
    [courses, id],
  );
  const columns = useMemo(
    () =>
      getCourseColumns(preferences).filter((column) => column.id !== "program"),
    [preferences],
  );
  const studyPeriod = getStudyPeriodLabel(preferences);
  const currentCredits = programCourses
    .filter(
      (course) => course.finished && course.credits > 0,
    )
    .reduce((sum, course) => sum + course.credits, 0);
  const progress = program?.credits
    ? Math.min(
        100,
        Math.max(0, Math.round((currentCredits / program.credits) * 100)),
      )
    : 0;
  const best = preferences?.grade_min ?? 1;
  const worst = preferences?.grade_max ?? 5;
  const passed = preferences?.grade_passed ?? 4;
  const graded = programCourses.filter(
    (course) =>
      course.grade != null &&
      course.credits > 0 &&
      (preferences?.grade_include_failed ||
        (best < worst ? course.grade <= passed : course.grade >= passed)),
  );
  const gradedCredits = graded.reduce((sum, course) => sum + course.credits, 0);
  const averageGrade = gradedCredits
    ? graded.reduce((sum, course) => sum + course.grade! * course.credits, 0) /
      gradedCredits
    : null;
  const periodData = useMemo(() => {
    const periods = new Map<
      number,
      { credits: number; weighted: number; gradedCredits: number }
    >();
    programCourses.forEach((course) => {
      if (!course.semesters || course.credits <= 0) return;
      const entry = periods.get(course.semesters) ?? {
        credits: 0,
        weighted: 0,
        gradedCredits: 0,
      };
      entry.credits += course.credits;
      if (course.grade != null) {
        entry.weighted += course.grade * course.credits;
        entry.gradedCredits += course.credits;
      }
      periods.set(course.semesters, entry);
    });
    return [...periods.entries()]
      .sort(([a], [b]) => a - b)
      .map(([period, entry]) => ({
        period: formatStudyPeriod(preferences, period, { compact: true }),
        credits: entry.credits,
        average: entry.gradedCredits
          ? Number((entry.weighted / entry.gradedCredits).toFixed(2))
          : null,
      }));
  }, [programCourses, preferences]);
  const distribution = useMemo(() => {
    const counts = new Map<string, number>();
    programCourses.forEach((course) => {
      if (course.grade == null) return;
      const grade = course.grade.toFixed(1);
      counts.set(grade, (counts.get(grade) ?? 0) + 1);
    });
    return [...counts]
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => Number(a.grade) - Number(b.grade));
  }, [programCourses]);

  // Keep the existing credit-based completion behavior out of the render phase.
  useEffect(() => {
    if (loading || !program || program.credits <= 0) return;
    const finished = currentCredits >= program.credits;
    if (finished === program.finished) return;
    let cancelled = false;
    const syncStatus = async () => {
      try {
        const client = createClient();
        const {
          data: { user },
        } = await client.auth.getUser();
        if (!user || cancelled) return;
        const { error } = await client
          .from("study_programs")
          .update({ finished })
          .eq("user_id", user.id)
          .eq("id", program.id);
        if (cancelled) return;
        if (error) {
          toast.error("Could not update program completion");
          return;
        }
        await refreshStudyPrograms();
        if (finished)
          toast.success(`You’ve reached the credit goal for ${program.name}!`);
      } catch {
        if (!cancelled) toast.error("Could not update program completion");
      }
    };
    void syncStatus();
    return () => {
      cancelled = true;
    };
  }, [program, currentCredits, loading, refreshStudyPrograms]);

  if (loading) return <OverviewLoading />;
  if (!program)
    return (
      <div className="mx-auto max-w-7xl space-y-4 p-8">
        <h1 className="text-2xl font-semibold">Program not found</h1>
        <Button asChild variant="outline">
          <Link href="/app/programs">Back to programs</Link>
        </Button>
      </div>
    );
  const updatePeriod = async (next: number) => {
    if (updatingPeriod || next < 1 || next > program.semesters) return;
    setUpdatingPeriod(true);
    try {
      const client = createClient();
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser();
      if (authError || !user) {
        toast.error("Please log in again to update your study period");
        return;
      }
      const { error } = await client
        .from("study_programs")
        .update({ current_semester: next })
        .eq("user_id", user.id)
        .eq("id", program.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      await refreshStudyPrograms();
      toast.success(
        `${getStudyPeriodLabel(preferences, { capitalized: true })} updated`,
      );
    } catch {
      toast.error("Could not update your study period");
    } finally {
      setUpdatingPeriod(false);
    }
  };
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-5 sm:space-y-8 sm:p-8 lg:p-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <Link
            href="/app/programs"
            className="mb-5 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            All programs
          </Link>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] break-words sm:text-4xl">
            {program.name}
          </h1>
          <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
            <Building2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {program.institution || "Your study program"}
          </p>
        </div>
        <div className="w-fit shrink-0">
          <ProgramForm program={program} />
        </div>
      </div>
      <OverviewStats
        items={[
          {
            label: "Courses",
            value: programCourses.length,
            detail: "Connected to this program",
          },
          {
            label: "Credits earned",
            value: currentCredits,
            detail: `Of ${program.credits} required ECTS`,
          },
          {
            label: "Average grade",
            value: averageGrade !== null ? averageGrade.toFixed(2) : "—",
            detail: "Weighted by course credits",
          },
          {
            label: getStudyPeriodLabel(preferences, { capitalized: true }),
            value: `${program.current_semester} / ${program.semesters}`,
            detail: "Your current study period",
          },
        ]}
      />
      <div className="grid items-start gap-5 xl:grid-cols-12 xl:items-stretch">
        <Card className="min-w-0 gap-5 border-teal-600/15 bg-linear-to-br from-teal-600/[0.06] to-card shadow-xs xl:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base tracking-tight">
                Study progress
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] font-normal">
                {program.finished ? "Completed" : "In progress"}
              </Badge>
            </div>
            <CardDescription>Your progress toward your degree</CardDescription>
          </CardHeader>
          <CardContent className="xl:flex xl:flex-1 xl:flex-col xl:justify-between xl:gap-6">
            <div className="flex items-center gap-4">
              <div className="aspect-square w-44 max-w-[55%] shrink-0 [&>div]:size-full [&_svg]:size-full">
                <CircularProgress
                  value={progress}
                  size={176}
                  strokeWidth={9}
                  showLabel
                  renderLabel={(value) => `${value}%`}
                  labelClassName="text-2xl font-semibold sm:text-3xl"
                  className="stroke-muted"
                  progressClassName="stroke-teal-600 dark:stroke-teal-400"
                />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                  {currentCredits}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    / {program.credits}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ECTS earned
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4 xl:mt-0">
              <div>
                <p className="text-xs font-medium">
                  {formatStudyPeriod(preferences, program.current_semester, {
                    capitalized: true,
                  })}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Adjust your current study period
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label={`Previous ${studyPeriod}`}
                  onClick={() =>
                    void updatePeriod(program.current_semester - 1)
                  }
                  disabled={updatingPeriod || program.current_semester <= 1}
                >
                  <Minus aria-hidden="true" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label={`Next ${studyPeriod}`}
                  onClick={() =>
                    void updatePeriod(program.current_semester + 1)
                  }
                  disabled={
                    updatingPeriod ||
                    program.current_semester >= program.semesters
                  }
                >
                  {updatingPeriod ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <Plus aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
            {program.description && (
              <p className="mt-4 border-t pt-4 text-xs leading-6 whitespace-pre-wrap text-muted-foreground xl:mt-0">
                {program.description}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0 gap-4 shadow-xs xl:col-span-8">
          <CardHeader>
            <CardTitle className="text-base tracking-tight">
              Program statistics
            </CardTitle>
            <CardDescription>
              Credits and grade patterns across your{" "}
              {getStudyPeriodLabel(preferences, { plural: true })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="credits" className="gap-4">
              <TabsList
                aria-label="Program charts"
                className="grid w-full grid-cols-3"
              >
                <TabsTrigger value="credits" className="text-xs">
                  Credits
                </TabsTrigger>
                <TabsTrigger value="grades" className="text-xs">
                  Grades
                </TabsTrigger>
                <TabsTrigger value="distribution" className="text-xs">
                  Distribution
                </TabsTrigger>
              </TabsList>
              <TabsContent value="credits">
                {periodData.length ? (
                  <ChartContainer
                    config={chartConfig}
                    className="h-56 w-full aspect-auto"
                    aria-label={`Credits per ${studyPeriod}`}
                  >
                    <BarChart data={periodData} accessibilityLayer>
                      <CartesianGrid vertical={false} strokeDasharray="3 5" />
                      <XAxis
                        dataKey="period"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                      />
                      <YAxis
                        width={30}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="credits"
                        fill="var(--color-credits)"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={48}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <EmptyTrend>
                    Add courses to see how your credits are spread across your
                    studies.
                  </EmptyTrend>
                )}
              </TabsContent>
              <TabsContent value="grades">
                {periodData.some((period) => period.average !== null) ? (
                  <ChartContainer
                    config={chartConfig}
                    className="h-56 w-full aspect-auto"
                    aria-label={`Average grade per ${studyPeriod}`}
                  >
                    <LineChart data={periodData} accessibilityLayer>
                      <CartesianGrid vertical={false} strokeDasharray="3 5" />
                      <XAxis
                        dataKey="period"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                      />
                      <YAxis
                        width={30}
                        axisLine={false}
                        tickLine={false}
                        domain={[Math.min(best, worst), Math.max(best, worst)]}
                        reversed={best < worst}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        dataKey="average"
                        stroke="var(--color-average)"
                        strokeWidth={2.5}
                        dot={{
                          r: 4,
                          fill: "var(--color-average)",
                          strokeWidth: 0,
                        }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <EmptyTrend>
                    Record a course grade to see your grade trends.
                  </EmptyTrend>
                )}
              </TabsContent>
              <TabsContent value="distribution">
                {distribution.length ? (
                  <ChartContainer
                    config={chartConfig}
                    className="h-56 w-full aspect-auto"
                    aria-label="Grade distribution"
                  >
                    <BarChart data={distribution} accessibilityLayer>
                      <CartesianGrid vertical={false} strokeDasharray="3 5" />
                      <XAxis
                        dataKey="grade"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                      />
                      <YAxis
                        width={30}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="count"
                        fill="var(--color-count)"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={48}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <EmptyTrend>
                    Your grade distribution will appear as you add results.
                  </EmptyTrend>
                )}
              </TabsContent>
            </Tabs>
            <p className="mt-4 border-t pt-3 text-[11px] leading-5 text-muted-foreground">
              Grade trends are weighted by course credits. Your overall average
              follows your grading preferences.
            </p>
          </CardContent>
        </Card>
      </div>
      <section
        aria-labelledby="program-courses-title"
        className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:px-6">
          <div>
            <h2
              id="program-courses-title"
              className="text-base font-semibold tracking-tight"
            >
              Program courses
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Open a course for details and notes.
            </p>
          </div>
          <CourseForm program={program} />
        </div>
        {programCourses.length ? (
          <CourseTable
            columns={columns}
            data={programCourses}
            getRowHref={(course) => `/app/courses/${course.id}`}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 border-t px-6 py-12 text-center">
            <GraduationCap
              aria-hidden="true"
              className="size-7 text-teal-700 dark:text-teal-400"
            />
            <p className="text-sm font-medium">No courses added</p>
            <p className="text-xs text-muted-foreground">
              Add a course using the button above to start tracking this
              program.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
