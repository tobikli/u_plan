"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DegreeDrop } from "../components/degreedrop";
import type { degreeType } from "@/types/study-program";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { StudyProgram } from "@/types/study-program";
import { useData } from "@/lib/data-provider";

export function ProgramForm({ program }: { program: StudyProgram }) {
  const [degree, setDegree] = useState<degreeType | "">(program.degree);
  const [semesters, setSemesters] = useState(program.semesters.toString());
  const [name, setName] = useState(program.name);
  const [institution, setInstitution] = useState(program.institution);
  const [credits, setCredits] = useState(program.credits.toString());
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { refreshStudyPrograms } = useData();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
        toast.error("Semesters must be a positive number");
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
        .update({
          user_id: userResult.user.id,
          degree,
          name,
          institution,
          semesters,
          credits,
          current_semester: 1,
          finished: false,
          description: description || null,
        })
        .eq("id", program.id);

      if (insertError) {
        toast.error(insertError.message ?? "Failed to save program");
        return;
      }

      setDegree("");
      setOpen(false);
      toast.success("Study program updated!");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error while saving");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudyDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { data: userResult, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userResult.user) {
        toast.error("Not authenticated");
        return;
      }

      const { error: deleteError } = await supabase
        .from("study_programs")
        .delete()
        .eq("user_id", userResult.user.id)
        .eq("id", program.id);

      if (deleteError) {
        toast.error(deleteError.message ?? "Failed to delete program");
        return;
      }

      toast.success("Study program deleted");
      refreshStudyPrograms();
      router.push("/app/programs");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Study Program</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] ">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Study Program</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 my-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-3">
                <Label htmlFor="degree">Degree</Label>
                <DegreeDrop
                  value={degree}
                  onChange={setDegree}
                  className="w-full"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="semesters">Semesters</Label>
                <Input
                  id="semesters"
                  name="semesters"
                  value={semesters}
                  onChange={(e) => setSemesters(e.target.value)}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  required
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                name="institution"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="credits">Credits / ECTS</Label>
              <Input
                id="credits"
                name="credits"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                type="number"
                inputMode="numeric"
                min="0"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  className="bg-red-500 hover:bg-red-700 text-white"
                >
                  Delete Program
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Program?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes this program and its courses. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 hover:bg-red-700 text-white"
                    onClick={handleStudyDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <span className="w-full"></span>

            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Program"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
