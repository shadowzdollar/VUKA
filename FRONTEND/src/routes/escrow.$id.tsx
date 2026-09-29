import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading } from "@/components/vuka/query-state";
import { Chip } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { invoices as invoiceApi } from "@/lib/api/endpoints";
import { invoiceSubtotal, invoiceTotal } from "@/components/vuka/trader-invoices";
import { day, money } from "@/lib/format";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/escrow/$id")({
  head: () => ({ meta: [{ title: "Invoice — VUKA" }] }),
  component: InvoiceDetail,
});

function InvoiceDetail() {
  const { session } = useSession();
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["invoice", id], queryFn: () => invoiceApi.get(id) });

  if (session.status === "operator") {
    return (
      <EmptyState>
        Invoice detail is a trader view. Operators observe the on-chain escrow register on the{" "}
        <Link to="/escrow" className="underline underline-offset-4">
          escrow list
        </Link>
        .
      </EmptyState>
    );
  }
  const traderId = session.status === "trader" ? session.trader.id : undefined;

  return (
    <div className="space-y-6">
      <Link
        to="/escrow"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All invoices
      </Link>

      {q.isPending ? (
        <Loading label="Loading invoice" />
      ) : q.isError ? (
        <div className="border-2 border-foreground p-4 text-sm">{describeError(q.error)}</div>
      ) : (
        (() => {
          const invoice = q.data;
          const iOwe = traderId ? invoice.counterparty_user_id === traderId : false;
          const subtotal = invoiceSubtotal(invoice);
          const total = invoiceTotal(invoice);
          return (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl leading-tight">{invoice.number}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Issued {day(invoice.issue_date)} · due {day(invoice.due_date)} ·{" "}
                    {iOwe
                      ? `you owe ${invoice.issuer_name}`
                      : `${invoice.counterparty_name} owes you`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Chip tone={invoice.status === "PAID" ? "invert" : "live"}>{invoice.status}</Chip>
                  {iOwe && invoice.status !== "PAID" ? (
                    <Button asChild className="rounded-none font-mono text-xs uppercase">
                      <Link to="/send" search={{ invoice: invoice.number }}>
                        Pay this invoice
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-border bg-card p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Issued by
                  </div>
                  <div className="mt-1 font-display text-xl">{invoice.issuer_name}</div>
                </div>
                <div className="border border-border bg-card p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Billed to
                  </div>
                  <div className="mt-1 font-display text-xl">{invoice.counterparty_name}</div>
                </div>
              </div>

              <div className="border border-border bg-card p-5">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Line items
                </h2>
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <th scope="col" className="py-2">
                        Item
                      </th>
                      <th scope="col" className="py-2 text-right">
                        Qty
                      </th>
                      <th scope="col" className="py-2 text-right">
                        Unit
                      </th>
                      <th scope="col" className="py-2 text-right">
                        Line
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((it) => (
                      <tr key={it.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2">{it.description}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{it.quantity}</td>
                        <td className="py-2 text-right font-mono tabular-nums">
                          {money(it.unit_price, invoice.currency)}
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums">
                          {money(it.quantity * it.unit_price, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <dl className="mt-4 space-y-1.5 border-t border-dashed border-border pt-3 font-mono text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="tabular-nums">{money(subtotal, invoice.currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">VAT {invoice.vat_rate}%</dt>
                    <dd className="tabular-nums">{money(total - subtotal, invoice.currency)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-base font-normal text-foreground">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{money(total, invoice.currency)}</dd>
                  </div>
                </dl>
              </div>

              {invoice.terms || invoice.notes ? (
                <p className="text-sm text-muted-foreground">
                  {[invoice.terms, invoice.notes].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </>
          );
        })()
      )}
    </div>
  );
}
