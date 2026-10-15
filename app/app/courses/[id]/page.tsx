"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  GraduationCap,
  LoaderCircle,
  Save,
} from "lucide-react";
import type { SerializedEditorState, SerializedParagraphNode } from "lexical";
import type { Course } from "@/types/course";
import { useData } from "@/lib/data-provider";
import { CourseForm } from "./course-form";
import {
  OverviewLoading,
  OverviewStats,
} from "@/components/workspace/overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Editor } from "@/components/blocks/editor-md/editor";
import { createClient } from "@/lib/supabase/client";
import { formatStudyPeriod, getStudyPeriodLabel } from "@/lib/study-period";
import { toast } from "sonner";
import { CourseExaminations } from "@/components/examinations/course-examinations";
import { formatGrade, summarizeExaminations } from "@/lib/examinations";

const emptyNotes = {
  root: {
    children: [
      {
        children: [],
        textFormat: 0,
        textStyle: "",
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
} satisfies SerializedEditorState<SerializedParagraphNode>;

function CourseNotes({ course }: { course: Course }) {
  const client = useMemo(() => createClient(), []);
  const [notes, setNotes] = useState<SerializedEditorState>(
    (course.editor_state as SerializedEditorState) || emptyNotes,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await client.auth.getUser();
        if (authError || !user) throw new Error("Not authenticated");
        const { data, error } = await client
          .from("courses")
          .select("editor_state")
          .eq("id", course.id)
          .eq("user_id", user.id)
          .single();
        if (error) throw error;
        if (active) {
          setNotes(data?.editor_state ?? emptyNotes);
          setLoadError(false);
        }
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [client, course.id, retry]);
  const saveNotes = async () => {
    if (loading || saving || loadError) return;
    setSaving(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser();
      if (authError || !user) {
        toast.error("Please log in again to save your notes");
        return;
      }
      const { error } = await client
        .from("courses")
        .update({ editor_state: notes })
        .eq("id", course.id)
        .eq("user_id", user.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Notes saved");
    } catch {
      toast.error("Could not save your notes. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <section
      aria-labelledby="course-notes-title"
      className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-5 sm:px-6">
        <div>
          <h2
            id="course-notes-title"
            className="text-lg font-semibold tracking-tight"
          >
            Course notes
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your ideas, lecture notes, and reference material, saved to this
            course.
          </p>
        </div>
        <Button
          onClick={() => void saveNotes()}
          disabled={loading || saving || loadError}
        >
          {saving ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {saving ? "Saving…" : "Save notes"}
        </Button>
      </div>
      {loading ? (
        <div
          role="status"
          aria-label="Loading course notes"
          className="space-y-4 p-6"
        >
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-64" />
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 p-10 text-center"
        >
          <FileText
            aria-hidden="true"
            className="size-6 text-muted-foreground"
          />
          <p className="text-sm font-medium">Your notes couldn’t be loaded.</p>
          <p className="text-xs text-muted-foreground">
            Try again before making any changes.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              setRetry((value) => value + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <div className="min-w-0 [&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none [&_[contenteditable]]:h-auto [&_[contenteditable]]:max-h-[65dvh] [&_[contenteditable]]:min-h-96 [&_[contenteditable]]:px-5 sm:[&_[contenteditable]]:px-8">
          <Editor editorSerializedState={notes} onSerializedChange={setNotes} />
        </div>
      )}
      <div className="border-t bg-muted/15 px-5 py-3 text-[11px] leading-5 text-muted-foreground sm:px-6">
        Use / for formatting commands. Save your notes before leaving this page.
      </div>
    </section>
  );
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { courses, studyPrograms, examinations, loading, preferences } =
    useData();
  const course = courses.find((course) => course.id === id);
  const program = studyPrograms.find(
    (program) => program.id === course?.program_id,
  );
  if (loading) return <OverviewLoading />;
  if (!course)
    return (
      <div className="mx-auto max-w-7xl space-y-4 p-8">
        <h1 className="text-2xl font-semibold">Course not found</h1>
        <Button asChild variant="outline">
          <Link href="/app/courses">Back to courses</Link>
        </Button>
      </div>
    );
  const programGrades = courses.filter(
    (other) =>
      other.program_id === course.program_id &&
      other.grade != null &&
      other.credits > 0,
  );
  const totalCredits = programGrades.reduce(
    (sum, other) => sum + other.credits,
    0,
  );
  const average = totalCredits
    ? programGrades.reduce(
        (sum, other) => sum + other.grade! * other.credits,
        0,
      ) / totalCredits
    : null;
  const lowerIsBetter =
    (preferences?.grade_min ?? 1) < (preferences?.grade_max ?? 5);
  const comparison =
    course.grade == null
      ? "No result recorded yet"
      : average === null
        ? "Course result"
        : course.grade === average
          ? "Equal to program average"
          : (lowerIsBetter ? course.grade < average : course.grade > average)
            ? "Better than program average"
            : "Below program average";
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-5 sm:space-y-8 sm:p-8 lg:p-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <Link
            href="/app/courses"
            className="mb-5 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            All courses
          </Link>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] break-words sm:text-4xl">
            {course.name}
          </h1>
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {course.course_code || "Course details & notes"}
          </p>
        </div>
        <div className="w-fit shrink-0">
          <CourseForm course={course} />
        </div>
      </div>
      <OverviewStats
        items={[
          {
            label: "Credits",
            value: course.credits,
            detail: "ECTS for this course",
          },
          {
            label: "Grade",
            value: formatGrade(course.grade),
            detail: summarizeExaminations(
              examinations.filter((exam) => exam.course_id === course.id),
            ).provisional
              ? "Provisional — examination results missing"
              : comparison,
          },
          {
            label: getStudyPeriodLabel(preferences, { capitalized: true }),
            value: course.semesters,
            detail: formatStudyPeriod(preferences, course.semesters, {
              capitalized: true,
            }),
          },
          {
            label: "Status",
            value: (
              <Badge
                variant={course.finished ? "secondary" : "outline"}
                className="text-xs font-normal"
              >
                {course.finished ? "Completed" : "In progress"}
              </Badge>
            ),
            detail: course.finished
              ? "Included in earned credits"
              : "Part of your study plan",
          },
        ]}
      />
      <div className="grid divide-y overflow-hidden rounded-xl border bg-card shadow-xs md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="p-5">
          <p className="mb-3 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Study program
          </p>
          {program ? (
            <Link
              href={`/app/programs/${program.id}`}
              className="group flex items-center gap-3"
            >
              <span className="rounded-lg border bg-muted/30 p-2">
                <GraduationCap
                  aria-hidden="true"
                  className="size-4 text-teal-700 dark:text-teal-400"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium break-words">
                  {program.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {program.degree}
                </p>
              </div>
              <ArrowRight
                aria-hidden="true"
                className="size-4 shrink-0 transition-transform group-hover:translate-x-1"
              />
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">
              Program details are unavailable.
            </p>
          )}
        </div>
        <div className="p-5">
          <p className="mb-3 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Course tags
          </p>
          <div className="flex flex-wrap gap-2">
            {course.tags?.length ? (
              course.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="max-w-full whitespace-normal break-all font-normal"
                >
                  {tag}
                </Badge>
              ))
            ) : (
              <p className="text-xs leading-6 text-muted-foreground">
                Add tags in course settings to organize your library.
              </p>
            )}
          </div>
        </div>
      </div>
      <CourseExaminations course={course} />
      <CourseNotes key={course.id} course={course} />
    </div>
  );
}
