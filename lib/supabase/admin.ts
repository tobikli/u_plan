import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client with service role privileges.
 * 
 * **WARNING**: This client bypasses Row Level Security (RLS) policies.
 * Only use this client for administrative operations that require elevated privileges,
 * such as deleting user accounts.
 * 
 * This should ONLY be used in server-side code (API routes, server actions).
 * NEVER expose this client to the browser.
 * 
 * @returns A Supabase client with admin privileges
 * @throws Will throw an error if required environment variables are not set
 * 
 * @example
 * ```ts
 * // In a server-side API route
 * const adminClient = createAdminClient();
 * await adminClient.auth.admin.deleteUser(userId);
 * ```
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    const missing = [];
    if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!serviceRoleKey) missing.push("SERVICE_ROLE_KEY");
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
