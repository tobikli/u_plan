import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "../types/course";
import type { Examination } from "../types/examination";
import type { Preferences } from "../types/preferences";
import type { StudyProgram } from "../types/study-program";

export type WorkspaceData = {
  courses: Course[];
  examinations: Examination[];
  study_programs: StudyProgram[];
  preferences: Preferences | null;
};
export const workspaceTables = [
  "courses",
  "study_programs",
  "preferences",
  "examinations",
] as const;
export type WorkspaceTable = (typeof workspaceTables)[number];
export type InitialWorkspace = {
  userId: string;
  data: Partial<WorkspaceData>;
  fetchedAt: number;
};
export const workspaceKey = (userId: string | null, table: WorkspaceTable) =>
  ["workspace", userId, table] as const;
const courseFields =
  "id,course_code,name,credits,grade,program_id,semesters,finished,tags,user_id,created_at,updated_at";

/** Supabase limits responses; fetch every page so dashboard totals remain accurate. */
export async function readAllPages<T>(
  readPage: (from: number, to: number) => Promise<T[]>,
  pageSize = 500,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await readPage(from, from + pageSize - 1);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export async function fetchWorkspaceTable<T extends WorkspaceTable>(
  client: SupabaseClient,
  userId: string,
  table: T,
  signal?: AbortSignal,
): Promise<WorkspaceData[T]> {
  if (table === "preferences") {
    let query = client.from("preferences").select("*").eq("user_id", userId);
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(`Could not load preferences: ${error.message}`);
    return data as WorkspaceData[T];
  }
  const rows = await readAllPages(async (from, to) => {
    let query = client
      .from(table)
      .select(table === "courses" ? courseFields : "*")
      .eq("user_id", userId)
      .order("id")
      .range(from, to)
      .returns<Record<string, unknown>[]>();
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query;
    if (error)
      throw new Error(
        `Could not load ${table.replaceAll("_", " ")}: ${error.message}`,
      );
    return data ?? [];
  });
  // Keep stable display order without using mutable timestamps as pagination cursors.
  rows.sort((a, b) =>
    table === "examinations"
      ? String(a.exam_date ?? "9999").localeCompare(
          String(b.exam_date ?? "9999"),
        ) || String(a.created_at).localeCompare(String(b.created_at))
      : String(b.created_at).localeCompare(String(a.created_at)),
  );
  return rows as unknown as WorkspaceData[T];
}
