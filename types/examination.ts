export type Examination = {
  id: string;
  course_id: string;
  user_id: string;
  name: string;
  exam_date: string | null;
  grade: number | null;
  weight: number;
  created_at: string;
  updated_at: string;
};
