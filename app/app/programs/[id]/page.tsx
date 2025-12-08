"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import type { StudyProgram } from "@/types/study-program";
import { useData } from "@/lib/data-provider";
import { ProgramForm } from "./program-form";
import { CourseTable } from "./courses";
import { columns } from "./columns";
import { CourseForm } from "./course-form";
import CenteredSpinner from "@/components/ui/centered-spinner";
import { CircularProgress } from "@/components/customized/progress/progress-08";
import { Button } from "@/components/ui/button";
import { IconPlus, IconMinus } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export default function StudyDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { studyPrograms, courses, loading } = useData();

  const program = useMemo(
    () => studyPrograms.find((p) => p.id === params.id),
    [studyPrograms, params.id]
  ) as StudyProgram | undefined;

  const programCourses = useMemo(
    () => courses.filter((c) => c.program_id === params.id),
    [courses, params.id]
  );

  const currentCredits = useMemo(
    () => programCourses.reduce((sum, course) => sum + course.credits, 0),
    [programCourses]
  );

  const progressPercent = useMemo(() => {
    if (!program?.credits || program.credits <= 0) return 0;
    const ratio = (currentCredits / program.credits) * 100;
    return Math.min(100, Math.max(0, Math.round(ratio)));
  }, [program, currentCredits]);

  const averageGrade = useMemo(() => {
    if (programCourses.length === 0) return 0;
    const relevantCourses = programCourses.filter(
      (course) => course.grade !== null && course.credits > 0
    );
    const totalWeightedGrades = relevantCourses.reduce(
      (sum, course) => sum + course.grade! * course.credits,
      0
    );
    const totalCredits = relevantCourses.reduce(
      (sum, course) => sum + course.credits,
      0
    );
    if (totalCredits === 0) return 0;
    return totalWeightedGrades / totalCredits;
  }, [programCourses]);

  if (loading) {
    return <CenteredSpinner />;
  }

  if (!program) {
    return null; // render nothing while redirecting
  }

  if (currentCredits >= program.credits && !program.finished) {
    toast.success(
      `Congratulations! You have completed the required credits for the program "${program.name}".`
    );
    const updateProgram = async () => {
      const supabase = createClient();
      const { data: userResult, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userResult.user) {
        toast.error("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("study_programs")
        .update({ finished: true })
        .eq("user_id", userResult.user.id)
        .eq("id", program!.id);

      if (error) {
        toast.error(error.message ?? "Failed to update program status");
        return;
      }
    };
    updateProgram();
  }

  const updateSemester = async (newSemester: number) => {
    const supabase = createClient();
    const { data: userResult, error: userError } =
      await supabase.auth.getUser();
    if (userError || !userResult.user) {
      toast.error("Not authenticated");
      return;
    }

    const { error } = await supabase
      .from("study_programs")
      .update({ current_semester: newSemester })
      .eq("user_id", userResult.user.id)
      .eq("id", program.id);

    if (error) {
      toast.error(error.message ?? "Failed to update semester");
      return;
    }

    router.refresh();
  };

  const increaseSemester = () => {
    if (program.current_semester < program.semesters) {
      updateSemester(program.current_semester + 1);
      toast.success("Yay, you advanced a semester!");
    }
  };

  const decreaseSemester = () => {
    if (program.current_semester > 1) {
      updateSemester(program.current_semester - 1);
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{program.degree}</p>
          <h1 className="text-2xl font-semibold leading-tight">
            {program.name}
          </h1>
          <p className="text-sm text-muted-foreground">{program.institution}</p>
        </div>
        <ProgramForm program={program} />
      </div>
      <div className="grid gap-3 grid-cols-3">
        <div className="rounded-md border p-3 text-sm">
          <p className="text-muted-foreground">Semester</p>
          <div className="flex">
            <p className="font-medium">
              {program.current_semester + "/" + program.semesters}
            </p>
            <span className="w-full"></span>
            <div className=" flex gap-2">
              <Button
                onClick={decreaseSemester}
                className="size-7"
                variant="outline"
                disabled={program.current_semester <= 1}
              >
                <IconMinus />
              </Button>
              <Button
                onClick={increaseSemester}
                className="size-7"
                variant="outline"
                disabled={program.current_semester >= program.semesters}
              >
                <IconPlus />
              </Button>
            </div>
          </div>
        </div>
        <Info label="Credits (total)" value={program.credits} />
        <Info label="Finished" value={program.finished ? "Yes" : "No"} />
      </div>
      <div className="rounded-md border p-3 text-sm">
        <p className="text-muted-foreground">Progress</p>
        <div className=" grid grid-cols-2">
          <CircularProgress
            value={progressPercent}
            size={120}
            strokeWidth={10}
            showLabel
            renderLabel={(v) => `${v}%`}
            labelClassName="text-xl font-bold"
            className=""
          />
          <div className="flex items-center justify-center">
            <p className="text-2xl font-semibold border rounded-xl p-5">
              {" "}
              {currentCredits} / {program.credits} Credits
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-md border p-3 text-sm">
        <p className="text-muted-foreground">Grade</p>
        <p className="text-center p-3 align-middle text-xl font-semibold flex items-center justify-center">
          {averageGrade.toFixed(2)}
        </p>
      </div>
      {program.description && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Description</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {program.description}
          </p>
        </div>
      )}
      <hr />
      <div className="flex">
        <h1 className="text-xl font-semibold w-full">Courses</h1>
        <CourseForm program={program} />
      </div>
      <CourseTable
        columns={columns}
        data={programCourses}
        getRowHref={(course) => `/app/courses/${course.id}`}
      />
    </div>
  );
}
