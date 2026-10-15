"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useData } from "@/lib/data-provider";
import { capitalizeFirstLetter } from "@/util/utils";

export function SiteHeader() {
  const pathname = usePathname().split("/").filter(Boolean);
  const breadcrumbs = pathname.length > 1 ? pathname.slice(1) : ["app"];
  const { studyPrograms, courses } = useData();
  const isProgram = pathname[1] === "programs";
  return (
    <header className="flex min-h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/90 py-3">
      <div className="flex w-full min-w-0 items-center gap-2 px-5 sm:px-8 lg:px-10">
        <SidebarTrigger className="-ml-2 shrink-0 hover:cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="text-xs">
            {breadcrumbs.map((segment, index) => {
              const href = segment === "app"
                ? "/app"
                : "/app/" + breadcrumbs.slice(0, index + 1).join("/");
              const record = (isProgram ? studyPrograms : courses).find(
                (item) => item.id === segment,
              );
              const label =
                segment === "app"
                  ? "Dashboard"
                  : (record?.name ??
                    (/^[0-9a-f-]{36}$/i.test(segment)
                      ? "Details"
                      : capitalizeFirstLetter(segment)));
              return (
                <Fragment key={href}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem className="min-w-0">
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage className="max-w-48 truncate sm:max-w-80">
                        {label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href}>{label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto hidden shrink-0 items-center gap-2 text-[11px] text-muted-foreground md:flex">
          <GraduationCap
            aria-hidden="true"
            className="size-3.5 text-teal-700 dark:text-teal-400"
          />
          Your study workspace
        </div>
      </div>
    </header>
  );
}
