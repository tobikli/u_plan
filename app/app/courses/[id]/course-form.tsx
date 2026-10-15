"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Pencil, LoaderCircle } from "lucide-react";
import {
  EditSection,
  DeleteRecordButton,
} from "@/components/workspace/edit-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useData } from "@/lib/data-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Course } from "@/types/course";
import { TagInput } from "../tag-input";
import { getStudyPeriodLabel } from "@/lib/study-period";

export function CourseForm({ course }: { course: Course }) {
  const [semester, setSemester] = useState(course.semesters.toString());
  const [name, setName] = useState(course.name);
  const [code, setCode] = useState(course.course_code);
  const [credits, setCredits] = useState(course.credits.toString());
  const [selectedTags, setSelectedTags] = useState<string[]>(course.tags ?? []);
  const [finished, setFinished] = useState(course.finished);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fieldId = useId();
  const {
    studyPrograms,
    loading: loadingPrograms,
    refreshStudyPrograms,
    refreshCourses,
    preferences,
    courses,
  } = useData();
  const studyPeriodLabel = getStudyPeriodLabel(preferences, {
    capitalized: true,
  });
  const studyPeriodLabelPlural = getStudyPeriodLabel(preferences, {
    plural: true,
    capitalized: true,
  });
  const [programId, setProgramId] = useState(course.program_id);
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
      const programId = form.get("program")?.toString().trim() ?? "";

      const semesters = Number(semestersRaw);
      const credits = Number(creditsRaw);
      const tagList = selectedTags;

      if (!course_code) {
        toast.error("Course code is required");
        return;
      }

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

      if (!programId) {
        toast.error("Choose a program");
        return;
      }
      const supabase = createClient();
      const { data: userResult, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userResult.user) {
        toast.error("Not authenticated");
        return;
      }

      const { error: insertError } = await supabase
        .from("courses")
        .update({
          user_id: userResult.user.id,
          program_id: programId,
          course_code,
          name,
          semesters,
          credits,
          finished,
          tags: tagList,
        })
        .eq("id", course.id)
        .eq("user_id", userResult.user.id);

      if (insertError) {
        toast.error(insertError.message ?? "Failed to save course");
        return;
      }

      setOpen(false);
      await refreshCourses();
      toast.success("Course updated");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error while saving");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      toast.error("Please log in again to delete this course");
      return false;
    }
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("user_id", user.id)
      .eq("id", course.id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    await Promise.all([refreshStudyPrograms(), refreshCourses()]);
    setOpen(false);
    toast.success("Course deleted");
    router.push("/app/courses");
    router.refresh();
    return true;
  };
  const changeOpen = (next: boolean) => {
    if (submitting) return;
    if (next) {
      setName(course.name);
      setCode(course.course_code);
      setCredits(course.credits.toString());
      setSemester(course.semesters.toString());
      setSelectedTags(course.tags ?? []);
      setProgramId(course.program_id);
      setFinished(course.finished);
    }
    setOpen(next);
  };
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil aria-hidden="true" />
          Edit course
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90dvh] overflow-hidden rounded-2xl p-0 sm:max-w-xl"
        onInteractOutside={(event) => {
          if (submitting) event.preventDefault();
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="flex max-h-[90dvh] min-h-0 flex-col"
        >
          <DialogHeader className="shrink-0 border-b bg-muted/20 px-6 py-5 pr-12 text-left">
            <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Course settings
            </p>
            <DialogTitle className="text-xl tracking-tight">
              Edit course
            </DialogTitle>
            <DialogDescription>
              Update the details, credits, and progress for this course.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto">
            <fieldset
              disabled={submitting}
              className="min-w-0 space-y-6 px-6 py-5"
            >
              <EditSection title="Course details">
                <div className="grid gap-2">
                  <Label htmlFor={`${fieldId}-name`}>Course name</Label>
                  <Input
                    id={`${fieldId}-name`}
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                      required
                    />
                  </div>
                  <div className="grid content-start gap-2">
                    <Label htmlFor={`${fieldId}-program`}>Study program</Label>
                    <Select
                      value={programId}
                      onValueChange={setProgramId}
                      disabled={loadingPrograms || !studyPrograms.length}
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
                    <input type="hidden" name="program" value={programId} />
                  </div>
                </div>
              </EditSection>
              <div className="border-t" />
              <EditSection
                title="Credits & progress"
                description="Keep your study period and results up to date."
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid content-start gap-2">
                    <Label htmlFor={`${fieldId}-credits`}>Credits (ECTS)</Label>
                    <Input
                      id={`${fieldId}-credits`}
                      name="credits"
                      type="number"
                      min="0"
                      step="0.5"
                      value={credits}
                      onChange={(e) => setCredits(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid content-start gap-2">
                    <Label htmlFor={`${fieldId}-semester`}>
                      {studyPeriodLabel}
                    </Label>
                    <Input
                      id={`${fieldId}-semester`}
                      name="semester"
                      type="number"
                      min="1"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Course grades are calculated from examinations. Add results on
                  the course page.
                </p>
                <label
                  htmlFor={`${fieldId}-finished`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/20 p-4"
                >
                  <Checkbox
                    id={`${fieldId}-finished`}
                    checked={finished}
                    onCheckedChange={(value) => setFinished(value === true)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Mark as completed
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      Count this course’s credits toward your earned total.
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
            </fieldset>
          </div>
          <DialogFooter className="shrink-0 flex-row flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-6 py-4 sm:justify-between">
            <DeleteRecordButton
              disabled={submitting}
              kind="course"
              name={course.name}
              onDelete={handleDelete}
            />
            <div className="ml-auto flex gap-2">
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
                  submitting || loadingPrograms || !studyPrograms.length
                }
              >
                {submitting ? (
                  <>
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
