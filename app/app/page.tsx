"use client";
import { Dashboard } from "@/components/dashboard/dashboard";
import { useData } from "@/lib/data-provider";
import { Skeleton } from "@/components/ui/skeleton";
export default function Page() {
  const { courses, studyPrograms, preferences, loading, error } = useData();
  if (loading)
    return (
      <div
        role="status"
        aria-label="Loading dashboard"
        className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8"
      >
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
        <span className="sr-only">Loading your studies…</span>
      </div>
    );
  return (
    <>
      {error && (
        <p
          role="alert"
          className="mx-5 mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          Some study data could not be loaded. Please refresh to try again.
        </p>
      )}
      <Dashboard
        courses={courses}
        studyPrograms={studyPrograms}
        preferences={preferences}
      />
    </>
  );
}
