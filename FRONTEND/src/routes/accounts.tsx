import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AccountsPageClient } from "@/components/accounts/accounts-page-client";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [{ title: "Accounts — VUKA" }],
  }),
  component: AccountsPage,
});

function AccountsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <AccountsPageClient />
      </div>
    </DashboardLayout>
  );
}
