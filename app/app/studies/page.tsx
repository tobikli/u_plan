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
import { StudyForm } from "./studyform";
import Link from "next/link";

export default async function Page() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/auth/login");
  }

  const userId = userData.user.id;

  const { data: programs, error } = await supabase
    .from("study_programs")
    .select(
      "id, user_id, name, degree, institution, semesters, current_semester, finished, credits, description, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    // Surface a simple fallback; in production you might log this.
    return (
      <div className="p-4 text-sm text-red-600">
        Failed to load programs. {error.message}
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
            <EmptyTitle>No studies added yet</EmptyTitle>
            <EmptyDescription>
              Create your first study program to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <StudyForm />
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-4 m-10">
      <div className="flex gap-48">
        <h1 className="w-full text-xl font-semibold">Study Programs</h1>
        <StudyForm />
      </div>
      <div className="grid gap-3">
        {programs
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .map((program: StudyProgram) => (
            <Link
              key={program.id}
              href={`/app/studies/${program.id}`}
              className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm w-full block hover:border-primary/60 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <IconCertificate className="h-4 w-4" />
                  <h2 className="text-sm font-regular">{program.degree}</h2>
                  <h2 className="text-sm font-semibold">{program.name}</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(program.created_at).toLocaleDateString()}
                </span>
              </div>
              {program.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {program.description}
                </p>
              )}
            </Link>
          ))}
      </div>
    </div>
  );
}
