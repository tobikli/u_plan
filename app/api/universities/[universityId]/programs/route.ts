import { NextResponse } from "next/server";
import { catalogAccess, catalogError } from "@/lib/universities/api";
import { getTumPrograms } from "@/lib/universities/tum";
export const maxDuration = 60;
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ universityId: string }> },
) {
  const { universityId } = await params;
  const access = await catalogAccess(universityId);
  if (access.response) return access.response;
  try {
    return NextResponse.json(await getTumPrograms(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return catalogError(error);
  }
}
