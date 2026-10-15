import "server-only";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function catalogAccess(universityId?: string) {
  const client = await createClient();
  const { data, error } = await client.auth.getClaims();
  if (error || !data?.claims)
    return {
      response: NextResponse.json(
        { error: "Please sign in to use university templates." },
        { status: 401 },
      ),
    };
  if (universityId) {
    if (universityId !== "tum")
      return {
        response: NextResponse.json(
          { error: "University not supported." },
          { status: 404 },
        ),
      };
    const { data: university, error } = await client
      .from("universities")
      .select("id")
      .eq("id", universityId)
      .maybeSingle();
    if (error)
      return {
        response: NextResponse.json(
          { error: "Could not load universities." },
          { status: 503 },
        ),
      };
    if (!university)
      return {
        response: NextResponse.json(
          { error: "University not found." },
          { status: 404 },
        ),
      };
  }
  return { client };
}
export function catalogError(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof Error && error.name !== "TimeoutError"
          ? error.message
          : "TUMonline could not be reached. Please try again later or continue with manual entry.",
    },
    { status: 502, headers: { "Cache-Control": "private, no-store" } },
  );
}
