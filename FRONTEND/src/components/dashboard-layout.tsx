import { useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { CommandPalette } from "@/components/command-palette"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DashboardDataProvider, useDashboardData } from "@/lib/dashboard-data"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"

/** Shows whether the page is reading the VUKA engine or illustrative sandbox content. */
function DataSourceChip() {
  const { mode, loading } = useDashboardData()
  const label =
    mode === "demo" ? "Demo data" : loading ? "Syncing ledger…" : mode === "operator" ? "Live · platform analytics" : "Live · ledger"
  return (
    <span
      className={cn(
        "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider sm:inline-flex",
        mode === "demo" ? "text-muted-foreground" : "text-foreground",
      )}
      title="Sandbox environment: no real funds move"
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          mode === "demo" ? "bg-muted-foreground" : loading ? "animate-pulse bg-amber-400" : "bg-emerald-500",
        )}
      />
      {label}
    </span>
  )
}

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session } = useSession()
  const navigate = useNavigate()

  // The dashboard reads the signed-in trader's (or operator's) own ledger; visitors sign in first.
  useEffect(() => {
    if (session.status === "anon") void navigate({ to: "/login" })
  }, [session.status, navigate])

  if (session.status === "loading" || session.status === "anon") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <DashboardDataProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              />
              <DynamicBreadcrumb />
            </div>
            <div className="ml-auto flex items-center gap-2 pr-4">
              <DataSourceChip />
              <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
              <ThemeToggle />
            </div>
          </header>
          <CommandPalette />
          <main className="flex flex-1 flex-col">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardDataProvider>
  )
}

export default DashboardLayout;
