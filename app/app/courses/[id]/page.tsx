"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import type { StudyProgram } from "@/types/study-program";
import { useData } from "@/lib/data-provider";
import { CourseForm } from "./course-form";

import CenteredSpinner from "@/components/ui/centered-spinner";
import { Course } from "@/types/course";
import Link from "next/link";

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
  const { studyPrograms, courses, loading } = useData();

  const course = useMemo(
    () => courses.find((c) => c.id === params.id),
    [courses, params.id]
  ) as Course | undefined;

  const program = useMemo(
    () => studyPrograms.find((p) => p.id === course?.program_id),
    [studyPrograms, course?.program_id]
  ) as StudyProgram | undefined;

  if (loading) {
    return <CenteredSpinner />;
  }

  if (!course || !program) {
    return null; // render nothing while redirecting
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{course.name}</p>
          <h1 className="text-2xl font-semibold leading-tight">
            {course.name}
          </h1>
          <p className="text-sm text-muted-foreground">{program.name}</p>
        </div>
        <CourseForm course={course} />
      </div>
      <div className="grid gap-3 grid-cols-3">
        <Info label="Course Code" value={course.course_code} />
        <Info label="Credits" value={course.credits} />
        <Info label="Grade" value={course.grade || ""} />
      </div>
      <div>
        <div className="rounded-md border p-3 text-sm">
          <p className="text-muted-foreground">Corresponding Program</p>
          <p className="font-medium"><Link href={"/app/programs/" + program.id}>{program.degree}  | {program.name}</Link></p>
        </div>
      </div>
    </div>
  );
}
