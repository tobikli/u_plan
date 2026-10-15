import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  FileText,
  GraduationCap,
  Settings2,
} from "lucide-react";
import { Footer } from "@/components/footer";
import { WorkspacePreview } from "@/components/landing/workspace-preview";
import { ModeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Logo from "@/public/uplan.svg";

const features = [
  {
    icon: GraduationCap,
    number: "01",
    title: "Study programs",
    description:
      "Keep your study programs, institutions, credit goals, and study periods together. Connect each course to the program it belongs to.",
    detail: "Programs & study periods",
  },
  {
    icon: BookOpen,
    number: "02",
    title: "Course management",
    description:
      "Organize courses with tags, record grades and ECTS, and mark completed courses. The details you need, in one overview.",
    detail: "Courses, grades & credits",
  },
  {
    icon: FileText,
    number: "03",
    title: "Course notes",
    description:
      "Write notes right inside a course. Use headings, checklists, tables, images, and code blocks to organize course material.",
    detail: "Rich text & Markdown shortcuts",
  },
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-background text-foreground selection:bg-teal-200 selection:text-teal-950 dark:selection:bg-teal-800 dark:selection:text-white">
      <header className="border-b">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
          <Link
            href="/"
            aria-label="U_Plan home"
            className="flex items-center gap-2.5 font-semibold tracking-tight"
          >
            <Logo aria-hidden="true" className="size-8" />
            <span className="text-lg">
              U_Plan<span className="text-teal-600 dark:text-teal-400">.</span>
            </span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="flex items-center gap-2 sm:gap-5"
          >
            <Link
              href="#features"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Features
            </Link>
            <ModeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/app">
                <span className="sm:hidden">Workspace</span>
                <span className="hidden sm:inline">Open workspace</span>
                <ArrowRight aria-hidden="true" className="hidden sm:block" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main>
        <section
          aria-labelledby="hero-title"
          className="relative isolate mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 sm:pt-24 lg:pb-24"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(ellipse_at_75%_30%,var(--color-teal-500)_0%,transparent_60%)] opacity-[0.07] dark:opacity-[0.1]"
          />
          <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div>
              <Badge
                variant="outline"
                className="gap-2 bg-background/80 px-3 py-1.5 font-normal text-muted-foreground"
              >
                <span className="size-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />{" "}
                University study management
              </Badge>
              <h1
                id="hero-title"
                className="mt-7 text-5xl leading-[1.06] font-semibold tracking-[-0.055em] sm:text-6xl lg:text-[3.75rem]"
              >
                Plan and track
                <br />
                <span className="text-teal-700 dark:text-teal-400">
                  your studies
                </span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
                Manage university programs, course results, credit requirements,
                and notes in one workspace.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-12 px-6">
                  <Link href="/auth/sign-up">
                    Create an account <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="h-12">
                  <Link href="#workspace">
                    View example <ArrowDown aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Log in
                </Link>
              </p>
            </div>
            <div id="workspace" className="min-w-0 scroll-mt-8">
              <WorkspacePreview />
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Workspace preview · Sample data
              </p>
            </div>
          </div>
          <div className="mt-14 grid gap-4 border-y py-5 text-sm text-muted-foreground sm:grid-cols-3 sm:gap-8 lg:mt-20">
            {[
              "Study program management",
              "Credit and grade tracking",
              "Notes organized by course",
            ].map((text) => (
              <div key={text} className="flex items-center gap-2.5">
                <Check
                  aria-hidden="true"
                  className="size-4 shrink-0 text-teal-700 dark:text-teal-400"
                />
                {text}
              </div>
            ))}
          </div>
        </section>
        <section
          id="features"
          aria-labelledby="features-title"
          className="mx-auto max-w-6xl scroll-mt-8 px-5 pb-20 sm:px-8 lg:pb-28"
        >
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium tracking-widest text-teal-700 uppercase dark:text-teal-400">
                Features
              </p>
              <h2
                id="features-title"
                className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Manage programs, courses, and notes
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              Track study requirements, course results, and notes in one
              workspace.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(
              ({ icon: Icon, number, title, description, detail }) => (
                <Card key={number} className="gap-8 shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl border bg-muted/40">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      /{number}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-xl font-semibold tracking-tight">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {description}
                    </p>
                    <p className="mt-7 border-t pt-4 text-xs font-medium text-muted-foreground">
                      {detail}
                    </p>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
          <div className="mt-4 grid overflow-hidden rounded-xl border bg-muted/30 md:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-9">
              <ChartNoAxesCombined
                aria-hidden="true"
                className="mb-5 size-6 text-teal-700 dark:text-teal-400"
              />
              <h3 className="text-2xl font-semibold tracking-tight">
                Progress and grade reporting
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                Your dashboard brings together earned credits, completed
                courses, grade trends, and program progress.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-5 border-t p-6 sm:p-9 md:border-t-0 md:border-l">
              <div className="flex items-start gap-3">
                <Settings2
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <div>
                  <h4 className="text-sm font-medium">Study preferences</h4>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Choose semesters or trimesters and set your own grading
                    scale.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">ECTS tracking</Badge>
                <Badge variant="outline">Grade trends</Badge>
                <Badge variant="outline">Light & dark themes</Badge>
              </div>
            </div>
          </div>
        </section>
        <section aria-labelledby="start-title" className="border-t bg-muted/30">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 px-5 py-14 sm:px-8 md:flex-row md:items-center">
            <div>
              <p className="mb-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Get started
              </p>
              <h2
                id="start-title"
                className="text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Create a study workspace
              </h2>
              <p className="mt-3 text-muted-foreground">
                Create an account to manage your programs and courses.
              </p>
            </div>
            <Button asChild size="lg" className="h-12">
              <Link href="/auth/sign-up">
                Create your account <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
