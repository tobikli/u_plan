"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Examination } from "@/types/examination";
import type { Course } from "@/types/course";
import type { StudyProgram } from "@/types/study-program";
import type { Preferences } from "@/types/preferences";
import {
  fetchWorkspaceTable,
  workspaceKey,
  workspaceTables,
  type WorkspaceTable,
  type InitialWorkspace,
  type WorkspaceData,
} from "@/lib/workspace-data";
import {
  applyWorkspaceChange,
  type WorkspaceChange,
} from "@/lib/workspace-realtime";

type DataContextType = {
  courses: Course[];
  examinations: Examination[];
  studyPrograms: StudyProgram[];
  preferences: Preferences | null;
  loading: boolean;
  error: string | null;
  refreshCourses: () => Promise<void>;
  refreshExaminations: () => Promise<void>;
  refreshStudyPrograms: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
};
const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: InitialWorkspace;
}) {
  // Each mounted workspace (and each SSR request) has its own cache.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: "always",
            refetchOnReconnect: "always",
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider initialData={initialData}>
        {children}
      </WorkspaceProvider>
    </QueryClientProvider>
  );
}

function WorkspaceProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: InitialWorkspace;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [userId, setUserId] = useState<string | null>(
    initialData?.userId ?? null,
  );
  const [authReady, setAuthReady] = useState(Boolean(initialData));
  const activeUser = useRef(userId);
  const [seedData, setSeedData] = useState(initialData);

  useEffect(() => {
    // The callback remains synchronous: awaiting Supabase calls here can deadlock Auth.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user.id ?? null;
      if (activeUser.current !== nextUser) {
        const previousUser = activeUser.current;
        activeUser.current = nextUser;
        setSeedData(undefined);
        // Clearing cancels queries; their AbortSignals stop old-account HTTP requests.
        queryClient.clear();
        setUserId(nextUser);
        if (previousUser)
          queueMicrotask(() => {
            if (activeUser.current !== nextUser) return;
            if (!nextUser) router.replace("/auth/login");
            router.refresh();
          });
      }
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase, queryClient, router]);

  const seed = seedData?.userId === userId ? seedData : undefined;
  const courses = useQuery({
    queryKey: workspaceKey(userId, "courses"),
    enabled: Boolean(userId),
    queryFn: ({ signal }) =>
      fetchWorkspaceTable(supabase, userId!, "courses", signal),
    initialData: seed?.data.courses,
    initialDataUpdatedAt: seed?.fetchedAt,
  });
  const programs = useQuery({
    queryKey: workspaceKey(userId, "study_programs"),
    enabled: Boolean(userId),
    queryFn: ({ signal }) =>
      fetchWorkspaceTable(supabase, userId!, "study_programs", signal),
    initialData: seed?.data.study_programs,
    initialDataUpdatedAt: seed?.fetchedAt,
  });
  const preferences = useQuery({
    queryKey: workspaceKey(userId, "preferences"),
    enabled: Boolean(userId),
    queryFn: ({ signal }) =>
      fetchWorkspaceTable(supabase, userId!, "preferences", signal),
    initialData: seed?.data.preferences,
    initialDataUpdatedAt: seed?.fetchedAt,
  });
  const examinations = useQuery({
    queryKey: workspaceKey(userId, "examinations"),
    enabled: Boolean(userId),
    queryFn: ({ signal }) =>
      fetchWorkspaceTable(supabase, userId!, "examinations", signal),
    initialData: seed?.data.examinations,
    initialDataUpdatedAt: seed?.fetchedAt,
  });

  const refresh = useCallback(
    async (table: WorkspaceTable) => {
      if (!userId || activeUser.current !== userId) return;
      // A query started before a mutation committed may have an obsolete snapshot.
      await queryClient.cancelQueries({
        queryKey: workspaceKey(userId, table),
        exact: true,
      });
      if (activeUser.current !== userId) return;
      await queryClient.invalidateQueries(
        { queryKey: workspaceKey(userId, table), exact: true },
        { cancelRefetch: false },
      );
    },
    [queryClient, userId],
  );

  const refreshCourses = useCallback(() => refresh("courses"), [refresh]);
  const refreshExaminations = useCallback(
    () => refresh("examinations"),
    [refresh],
  );
  const refreshStudyPrograms = useCallback(
    () => refresh("study_programs"),
    [refresh],
  );
  const refreshPreferences = useCallback(
    () => refresh("preferences"),
    [refresh],
  );

  useEffect(() => {
    if (!userId) return;
    let disposed = false;
    let connected = false;
    let revalidateTimer: ReturnType<typeof setTimeout> | undefined;
    const interrupted = new Set<WorkspaceTable>();
    const refreshAll = () => {
      if (!disposed && activeUser.current === userId)
        for (const table of workspaceTables) void refresh(table);
    };
    const applyChange = async (
      table: WorkspaceTable,
      payload: WorkspaceChange,
    ) => {
      if (disposed || activeUser.current !== userId) return;
      const key = workspaceKey(userId, table);
      const cached =
        queryClient.getQueryData<WorkspaceData[WorkspaceTable]>(key);
      if (
        cached !== undefined &&
        applyWorkspaceChange(table, cached, payload, userId) === cached
      )
        return;
      const fetching =
        queryClient.isFetching({ queryKey: key, exact: true }) > 0;
      // An older HTTP response must not overwrite a newer database event.
      if (fetching)
        await queryClient.cancelQueries({ queryKey: key, exact: true });
      if (disposed || activeUser.current !== userId) return;
      queryClient.setQueryData<WorkspaceData[WorkspaceTable]>(key, (cached) =>
        applyWorkspaceChange(table, cached, payload, userId),
      );
      if (fetching) {
        interrupted.add(table);
        clearTimeout(revalidateTimer);
        revalidateTimer = setTimeout(() => {
          if (disposed || activeUser.current !== userId) return;
          for (const name of interrupted) void refresh(name);
          interrupted.clear();
        }, 100);
      }
    };
    let channel = supabase.channel(`workspace:${userId}`);
    for (const table of workspaceTables) {
      for (const event of ["INSERT", "UPDATE"] as const) {
        channel = channel.on(
          "postgres_changes",
          { event, schema: "public", table, filter: `user_id=eq.${userId}` },
          (payload) => {
            void applyChange(table, payload);
          },
        );
      }
      // Deleted rows may no longer expose user_id. Handle primary keys only, and
      // ignore every ID not already present in this account's cache.
      channel = channel.on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table },
        (payload) => {
          void applyChange(table, payload);
        },
      );
    }
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // Covers the initial fetch/subscribe gap and missed events after reconnect.
        if (!connected) refreshAll();
        connected = true;
      } else {
        connected = false;
      }
    });
    return () => {
      disposed = true;
      clearTimeout(revalidateTimer);
      void supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, userId, refresh]);

  const queries = [courses, programs, preferences, examinations];
  const error = queries.find((query) => query.error)?.error?.message ?? null;
  return (
    <DataContext.Provider
      value={{
        courses: userId ? (courses.data ?? []) : [],
        examinations: userId ? (examinations.data ?? []) : [],
        studyPrograms: userId ? (programs.data ?? []) : [],
        preferences: userId ? (preferences.data ?? null) : null,
        loading:
          !authReady ||
          Boolean(userId && queries.some((query) => query.isPending)),
        error,
        refreshCourses,
        refreshExaminations,
        refreshStudyPrograms,
        refreshPreferences,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
}
