import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardCustomizer } from "@/components/dashboard/dashboard-customizer";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — VUKA" },
      { name: "description", content: "Fintech treasury & financial overview dashboard." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardCustomizer />
    </DashboardLayout>
  );
}
