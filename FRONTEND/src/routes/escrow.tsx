import { createFileRoute } from "@tanstack/react-router";
import { OperatorEscrows } from "@/components/vuka/operator-escrows";
import { Shell } from "@/components/vuka/shell";
import { TraderInvoices } from "@/components/vuka/trader-invoices";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/escrow")({
  head: () => ({
    meta: [
      { title: "Invoices & Escrow — VUKA" },
      {
        name: "description",
        content:
          "Invoice-linked payments for traders, and the reconciled on-chain escrow register for operators.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <ByRole />
    </Shell>
  ),
});

/** Traders manage invoices; operators observe the on-chain escrow read model. */
function ByRole() {
  const { session } = useSession();
  return session.status === "operator" ? <OperatorEscrows /> : <TraderInvoices />;
}
