import type { degreeType } from "./study-program";

export type University = { id: string; name: string; website: string };
export type UniversityLink = {
  university_id: string;
  university_program_id: string;
};
export type UniversityProgram = {
  id: string;
  name: string;
  degree: degreeType;
  degreeLabel: string;
  version: string;
  credits: number | null;
  semesters: number | null;
  academicYear: string;
  sourceUrl: string;
};
export type UniversityCourse = {
  id: string;
  code: string;
  name: string;
  credits: number | null;
  sourceUrl: string;
};
export type UniversityCatalog<T> = {
  items: T[];
  fetchedAt: string;
  sourceUrl: string;
};

export type UniversityCoursePage = UniversityCatalog<UniversityCourse> & {
  nextPage: number | null;
  totalPages: number;
  loadedThrough: number;
};
