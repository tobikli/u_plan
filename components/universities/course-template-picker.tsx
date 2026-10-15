"use client";
import { useEffect, useId, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CatalogCombobox } from "./catalog-combobox";
import { fetchCatalog } from "./catalog-query";
import { mergeUniversityCourses as mergeTumModules } from "@/lib/universities/catalog";
import type {
  UniversityCourse,
  UniversityCoursePage,
} from "@/types/university";
import type { StudyProgram } from "@/types/study-program";

export function CourseTemplatePicker({
  program,
  onApply,
}: {
  program: StudyProgram;
  onApply: (course: UniversityCourse) => void;
}) {
  const id = useId();
  const [enabled, setEnabled] = useState(false);
  const [selected, setSelected] = useState("");
  const query = useInfiniteQuery({
    queryKey: [
      "university-catalog",
      program.university_id,
      program.university_program_id,
      "courses",
    ],
    initialPageParam: 1,
    queryFn: ({ signal, pageParam }) =>
      fetchCatalog<UniversityCoursePage>(
        `/api/universities/${program.university_id}/programs/${program.university_program_id}/courses?page=${pageParam}`,
        signal,
      ),
    getNextPageParam: (last) => last.nextPage ?? undefined,
    enabled:
      enabled &&
      Boolean(program.university_id && program.university_program_id),
    staleTime: 86_400_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: false,
  });
  const { hasNextPage, isFetching, isError, fetchNextPage } = query;
  useEffect(() => {
    if (enabled && hasNextPage && !isFetching && !isError) void fetchNextPage();
  }, [enabled, hasNextPage, isFetching, isError, fetchNextPage]);
  const items = mergeTumModules(
    query.data?.pages.map((page) => page.items) ?? [],
  );
  const last = query.data?.pages.at(-1);
  return (
    <details
      className="rounded-xl border bg-muted/15"
      onToggle={(event) => setEnabled(event.currentTarget.open)}
    >
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
        Choose from the university catalogue{" "}
        <span className="text-xs font-normal text-muted-foreground">
          (optional)
        </span>
      </summary>
      <div className="space-y-3 border-t p-4">
        <p className="text-xs leading-5 text-muted-foreground">
          TUM modules for this program’s curriculum. Selecting one fills the
          name, module code, and available ECTS. All fields remain editable.
        </p>
        <Label htmlFor={id}>University module</Label>
        <CatalogCombobox
          id={id}
          label="Search modules"
          value={selected}
          disabled={query.isPending}
          items={items.map((item) => ({
            id: item.id,
            label: `${item.code} · ${item.name}`,
            detail:
              item.credits !== null
                ? `${item.credits} ECTS`
                : "ECTS unavailable — enter manually",
          }))}
          onSelect={(value) => {
            const item = items.find((item) => item.id === value);
            if (item) {
              setSelected(value);
              onApply(item);
            }
          }}
        />
        {(query.isFetching || (query.hasNextPage && !query.isError)) && (
          <p
            role="status"
            className="flex items-center gap-2 text-xs leading-5 text-muted-foreground"
          >
            <LoaderCircle
              aria-hidden="true"
              className="size-3 shrink-0 animate-spin"
            />
            {last
              ? `Loading modules: ${last.loadedThrough} of ${last.totalPages} curriculum pages loaded.`
              : "Loading modules from TUMonline…"}{" "}
            You can continue with manual entry.
          </p>
        )}
        {query.error && (
          <div role="alert" className="space-y-2 text-xs leading-5">
            <p>{query.error.message} You can add your course manually.</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (query.hasNextPage) void query.fetchNextPage();
                else void query.refetch();
              }}
            >
              Try again
            </Button>
          </div>
        )}
        {query.data && !items.length && !query.hasNextPage && (
          <p className="text-xs text-muted-foreground">
            No modules are listed for this curriculum. Continue with manual
            entry.
          </p>
        )}
        {last && !query.hasNextPage && (
          <p className="text-[11px] text-muted-foreground">
            {items.length} modules · Retrieved{" "}
            {new Date(last.fetchedAt).toLocaleDateString()}
          </p>
        )}
        {selected && (
          <p className="text-xs text-muted-foreground">
            Details filled from module {selected}.{" "}
            <a
              href={items.find((item) => item.id === selected)?.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              View source
            </a>
          </p>
        )}
      </div>
    </details>
  );
}
