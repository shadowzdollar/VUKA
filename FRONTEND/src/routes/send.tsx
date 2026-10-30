import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Copy,
  Pencil,
  RotateCcw,
  Smartphone,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag } from "@/components/vuka/landing/flags";
import { ErrorState, Loading } from "@/components/vuka/query-state";
import { Chip, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { invoiceTotal } from "@/components/vuka/trader-invoices";
import { isSettled, stateTone, WorkflowTracker } from "@/components/vuka/workflow-tracker";
import { ApiError, describeError, isApiError, newIdempotencyKey } from "@/lib/api/client";
import { corridors as corridorApi, ledger, platform, workflows } from "@/lib/api/endpoints";
import type { Account, Recipient, Transfer, Workflow } from "@/lib/api/types";
import { fromMinor, money, shortId, toMinor, truncMid, when } from "@/lib/format";
import { readRecentWorkflows, rememberWorkflow } from "@/lib/recent-workflows";
import { useTrader } from "@/lib/session";
import { useInvoices, useWallet } from "@/lib/trader-data";
import { cn } from "@/lib/utils";

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

type Mode = "domestic" | "workflow";
type SendResult =
  | { kind: "domestic"; transfer: Transfer }
  | { kind: "workflow"; workflow?: Workflow; error?: string };

const WIZARD_STEPS = ["Recipient", "Amount", "Review"] as const;

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

function StepRail({ step }: { step: number }) {
  return (
    <div className="mb-7 flex items-center">
      {WIZARD_STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-medium transition-colors duration-300",
                  (done || current) && "bg-primary text-primary-foreground",
                  current && "ring-4 ring-primary/20",
                  !done && !current && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden="true" /> : n}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-xs font-medium",
                  !current && !done && "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {n < WIZARD_STEPS.length ? (
              <div className={cn("mx-3 h-px flex-1 transition-colors duration-300", done ? "bg-primary" : "bg-border")} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function SendPayment() {
  const trader = useTrader();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { invoice: invoiceParam } = Route.useSearch();
  const wallet = useWallet();
  const corridors = useQuery({ queryKey: ["corridors"], queryFn: corridorApi.list });
  const received = useInvoices("received");
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });

  const [step, setStep] = useState(1);
  const [sourceId, setSourceId] = useState("");
  const [phone, setPhone] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [destId, setDestId] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [payerPhone, setPayerPhone] = useState(trader.phone_number);
  const [authRef, setAuthRef] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);
  const [activeWf, setActiveWf] = useState<string | null>(null);
  const [domesticResult, setDomesticResult] = useState<Transfer | null>(null);
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
  const countryForCurrency = (currency: string) =>
    config.data?.countries.find((m) => m.currency === currency)?.code;

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
    !source || !dest ? null : source.currency === dest.currency ? "domestic" : "workflow";
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

  function resetWizard() {
    setStep(1);
    setPhone("");
    setRecipient(null);
    setDestId("");
    setAmount("");
    setInvoiceNumber("");
    setAuthRef("");
    setNeedsAuth(false);
    setActiveWf(null);
    setDomesticResult(null);
    keyRef.current = newIdempotencyKey();
  }

  const send = useMutation({
    mutationFn: async (): Promise<SendResult> => {
      const key = keyRef.current;
      if (mode === "domestic") {
        const input: Parameters<typeof ledger.createTransfer>[0] = {
          source_account_id: source!.id,
          destination_account_id: dest!.id,
          amount: value,
          currency: source!.currency,
        };
        if (invoiceNumber) input.invoice_number = invoiceNumber;
        const res = await ledger.createTransfer(input, key);
        return { kind: "domestic", transfer: res.transfer };
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
          ...(invoiceNumber ? { invoice_number: invoiceNumber } : {}),
          ...(authRef.trim() ? { provider_authorization_ref: authRef.trim() } : {}),
        },
        key,
      );
      return { kind: "workflow", workflow: res.workflow, ...(res.error ? { error: res.error } : {}) };
    },
    onSuccess: (res) => {
      setNeedsAuth(false);
      if (res.kind === "domestic") {
        setDomesticResult(res.transfer);
        toast.success("Transfer completed", {
          description: `${money(value, source!.currency)} → ${recipient!.user.full_name}`,
        });
      } else {
        if (res.workflow) {
          rememberWorkflow(trader.id, res.workflow.id);
          setActiveWf(res.workflow.id);
          if (res.error)
            toast.warning("Payment started but needs attention", { description: res.error });
        }
        toast.success("Payment submitted", {
          description: `${money(value, source!.currency)} → ${recipient!.user.full_name}`,
        });
      }
      keyRef.current = newIdempotencyKey();
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      void qc.invalidateQueries({ queryKey: ["transfers"] });
      void qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e) => {
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
      if (e instanceof ApiError && e.code.startsWith("kyc_")) {
        toast.error("Verification limit reached", {
          description: e.message,
          action: {
            label: "Verify account",
            onClick: () => void navigate({ to: "/verification" }),
          },
        });
        return;
      }
      toast.error("Payment not completed", { description: describeError(e) });
    },
  });

  const q = quote.data?.quote;
  const inFlight = !!activeWf || !!domesticResult;

  return (
    <>
      <PageHeader
        eyebrow="Settlement desk"
        title="Send Payment"
        description="Pay a supplier in another currency with a live corridor quote. Same-currency payments settle instantly on the ledger; cross-border payments run collect → post → payout with a tracked status."
      />

      {inFlight ? (
        <div className="space-y-3">
          {activeWf ? <ProcessingPanel id={activeWf} payerPhone={payerPhone} onReset={resetWizard} /> : null}
          {domesticResult ? (
            <DomesticSuccessPanel
              transfer={domesticResult}
              recipientName={recipient?.user.full_name ?? "the recipient"}
              onReset={resetWizard}
            />
          ) : null}
          <RecentPayments ids={recent} onOpen={(id) => setActiveWf(id)} />
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[1fr_380px]">
          <Panel title="Send money">
            {wallet.isPending ? (
              <Loading />
            ) : wallet.isError ? (
              <ErrorState error={wallet.error} onRetry={() => void wallet.refetch()} />
            ) : (
              <div>
                <StepRail step={step} />

                {step === 1 ? (
                  <div className="space-y-4">
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
                          className="rounded-lg font-mono"
                        />
                        <Button
                          variant="outline"
                          className="rounded-lg font-mono text-xs uppercase"
                          disabled={!phone.trim() || lookup.isPending}
                          onClick={() => lookup.mutate()}
                        >
                          {lookup.isPending ? "…" : "Look up"}
                        </Button>
                      </div>
                      {recipient ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 p-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
                              {recipient.user.full_name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <div className="text-sm font-medium">{recipient.user.full_name}</div>
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {recipient.user.phone_number}
                              </div>
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
                          <SelectTrigger
                            aria-label="Recipient wallet"
                            className="rounded-lg font-mono text-xs"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {destOptions.map((a) => {
                              const cc = countryForCurrency(a.currency);
                              return (
                                <SelectItem key={a.id} value={a.id}>
                                  <span className="flex items-center gap-2">
                                    {cc ? <Flag code={cc} className="w-4 rounded-[2px]" /> : null}
                                    Business wallet · {a.currency}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}

                    <Button
                      className="w-full rounded-lg font-mono text-xs uppercase"
                      disabled={!recipient || !dest}
                      onClick={() => setStep(2)}
                    >
                      Continue
                    </Button>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-4">
                    <RecipientSummary recipient={recipient} dest={dest} countryForCurrency={countryForCurrency} onEdit={() => setStep(1)} />

                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
                        Pay from
                      </Label>
                      <Select value={source?.id ?? ""} onValueChange={setSourceId}>
                        <SelectTrigger aria-label="Pay from" className="rounded-lg font-mono text-xs">
                          <SelectValue placeholder="Business wallet" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {businessAccounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              Business wallet · {money(wallet.data.balances[a.id]?.amount ?? 0, a.currency)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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
                          className="rounded-lg font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
                          Pay an invoice (optional)
                        </Label>
                        <Select value={invoiceNumber || "none"} onValueChange={pickInvoice}>
                          <SelectTrigger
                            aria-label="Pay an invoice"
                            className="rounded-lg font-mono text-xs"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
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

                    {mode === "workflow" && amountValid ? (
                      <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
                        {quote.isFetching && !q ? (
                          <span className="text-muted-foreground">Fetching live rate…</span>
                        ) : q ? (
                          <>
                            <span className="text-muted-foreground">Supplier receives ≈ </span>
                            <span className="font-mono font-medium">
                              {money(fromMinor(q.deliver_amount_minor), q.to_currency)}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              · rate 1 {q.from_currency} = {q.inverse_rate.toPrecision(5)} {q.to_currency}
                            </span>
                          </>
                        ) : quote.isError ? (
                          <span className="text-destructive">{describeError(quote.error)}</span>
                        ) : null}
                      </div>
                    ) : mode === "domestic" && amountValid ? (
                      <p className="text-xs text-muted-foreground">
                        Same currency on both sides — no conversion and no fee. This settles
                        instantly on the ledger.
                      </p>
                    ) : null}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="rounded-lg font-mono text-xs uppercase"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button
                        className="flex-1 rounded-lg font-mono text-xs uppercase"
                        disabled={!!problem}
                        onClick={() => setStep(3)}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="space-y-4">
                    <RecipientSummary recipient={recipient} dest={dest} countryForCurrency={countryForCurrency} onEdit={() => setStep(1)} />

                    <div className="rounded-xl border border-border p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{source ? money(value, source.currency) : "—"}</span>
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Edit amount"
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      {invoiceNumber ? (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-muted-foreground">Invoice</span>
                          <span className="font-mono">{invoiceNumber}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* The real payment method — VUKA settles domestic transfers straight from the wallet
                        balance, and collects cross-border payments only via the payer's own mobile money
                        number. There is no card or bank-transfer rail to choose, so this reflects that
                        rather than offering a menu that would silently do nothing. */}
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
                        Payment method
                      </Label>
                      {mode === "domestic" ? (
                        <div className="flex items-center gap-3 rounded-xl border border-primary bg-primary/5 p-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <Wallet className="size-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium">VUKA wallet balance</div>
                            <p className="text-[11px] text-muted-foreground">
                              Instant · no conversion, no fee
                            </p>
                          </div>
                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary">
                            <Check className="size-2.5 text-primary-foreground" aria-hidden="true" />
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-primary bg-primary/5 p-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                              <Smartphone className="size-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium">Mobile money</div>
                              <p className="text-[11px] text-muted-foreground">
                                Only collection method available for cross-border payments
                              </p>
                            </div>
                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary">
                              <Check className="size-2.5 text-primary-foreground" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="mt-3 space-y-1.5">
                            <Label
                              htmlFor="payer-phone"
                              className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                            >
                              Your mobile money number (to be charged)
                            </Label>
                            <Input
                              id="payer-phone"
                              value={payerPhone}
                              onChange={(e) => setPayerPhone(e.target.value)}
                              inputMode="tel"
                              className="rounded-lg font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {needsAuth ? (
                      <div className="space-y-1.5 rounded-xl border-2 border-foreground p-3">
                        <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
                          Provider authorization reference
                        </Label>
                        <Input
                          value={authRef}
                          onChange={(e) => setAuthRef(e.target.value)}
                          placeholder="Reference from your MTN / M-Pesa prompt"
                          className="rounded-lg font-mono"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          VUKA never collects or stores your mobile-money PIN. Complete the
                          challenge with your provider, then paste the reference it gives you.
                        </p>
                      </div>
                    ) : null}

                    <dl className="space-y-2 rounded-xl border border-border p-4 font-mono text-xs">
                      {mode === "workflow" && q ? (
                        <>
                          <Line k="You send" v={money(fromMinor(q.source_amount_minor), q.from_currency)} />
                          <Line
                            k={`Fee (${corridor!.fees_bps / 100}%)`}
                            v={`−${money(fromMinor(q.fee_minor), q.from_currency)}`}
                          />
                        </>
                      ) : (
                        <Line k="Fee" v="None — same-currency transfer" />
                      )}
                      <div className="flex justify-between border-t border-border pt-2 text-sm">
                        <dt>{mode === "workflow" ? "Recipient receives" : "Total"}</dt>
                        <dd className="tabular-nums">
                          {mode === "workflow" && q
                            ? money(fromMinor(q.deliver_amount_minor), q.to_currency)
                            : source
                              ? money(value, source.currency)
                              : "—"}
                        </dd>
                      </div>
                    </dl>

                    {problem ? (
                      <p role="status" className="text-xs text-muted-foreground">
                        {problem}
                      </p>
                    ) : null}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="rounded-lg font-mono text-xs uppercase"
                        onClick={() => setStep(2)}
                      >
                        Back
                      </Button>
                      <Button
                        className="flex-1 rounded-lg font-mono text-xs uppercase"
                        disabled={
                          !!problem ||
                          send.isPending ||
                          (mode === "workflow" && !payerPhone.trim()) ||
                          (needsAuth && !authRef.trim())
                        }
                        onClick={() => send.mutate()}
                      >
                        {send.isPending ? "Processing…" : "Confirm and send"}
                      </Button>
                    </div>
                  </div>
                ) : null}
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
                  <Line
                    k="Rate"
                    v={`1 ${q.from_currency} = ${q.inverse_rate.toPrecision(5)} ${q.to_currency}`}
                  />
                  <div className="flex justify-between border-t border-border pt-2 text-sm">
                    <dt>Recipient receives</dt>
                    <dd className="tabular-nums">
                      {money(fromMinor(q.deliver_amount_minor), q.to_currency)}
                    </dd>
                  </div>
                  <p className="pt-1 text-[11px] text-muted-foreground">
                    Quote {truncMid(q.id, 10, 8)} · valid until{" "}
                    {new Date(q.expires_at).toLocaleString()}
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
      )}
    </>
  );
}

function RecipientSummary({
  recipient,
  dest,
  countryForCurrency,
  onEdit,
}: {
  recipient: Recipient | null;
  dest: Account | undefined;
  countryForCurrency: (currency: string) => string | undefined;
  onEdit: () => void;
}) {
  if (!recipient) return null;
  const cc = dest ? countryForCurrency(dest.currency) : undefined;
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
          {recipient.user.full_name.charAt(0).toUpperCase()}
        </span>
        <div>
          <div className="text-sm font-medium">{recipient.user.full_name}</div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            {cc ? <Flag code={cc} className="w-3.5 rounded-[2px]" /> : null}
            {recipient.user.phone_number}
            {dest ? ` · ${dest.currency}` : ""}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
      >
        <Pencil className="size-3" aria-hidden="true" /> Edit
      </button>
    </div>
  );
}

/** The processing step — the already-live PaymentStepper inside WorkflowTracker — plus a plain
 * "start another payment" exit once the workflow has settled, success or not. */
function ProcessingPanel({
  id,
  payerPhone,
  onReset,
}: {
  id: string;
  payerPhone: string;
  onReset: () => void;
}) {
  const wf = useQuery({
    queryKey: ["workflow", id],
    queryFn: () => workflows.get(id),
    refetchInterval: (q) => (isSettled(q.state.data?.state) ? false : 2000),
  });
  const settled = isSettled(wf.data?.state);
  const completed = wf.data?.state === "COMPLETED";

  return (
    <>
      <Panel title="Payment status" meta={<Chip tone="live">Live</Chip>}>
        <WorkflowTracker id={id} defaultPhone={payerPhone} />
      </Panel>
      {settled ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            {completed
              ? "This payment has settled."
              : "This payment has finished for now — see the status above for what to do next."}
          </p>
          <Button variant="outline" className="rounded-lg font-mono text-xs uppercase" onClick={onReset}>
            <RotateCcw className="size-3.5" aria-hidden="true" /> Send another payment
          </Button>
        </div>
      ) : null}
    </>
  );
}

/** Domestic transfers settle instantly and never produce a trackable Workflow, so they get their own
 * lightweight success screen instead of the multi-step tracker. */
function DomesticSuccessPanel({
  transfer,
  recipientName,
  onReset,
}: {
  transfer: Transfer;
  recipientName: string;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Panel title="Payment status" meta={<Chip tone="invert">Settled</Chip>}>
      <div className="flex flex-col items-center py-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <Check className="size-7" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-base font-semibold">Payment completed</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {money(transfer.amount, transfer.currency)} sent to {recipientName}.
        </p>
        <dl className="mt-6 w-full max-w-sm space-y-2 rounded-xl border border-border p-4 text-left font-mono text-xs">
          <Line k="Amount" v={money(transfer.amount, transfer.currency)} />
          <Line k="Fee" v="None" />
          <div className="flex justify-between border-t border-border pt-2 text-sm">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(transfer.amount, transfer.currency)}</dd>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
            <dt className="text-muted-foreground">Transaction ID</dt>
            <dd className="flex items-center gap-1.5">
              <span>{shortId(transfer.id, 14)}</span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(transfer.id);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Copy transaction ID"
              >
                {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
              </button>
            </dd>
          </div>
          <p className="pt-1 text-[11px] text-muted-foreground">{when(transfer.created_at)}</p>
        </dl>
        <Button className="mt-6 rounded-lg font-mono text-xs uppercase" onClick={onReset}>
          <RotateCcw className="size-3.5" aria-hidden="true" /> Send another payment
        </Button>
      </div>
    </Panel>
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
