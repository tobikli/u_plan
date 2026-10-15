"use client";
import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, LoaderCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CatalogCombobox } from "./catalog-combobox";
import { fetchCatalog } from "./catalog-query";
import type {
  University,
  UniversityCatalog,
  UniversityLink,
  UniversityProgram,
} from "@/types/university";

export function ProgramTemplatePicker({
  value,
  onChange,
  onApply,
}: {
  value: UniversityLink | null;
  onChange: (value: UniversityLink | null) => void;
  onApply: (program: UniversityProgram, university: University) => void;
}) {
  const id = useId();
  const [enabled, setEnabled] = useState(Boolean(value));
  const [universityId, setUniversityId] = useState(value?.university_id ?? "");
  const universities = useQuery({
    queryKey: ["university-catalog", "universities"],
    queryFn: ({ signal }) =>
      fetchCatalog<{ items: University[] }>("/api/universities", signal),
    enabled,
    staleTime: 86_400_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  });
  const programs = useQuery({
    queryKey: ["university-catalog", universityId, "programs"],
    queryFn: ({ signal }) =>
      fetchCatalog<UniversityCatalog<UniversityProgram>>(
        `/api/universities/${universityId}/programs`,
        signal,
      ),
    enabled: enabled && Boolean(universityId),
    staleTime: 86_400_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: false,
  });
  const error = universities.error ?? programs.error;
  return (
    <div className="space-y-4 rounded-xl border bg-muted/15 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label htmlFor={`${id}-enabled`}>
            Use a university template{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Fill program details from a university catalogue and enable module
            suggestions. You can edit all details.
          </p>
        </div>
        <Checkbox
          id={`${id}-enabled`}
          checked={enabled}
          onCheckedChange={(next) => {
            setEnabled(next === true);
            if (!next) {
              onChange(null);
              setUniversityId("");
            }
          }}
        />
      </div>
      {enabled && (
        <div className="space-y-4 border-t pt-4">
          <div className="grid gap-2">
            <Label htmlFor={`${id}-university`}>University</Label>
            <Select
              value={universityId}
              onValueChange={(next) => {
                setUniversityId(next);
                onChange(null);
              }}
            >
              <SelectTrigger id={`${id}-university`} className="w-full min-w-0">
                <SelectValue placeholder="Choose a university" />
              </SelectTrigger>
              <SelectContent>
                {universities.data?.items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {universityId && (
            <div className="grid gap-2">
              <Label htmlFor={`${id}-program`}>University program</Label>
              <CatalogCombobox
                id={`${id}-program`}
                label="Search study programs"
                value={value?.university_program_id ?? ""}
                disabled={programs.isPending}
                items={(programs.data?.items ?? []).map((item) => ({
                  id: item.id,
                  label: `${item.name} · ${item.degreeLabel}`,
                  detail: [
                    `Curriculum ${item.version || item.id}`,
                    item.credits !== null ? `${item.credits} ECTS` : null,
                    item.semesters ? `${item.semesters} semesters` : null,
                    `ID ${item.id}`,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                }))}
                onSelect={(selected) => {
                  const program = programs.data?.items.find(
                    (item) => item.id === selected,
                  );
                  const university = universities.data?.items.find(
                    (item) => item.id === universityId,
                  );
                  if (program && university) {
                    onChange({
                      university_id: universityId,
                      university_program_id: program.id,
                    });
                    onApply(program, university);
                  }
                }}
              />
            </div>
          )}
          {(universities.isFetching || programs.isFetching) && (
            <p
              role="status"
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <LoaderCircle
                aria-hidden="true"
                className="size-3 animate-spin"
              />
              Loading university catalogue…
            </p>
          )}
          {error && (
            <div role="alert" className="space-y-2 text-xs leading-5">
              <p>{error.message} You can continue with manual entry.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (universities.error) void universities.refetch();
                  if (programs.error) void programs.refetch();
                }}
              >
                Try again
              </Button>
            </div>
          )}
          {value && (
            <p className="text-xs leading-5 text-muted-foreground">
              Linked to curriculum {value.university_program_id}.{" "}
              {programs.data?.items.find(
                (item) => item.id === value.university_program_id,
              ) && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={
                    programs.data.items.find(
                      (item) => item.id === value.university_program_id,
                    )!.sourceUrl
                  }
                  className="inline-flex items-center gap-1 underline underline-offset-4"
                >
                  View on TUMonline
                  <ExternalLink aria-hidden="true" className="size-3" />
                </a>
              )}{" "}
              Turning off the template keeps your entered details and courses.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
