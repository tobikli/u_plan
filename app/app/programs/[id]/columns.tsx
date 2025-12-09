"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
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
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = (row.original as Course).tags || []
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
    header: "Semester(s)",
  },
  {
    accessorKey: "finished",
    header: "Status",
    cell: ({ row }) => row.getValue("finished") ? "Completed" : "In Progress",
  },
]