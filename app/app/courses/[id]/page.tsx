"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { StudyProgram } from "@/types/study-program";
import { useData } from "@/lib/data-provider";
import { CourseForm } from "./course-form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CenteredSpinner from "@/components/ui/centered-spinner";
import { Course } from "@/types/course";
import Link from "next/link";
import { SerializedEditorState } from "lexical";

import { Editor } from "@/components/blocks/editor-md/editor";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export default function StudyDetail() {
  const params = useParams<{ id: string }>();
  const { studyPrograms, courses, loading } = useData();
  const supabase = useMemo(() => createClient(), []);

  const course = useMemo(
    () => courses.find((c) => c.id === params.id),
    [courses, params.id]
  ) as Course | undefined;

  const program = useMemo(
    () => studyPrograms.find((p) => p.id === course?.program_id),
    [studyPrograms, course?.program_id]
  ) as StudyProgram | undefined;

  const initialValue = useMemo(() => {
    if (course?.editor_state) {
      try {
        return course.editor_state as SerializedEditorState;
      } catch (err) {
        console.warn("Failed to parse editor state", err);
      }
    }
    return {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Add course notes...",
                type: "text",
                version: 1,
              },
            ],
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
    } as unknown as SerializedEditorState;
  }, [course?.editor_state]);

  const [editorState, setEditorState] =
    useState<SerializedEditorState>(initialValue);
  const [notesLoading, setNotesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    setEditorState(initialValue);
    setEditorKey((key) => key + 1);
  }, [initialValue]);

  useEffect(() => {
    const loadNotes = async () => {
      if (!course?.id) return;
      setNotesLoading(true);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          console.error("Unable to load notes: not authenticated", userError);
          return;
        }

        const { data, error } = await supabase
          .from("courses")
          .select("editor_state")
          .eq("id", course.id)
          .eq("user_id", userData.user.id)
          .single();

        if (error) {
          toast.error("Failed to load course notes, " + error.message);
          return;
        }

        if (data?.editor_state) {
          setEditorState(data.editor_state as SerializedEditorState);
          setEditorKey((key) => key + 1);
        }
      } catch (err) {
        console.error("Unexpected error loading course notes", err);
      } finally {
        setNotesLoading(false);
      }
    };

    loadNotes();
  }, [course?.id, supabase]);

  if (loading) {
    return <CenteredSpinner />;
  }

  if (!course || !program) {
    return null; // render nothing while redirecting
  }

  const programAverage =
    courses
      .filter(
        (c) =>
          c.program_id === program.id &&
          c.grade !== null &&
          c.grade !== undefined
      )
      .reduce(
        (acc, c) => acc + (((c.grade as number) * c.credits) as number),
        0
      ) /
    courses
      .filter(
        (c) =>
          c.program_id === program.id &&
          c.grade !== null &&
          c.grade !== undefined
      )
      .reduce((acc, c) => acc + c.credits, 0);

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError || !userResult.user) {
        toast.error("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("courses")
        .update({ editor_state: editorState })
        .eq("id", course.id)
        .eq("user_id", userResult.user.id);

      if (error) {
        toast.error(error.message ?? "Failed to save notes");
        return;
      }

      toast.success("Notes saved");
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error while saving notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{course.name}</p>
          <h1 className="text-2xl font-semibold leading-tight">
            {course.name}
          </h1>
          <p className="text-sm text-muted-foreground">{program.name}</p>
        </div>
        <CourseForm course={course} />
      </div>
      <div className="grid gap-3 grid-cols-3">
        <Info label="Course Code" value={course.course_code} />
        <Info label="Credits" value={course.credits} />
        <div className="rounded-md border p-3 text-sm">
          <p className="text-muted-foreground">Grade</p>
          <div className="flex justify-center gap-4">
            {course.grade ? (
              <>
                <Tooltip>
                  {!Number.isNaN(programAverage) ? (
                    programAverage < course.grade ? (
                      <>
                        <TooltipTrigger asChild>
                          <span className="text-red-500 font-medium">▲</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Worse than program average</p>
                        </TooltipContent>
                      </>
                    ) : programAverage > course.grade ? (
                      <>
                        <TooltipTrigger asChild>
                          <span className="text-green-500 font-medium">▼</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Better than program average</p>
                        </TooltipContent>
                      </>
                    ) : (
                      <>
                        <TooltipTrigger asChild>
                          <span className="text-yellow-500 font-medium">▶</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Equal to program average</p>
                        </TooltipContent>
                      </>
                    )
                  ) : null}
                </Tooltip>
                <div>{course.grade}</div>
              </>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )}
          </div>
          <div className="mt-2 flex justify-center"></div>
        </div>
      </div>
      <div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border p-3 text-sm">
            <p className="text-muted-foreground">Corresponding Program</p>
            <p className="font-medium">
              <Link href={"/app/programs/" + program.id}>
                {program.degree} | {program.name}
              </Link>
            </p>
          </div>
          <div className="rounded-md border p-3 text-sm">
            <p className="text-muted-foreground">Tags</p>
            <p className="font-medium">
              {course.tags && course.tags.length > 0
                ? course.tags.join(", ")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
      <h2 className="text-lg font-semibold">Course Notes</h2>
      <div className="flex items-center gap-3">
        <Button onClick={handleSaveNotes} disabled={saving || notesLoading}>
          {notesLoading ? "Loading notes..." : saving ? "Saving..." : "Save Notes"}
        </Button>
        <p className="text-sm text-muted-foreground">Notes are saved to this course.</p>
      </div>
      <Editor
        key={editorKey}
        editorSerializedState={editorState}
        onSerializedChange={(value) => setEditorState(value)}
      />
    </div>
  );
}
