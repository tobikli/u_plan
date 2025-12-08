import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DataProvider } from "@/lib/data-provider"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { createHash } from "crypto"

import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const email = user.email?.trim().toLowerCase() ?? ""
  const hash = email ? createHash("md5").update(email).digest("hex") : ""
  const gravatarUrl = hash
    ? `https://www.gravatar.com/avatar/${hash}?s=128&d=identicon`
    : undefined
  const displayName =
    (user.user_metadata as { full_name?: string; name?: string } | null)?.full_name ??
    (user.user_metadata as { full_name?: string; name?: string } | null)?.name ??
    user.email ??
    "User"

  return (
    <DataProvider>
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar
          variant="inset"
          userEmail={user.email ?? undefined}
          userName={displayName}
          userAvatar={gravatarUrl}
        />
        <SidebarInset>
          <SiteHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </DataProvider>
  )
}
