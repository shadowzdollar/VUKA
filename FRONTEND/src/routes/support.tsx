import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SupportPageClient } from "@/components/support/support-page-client";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — VUKA" }] }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <SupportPageClient />
      </div>
    </DashboardLayout>
  );
}
