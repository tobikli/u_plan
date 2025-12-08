"use client";

import { IconCertificate } from "@tabler/icons-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { StudyProgram } from "@/types/study-program";
import { StudyForm } from "./study-form";
import Link from "next/link";
import { useData } from "@/lib/data-provider";
import CenteredSpinner from "@/components/ui/centered-spinner";
import { Badge } from "@/components/ui/badge";

export default function Page() {
  const { studyPrograms, loading } = useData();

  if (loading) return <CenteredSpinner />;

  if (!studyPrograms || studyPrograms.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <Empty className="w-full max-w-xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconCertificate />
            </EmptyMedia>
            <EmptyTitle>No Programs added yet</EmptyTitle>
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
      <div className="flex ">
        <h1 className="w-full text-xl font-semibold">Study Programs</h1>
        <StudyForm />
      </div>
      <div className="grid gap-3">
        {studyPrograms
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .map((program: StudyProgram) => (
            <Link
              key={program.id}
              href={`/app/programs/${program.id}`}
              className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm w-full block hover:border-primary/60 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <IconCertificate className="h-4 w-4" />
                  <h2 className="text-sm font-regular">{program.degree}</h2>
                  <h2 className="text-sm font-semibold">{program.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={program.finished ? "default" : "secondary"}
                    className={program.finished ? "bg-green-500 text-white" : ""}
                  >
                    {program.finished ? "Finished" : "In progress"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(program.created_at).toLocaleDateString()}
                  </span>
                </div>
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
