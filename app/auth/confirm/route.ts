import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { authOrigin, safeAuthPath } from "@/lib/auth-redirect";
import { privateAuthHeaders } from "@/lib/auth-response";

const emailTypes = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = authOrigin(
    request.url,
    process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL,
  );
  const next = safeAuthPath(searchParams.get("next"), origin);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (token_hash && type && emailTypes.has(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error)
      return NextResponse.redirect(new URL(next, origin), {
        headers: privateAuthHeaders,
      });
  }
  return NextResponse.redirect(
    new URL("/auth/error?error=Unable%20to%20verify%20this%20link", origin),
    { headers: privateAuthHeaders },
  );
}
