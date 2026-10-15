"use client";

import { useEffect, useId, useState } from "react";
import {
  UserRound,
  GraduationCap,
  SlidersHorizontal,
  Sun,
  LogOut,
  LoaderCircle,
  ArrowUpRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import {
  OverviewHeader,
  OverviewLoading,
} from "@/components/workspace/overview";
import { AccountForm } from "../account-form";
import { toast } from "sonner";
import { useData } from "@/lib/data-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* The form follows saved preferences when the data provider refreshes them. */
/* eslint-disable react-hooks/set-state-in-effect */

const sections = [
  { id: "account-settings", title: "Account", icon: UserRound },
  { id: "study-settings", title: "Study structure", icon: GraduationCap },
  { id: "grade-settings", title: "Grading", icon: SlidersHorizontal },
  { id: "appearance-settings", title: "Appearance", icon: Sun },
  { id: "session-settings", title: "Session", icon: LogOut },
];

export default function SettingsPage() {
  const fieldId = useId();
  const { preferences, refreshPreferences, loading } = useData();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    createdAt: "",
  });
  const [gradeMin, setGradeMin] = useState(String(preferences?.grade_min ?? 1));
  const [gradeMax, setGradeMax] = useState(String(preferences?.grade_max ?? 5));
  const [gradePassed, setGradePassed] = useState(
    String(preferences?.grade_passed ?? 4),
  );
  const [includeFailed, setIncludeFailed] = useState(
    preferences?.grade_include_failed ?? false,
  );
  const [trimester, setTrimester] = useState(preferences?.trimester ?? false);
  const [saving, setSaving] = useState<"study" | "grades" | null>(null);
  useEffect(() => {
    const client = createClient();
    let active = true;
    const apply = (user: {
      email?: string;
      created_at?: string;
      user_metadata?: { full_name?: string; name?: string };
    }) => {
      if (active)
        setProfile({
          name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
          email: user.email ?? "",
          createdAt: user.created_at ?? "",
        });
    };
    void client.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (user) apply(user);
      })
      .catch(() => {});
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) apply(session.user);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    setGradeMin(String(preferences?.grade_min ?? 1));
    setGradeMax(String(preferences?.grade_max ?? 5));
    setGradePassed(String(preferences?.grade_passed ?? 4));
    setIncludeFailed(preferences?.grade_include_failed ?? false);
    setTrimester(preferences?.trimester ?? false);
  }, [preferences]);
  const save = async (kind: "study" | "grades") => {
    if (saving) return;
    const best = Number(gradeMin),
      worst = Number(gradeMax),
      pass = Number(gradePassed);
    if (
      kind === "grades" &&
      (!gradeMin.trim() ||
        !gradeMax.trim() ||
        !gradePassed.trim() ||
        ![best, worst, pass].every(Number.isFinite) ||
        best === worst ||
        pass < Math.min(best, worst) ||
        pass > Math.max(best, worst))
    ) {
      toast.error(
        "Use distinct best and worst grades, with the passing grade between them.",
      );
      return;
    }
    setSaving(kind);
    try {
      const client = createClient();
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser();
      if (authError || !user) {
        toast.error("Please log in again to update your settings");
        return;
      }
      const changes =
        kind === "study"
          ? { trimester }
          : {
              grade_min: best,
              grade_max: worst,
              grade_passed: pass,
              grade_include_failed: includeFailed,
            };
      const { error } = await client
        .from("preferences")
        .update(changes)
        .eq("user_id", user.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      await refreshPreferences();
      toast.success(
        kind === "study"
          ? "Study preferences saved"
          : "Grading preferences saved",
      );
    } catch {
      toast.error("Could not save your preferences. Please try again.");
    } finally {
      setSaving(null);
    }
  };
  if (loading) return <OverviewLoading />;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-5 sm:space-y-8 sm:p-8 lg:p-10">
      <OverviewHeader
        title="Settings"
        description="Manage your account, study structure, grading scale, and appearance."
        action={
          <AccountForm
            trigger={
              <Button variant="outline">
                <UserRound aria-hidden="true" />
                Manage account
              </Button>
            }
          />
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[200px_minmax(0,1fr)] xl:gap-10">
        <nav
          aria-label="Settings sections"
          className="flex flex-wrap gap-1 border-b pb-4 xl:sticky xl:top-8 xl:flex-col xl:border-b-0 xl:pb-0"
        >
          <p className="mb-3 hidden px-3 text-[10px] font-medium tracking-widest text-muted-foreground uppercase xl:block">
            Your preferences
          </p>
          {sections.map(({ id, title, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon aria-hidden="true" className="size-4" />
              {title}
            </a>
          ))}
        </nav>
        <div className="min-w-0 space-y-5">
          <Card id="account-settings" className="scroll-mt-6 gap-5 shadow-xs">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base tracking-tight">
                    Account
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    Your profile and sign-in details
                  </CardDescription>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  /01
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted/40 text-lg font-semibold"
                >
                  {profile.name ? (
                    profile.name.charAt(0).toUpperCase()
                  ) : (
                    <UserRound className="size-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium break-words">
                    {profile.name || "Your account"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground break-all">
                    {profile.email || "Manage your profile and email address"}
                  </p>
                </div>
                <AccountForm
                  trigger={
                    <Button variant="outline" size="sm">
                      Edit profile <ArrowUpRight aria-hidden="true" />
                    </Button>
                  }
                />
              </div>
              {profile.createdAt && (
                <p className="mt-5 border-t pt-4 text-[11px] text-muted-foreground">
                  Member since{" "}
                  {new Date(profile.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </CardContent>
          </Card>
          <Card id="study-settings" className="scroll-mt-6 gap-5 shadow-xs">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void save("study");
              }}
            >
              <CardHeader className="pb-5">
                <CardTitle className="text-base tracking-tight">
                  Study structure
                </CardTitle>
                <CardDescription>
                  The study periods used across your programs and courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col justify-between gap-4 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center">
                  <div>
                    <Label htmlFor={`${fieldId}-period`}>
                      Study period system
                    </Label>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Use the term structure that fits your university.
                    </p>
                  </div>
                  <Select
                    value={trimester ? "trimester" : "semester"}
                    onValueChange={(value) =>
                      setTrimester(value === "trimester")
                    }
                    disabled={!!saving}
                  >
                    <SelectTrigger
                      id={`${fieldId}-period`}
                      className="w-full bg-background sm:w-44"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semester">Semesters</SelectItem>
                      <SelectItem value="trimester">Trimesters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <p className="text-[11px] text-muted-foreground">
                    Applies to labels and study-period charts.
                  </p>
                  <Button type="submit" disabled={!!saving}>
                    {saving === "study" ? (
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                    ) : null}
                    {saving === "study" ? "Saving…" : "Save study preferences"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
          <Card id="grade-settings" className="scroll-mt-6 gap-5 shadow-xs">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void save("grades");
              }}
            >
              <CardHeader className="pb-5">
                <CardTitle className="text-base tracking-tight">
                  Grading
                </CardTitle>
                <CardDescription>
                  Define your scale and how program averages are calculated.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <fieldset disabled={!!saving} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        key: "best",
                        label: "Best grade",
                        value: gradeMin,
                        set: setGradeMin,
                      },
                      {
                        key: "worst",
                        label: "Worst grade",
                        value: gradeMax,
                        set: setGradeMax,
                      },
                      {
                        key: "pass",
                        label: "Passing grade",
                        value: gradePassed,
                        set: setGradePassed,
                      },
                    ].map((field) => (
                      <div key={field.key} className="grid content-start gap-2">
                        <Label htmlFor={`${fieldId}-${field.key}`}>
                          {field.label}
                        </Label>
                        <Input
                          id={`${fieldId}-${field.key}`}
                          type="number"
                          step="any"
                          value={field.value}
                          onChange={(event) => field.set(event.target.value)}
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Both ascending and descending scales are supported. The
                    passing grade must fall within your scale.
                  </p>
                  <label
                    htmlFor={`${fieldId}-failed`}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/20 p-4"
                  >
                    <Checkbox
                      id={`${fieldId}-failed`}
                      checked={includeFailed}
                      onCheckedChange={(checked) =>
                        setIncludeFailed(checked === true)
                      }
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        Include failed courses in averages
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        Count grades below the passing threshold in your
                        program’s weighted average.
                      </span>
                    </span>
                  </label>
                </fieldset>
                <div className="mt-5 flex justify-end border-t pt-4">
                  <Button type="submit" disabled={!!saving}>
                    {saving === "grades" ? (
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                    ) : null}
                    {saving === "grades"
                      ? "Saving…"
                      : "Save grading preferences"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
          <Card
            id="appearance-settings"
            className="scroll-mt-6 gap-5 shadow-xs"
          >
            <CardHeader>
              <CardTitle className="text-base tracking-tight">
                Appearance
              </CardTitle>
              <CardDescription>
                A comfortable view, day or night
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
                <div>
                  <p className="text-sm font-medium">Workspace theme</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Choose light, dark, or follow your system.
                  </p>
                </div>
                <ModeToggle />
              </div>
            </CardContent>
          </Card>
          <div
            id="session-settings"
            className="flex scroll-mt-6 flex-wrap items-center justify-between gap-4 rounded-xl border bg-muted/20 p-5"
          >
            <div>
              <h2 className="text-sm font-semibold">Your session</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Sign out of your workspace on this device.
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
