import { createFileRoute } from "@tanstack/react-router";
import { OperatorEscrows } from "@/components/vuka/operator-escrows";
import { TraderInvoices } from "@/components/vuka/trader-invoices";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/escrow/")({
  component: ByRole,
});

/** Traders manage invoices; operators observe the on-chain escrow read model. */
function ByRole() {
  const { session } = useSession();
  return session.status === "operator" ? <OperatorEscrows /> : <TraderInvoices />;
}
