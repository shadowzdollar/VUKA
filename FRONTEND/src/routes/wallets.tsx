import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileDown } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/vuka/data-table";
import { QueryBoundary, Loading, ErrorState } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError, newIdempotencyKey } from "@/lib/api/client";
import { ledger } from "@/lib/api/endpoints";
import type { Account, Transfer } from "@/lib/api/types";
import { downloadCsv, money, shortId, when } from "@/lib/format";
import { accountLabel, directionFor, useTransfers, useWallet } from "@/lib/trader-data";

export const Route = createFileRoute("/wallets")({
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
  component: () => (
    <Shell role="trader">
      <Wallets />
    </Shell>
  ),
});

function statusTone(s: Transfer["status"]) {
  if (s === "SUCCESS") return "invert" as const;
  if (s === "FAILED" || s === "REVERSED") return "warn" as const;
  return "live" as const;
}

function Wallets() {
  const wallet = useWallet();
  const transfers = useTransfers();
  const [fundOpen, setFundOpen] = useState(false);
  const [entriesFor, setEntriesFor] = useState<Transfer | null>(null);
  const [accountFilter, setAccountFilter] = useState("ALL");

  const ownIds = useMemo(
    () => new Set(wallet.data?.accounts.map((a) => a.id) ?? []),
    [wallet.data],
  );

  const rows = useMemo(
    () =>
      (transfers.data ?? []).filter(
        (t) =>
          accountFilter === "ALL" ||
          t.source_account_id === accountFilter ||
          t.destination_account_id === accountFilter,
      ),
    [transfers.data, accountFilter],
  );

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
    <>
      <PageHeader
        eyebrow="Ledger engine"
        title="Wallets & Ledger"
        description="Trade capital sits in a business wallet, separate from your personal wallet. No balance is stored — every figure is the sum of immutable ledger postings."
        actions={
          <>
            <Button
              variant="outline"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="rounded-none font-mono text-xs uppercase"
            >
              Export transfers
            </Button>
            <Button
              onClick={() => setFundOpen(true)}
              className="rounded-none font-mono text-xs uppercase"
            >
              Top up wallet
            </Button>
          </>
        }
      />

      <QueryBoundary
        query={wallet}
        empty="No accounts found."
        isEmpty={(w) => w.accounts.length === 0}
      >
        {(w) => (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {w.accounts.map((a) => (
              <Link
                key={a.id}
                to="/wallets/$id"
                params={{ id: a.id }}
                className="block transition-colors hover:bg-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                aria-label={`${accountLabel(a)}, ${money(w.balances[a.id]?.amount ?? 0, a.currency)}. View statement and history.`}
              >
                <Metric
                  label={accountLabel(a)}
                  value={money(w.balances[a.id]?.amount ?? 0, a.currency)}
                  sub={
                    <span className="flex items-center justify-between gap-2 font-mono">
                      acct {shortId(a.id)}
                      <span
                        className="inline-flex items-center gap-1 text-foreground"
                        aria-hidden="true"
                      >
                        <FileDown className="size-3" />
                        Statement
                      </span>
                    </span>
                  }
                />
              </Link>
            ))}
          </div>
        )}
      </QueryBoundary>

      <Panel title="Transfer register" meta={<Chip>{rows.length} transfers</Chip>}>
        <QueryBoundary query={transfers}>
          {() => (
            <DataTable
              caption="Transfer register"
              exportName="vuka-transfers.csv"
              rows={rows}
              rowKey={(t) => t.id}
              onRowClick={setEntriesFor}
              initialSort={{ key: "time", dir: "desc" }}
              empty="No transfers yet. Top up a wallet or send a payment to see activity here."
              toolbar={
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger
                    className="h-8 w-64 rounded-none font-mono text-xs"
                    aria-label="Filter by account"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="ALL">All accounts</SelectItem>
                    {(wallet.data?.accounts ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {accountLabel(a)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
              columns={[
                {
                  key: "id",
                  header: "Transfer",
                  sort: (t) => t.id,
                  cell: (t) => <span className="font-mono text-xs">{shortId(t.id)}</span>,
                },
                {
                  key: "time",
                  header: "Time",
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
                  header: "Direction",
                  sort: (t) => directionFor(t, ownIds),
                  text: (t) => directionFor(t, ownIds),
                  cell: (t) => {
                    const d = directionFor(t, ownIds);
                    return (
                      <span className="font-mono text-xs uppercase">
                        {d === "out" ? "Sent" : d === "in" ? "Received" : "Internal"}
                      </span>
                    );
                  },
                },
                {
                  key: "invoice",
                  header: "Invoice",
                  text: (t) => t.invoice_number ?? "",
                  cell: (t) => <span className="font-mono text-xs">{t.invoice_number ?? "—"}</span>,
                },
                {
                  key: "ref",
                  header: "Reference",
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
                      <span className="tabular font-mono">
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
    </>
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
  // One idempotency key per dialog session: a double-click or retry can never credit twice.
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
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            Top up wallet
          </DialogTitle>
          <DialogDescription>
            Credits the wallet with an external cash-in (sandbox). The posting is idempotent:
            retrying never credits twice.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">Wallet</Label>
            <Select value={account?.id ?? ""} onValueChange={setAccountId}>
              <SelectTrigger aria-label="Wallet" className="rounded-none font-mono text-xs">
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {accountLabel(a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
              Amount {account ? `(${account.currency})` : ""}
            </Label>
            <Input
              inputMode="decimal"
              className="rounded-none font-mono"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="rounded-none font-mono text-xs uppercase"
            disabled={!account || !(value > 0) || fund.isPending}
            onClick={() => fund.mutate()}
          >
            {fund.isPending ? "Posting…" : "Confirm top-up"}
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
      <DialogContent className="rounded-none sm:max-w-2xl">
        {transfer ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                Transfer {shortId(transfer.id)}
              </DialogTitle>
              <DialogDescription>
                {money(transfer.amount, transfer.currency)}
                {transfer.fx_rate ? ` · fx ${transfer.fx_rate}` : ""} · {when(transfer.created_at)}
              </DialogDescription>
            </DialogHeader>
            {transfer.failure_reason ? (
              <p className="border-2 border-foreground p-3 text-xs">{transfer.failure_reason}</p>
            ) : null}
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Double-entry postings
            </div>
            {entries.isPending ? (
              <Loading />
            ) : entries.isError ? (
              <ErrorState error={entries.error} onRetry={() => void entries.refetch()} />
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <th className="py-2">Entry</th>
                      <th className="py-2">Account</th>
                      <th className="py-2 text-right">Debit</th>
                      <th className="py-2 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.data.map((e) => (
                      <tr key={e.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2 font-mono text-xs">{shortId(e.id)}</td>
                        <td className="py-2 font-mono text-xs">{shortId(e.account_id)}</td>
                        <td className="py-2 text-right font-mono tabular-nums">
                          {e.amount < 0 ? money(-e.amount) : "—"}
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums">
                          {e.amount > 0 ? money(e.amount) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transfer.fx_rate ? (
                  <p className="border border-border p-3 font-mono text-[11px] text-muted-foreground">
                    Cross-currency transfer: postings are balanced per currency leg through the FX
                    settlement accounts, so a single sum across legs is not meaningful.
                  </p>
                ) : (
                  <div className="flex items-center justify-between border border-border p-3 font-mono text-[11px]">
                    <span className="text-muted-foreground">Σ postings in {transfer.currency}</span>
                    <Chip tone={Math.abs(sum) < 1e-6 ? "invert" : "warn"}>
                      {Math.abs(sum) < 1e-6 ? "Balanced" : `Δ ${sum}`}
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
