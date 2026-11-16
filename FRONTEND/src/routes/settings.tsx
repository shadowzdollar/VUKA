import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SettingsPageClient } from "@/components/settings/settings-page-client";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — VUKA" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Suspense>
          <SettingsPageClient />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
