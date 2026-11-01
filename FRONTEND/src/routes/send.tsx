import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Copy,
  FileText,
  Globe2,
  Lock,
  Pencil,
  RotateCcw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
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
import { Chip, Panel, Shell } from "@/components/vuka/shell";
import { invoiceTotal } from "@/components/vuka/trader-invoices";
import { isSettled, stateTone, WorkflowTracker } from "@/components/vuka/workflow-tracker";
import { ApiError, describeError, isApiError, newIdempotencyKey } from "@/lib/api/client";
import { corridors as corridorApi, ledger, platform, workflows } from "@/lib/api/endpoints";
import type { Account, Recipient, Transfer, Workflow } from "@/lib/api/types";
import { fromMinor, money, shortId, toMinor, truncMid, when } from "@/lib/format";
import { DIAL } from "@/lib/markets";
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

const WIZARD_STEPS = [
  { title: "Recipient & Corridor", sub: "Verify supplier MSISDN & destination vault" },
  { title: "Amount & Invoice", sub: "Lock corridor FX rate & link trade invoice" },
  { title: "Review & Dispatch", sub: "Confirm collection rail & execute settlement" },
] as const;

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

function StepRail({ step, onJump }: { step: number; onJump: (target: number) => void }) {
  return (
    <div className="mb-7 grid gap-3 sm:grid-cols-3">
      {WIZARD_STEPS.map((s, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <button
            key={s.title}
            type="button"
            disabled={!done}
            onClick={() => done && onJump(n)}
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all",
              current &&
                "border-[#151515] bg-[#151515] text-white shadow-[0_14px_30px_-14px_rgba(0,0,0,0.35)]",
              done &&
                "cursor-pointer border-[#79b200]/45 bg-[#f5fbe6] text-[#151515] hover:border-[#79b200] dark:bg-[#1b2410] dark:text-foreground",
              !current && !done && "border-border bg-muted/25 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold",
                current && "bg-[#c2f74d] text-[#151515]",
                done && "bg-[#151515] text-[#c2f74d]",
                !current && !done && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden="true" /> : `0${n}`}
            </span>
            <div className="min-w-0">
              <div
                className={cn(
                  "font-mono text-[10px] font-bold uppercase tracking-[0.16em]",
                  current ? "text-[#c2f74d]" : done ? "text-[#4d7500]" : "text-muted-foreground",
                )}
              >
                Step 0{n}
              </div>
              <div
                className={cn(
                  "mt-0.5 truncate text-xs font-semibold",
                  current ? "text-white" : "text-foreground",
                )}
              >
                {s.title}
              </div>
              <div
                className={cn(
                  "mt-0.5 line-clamp-1 text-[11px]",
                  current ? "text-white/65" : "text-muted-foreground",
                )}
              >
                {s.sub}
              </div>
            </div>
          </button>
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
      return {
        kind: "workflow",
        workflow: res.workflow,
        ...(res.error ? { error: res.error } : {}),
      };
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
          | { available?: number; required?: number; currency?: string }
          | undefined;
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
  const sourceCountry = source ? countryForCurrency(source.currency) : undefined;
  const destCountry = dest ? countryForCurrency(dest.currency) : undefined;
  const markets = config.data?.countries ?? [];

  return (
    <div className="space-y-6">
      {/* Executive Settlement Desk Banner */}
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

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c2f74d]/40 bg-[#c2f74d]/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                <span className="size-1.5 rounded-full bg-[#c2f74d]" />
                Cross-Border Settlement Desk
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75">
                <Lock className="size-3 text-[#c2f74d]" /> Replay-Safe Idempotency
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Send Supplier Payment
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
              Lock a deterministic corridor FX quote and settle across borders in three atomic hops
              (Mobile Money Collection → Double-Entry Ledger → Supplier Rail Payout), or settle
              same-currency transfers instantly on the ledger.
            </p>
          </div>

          {/* Live Liquidity & Corridor Status Strip */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
                  Source Business Vault
                </span>
                {sourceCountry ? <Flag code={sourceCountry} className="w-4 rounded-[2px]" /> : null}
              </div>
              <div className="mt-2.5 font-mono text-2xl font-bold tabular-nums text-white">
                {source ? money(balance, source.currency) : "—"}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[10px] text-white/60">
                <span>Available Liquidity</span>
                <Link to="/wallets" className="text-[#c2f74d] hover:underline">
                  Top up →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
                  Settlement Engine
                </span>
                <Globe2 className="size-4 text-[#c2f74d]" />
              </div>
              <div className="mt-2.5 font-mono text-xl font-bold text-white">
                {corridor
                  ? `${corridor.from_currency} → ${corridor.to_currency}`
                  : mode === "domestic"
                    ? `${source?.currency} Instant`
                    : `${config.data?.corridor_count ?? 90} Corridors`}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[10px] text-white/60">
                <span>
                  {corridor
                    ? `Fee ${(corridor.fees_bps / 100).toFixed(2)}% (${corridor.fees_bps} bps)`
                    : "0.80% Intra · 1.20% Cross"}
                </span>
                <span className="text-[#c2f74d]">Live FX</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {inFlight ? (
        <div className="space-y-4">
          {activeWf ? (
            <ProcessingPanel id={activeWf} payerPhone={payerPhone} onReset={resetWizard} />
          ) : null}
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
        <div className="grid gap-5 lg:grid-cols-[1.2fr_430px] lg:items-start">
          {/* Left Column: 3-Step Interactive Dispatch Workbench */}
          <Panel
            title="Cross-Border Payment Dispatch Workbench"
            meta={
              <Chip tone="live">
                <ShieldCheck className="size-3" /> Step 0{step} of 03
              </Chip>
            }
          >
            {wallet.isPending ? (
              <Loading />
            ) : wallet.isError ? (
              <ErrorState error={wallet.error} onRetry={() => void wallet.refetch()} />
            ) : (
              <div>
                <StepRail step={step} onJump={setStep} />

                {/* STEP 1: RECIPIENT & CORRIDOR */}
                {step === 1 ? (
                  <div className="space-y-5">
                    {/* Quick Country Dial-Code Prefix Bar */}
                    {markets.length > 0 ? (
                      <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          10 Launch Markets · Click a country dial prefix to pre-fill
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {markets.map((m) => {
                            const dial = DIAL[m.code] ?? "";
                            const prefix = `+${dial}`;
                            const activePrefix = phone.startsWith(prefix);
                            return (
                              <button
                                key={m.code}
                                type="button"
                                onClick={() => {
                                  if (!phone.startsWith(prefix)) {
                                    setPhone(prefix);
                                    setRecipient(null);
                                  }
                                }}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-all",
                                  activePrefix
                                    ? "border-[#151515] bg-[#151515] font-semibold text-[#c2f74d]"
                                    : "border-border bg-card text-foreground hover:border-[#79b200]",
                                )}
                              >
                                <Flag code={m.code} className="w-3.5 rounded-[2px]" />
                                <span>{m.code}</span>
                                <span className="opacity-70">{prefix}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                        Recipient Mobile Money Number (MSISDN)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            setRecipient(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && phone.trim()) {
                              e.preventDefault();
                              lookup.mutate();
                            }
                          }}
                          placeholder="+254700000000"
                          inputMode="tel"
                          className="h-11 rounded-xl font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          className="h-11 rounded-xl border-[#151515] bg-[#151515] px-5 font-mono text-xs font-semibold uppercase text-[#c2f74d] hover:bg-[#151515]/90 hover:text-[#c2f74d]"
                          disabled={!phone.trim() || lookup.isPending}
                          onClick={() => lookup.mutate()}
                        >
                          {lookup.isPending ? "Verifying…" : "Verify Trader"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter the supplier&apos;s registered VUKA phone number with international
                        dialing code (e.g. +254 for Kenya, +250 for Rwanda).
                      </p>

                      {recipient ? (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#79b200]/50 bg-[#f5fbe6] p-4 text-[#151515] dark:bg-[#1b2410] dark:text-foreground">
                          <div className="flex items-center gap-3.5">
                            <span className="flex size-11 items-center justify-center rounded-2xl bg-[#151515] font-mono text-sm font-bold text-[#c2f74d]">
                              {recipient.user.full_name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">
                                  {recipient.user.full_name}
                                </span>
                                <Chip tone="live">Verified Counterparty</Chip>
                              </div>
                              <div className="mt-0.5 font-mono text-xs opacity-75">
                                {recipient.user.phone_number} · {destOptions.length} Business{" "}
                                {destOptions.length === 1 ? "Vault" : "Vaults"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {recipient && destOptions.length > 1 ? (
                      <div className="space-y-1.5">
                        <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                          Destination Supplier Vault
                        </Label>
                        <Select value={dest?.id ?? ""} onValueChange={setDestId}>
                          <SelectTrigger
                            aria-label="Recipient wallet"
                            className="h-11 rounded-xl font-mono text-xs"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {destOptions.map((a) => {
                              const cc = countryForCurrency(a.currency);
                              return (
                                <SelectItem key={a.id} value={a.id}>
                                  <span className="flex items-center gap-2">
                                    {cc ? <Flag code={cc} className="w-4 rounded-[2px]" /> : null}
                                    Business Trade Vault · {a.currency}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}

                    <Button
                      className="h-11 w-full rounded-xl bg-[#151515] font-mono text-xs font-bold uppercase tracking-wider text-[#c2f74d] hover:bg-[#151515]/90"
                      disabled={!recipient || !dest}
                      onClick={() => setStep(2)}
                    >
                      Continue to Amount &amp; Quote <ArrowRight className="ml-1.5 size-4" />
                    </Button>
                  </div>
                ) : null}

                {/* STEP 2: AMOUNT, INVOICE & QUOTE */}
                {step === 2 ? (
                  <div className="space-y-5">
                    <RecipientSummary
                      recipient={recipient}
                      dest={dest}
                      countryForCurrency={countryForCurrency}
                      onEdit={() => setStep(1)}
                    />

                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                        Source Business Trade Vault
                      </Label>
                      <Select value={source?.id ?? ""} onValueChange={setSourceId}>
                        <SelectTrigger
                          aria-label="Pay from"
                          className="h-11 rounded-xl font-mono text-xs"
                        >
                          <SelectValue placeholder="Business wallet" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {businessAccounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              Business Trade Vault ·{" "}
                              {money(wallet.data.balances[a.id]?.amount ?? 0, a.currency)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                            Amount {source ? `(${source.currency})` : ""}
                          </Label>
                          {source ? (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              Avail: {money(balance, source.currency)}
                            </span>
                          ) : null}
                        </div>
                        <Input
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          inputMode="decimal"
                          placeholder="0.00"
                          className="h-11 rounded-xl font-mono text-base font-bold"
                        />
                        {/* Quick Balance Allocation Chips */}
                        {balance > 0 ? (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {[
                              { label: "25%", frac: 0.25 },
                              { label: "50%", frac: 0.5 },
                              { label: "75%", frac: 0.75 },
                              { label: "Max", frac: 1 },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() =>
                                  setAmount(String(Math.floor(balance * preset.frac)))
                                }
                                className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-mono text-[10px] font-semibold text-muted-foreground transition hover:border-[#79b200] hover:bg-[#c2f74d]/25 hover:text-foreground"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                          Link Trade Invoice (Optional)
                        </Label>
                        <Select value={invoiceNumber || "none"} onValueChange={pickInvoice}>
                          <SelectTrigger
                            aria-label="Pay an invoice"
                            className="h-11 rounded-xl font-mono text-xs"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="none">No linked invoice</SelectItem>
                            {unpaidInvoices.map((i) => (
                              <SelectItem key={i.id} value={i.number}>
                                {i.number} · {money(invoiceTotal(i), i.currency)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                          Linking an invoice marks it settled on the ledger and boosts your
                          Invoice-Discipline trust factor.
                        </p>
                      </div>
                    </div>

                    {/* Live Conversion Preview Strip inside Step 2 */}
                    {mode === "workflow" && amountValid ? (
                      <div className="rounded-2xl border border-[#79b200]/40 bg-[#f6fce8] p-4 text-xs text-[#151515] dark:bg-[#1b2410] dark:text-foreground">
                        {quote.isFetching && !q ? (
                          <span className="font-mono text-muted-foreground">
                            Locking live corridor exchange rate…
                          </span>
                        ) : q ? (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4d7500]">
                                Firm Corridor Quote Locked
                              </div>
                              <div className="mt-1 text-sm font-bold">
                                Supplier receives{" "}
                                <span className="font-mono text-base underline decoration-[#79b200]">
                                  {money(fromMinor(q.deliver_amount_minor), q.to_currency)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right font-mono text-[11px]">
                              <div>
                                1 {q.from_currency} = {q.inverse_rate.toPrecision(5)}{" "}
                                {q.to_currency}
                              </div>
                              <div className="text-muted-foreground">
                                Fee: {money(fromMinor(q.fee_minor), q.from_currency)} (
                                {(corridor!.fees_bps / 100).toFixed(2)}%)
                              </div>
                            </div>
                          </div>
                        ) : quote.isError ? (
                          <span className="text-destructive">{describeError(quote.error)}</span>
                        ) : null}
                      </div>
                    ) : mode === "domestic" && amountValid ? (
                      <div className="rounded-2xl border border-border bg-muted/30 p-4 text-xs">
                        <span className="font-mono font-semibold text-foreground">
                          Instant Domestic Book Settlement:{" "}
                        </span>
                        <span className="text-muted-foreground">
                          Both vaults are denominated in {source?.currency}. Zero FX conversion and
                          zero protocol fee.
                        </span>
                      </div>
                    ) : null}

                    {problem ? (
                      <div
                        role="status"
                        className="rounded-xl border border-destructive/40 bg-destructive/5 px-3.5 py-2.5 font-mono text-xs text-destructive"
                      >
                        {problem}
                      </div>
                    ) : null}

                    <div className="flex gap-2.5">
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl px-5 font-mono text-xs uppercase"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button
                        className="h-11 flex-1 rounded-xl bg-[#151515] font-mono text-xs font-bold uppercase tracking-wider text-[#c2f74d] hover:bg-[#151515]/90"
                        disabled={!!problem}
                        onClick={() => setStep(3)}
                      >
                        Review Settlement Ticket <ArrowRight className="ml-1.5 size-4" />
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* STEP 3: REVIEW & DISPATCH */}
                {step === 3 ? (
                  <div className="space-y-5">
                    <RecipientSummary
                      recipient={recipient}
                      dest={dest}
                      countryForCurrency={countryForCurrency}
                      onEdit={() => setStep(1)}
                    />

                    {/* Principal & Invoice Summary */}
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                          Principal Amount
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold">
                            {source ? money(value, source.currency) : "—"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Edit amount"
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      {invoiceNumber ? (
                        <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5">
                          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                            Linked Invoice
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#c2f74d]/35 px-2 py-0.5 font-mono text-xs font-semibold">
                            <FileText className="size-3" /> {invoiceNumber}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Payment Collection Rail */}
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                        Settlement Collection Rail
                      </Label>
                      {mode === "domestic" ? (
                        <div className="flex items-center gap-3.5 rounded-2xl border border-[#79b200]/50 bg-[#f6fce8] p-4 text-[#151515] dark:bg-[#1b2410] dark:text-foreground">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#151515] text-[#c2f74d]">
                            <Wallet className="size-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold">VUKA Business Vault Balance</div>
                            <p className="text-xs text-muted-foreground">
                              Instant double-entry book settlement · zero FX spread, zero fee
                            </p>
                          </div>
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#151515] text-[#c2f74d]">
                            <Check className="size-3" aria-hidden="true" />
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[#79b200]/50 bg-[#f6fce8] p-4 text-[#151515] dark:bg-[#1b2410] dark:text-foreground">
                          <div className="flex items-center gap-3.5">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#151515] text-[#c2f74d]">
                              <Smartphone className="size-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold">
                                Mobile Money Collection → Ledger → Supplier Payout
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Authorized push collection from your registered mobile money account
                              </p>
                            </div>
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#151515] text-[#c2f74d]">
                              <Check className="size-3" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="mt-4 space-y-1.5 border-t border-black/10 pt-3 dark:border-white/10">
                            <Label
                              htmlFor="payer-phone"
                              className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
                            >
                              Your Mobile Money Number (Collection MSISDN)
                            </Label>
                            <Input
                              id="payer-phone"
                              value={payerPhone}
                              onChange={(e) => setPayerPhone(e.target.value)}
                              inputMode="tel"
                              className="h-10 rounded-xl bg-white font-mono dark:bg-background"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {needsAuth ? (
                      <div className="space-y-2 rounded-2xl border-2 border-[#151515] bg-muted/30 p-4">
                        <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
                          Provider Authorization Reference
                        </Label>
                        <Input
                          value={authRef}
                          onChange={(e) => setAuthRef(e.target.value)}
                          placeholder="Reference from your MTN / M-Pesa prompt"
                          className="h-10 rounded-xl font-mono"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          VUKA never collects or stores your mobile-money PIN. Complete the
                          challenge with your provider, then paste the reference it gives you.
                        </p>
                      </div>
                    ) : null}

                    {problem ? (
                      <p role="status" className="font-mono text-xs text-destructive">
                        {problem}
                      </p>
                    ) : null}

                    <div className="flex gap-2.5">
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl px-5 font-mono text-xs uppercase"
                        onClick={() => setStep(2)}
                      >
                        Back
                      </Button>
                      <Button
                        className="h-11 flex-1 rounded-xl bg-[#151515] font-mono text-xs font-bold uppercase tracking-wider text-[#c2f74d] hover:bg-[#151515]/90"
                        disabled={
                          !!problem ||
                          send.isPending ||
                          (mode === "workflow" && !payerPhone.trim()) ||
                          (needsAuth && !authRef.trim())
                        }
                        onClick={() => send.mutate()}
                      >
                        <Send className="mr-1.5 size-3.5" />
                        {send.isPending ? "Dispatching Settlement…" : "Confirm & Dispatch Payment"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </Panel>

          {/* Right Column: Live Dark-Ink Settlement Ticket + Recent Workflows */}
          <div className="space-y-4">
            <section className="relative overflow-hidden rounded-3xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full opacity-20 blur-3xl"
                style={{ background: "radial-gradient(circle, #c2f74d 0%, transparent 70%)" }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#c2f74d]">
                      Live Settlement Ticket
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-white/70">
                      {corridor
                        ? `Corridor ${corridor.id}`
                        : mode === "domestic"
                          ? "Same-Currency Book Transfer"
                          : "Awaiting Route Selection"}
                    </div>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-white">
                    {corridor ? `${(corridor.fees_bps / 100).toFixed(2)}% Fee` : "0.00% Fee"}
                  </span>
                </div>

                {/* 3-Node Visual Route Diagram */}
                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                      Origin Vault
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 font-mono text-xs font-bold">
                      {sourceCountry ? (
                        <Flag code={sourceCountry} className="w-4 rounded-[2px]" />
                      ) : null}
                      <span>{source?.currency ?? "—"}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-white/55">
                      {trader.full_name}
                    </div>
                  </div>

                  <div className="flex flex-col items-center px-2">
                    <span className="rounded-full bg-[#c2f74d]/20 px-2 py-0.5 font-mono text-[9px] font-semibold text-[#c2f74d]">
                      {mode === "domestic" ? "LEDGER" : "3-HOP FX"}
                    </span>
                    <ArrowRight className="mt-1 size-4 text-[#c2f74d]" />
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                      Target Vault
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1.5 font-mono text-xs font-bold">
                      {destCountry ? (
                        <Flag code={destCountry} className="w-4 rounded-[2px]" />
                      ) : null}
                      <span>{dest?.currency ?? "Select"}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-white/55">
                      {recipient?.user.full_name ?? "Unselected"}
                    </div>
                  </div>
                </div>

                {/* Live Quote Details */}
                <div className="mt-4">
                  {!corridor ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs text-white/70">
                      {source && dest ? (
                        <div className="space-y-2">
                          <TicketRow
                            k="Principal"
                            v={amountValid ? money(value, source.currency) : "0.00"}
                          />
                          <TicketRow k="Protocol Fee" v="0.00 (Same currency)" />
                          <div className="flex items-baseline justify-between border-t border-white/10 pt-2.5 text-sm">
                            <span className="text-white/70">Supplier Receives</span>
                            <span className="font-bold text-[#c2f74d]">
                              {amountValid ? money(value, source.currency) : "—"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed text-white/60">
                          Verify a recipient in Step 01 and enter an amount in Step 02 to stream a
                          firm corridor quote from the settlement engine.
                        </p>
                      )}
                    </div>
                  ) : quote.isFetching && !q ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center font-mono text-xs text-[#c2f74d]">
                      Streaming live corridor quote…
                    </div>
                  ) : quote.isError ? (
                    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
                      {describeError(quote.error)}
                    </div>
                  ) : q ? (
                    <dl className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs">
                      <TicketRow
                        k="You Send"
                        v={money(fromMinor(q.source_amount_minor), q.from_currency)}
                      />
                      <TicketRow
                        k={`Corridor Fee (${(corridor.fees_bps / 100).toFixed(2)}%)`}
                        v={`−${money(fromMinor(q.fee_minor), q.from_currency)}`}
                      />
                      <TicketRow
                        k="Locked FX Rate"
                        v={`1 ${q.from_currency} = ${q.inverse_rate.toPrecision(5)} ${q.to_currency}`}
                      />
                      {invoiceNumber ? <TicketRow k="Linked Invoice" v={invoiceNumber} /> : null}
                      <div className="flex items-baseline justify-between border-t border-white/15 pt-3 text-sm">
                        <dt className="font-sans text-xs font-semibold text-white/80">
                          Supplier Receives Net
                        </dt>
                        <dd className="font-mono text-lg font-bold tabular-nums text-[#c2f74d]">
                          {money(fromMinor(q.deliver_amount_minor), q.to_currency)}
                        </dd>
                      </div>
                      <p className="border-t border-white/10 pt-2.5 text-[10px] leading-relaxed text-white/50">
                        Quote {truncMid(q.id, 10, 8)} · Valid until{" "}
                        {new Date(q.expires_at).toLocaleTimeString()}
                        {quote.data?.execution === "local_synthetic"
                          ? " · Sandbox synthetic rail"
                          : ""}
                      </p>
                    </dl>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs text-white/60">
                      Enter a payment amount in {source?.currency} to calculate the live FX
                      conversion and corridor fee.
                    </div>
                  )}
                </div>

                {/* Idempotency & Security Footer */}
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 font-mono text-[10px] text-white/55">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="size-3 text-[#c2f74d]" /> Idempotency Key
                  </span>
                  <span>{truncMid(keyRef.current, 8, 6)}</span>
                </div>
              </div>
            </section>

            <RecentPayments ids={recent} onOpen={setActiveWf} />
          </div>
        </div>
      )}
    </div>
  );
}

function TicketRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-white/55">{k}</dt>
      <dd className="font-semibold tabular-nums text-white">{v}</dd>
    </div>
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
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#79b200]/45 bg-[#f5fbe6] p-3.5 text-[#151515] dark:bg-[#1b2410] dark:text-foreground">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#151515] font-mono text-xs font-bold text-[#c2f74d]">
          {recipient.user.full_name.charAt(0).toUpperCase()}
        </span>
        <div>
          <div className="text-sm font-bold">{recipient.user.full_name}</div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] opacity-75">
            {cc ? <Flag code={cc} className="w-3.5 rounded-[2px]" /> : null}
            {recipient.user.phone_number}
            {dest ? ` · ${dest.currency} Vault` : ""}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 rounded-lg border border-black/15 bg-white/80 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase hover:bg-white dark:border-white/15 dark:bg-black/30"
      >
        <Pencil className="size-3" aria-hidden="true" /> Change
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
      <Panel
        title="Live Cross-Border Settlement Telemetry"
        meta={
          <Chip tone="live">
            <Zap className="size-3" /> Real-Time State Machine
          </Chip>
        }
      >
        <WorkflowTracker id={id} defaultPhone={payerPhone} />
      </Panel>
      {settled ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">
            {completed
              ? "This cross-border payment has settled on the double-entry ledger and supplier payout rail."
              : "This payment workflow has paused — inspect the step status above for recovery options."}
          </p>
          <Button
            className="rounded-xl bg-[#151515] font-mono text-xs font-bold uppercase text-[#c2f74d] hover:bg-[#151515]/90"
            onClick={onReset}
          >
            <RotateCcw className="mr-1.5 size-3.5" aria-hidden="true" /> Send another payment
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
    <Panel title="Instant Domestic Ledger Settlement" meta={<Chip tone="live">Settled</Chip>}>
      <div className="flex flex-col items-center py-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-[#151515] text-[#c2f74d] shadow-lg">
          <Check className="size-8" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-xl font-bold">Payment Settled on Ledger</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {money(transfer.amount, transfer.currency)} transferred to {recipientName}.
        </p>
        <dl className="mt-6 w-full max-w-md space-y-2.5 rounded-2xl border border-border bg-muted/20 p-5 text-left font-mono text-xs">
          <Line k="Amount" v={money(transfer.amount, transfer.currency)} />
          <Line k="Protocol Fee" v="0.00 (Same-currency book transfer)" />
          <div className="flex justify-between border-t border-border pt-2.5 text-sm font-bold">
            <dt>Total Settled</dt>
            <dd className="tabular-nums">{money(transfer.amount, transfer.currency)}</dd>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
            <dt className="text-muted-foreground">Ledger Transfer ID</dt>
            <dd className="flex items-center gap-1.5 font-semibold">
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
                {copied ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="size-3.5" aria-hidden="true" />
                )}
              </button>
            </dd>
          </div>
          <p className="pt-1 text-[11px] text-muted-foreground">{when(transfer.created_at)}</p>
        </dl>
        <Button
          className="mt-6 h-11 rounded-xl bg-[#151515] px-6 font-mono text-xs font-bold uppercase text-[#c2f74d] hover:bg-[#151515]/90"
          onClick={onReset}
        >
          <RotateCcw className="mr-1.5 size-3.5" aria-hidden="true" /> Send another payment
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
    <Panel title="Recent Cross-Border Workflows" meta={<Chip>{ids.length} tracked</Chip>}>
      {ids.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Cross-border workflows you dispatch from this browser appear here for instant live
          tracking.
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
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <span>
                    <span className="block font-mono text-xs font-semibold">
                      {shortId(id, 14)}
                    </span>
                    {w ? (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {money(w.amount, w.currency_from)} → {w.currency_to} ({w.corridor_id})
                      </span>
                    ) : null}
                  </span>
                  {w ? (
                    <Chip tone={stateTone(w.state)}>{w.state.replaceAll("_", " ")}</Chip>
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
