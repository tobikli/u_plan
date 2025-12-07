"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { capitalizeFirstLetter } from "@/util/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

export function SiteHeader() {
  const currentPath = capitalizeFirstLetter(
    usePathname()
      .split("/")
      .findLast(() => true) || ""
  );
  const pathname = usePathname().split("/").filter(Boolean);

  const segments = pathname.map((segment, index) => (
    <React.Fragment key={segment}>
      <BreadcrumbItem>{capitalizeFirstLetter(segment)}</BreadcrumbItem>

      {index < pathname.length - 1 && <BreadcrumbSeparator />}
    </React.Fragment>
  ));

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>{segments}</BreadcrumbList>
        </Breadcrumb>{" "}
        <div className="ml-auto flex items-center gap-2">
        </div>
      </div>
    </header>
  );
}
