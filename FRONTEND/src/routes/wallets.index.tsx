import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  Briefcase,
  Download,
  FileDown,
  Lock,
  PlusCircle,
  Send,
  UserRound,
  Wallet,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/vuka/data-table";
import { ErrorState, Loading, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, Panel } from "@/components/vuka/shell";
import { describeError, newIdempotencyKey } from "@/lib/api/client";
import { ledger } from "@/lib/api/endpoints";
import type { Account, Transfer } from "@/lib/api/types";
import { downloadCsv, money, shortId, when } from "@/lib/format";
import { accountLabel, directionFor, useTransfers, useWallet } from "@/lib/trader-data";

export const Route = createFileRoute("/wallets/")({
  head: () => ({
    meta: [
      { title: "Wallets & Ledger — VUKA" },
      {
        name: "description",
        content:
          "Separate personal and business wallets with balances derived from an immutable double-entry ledger.",
      },
    ],
  }),
  component: Wallets,
});

function statusTone(s: Transfer["status"]) {
  if (s === "SUCCESS") return "live" as const;
  if (s === "FAILED" || s === "REVERSED") return "warn" as const;
  return "invert" as const;
}

function Wallets() {
  const wallet = useWallet();
  const transfers = useTransfers();
  const [fundOpen, setFundOpen] = useState(false);
  const [entriesFor, setEntriesFor] = useState<Transfer | null>(null);
  const [accountFilter, setAccountFilter] = useState("ALL");
  const [dirFilter, setDirFilter] = useState<"ALL" | "out" | "in" | "internal">("ALL");

  const ownIds = useMemo(
    () => new Set(wallet.data?.accounts.map((a) => a.id) ?? []),
    [wallet.data],
  );

  const rows = useMemo(
    () =>
      (transfers.data ?? []).filter((t) => {
        const matchAcct =
          accountFilter === "ALL" ||
          t.source_account_id === accountFilter ||
          t.destination_account_id === accountFilter;
        if (!matchAcct) return false;
        if (dirFilter === "ALL") return true;
        return directionFor(t, ownIds) === dirFilter;
      }),
    [transfers.data, accountFilter, dirFilter, ownIds],
  );

  const stats = useMemo(() => {
    const all = transfers.data ?? [];
    let outCount = 0;
    let inCount = 0;
    for (const t of all) {
      const d = directionFor(t, ownIds);
      if (d === "out") outCount += 1;
      else if (d === "in") inCount += 1;
    }
    return { total: all.length, outCount, inCount };
  }, [transfers.data, ownIds]);

  function exportCsv() {
    downloadCsv(
      "vuka-transfers.csv",
      [
        "transfer_id",
        "created_at",
        "direction",
        "status",
        "amount",
        "currency",
        "fx_rate",
        "invoice",
        "external_reference",
      ],
      rows.map((t) => [
        t.id,
        t.created_at,
        directionFor(t, ownIds),
        t.status,
        t.amount,
        t.currency,
        t.fx_rate ?? "",
        t.invoice_number ?? "",
        t.external_reference ?? "",
      ]),
    );
    toast.success("Transfers exported", { description: `${rows.length} rows` });
  }

  return (
    <div className="space-y-6">
      {/* Executive Double-Entry Treasury Banner */}
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
                Double-Entry Ledger Engine
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75">
                <Lock className="size-3 text-[#c2f74d]" /> ISO 20022 camt.053 Statements
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Wallets &amp; Immutable Ledger
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Trade capital sits in your Business Trade Vault, strictly separated from your Personal
              Wallet. No mutable balance column exists — every balance is derived in real time from
              balanced debit and credit postings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setFundOpen(true)}
              className="h-10 rounded-xl bg-[#c2f74d] px-5 font-mono text-xs font-bold uppercase tracking-wider text-[#151515] hover:bg-[#b5eb3b]"
            >
              <PlusCircle className="mr-1.5 size-3.5" /> Top Up Vault
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
            >
              <Link to="/send">
                <Send className="mr-1.5 size-3.5" /> Send Payment
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
            >
              <Download className="mr-1.5 size-3.5" /> Export CSV
            </Button>
          </div>
        </div>
      </section>

      {/* Segregated Vault Cards + Ledger Velocity Metrics */}
      <QueryBoundary
        query={wallet}
        empty="No accounts found."
        isEmpty={(w) => w.accounts.length === 0}
      >
        {(w) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {w.accounts.map((a, i) => {
              const isBiz = a.type === "BUSINESS";
              const bal = w.balances[a.id]?.amount ?? 0;
              return (
                <Link
                  key={a.id}
                  to="/wallets/$id"
                  params={{ id: a.id }}
                  style={{ "--dash-delay": `${i * 60}ms` } as React.CSSProperties}
                  className={`dash-in group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${
                    isBiz
                      ? "border-[#79b200]/55 bg-gradient-to-br from-[#f6fce8] via-white to-white text-[#151515] shadow-[0_16px_38px_-18px_rgba(121,178,0,0.25)] dark:from-[#1b2410] dark:via-card dark:to-card dark:text-foreground"
                      : "border-border bg-card text-foreground shadow-[0_12px_32px_-16px_rgba(0,0,0,0.08)] hover:border-[#79b200]/45"
                  }`}
                  aria-label={`${accountLabel(a)}, ${money(bal, a.currency)}. View statement and history.`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      <span
                        className={`flex size-8 items-center justify-center rounded-xl ${
                          isBiz ? "bg-[#151515] text-[#c2f74d]" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isBiz ? (
                          <Briefcase className="size-4" />
                        ) : (
                          <UserRound className="size-4" />
                        )}
                      </span>
                      {accountLabel(a)}
                    </span>
                    <span className="rounded-md border border-border bg-background/80 px-2 py-0.5 font-mono text-[10px] font-bold">
                      {a.currency}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="font-mono text-2xl font-bold tabular-nums tracking-tight sm:text-[28px]">
                      {money(bal, a.currency)}
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      Account {shortId(a.id, 14)} · Σ Ledger entries
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 font-mono text-[10px]">
                    <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-foreground group-hover:underline">
                      <FileDown className="size-3" /> Statement &amp; camt.053 →
                    </span>
                    {isBiz ? (
                      <span className="rounded-full bg-[#c2f74d]/45 px-2 py-0.5 text-[9px] font-bold uppercase">
                        Primary
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}

            <Metric
              icon={ArrowUpRight}
              tone="primary"
              label="Outbound Settlements"
              value={stats.outCount}
              sub="Sent from your vaults"
              delay={120}
            />
            <Metric
              icon={ArrowDownLeft}
              tone="success"
              label="Inbound Receipts"
              value={stats.inCount}
              sub={`${stats.total} total ledger transfers`}
              delay={180}
            />
          </div>
        )}
      </QueryBoundary>

      {/* Double-Entry Transfer Register */}
      <Panel
        title="Double-Entry Transfer Register"
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="live">
              <BookOpenCheck className="size-3" /> {rows.length} transfers
            </Chip>
          </div>
        }
      >
        <QueryBoundary query={transfers}>
          {() => (
            <DataTable
              caption="Transfer register"
              exportName="vuka-transfers.csv"
              rows={rows}
              rowKey={(t) => t.id}
              onRowClick={setEntriesFor}
              initialSort={{ key: "time", dir: "desc" }}
              empty="No transfers match the selected filter. Top up a wallet or send a payment to see ledger postings."
              toolbar={
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={accountFilter} onValueChange={setAccountFilter}>
                    <SelectTrigger
                      className="h-9 w-56 rounded-xl font-mono text-xs"
                      aria-label="Filter by account"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="ALL">All Vaults &amp; Wallets</SelectItem>
                      {(wallet.data?.accounts ?? []).map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {accountLabel(a)} ({a.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
                    {(
                      [
                        { id: "ALL", label: "All" },
                        { id: "out", label: "Sent" },
                        { id: "in", label: "Received" },
                        { id: "internal", label: "Internal" },
                      ] as const
                    ).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDirFilter(d.id)}
                        className={`rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold uppercase transition ${
                          dirFilter === d.id
                            ? "bg-[#151515] text-[#c2f74d]"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              }
              columns={[
                {
                  key: "id",
                  header: "Transfer ID",
                  sort: (t) => t.id,
                  cell: (t) => (
                    <span className="font-mono text-xs font-semibold">{shortId(t.id, 12)}</span>
                  ),
                },
                {
                  key: "time",
                  header: "Timestamp",
                  sort: (t) => t.created_at,
                  text: (t) => t.created_at,
                  cell: (t) => (
                    <span className="tabular font-mono text-xs text-muted-foreground">
                      {when(t.created_at)}
                    </span>
                  ),
                },
                {
                  key: "dir",
                  header: "Flow",
                  sort: (t) => directionFor(t, ownIds),
                  text: (t) => directionFor(t, ownIds),
                  cell: (t) => {
                    const d = directionFor(t, ownIds);
                    return (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium uppercase">
                        {d === "out" ? (
                          <ArrowUpRight className="size-3.5 text-muted-foreground" />
                        ) : d === "in" ? (
                          <ArrowDownLeft className="size-3.5 text-[#4d7500]" />
                        ) : (
                          <ArrowRight className="size-3.5 text-muted-foreground" />
                        )}
                        {d === "out" ? "Sent" : d === "in" ? "Received" : "Internal"}
                      </span>
                    );
                  },
                },
                {
                  key: "invoice",
                  header: "Invoice",
                  text: (t) => t.invoice_number ?? "",
                  cell: (t) =>
                    t.invoice_number ? (
                      <span className="rounded bg-[#c2f74d]/30 px-2 py-0.5 font-mono text-xs font-semibold">
                        {t.invoice_number}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">—</span>
                    ),
                },
                {
                  key: "ref",
                  header: "External Ref",
                  text: (t) => t.external_reference ?? "",
                  cell: (t) => (
                    <span className="font-mono text-xs text-muted-foreground">
                      {t.external_reference ?? "—"}
                    </span>
                  ),
                },
                {
                  key: "amount",
                  header: "Amount",
                  align: "right",
                  sort: (t) => t.amount,
                  text: (t) => `${t.amount} ${t.currency}`,
                  cell: (t) => {
                    const d = directionFor(t, ownIds);
                    return (
                      <span className="tabular font-mono font-bold">
                        {d === "out" ? "−" : d === "in" ? "+" : ""}
                        {money(t.amount, t.currency)}
                      </span>
                    );
                  },
                },
                {
                  key: "status",
                  header: "Status",
                  align: "right",
                  sort: (t) => t.status,
                  cell: (t) => <Chip tone={statusTone(t.status)}>{t.status}</Chip>,
                },
              ]}
            />
          )}
        </QueryBoundary>
      </Panel>

      <FundDialog
        open={fundOpen}
        onOpenChange={setFundOpen}
        accounts={wallet.data?.accounts ?? []}
      />
      <EntriesDialog transfer={entriesFor} onClose={() => setEntriesFor(null)} />
    </div>
  );
}

function FundDialog({
  open,
  onOpenChange,
  accounts,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  accounts: Account[];
}) {
  const qc = useQueryClient();
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [key, setKey] = useState(newIdempotencyKey);

  const account = accounts.find(
    (a) => a.id === (accountId || accounts.find((x) => x.type === "BUSINESS")?.id),
  );
  const value = Number(amount);

  const fund = useMutation({
    mutationFn: () =>
      ledger.fund(
        account!.id,
        { amount: value, currency: account!.currency, reference: "trader-topup" },
        key,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      void qc.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Wallet topped up", { description: money(value, account!.currency) });
      setAmount("");
      setKey(newIdempotencyKey());
      onOpenChange(false);
    },
    onError: (e) => toast.error("Top-up failed", { description: describeError(e) }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.18em]">
            <Wallet className="size-4 text-[#79b200]" /> Top Up Vault (Sandbox Cash-In)
          </DialogTitle>
          <DialogDescription>
            Credits your selected vault via a balanced external cash-in ledger entry. Protected by
            an idempotency key so retries never double-credit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
              Target Vault / Wallet
            </Label>
            <Select value={account?.id ?? ""} onValueChange={setAccountId}>
              <SelectTrigger aria-label="Wallet" className="h-11 rounded-xl font-mono text-xs">
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {accountLabel(a)} ({a.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
              Top-Up Amount {account ? `(${account.currency})` : ""}
            </Label>
            <Input
              inputMode="decimal"
              className="h-11 rounded-xl font-mono text-base font-bold"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100000"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[25_000, 100_000, 500_000, 1_000_000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-mono text-[10px] font-semibold text-muted-foreground transition hover:border-[#79b200] hover:bg-[#c2f74d]/25 hover:text-foreground"
                >
                  +{preset.toLocaleString("en-US")}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="h-11 w-full rounded-xl bg-[#151515] font-mono text-xs font-bold uppercase tracking-wider text-[#c2f74d] hover:bg-[#151515]/90"
            disabled={!account || !(value > 0) || fund.isPending}
            onClick={() => fund.mutate()}
          >
            {fund.isPending ? "Posting to Ledger…" : "Confirm Cash-In Top-Up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EntriesDialog({ transfer, onClose }: { transfer: Transfer | null; onClose: () => void }) {
  const entries = useQuery({
    queryKey: ["entries", transfer?.id],
    queryFn: () => ledger.entries(transfer!.id),
    enabled: transfer !== null,
  });
  const sum = (entries.data ?? []).reduce((s, e) => s + e.amount, 0);
  return (
    <Dialog open={transfer !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-2xl">
        {transfer ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                Ledger Transfer {shortId(transfer.id, 14)}
              </DialogTitle>
              <DialogDescription>
                {money(transfer.amount, transfer.currency)}
                {transfer.fx_rate ? ` · FX ${transfer.fx_rate}` : ""} · {when(transfer.created_at)}
              </DialogDescription>
            </DialogHeader>
            {transfer.failure_reason ? (
              <p className="rounded-xl border-2 border-destructive/60 bg-destructive/5 p-3 text-xs text-destructive">
                {transfer.failure_reason}
              </p>
            ) : null}
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Double-Entry Ledger Postings
            </div>
            {entries.isPending ? (
              <Loading />
            ) : entries.isError ? (
              <ErrorState error={entries.error} onRetry={() => void entries.refetch()} />
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        <th className="px-3 py-2.5">Entry ID</th>
                        <th className="px-3 py-2.5">Account</th>
                        <th className="px-3 py-2.5 text-right">Debit (−)</th>
                        <th className="px-3 py-2.5 text-right">Credit (+)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.data.map((e) => (
                        <tr key={e.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-2.5 font-mono text-xs">{shortId(e.id)}</td>
                          <td className="px-3 py-2.5 font-mono text-xs">{shortId(e.account_id)}</td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                            {e.amount < 0 ? money(-e.amount) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-foreground">
                            {e.amount > 0 ? money(e.amount) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {transfer.fx_rate ? (
                  <p className="rounded-xl border border-border bg-muted/20 p-3 font-mono text-[11px] text-muted-foreground">
                    Cross-currency transfer: postings are balanced per currency leg through the FX
                    settlement accounts.
                  </p>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3 font-mono text-xs">
                    <span className="text-muted-foreground">Σ postings in {transfer.currency}</span>
                    <Chip tone={Math.abs(sum) < 1e-6 ? "live" : "warn"}>
                      {Math.abs(sum) < 1e-6 ? "Zero-Sum Balanced" : `Δ ${sum}`}
                    </Chip>
                  </div>
                )}
              </>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
