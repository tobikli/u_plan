"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { AccountForm } from "../account-form";
import { toast } from "sonner";
import { useData } from "@/lib/data-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import CenteredSpinner from "@/components/ui/centered-spinner";

export default function Page() {
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");

  const { preferences, refreshPreferences, loading } = useData();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) return;
      const user = data.user;
      setEmail(user.email ?? "");
      setCreatedAt(user.created_at ?? "");
      const metaName =
        (user.user_metadata as { full_name?: string; name?: string } | null)
          ?.full_name ??
        (user.user_metadata as { full_name?: string; name?: string } | null)
          ?.name ??
        "";
      setName(metaName);
    });
  }, []);

  const [gradeMin, setGradeMin] = useState<number>(preferences?.grade_min ?? 1);
  const [gradeMax, setGradeMax] = useState<number>(preferences?.grade_max ?? 5);
  const [gradePassed, setGradePassed] = useState<number>(
    preferences?.grade_passed ?? 4
  );
  const [gradeIncludeFailed, setGradeIncludeFailed] = useState<boolean>(
    preferences?.grade_include_failed ?? false
  );

  useEffect(() => {
    if (!preferences) return;
    setGradeMin(preferences.grade_min ?? 1);
    setGradeMax(preferences.grade_max ?? 5);
    setGradePassed(preferences.grade_passed ?? 4);
    setGradeIncludeFailed(preferences.grade_include_failed ?? false);
  }, [preferences]);

  if (loading) {
    return (
      <CenteredSpinner />
    );
  }

  const saveProgram = async () => {
    const supabase = createClient();
    const { data: userResult, error: userError } =
      await supabase.auth.getUser();
    if (userError || !userResult.user) {
      toast.error("Could not get user information");
      return;
    }

    const { error } = await supabase
      .from("preferences")
      .update({
        user_id: userResult.user.id,
        grade_include_failed: gradeIncludeFailed,
      })
      .eq("user_id", userResult.user.id);

    if (error) {
      toast.error("Failed to save program settings" + error.message);
      return;
    }
    refreshPreferences();
    toast.success("Program settings saved");
  };

const saveCourses = async () => {
    const supabase = createClient();
    const { data: userResult, error: userError } =
      await supabase.auth.getUser();
    if (userError || !userResult.user) {
      toast.error("Could not get user information");
      return;
    }

    if (gradeMin >= gradeMax || gradePassed < gradeMin || gradePassed > gradeMax) {
      toast.error("Invalid grade range");
      return;
    }

    const { error } = await supabase
      .from("preferences")
      .update({
        user_id: userResult.user.id,
        grade_min: gradeMin,
        grade_max: gradeMax,
        grade_passed: gradePassed,
      })
      .eq("user_id", userResult.user.id);

    if (error) {
      toast.error("Failed to save course settings" + error.message);
      return;
    }
    refreshPreferences();
    toast.success("Course settings saved");
  };

  return (
    <div className="flex flex-col gap-6 m-5">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account, theme, and session.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Update your profile and credentials.
            </CardDescription>
            <CardAction>
              <AccountForm trigger={<Button variant="outline">Edit</Button>} />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{name || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{email || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>
                {createdAt ? new Date(createdAt).toLocaleDateString() : "-"}
              </span>
            </div>
            <Button asChild variant="link" className="px-0 text-primary">
              <a href="/auth/update-password">Update password</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>
              Switch between light, dark, or system.
            </CardDescription>
            <CardAction>
              <ModeToggle />
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Theme preference applies across the dashboard.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Program</CardTitle>
            <CardDescription>
              Preferences for your study programs.
            </CardDescription>
            <CardAction>
              <Button onClick={saveProgram} variant="outline">
                Save
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center gap-3 my-2">
              <Checkbox
                checked={gradeIncludeFailed}
                onCheckedChange={(checked) => setGradeIncludeFailed(!!checked)}
              />
              <Label htmlFor="gradeIncludeFailed">
                Include failed courses in GPA calculation
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>Preferences for your courses.</CardDescription>
            <CardAction>
              <Button onClick={saveCourses} variant="outline">
                Save
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <Label htmlFor="gradeMin">Minimum Grade</Label>
              <Input
                id="gradeMin"
                type="number"
                step="0.1"
                value={gradeMin}
                onChange={(e) => setGradeMin(Number(e.target.value))}
                className="mt-1 mb-3 w-40"
              />
            </div>
            <div className="flex justify-between">
              <Label htmlFor="gradeMax">Maximum Grade</Label>
              <Input
                id="gradeMax"
                type="number"
                step="0.1"
                value={gradeMax}
                onChange={(e) => setGradeMax(Number(e.target.value))}
                className="mt-1 mb-3 w-40"
              />
            </div>
            <div className="flex justify-between">
              <Label htmlFor="gradePassed">Passing Grade</Label>
              <Input
                id="gradePassed"
                type="number"
                value={gradePassed}
                step="0.1"
                onChange={(e) => setGradePassed(Number(e.target.value))}
                className="mt-1 mb-3 w-40"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Sign out of your current session.</CardDescription>
            <CardAction>
              <LogoutButton />
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Logging out will end your session on this device.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
