import type { WorkspaceData, WorkspaceTable } from "./workspace-data";

type Row = Record<string, unknown> & {
  id: string;
  user_id: string;
  updated_at?: string | null;
};
export type WorkspaceChange = {
  eventType: string;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

/** DELETE payloads contain only a primary key. Only remove IDs already in this account's cache. */
export function applyWorkspaceChange<T extends WorkspaceTable>(
  table: T,
  cached: WorkspaceData[T] | undefined,
  change: WorkspaceChange,
  userId: string,
): WorkspaceData[T] | undefined {
  if (cached === undefined) return cached;
  const rows = (
    Array.isArray(cached) ? cached : cached ? [cached] : []
  ) as Row[];
  if (change.eventType === "DELETE") {
    if (!rows.some((row) => row.id === change.old.id)) return cached;
    const remaining = rows.filter((row) => row.id !== change.old.id);
    return (
      table === "preferences" ? (remaining[0] ?? null) : remaining
    ) as WorkspaceData[T];
  }
  if (change.new.user_id !== userId || typeof change.new.id !== "string")
    return cached;
  const incoming = { ...change.new };
  // Notes have their own loader; never retain editor documents in the shared cache.
  if (table === "courses") delete incoming.editor_state;
  const previous = rows.find((row) => row.id === incoming.id);
  if (
    previous?.updated_at &&
    typeof incoming.updated_at === "string" &&
    Date.parse(previous.updated_at) > Date.parse(incoming.updated_at)
  )
    return cached;
  const next = previous
    ? rows.map((row) =>
        row.id === incoming.id ? { ...row, ...incoming } : row,
      )
    : [...rows, incoming];
  next.sort((a, b) =>
    table === "examinations"
      ? String(a.exam_date ?? "9999").localeCompare(
          String(b.exam_date ?? "9999"),
        ) || String(a.created_at).localeCompare(String(b.created_at))
      : String(b.created_at).localeCompare(String(a.created_at)),
  );
  return (
    table === "preferences" ? (next[0] ?? null) : next
  ) as WorkspaceData[T];
}
