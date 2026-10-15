"use client";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Course } from "@/types/course";
import { Badge } from "@/components/ui/badge";
import { getStudyPeriodLabel } from "@/lib/study-period";
import type { Preferences } from "@/types/preferences";
import { formatGrade } from "@/lib/examinations";
type CourseWithProgram = Course & { program_name?: string };
type PreferencesLike = Pick<Preferences, "trimester"> | null | undefined;
export function getCourseColumns(
  preferences: PreferencesLike,
): ColumnDef<CourseWithProgram>[] {
  return [
    {
      accessorKey: "name",
      header: "Course",
      cell: ({ row }) => (
        <div className="min-w-40 max-w-72">
          <Link
            href={`/app/courses/${row.original.id}`}
            className="block truncate font-medium hover:underline hover:underline-offset-4"
            title={row.original.name}
          >
            {row.original.name}
          </Link>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {row.original.course_code || "No code"}
          </p>
        </div>
      ),
    },
    {
      id: "program",
      header: "Program",
      accessorFn: (row) => row.program_name ?? row.program_id,
      cell: ({ row }) =>
        row.original.program_id ? (
          <Link
            href={`/app/programs/${row.original.program_id}`}
            className="block max-w-44 truncate text-xs text-muted-foreground transition-colors hover:text-foreground"
            title={row.original.program_name}
          >
            {row.original.program_name ?? "View program"}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => (
        <div className="flex max-w-52 flex-wrap gap-1">
          {row.original.tags?.length ? (
            row.original.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="max-w-40 truncate text-[10px] font-normal"
                title={tag}
              >
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "credits",
      header: "Credits",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs tabular-nums">
          {row.original.credits}{" "}
          <span className="text-muted-foreground">ECTS</span>
        </span>
      ),
    },
    {
      accessorKey: "grade",
      header: "Grade",
      cell: ({ row }) => (
        <span className="text-xs tabular-nums">
          {formatGrade(row.original.grade)}
        </span>
      ),
    },
    {
      accessorKey: "semesters",
      header: getStudyPeriodLabel(preferences, { capitalized: true }),
      cell: ({ row }) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {row.original.semesters}
        </span>
      ),
    },
    {
      accessorKey: "finished",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.finished ? "secondary" : "outline"}
          className="text-[10px] font-normal"
        >
          {row.original.finished ? "Completed" : "In progress"}
        </Badge>
      ),
    },
  ];
}
