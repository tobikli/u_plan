import { notFound, redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { StudyProgram } from "@/types/study-program"
import { ProgramForm } from "./program-form";
import CoursesView from "./courses";

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

export default async function StudyDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data, error } = await supabase
    .from("study_programs")
    .select(
      "id, user_id, name, degree, institution, semesters, current_semester, finished, credits, description, created_at, updated_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !data) {
    notFound()
  }

  const program = data as StudyProgram

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{program.degree}</p>
          <h1 className="text-2xl font-semibold leading-tight">{program.name}</h1>
          <p className="text-sm text-muted-foreground">{program.institution}</p>
        </div>
        <ProgramForm program={program} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Info label="Semesters" value={program.semesters} />
        <Info label="Current semester" value={program.current_semester} />
        <Info label="Credits (total)" value={program.credits} />
        <Info label="Finished" value={program.finished ? "Yes" : "No"} />
      </div>

      {program.description && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Description</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {program.description}
          </p>
        </div>
      )}
      <CoursesView programId={program.id} />
    </div>
  )
}
