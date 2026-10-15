"use client";

import { useId, useState } from "react";
import { LoaderCircle, Pencil, Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/workspace/form-dialog";
import {
  DeleteRecordButton,
  EditSection,
} from "@/components/workspace/edit-dialog";
import { createClient } from "@/lib/supabase/client";
import { useData } from "@/lib/data-provider";
import { formatGrade, summarizeExaminations } from "@/lib/examinations";
import type { Examination } from "@/types/examination";
import type { Course } from "@/types/course";
import { toast } from "sonner";

export function ExaminationForm({
  course,
  examination,
}: {
  course: Course;
  examination?: Examination;
}) {
  const fieldId = useId();
  const { examinations, preferences, refreshExaminations, refreshCourses } =
    useData();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [grade, setGrade] = useState("");
  const [weight, setWeight] = useState("1");
  const low = Math.min(
    preferences?.grade_min ?? 1,
    preferences?.grade_max ?? 5,
  );
  const high = Math.max(
    preferences?.grade_min ?? 1,
    preferences?.grade_max ?? 5,
  );
  const otherExams = examinations.filter(
    (exam) => exam.course_id === course.id && exam.id !== examination?.id,
  );
  const validWeight = Number.isFinite(Number(weight)) && Number(weight) > 0;
  const preview = validWeight
    ? summarizeExaminations([
        ...otherExams,
        {
          grade:
            grade.trim() && Number.isFinite(Number(grade))
              ? Number(grade)
              : null,
          weight: Number(weight),
        },
      ])
    : null;
  const changeOpen = (next: boolean) => {
    if (submitting) return;
    if (next) {
      setName(examination?.name ?? "");
      setDate(examination?.exam_date ?? "");
      setGrade(examination?.grade?.toString() ?? "");
      setWeight(examination?.weight.toString() ?? "1");
    }
    setOpen(next);
  };
  const refresh = () => Promise.all([refreshExaminations(), refreshCourses()]);
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const result = grade.trim() ? Number(grade) : null;
    if (!name.trim() || name.trim().length > 200) {
      toast.error("Enter an examination name of up to 200 characters");
      return;
    }
    if (!validWeight) {
      toast.error("Weight must be a positive number");
      return;
    }
    if (
      result !== null &&
      (!Number.isFinite(result) || result < low || result > high)
    ) {
      toast.error(`Grade must be between ${low} and ${high}`);
      return;
    }
    setSubmitting(true);
    try {
      const client = createClient();
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser();
      if (authError || !user) {
        toast.error("Please log in again to save examinations");
        return;
      }
      const values = {
        name: name.trim(),
        exam_date: date || null,
        grade: result,
        weight: Number(weight),
      };
      const response = examination
        ? await client
            .from("examinations")
            .update(values)
            .eq("id", examination.id)
            .eq("user_id", user.id)
            .eq("course_id", course.id)
        : await client
            .from("examinations")
            .insert({ ...values, user_id: user.id, course_id: course.id });
      if (response.error) {
        toast.error(response.error.message);
        return;
      }
      await refresh();
      setOpen(false);
      toast.success(examination ? "Examination updated" : "Examination added");
    } catch {
      toast.error("Could not save the examination. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  const remove = async () => {
    if (!examination) return false;
    const client = createClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user) {
      toast.error("Please log in again to delete examinations");
      return false;
    }
    const { error } = await client
      .from("examinations")
      .delete()
      .eq("id", examination.id)
      .eq("course_id", course.id)
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    await refresh();
    setOpen(false);
    toast.success("Examination deleted");
    return true;
  };
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        {examination ? (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Edit ${examination.name}`}
          >
            <Pencil aria-hidden="true" />
            Edit
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Plus aria-hidden="true" />
            Add examination
          </Button>
        )}
      </DialogTrigger>
      <FormDialog
        title={examination ? "Edit examination" : "Add examination"}
        eyebrow="Course examination"
        description={`Manage the date, result, and grading weight for ${course.name}.`}
        busy={submitting}
        onSubmit={save}
        footer={
          <>
            {examination && (
              <div className="mr-auto">
                <DeleteRecordButton
                  kind="examination"
                  name={examination.name}
                  disabled={submitting}
                  onDelete={remove}
                />
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => changeOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    Saving…
                  </>
                ) : examination ? (
                  "Save changes"
                ) : (
                  "Add examination"
                )}
              </Button>
            </div>
          </>
        }
      >
        <EditSection title="Examination details">
          <div className="grid gap-2">
            <Label htmlFor={`${fieldId}-name`}>Name</Label>
            <Input
              id={`${fieldId}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Written exam, project, or presentation"
              maxLength={200}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${fieldId}-date`}>
              Date{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id={`${fieldId}-date`}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Leave empty if the examination has not been scheduled.
            </p>
          </div>
        </EditSection>
        <div className="border-t" />
        <EditSection title="Grading">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid content-start gap-2">
              <Label htmlFor={`${fieldId}-grade`}>
                Grade{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id={`${fieldId}-grade`}
                type="number"
                step="any"
                min={low}
                max={high}
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                placeholder="Not graded"
              />
            </div>
            <div className="grid content-start gap-2">
              <Label htmlFor={`${fieldId}-weight`}>Weight</Label>
              <Input
                id={`${fieldId}-weight`}
                type="number"
                step="any"
                min="0.000001"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                required
              />
            </div>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Weights are relative: 40 and 60 produces a 40% / 60% split. They do
            not have to total 100. Examinations without a grade are excluded
            until a result is recorded.
          </p>
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-4">
            <div>
              <p className="text-xs font-medium">Course grade after saving</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {preview?.provisional
                  ? "Provisional — results are still missing"
                  : "Weighted examination result"}
              </p>
            </div>
            <span className="text-2xl font-semibold tabular-nums">
              {formatGrade(preview?.grade)}
            </span>
          </div>
        </EditSection>
      </FormDialog>
    </Dialog>
  );
}
