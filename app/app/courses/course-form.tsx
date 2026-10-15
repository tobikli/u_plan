"use client";

import { CourseTemplatePicker } from "@/components/universities/course-template-picker";
import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, LoaderCircle } from "lucide-react";
import type { StudyProgram } from "@/types/study-program";
import { FormDialog } from "@/components/workspace/form-dialog";
import { EditSection } from "@/components/workspace/edit-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useData } from "@/lib/data-provider";
import { getStudyPeriodLabel } from "@/lib/study-period";
import { toast } from "sonner";
import { TagInput } from "./tag-input";

export function CourseForm({
  trigger,
  program: fixedProgram,
}: {
  trigger?: React.ReactNode;
  program?: StudyProgram;
}) {
  const fieldId = useId();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [credits, setCredits] = useState("");
  const [templateApplied, setTemplateApplied] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [programId, setProgramId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const {
    studyPrograms,
    loading: loadingPrograms,
    preferences,
    courses,
    refreshCourses,
  } = useData();
  const studyPeriodLabel = getStudyPeriodLabel(preferences, {
    capitalized: true,
  });
  const studyPeriodLabelPlural = getStudyPeriodLabel(preferences, {
    plural: true,
    capitalized: true,
  });
  const router = useRouter();

  const availableTags = useMemo(
    () =>
      Array.from(
        new Set(
          courses
            .flatMap((c) => c.tags || [])
            .map((t) => t.trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [courses],
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);

      const name = form.get("name")?.toString().trim() ?? "";
      const course_code = form.get("code")?.toString().trim() ?? "";
      const semestersRaw = form.get("semester")?.toString().trim() ?? "";
      const creditsRaw = form.get("credits")?.toString().trim() ?? "";
      const finishedRaw = form.get("finished")?.toString().trim() ?? "";
      const program = programId.trim();

      const finished = finishedRaw === "on" ? true : false;

      const semesters = Number(semestersRaw);
      const credits = Number(creditsRaw);
      const tagList = selectedTags;

      if (!name) {
        toast.error("Name is required");
        return;
      }

      if (!semestersRaw || !Number.isFinite(semesters) || semesters < 1) {
        toast.error(`${studyPeriodLabelPlural} must be a positive number`);
        return;
      }

      if (!creditsRaw || !Number.isFinite(credits) || credits < 0) {
        toast.error("Credits must be zero or greater");
        return;
      }

      if (!program) {
        toast.error("Program is required");
        return;
      }

      const supabase = createClient();
      const { data: userResult, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userResult.user) {
        toast.error("Not authenticated");
        return;
      }

      const { error: insertError } = await supabase.from("courses").insert({
        user_id: userResult.user.id,
        program_id: program,
        course_code,
        name,
        semesters,
        credits,
        finished,
        tags: tagList,
      });

      if (insertError) {
        toast.error(insertError.message ?? "Failed to save course");
        return;
      }

      await refreshCourses();
      setOpen(false);
      toast.success("Course added!");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error while saving");
    } finally {
      setSubmitting(false);
    }
  };

  const changeOpen = (next: boolean) => {
    if (submitting) return;
    if (next) {
      setName("");
      setCode("");
      setCredits("");
      setTemplateApplied(false);
      setSelectedTags([]);
      setProgramId(
        fixedProgram?.id ??
          (studyPrograms.length === 1 ? studyPrograms[0].id : ""),
      );
    }
    setOpen(next);
  };
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Plus aria-hidden="true" />
            Add a course
          </Button>
        )}
      </DialogTrigger>
      <FormDialog
        title="Add a course"
        eyebrow="New course"
        description={
          fixedProgram
            ? `Add a course to ${fixedProgram.name}.`
            : "Connect a course to your program and start tracking your progress."
        }
        onSubmit={handleSubmit}
        busy={submitting}
        footer={
          <>
            <Button
              variant="outline"
              type="button"
              disabled={submitting}
              onClick={() => changeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                loadingPrograms ||
                !studyPrograms.length ||
                !programId
              }
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  Adding…
                </>
              ) : (
                "Add course"
              )}
            </Button>
          </>
        }
      >
        {!loadingPrograms && !studyPrograms.length && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Create a program first</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Every course belongs to a study program.
            </p>
            <Link
              href="/app/programs"
              onClick={() => changeOpen(false)}
              className="mt-3 inline-block text-xs font-medium underline underline-offset-4"
            >
              Go to programs
            </Link>
          </div>
        )}
        {studyPrograms.find((item) => item.id === programId)?.university_id && (
          <CourseTemplatePicker
            key={programId}
            program={studyPrograms.find((item) => item.id === programId)!}
            onApply={(item) => {
              setName(item.name);
              setCode(item.code);
              if (item.credits !== null) setCredits(String(item.credits));
              else setCredits("");
              setTemplateApplied(true);
            }}
          />
        )}
        <EditSection>
          <div className="grid gap-2">
            <Label htmlFor={`${fieldId}-name`}>Course name</Label>
            <Input
              id={`${fieldId}-name`}
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Algorithms & Data Structures"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[0.65fr_1.35fr]">
            <div className="grid content-start gap-2">
              <Label htmlFor={`${fieldId}-code`}>Course code</Label>
              <Input
                id={`${fieldId}-code`}
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CS 201"
                required
              />
            </div>
            <div className="grid content-start gap-2">
              <Label htmlFor={`${fieldId}-program`}>Study program</Label>
              <Select
                value={programId}
                onValueChange={(value) => {
                  setProgramId(value);
                  if (templateApplied) {
                    setName("");
                    setCode("");
                    setCredits("");
                    setTemplateApplied(false);
                  }
                }}
                disabled={
                  !!fixedProgram || loadingPrograms || !studyPrograms.length
                }
              >
                <SelectTrigger
                  id={`${fieldId}-program`}
                  className="w-full min-w-0"
                >
                  <SelectValue
                    placeholder={
                      loadingPrograms ? "Loading…" : "Choose a program"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {studyPrograms.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.degree} · {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </EditSection>
        <div className="border-t" />
        <EditSection
          title="Credits & progress"
          description="Add the course workload and where it fits in your studies."
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid content-start gap-2">
              <Label htmlFor={`${fieldId}-credits`}>Credits (ECTS)</Label>
              <Input
                id={`${fieldId}-credits`}
                name="credits"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                type="number"
                min="0"
                step="0.5"
                placeholder="6"
                required
              />
            </div>
            <div className="grid content-start gap-2">
              <Label htmlFor={`${fieldId}-semester`}>{studyPeriodLabel}</Label>
              <Input
                id={`${fieldId}-semester`}
                name="semester"
                type="number"
                min="1"
                max={fixedProgram?.semesters}
                defaultValue="1"
                required
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Course grades are calculated from examinations. Add results on the
            course page.
          </p>
          <label
            htmlFor={`${fieldId}-finished`}
            className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/20 p-4"
          >
            <Checkbox
              id={`${fieldId}-finished`}
              name="finished"
              className="mt-0.5"
            />
            <span>
              <span className="block text-sm font-medium">
                Already completed
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                Include these credits in your earned total.
              </span>
            </span>
          </label>
        </EditSection>
        <div className="border-t" />
        <EditSection title="Organization">
          <TagInput
            selected={selectedTags}
            onChange={setSelectedTags}
            available={availableTags}
            placeholder="Type a tag and press Enter"
          />
        </EditSection>
      </FormDialog>
    </Dialog>
  );
}
