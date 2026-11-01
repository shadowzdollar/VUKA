import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  FilePlus2,
  FileText,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
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
import { Chip, Metric, Panel } from "@/components/vuka/shell";
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
    const paid = rows.filter((i) => i.status === "PAID");
    return {
      receivable: receivable.length,
      payable: payable.length,
      paid: paid.length,
      totalCount: rows.length,
    };
  }, [all.data, trader.id]);

  return (
    <div className="space-y-6">
      {/* Executive Trade Documents & Invoice Escrow Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.48)] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-20 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #c2f74d 0%, transparent 70%)" }}
        />
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 hidden w-[320px] opacity-20 select-none xl:block"
        />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c2f74d]/40 bg-[#c2f74d]/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                <span className="size-1.5 rounded-full bg-[#c2f74d]" />
                Invoice-Linked Trade Ledger
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75">
                <ShieldCheck className="size-3 text-[#c2f74d]" /> Auto-Reconciled on Settlement
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Commercial Invoices &amp; Receivables
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Every cross-border trade payment is bound to the commercial invoice it settles. Issue
              structured VAT invoices to buyers or settle payable invoices in one click — status
              automatically transitions to <span className="font-mono text-[#c2f74d]">PAID</span>{" "}
              when the ledger transfer clears.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setCreateOpen(true)}
              className="h-10 rounded-xl bg-[#c2f74d] px-5 font-mono text-xs font-bold uppercase tracking-wider text-[#151515] hover:bg-[#b5eb3b]"
            >
              <FilePlus2 className="mr-1.5 size-4" /> Issue New Invoice
            </Button>
          </div>
        </div>
      </section>

      {/* 4-Column Invoice & Settlement KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={ArrowDownLeft}
          tone="primary"
          label="Accounts Receivable"
          value={totals.receivable}
          sub="Issued to buyers · awaiting payment"
        />
        <Metric
          icon={ArrowUpRight}
          tone="destructive"
          label="Accounts Payable"
          value={totals.payable}
          sub="Received from suppliers · unpaid"
          delay={60}
        />
        <Metric
          icon={CheckCircle2}
          tone="success"
          label="Settled on Ledger"
          value={totals.paid}
          sub="Paid via linked transfers"
          delay={120}
        />
        <Metric
          icon={FileText}
          tone="muted"
          label="Total Trade Documents"
          value={totals.totalCount}
          sub="Issued + received contracts"
          delay={180}
        />
      </div>

      {/* Ageing Histograms */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Receivables Ageing (Owed to You)"
          meta={<Chip tone="live">{totals.receivable} open</Chip>}
        >
          <LazyHistogramChart
            unit="invoices"
            ariaLabel="Unpaid invoices you issued, by days past due"
            data={ageing(
              (all.data ?? []).filter((i) => i.issuer_user_id === trader.id && i.status !== "PAID"),
            )}
          />
        </Panel>
        <Panel
          title="Payables Ageing (You Owe Suppliers)"
          meta={<Chip>{totals.payable} open</Chip>}
        >
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

      {/* Interactive Invoice Register */}
      <Panel
        title="Commercial Invoice Register"
        meta={
          <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
            {(
              [
                { id: "received", label: `Received Payables (${totals.payable})` },
                { id: "issued", label: `Issued Receivables (${totals.receivable})` },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-lg px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition",
                  tab === t.id
                    ? "bg-[#151515] text-[#c2f74d] shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      >
        <QueryBoundary
          query={list}
          isEmpty={(d) => d.length === 0}
          empty={
            tab === "issued"
              ? "You have not issued any invoices yet. Click 'Issue New Invoice' above to bill a counterparty."
              : "No supplier invoices received yet."
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
                  header: "Invoice #",
                  sort: (i) => i.number,
                  cell: (i) => <span className="font-mono text-xs font-bold">{i.number}</span>,
                },
                {
                  key: "party",
                  header: tab === "issued" ? "Buyer Counterparty" : "Supplier Issuer",
                  text: (i) => (tab === "issued" ? i.counterparty_name : i.issuer_name),
                  cell: (i) => (
                    <span className="text-xs font-medium">
                      {tab === "issued" ? i.counterparty_name : i.issuer_name}
                    </span>
                  ),
                },
                {
                  key: "issued",
                  header: "Issue Date",
                  sort: (i) => i.issue_date,
                  cell: (i) => (
                    <span className="tabular font-mono text-xs text-muted-foreground">
                      {day(i.issue_date)}
                    </span>
                  ),
                },
                {
                  key: "due",
                  header: "Due Date",
                  sort: (i) => i.due_date,
                  cell: (i) => (
                    <span className="tabular font-mono text-xs">{day(i.due_date)}</span>
                  ),
                },
                {
                  key: "total",
                  header: "Total (incl. VAT)",
                  align: "right",
                  sort: (i) => invoiceTotal(i),
                  text: (i) => `${invoiceTotal(i)} ${i.currency}`,
                  cell: (i) => (
                    <span className="tabular font-mono font-bold">
                      {money(invoiceTotal(i), i.currency)}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status / Action",
                  align: "right",
                  sort: (i) => i.status,
                  cell: (i) => (
                    <div
                      className="inline-flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Chip tone={i.status === "PAID" ? "live" : "invert"}>{i.status}</Chip>
                      {tab === "received" && i.status !== "PAID" ? (
                        <Button
                          size="sm"
                          className="h-7 rounded-lg bg-[#151515] px-2.5 font-mono text-[10px] font-bold uppercase text-[#c2f74d] hover:bg-[#151515]/90"
                          onClick={() =>
                            void navigate({ to: "/send", search: { invoice: i.number } })
                          }
                        >
                          <Send className="mr-1 size-3" /> Pay
                        </Button>
                      ) : null}
                    </div>
                  ),
                },
              ]}
              empty={
                tab === "issued"
                  ? "You have not issued any invoices yet."
                  : "No invoices received."
              }
            />
          )}
        </QueryBoundary>
      </Panel>

      <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
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
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            Issue Commercial Trade Invoice
          </DialogTitle>
          <DialogDescription>
            The counterparty will receive this invoice in their Payables register and can settle it
            directly from the Send Payment desk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
              Buyer Mobile Number (MSISDN)
            </Label>
            <div className="flex gap-2">
              <Input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setBuyer(null);
                }}
                placeholder="+250700000000"
                className="h-10 rounded-xl font-mono"
              />
              <Button
                variant="outline"
                className="h-10 rounded-xl font-mono text-xs uppercase"
                disabled={!phone.trim() || lookup.isPending}
                onClick={() => lookup.mutate()}
              >
                Verify Buyer
              </Button>
            </div>
            {buyer ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#79b200]/45 bg-[#f5fbe6] px-3 py-1.5 text-xs font-semibold text-[#151515]">
                <CheckCircle2 className="size-3.5 text-[#4d7500]" /> Billing {buyer.user.full_name} (
                {buyer.user.phone_number})
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Invoice no." className="sm:col-span-2">
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="rounded-xl font-mono"
              />
            </Field>
            <Field label="Currency">
              <Input
                value={cur}
                onChange={(e) => setInvoiceCurrency(e.target.value.toUpperCase().slice(0, 3))}
                className="rounded-xl font-mono"
              />
            </Field>
            <Field label="VAT %">
              <Input
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                inputMode="decimal"
                className="rounded-xl font-mono"
              />
            </Field>
            <Field label="Issue date" className="sm:col-span-2">
              <Input
                type="date"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className="rounded-xl font-mono"
              />
            </Field>
            <Field label="Due date" className="sm:col-span-2">
              <Input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="rounded-xl font-mono"
              />
            </Field>
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
              Line Items
            </Label>
            {lines.map((l, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_80px_130px_36px]">
                <Input
                  placeholder="Commodity / service description"
                  value={l.description}
                  onChange={(e) => setLine(i, { description: e.target.value })}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Qty"
                  inputMode="decimal"
                  value={l.quantity}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                  className="rounded-xl font-mono"
                />
                <Input
                  placeholder="Unit price"
                  inputMode="decimal"
                  value={l.unit_price}
                  onChange={(e) => setLine(i, { unit_price: e.target.value })}
                  className="rounded-xl font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Remove line"
                  disabled={lines.length === 1}
                  onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                  className="rounded-xl"
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-mono text-[10px] uppercase"
              onClick={() =>
                setLines((ls) => [...ls, { description: "", quantity: "1", unit_price: "" }])
              }
            >
              + Add Line Item
            </Button>
          </div>

          <Field label="Delivery & Escrow Terms (Optional)">
            <Textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="FOB Mombasa / Inspection on arrival…"
              className="min-h-16 rounded-xl"
            />
          </Field>

          <div className="flex items-center justify-between rounded-2xl border border-[#151515] bg-[#151515] px-4 py-3 font-mono text-xs text-white">
            <span className="text-white/70">Total Invoice Amount (incl. {vatRate || 0}% VAT)</span>
            <span className="text-base font-bold tabular-nums text-[#c2f74d]">
              {money(total, cur)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="h-11 w-full rounded-xl bg-[#151515] font-mono text-xs font-bold uppercase tracking-wider text-[#c2f74d] hover:bg-[#151515]/90"
            disabled={!ready || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Issuing Invoice…" : "Issue Commercial Invoice"}
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
      <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
        {label}
      </Label>
      {children}
    </div>
  );
}
