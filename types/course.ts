export type Course = {
  id: string
  course_code: string
  name: string
  credits: number
  grade?: number | null
  program_id: string
  semesters: number
  finished: boolean
  user_id: string
  created_at: string
  updated_at?: string | null
}

