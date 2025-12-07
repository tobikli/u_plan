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
    title: "Studies",
    url: "/app/studies",
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
                </a>
              </SidebarMenuButton>
              <ModeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
