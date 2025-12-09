import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { CourseRepository, StudyProgramRepository, PreferencesRepository } from "@/lib/repositories";

/**
 * Custom hook that provides repository instances for data access.
 * This implements the Factory pattern and provides a clean API for data operations.
 * 
 * @returns Repository instances for courses, study programs, and preferences
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { courseRepo, programRepo } = useRepositories();
 *   
 *   const handleCreate = async (data) => {
 *     const { data: course, error } = await courseRepo.create(data);
 *     if (error) {
 *       toast.error(error.message);
 *     } else {
 *       toast.success("Course created!");
 *     }
 *   };
 * }
 * ```
 */
export function useRepositories() {
  const supabase = createClient();

  const repositories = useMemo(() => {
    return {
      courseRepo: new CourseRepository(supabase),
      programRepo: new StudyProgramRepository(supabase),
      preferencesRepo: new PreferencesRepository(supabase),
    };
  }, [supabase]);

  return repositories;
}
