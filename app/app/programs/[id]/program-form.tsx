"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

import { ProgramTemplatePicker } from "@/components/universities/program-template-picker";
import type { UniversityLink } from "@/types/university";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DegreeDrop } from "../components/degreedrop";
import type { degreeType } from "@/types/study-program";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { StudyProgram } from "@/types/study-program";
import { useData } from "@/lib/data-provider";
import { getStudyPeriodLabel } from "@/lib/study-period";

export function ProgramForm({ program }: { program: StudyProgram }) {
  const [template, setTemplate] = useState<UniversityLink | null>(
    program.university_id && program.university_program_id
      ? {
          university_id: program.university_id,
          university_program_id: program.university_program_id,
        }
      : null,
  );
  const [degree, setDegree] = useState<degreeType | "">(program.degree);
  const [semesters, setSemesters] = useState(program.semesters.toString());
  const [name, setName] = useState(program.name);
  const [institution, setInstitution] = useState(program.institution);
  const [credits, setCredits] = useState(program.credits.toString());
  const [currentSemester, setCurrentSemester] = useState(
    program.current_semester.toString(),
  );
  const [finished, setFinished] = useState(program.finished);
  const [description, setDescription] = useState(program.description ?? "");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fieldId = useId();
  const { refreshStudyPrograms, refreshCourses, preferences } = useData();
  const studyPeriodLabelPlural = getStudyPeriodLabel(preferences, {
    plural: true,
    capitalized: true,
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);

      const name = form.get("name")?.toString().trim() ?? "";
      const institution = form.get("institution")?.toString().trim() ?? "";
      const semestersRaw = form.get("semesters")?.toString().trim() ?? "";
      const creditsRaw = form.get("credits")?.toString().trim() ?? "";
      const description = form.get("description")?.toString().trim() ?? "";

      const semesters = Number(semestersRaw);
      const credits = Number(creditsRaw);

      if (!degree) {
        toast.error("Select a degree");
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

      if (
        !Number.isInteger(Number(currentSemester)) ||
        Number(currentSemester) < 1 ||
        Number(currentSemester) > semesters
      ) {
        toast.error("Current study period must be within the program length");
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
        .from("study_programs")
        .update({
          user_id: userResult.user.id,
          university_id: template?.university_id ?? null,
          university_program_id: template?.university_program_id ?? null,
          degree,
          name,
          institution,
          semesters,
          credits,
          current_semester: Number(currentSemester),
          finished,
          description: description || null,
        })
        .eq("id", program.id)
        .eq("user_id", userResult.user.id);

      if (insertError) {
        toast.error(insertError.message ?? "Failed to save program");
        return;
      }

      setOpen(false);
      await refreshStudyPrograms();
      toast.success("Study program updated");
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
      toast.error("Please log in again to delete this program");
      return false;
    }
    const { error } = await supabase
      .from("study_programs")
      .delete()
      .eq("user_id", user.id)
      .eq("id", program.id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    await Promise.all([refreshStudyPrograms(), refreshCourses()]);
    setOpen(false);
    toast.success("Study program deleted");
    router.push("/app/programs");
    router.refresh();
    return true;
  };
  const changeOpen = (next: boolean) => {
    if (submitting) return;
    if (next) {
      setTemplate(
        program.university_id && program.university_program_id
          ? {
              university_id: program.university_id,
              university_program_id: program.university_program_id,
            }
          : null,
      );
      setDegree(program.degree);
      setName(program.name);
      setInstitution(program.institution);
      setSemesters(program.semesters.toString());
      setCurrentSemester(program.current_semester.toString());
      setCredits(program.credits.toString());
      setFinished(program.finished);
      setDescription(program.description ?? "");
    }
    setOpen(next);
  };
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil aria-hidden="true" />
          Edit program
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
          className="flex max-h-[90dvh] min-h-0 min-w-0 flex-col"
        >
          <DialogHeader className="shrink-0 border-b bg-muted/20 px-6 py-5 pr-12 text-left">
            <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Program settings
            </p>
            <DialogTitle className="text-xl tracking-tight">
              Edit study program
            </DialogTitle>
            <DialogDescription>
              Update program details, credit requirements, and completion
              status.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto">
            <fieldset
              disabled={submitting}
              className="min-w-0 space-y-6 px-6 py-5"
            >
              <ProgramTemplatePicker
                value={template}
                onChange={setTemplate}
                onApply={(selected, university) => {
                  setName(selected.name);
                  setDegree(selected.degree);
                  setInstitution(university.name);
                  if (selected.credits !== null)
                    setCredits(String(selected.credits));
                  if (selected.semesters !== null)
                    setSemesters(String(selected.semesters));
                }}
              />
              <EditSection>
                <div className="grid gap-2">
                  <Label htmlFor={`${fieldId}-name`}>Program name</Label>
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
                    <Label htmlFor={`${fieldId}-degree`}>Degree</Label>
                    <DegreeDrop
                      id={`${fieldId}-degree`}
                      value={degree}
                      onChange={setDegree}
                    />
                  </div>
                  <div className="grid content-start gap-2">
                    <Label htmlFor={`${fieldId}-institution`}>
                      Institution
                    </Label>
                    <Input
                      id={`${fieldId}-institution`}
                      name="institution"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="University or institution"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`${fieldId}-description`}>
                    Description{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <textarea
                    id={`${fieldId}-description`}
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="What’s this program about?"
                    className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                  />
                </div>
              </EditSection>
              <div className="border-t" />
              <EditSection
                title="Study plan"
                description="Set your credit goal and where you are in your program."
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid content-start gap-2">
                    <Label htmlFor={`${fieldId}-semesters`}>
                      Total {studyPeriodLabelPlural.toLowerCase()}
                    </Label>
                    <Input
                      id={`${fieldId}-semesters`}
                      name="semesters"
                      type="number"
                      min="1"
                      value={semesters}
                      onChange={(e) => setSemesters(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid content-start gap-2">
                    <Label htmlFor={`${fieldId}-current`}>
                      Current {getStudyPeriodLabel(preferences)}
                    </Label>
                    <Input
                      id={`${fieldId}-current`}
                      type="number"
                      min="1"
                      max={Number(semesters) || undefined}
                      value={currentSemester}
                      onChange={(e) => setCurrentSemester(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`${fieldId}-credits`}>
                    Credit goal (ECTS)
                  </Label>
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
                  <p className="text-xs leading-5 text-muted-foreground">
                    Total credits needed to complete this program.
                  </p>
                </div>
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
                      Mark program as completed
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      Show this study track as finished in your overview.
                    </span>
                  </span>
                </label>
              </EditSection>
            </fieldset>
          </div>
          <DialogFooter className="shrink-0 flex-row flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-6 py-4 sm:justify-between">
            <DeleteRecordButton
              disabled={submitting}
              kind="program"
              name={program.name}
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
              <Button type="submit" disabled={submitting || !degree}>
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
