import { createFileRoute } from "@tanstack/react-router";
import { OperatorCockpit } from "@/components/vuka/operator-cockpit";
import { Shell } from "@/components/vuka/shell";
import { TraderHome } from "@/components/vuka/trader-home";
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
  component: () => (
    <Shell>
      <ByRole />
    </Shell>
  ),
});

function ByRole() {
  const { session } = useSession();
  return session.status === "operator" ? <OperatorCockpit /> : <TraderHome />;
}
