import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "@/types/course";
import { BaseRepository } from "./base-repository";

/**
 * Repository for managing Course entities.
 * Provides methods specific to course operations.
 */
export class CourseRepository extends BaseRepository<Course> {
  constructor(client: SupabaseClient) {
    super(client, "courses");
  }

  /**
   * Finds courses by study program ID.
   * @param programId - The study program ID
   * @returns Array of courses or error
   */
  async findByProgramId(programId: string): Promise<{ data: Course[] | null; error: Error | null }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId)
        .eq("study_program_id", programId)
        .order("created_at", { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Course[], error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Finds courses by semester.
   * @param semester - The semester number
   * @returns Array of courses or error
   */
  async findBySemester(semester: number): Promise<{ data: Course[] | null; error: Error | null }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId)
        .eq("semester", semester)
        .order("created_at", { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Course[], error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }
}
