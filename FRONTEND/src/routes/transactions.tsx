import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TransactionsPageClient } from "@/components/transactions/transactions-page-client";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [{ title: "Transactions — VUKA" }],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <TransactionsPageClient />
      </div>
    </DashboardLayout>
  );
}
