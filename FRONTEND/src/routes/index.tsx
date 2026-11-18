import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Landing } from "@/components/vuka/landing";
import { OperatorCockpit } from "@/components/vuka/operator-cockpit";
import { DashboardCustomizer } from "@/components/dashboard/dashboard-customizer";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VUKA — Overview" },
      {
        name: "description",
        content:
          "Wallets, invoices and cross-border settlements for traders; reconciliation and risk controls for operators.",
      },
    ],
  }),
  component: Home,
});

/** Signed-out visitors get the public landing page; signed-in users get their workspace. */
function Home() {
  const { session } = useSession();
  if (session.status === "anon") return <Landing />;
  return (
    <DashboardLayout>
      <ByRole />
    </DashboardLayout>
  );
}

/** Traders land on the live, customizable dashboard; operators keep their reconciliation cockpit.
 * (`TraderHome` is intentionally kept in the codebase for future use.) */
function ByRole() {
  const { session } = useSession();
  return session.status === "operator" ? <OperatorCockpit /> : <DashboardCustomizer />;
}
