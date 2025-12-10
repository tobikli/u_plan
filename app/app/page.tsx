"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useData } from "@/lib/data-provider";
import CenteredSpinner from "@/components/ui/centered-spinner";

export default function Page() {
  const { courses, studyPrograms, loading, preferences } = useData();

  const gradeBounds = useMemo(() => {
    const min = preferences?.grade_min ?? 1;
    const max = preferences?.grade_max ?? 5;
    const rawPassed = preferences?.grade_passed ?? 4;
    const passed = Math.min(max, Math.max(min, rawPassed));
    const span = Math.max(0.1, max - min);
    return {
      min,
      max,
      passed,
      span,
      clamp: (v: number) => Math.min(max, Math.max(min, v)),
    };
  }, [preferences]);

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const totalPrograms = studyPrograms.length;
    const creditsPlanned = courses.reduce(
      (sum, c) => sum + (c.credits || 0),
      0
    );
    const creditsEarned = courses
      .filter((c) => c.finished)
      .reduce((sum, c) => sum + (c.credits || 0), 0);
    const gradedCourses = courses.filter((c) => typeof c.grade === "number");
    const avgGrade = gradedCourses.length
      ? gradedCourses.reduce((sum, c) => sum + (c.grade || 0), 0) /
        gradedCourses.length
      : null;
    const avgSemester = studyPrograms.length
      ? studyPrograms.reduce((sum, p) => sum + (p.current_semester || 0), 0) /
        studyPrograms.length
      : null;

    return {
      totalCourses,
      totalPrograms,
      creditsPlanned,
      creditsEarned,
      avgGrade,
      avgSemester,
    };
  }, [courses, studyPrograms]);

  const programProgress = useMemo(() => {
    if (!studyPrograms.length) return [];
    return studyPrograms.map((p) => {
      const programCourses = courses.filter((c) => c.program_id === p.id);
      const earned = programCourses
        .filter((c) => c.finished)
        .reduce((sum, c) => sum + (c.credits || 0), 0);
      const planned =
        programCourses.reduce((sum, c) => sum + (c.credits || 0), 0) ||
        p.credits ||
        0;
      const completion = planned
        ? Math.min(100, Math.round((earned / planned) * 100))
        : 0;
      return {
        name: p.name,
        completion,
        credits: earned,
      };
    });
  }, [courses, studyPrograms]);

  const creditsOverTime = useMemo(() => {
    const timeline = new Map<string, number>();
    courses.forEach((course) => {
      const date = new Date(course.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      timeline.set(key, (timeline.get(key) || 0) + (course.credits || 0));
    });
    const entries = Array.from(timeline.entries()).sort(([a], [b]) =>
      a > b ? 1 : -1
    );
    return entries.map(([month, credits]) => ({ month, credits }));
  }, [courses]);

  const gradeBands = useMemo(() => {
    const { min, max } = gradeBounds;
    const start = Math.floor(min);
    const end = Math.ceil(max);
    const buckets: { label: string; count: number }[] = [];

    for (let g = start; g < end; g++) {
      const lo = g;
      const hi = g + 1;
      buckets.push({ label: `${lo.toFixed(1)}-${hi.toFixed(1)}`, count: 0 });
    }

    courses.forEach((c) => {
      if (typeof c.grade !== "number") return;
      const g = Math.min(max, Math.max(min, c.grade));
      const idx = Math.min(buckets.length - 1, Math.floor(g - start));
      buckets[idx].count += 1;
    });

    return buckets;
  }, [courses, gradeBounds]);

  const completionRate = useMemo(() => {
    const completed = courses.filter((c) => c.finished).length;
    return courses.length ? Math.round((completed / courses.length) * 100) : 0;
  }, [courses]);

  const gradeBySemester = useMemo(() => {
    const buckets = new Map<number, { sum: number; count: number }>();
    courses.forEach((c) => {
      if (typeof c.grade !== "number") return;
      const sem = c.semesters || 1;
      const entry = buckets.get(sem) ?? { sum: 0, count: 0 };
      entry.sum += c.grade;
      entry.count += 1;
      buckets.set(sem, entry);
    });
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([semester, { sum, count }]) => ({
        semester: `S${semester}`,
        grade: count ? Number((sum / count).toFixed(2)) : 0,
      }));
  }, [courses]);

  const creditsRatio = useMemo(() => {
    const planned = stats.creditsPlanned || 0;
    const earned = stats.creditsEarned || 0;
    return planned ? Math.min(100, Math.round((earned / planned) * 100)) : 0;
  }, [stats.creditsEarned, stats.creditsPlanned]);

  const summaryCards = [
    {
      label: "Programs",
      value: stats.totalPrograms,
      sub: "Active study tracks",
    },
    {
      label: "Courses",
      value: stats.totalCourses,
      sub: "Across all programs",
    },
    {
      label: "Credits planned",
      value: stats.creditsPlanned,
      sub: "Total ECTS",
    },
    {
      label: "Credits earned",
      value: stats.creditsEarned,
      sub: "Finished courses",
    },
    {
      label: "Avg. grade",
      value: stats.avgGrade ? stats.avgGrade.toFixed(2) : "—",
      sub: "Weighted by courses",
    },
    /*
    {
      label: "Avg. semester",
      value: stats.avgSemester ? stats.avgSemester.toFixed(1) : "—",
      sub: "Current progress",
    }, */
    {
      label: "Completion rate",
      value: `${completionRate}%`,
      sub: "Courses finished",
    },
  ];

  const progressConfig: ChartConfig = {
    completion: {
      label: "Completion",
      color: "var(--chart-color)",
    },
  };

  const creditsConfig: ChartConfig = {
    credits: {
      label: "Credits",
      color: "var(--chart-color)",
    },
  };

  const gradesConfig: ChartConfig = {
    count: {
      label: "Courses",
      color: "var(--chart-color)",
    },
  };

  if (loading) return <CenteredSpinner />;

  return (
    <div className="grid gap-4 pb-6 lg:gap-6 p-5 max-w-full overflow-x-hidden">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Overview</p>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
        <Badge variant="outline">Live</Badge>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => (
          <Card
            key={card.label}
            className="w-full min-w-20 bg-linear-to-b from-muted/50 to-background border-border/60"
          >
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl font-semibold">
                {card.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <hr />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="w-full min-w-0 h-full grid grid-rows-[auto_1fr] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>Completion & credits</CardTitle>
            <CardDescription>Overall course progress</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 overflow-x-auto">
            {/* Completion chart */}
            <div className="flex flex-col items-center w-full max-w-full mx-auto">
              <ChartContainer
                config={progressConfig}
                className="w-full aspect-square min-h-[200px]"
              >
                <RadialBarChart
                  width={300}
                  height={300}
                  data={[
                    {
                      name: "Completion",
                      value: completionRate,
                      fill: "var(--color-completion)",
                    },
                  ]}
                  innerRadius="60%"
                  outerRadius="80%"
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    tick={false}
                  />
                  <RadialBar dataKey="value" cornerRadius={8} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                </RadialBarChart>
              </ChartContainer>
              {/* Text below */}
              <div className="mt-2 text-center">
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-2xl font-semibold">{completionRate}%</p>
              </div>
            </div>

            {/* Credits chart */}
            <div className="flex flex-col items-center w-full max-w-full mx-auto">
              <ChartContainer
                config={creditsConfig}
                className="w-full aspect-square min-h-[200px]"
              >
                <RadialBarChart
                  width={300}
                  height={300}
                  data={[
                    {
                      name: "Credits",
                      value: creditsRatio,
                      fill: "var(--color-credits)",
                    },
                  ]}
                  innerRadius="60%"
                  outerRadius="80%"
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    tick={false}
                  />
                  <RadialBar dataKey="value" cornerRadius={8} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                </RadialBarChart>
              </ChartContainer>
              {/* Text below */}
              <div className="mt-2 text-center">
                <p className="text-sm text-muted-foreground">Credits earned</p>
                <p className="text-2xl font-semibold">{creditsRatio}%</p>
                <p className="text-xs text-muted-foreground">
                  {stats.creditsEarned}/{stats.creditsPlanned} ECTS
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 h-full grid grid-rows-[auto_1fr] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>Grades</CardTitle>
            <CardDescription>Average and distribution</CardDescription>
          </CardHeader>
          <CardContent className="grid overflow-x-auto">
            <div className="w-full overflow-x-auto">
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between text-foreground">
                  <span className="font-semibold">Best bucket</span>
                  <span>
                    {gradeBands.find((g) => g.count > 0)?.label ?? "n/a"}
                  </span>
                </div>
                <Separator />
                <p>Avg grade per semester</p>
                <div className="w-full overflow-x-auto">
                  <ChartContainer config={gradesConfig} className="min-h-32">
                    <LineChart
                      data={gradeBySemester}
                      margin={{ left: -10, right: 10, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="semester"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={6}
                      />
                      <YAxis
                        width={26}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                        domain={[gradeBounds.min, gradeBounds.max]}
                        allowDecimals={false}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Line
                        type="monotone"
                        dataKey="grade"
                        stroke="var(--color-count)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 h-full grid grid-rows-[auto_1fr] lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle>Credits over time</CardTitle>
            <CardDescription>When courses were added</CardDescription>
          </CardHeader>
          <CardContent className="grid overflow-x-auto">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[360px]">
                <ChartContainer config={creditsConfig} className="min-h-60">
                  <LineChart
                    data={creditsOverTime}
                    margin={{ left: -10, right: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      width={30}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Line
                      type="monotone"
                      dataKey="credits"
                      stroke="var(--color-credits)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-12 lg:gap-6">
        <Card className="w-full min-w-0 lg:col-span-5 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>Grade distribution</CardTitle>
            <CardDescription>Across all graded courses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 overflow-x-auto">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[360px]">
                <ChartContainer config={gradesConfig} className="min-h-60">
                  <BarChart data={gradeBands} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      width={28}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="count"
                      radius={[6, 6, 4, 4]}
                      fill="var(--color-count)"
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="space-y-1">
                <p className="text-foreground font-semibold">Completion rate</p>
                <p>{completionRate}% of courses are marked finished.</p>
              </div>
              <div className="space-y-1">
                <p className="text-foreground font-semibold">Average grade</p>
                <p>
                  {stats.avgGrade ? stats.avgGrade.toFixed(2) : "No grades yet"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="w-full min-w-0 lg:col-span-7 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle>Program completion</CardTitle>
            <CardDescription>Credits earned per program</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[420px]">
                <ChartContainer config={progressConfig} className="min-h-60">
                  <BarChart
                    data={programProgress}
                    margin={{ left: -20, right: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      height={60}
                      interval={0}
                      angle={0}
                      dy={8}
                    />
                    <YAxis
                      width={28}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                    />
                    <ChartTooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Bar
                      dataKey="completion"
                      radius={[8, 8, 4, 4]}
                      fill="var(--color-completion)"
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading latest data…</p>
      )}
    </div>
  );
}
