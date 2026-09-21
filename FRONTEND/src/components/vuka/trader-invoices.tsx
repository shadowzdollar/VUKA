import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel } from "@/components/vuka/shell";
import { describeError, isApiError } from "@/lib/api/client";
import { invoices as invoiceApi, ledger } from "@/lib/api/endpoints";
import type { Invoice, Recipient } from "@/lib/api/types";
import { day, money, shortId } from "@/lib/format";
import { useTrader } from "@/lib/session";
import { useInvoices, useWallet } from "@/lib/trader-data";
import { cn } from "@/lib/utils";

export const invoiceSubtotal = (i: Invoice) =>
  i.items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
export const invoiceTotal = (i: Invoice) => invoiceSubtotal(i) * (1 + i.vat_rate / 100);

type Tab = "issued" | "received";

export function TraderInvoices() {
  const trader = useTrader();
  const [tab, setTab] = useState<Tab>("received");
  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<Invoice | null>(null);
  const list = useInvoices(tab);
  const all = useInvoices();

  const totals = useMemo(() => {
    const rows = all.data ?? [];
    const receivable = rows.filter((i) => i.issuer_user_id === trader.id && i.status !== "PAID");
    const payable = rows.filter((i) => i.counterparty_user_id === trader.id && i.status !== "PAID");
    return {
      receivable: receivable.length,
      payable: payable.length,
      paid: rows.filter((i) => i.status === "PAID").length,
    };
  }, [all.data, trader.id]);

  return (
    <>
      <PageHeader
        eyebrow="Trade documents"
        title="Invoices"
        description="Every payment is bound to the invoice it settles. Issue an invoice to a buyer, or pay one you have received; the status turns PAID when a successful ledger transfer references its number."
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-none font-mono text-xs uppercase"
          >
            New invoice
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Awaiting payment to you" value={totals.receivable} sub="Issued, unpaid" />
        <Metric label="You owe" value={totals.payable} sub="Received, unpaid" />
        <Metric label="Settled" value={totals.paid} sub="Paid invoices" />
      </div>

      <Panel
        title="Invoice register"
        meta={
          <div className="flex gap-1.5">
            {(["received", "issued"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className="cursor-pointer">
                <Chip tone={tab === t ? "invert" : "neutral"}>{t}</Chip>
              </button>
            ))}
          </div>
        }
      >
        <QueryBoundary
          query={list}
          isEmpty={(d) => d.length === 0}
          empty={
            tab === "issued" ? "You have not issued any invoices yet." : "No invoices received."
          }
        >
          {(rows) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="py-2">Number</th>
                    <th className="py-2">{tab === "issued" ? "Buyer" : "Supplier"}</th>
                    <th className="py-2">Issued</th>
                    <th className="py-2">Due</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((i) => (
                    <tr
                      key={i.id}
                      onClick={() => setActive(i)}
                      className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/40"
                    >
                      <td className="py-2.5 font-mono text-xs">{i.number}</td>
                      <td className="py-2.5 font-mono text-xs text-muted-foreground">
                        {shortId(tab === "issued" ? i.counterparty_user_id : i.issuer_user_id)}
                      </td>
                      <td className="py-2.5 font-mono text-xs tabular-nums">{day(i.issue_date)}</td>
                      <td className="py-2.5 font-mono text-xs tabular-nums">{day(i.due_date)}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums">
                        {money(invoiceTotal(i), i.currency)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Chip tone={i.status === "PAID" ? "invert" : "live"}>{i.status}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryBoundary>
      </Panel>

      <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} />
      <InvoiceDialog invoice={active} onClose={() => setActive(null)} />
    </>
  );
}

function InvoiceDialog({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const trader = useTrader();
  const iOwe = invoice ? invoice.counterparty_user_id === trader.id : false;
  return (
    <Dialog open={invoice !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-none sm:max-w-2xl">
        {invoice ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                {invoice.number}
              </DialogTitle>
              <DialogDescription>
                Issued {day(invoice.issue_date)} · due {day(invoice.due_date)} ·{" "}
                {iOwe ? "you are the buyer" : "you are the supplier"}
              </DialogDescription>
            </DialogHeader>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="py-2">Item</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit</th>
                  <th className="py-2 text-right">Line</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it) => (
                  <tr key={it.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2">{it.description}</td>
                    <td className="py-2 text-right font-mono tabular-nums">{it.quantity}</td>
                    <td className="py-2 text-right font-mono tabular-nums">
                      {money(it.unit_price)}
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums">
                      {money(it.quantity * it.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="space-y-1.5 border border-border p-3 font-mono text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">
                  {money(invoiceSubtotal(invoice), invoice.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">VAT {invoice.vat_rate}%</dt>
                <dd className="tabular-nums">
                  {money(invoiceTotal(invoice) - invoiceSubtotal(invoice), invoice.currency)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(invoiceTotal(invoice), invoice.currency)}</dd>
              </div>
            </dl>
            {invoice.terms || invoice.notes ? (
              <p className="text-xs text-muted-foreground">
                {[invoice.terms, invoice.notes].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            <DialogFooter className="gap-2">
              <Chip tone={invoice.status === "PAID" ? "invert" : "live"}>{invoice.status}</Chip>
              {iOwe && invoice.status !== "PAID" ? (
                <Button asChild className="rounded-none font-mono text-xs uppercase">
                  <Link to="/send" search={{ invoice: invoice.number }}>
                    Pay this invoice
                  </Link>
                </Button>
              ) : null}
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface Line {
  description: string;
  quantity: string;
  unit_price: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const suggestNumber = () =>
  `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

function CreateInvoiceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const trader = useTrader();
  const qc = useQueryClient();
  const wallet = useWallet();
  const currency = wallet.data?.accounts.find((a) => a.type === "BUSINESS")?.currency ?? "RWF";

  const [phone, setPhone] = useState("");
  const [buyer, setBuyer] = useState<Recipient | null>(null);
  const [number, setNumber] = useState(suggestNumber);
  const [issue, setIssue] = useState(today);
  const [due, setDue] = useState(() => inDays(14));
  const [vat, setVat] = useState("18");
  const [terms, setTerms] = useState("");
  const [lines, setLines] = useState<Line[]>([{ description: "", quantity: "1", unit_price: "" }]);
  const [invoiceCurrency, setInvoiceCurrency] = useState("");
  const cur = invoiceCurrency || currency;

  const lookup = useMutation({
    mutationFn: () => ledger.recipient(phone.trim()),
    onSuccess: setBuyer,
    onError: (e) => {
      setBuyer(null);
      toast.error(
        isApiError(e) && e.status === 404 ? "No VUKA trader with that number" : describeError(e),
      );
    },
  });

  const parsed = lines.map((l) => ({
    description: l.description.trim(),
    quantity: Number(l.quantity),
    unit_price: Number(l.unit_price),
  }));
  const linesValid = parsed.every((l) => l.description && l.quantity > 0 && l.unit_price >= 0);
  const subtotal = parsed.reduce((s, l) => s + (l.quantity > 0 ? l.quantity * l.unit_price : 0), 0);
  const vatRate = Number(vat);
  const total = subtotal * (1 + (Number.isFinite(vatRate) ? vatRate : 0) / 100);

  const create = useMutation({
    mutationFn: () =>
      invoiceApi.create(trader.id, {
        number: number.trim(),
        counterparty_user_id: buyer!.user.id,
        currency: cur,
        issue_date: issue,
        due_date: due,
        vat_rate: vatRate,
        ...(terms.trim() ? { terms: terms.trim() } : {}),
        items: parsed,
      }),
    onSuccess: (inv) => {
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(`Invoice ${inv.number} issued`, {
        description: `${money(total, cur)} to ${buyer!.user.full_name}`,
      });
      onOpenChange(false);
      setBuyer(null);
      setPhone("");
      setNumber(suggestNumber());
      setLines([{ description: "", quantity: "1", unit_price: "" }]);
    },
    onError: (e) => toast.error("Invoice not created", { description: describeError(e) }),
  });

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const ready =
    !!buyer &&
    number.trim() &&
    linesValid &&
    due >= issue &&
    Number.isFinite(vatRate) &&
    vatRate >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            Issue invoice
          </DialogTitle>
          <DialogDescription>
            The buyer will see it under Received and can pay it directly from Send Payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
              Buyer mobile number
            </Label>
            <div className="flex gap-2">
              <Input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setBuyer(null);
                }}
                placeholder="+250700000000"
                className="rounded-none font-mono"
              />
              <Button
                variant="outline"
                className="rounded-none font-mono text-xs uppercase"
                disabled={!phone.trim() || lookup.isPending}
                onClick={() => lookup.mutate()}
              >
                Look up
              </Button>
            </div>
            {buyer ? <p className="text-xs">Billing {buyer.user.full_name}</p> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Invoice no." className="sm:col-span-2">
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="rounded-none font-mono"
              />
            </Field>
            <Field label="Currency">
              <Input
                value={cur}
                onChange={(e) => setInvoiceCurrency(e.target.value.toUpperCase().slice(0, 3))}
                className="rounded-none font-mono"
              />
            </Field>
            <Field label="VAT %">
              <Input
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                inputMode="decimal"
                className="rounded-none font-mono"
              />
            </Field>
            <Field label="Issue date">
              <Input
                type="date"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className="rounded-none font-mono"
              />
            </Field>
            <Field label="Due date">
              <Input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="rounded-none font-mono"
              />
            </Field>
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">Line items</Label>
            {lines.map((l, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_80px_120px_32px]">
                <Input
                  placeholder="Description"
                  value={l.description}
                  onChange={(e) => setLine(i, { description: e.target.value })}
                  className="rounded-none"
                />
                <Input
                  placeholder="Qty"
                  inputMode="decimal"
                  value={l.quantity}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                  className="rounded-none font-mono"
                />
                <Input
                  placeholder="Unit price"
                  inputMode="decimal"
                  value={l.unit_price}
                  onChange={(e) => setLine(i, { unit_price: e.target.value })}
                  className="rounded-none font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Remove line"
                  disabled={lines.length === 1}
                  onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                  className="rounded-none"
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="rounded-none font-mono text-[10px] uppercase"
              onClick={() =>
                setLines((ls) => [...ls, { description: "", quantity: "1", unit_price: "" }])
              }
            >
              Add line
            </Button>
          </div>

          <Field label="Terms (optional)">
            <Textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="min-h-16 rounded-none"
            />
          </Field>

          <div className={cn("flex justify-between border border-border p-3 font-mono text-xs")}>
            <span className="text-muted-foreground">Total incl. VAT</span>
            <span className="tabular-nums">{money(total, cur)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="rounded-none font-mono text-xs uppercase"
            disabled={!ready || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Issuing…" : "Issue invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">{label}</Label>
      {children}
    </div>
  );
}
