import type { SupabaseClient } from "@supabase/supabase-js";
import type { Preferences } from "@/types/preferences";
import { BaseRepository } from "./base-repository";

/**
 * Repository for managing user Preferences.
 * Note: Each user has only one preferences record.
 */
export class PreferencesRepository extends BaseRepository<Preferences> {
  constructor(client: SupabaseClient) {
    super(client, "preferences");
  }

  /**
   * Gets the preferences for the current user.
   * @returns The user's preferences or null if not found
   */
  async get(): Promise<{ data: Preferences | null; error: Error | null }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        // If no preferences exist yet, that's okay - return null without error
        if (error.code === "PGRST116") {
          return { data: null, error: null };
        }
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Preferences, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Creates or updates preferences for the current user.
   * @param preferences - The preferences to save
   * @returns The saved preferences or error
   */
  async upsert(preferences: Partial<Preferences>): Promise<{ data: Preferences | null; error: Error | null }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .upsert({ ...preferences, user_id: userId })
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Preferences, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }
}
