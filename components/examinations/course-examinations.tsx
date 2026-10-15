"use client";

import { CalendarDays, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/lib/data-provider";
import {
  formatExamDate,
  formatGrade,
  localDateKey,
  summarizeExaminations,
} from "@/lib/examinations";
import { ExaminationForm } from "./examination-form";
import type { Course } from "@/types/course";

export function CourseExaminations({ course }: { course: Course }) {
  const { examinations } = useData();
  const courseExams = examinations
    .filter((exam) => exam.course_id === course.id)
    .sort(
      (a, b) =>
        (a.exam_date ?? "9999").localeCompare(b.exam_date ?? "9999") ||
        a.created_at.localeCompare(b.created_at),
    );
  const summary = summarizeExaminations(courseExams);
  const coverage = summary.totalWeight
    ? Math.round((summary.gradedWeight / summary.totalWeight) * 100)
    : 0;
  const today = localDateKey();
  return (
    <section
      id="examinations"
      aria-labelledby="examinations-title"
      className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-xs"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:px-6">
        <div>
          <h2
            id="examinations-title"
            className="text-lg font-semibold tracking-tight"
          >
            Examinations
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Record examination dates, grades, and weights to calculate the
            course result.
          </p>
        </div>
        <ExaminationForm course={course} />
      </div>
      {courseExams.length ? (
        <>
          <div className="grid grid-cols-3 divide-x border-y bg-muted/15">
            <div className="min-w-0 p-4 sm:px-6">
              <p className="text-[11px] text-muted-foreground">
                Calculated grade
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatGrade(course.grade)}
              </p>
              {summary.provisional && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Provisional
                </p>
              )}
            </div>
            <div className="min-w-0 p-4 sm:px-6">
              <p className="text-[11px] text-muted-foreground">
                Results recorded
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {summary.gradedCount}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {summary.count}
                </span>
              </p>
            </div>
            <div className="min-w-0 p-4 sm:px-6">
              <p className="text-[11px] text-muted-foreground">Graded weight</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {coverage}%
              </p>
            </div>
          </div>
          <div className="divide-y">
            {courseExams.map((exam) => (
              <div
                key={exam.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6"
              >
                <div className="min-w-0 flex-1 basis-40">
                  <h3 className="text-sm font-medium break-words">
                    {exam.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays aria-hidden="true" className="size-3" />
                    {formatExamDate(exam.exam_date)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {formatGrade(exam.grade)}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Weight {exam.weight} ·{" "}
                      {Number(
                        ((exam.weight / summary.totalWeight) * 100).toFixed(1),
                      )}
                      %
                    </p>
                  </div>
                  <Badge
                    variant={exam.grade !== null ? "secondary" : "outline"}
                    className="text-[10px] font-normal"
                  >
                    {exam.grade !== null
                      ? "Graded"
                      : exam.exam_date && exam.exam_date < today
                        ? "Result pending"
                        : exam.exam_date
                          ? "Scheduled"
                          : "Not scheduled"}
                  </Badge>
                  <ExaminationForm course={course} examination={exam} />
                </div>
              </div>
            ))}
          </div>
          <p className="border-t bg-muted/15 px-5 py-3 text-[11px] leading-5 text-muted-foreground sm:px-6">
            Course grade = sum of graded results × their weights, divided by the
            total graded weight. Missing results make the grade provisional.
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 border-t px-5 py-9 text-center">
          <ClipboardList
            aria-hidden="true"
            className="size-7 text-muted-foreground"
          />
          <p className="text-sm font-medium">No examinations added</p>
          <p className="max-w-lg text-xs leading-6 text-muted-foreground">
            Add an examination and record its result to calculate the course
            grade. Courses without graded examinations have no grade.
          </p>
        </div>
      )}
    </section>
  );
}
