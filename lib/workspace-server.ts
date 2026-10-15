import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchWorkspaceTable,
  workspaceTables,
  type InitialWorkspace,
  type WorkspaceData,
} from "./workspace-data";

/** Called with this request's authenticated client; never cached across accounts. */
export async function loadWorkspace(
  client: SupabaseClient,
  userId: string,
): Promise<InitialWorkspace> {
  const results = await Promise.allSettled(
    workspaceTables.map(
      async (table) =>
        [table, await fetchWorkspaceTable(client, userId, table)] as const,
    ),
  );
  const data: Partial<WorkspaceData> = {};
  for (const result of results) {
    if (result.status === "fulfilled")
      Object.assign(data, { [result.value[0]]: result.value[1] });
    // Failed datasets are retried by the client and shown through the query error state.
  }
  return { userId, data, fetchedAt: Date.now() };
}
