import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SpendingHeatmap } from "@/components/analytics/spending-heatmap";
import { CategoryDonut } from "@/components/analytics/category-donut";
import { MonthComparison } from "@/components/analytics/month-comparison";
import { RecurringDetector } from "@/components/analytics/recurring-detector";
import { AiInsights } from "@/components/analytics/ai-insights";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — VUKA" },
      {
        name: "description",
        content:
          "Volume trends, corridor flows, payment-size distribution, reliability and activity patterns.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <SpendingHeatmap />
        <div className="grid gap-4 lg:grid-cols-2">
          <CategoryDonut />
          <MonthComparison />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <RecurringDetector />
          <AiInsights />
        </div>
      </div>
    </DashboardLayout>
  );
}
