"use client";

import { IconFileText } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Course } from "@/types/course";
import { CourseForm } from "./course-form";
import { CourseTable } from "./courses";
import { columns } from "./columns";
import { useData } from "@/lib/data-provider";
import CenteredSpinner from "@/components/ui/centered-spinner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type CourseWithProgram = Course & { program_name?: string };

export default function Page() {
  const { courses, studyPrograms, loading } = useData();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<
    "name" | "course_code" | "credits" | "grade"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const coursesWithProgram: CourseWithProgram[] = courses.map((course) => ({
    ...course,
    program_name: studyPrograms.find((p) => p.id === course.program_id)?.name,
  }));

  const filteredAndSorted = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? coursesWithProgram.filter((c) =>
          [c.name, c.course_code, c.program_name]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(term))
        )
      : coursesWithProgram;

    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const getVal = (c: CourseWithProgram) => {
        switch (sortKey) {
          case "course_code":
            return c.course_code ?? "";
          case "credits":
            return Number(c.credits) || 0;
          case "grade":
            return c.grade === null || c.grade === undefined
              ? Infinity
              : c.grade;
          case "name":
          default:
            return c.name ?? "";
        }
      };

      const va = getVal(a);
      const vb = getVal(b);
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb)) * dir;
    });

    return sorted;
  }, [coursesWithProgram, search, sortKey, sortDir]);

  if (loading) return <CenteredSpinner />;
  if (!courses || courses.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <Empty className="w-full max-w-xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconFileText />
            </EmptyMedia>
            <EmptyTitle>No courses added yet</EmptyTitle>
            <EmptyDescription>
              Create your first study program to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CourseForm />
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-4 m-10">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold w-full">Courses</h1>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, program"
            className="w-full"
          />
        </div>
      </div>
      <div className="flex gap-3 justify-right">
        <span className="w-full"></span>
        <Select
          value={sortKey}
          onValueChange={(v) => setSortKey(v as typeof sortKey)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="course_code">Course Code</SelectItem>
            <SelectItem value="credits">Credits</SelectItem>
            <SelectItem value="grade">Grade</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortDir}
          onValueChange={(v) => setSortDir(v as typeof sortDir)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Asc</SelectItem>
            <SelectItem value="desc">Desc</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setSearch("");
            setSortKey("name");
            setSortDir("asc");
          }}
        >
          Reset
        </Button>
        <CourseForm />
      </div>
      <CourseTable
        columns={columns}
        data={filteredAndSorted}
        getRowHref={(course) => `/app/courses/${course.id}`}
      />{" "}
    </div>
  );
}
