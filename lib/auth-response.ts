import type { NextResponse } from "next/server";

export const privateAuthHeaders = {
  "Cache-Control": "private, no-store",
  Pragma: "no-cache",
  Expires: "0",
};

type AuthCookie = ReturnType<NextResponse["cookies"]["getAll"]>[number];
/** Keep refreshed/cleared session cookies when replacing a proxy response. */
export function preserveAuthResponse<
  T extends {
    headers: Headers;
    cookies: { set: (cookie: AuthCookie) => unknown };
  },
>(
  source: { headers: Headers; cookies: { getAll: () => AuthCookie[] } },
  target: T,
): T {
  for (const cookie of source.cookies.getAll()) target.cookies.set(cookie);
  for (const name of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(name);
    if (value) target.headers.set(name, value);
  }
  return target;
}
