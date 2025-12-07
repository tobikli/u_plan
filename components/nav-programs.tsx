"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StudyProgram } from "@/types/study-program";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavPrograms() {
  const pathname = usePathname();
  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from("study_programs")
          .select("id, name, degree")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setPrograms(data as StudyProgram[]);
        }
      } catch (err) {
        console.error("Failed to fetch programs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  if (loading || programs.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Your Programs</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {programs.map((program) => (
            <SidebarMenuItem key={program.id}>
              <SidebarMenuButton
                asChild
                tooltip={program.name}
                isActive={pathname.includes(program.id)}
              >
                <Link href={`/app/programs/${program.id}`}>
                  <span>
                    {program.degree} - {program.name}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
