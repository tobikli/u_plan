"use client";

import { useState } from "react";
import { Check, LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useData } from "@/lib/data-provider";
import type { Course } from "@/types/course";
import { toast } from "sonner";

export function CourseCompletionButton({ course }: { course: Course }) {
  const [pending, setPending] = useState(false);
  const { refreshCourses } = useData();
  const update = async () => {
    if (pending) return;
    setPending(true);
    try {
      const client = createClient();
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser();
      if (authError || !user) {
        toast.error("Please log in again to update this course");
        return;
      }
      const { error } = await client
        .from("courses")
        .update({ finished: !course.finished })
        .eq("id", course.id)
        .eq("user_id", user.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      await refreshCourses();
      toast.success(
        course.finished ? "Course reopened" : "Course marked as completed",
      );
    } catch {
      toast.error("Could not update course completion. Please try again.");
    } finally {
      setPending(false);
    }
  };
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      aria-label={`${course.finished ? "Reopen" : "Complete"} ${course.name}`}
      onClick={(event) => {
        event.stopPropagation();
        void update();
      }}
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : course.finished ? (
        <RotateCcw aria-hidden="true" />
      ) : (
        <Check aria-hidden="true" />
      )}
      {course.finished ? "Reopen" : "Mark completed"}
    </Button>
  );
}
