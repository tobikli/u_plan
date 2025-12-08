"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DegreeDrop } from "./components/degreedrop";
import type { degreeType } from "@/types/study-program";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";


export function StudyForm() {
  const [degree, setDegree] = useState<degreeType | "">("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
        .insert({
          user_id: userResult.user.id,
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

  

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">New Study Program</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] ">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Study Program</DialogTitle>
            <DialogDescription>
              Create your current or future study program here.
            </DialogDescription>
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
                  placeholder="6"
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
              <Input id="name" name="name" placeholder="Computer Science" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                name="institution"
                placeholder="Technical University of Munich"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="credits">Credits / ECTS</Label>
              <Input
                id="credits"
                name="credits"
                placeholder="180"
                type="number"
                inputMode="numeric"
                min="0"
                required
              />
            </div>
          </div>

          <DialogFooter>
            
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
