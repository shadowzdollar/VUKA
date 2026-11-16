import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TransfersPageClient } from "@/components/transfers/transfers-page-client";

export const Route = createFileRoute("/transfers")({
  head: () => ({
    meta: [{ title: "Transfers — VUKA" }],
  }),
  component: TransfersPage,
});

function TransfersPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <TransfersPageClient />
      </div>
    </DashboardLayout>
  );
}
