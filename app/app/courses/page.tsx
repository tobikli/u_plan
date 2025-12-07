import { IconCertificate } from "@tabler/icons-react";
import { redirect } from "next/navigation";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createClient } from "@/lib/supabase/server";
import type { StudyProgram } from "@/types/study-program";
import { CourseForm } from "./courseform";

export default async function Page() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/auth/login");
  }

  const userId = userData.user.id;

  const { data: programs, error } = await supabase
    .from("courses")
    .select(
      "id, user_id, name, degree, institution, semesters, current_semester, finished, credits, description, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    // Surface a simple fallback; in production you might log this.
    return (
      <div className="p-4 text-sm text-red-600">
        Failed to load courses. {error.message}
      </div>
    );
  }

  if (!programs || programs.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <Empty className="w-full max-w-xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconCertificate />
            </EmptyMedia>
            <EmptyTitle>No courses added yet</EmptyTitle>
            <EmptyDescription>
              Create your first study program to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CourseForm />
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-4 m-10">
      <h1 className="text-xl font-semibold">Study Programs</h1>
      <div className="grid gap-3">

      </div>
    </div>
  );
}
