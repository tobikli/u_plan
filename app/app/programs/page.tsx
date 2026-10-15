"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, Building2, BookOpen } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  OverviewHeader,
  OverviewStats,
  OverviewLoading,
} from "@/components/workspace/overview";
import { StudyForm } from "./study-form";
import { useData } from "@/lib/data-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatStudyPeriod } from "@/lib/study-period";

export default function Page() {
  const { studyPrograms, courses, loading, preferences, error } = useData();
  if (loading) return <OverviewLoading />;
  const sortedPrograms = [...studyPrograms].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );
  const earned = courses
    .filter((course) => course.finished)
    .reduce((sum, course) => sum + (course.credits || 0), 0);
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-5 sm:space-y-8 sm:p-8 lg:p-10">
      <OverviewHeader
        title="Study programs"
        description="Your degrees and study tracks, with the courses and credits that bring them to life."
        action={<StudyForm />}
      />
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          Some study data could not be loaded. Please refresh to try again.
        </p>
      )}
      <OverviewStats
        items={[
          {
            label: "Programs",
            value: studyPrograms.length,
            detail: "All your study tracks",
          },
          {
            label: "In progress",
            value: studyPrograms.filter((p) => !p.finished).length,
            detail: "Programs you’re working on",
          },
          {
            label: "Courses",
            value: courses.length,
            detail: "Across your workspace",
          },
          {
            label: "Credits earned",
            value: earned,
            detail: "ECTS from completed courses",
          },
        ]}
      />
      <section aria-labelledby="programs-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2
              id="programs-title"
              className="mt-1 text-lg font-semibold tracking-tight"
            >
              Your study programs
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">Newest first</span>
        </div>
        {sortedPrograms.length ? (
          <div className="grid items-start gap-5 lg:grid-cols-2">
            {sortedPrograms.map((program) => {
              const programCourses = courses.filter(
                (course) => course.program_id === program.id,
              );
              const credits = programCourses
                .filter((course) => course.finished)
                .reduce((sum, course) => sum + (course.credits || 0), 0);
              const progress =
                program.credits > 0
                  ? Math.min(100, Math.round((credits / program.credits) * 100))
                  : 0;
              return (
                <Link
                  key={program.id}
                  href={`/app/programs/${program.id}`}
                  className="group block min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="h-full gap-5 shadow-xs transition-colors group-hover:border-foreground/25">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-xl border bg-muted/30 p-3">
                          <GraduationCap
                            aria-hidden="true"
                            className="size-5 text-teal-700 dark:text-teal-400"
                          />
                        </span>
                        <Badge variant="secondary" className="font-normal">
                          {program.finished ? "Completed" : "In progress"}
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {program.degree}
                        </p>
                        <h3 className="mt-1 text-xl font-semibold tracking-tight break-words">
                          {program.name}
                        </h3>
                        {program.institution && (
                          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Building2
                              aria-hidden="true"
                              className="mt-0.5 size-3.5 shrink-0"
                            />
                            <span className="break-words">
                              {program.institution}
                            </span>
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {program.description && (
                        <p className="mb-5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {program.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <BookOpen aria-hidden="true" className="size-3.5" />
                          {programCourses.length}{" "}
                          {programCourses.length === 1 ? "course" : "courses"}
                        </span>
                        <span>
                          {formatStudyPeriod(
                            preferences,
                            program.current_semester,
                            { capitalized: true },
                          )}{" "}
                          of {program.semesters}
                        </span>
                      </div>
                      <div className="mt-5 rounded-lg bg-muted/30 p-3.5">
                        <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs">
                          <span className="text-muted-foreground">
                            Degree credits
                          </span>
                          <span className="font-medium tabular-nums">
                            {credits} / {program.credits} ECTS
                          </span>
                        </div>
                        <div
                          role="progressbar"
                          aria-label={`${program.name} degree credit progress`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={progress}
                          className="h-1.5 overflow-hidden rounded-full bg-muted"
                        >
                          <div
                            className="h-full rounded-full bg-teal-600 dark:bg-teal-400"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs">
                        <span className="text-muted-foreground">
                          View program & courses
                        </span>
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 transition-transform group-hover:translate-x-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Empty className="min-h-80 rounded-xl border border-dashed bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GraduationCap />
              </EmptyMedia>
              <EmptyTitle>No study programs</EmptyTitle>
              <EmptyDescription>
                Add your first program, set a credit goal, and start connecting
                your courses.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <StudyForm />
            </EmptyContent>
          </Empty>
        )}
      </section>
    </div>
  );
}
