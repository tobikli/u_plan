"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Program = {
  id: string;
  name: string;
};

export function CourseForm() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("study_programs")
          .select("id, name")
          .order("created_at", { ascending: false });

        if (error) {
          console.error(error);
          toast.error("Failed to load programs");
          return;
        }

        setPrograms(data ?? []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load programs");
      } finally {
        setLoadingPrograms(false);
      }
    };

    loadPrograms();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);

      const name = form.get("name")?.toString().trim() ?? "";
      const course_code = form.get("code")?.toString().trim() ?? "";
      const gradeRaw = form.get("grade")?.toString().trim() ?? "";
      const semestersRaw = form.get("semester")?.toString().trim() ?? "";
      const creditsRaw = form.get("credits")?.toString().trim() ?? "";
      const finishedRaw = form.get("finished")?.toString().trim() ?? "";
      const program = form.get("program")?.toString().trim() ?? "";

      const finished = finishedRaw === "on" ? true : false;

      const grade = gradeRaw ? Number(gradeRaw) : null;
      const semesters = Number(semestersRaw);
      const credits = Number(creditsRaw);

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

      const { error: insertError } = await supabase.from("courses").insert({
        user_id: userResult.user.id,
        program_id: program,
        course_code,
        name,
        grade,
        semesters,
        credits,
        finished,
      });

      if (insertError) {
        toast.error(insertError.message ?? "Failed to save course");
        return;
      }

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">+</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] ">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Course</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 my-5">
            <div className="grid gap-3">
              <Label htmlFor="program">Program</Label>
              <select
                id="program"
                name="program"
                required
                disabled={loadingPrograms || programs.length === 0}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled selected>
                  {loadingPrograms ? "Loading..." : "Select a program"}
                </option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-3">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" placeholder="IN0001" required />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Introduction to Informatics"
                  required
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                name="credits"
                placeholder="6"
                type="number"
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                name="grade"
                placeholder="1.0"
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                name="semester"
                placeholder="1"
                type="number"
                inputMode="numeric"
                min="1"
                required
              />
            </div>

            <div className="flex items-center gap-3 my-2">
              <Checkbox id="finished" name="finished" />
              <Label htmlFor="finished">Finished?</Label>
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
