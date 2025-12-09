"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/types/course";
import type { StudyProgram } from "@/types/study-program";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Preferences } from "@/types/preferences";

type DataContextType = {
  courses: Course[];
  studyPrograms: StudyProgram[];
  preferences: Preferences | null;
  loading: boolean;
  error: string | null;
  refreshCourses: () => Promise<void>;
  refreshStudyPrograms: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
  const [preferences, setPreferences] = useState<Preferences | null>(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        setCourses([]);
        return;
      }

      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching courses:", error);
        setError(error.message);
        return;
      }

      setCourses(data || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to fetch courses");
    }
  }, [supabase]);

  // Fetch study programs
  const fetchStudyPrograms = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        setStudyPrograms([]);
        return;
      }

      const { data, error } = await supabase
        .from("study_programs")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching study programs:", error);
        setError(error.message);
        return;
      }

      setStudyPrograms(data || []);
    } catch (err) {
      console.error("Error fetching study programs:", err);
      setError("Failed to fetch study programs");
    }
  }, [supabase]);

  const fetchPreferences = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        setPreferences(null);
        return;
      }

      const { data, error } = await supabase
        .from("preferences")
        .select("*")
        .eq("user_id", userData.user.id)
        .single();

      if (error) {
        console.error("Error fetching preferences:", error);
        setError(error.message);
        return;
      }

      setPreferences(data || null);
    } catch (err) {
      console.error("Error fetching preferences:", err);
      setError("Failed to fetch preferences");
    }
  }, [supabase]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCourses(), fetchStudyPrograms(), fetchPreferences()]);
      } catch (err) {
        console.error("Error loading initial data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchCourses, fetchStudyPrograms, fetchPreferences]);

  // Set up real-time subscriptions
  useEffect(() => {
    let coursesChannel: RealtimeChannel | null = null;
    let programsChannel: RealtimeChannel | null = null;
    let preferencesChannel: RealtimeChannel | null = null;

    const setupSubscriptions = async () => {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Failed to get user for subscriptions:", authError);
        return;
      }
      
      if (!userData.user) return;

      const userId = userData.user.id;

      // Subscribe to courses changes
      coursesChannel = supabase
        .channel("courses-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "courses",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            fetchCourses();
          }
        )
        .subscribe();

      // Subscribe to study_programs changes
      programsChannel = supabase
        .channel("programs-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "study_programs",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            fetchStudyPrograms();
          }
        )
        .subscribe();

      // Subscribe to preferences changes
      preferencesChannel = supabase
        .channel("preferences-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "preferences",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            fetchPreferences();
          }
        )
        .subscribe();
    };

    setupSubscriptions();

    // Cleanup subscriptions on unmount
    return () => {
      if (coursesChannel) {
        supabase.removeChannel(coursesChannel);
      }
      if (programsChannel) {
        supabase.removeChannel(programsChannel);
      }
      if (preferencesChannel) {
        supabase.removeChannel(preferencesChannel);
      }
    };
  }, [supabase, fetchCourses, fetchStudyPrograms]);

  const value: DataContextType = {
    courses,
    studyPrograms,
    preferences,
    loading,
    error,
    refreshCourses: fetchCourses,
    refreshStudyPrograms: fetchStudyPrograms,
    refreshPreferences: fetchPreferences,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
