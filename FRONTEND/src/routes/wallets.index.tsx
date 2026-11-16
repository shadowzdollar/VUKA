import { createFileRoute } from "@tanstack/react-router";
import { DashboardCustomizer } from "@/components/dashboard/dashboard-customizer";

export const Route = createFileRoute("/wallets/")({
  head: () => ({
    meta: [
      { title: "Dashboard — VUKA" },
      {
        name: "description",
        content:
          "Customizable fintech treasury dashboard with live ledger and cross-border settlement widgets.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return <DashboardCustomizer />;
}
