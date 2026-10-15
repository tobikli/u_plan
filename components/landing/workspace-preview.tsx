"use client";

import {
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/public/uplan.svg";

const courses = [
  {
    code: "CS 201",
    name: "Algorithms & Data Structures",
    tag: "Core",
    grade: "1.3",
    done: true,
  },
  {
    code: "CS 204",
    name: "Human–Computer Interaction",
    tag: "Elective",
    grade: "1.7",
    done: true,
  },
  {
    code: "CS 210",
    name: "Database Systems",
    tag: "Core",
    grade: "—",
    done: false,
  },
];

export function WorkspacePreview() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-3 -z-10 rounded-3xl border bg-muted/40 sm:-inset-4"
      />
      <Card className="gap-0 overflow-hidden rounded-xl py-0 shadow-xl shadow-black/5 dark:shadow-black/20">
        <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Logo aria-hidden="true" className="size-5" /> U_Plan{" "}
            <ChevronRight
              aria-hidden="true"
              className="size-3 text-muted-foreground"
            />
            <span className="font-normal text-muted-foreground">
              My workspace
            </span>
          </div>
          <Badge
            variant="outline"
            className="bg-background text-[10px] font-normal"
          >
            Example
          </Badge>
        </div>
        <div className="p-4 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Study summary</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                Your studies at a glance
              </h2>
            </div>
            <span
              className="hidden size-9 items-center justify-center rounded-full border bg-muted text-xs font-medium sm:flex"
              aria-hidden="true"
            >
              JD
            </span>
          </div>
          <Tabs defaultValue="overview" className="gap-5">
            <TabsList
              aria-label="Explore the example workspace"
              className="w-full"
            >
              <TabsTrigger value="overview" className="gap-1.5 text-xs">
                <LayoutDashboard aria-hidden="true" className="size-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="courses" className="gap-1.5 text-xs">
                <BookOpen aria-hidden="true" className="size-3.5" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1.5 text-xs">
                <FileText aria-hidden="true" className="size-3.5" />
                Notes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="min-h-[365px] space-y-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { label: "Credits earned", value: "72", unit: "ECTS" },
                  { label: "Avg. grade", value: "1.7", unit: "/ 5.0" },
                  { label: "Completed", value: "12", unit: "courses" },
                ].map(({ label, value, unit }) => (
                  <div
                    key={label}
                    className="rounded-lg border bg-muted/20 p-3"
                  >
                    <p className="text-[10px] text-muted-foreground sm:text-xs">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                      {value}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {unit}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border p-4">
                <div className="mb-5 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-lg bg-teal-600/10 p-2 text-teal-700 dark:text-teal-400">
                      <GraduationCap aria-hidden="true" className="size-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-medium">Computer Science</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        B.Sc. · Semester 3 of 6
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    In progress
                  </Badge>
                </div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">Degree credits</span>
                  <span className="font-medium">72 / 180 ECTS</span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Example degree credits"
                  aria-valuemin={0}
                  aria-valuemax={180}
                  aria-valuenow={72}
                  className="h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div className="h-full w-2/5 rounded-full bg-teal-600 dark:bg-teal-400" />
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  40% of the way to your credit goal
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check
                    aria-hidden="true"
                    className="size-3.5 text-teal-700 dark:text-teal-400"
                  />
                  12 courses completed
                </span>
                <span>Course completion summary</span>
              </div>
            </TabsContent>
            <TabsContent value="courses" className="min-h-[365px] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Computer Science</h3>
                <span className="text-xs text-muted-foreground">
                  3 example courses
                </span>
              </div>
              {courses.map((course) => (
                <div key={course.code} className="rounded-lg border p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {course.code}
                    </span>
                    <Badge
                      variant={course.done ? "secondary" : "outline"}
                      className="text-[10px]"
                    >
                      {course.done ? "Completed" : "In progress"}
                    </Badge>
                  </div>
                  <h4 className="mt-2 text-sm font-medium">{course.name}</h4>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>6 ECTS</span>
                    <span>Grade {course.grade}</span>
                    <span className="ml-auto">{course.tag}</span>
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="notes" className="min-h-[365px]">
              <div className="overflow-hidden rounded-lg border">
                <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                  <FileText aria-hidden="true" className="size-3.5" /> Database
                  Systems <ChevronRight aria-hidden="true" className="size-3" />{" "}
                  Notes
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <p className="mb-2 font-mono text-[10px] text-teal-700 dark:text-teal-400">
                      LECTURE 04
                    </p>
                    <h3 className="text-lg font-semibold tracking-tight">
                      Making sense of relationships
                    </h3>
                  </div>
                  <p className="text-xs leading-6 text-muted-foreground">
                    A good schema starts with the right connections. Each table
                    represents an entity; keys bring them together.
                  </p>
                  <div className="border-l-2 border-teal-600/50 pl-3 text-xs leading-5">
                    Keep one source of truth for each piece of information.
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="flex items-center gap-2">
                      <Check
                        aria-hidden="true"
                        className="size-3.5 text-teal-700 dark:text-teal-400"
                      />
                      Review primary & foreign keys
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span
                        aria-hidden="true"
                        className="size-3.5 rounded-sm border"
                      />
                      Work through normalization examples
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Headings · Checklists · Tables · Code
                  </Badge>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
