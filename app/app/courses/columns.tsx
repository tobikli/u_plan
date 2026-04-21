"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Course } from "@/types/course"
import { Badge } from "@/components/ui/badge"
import { getStudyPeriodLabel } from "@/lib/study-period"
import type { Preferences } from "@/types/preferences"

type CourseWithProgram = Course & { program_name?: string }

type PreferencesLike = Pick<Preferences, "trimester"> | null | undefined

export function getCourseColumns(
  preferences: PreferencesLike
): ColumnDef<CourseWithProgram>[] {
  const studyPeriodLabelPlural = getStudyPeriodLabel(preferences, {
    plural: false,
    capitalized: true,
  })

  return [
  {
    id: "program",
    header: "Program",
    accessorFn: (row) => row.program_name ?? row.program_id,
    cell: ({ row }) => {
      const programId = row.original.program_id
      const programName = row.original.program_name ?? row.original.program_id
      return programId ? (
        <Link
          href={`/app/programs/${programId}`}
          className="text-primary underline"
        >
          {programName}
        </Link>
      ) : (
        <span>{programName}</span>
      )
    },
  },
  {
    accessorKey: "course_code",
    header: "Course Code",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = (row.original as CourseWithProgram).tags || []
      if (!tags || tags.length === 0) return "—"
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "credits",
    header: "Credits",
    cell: ({ row }) => `${row.getValue("credits")} ECTS`,
  },
  {
    accessorKey: "grade",
    header: "Grade",
    cell: ({ row }) => {
      const grade = row.getValue("grade")
      return grade !== null && grade !== undefined ? grade : "-"
    },
  },
  {
    accessorKey: "semesters",
    header: studyPeriodLabelPlural,
  },
  {
    accessorKey: "finished",
    header: "Status",
    cell: ({ row }) => row.getValue("finished") ? "Completed" : "In Progress",
  },
]
}