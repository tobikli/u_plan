import { NextResponse } from "next/server";
import { catalogAccess, catalogError } from "@/lib/universities/api";
import { getTumPrograms, getTumCourses } from "@/lib/universities/tum";
export const maxDuration = 60;
export async function GET(
  request: Request,
  { params }: { params: Promise<{ universityId: string; programId: string }> },
) {
  const { universityId, programId } = await params;
  const pageRaw = new URL(request.url).searchParams.get("page") ?? "1";
  if (!/^[1-9][0-9]?$|^100$/.test(pageRaw))
    return NextResponse.json(
      { error: "Invalid curriculum page." },
      { status: 400 },
    );
  const page = Number(pageRaw);
  const access = await catalogAccess(universityId);
  if (access.response) return access.response;
  if (!/^\d{1,10}$/.test(programId))
    return NextResponse.json(
      { error: "Invalid curriculum ID." },
      { status: 400 },
    );
  try {
    const catalogue = await getTumPrograms();
    const program = catalogue.items.find((item) => item.id === programId);
    if (!program)
      return NextResponse.json(
        {
          error:
            "This curriculum is not in TUMonline’s current program catalogue. Choose a different template in the program settings.",
        },
        { status: 404 },
      );
    return NextResponse.json(
      await getTumCourses(program.id, program.academicYear, page),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return catalogError(error);
  }
}
