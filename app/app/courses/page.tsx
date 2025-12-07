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
import type { Course } from "@/types/course";
import { CourseForm } from "./course-form";
import { CourseTable } from "./courses";
import { columns } from "./columns";

/* eslint-disable @typescript-eslint/no-explicit-any */

type CourseWithProgram = Course & { program_name?: string };

export default async function Page() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/auth/login");
  }

  const userId = userData.user.id;

  const { data: courses, error } = await supabase
    .from("courses")
    .select(
      "id, user_id, program_id, course_code, name, grade, semesters, credits, finished, created_at, updated_at, study_programs(name)"
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

  if (!courses || courses.length === 0) {
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

  const coursesWithProgram: CourseWithProgram[] = courses.map((course) => ({
    ...course,
    program_name: (course as any).study_programs?.name ?? undefined,
  }));

  return (
    <div className="space-y-4 m-10">
      <div className="flex">
        <h1 className="text-xl font-semibold w-full">Courses</h1>
        <CourseForm />
      </div>
      <CourseTable columns={columns} data={coursesWithProgram} />
    </div>
  );
}
