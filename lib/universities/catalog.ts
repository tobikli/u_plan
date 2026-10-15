import type { UniversityCourse } from "../../types/university";
export function mergeUniversityCourses(pages: UniversityCourse[][]) {
  const courses = new Map<string, UniversityCourse>();
  for (const course of pages.flat()) {
    const previous = courses.get(course.code);
    // A repeated module is not extra workload; conflicting ECTS need manual review.
    courses.set(
      course.code,
      previous
        ? {
            ...previous,
            credits:
              previous.credits === course.credits ? previous.credits : null,
          }
        : course,
    );
  }
  return [...courses.values()].sort((a, b) => a.name.localeCompare(b.name));
}
