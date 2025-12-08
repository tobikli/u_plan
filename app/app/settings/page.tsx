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

export default function Page() {
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");

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

  return (
    <div className="flex flex-col gap-6 m-5">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account, theme, and session.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Update your profile and credentials.</CardDescription>
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
              <span>{createdAt ? new Date(createdAt).toLocaleDateString() : "-"}</span>
            </div>
            <Button asChild variant="link" className="px-0 text-primary">
              <a href="/auth/update-password">Update password</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Switch between light, dark, or system.</CardDescription>
            <CardAction>
              <ModeToggle />
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Theme preference applies across the dashboard.
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
