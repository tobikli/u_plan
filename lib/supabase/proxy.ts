import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { preserveAuthResponse } from "@/lib/auth-response";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  // One server client per request, never shared between users.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          const previousResponse = supabaseResponse;
          supabaseResponse = preserveAuthResponse(
            previousResponse,
            NextResponse.next({ request }),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          supabaseResponse.headers.set("Cache-Control", "private, no-store");
          Object.entries(headers).forEach(([name, value]) =>
            supabaseResponse.headers.set(name, value),
          );
        },
      },
    },
  );
  // Verify identity and refresh the session before doing any protected work.
  const { data, error } = await supabase.auth.getClaims();
  const protectedRoute =
    request.nextUrl.pathname === "/app" ||
    request.nextUrl.pathname.startsWith("/app/");
  if (protectedRoute)
    supabaseResponse.headers.set("Cache-Control", "private, no-store");
  if (protectedRoute && (error || !data?.claims)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "";
    return preserveAuthResponse(supabaseResponse, NextResponse.redirect(url));
  }
  return supabaseResponse;
}
