import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Base repository class that provides common database operations.
 * This implements the Repository pattern to abstract data access logic.
 * 
 * @template T - The type of entity this repository manages
 */
export abstract class BaseRepository<T> {
  protected client: SupabaseClient;
  protected tableName: string;

  constructor(client: SupabaseClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  /**
   * Gets the current authenticated user ID.
   * @returns The user ID or null if not authenticated
   */
  protected async getUserId(): Promise<string | null> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user.id;
  }

  /**
   * Finds all records for the current user.
   * @param orderBy - Optional field to order by
   * @param ascending - Sort direction (default: false)
   * @returns Array of records or error
   */
  async findAll(orderBy = "created_at", ascending = false): Promise<{ data: T[] | null; error: Error | null }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId)
        .order(orderBy, { ascending });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as T[], error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Finds a single record by ID for the current user.
   * @param id - The record ID
   * @returns The record or null if not found
   */
  async findById(id: string): Promise<{ data: T | null; error: Error | null }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as T, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Creates a new record.
   * @param data - The data to insert
   * @returns The created record or error
   */
  async create(data: Partial<T>): Promise<{ data: T | null; error: Error | null }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert({ ...data, user_id: userId })
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: result as T, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Updates a record by ID.
   * @param id - The record ID
   * @param data - The data to update
   * @returns The updated record or error
   */
  async update(id: string, data: Partial<T>): Promise<{ data: T | null; error: Error | null }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data: result, error } = await this.client
        .from(this.tableName)
        .update(data)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: result as T, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Deletes a record by ID.
   * @param id - The record ID
   * @returns Success status or error
   */
  async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return { error: new Error("User not authenticated") };
      }

      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }
}
