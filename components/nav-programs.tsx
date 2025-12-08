"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useData } from "@/lib/data-provider";
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
  const { studyPrograms, loading } = useData();

  if (loading || studyPrograms.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Your Programs</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {studyPrograms.map((program) => (
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
