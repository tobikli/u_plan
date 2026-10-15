"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FormDialog } from "@/components/workspace/form-dialog";
import {
  EditSection,
  DeleteRecordButton,
} from "@/components/workspace/edit-dialog";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function AccountForm({ trigger }: { trigger?: React.ReactNode }) {
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const router = useRouter();

  const loadAccount = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const {
        data: { user },
        error,
      } = await createClient().auth.getUser();
      if (error || !user) {
        setLoadError(true);
        return;
      }
      setName(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "");
      setEmail(user.email ?? "");
      setOriginalEmail(user.email ?? "");
      setCreatedAt(user.created_at ?? "");
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };
  const changeOpen = (next: boolean) => {
    if (submitting || deleting) return;
    setOpen(next);
    if (next) void loadAccount();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || loading || loadError) return;
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail) {
      toast.error("Enter your name and email address");
      return;
    }
    setSubmitting(true);
    try {
      const emailChanged = cleanEmail !== originalEmail;
      const { error } = await createClient().auth.updateUser({
        ...(emailChanged ? { email: cleanEmail } : {}),
        data: { name: cleanName, full_name: cleanName },
      });
      if (error) {
        toast.error(error.message ?? "Failed to save account");
        return;
      }
      setOpen(false);
      toast.success(
        emailChanged
          ? "Profile saved. Follow any email confirmation instructions."
          : "Account updated",
      );
      router.refresh();
    } catch {
      toast.error("Unable to save your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch("/auth/delete", { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error ?? "Failed to delete account");
        return false;
      }
      await createClient().auth.signOut();
      setOpen(false);
      toast.success("Account deleted");
      router.push("/auth/login");
      router.refresh();
      return true;
    } finally {
      setDeleting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Account</Button>}
      </DialogTrigger>
      <FormDialog
        title="Your account"
        eyebrow="Personal settings"
        description="Manage your profile, email address, and account security."
        onSubmit={handleSubmit}
        busy={submitting || deleting}
        disabled={loading}
        footer={
          <>
            <div className="mr-auto">
              <DeleteRecordButton
                kind="account"
                name={originalEmail || "your account"}
                disabled={loading || loadError || submitting || deleting}
                onDelete={handleDelete}
              />
            </div>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                type="button"
                disabled={submitting || deleting}
                onClick={() => changeOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || loadError || submitting || deleting}
              >
                {submitting ? (
                  <>
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </>
        }
      >
        {loading ? (
          <div role="status" aria-label="Loading account" className="space-y-5">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-24" />
            <span className="sr-only">Loading account details…</span>
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          >
            <p className="text-sm font-medium">
              Your account details couldn’t be loaded.
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Try again before making any changes.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void loadAccount()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <EditSection title="Profile">
              <div className="grid gap-2">
                <Label htmlFor={`${fieldId}-name`}>Display name</Label>
                <Input
                  id={`${fieldId}-name`}
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  placeholder="Your name"
                  required
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  The name shown in your workspace.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${fieldId}-email`}>Email address</Label>
                <Input
                  id={`${fieldId}-email`}
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  aria-describedby={`${fieldId}-email-help`}
                />
                <p
                  id={`${fieldId}-email-help`}
                  className="text-xs leading-5 text-muted-foreground"
                >
                  Changing your email may require confirmation. Follow any
                  confirmation link sent to your inbox.
                </p>
              </div>
            </EditSection>
            <div className="border-t" />
            <EditSection title="Security">
              <Link
                href="/auth/update-password"
                className="group flex items-center gap-3 rounded-lg border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
              >
                <span className="rounded-lg border bg-background p-2">
                  <LockKeyhole aria-hidden="true" className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">
                    Update password
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Choose a new password for your account.
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </Link>
            </EditSection>
            {createdAt && (
              <p className="text-[11px] text-muted-foreground">
                Member since{" "}
                {new Date(createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </>
        )}
      </FormDialog>
    </Dialog>
  );
}
