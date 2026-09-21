import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { ErrorState, Loading } from "@/components/vuka/query-state";
import { Chip, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { invoiceTotal } from "@/components/vuka/trader-invoices";
import { stateTone, WorkflowTracker } from "@/components/vuka/workflow-tracker";
import { ApiError, describeError, isApiError, newIdempotencyKey } from "@/lib/api/client";
import { corridors as corridorApi, ledger, workflows } from "@/lib/api/endpoints";
import type { Account, Recipient, Workflow } from "@/lib/api/types";
import { fromMinor, money, shortId, toMinor } from "@/lib/format";
import { readRecentWorkflows, rememberWorkflow } from "@/lib/recent-workflows";
import { useTrader } from "@/lib/session";
import { useInvoices, useWallet } from "@/lib/trader-data";

export const Route = createFileRoute("/send")({
  // /send?invoice=INV-… preselects the invoice being paid (linked from the Invoices page).
  validateSearch: (search: Record<string, unknown>): { invoice?: string } =>
    typeof search["invoice"] === "string" ? { invoice: search["invoice"] } : {},
  head: () => ({
    meta: [
      { title: "Send Payment — VUKA" },
      {
        name: "description",
        content:
          "Pay a supplier across borders with a live corridor quote and a tracked settlement.",
      },
    ],
  }),
  component: () => (
    <Shell role="trader">
      <SendPayment />
    </Shell>
  ),
});

type Mode = "domestic" | "ledger-fx" | "workflow";

function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** A failed workflow start still returns the workflow (HTTP 202/422 with a string `error`). */
function workflowFromError(e: unknown): Workflow | undefined {
  if (!isApiError(e)) return undefined;
  const body = e.body as { workflow?: Workflow } | undefined;
  return body?.workflow?.id ? body.workflow : undefined;
}

function SendPayment() {
  const trader = useTrader();
  const qc = useQueryClient();
  const { invoice: invoiceParam } = Route.useSearch();
  const wallet = useWallet();
  const corridors = useQuery({ queryKey: ["corridors"], queryFn: corridorApi.list });
  const received = useInvoices("received");

  const [sourceId, setSourceId] = useState("");
  const [phone, setPhone] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [destId, setDestId] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [payerPhone, setPayerPhone] = useState(trader.phone_number);
  const [authRef, setAuthRef] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeWf, setActiveWf] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  // One key per intended payment: retrying after a network error can never double-charge.
  const keyRef = useRef(newIdempotencyKey());

  useEffect(() => setRecent(readRecentWorkflows(trader.id)), [trader.id, activeWf]);

  const businessAccounts = useMemo(
    () => (wallet.data?.accounts ?? []).filter((a) => a.type === "BUSINESS"),
    [wallet.data],
  );
  const source: Account | undefined =
    businessAccounts.find((a) => a.id === sourceId) ?? businessAccounts[0];
  const destOptions = (recipient?.accounts ?? []).filter((a) => a.type === "BUSINESS");
  const dest: Account | undefined = destOptions.find((a) => a.id === destId) ?? destOptions[0];

  const lookup = useMutation({
    mutationFn: () => ledger.recipient(phone.trim()),
    onSuccess: (r) => {
      setRecipient(r);
      setDestId("");
    },
    onError: (e) => {
      setRecipient(null);
      toast.error(
        isApiError(e) && e.status === 404 ? "No VUKA trader with that number" : describeError(e),
      );
    },
  });

  const value = Number(amount);
  const amountValid = Number.isFinite(value) && value > 0;
  const balance = source ? (wallet.data?.balances[source.id]?.amount ?? 0) : 0;

  const mode: Mode | null =
    !source || !dest
      ? null
      : source.currency === dest.currency
        ? "domestic"
        : invoiceNumber
          ? "ledger-fx"
          : "workflow";
  const corridor = useMemo(
    () =>
      source && dest && source.currency !== dest.currency
        ? corridors.data?.find(
            (c) => c.from_currency === source.currency && c.to_currency === dest.currency,
          )
        : undefined,
    [corridors.data, source, dest],
  );

  const debouncedMinor = useDebounced(amountValid ? toMinor(value) : 0);
  const quote = useQuery({
    queryKey: ["quote", corridor?.id, debouncedMinor],
    queryFn: () => corridorApi.quote(corridor!.id, debouncedMinor),
    enabled: !!corridor && debouncedMinor > 0,
    retry: false,
  });

  const unpaidInvoices = (received.data ?? []).filter((i) => i.status !== "PAID");

  // Apply the ?invoice= deep link once, when the received invoices have loaded.
  const appliedParam = useRef(false);
  useEffect(() => {
    if (appliedParam.current || !invoiceParam || !received.data) return;
    appliedParam.current = true;
    const inv = received.data.find((i) => i.number === invoiceParam && i.status !== "PAID");
    if (inv) {
      setInvoiceNumber(inv.number);
      setAmount(String(Math.round(invoiceTotal(inv) * 100) / 100));
    }
  }, [invoiceParam, received.data]);

  function pickInvoice(number: string) {
    setInvoiceNumber(number === "none" ? "" : number);
    const inv = unpaidInvoices.find((i) => i.number === number);
    if (inv) setAmount(String(Math.round(invoiceTotal(inv) * 100) / 100));
  }

  const overBalance = amountValid && value > balance;
  const corridorLimit =
    corridor &&
    amountValid &&
    (toMinor(value) < corridor.min_amount_minor || toMinor(value) > corridor.max_amount_minor);

  const problem: string | null = !source
    ? "You have no business wallet yet."
    : !dest
      ? "Look up a recipient to choose a destination wallet."
      : !amountValid
        ? "Enter an amount."
        : overBalance
          ? `Amount exceeds your available balance (${money(balance, source.currency)}).`
          : source.currency !== dest.currency && corridors.isSuccess && !corridor
            ? `No corridor is available for ${source.currency} → ${dest.currency}.`
            : corridorLimit
              ? "Amount is outside this corridor's limits."
              : mode !== "domestic" && !quote.data
                ? quote.isError
                  ? describeError(quote.error)
                  : "Waiting for a quote…"
                : null;

  const send = useMutation({
    mutationFn: async () => {
      const key = keyRef.current;
      if (mode === "domestic") {
        const input: Parameters<typeof ledger.createTransfer>[0] = {
          source_account_id: source!.id,
          destination_account_id: dest!.id,
          amount: value,
          currency: source!.currency,
        };
        if (invoiceNumber) input.invoice_number = invoiceNumber;
        await ledger.createTransfer(input, key);
        return null;
      }
      if (mode === "ledger-fx") {
        await ledger.crossBorder(
          {
            source_account_id: source!.id,
            destination_account_id: dest!.id,
            amount: value,
            currency_from: source!.currency,
            currency_to: dest!.currency,
            invoice_number: invoiceNumber,
            quote_id: quote.data!.quote.id,
            corridor_id: corridor!.id,
          },
          key,
        );
        return null;
      }
      const res = await workflows.start(
        {
          source_account_id: source!.id,
          destination_account_id: dest!.id,
          collection_phone: payerPhone.trim(),
          payout_phone: recipient!.user.phone_number,
          corridor_id: corridor!.id,
          quote_id: quote.data!.quote.id,
          amount: value,
          currency_from: source!.currency,
          currency_to: dest!.currency,
          rate: quote.data!.quote.rate,
          ...(authRef.trim() ? { provider_authorization_ref: authRef.trim() } : {}),
        },
        key,
      );
      return res;
    },
    onSuccess: (res) => {
      setConfirmOpen(false);
      setNeedsAuth(false);
      if (res?.workflow) {
        rememberWorkflow(trader.id, res.workflow.id);
        setActiveWf(res.workflow.id);
        if (res.error)
          toast.warning("Payment started but needs attention", { description: res.error });
      }
      toast.success(mode === "workflow" ? "Payment submitted" : "Transfer completed", {
        description: `${money(value, source!.currency)} → ${recipient!.user.full_name}`,
      });
      keyRef.current = newIdempotencyKey();
      setAmount("");
      setInvoiceNumber("");
      setAuthRef("");
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      void qc.invalidateQueries({ queryKey: ["transfers"] });
      void qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e) => {
      setConfirmOpen(false);
      const wf = workflowFromError(e);
      if (wf) {
        // The engine recorded the workflow even though a step failed: keep the id so it is trackable.
        rememberWorkflow(trader.id, wf.id);
        setActiveWf(wf.id);
        keyRef.current = newIdempotencyKey();
      }
      if (e instanceof ApiError && e.code === "provider_authorization_required") {
        setNeedsAuth(true);
        toast.warning("Provider authorization needed", {
          description: "Approve the prompt on your mobile money app, then enter the reference.",
        });
        return;
      }
      if (e instanceof ApiError && e.code === "insufficient_funds") {
        const b = e.body as
          { available?: number; required?: number; currency?: string } | undefined;
        toast.error("Insufficient funds", {
          description:
            b?.available !== undefined
              ? `Available ${money(b.available, b.currency)}, required ${money(b.required ?? 0, b.currency)}`
              : e.message,
        });
        return;
      }
      toast.error("Payment not completed", { description: describeError(e) });
    },
  });

  const q = quote.data?.quote;

  return (
    <>
      <PageHeader
        eyebrow="Settlement desk"
        title="Send Payment"
        description="Pay a supplier in another currency with a live corridor quote. Same-currency payments settle instantly on the ledger; cross-border payments run collect → post → payout with a tracked status."
      />

      {activeWf ? (
        <Panel title="Payment status" meta={<Chip tone="live">Live</Chip>}>
          <WorkflowTracker id={activeWf} defaultPhone={payerPhone} />
        </Panel>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_380px]">
        <Panel title="Payment details">
          {wallet.isPending ? (
            <Loading />
          ) : wallet.isError ? (
            <ErrorState error={wallet.error} onRetry={() => void wallet.refetch()} />
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
                  Pay from
                </Label>
                <Select value={source?.id ?? ""} onValueChange={setSourceId}>
                  <SelectTrigger className="rounded-none font-mono text-xs">
                    <SelectValue placeholder="Business wallet" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {businessAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        Business wallet ·{" "}
                        {money(wallet.data.balances[a.id]?.amount ?? 0, a.currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Invoice payments can only be funded from a business wallet.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
                  Recipient mobile number
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setRecipient(null);
                    }}
                    placeholder="+254700000000"
                    inputMode="tel"
                    className="rounded-none font-mono"
                  />
                  <Button
                    variant="outline"
                    className="rounded-none font-mono text-xs uppercase"
                    disabled={!phone.trim() || lookup.isPending}
                    onClick={() => lookup.mutate()}
                  >
                    {lookup.isPending ? "…" : "Look up"}
                  </Button>
                </div>
                {recipient ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 border border-border p-3">
                    <div>
                      <div className="text-sm">{recipient.user.full_name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {recipient.user.phone_number}
                      </div>
                    </div>
                    <Chip tone="invert">Verified VUKA trader</Chip>
                  </div>
                ) : null}
              </div>

              {recipient && destOptions.length > 1 ? (
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
                    Recipient wallet
                  </Label>
                  <Select value={dest?.id ?? ""} onValueChange={setDestId}>
                    <SelectTrigger className="rounded-none font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {destOptions.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          Business wallet · {a.currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
                    Amount {source ? `(${source.currency})` : ""}
                  </Label>
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="rounded-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
                    Pay an invoice (optional)
                  </Label>
                  <Select value={invoiceNumber || "none"} onValueChange={pickInvoice}>
                    <SelectTrigger className="rounded-none font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="none">No invoice</SelectItem>
                      {unpaidInvoices.map((i) => (
                        <SelectItem key={i.id} value={i.number}>
                          {i.number} · {money(invoiceTotal(i), i.currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {mode === "workflow" ? (
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
                    Your mobile money number (to be charged)
                  </Label>
                  <Input
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    inputMode="tel"
                    className="rounded-none font-mono"
                  />
                </div>
              ) : null}

              {needsAuth ? (
                <div className="space-y-1.5 border-2 border-foreground p-3">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
                    Provider authorization reference
                  </Label>
                  <Input
                    value={authRef}
                    onChange={(e) => setAuthRef(e.target.value)}
                    placeholder="Reference from your MTN / M-Pesa prompt"
                    className="rounded-none font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    VUKA never collects or stores your mobile-money PIN. Complete the challenge with
                    your provider, then paste the reference it gives you.
                  </p>
                </div>
              ) : null}

              {mode === "ledger-fx" ? (
                <p className="border border-dashed border-border p-3 text-[11px] text-muted-foreground">
                  Paying an invoice across currencies settles as a ledger transfer bound to the
                  invoice number. Provider collection/payout workflows do not carry an invoice
                  reference.
                </p>
              ) : null}

              {problem && amount ? (
                <p role="status" className="text-xs text-muted-foreground">
                  {problem}
                </p>
              ) : null}

              <Button
                className="w-full rounded-none font-mono text-xs uppercase"
                disabled={
                  !!problem ||
                  send.isPending ||
                  (mode === "workflow" && !payerPhone.trim()) ||
                  (needsAuth && !authRef.trim())
                }
                onClick={() => setConfirmOpen(true)}
              >
                Review payment
              </Button>
            </div>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel
            title="Quote"
            meta={corridor ? <Chip>{corridor.id}</Chip> : <Chip>Same currency</Chip>}
          >
            {!corridor ? (
              <p className="text-xs text-muted-foreground">
                {source && dest
                  ? "Both wallets use the same currency, so no FX conversion or corridor fee applies."
                  : "Choose a recipient to see pricing."}
              </p>
            ) : quote.isFetching && !q ? (
              <Loading label="Fetching quote" />
            ) : quote.isError ? (
              <ErrorState error={quote.error} onRetry={() => void quote.refetch()} />
            ) : q ? (
              <dl className="space-y-2 font-mono text-xs">
                <Line k="You send" v={money(fromMinor(q.source_amount_minor), q.from_currency)} />
                <Line
                  k={`Fee (${corridor!.fees_bps / 100}%)`}
                  v={`−${money(fromMinor(q.fee_minor), q.from_currency)}`}
                />
                <Line k="Rate" v={String(q.rate)} />
                <div className="flex justify-between border-t border-border pt-2 text-sm">
                  <dt>Recipient receives</dt>
                  <dd className="tabular-nums">
                    {money(fromMinor(q.deliver_amount_minor), q.to_currency)}
                  </dd>
                </div>
                <p className="pt-1 text-[11px] text-muted-foreground">
                  Quote {q.id} · valid until {new Date(q.expires_at).toLocaleString()}
                  {quote.data?.execution === "local_synthetic" ? " · sandbox execution" : ""}
                </p>
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground">Enter an amount to see a live quote.</p>
            )}
          </Panel>

          <RecentPayments ids={recent} onOpen={setActiveWf} />
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
              Confirm payment
            </DialogTitle>
            <DialogDescription>Payments are final once the ledger posts them.</DialogDescription>
          </DialogHeader>
          {source && dest && recipient ? (
            <dl className="space-y-2 border border-border p-3 font-mono text-xs">
              <Line k="To" v={recipient.user.full_name} />
              <Line k="Amount" v={money(value, source.currency)} />
              {q ? (
                <Line
                  k="Recipient receives"
                  v={money(fromMinor(q.deliver_amount_minor), q.to_currency)}
                />
              ) : null}
              {invoiceNumber ? <Line k="Invoice" v={invoiceNumber} /> : null}
              <Line
                k="Method"
                v={mode === "workflow" ? "Mobile-money collect + payout" : "Ledger transfer"}
              />
            </dl>
          ) : null}
          <DialogFooter>
            <Button
              className="rounded-none font-mono text-xs uppercase"
              disabled={send.isPending}
              onClick={() => send.mutate()}
            >
              {send.isPending ? "Processing…" : "Confirm and send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}

function RecentPayments({ ids, onOpen }: { ids: string[]; onOpen: (id: string) => void }) {
  const results = useQueries({
    queries: ids.slice(0, 6).map((id) => ({
      queryKey: ["workflow", id],
      queryFn: () => workflows.get(id),
    })),
  });
  return (
    <Panel title="Recent cross-border payments">
      {ids.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Payments you start from this browser appear here.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {ids.slice(0, 6).map((id, i) => {
            const w = results[i]?.data;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onOpen(id)}
                  className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-accent/40"
                >
                  <span>
                    <span className="block font-mono text-xs">{shortId(id, 12)}</span>
                    {w ? (
                      <span className="text-[11px] text-muted-foreground">
                        {money(w.amount, w.currency_from)} → {w.currency_to}
                      </span>
                    ) : null}
                  </span>
                  {w ? (
                    <Chip tone={stateTone(w.state)}>{w.state.replace("_", " ")}</Chip>
                  ) : (
                    <Chip>…</Chip>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
