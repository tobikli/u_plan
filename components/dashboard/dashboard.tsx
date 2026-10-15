"use client";
import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  GraduationCap,
  Plus,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatStudyPeriod, getStudyPeriodLabel } from "@/lib/study-period";
import type { Course } from "@/types/course";
import type { StudyProgram } from "@/types/study-program";
import type { Preferences } from "@/types/preferences";
type DashboardProps = {
  courses: Course[];
  studyPrograms: StudyProgram[];
  preferences: Preferences | null;
};
const creditsConfig = {
  credits: { label: "Credits added", color: "var(--study-accent)" },
} satisfies ChartConfig;
const gradesConfig = {
  grade: { label: "Average grade", color: "var(--study-accent)" },
  count: { label: "Courses", color: "var(--study-accent)" },
} satisfies ChartConfig;
const progressConfig = {
  value: { label: "Progress", color: "var(--study-accent)" },
} satisfies ChartConfig;
function EmptyChart({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/20 px-6 text-center text-sm leading-6 text-muted-foreground">
      <ChartNoAxesCombined aria-hidden="true" className="size-6 opacity-50" />
      {children}
    </div>
  );
}
function ProgressRing({
  value,
  label,
  detail,
}: {
  value: number;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <div className="relative size-24 shrink-0">
        <ChartContainer
          config={progressConfig}
          className="size-24 aspect-square"
          aria-label={label + ": " + value + "%"}
        >
          <RadialBarChart
            data={[{ value, fill: "var(--color-value)" }]}
            innerRadius="76%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            barSize={8}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              background
              isAnimationActive={false}
            />
          </RadialBarChart>
        </ChartContainer>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl font-semibold tracking-tight">
          {value}
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">
            %
          </span>
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-medium">{label}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
export function Dashboard({
  courses,
  studyPrograms,
  preferences,
}: DashboardProps) {
  const studyPeriod = getStudyPeriodLabel(preferences);
  const gradeBounds = useMemo(() => {
    const min = preferences?.grade_min ?? 1;
    const max = preferences?.grade_max ?? 5;
    const lowerIsBetter = min < max;
    return {
      min,
      max,
      lowerIsBetter,
    };
  }, [preferences]);

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const totalPrograms = studyPrograms.length;
    const creditsPlanned = courses.reduce(
      (sum, c) => sum + (c.credits || 0),
      0,
    );
    const creditsEarned = courses
      .filter((c) => c.finished)
      .reduce((sum, c) => sum + (c.credits || 0), 0);
    const gradedCourses = courses.filter((c) => typeof c.grade === "number");
    const avgGrade = gradedCourses.length
      ? gradedCourses.reduce((sum, c) => sum + (c.grade || 0), 0) /
        gradedCourses.length
      : null;

    return {
      totalCourses,
      totalPrograms,
      creditsPlanned,
      creditsEarned,
      avgGrade,
    };
  }, [courses, studyPrograms]);

  const programProgress = useMemo(() => {
    if (!studyPrograms.length) return [];
    return studyPrograms.map((p) => {
      const programCourses = courses.filter((c) => c.program_id === p.id);
      const earned = programCourses
        .filter((c) => c.finished)
        .reduce((sum, c) => sum + (c.credits || 0), 0);
      const planned =
        programCourses.reduce((sum, c) => sum + (c.credits || 0), 0) ||
        p.credits ||
        0;
      const completion = planned
        ? Math.min(100, Math.round((earned / planned) * 100))
        : 0;
      return {
        id: p.id,
        name: p.name,
        degree: p.degree,
        currentPeriod: p.current_semester,
        planned,
        completion,
        credits: earned,
      };
    });
  }, [courses, studyPrograms]);

  const creditsOverTime = useMemo(() => {
    const timeline = new Map<string, number>();
    courses.forEach((course) => {
      const date = new Date(course.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}`;
      timeline.set(key, (timeline.get(key) || 0) + (course.credits || 0));
    });
    const entries = Array.from(timeline.entries()).sort(([a], [b]) =>
      a > b ? 1 : -1,
    );
    return entries.map(([month, credits]) => ({ month, credits }));
  }, [courses]);

  const gradeBands = useMemo(() => {
    const { min, max } = gradeBounds;
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    const start = Math.floor(lo);
    const end = Math.max(start + 1, Math.ceil(hi));
    const buckets: { label: string; count: number }[] = [];

    for (let g = start; g < end; g++) {
      buckets.push({
        label: `${g.toFixed(1)}-${(g + 1).toFixed(1)}`,
        count: 0,
      });
    }

    courses.forEach((c) => {
      if (typeof c.grade !== "number") return;
      const g = Math.min(hi, Math.max(lo, c.grade));
      const idx = Math.min(
        buckets.length - 1,
        Math.max(0, Math.floor(g - start)),
      );
      buckets[idx].count += 1;
    });

    return buckets;
  }, [courses, gradeBounds]);

  const completionRate = useMemo(() => {
    const completed = courses.filter((c) => c.finished).length;
    return courses.length ? Math.round((completed / courses.length) * 100) : 0;
  }, [courses]);

  const gradeBySemester = useMemo(() => {
    const buckets = new Map<number, { sum: number; count: number }>();
    courses.forEach((c) => {
      if (typeof c.grade !== "number") return;
      const sem = c.semesters || 1;
      const entry = buckets.get(sem) ?? { sum: 0, count: 0 };
      entry.sum += c.grade;
      entry.count += 1;
      buckets.set(sem, entry);
    });
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([semester, { sum, count }]) => ({
        semester: formatStudyPeriod(preferences, semester, { compact: true }),
        grade: count ? Number((sum / count).toFixed(2)) : 0,
      }));
  }, [courses, preferences]);

  const creditsRatio = useMemo(() => {
    const planned = stats.creditsPlanned || 0;
    const earned = stats.creditsEarned || 0;
    return planned ? Math.min(100, Math.round((earned / planned) * 100)) : 0;
  }, [stats.creditsEarned, stats.creditsPlanned]);

  const completedCourses = courses.filter((course) => course.finished).length;
  const gradedCount = courses.filter(
    (course) => typeof course.grade === "number",
  ).length;
  const bestBand = (
    gradeBounds.lowerIsBetter ? gradeBands : [...gradeBands].reverse()
  ).find((band) => band.count > 0)?.label;
  const recentCourses = [...courses]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 4);
  const summary = [
    {
      label: "Programs",
      value: stats.totalPrograms,
      detail: "Study tracks",
      icon: GraduationCap,
      href: "/app/programs",
    },
    {
      label: "Courses",
      value: stats.totalCourses,
      detail: "Across your programs",
      icon: BookOpen,
      href: "/app/courses",
    },
    {
      label: "Credits planned",
      value: stats.creditsPlanned,
      detail: "ECTS in your courses",
      icon: ChartNoAxesCombined,
    },
    {
      label: "Average grade",
      value: stats.avgGrade !== null ? stats.avgGrade.toFixed(2) : "—",
      detail: gradedCount
        ? `${gradedCount} graded ${gradedCount === 1 ? "course" : "courses"} · unweighted`
        : "No grades recorded yet",
      icon: Check,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-5 sm:space-y-8 sm:p-8 lg:p-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Review your programs, credits, grades, and course completion.
          </p>
        </div>
        <Button asChild className="w-fit shrink-0">
          <Link href={studyPrograms.length ? "/app/courses" : "/app/programs"}>
            <Plus aria-hidden="true" />
            {studyPrograms.length ? "Manage courses" : "Add your first program"}
          </Link>
        </Button>
      </div>

      <section
        aria-label="Study summary"
        className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card shadow-xs lg:grid-cols-4"
      >
        {summary.map(({ label, value, detail, icon: Icon, href }, index) => (
          <div
            key={label}
            className={`min-w-0 p-4 sm:p-5 ${index % 2 ? "border-l" : ""} ${index > 1 ? "border-t lg:border-t-0 lg:border-l" : ""}`}
          >
            <div className="flex items-center justify-between gap-2 text-muted-foreground">
              <p className="text-xs">{label}</p>
              <Icon aria-hidden="true" className="size-4 shrink-0 opacity-70" />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
              {href ? (
                <Link
                  href={href}
                  className="transition-colors hover:text-teal-700 dark:hover:text-teal-400"
                >
                  {value}
                  <span className="sr-only"> {label}</span>
                </Link>
              ) : (
                value
              )}
            </p>
            <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
              {detail}
            </p>
          </div>
        ))}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-12">
        <Card className="min-w-0 gap-5 shadow-xs xl:col-span-8">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base tracking-tight">
                  Credits over time
                </CardTitle>
                <CardDescription className="mt-1.5">
                  ECTS from courses added each month
                </CardDescription>
              </div>
              <Badge variant="outline" className="gap-1.5 font-normal">
                <span className="size-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                Study activity
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                {stats.creditsEarned}
              </span>
              <span className="text-xs text-muted-foreground">
                ECTS earned of {stats.creditsPlanned} planned
              </span>
            </div>
            {creditsOverTime.length ? (
              <ChartContainer
                config={creditsConfig}
                className="h-52 w-full aspect-auto"
                aria-label="Credits added by month"
              >
                <AreaChart
                  data={creditsOverTime}
                  margin={{ left: -15, right: 10, top: 12 }}
                  accessibilityLayer
                >
                  <defs>
                    <linearGradient
                      id="dashboard-credit-fill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--color-credits)"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-credits)"
                        stopOpacity={0.01}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 5" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    minTickGap={25}
                    tickFormatter={(month: string) =>
                      new Date(`${month}-01T00:00:00`).toLocaleDateString(
                        "en",
                        { month: "short", year: "2-digit" },
                      )
                    }
                  />
                  <YAxis
                    width={40}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="credits"
                    stroke="var(--color-credits)"
                    strokeWidth={2.5}
                    fill="url(#dashboard-credit-fill)"
                    dot={{ r: 3, fill: "var(--color-credits)", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyChart>
                Add courses with credits to start your timeline.
              </EmptyChart>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-3 border-teal-600/15 bg-linear-to-br from-teal-600/[0.06] to-card shadow-xs dark:border-teal-400/15 xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-base tracking-tight">
              Study progress
            </CardTitle>
            <CardDescription>
              Course completion and earned credits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProgressRing
              value={completionRate}
              label="Courses completed"
              detail={`${completedCourses} of ${courses.length} marked finished`}
            />
            <div className="border-t border-teal-600/10 dark:border-teal-400/10" />
            <ProgressRing
              value={creditsRatio}
              label="Credits earned"
              detail={`${stats.creditsEarned} of ${stats.creditsPlanned} tracked ECTS`}
            />
            <p className="pt-1 text-[11px] leading-5 text-muted-foreground">
              {courses.length
                ? "Based on the courses in your workspace."
                : "Add courses to calculate progress."}
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-4 shadow-xs xl:col-span-7">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base tracking-tight">
                  Grade analysis
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Grade trends and distribution
                </CardDescription>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                /01
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="trend" className="gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TabsList aria-label="Grade chart">
                  <TabsTrigger value="trend">Trend</TabsTrigger>
                  <TabsTrigger value="distribution">Distribution</TabsTrigger>
                </TabsList>
                <p className="text-[11px] text-muted-foreground">
                  Best range{" "}
                  <span className="ml-1 font-medium text-foreground">
                    {bestBand ?? "—"}
                  </span>
                </p>
              </div>
              <TabsContent value="trend">
                {gradedCount ? (
                  <ChartContainer
                    config={gradesConfig}
                    className="h-56 w-full aspect-auto"
                    aria-label={`Average grade by ${studyPeriod}`}
                  >
                    <LineChart
                      data={gradeBySemester}
                      margin={{ left: -12, right: 16, top: 15 }}
                      accessibilityLayer
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 5" />
                      <XAxis
                        dataKey="semester"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                      />
                      <YAxis
                        width={36}
                        axisLine={false}
                        tickLine={false}
                        domain={[
                          Math.min(gradeBounds.min, gradeBounds.max),
                          Math.max(gradeBounds.min, gradeBounds.max),
                        ]}
                        reversed={gradeBounds.lowerIsBetter}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Line
                        isAnimationActive={false}
                        type="monotone"
                        dataKey="grade"
                        stroke="var(--color-grade)"
                        strokeWidth={2.5}
                        dot={{
                          r: 4,
                          fill: "var(--color-grade)",
                          strokeWidth: 0,
                        }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <EmptyChart>
                    Record a course grade to see your {studyPeriod} trends.
                  </EmptyChart>
                )}
              </TabsContent>
              <TabsContent value="distribution">
                {gradedCount ? (
                  <ChartContainer
                    config={gradesConfig}
                    className="h-56 w-full aspect-auto"
                    aria-label="Number of courses in each grade range"
                  >
                    <BarChart
                      data={gradeBands}
                      margin={{ left: -12, right: 10, top: 15 }}
                      accessibilityLayer
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 5" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                        minTickGap={12}
                      />
                      <YAxis
                        width={36}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <ChartTooltip
                        cursor={{ fill: "var(--muted)" }}
                        content={<ChartTooltipContent />}
                      />
                      <Bar
                        isAnimationActive={false}
                        dataKey="count"
                        fill="var(--color-count)"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <EmptyChart>
                    Your grade distribution will appear as you add grades.
                  </EmptyChart>
                )}
              </TabsContent>
            </Tabs>
            <p className="mt-3 border-t pt-3 text-[11px] text-muted-foreground">
              {gradedCount
                ? `Averages across courses · ${getStudyPeriodLabel(preferences, { plural: true })} follow your study settings`
                : "Your grading scale can be personalized in Settings."}
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-4 shadow-xs xl:col-span-5">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base tracking-tight">
                  Your programs
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Credits earned within each study track
                </CardDescription>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                /02
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {programProgress.length ? (
              <div className="max-h-72 space-y-1 overflow-y-auto">
                {programProgress.map((program) => (
                  <Link
                    key={program.id}
                    href={`/app/programs/${program.id}`}
                    className="group block rounded-lg p-3 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 rounded-lg border bg-muted/30 p-2">
                          <GraduationCap
                            aria-hidden="true"
                            className="size-4 text-teal-700 dark:text-teal-400"
                          />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium break-words">
                            {program.name}
                          </h3>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {program.degree} ·{" "}
                            {formatStudyPeriod(
                              preferences,
                              program.currentPeriod,
                              { capitalized: true },
                            )}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-2 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                    <div className="mt-4 flex justify-between gap-2 text-[11px]">
                      <span className="text-muted-foreground">
                        {program.credits} / {program.planned} tracked ECTS
                      </span>
                      <span className="font-medium tabular-nums">
                        {program.completion}%
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`${program.name} tracked credits completed`}
                      aria-valuenow={program.completion}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full rounded-full bg-teal-600 dark:bg-teal-400"
                        style={{ width: `${program.completion}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-5 text-center">
                <GraduationCap
                  aria-hidden="true"
                  className="size-7 text-teal-700 dark:text-teal-400"
                />
                <h3 className="text-sm font-medium">No study programs</h3>
                <p className="text-xs leading-5 text-muted-foreground">
                  Add a program, then connect your courses to it.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/programs">
                    Add a program <Plus aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            )}
            <div className="mt-4 border-t pt-3">
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/app/programs">
                  All programs <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="recent-courses-title" className="pb-2">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2
              id="recent-courses-title"
              className="mt-1 text-lg font-semibold tracking-tight"
            >
              Recently added courses
            </h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/app/courses">
              View all <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        {recentCourses.length ? (
          <div className="divide-y rounded-xl border bg-card">
            {recentCourses.map((course) => (
              <Link
                key={course.id}
                href={`/app/courses/${course.id}`}
                className="group flex items-center gap-3 px-4 py-4 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/40 sm:gap-4 sm:px-5"
              >
                <span className="hidden rounded-lg border bg-muted/30 p-2.5 sm:block">
                  <BookOpen
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium">
                    {course.name}
                  </h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {course.course_code}
                    {course.course_code ? " · " : ""}
                    {studyPrograms.find(
                      (program) => program.id === course.program_id,
                    )?.name ?? "Course notes & details"}
                  </p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {course.credits} ECTS
                </span>
                <Badge
                  variant={course.finished ? "secondary" : "outline"}
                  className="text-[10px] font-normal"
                >
                  {course.finished ? "Completed" : "In progress"}
                </Badge>
                <ArrowRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
            Your courses will appear here.{" "}
            <Link
              href={studyPrograms.length ? "/app/courses" : "/app/programs"}
              className="font-medium text-teal-700 underline underline-offset-4 dark:text-teal-400"
            >
              {studyPrograms.length
                ? "Add your first course"
                : "Start with a program"}{" "}
              <ArrowRight aria-hidden="true" className="inline size-3" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
