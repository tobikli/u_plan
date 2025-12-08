"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/types/course";
import type { StudyProgram } from "@/types/study-program";
import type { RealtimeChannel } from "@supabase/supabase-js";

type DataContextType = {
  courses: Course[];
  studyPrograms: StudyProgram[];
  loading: boolean;
  error: string | null;
  refreshCourses: () => Promise<void>;
  refreshStudyPrograms: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch courses
  const fetchCourses = async () => {
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
  };

  // Fetch study programs
  const fetchStudyPrograms = async () => {
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
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCourses(), fetchStudyPrograms()]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    let coursesChannel: RealtimeChannel | null = null;
    let programsChannel: RealtimeChannel | null = null;

    const setupSubscriptions = async () => {
      const { data: userData } = await supabase.auth.getUser();
      
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
          (payload) => {
            console.log("Courses change detected:", payload);
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
          (payload) => {
            console.log("Programs change detected:", payload);
            fetchStudyPrograms();
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
    };
  }, []);

  const value: DataContextType = {
    courses,
    studyPrograms,
    loading,
    error,
    refreshCourses: fetchCourses,
    refreshStudyPrograms: fetchStudyPrograms,
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
