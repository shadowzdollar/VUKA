import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
import { QueryBoundary, Loading, ErrorState } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError, newIdempotencyKey } from "@/lib/api/client";
import { ledger } from "@/lib/api/endpoints";
import type { Account, Transfer } from "@/lib/api/types";
import { downloadCsv, money, shortId, when } from "@/lib/format";
import { directionFor, useTransfers, useWallet } from "@/lib/trader-data";

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

const accountLabel = (a: Account) =>
  `${a.type === "BUSINESS" ? "Business trade wallet" : a.type === "PERSONAL" ? "Personal wallet" : a.type} · ${a.currency}`;

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
  const [query, setQuery] = useState("");

  const ownIds = useMemo(
    () => new Set(wallet.data?.accounts.map((a) => a.id) ?? []),
    [wallet.data],
  );

  const rows = useMemo(
    () =>
      (transfers.data ?? []).filter((t) => {
        if (
          accountFilter !== "ALL" &&
          t.source_account_id !== accountFilter &&
          t.destination_account_id !== accountFilter
        )
          return false;
        const q = query.trim().toLowerCase();
        return (
          !q ||
          `${t.id} ${t.invoice_number ?? ""} ${t.external_reference ?? ""}`
            .toLowerCase()
            .includes(q)
        );
      }),
    [transfers.data, accountFilter, query],
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
              <Metric
                key={a.id}
                label={accountLabel(a)}
                value={money(w.balances[a.id]?.amount ?? 0, a.currency)}
                sub={<span className="font-mono">acct {shortId(a.id)}</span>}
              />
            ))}
          </div>
        )}
      </QueryBoundary>

      <Panel title="Transfer register" meta={<Chip>{rows.length} transfers</Chip>}>
        <div className="mb-4 flex flex-wrap gap-2">
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-64 rounded-none font-mono text-xs">
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
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by id, invoice or provider reference…"
            className="w-80 rounded-none font-mono text-xs"
          />
        </div>
        <QueryBoundary
          query={transfers}
          empty="No transfers yet. Top up a wallet or send a payment to see activity here."
          isEmpty={() => rows.length === 0}
        >
          {() => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="py-2">Transfer</th>
                    <th className="py-2">Time</th>
                    <th className="py-2">Direction</th>
                    <th className="py-2">Invoice</th>
                    <th className="py-2">Reference</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => {
                    const dir = directionFor(t, ownIds);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setEntriesFor(t)}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/40"
                      >
                        <td className="py-2.5 font-mono text-xs">{shortId(t.id)}</td>
                        <td className="py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                          {when(t.created_at)}
                        </td>
                        <td className="py-2.5 font-mono text-xs uppercase">
                          {dir === "out" ? "Sent" : dir === "in" ? "Received" : "Internal"}
                        </td>
                        <td className="py-2.5 font-mono text-xs">{t.invoice_number ?? "—"}</td>
                        <td className="py-2.5 font-mono text-xs text-muted-foreground">
                          {t.external_reference ?? "—"}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums">
                          {dir === "out" ? "−" : dir === "in" ? "+" : ""}
                          {money(t.amount, t.currency)}
                        </td>
                        <td className="py-2.5 text-right">
                          <Chip tone={statusTone(t.status)}>{t.status}</Chip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
              <SelectTrigger className="rounded-none font-mono text-xs">
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
