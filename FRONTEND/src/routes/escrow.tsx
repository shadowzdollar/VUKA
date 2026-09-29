import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/vuka/shell";

/**
 * Layout for /escrow and /escrow/$id: shared Shell chrome, with the role-aware list
 * (escrow.index.tsx) or an invoice's detail (escrow.$id.tsx) rendered through the outlet.
 */
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
      <Outlet />
    </Shell>
  ),
});
