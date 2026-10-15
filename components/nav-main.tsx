"use client";

import { usePathname } from "next/navigation";
import { useData } from "@/lib/data-provider";
import { getStudyPeriodLabel } from "@/lib/study-period";
import { IconCirclePlus2, type Icon } from "@tabler/icons-react";
import Link from "next/link";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CourseForm } from "@/app/app/courses/course-form";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const pathname = usePathname();
  const { preferences } = useData();
  return (
    <SidebarGroup className="px-4">
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <CourseForm
              trigger={
                <SidebarMenuButton
                  tooltip="Add a course"
                  className="mb-4 h-10 rounded-lg bg-primary text-primary-foreground hover:cursor-pointer hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                >
                  <IconCirclePlus2 />
                  <span>Add a course</span>
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={pathname === item.url}
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>
                    {item.url === "/app/semester"
                      ? getStudyPeriodLabel(preferences, { capitalized: true })
                      : item.title}
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
