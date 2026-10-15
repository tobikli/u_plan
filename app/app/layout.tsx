import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { loadWorkspace } from "@/lib/workspace-server";
import { DataProvider } from "@/lib/data-provider";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createHash } from "crypto";

import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const initialData = await loadWorkspace(supabase, user.id);

  const email = user.email?.trim().toLowerCase() ?? "";
  const hash = email ? createHash("md5").update(email).digest("hex") : "";
  const avatarUrl = user.user_metadata?.avatar_url;
  const gravatarUrl = hash
    ? `https://www.gravatar.com/avatar/${hash}?s=128&d=identicon`
    : undefined;
  const displayName =
    (user.user_metadata as { full_name?: string; name?: string } | null)
      ?.full_name ??
    (user.user_metadata as { full_name?: string; name?: string } | null)
      ?.name ??
    user.email ??
    "User";

  return (
    <DataProvider initialData={initialData}>
      <SidebarProvider
        className="app-workspace"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 64)",
            "--header-height": "calc(var(--spacing) * 16)",
          } as React.CSSProperties
        }
      >
        <AppSidebar
          variant="inset"
          userEmail={user.email ?? undefined}
          userName={displayName}
          userAvatar={avatarUrl ?? gravatarUrl}
        />
        <SidebarInset className="min-w-0 bg-background overflow-x-hidden md:rounded-2xl md:shadow-xs md:ring-1 md:ring-border/60">
          <SiteHeader />
          <main className="min-w-0 max-w-full flex-1 bg-muted/20">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DataProvider>
  );
}
