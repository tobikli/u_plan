"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  LoaderCircle,
} from "lucide-react";
import { useData } from "@/lib/data-provider";
import { createClient } from "@/lib/supabase/client";
import { formatStudyPeriod, getStudyPeriodLabel } from "@/lib/study-period";
import {
  formatExamDate,
  formatGrade,
  localDateKey,
  summarizeExaminations,
} from "@/lib/examinations";
import {
  OverviewHeader,
  OverviewLoading,
} from "@/components/workspace/overview";
import { ExaminationForm } from "@/components/examinations/examination-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function SemesterPage() {
  const {
    studyPrograms,
    courses,
    examinations,
    preferences,
    loading,
    error,
    refreshPreferences,
  } = useData();
  const [pendingProgram, setPendingProgram] = useState<string | null>(null);
  const selectedId = pendingProgram ?? preferences?.semester_program_id ?? "";
  const program = studyPrograms.find((program) => program.id === selectedId);
  const studyPeriod = getStudyPeriodLabel(preferences, { capitalized: true });
  const periodCourses = program
    ? courses
        .filter(
          (course) =>
            course.program_id === program.id &&
            course.semesters === program.current_semester,
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];
  const courseIds = new Set(periodCourses.map((course) => course.id));
  const periodExams = examinations.filter((exam) =>
    courseIds.has(exam.course_id),
  );
  const completed = periodCourses.filter((course) => course.finished);
  const plannedCredits = periodCourses.reduce(
    (sum, course) => sum + (course.credits || 0),
    0,
  );
  const earnedCredits = completed.reduce(
    (sum, course) => sum + (course.credits || 0),
    0,
  );
  const upcoming = periodExams
    .filter(
      (exam) =>
        exam.grade === null &&
        exam.exam_date !== null &&
        exam.exam_date >= localDateKey(),
    )
    .sort((a, b) => a.exam_date!.localeCompare(b.exam_date!));
  const selectProgram = async (id: string) => {
    if (pendingProgram !== null) return;
    setPendingProgram(id);
    try {
      const client = createClient();
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser();
      if (authError || !user) {
        toast.error("Please log in again to save your program selection");
        return;
      }
      const { error } = await client
        .from("preferences")
        .upsert(
          { user_id: user.id, semester_program_id: id },
          { onConflict: "user_id" },
        );
      if (error) {
        toast.error(error.message);
        return;
      }
      await refreshPreferences();
      toast.success("Program selection saved");
    } catch {
      toast.error("Could not save your program selection. Please try again.");
    } finally {
      setPendingProgram(null);
    }
  };
  if (loading) return <OverviewLoading />;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-5 sm:space-y-8 sm:p-8 lg:p-10">
      <OverviewHeader
        title={`${studyPeriod} overview`}
        description={`Courses, completion, credits, and examinations for your program’s current ${studyPeriod.toLowerCase()}.`}
        action={
          program ? (
            <Button asChild variant="outline">
              <Link href={`/app/programs/${program.id}`}>
                Manage program <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/app/programs">
                Study programs <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          )
        }
      />
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          Some study data could not be loaded. Refresh the page to try again.
        </p>
      )}
      <div className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-5 shadow-xs sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <Label htmlFor="semester-program">Study program</Label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Your selection is saved to your account. The study period follows
            the program’s current setting.
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-72">
          <Select
            value={program?.id ?? ""}
            onValueChange={(id) => void selectProgram(id)}
            disabled={pendingProgram !== null || !studyPrograms.length}
          >
            <SelectTrigger id="semester-program" className="w-full min-w-0">
              <SelectValue
                placeholder={
                  studyPrograms.length
                    ? "Choose a program"
                    : "No programs available"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {studyPrograms.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.degree} · {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pendingProgram !== null && (
            <span
              role="status"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <LoaderCircle
                aria-hidden="true"
                className="size-3 animate-spin"
              />
              Saving selection…
            </span>
          )}
        </div>
      </div>
      {!program ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <GraduationCap
            aria-hidden="true"
            className="size-8 text-muted-foreground"
          />
          <h2 className="text-lg font-semibold">
            {studyPrograms.length
              ? "Select a study program"
              : "No study programs"}
          </h2>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            {studyPrograms.length
              ? "Choose a program above to view its current study period and examinations."
              : "Create a program and add courses to begin using the semester overview."}
          </p>
          {!studyPrograms.length && (
            <Button asChild variant="outline">
              <Link href="/app/programs">Add a program</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <section
            aria-label="Semester progress"
            className="overflow-hidden rounded-2xl border bg-card shadow-xs"
          >
            <div className="grid lg:grid-cols-[1.4fr_1fr]">
              <div className="relative overflow-hidden bg-muted/30 p-6 sm:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border-[40px] border-teal-600/5"
                />
                <Badge
                  variant="outline"
                  className="relative bg-background/70 font-normal"
                >
                  {formatStudyPeriod(preferences, program.current_semester, {
                    capitalized: true,
                  })}{" "}
                  of {program.semesters}
                </Badge>
                <h2 className="relative mt-5 text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                  {program.name}
                </h2>
                <p className="relative mt-2 text-sm text-muted-foreground">
                  {program.degree}
                  {program.institution ? ` · ${program.institution}` : ""}
                </p>
                <div className="relative mt-8 flex items-center justify-between gap-4 text-xs">
                  <span className="font-medium">Course completion</span>
                  <span className="tabular-nums text-muted-foreground">
                    {completed.length} of {periodCourses.length}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Course completion"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={
                    periodCourses.length
                      ? Math.round(
                          (completed.length / periodCourses.length) * 100,
                        )
                      : 0
                  }
                  className="relative mt-3 h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-teal-600 transition-all dark:bg-teal-400"
                    style={{
                      width: `${periodCourses.length ? (completed.length / periodCourses.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 border-t lg:border-t-0 lg:border-l">
                <div className="col-span-2 flex items-center gap-6 border-b p-6 sm:p-8">
                  <div className="relative grid size-28 shrink-0 place-items-center">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 120 120"
                      className="absolute inset-0 size-full -rotate-90"
                    >
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        fill="none"
                        strokeWidth="7"
                        className="stroke-muted"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        fill="none"
                        strokeWidth="7"
                        strokeLinecap="round"
                        pathLength="100"
                        strokeDasharray="100"
                        strokeDashoffset={
                          100 -
                          (plannedCredits
                            ? Math.min(
                                100,
                                (earnedCredits / plannedCredits) * 100,
                              )
                            : 0)
                        }
                        className="stroke-teal-600 dark:stroke-teal-400"
                      />
                    </svg>
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                      {plannedCredits
                        ? Math.round((earnedCredits / plannedCredits) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ECTS earned</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                      {earnedCredits}
                      <span className="text-base font-normal text-muted-foreground">
                        {" "}
                        / {plannedCredits}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Planned this {studyPeriod.toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="border-r p-5 sm:px-8">
                  <p className="text-xs text-muted-foreground">
                    Courses remaining
                  </p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {periodCourses.length - completed.length}
                  </p>
                </div>
                <div className="p-5 sm:px-8">
                  <p className="text-xs text-muted-foreground">
                    Examination results
                  </p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {periodExams.filter((exam) => exam.grade !== null).length}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      / {periodExams.length}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>
          <div className="grid items-start gap-5 xl:grid-cols-12">
            <section
              aria-labelledby="semester-courses-title"
              className="min-w-0 space-y-4 xl:col-span-8"
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="semester-courses-title"
                  className="text-lg font-semibold tracking-tight"
                >
                  Courses this {studyPeriod.toLowerCase()}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {periodCourses.length} courses
                </span>
              </div>
              {periodCourses.length ? (
                periodCourses.map((course) => {
                  const exams = periodExams.filter(
                    (exam) => exam.course_id === course.id,
                  );
                  const summary = summarizeExaminations(exams);
                  return (
                    <Card
                      key={course.id}
                      className="min-w-0 gap-0 overflow-hidden py-0 shadow-xs transition-shadow hover:shadow-sm"
                    >
                      <div
                        className={`flex flex-wrap items-start justify-between gap-4 border-l-[3px] p-5 ${course.finished ? "border-l-teal-600 dark:border-l-teal-400" : "border-l-muted-foreground/25"}`}
                      >
                        <div className="min-w-0 flex-1 basis-44">
                          <Link
                            href={`/app/courses/${course.id}`}
                            className="text-base font-semibold tracking-tight break-words hover:underline hover:underline-offset-4"
                          >
                            {course.name}
                          </Link>
                          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                            {course.course_code}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                course.finished ? "secondary" : "outline"
                              }
                              className="text-[10px] font-normal"
                            >
                              {course.finished ? "Completed" : "In progress"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {course.credits} ECTS
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Grade{" "}
                              <span className="font-medium text-foreground">
                                {formatGrade(course.grade)}
                              </span>
                              {summary.provisional ? " (provisional)" : ""}
                            </span>
                          </div>
                        </div>
                        <ExaminationForm course={course} />
                      </div>
                      <div className="flex items-center gap-3 px-5 pb-4">
                        <div
                          aria-hidden="true"
                          className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
                        >
                          <div
                            className="h-full rounded-full bg-teal-600/70 dark:bg-teal-400/70"
                            style={{
                              width: `${summary.totalWeight ? (summary.gradedWeight / summary.totalWeight) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                          {summary.totalWeight
                            ? Math.round(
                                (summary.gradedWeight / summary.totalWeight) *
                                  100,
                              )
                            : 0}
                          % graded
                        </span>
                      </div>
                      <details className="group border-t">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-muted/15 px-5 py-3 text-xs text-muted-foreground [&::-webkit-details-marker]:hidden">
                          <span>
                            {exams.length} examinations · {summary.gradedCount}{" "}
                            results recorded
                          </span>
                          <ChevronDown
                            aria-hidden="true"
                            className="size-4 shrink-0 transition-transform group-open:rotate-180"
                          />
                        </summary>
                        <div className="divide-y">
                          {exams.length ? (
                            exams.map((exam) => (
                              <div
                                key={exam.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                              >
                                <div className="min-w-0 flex-1 basis-36">
                                  <p className="text-sm font-medium break-words">
                                    {exam.name}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {formatExamDate(exam.exam_date)} · Weight{" "}
                                    {exam.weight}
                                  </p>
                                </div>
                                <span className="text-sm font-medium tabular-nums">
                                  {formatGrade(exam.grade)}
                                </span>
                                <ExaminationForm
                                  course={course}
                                  examination={exam}
                                />
                              </div>
                            ))
                          ) : (
                            <p className="px-5 py-5 text-xs leading-5 text-muted-foreground">
                              No examinations added. Add an examination to
                              record dates, results, and grading weights.
                            </p>
                          )}
                        </div>
                      </details>
                    </Card>
                  );
                })
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card p-9 text-center">
                  <BookOpen
                    aria-hidden="true"
                    className="size-7 text-muted-foreground"
                  />
                  <h3 className="text-sm font-medium">
                    No courses in this {studyPeriod.toLowerCase()}
                  </h3>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Add courses to this program and assign them to{" "}
                    {formatStudyPeriod(preferences, program.current_semester)}.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/app/programs/${program.id}`}>
                      Manage courses
                    </Link>
                  </Button>
                </div>
              )}
            </section>
            <Card className="min-w-0 gap-4 shadow-xs xl:sticky xl:top-6 xl:col-span-4">
              <CardHeader>
                <CardTitle className="text-base tracking-tight">
                  Upcoming examinations
                </CardTitle>
                <CardDescription>
                  Scheduled examinations without a recorded result
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcoming.length ? (
                  <div className="space-y-4">
                    {upcoming.slice(0, 6).map((exam) => (
                      <Link
                        key={exam.id}
                        href={`/app/courses/${exam.course_id}#examinations`}
                        className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/40"
                      >
                        <span className="flex w-12 shrink-0 flex-col items-center overflow-hidden rounded-lg border bg-background text-center">
                          <span className="w-full bg-muted/60 py-1 text-[9px] font-medium uppercase tracking-wider">
                            {new Date(
                              exam.exam_date + "T00:00:00",
                            ).toLocaleDateString(undefined, { month: "short" })}
                          </span>
                          <span className="py-1 text-lg font-semibold tabular-nums">
                            {new Date(exam.exam_date + "T00:00:00").getDate()}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium break-words">
                            {exam.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatExamDate(exam.exam_date)}
                          </p>
                          <p className="mt-1 text-[11px] leading-5 text-muted-foreground break-words">
                            {
                              periodCourses.find(
                                (course) => course.id === exam.course_id,
                              )?.name
                            }
                          </p>
                        </div>
                      </Link>
                    ))}
                    {upcoming.length > 6 && (
                      <p className="text-xs text-muted-foreground">
                        {upcoming.length - 6} more scheduled examinations in
                        your course lists.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/15 px-4 py-7 text-center">
                    <CalendarDays
                      aria-hidden="true"
                      className="mx-auto mb-3 size-6 text-muted-foreground"
                    />
                    <p className="text-xs leading-5 text-muted-foreground">
                      No upcoming examinations scheduled for this{" "}
                      {studyPeriod.toLowerCase()}.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
