import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudyProgram } from "@/types/study-program";
import { BaseRepository } from "./base-repository";

/**
 * Repository for managing StudyProgram entities.
 * Provides methods specific to study program operations.
 */
export class StudyProgramRepository extends BaseRepository<StudyProgram> {
  constructor(client: SupabaseClient) {
    super(client, "study_programs");
  }

  /**
   * Finds active (unfinished) study programs.
   * @returns Array of active study programs or error
   */
  async findActive(): Promise<{ data: StudyProgram[] | null; error: Error | null }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId)
        .eq("finished", false)
        .order("created_at", { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as StudyProgram[], error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Finds finished study programs.
   * @returns Array of finished study programs or error
   */
  async findFinished(): Promise<{ data: StudyProgram[] | null; error: Error | null }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId)
        .eq("finished", true)
        .order("created_at", { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as StudyProgram[], error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Updates the current semester for a study program.
   * @param id - The study program ID
   * @param semester - The new semester number
   * @returns The updated study program or error
   */
  async updateCurrentSemester(id: string, semester: number): Promise<{ data: StudyProgram | null; error: Error | null }> {
    return this.update(id, { current_semester: semester } as Partial<StudyProgram>);
  }

  /**
   * Marks a study program as finished.
   * @param id - The study program ID
   * @returns The updated study program or error
   */
  async markAsFinished(id: string): Promise<{ data: StudyProgram | null; error: Error | null }> {
    return this.update(id, { finished: true } as Partial<StudyProgram>);
  }
}
