"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Course } from "@/types/course"

export const columns: ColumnDef<Course>[] = [
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