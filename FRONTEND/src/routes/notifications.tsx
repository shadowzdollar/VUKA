import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { NotificationsPageClient } from "@/components/notifications/notifications-page-client";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — VUKA" },
      {
        name: "description",
        content: "Account and payment notifications for your trader account.",
      },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <NotificationsPageClient />
      </div>
    </DashboardLayout>
  );
}
