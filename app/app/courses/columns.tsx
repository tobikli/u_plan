"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Course } from "@/types/course"

type CourseWithProgram = Course & { program_name?: string }

export const columns: ColumnDef<CourseWithProgram>[] = [
  {
    id: "program",
    header: "Program",
    accessorFn: (row) => row.program_name ?? row.program_id,
    cell: ({ row }) => row.original.program_name ?? row.original.program_id,
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
    header: "Semester(s)",
  },
  {
    accessorKey: "finished",
    header: "Status",
    cell: ({ row }) => row.getValue("finished") ? "Completed" : "In Progress",
  },
]