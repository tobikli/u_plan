import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authOrigin, safeAuthPath } from "@/lib/auth-redirect";
import { privateAuthHeaders } from "@/lib/auth-response";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = authOrigin(
    request.url,
    process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL,
  );
  const next = safeAuthPath(url.searchParams.get("next"), origin);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error)
        return NextResponse.redirect(new URL(next, origin), {
          headers: privateAuthHeaders,
        });
    } catch {
      // Do not include authorization codes or session details in logs.
    }
  }
  return NextResponse.redirect(new URL("/auth/auth-code-error", origin), {
    headers: privateAuthHeaders,
  });
}
