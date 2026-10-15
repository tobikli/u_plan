"use client";

import Link from "next/link";
import { BookOpen, Search, RotateCcw, Plus } from "lucide-react";
import {
  OverviewHeader,
  OverviewStats,
  OverviewLoading,
} from "@/components/workspace/overview";
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
import { getCourseColumns } from "./columns";
import { useData } from "@/lib/data-provider";
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
  const { courses, studyPrograms, loading, preferences, error } = useData();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<
    "name" | "course_code" | "credits" | "grade" | "tags"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const coursesWithProgram: CourseWithProgram[] = useMemo(
    () =>
      courses.map((course) => {
        const program = studyPrograms.find((p) => p.id === course.program_id);
        return { ...course, program_name: program ? `${program.degree} · ${program.name}` : undefined };
      }),
    [courses, studyPrograms],
  );

  const filteredAndSorted = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? coursesWithProgram.filter((c) => {
          const tagMatch = (c.tags || []).some((t) =>
            t.toLowerCase().includes(term),
          );
          const textMatch = [c.name, c.course_code, c.program_name]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(term));
          return textMatch || tagMatch;
        })
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
          case "tags":
            return c.tags && c.tags.length > 0
              ? c.tags.join(", ").toLowerCase()
              : "";
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

  const columns = useMemo(() => getCourseColumns(preferences), [preferences]);

  if (loading) return <OverviewLoading />;
  const completed = courses.filter((course) => course.finished);
  const addCourse = (
    <CourseForm
      trigger={
        <Button>
          <Plus aria-hidden="true" />
          Add a course
        </Button>
      }
    />
  );
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-5 sm:space-y-8 sm:p-8 lg:p-10">
      <OverviewHeader
        title="Courses"
        description="Grades, credits, and course notes. All the details of your studies, together."
        action={
          studyPrograms.length ? (
            addCourse
          ) : (
            <Button asChild>
              <Link href="/app/programs">
                <Plus aria-hidden="true" />
                Add a program
              </Link>
            </Button>
          )
        }
      />
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          Some study data could not be loaded. Please refresh to try again.
        </p>
      )}
      <OverviewStats
        items={[
          {
            label: "Courses",
            value: courses.length,
            detail: "Across your programs",
          },
          {
            label: "In progress",
            value: courses.length - completed.length,
            detail: "Courses you’re working on",
          },
          {
            label: "Completed",
            value: completed.length,
            detail: "Marked as finished",
          },
          {
            label: "Credits earned",
            value: completed.reduce(
              (sum, course) => sum + (course.credits || 0),
              0,
            ),
            detail: `Of ${courses.reduce((sum, course) => sum + (course.credits || 0), 0)} planned ECTS`,
          },
        ]}
      />
      {courses.length ? (
        <section
          aria-labelledby="course-list-title"
          className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5 sm:px-6">
            <div>
              <h2
                id="course-list-title"
                className="text-base font-semibold tracking-tight"
              >
                Your course library
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Open a course to view its details and notes.
              </p>
            </div>
            <span
              aria-live="polite"
              className="text-xs tabular-nums text-muted-foreground"
            >
              {filteredAndSorted.length} of {courses.length} courses
            </span>
          </div>
          <div className="flex flex-col gap-3 bg-muted/15 p-4 sm:p-5">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground"
              />
              <Input
                aria-label="Search courses"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, code, program, or tag…"
                className="h-10 bg-background pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs text-muted-foreground">
                Sort by
              </span>
              <Select
                value={sortKey}
                onValueChange={(v) => setSortKey(v as typeof sortKey)}
              >
                <SelectTrigger
                  aria-label="Sort courses by"
                  className="w-32 bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="course_code">Course code</SelectItem>
                  <SelectItem value="credits">Credits</SelectItem>
                  <SelectItem value="grade">Grade</SelectItem>
                  <SelectItem value="tags">Tags</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortDir}
                onValueChange={(v) => setSortDir(v as typeof sortDir)}
              >
                <SelectTrigger
                  aria-label="Sort direction"
                  className="w-32 bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="sm:ml-auto"
                onClick={() => {
                  setSearch("");
                  setSortKey("name");
                  setSortDir("asc");
                }}
              >
                <RotateCcw aria-hidden="true" />
                Reset
              </Button>
            </div>
          </div>
          <CourseTable
            columns={columns}
            data={filteredAndSorted}
            getRowHref={(course) => `/app/courses/${course.id}`}
          />
        </section>
      ) : (
        <Empty className="min-h-80 rounded-xl border border-dashed bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>
              {studyPrograms.length
                ? "No courses added"
                : "Start with a study program."}
            </EmptyTitle>
            <EmptyDescription>
              {studyPrograms.length
                ? "Add your first course to track credits, record grades, and keep your notes close."
                : "Courses belong to a program. Create one first, then build your course library."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {studyPrograms.length ? (
              addCourse
            ) : (
              <Button asChild>
                <Link href="/app/programs">Create a program</Link>
              </Button>
            )}
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
