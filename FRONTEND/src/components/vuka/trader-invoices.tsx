import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
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
import { DataTable } from "@/components/vuka/data-table";
import { LazyHistogramChart } from "@/components/vuka/lazy-charts";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel } from "@/components/vuka/shell";
import { describeError, isApiError } from "@/lib/api/client";
import { invoices as invoiceApi, ledger } from "@/lib/api/endpoints";
import type { Invoice, Recipient } from "@/lib/api/types";
import { day, money } from "@/lib/format";
import { useTrader } from "@/lib/session";
import { useInvoices, useWallet } from "@/lib/trader-data";
import { cn } from "@/lib/utils";

export const invoiceSubtotal = (i: Invoice) =>
  i.items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
export const invoiceTotal = (i: Invoice) => invoiceSubtotal(i) * (1 + i.vat_rate / 100);

type Tab = "issued" | "received";

const AGEING = ["Not yet due", "1–30 days late", "31–60 days late", "60+ days late"];

/** Buckets unpaid invoices by how far past their due date they are (counts, currency-neutral). */
function ageing(invoices: Invoice[]) {
  const counts = [0, 0, 0, 0];
  const today = Date.now();
  for (const i of invoices) {
    const late = Math.floor((today - new Date(i.due_date).getTime()) / 86_400_000);
    counts[late <= 0 ? 0 : late <= 30 ? 1 : late <= 60 ? 2 : 3]! += 1;
  }
  return AGEING.map((label, idx) => ({ label, count: counts[idx] ?? 0 }));
}

export function TraderInvoices() {
  const trader = useTrader();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("received");
  const [createOpen, setCreateOpen] = useState(false);
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

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Owed to you · ageing">
          <LazyHistogramChart
            unit="invoices"
            ariaLabel="Unpaid invoices you issued, by days past due"
            data={ageing(
              (all.data ?? []).filter((i) => i.issuer_user_id === trader.id && i.status !== "PAID"),
            )}
          />
        </Panel>
        <Panel title="You owe · ageing">
          <LazyHistogramChart
            unit="invoices"
            ariaLabel="Unpaid invoices you received, by days past due"
            data={ageing(
              (all.data ?? []).filter(
                (i) => i.counterparty_user_id === trader.id && i.status !== "PAID",
              ),
            )}
          />
        </Panel>
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
            <DataTable
              caption={tab === "issued" ? "Issued invoices" : "Received invoices"}
              exportName={`vuka-invoices-${tab}.csv`}
              rows={rows}
              rowKey={(i) => i.id}
              onRowClick={(i) => void navigate({ to: "/escrow/$id", params: { id: i.id } })}
              initialSort={{ key: "issued", dir: "desc" }}
              columns={[
                {
                  key: "number",
                  header: "Number",
                  sort: (i) => i.number,
                  cell: (i) => <span className="font-mono text-xs">{i.number}</span>,
                },
                {
                  key: "party",
                  header: tab === "issued" ? "Buyer" : "Supplier",
                  text: (i) => (tab === "issued" ? i.counterparty_name : i.issuer_name),
                  cell: (i) => (
                    <span className="text-xs">
                      {tab === "issued" ? i.counterparty_name : i.issuer_name}
                    </span>
                  ),
                },
                {
                  key: "issued",
                  header: "Issued",
                  sort: (i) => i.issue_date,
                  cell: (i) => (
                    <span className="tabular font-mono text-xs">{day(i.issue_date)}</span>
                  ),
                },
                {
                  key: "due",
                  header: "Due",
                  sort: (i) => i.due_date,
                  cell: (i) => <span className="tabular font-mono text-xs">{day(i.due_date)}</span>,
                },
                {
                  key: "total",
                  header: "Total",
                  align: "right",
                  sort: (i) => invoiceTotal(i),
                  text: (i) => `${invoiceTotal(i)} ${i.currency}`,
                  cell: (i) => (
                    <span className="tabular font-mono">{money(invoiceTotal(i), i.currency)}</span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  align: "right",
                  sort: (i) => i.status,
                  cell: (i) => (
                    <Chip tone={i.status === "PAID" ? "invert" : "live"}>{i.status}</Chip>
                  ),
                },
              ]}
              empty={
                tab === "issued" ? "You have not issued any invoices yet." : "No invoices received."
              }
            />
          )}
        </QueryBoundary>
      </Panel>

      <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
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
