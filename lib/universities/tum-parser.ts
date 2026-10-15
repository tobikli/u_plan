import { load } from "cheerio";
import type {
  UniversityCourse,
  UniversityProgram,
} from "../../types/university";
import type { degreeType } from "../../types/study-program";

export const TUM_BASE = "https://campus.tum.de/tumonline/";
export const TUM_PORTFOLIO = TUM_BASE + "wbStpPortfolio.wbStpList";
const clean = (value: string) => value.replace(/\s+/g, " ").trim();
export function catalogNumber(value: string): number | null {
  const text = clean(value).replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}
function degreeFor(label: string): degreeType {
  if (/bachelor/i.test(label)) return "Bachelor";
  if (/master|MBA/i.test(label)) return "Master";
  if (/doktor|promotion|ph\.?d/i.test(label)) return "Phd";
  if (/diplom/i.test(label)) return "Diploma";
  if (/zertifikat|certificate/i.test(label)) return "Certificate";
  return "Other";
}
export function tumTreeUrl(
  programId: string,
  academicYear: string,
  page?: number,
) {
  if (!/^\d{1,10}$/.test(programId) || !/^\d{1,10}$/.test(academicYear))
    throw new Error("Invalid TUM curriculum identifier");
  const url = new URL("wbstpcs.showSpoTree", TUM_BASE);
  url.searchParams.set("pStStudiumNr", "");
  url.searchParams.set("pSJNr", academicYear);
  url.searchParams.set("pStpStpNr", programId);
  url.searchParams.set("pStartSemester", page ? "W" : "");
  if (page) {
    url.searchParams.set("pFilterType", "20");
    url.searchParams.set("pPageNr", String(page));
    url.searchParams.set("pStpKnotenNr", "");
  }
  return url.toString();
}
export function parseTumPrograms(html: string): UniversityProgram[] {
  const $ = load(html);
  const programs = new Map<string, UniversityProgram>();
  $("#idStpList tr").each((_, element) => {
    const cells = $(element).children("td");
    const anchor = cells.eq(2).find('a[href*="showSpoTree"]').first();
    if (!anchor.length) return;
    const url = new URL(anchor.attr("href")!, TUM_BASE);
    const id = url.searchParams.get("pStpStpNr");
    const academicYear =
      url.searchParams.get("pSJNr") ?? url.searchParams.get("pSjNr");
    if (
      !id ||
      !academicYear ||
      !/^\d{1,10}$/.test(id) ||
      !/^\d{1,10}$/.test(academicYear)
    )
      return;
    const clone = anchor.clone();
    clone.find("span").remove();
    const name = clean(clone.text().replace(/\s*\(\s*\/\s*\)\s*$/, ""));
    if (!name) return;
    const degreeLabel = clean(cells.eq(0).text()).replace(/^\d+\s*/, "");
    const semesters = catalogNumber(cells.eq(5).text());
    programs.set(id, {
      id,
      name,
      degree: degreeFor(degreeLabel),
      degreeLabel,
      version: clean(anchor.find("span").last().text()),
      credits: catalogNumber(cells.eq(4).text()),
      semesters: semesters && Number.isInteger(semesters) ? semesters : null,
      academicYear,
      sourceUrl: tumTreeUrl(id, academicYear),
    });
  });
  if (!programs.size)
    throw new Error(
      "TUMonline did not return a program catalogue. It may be unavailable or its format may have changed.",
    );
  return [...programs.values()].sort(
    (a, b) =>
      a.name.localeCompare(b.name) ||
      a.degreeLabel.localeCompare(b.degreeLabel) ||
      b.version.localeCompare(a.version),
  );
}
export function parseTumModules(
  html: string,
  programId: string,
  academicYear: string,
) {
  const $ = load(html);
  if (!$("table#tgt").length)
    throw new Error("TUMonline did not return a curriculum tree.");
  const courses: UniversityCourse[] = [];
  $("#tgt tr").each((_, element) => {
    const cells = $(element).children("td");
    const node = cells
      .first()
      .find('[title*="Modulknoten"], [title*="Module node"]')
      .first();
    if (!node.length) return;
    const match = clean(node.text()).match(/^\[([^\]]+)\]\s*(.+)$/);
    if (!match) return;
    const moduleHref = $(element)
      .find('a[href*="modules/detail/"]')
      .first()
      .attr("href");
    const sourceUrl = moduleHref
      ? new URL(moduleHref, TUM_BASE).toString()
      : tumTreeUrl(programId, academicYear);
    courses.push({
      id: match[1],
      code: match[1],
      name: match[2],
      credits: catalogNumber(cells.eq(3).text()),
      sourceUrl: sourceUrl.startsWith(TUM_BASE)
        ? sourceUrl
        : tumTreeUrl(programId, academicYear),
    });
  });
  const pages = Math.max(
    1,
    ...$('select[name="pPageNr"]')
      .first()
      .find("option")
      .map((_, option) => Number($(option).attr("value")))
      .get()
      .filter(Number.isFinite),
  );
  if (pages > 100 || pages < 1)
    throw new Error("The TUM curriculum exceeds the supported catalogue size.");
  return { courses, pages };
}
