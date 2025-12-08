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

export function CourseForm({ course }: { course: Course }) {
  const [semester, setSemester] = useState(course.semesters.toString());
  const [name, setName] = useState(course.name);
  const [code, setCode] = useState(course.course_code);
  const [grade, setGrade] = useState(course.grade?.toString());
  const [credits, setCredits] = useState(course.credits.toString());
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const {
    studyPrograms,
    loading: loadingPrograms,
    refreshStudyPrograms,
    refreshCourses,
  } = useData();
  const [programId, setProgramId] = useState(course.program_id);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);

      const name = form.get("name")?.toString().trim() ?? "";
      const course_code = form.get("code")?.toString().trim() ?? "";
      const semestersRaw = form.get("semester")?.toString().trim() ?? "";
      const creditsRaw = form.get("credits")?.toString().trim() ?? "";
      const gradeRaw = form.get("grade")?.toString().trim() ?? "";
      const finishedRaw = form.get("finished")?.toString().trim() ?? "";
      const programId = form.get("program")?.toString().trim() ?? "";
      const finished = finishedRaw === "on" ? true : false;

      const grade = gradeRaw ? Number(gradeRaw) : null;
      const semesters = Number(semestersRaw);
      const credits = Number(creditsRaw);

      if (!course_code) {
        toast.error("Select a code");
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
        .from("courses")
        .update({
          user_id: userResult.user.id,
          program_id: programId,
          course_code,
          name,
          grade,
          semesters,
          credits,
          finished,
        })
        .eq("id", course.id);

      if (insertError) {
        toast.error(insertError.message ?? "Failed to save program");
        return;
      }

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
        .from("courses")
        .delete()
        .eq("user_id", userResult.user.id)
        .eq("id", course.id);

      if (deleteError) {
        toast.error(deleteError.message ?? "Failed to delete course");
        return;
      }

      toast.success("Course deleted");
      refreshStudyPrograms();
      refreshCourses();

      router.push("/app/courses");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Course</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] ">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 my-5">
            <div className="grid gap-3">
              <Label htmlFor="program">Program</Label>
              <Select
                value={programId}
                onValueChange={setProgramId}
                disabled={loadingPrograms || studyPrograms.length === 0}
              >
                <SelectTrigger className="w-full justify-between">
                  <SelectValue
                    placeholder={
                      loadingPrograms ? "Loading..." : "Select a program"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {studyPrograms.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="program" value={programId} />
            </div>

            <div className="flex gap-3">
              <div className="grid gap-3">
                <Label htmlFor="code">Code</Label>
                <Input
                  className="max-w-40"
                  id="code"
                  name="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3 w-full">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                type="number"
                inputMode="numeric"
                min="0"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                name="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
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
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  className="bg-red-500 hover:bg-red-700 text-white"
                >
                  Delete Course
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes this course and its data. This
                    action cannot be undone.
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
              {submitting ? "Saving..." : "Save Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
