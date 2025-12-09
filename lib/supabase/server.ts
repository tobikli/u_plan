import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for use in server-side components and API routes.
 * This client uses Next.js cookies for session management.
 * 
 * **Important**: With Fluid compute, don't store this client in a global variable.
 * Always create a new client within each function when using it.
 * 
 * @returns A Promise that resolves to a Supabase client configured for server usage
 * 
 * @example
 * ```ts
 * // In a Server Component or API route
 * const supabase = await createClient();
 * const { data, error } = await supabase.from('table').select();
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
}
