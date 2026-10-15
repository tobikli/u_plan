"use client";

import { CourseForm as AddCourseForm } from "@/app/app/courses/course-form";
import type { StudyProgram } from "@/types/study-program";

export function CourseForm({ program }: { program: StudyProgram }) {
  return <AddCourseForm program={program} />;
}
