import { NextResponse } from "next/server";
import { catalogAccess } from "@/lib/universities/api";
export async function GET() {
  const access = await catalogAccess();
  if (access.response) return access.response;
  const { data, error } = await access.client
    .from("universities")
    .select("id,name,website")
    .order("name");
  if (error)
    return NextResponse.json(
      { error: "Could not load universities." },
      { status: 503 },
    );
  return NextResponse.json(
    { items: data ?? [] },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
