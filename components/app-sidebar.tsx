"use client";

import * as React from "react";

import {
  IconDashboard,
  IconSettings,
  IconCertificate,
  IconFileText,
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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2">
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5!"
              >
                <a href="#">
                  <Logo className="size-6! text-black dark:text-white" />
                  <span className="text-base font-semibold">U_PLAN</span>
                  <p className="text-xs translate-y-0.5 text-gray-600 dark:text-gray-300">v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
                </a>
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
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
