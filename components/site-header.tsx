"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { capitalizeFirstLetter } from "@/util/utils";
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React, { useMemo } from "react";
import Link from "next/dist/client/link";
import { useData } from "@/lib/data-provider";

// Helper to detect UUID patterns
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function SiteHeader() {
  const pathname = usePathname().split("/").filter(Boolean);
  const { studyPrograms } = useData();

  // Create a map of program IDs to names
  const programNamesMap = useMemo(() => {
    const map: Record<string, string> = {};
    studyPrograms.forEach((program) => {
      map[program.id] = program.name;
    });
    return map;
  }, [studyPrograms]);

  const segments = pathname.map((segment, index) => {
    const href = "/" + pathname.slice(0, index + 1).join("/");
    
    // If it's a UUID, use the program name if available
    if (isUUID(segment)) {
      const displayName = programNamesMap[segment] || "Loading...";
      return (
        <React.Fragment key={segment}>
          <BreadcrumbLink asChild>
            <Link href={href}>{displayName}</Link>
          </BreadcrumbLink>
          {index < pathname.length - 1 && <BreadcrumbSeparator />}
        </React.Fragment>
      );
    }
    
    return (
      <React.Fragment key={segment}>
        <BreadcrumbLink asChild>
          <Link href={href}>{capitalizeFirstLetter(segment)}</Link>
        </BreadcrumbLink>
        {index < pathname.length - 1 && <BreadcrumbSeparator />}
      </React.Fragment>
    );
  }).filter(Boolean);

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
        <div className="ml-auto flex items-center gap-2"></div>
      </div>
    </header>
  );
}
