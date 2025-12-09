"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import type { StudyProgram } from "@/types/study-program";
import { useData } from "@/lib/data-provider";
import { ProgramForm } from "./program-form";
import { CourseTable } from "./courses";
import { columns } from "./columns";
import { CourseForm } from "./course-form";
import CenteredSpinner from "@/components/ui/centered-spinner";
import { CircularProgress } from "@/components/customized/progress/progress-08";
import { Button } from "@/components/ui/button";
import { IconPlus, IconMinus } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export default function StudyDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { studyPrograms, courses, loading, preferences } = useData();

  const program = useMemo(
    () => studyPrograms.find((p) => p.id === params.id),
    [studyPrograms, params.id]
  ) as StudyProgram | undefined;

  const programCourses = useMemo(
    () => courses.filter((c) => c.program_id === params.id),
    [courses, params.id]
  );

  const currentCredits = useMemo(
    () =>
      programCourses
        .filter(
          (course) =>
            course.grade !== null &&
            course.credits > 0 &&
            course.finished
        )
        .reduce((sum, course) => sum + course.credits, 0),
    [programCourses]
  );

  const progressPercent = useMemo(() => {
    if (!program?.credits || program.credits <= 0) return 0;
    const ratio = (currentCredits / program.credits) * 100;
    return Math.min(100, Math.max(0, Math.round(ratio)));
  }, [program, currentCredits]);

  const averageGrade = useMemo(() => {
    if (loading) return null; // wait until data (including preferences) is loaded
    if (!preferences) return null;
    if (programCourses.length === 0) return 0;
    const relevantCourses = programCourses.filter(
      (course) =>
        course.grade !== null &&
        course.credits > 0 &&
        (preferences.grade_include_failed
          ? true
          : course.grade != null && course.grade <= preferences.grade_passed)
    );

    const totalWeightedGrades = relevantCourses.reduce(
      (sum, course) => sum + course.grade! * course.credits,
      0
    );
    const totalCredits = relevantCourses.reduce(
      (sum, course) => sum + course.credits,
      0
    );
    if (totalCredits === 0) return 0;
    return totalWeightedGrades / totalCredits;
  }, [programCourses, preferences, loading]);

  const gradeBySemester = useMemo(() => {
    const bySem = new Map<number, { sum: number; credits: number }>();
    programCourses.forEach((course) => {
      if (
        course.grade === null ||
        course.grade === undefined ||
        !course.semesters ||
        course.credits <= 0
      ) {
        return;
      }
      const current = bySem.get(course.semesters) || { sum: 0, credits: 0 };
      current.sum += course.grade * course.credits;
      current.credits += course.credits;
      bySem.set(course.semesters, current);
    });

    return Array.from(bySem.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([semester, { sum, credits }]) => ({
        semester,
        average: credits > 0 ? Number((sum / credits).toFixed(2)) : null,
      }));
  }, [programCourses]);

  const gradeDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    programCourses.forEach((course) => {
      if (course.grade === null || course.grade === undefined) return;
      const key = course.grade.toFixed(1);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => Number(a.grade) - Number(b.grade));
  }, [programCourses]);

  const gradeBySemesterConfig: ChartConfig = {
    average: {
      label: "Avg grade",
      color: "var(--chart-color)",
    },
  };

  const gradeDistributionConfig: ChartConfig = {
    count: {
      label: "Courses",
      color: "var(--chart-color)",
    },
  };

  if (loading) {
    return <CenteredSpinner />;
  }

  if (!program) {
    return null; // render nothing while redirecting
  }

  if (currentCredits >= program.credits && !program.finished) {
    toast.success(
      `Congratulations! You have completed the required credits for the program "${program.name}".`
    );
    const updateProgram = async () => {
      const supabase = createClient();
      const { data: userResult, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userResult.user) {
        toast.error("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("study_programs")
        .update({ finished: true })
        .eq("user_id", userResult.user.id)
        .eq("id", program!.id);

      if (error) {
        toast.error(error.message ?? "Failed to update program status");
        return;
      }
    };
    updateProgram();
  }

  if (currentCredits < program.credits && program.finished) {
    const updateProgram = async () => {
      const supabase = createClient();
      const { data: userResult, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userResult.user) {
        toast.error("Not authenticated");
        return;
      }

      await supabase
        .from("study_programs")
        .update({ finished: false })
        .eq("user_id", userResult.user.id)
        .eq("id", program!.id);

    };
    updateProgram();
  }

  const updateSemester = async (newSemester: number) => {
    const supabase = createClient();
    const { data: userResult, error: userError } =
      await supabase.auth.getUser();
    if (userError || !userResult.user) {
      toast.error("Not authenticated");
      return;
    }

    const { error } = await supabase
      .from("study_programs")
      .update({ current_semester: newSemester })
      .eq("user_id", userResult.user.id)
      .eq("id", program.id);

    if (error) {
      toast.error(error.message ?? "Failed to update semester");
      return;
    }

    router.refresh();
  };

  const increaseSemester = () => {
    if (program.current_semester < program.semesters) {
      updateSemester(program.current_semester + 1);
      toast.success("Yay, you advanced a semester!");
    }
  };

  const decreaseSemester = () => {
    if (program.current_semester > 1) {
      updateSemester(program.current_semester - 1);
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{program.degree}</p>
          <h1 className="text-2xl font-semibold leading-tight">
            {program.name}
          </h1>
          <p className="text-sm text-muted-foreground">{program.institution}</p>
        </div>
        <ProgramForm program={program} />
      </div>
      <div className="grid gap-3 grid-cols-3">
        <div className="rounded-md border p-3 text-sm">
          <p className="text-muted-foreground">Semester</p>
          <div className="flex">
            <p className="font-medium">
              {program.current_semester + "/" + program.semesters}
            </p>
            <span className="w-full"></span>
            <div className=" flex gap-2">
              <Button
                onClick={decreaseSemester}
                className="size-7"
                variant="outline"
                disabled={program.current_semester <= 1}
              >
                <IconMinus />
              </Button>
              <Button
                onClick={increaseSemester}
                className="size-7"
                variant="outline"
                disabled={program.current_semester >= program.semesters}
              >
                <IconPlus />
              </Button>
            </div>
          </div>
        </div>
        <Info label="Credits (total)" value={program.credits} />
        <Info label="Finished" value={program.finished ? "Yes" : "No"} />
      </div>
      <div className="rounded-md border p-3 text-sm">
        <p className="text-muted-foreground">Progress</p>
        <div className=" grid grid-cols-2">
          <CircularProgress
            value={progressPercent}
            size={120}
            strokeWidth={10}
            showLabel
            renderLabel={(v) => `${v}%`}
            labelClassName="text-xl font-bold"
            className={progressPercent < 100 ? "stroke-orange-500/25" : "stroke-green-500/25"}
            progressClassName={progressPercent < 100 ? "stroke-orange-700" : "stroke-green-700"}
          />
          <div className="flex items-center justify-center">
            <p className="text-xl font-semibold border rounded-xl p-5 text-center">
              {" "}
              {currentCredits} / {program.credits} Credits
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-md border p-3 text-sm">
        <p className="text-muted-foreground">Grade</p>
        <p className="text-center p-3 align-middle text-2xl font-semibold flex items-center justify-center">
          {averageGrade?.toFixed(2)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-full bg-black/0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>Average grade per semester</CardTitle>
            <CardDescription>Weighted by credits</CardDescription>
          </CardHeader>
          <CardContent>
            {gradeBySemester.length === 0 ? (
              <p className="text-sm text-muted-foreground">No graded courses yet.</p>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[320px]">
                  <ChartContainer
                    config={gradeBySemesterConfig}
                    className="w-full h-[260px]"
                  >
                    <LineChart data={gradeBySemester}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="semester"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        domain={[1, 5]}
                        tickCount={5}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke="var(--color-average)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "var(--color-average)" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full bg-black/0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>Grade distribution</CardTitle>
            <CardDescription>Count of graded courses</CardDescription>
          </CardHeader>
          <CardContent>
            {gradeDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No grades recorded yet.</p>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[320px]">
                  <ChartContainer
                    config={gradeDistributionConfig}
                    className="w-full h-[260px] "
                  >
                    <BarChart data={gradeDistribution}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="grade"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="count"
                        fill="var(--color-count)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {program.description && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Description</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {program.description}
          </p>
        </div>
      )}
      <hr />
      <div className="flex">
        <h1 className="text-xl font-semibold w-full">Courses</h1>
        <CourseForm program={program} />
      </div>
      <CourseTable
        columns={columns}
        data={programCourses}
        getRowHref={(course) => `/app/courses/${course.id}`}
      />
    </div>
  );
}
