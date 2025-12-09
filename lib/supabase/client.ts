import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in client-side components.
 * This client uses the browser's cookie storage for session management.
 * 
 * @returns A Supabase client configured for browser usage
 * 
 * @example
 * ```tsx
 * const supabase = createClient();
 * const { data, error } = await supabase.from('table').select();
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
