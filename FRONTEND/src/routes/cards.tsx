import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CardsPageClient } from "@/components/cards/cards-page-client";

export const Route = createFileRoute("/cards")({
  head: () => ({
    meta: [{ title: "Cards — VUKA" }],
  }),
  component: CardsPage,
});

function CardsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <CardsPageClient />
      </div>
    </DashboardLayout>
  );
}
