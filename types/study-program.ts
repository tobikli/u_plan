export type StudyProgram = {
  university_id?: string | null;
  university_program_id?: string | null;
  id: string;
  name: string;
  degree: degreeType;
  institution: string;
  semesters: number;
  current_semester: number;
  finished: boolean;
  credits: number;
  user_id: string;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type degreeType =
  | "Bachelor"
  | "Master"
  | "Phd"
  | "Associate"
  | "Diploma"
  | "Certificate"
  | "Other";
