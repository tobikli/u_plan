export type Preferences = {
  id: string
  user_id: string
  grade_min: number
  grade_max: number
  grade_passed: number
  grade_include_failed: boolean
  created_at: string
  updated_at?: string | null
}