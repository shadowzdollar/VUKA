import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";

/**
 * Layout for /wallets: shared cloned DashboardLayout with sidebar & header.
 */
export const Route = createFileRoute("/wallets")({
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ),
});
