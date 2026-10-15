import "server-only";
import { mergeUniversityCourses as mergeTumModules } from "./catalog";
import { unstable_cache } from "next/cache";
import {
  parseTumPrograms,
  parseTumModules,
  tumTreeUrl,
  TUM_PORTFOLIO,
} from "./tum-parser";
import type {
  UniversityCatalog,
  UniversityProgram,
  UniversityCoursePage,
} from "@/types/university";

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
    headers: {
      Accept: "text/html",
      "User-Agent": "U_Plan university catalogue",
    },
  });
  if (!response.ok)
    throw new Error(
      "TUMonline is currently unavailable. Please try again later.",
    );
  const html = await response.text();
  if (html.length > 5_000_000)
    throw new Error("The TUMonline response is too large.");
  return html;
}
// Only validated public catalogue data is cached, never account data or sessions.
export const getTumPrograms = unstable_cache(
  async (): Promise<UniversityCatalog<UniversityProgram>> => ({
    items: parseTumPrograms(await fetchHtml(TUM_PORTFOLIO)),
    fetchedAt: new Date().toISOString(),
    sourceUrl: TUM_PORTFOLIO,
  }),
  ["tum-programs-v1"],
  { revalidate: 86_400 },
);

const getPage = unstable_cache(
  async (programId: string, academicYear: string, page: number) => ({
    ...parseTumModules(
      await fetchHtml(tumTreeUrl(programId, academicYear, page)),
      programId,
      academicYear,
    ),
    fetchedAt: new Date().toISOString(),
  }),
  ["tum-module-page-v1"],
  { revalidate: 86_400 },
);

export async function getTumCourses(
  programId: string,
  academicYear: string,
  start: number,
): Promise<UniversityCoursePage> {
  const first = await getPage(programId, academicYear, 1);
  if (start > first.pages)
    throw new Error(
      "This curriculum page is no longer available. Please reload the module list.",
    );
  // Return the first page promptly. Later batches fetch at most three pages;
  // each HTTP request stays bounded while the client shows loading progress.
  const end = start === 1 ? 1 : Math.min(start + 2, first.pages);
  const pages =
    start === 1
      ? [first]
      : await Promise.all(
          Array.from({ length: end - start + 1 }, (_, index) =>
            getPage(programId, academicYear, start + index),
          ),
        );
  if (pages.some((page) => page.pages !== first.pages))
    throw new Error(
      "The TUM catalogue changed while loading. Please try again.",
    );
  return {
    items: mergeTumModules(pages.map((page) => page.courses)),
    fetchedAt: pages.map((page) => page.fetchedAt).sort()[0],
    sourceUrl: tumTreeUrl(programId, academicYear),
    nextPage: end < first.pages ? end + 1 : null,
    totalPages: first.pages,
    loadedThrough: end,
  };
}
