import type { Examination } from "../types/examination";

export function summarizeExaminations(
  examinations: Pick<Examination, "grade" | "weight">[],
) {
  const graded = examinations.filter((exam) => exam.grade !== null);
  const totalWeight = examinations.reduce(
    (sum, exam) => sum + Number(exam.weight),
    0,
  );
  const gradedWeight = graded.reduce(
    (sum, exam) => sum + Number(exam.weight),
    0,
  );
  const grade =
    gradedWeight > 0
      ? Math.round(
          (graded.reduce(
            (sum, exam) => sum + Number(exam.grade) * Number(exam.weight),
            0,
          ) /
            gradedWeight) *
            10000,
        ) / 10000
      : null;
  return {
    grade,
    totalWeight,
    gradedWeight,
    gradedCount: graded.length,
    count: examinations.length,
    provisional: graded.length > 0 && graded.length < examinations.length,
  };
}

export function formatGrade(grade: number | null | undefined) {
  return grade == null
    ? "—"
    : new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(grade);
}

export function formatExamDate(date: string | null) {
  return date
    ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date not set";
}

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
