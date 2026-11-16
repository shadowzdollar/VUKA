import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { BudgetRings } from "@/components/budgets/budget-rings";
import { SavingsGoals } from "@/components/budgets/savings-goals";
import { SpendingCalendar } from "@/components/budgets/spending-calendar";
import { MonthProjection } from "@/components/budgets/month-projection";

export const Route = createFileRoute("/budgets")({
  head: () => ({
    meta: [{ title: "Budgets — VUKA" }],
  }),
  component: BudgetsPage,
});

function BudgetsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <BudgetRings />
        <SavingsGoals />
        <div className="grid gap-4 lg:grid-cols-2">
          <SpendingCalendar />
          <MonthProjection />
        </div>
      </div>
    </DashboardLayout>
  );
}
