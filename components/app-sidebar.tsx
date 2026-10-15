"use client";

import * as React from "react";
import Link from "next/link";
import { version } from "@/package.json";

import {
  IconDashboard,
  IconSettings,
  IconCertificate,
  IconFileText,
  IconCalendar,
} from "@tabler/icons-react";
import { ModeToggle } from "./theme-toggle";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavPrograms } from "@/components/nav-programs";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Logo from "@/public/uplan.svg";

export const navMainItems = [
  {
    title: "Dashboard",
    url: "/app",
    icon: IconDashboard,
  },
  {
    title: "Semester",
    url: "/app/semester",
    icon: IconCalendar,
  },
  {
    title: "Programs",
    url: "/app/programs",
    icon: IconCertificate,
  },
  {
    title: "Courses",
    url: "/app/courses",
    icon: IconFileText,
  },
];

const data = {
  navMain: navMainItems,
  navSecondary: [
    {
      title: "Settings",
      url: "/app/settings",
      icon: IconSettings,
    },
  ],
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
};

export function AppSidebar({
  userEmail,
  userName,
  userAvatar,
  ...props
}: AppSidebarProps) {
  const user = {
    name: userName ?? "Unkown",
    email: userEmail ?? "m@example.com",
    avatar: userAvatar ?? "/avatars/shadcn.jpg",
  };
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4 pt-5 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2">
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5!"
              >
                <Link href="/app" aria-label="U_Plan dashboard">
                  <Logo className="size-6! text-black dark:text-white" />
                  <span className="text-lg font-semibold tracking-tight">
                    U_Plan.
                  </span>
                </Link>
              </SidebarMenuButton>
              <ModeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavPrograms />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t px-4 py-3">
        <NavUser user={user} />
        <div className="flex items-center justify-between gap-3 px-2 text-[10px] text-muted-foreground">
          <span>U_Plan · v{version}</span>
          <Link href="/privacy" className="hover:text-foreground hover:underline hover:underline-offset-4">Privacy</Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
