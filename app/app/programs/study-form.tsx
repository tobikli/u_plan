"use client";

import { ProgramTemplatePicker } from "@/components/universities/program-template-picker";
import type { UniversityLink } from "@/types/university";
import { Plus, LoaderCircle } from "lucide-react";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { FormDialog } from "@/components/workspace/form-dialog";
import { EditSection } from "@/components/workspace/edit-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DegreeDrop } from "./components/degreedrop";
import type { degreeType } from "@/types/study-program";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useData } from "@/lib/data-provider";
import { getStudyPeriodLabel } from "@/lib/study-period";

export function StudyForm() {
  const fieldId = useId();
  const [template, setTemplate] = useState<UniversityLink | null>(null);
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [credits, setCredits] = useState("");
  const [semesters, setSemesters] = useState("");
  const [degree, setDegree] = useState<degreeType | "">("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { preferences, refreshStudyPrograms } = useData();
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

      const supabase = createClient();
      const { data: userResult, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userResult.user) {
        toast.error("Not authenticated");
        return;
      }

      const { error: insertError } = await supabase
        .from("study_programs")
        .insert({
          user_id: userResult.user.id,
          university_id: template?.university_id ?? null,
          university_program_id: template?.university_program_id ?? null,
          degree,
          name,
          institution,
          semesters,
          credits,
          current_semester: 1,
          finished: false,
          description: description || null,
        });

      if (insertError) {
        toast.error(insertError.message ?? "Failed to save program");
        return;
      }

      await refreshStudyPrograms();
      setDegree("");
      setOpen(false);
      toast.success("Study program created");
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
      setDegree("");
      setTemplate(null);
      setName("");
      setInstitution("");
      setCredits("");
      setSemesters("");
    }
    setOpen(next);
  };
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden="true" />
          Add a program
        </Button>
      </DialogTrigger>
      <FormDialog
        title="Add a study program"
        eyebrow="New study program"
        description="Set up your study track. You can add courses and update your progress at any time."
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
            <Button type="submit" disabled={submitting || !degree}>
              {submitting ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  Creating…
                </>
              ) : (
                "Create program"
              )}
            </Button>
          </>
        }
      >
        <ProgramTemplatePicker
          value={template}
          onChange={setTemplate}
          onApply={(program, university) => {
            setName(program.name);
            setDegree(program.degree);
            setInstitution(university.name);
            if (program.credits !== null) setCredits(String(program.credits));
            if (program.semesters !== null)
              setSemesters(String(program.semesters));
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
              placeholder="Computer Science"
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
              <Label htmlFor={`${fieldId}-institution`}>Institution</Label>
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
              rows={3}
              placeholder="What’s this program about?"
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            />
          </div>
        </EditSection>
        <div className="border-t" />
        <EditSection
          title="Study plan"
          description="Set your program’s length and credit goal."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid content-start gap-2">
              <Label htmlFor={`${fieldId}-semesters`}>
                Total {studyPeriodLabelPlural.toLowerCase()}
              </Label>
              <Input
                id={`${fieldId}-semesters`}
                name="semesters"
                value={semesters}
                onChange={(e) => setSemesters(e.target.value)}
                type="number"
                min="1"
                placeholder="6"
                required
              />
            </div>
            <div className="grid content-start gap-2">
              <Label htmlFor={`${fieldId}-credits`}>Credit goal (ECTS)</Label>
              <Input
                id={`${fieldId}-credits`}
                name="credits"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                type="number"
                min="0"
                step="0.5"
                placeholder="180"
                required
              />
            </div>
          </div>
          <p className="rounded-lg border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
            New programs start in {getStudyPeriodLabel(preferences)} 1. You can
            change your current study period in the program’s settings.
          </p>
        </EditSection>
      </FormDialog>
    </Dialog>
  );
}
