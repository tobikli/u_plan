export type StudyProgram = {
  id: string
  name: string
  degree: degreeType
  institution: string
  semesters: number
  current_semester: number
  finished: boolean
  credits: number
  user_id: string
  description?: string | null
  created_at: string
  updated_at?: string | null
}

export type degreeType = "Bachelor" | "Master" | "Phd" | "Associate" | "Diploma" | "Certificate" | "Other"
