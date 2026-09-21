import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, describeError, isApiError } from "@/lib/api/client";
import { platform } from "@/lib/api/endpoints";
import { money } from "@/lib/format";
import { parseAmount } from "@/lib/schemas";
import { Flag } from "./flags";
import { Reveal } from "./reveal";

interface Estimate {
  indicative: true;
  corridor_id: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  fee_bps: number;
  delivered: number;
  rate: number;
  inverse_rate: number;
  rate_source: string;
  provider_id: string;
  min_amount: number;
  max_amount: number;
}

function useDebounced<T>(v: T, ms = 350): T {
  const [x, setX] = useState(v);
  useEffect(() => {
    const id = setTimeout(() => setX(v), ms);
    return () => clearTimeout(id);
  }, [v, ms]);
  return x;
}

/** Public cost calculator backed by GET /api/public/estimate — indicative, unauthenticated, no quote id. */
export function Estimator() {
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });
  const currencies = config.data?.currencies ?? [];
  const [from, setFrom] = useState("RWF");
  const [to, setTo] = useState("KES");
  const [amountText, setAmountText] = useState("100000");
  const amount = parseAmount(amountText);
  const dAmount = useDebounced(amount);

  const est = useQuery({
    queryKey: ["estimate", from, to, dAmount],
    queryFn: () => api.get<Estimate>("/api/public/estimate", { from, to, amount: dAmount ?? 0 }),
    enabled: !!dAmount && from !== to && currencies.length > 0,
    retry: false,
    staleTime: 30_000,
  });

  const e = est.data;
  const limitsBody = isApiError(est.error)
    ? (est.error.body as { min_amount?: number; max_amount?: number } | undefined)
    : undefined;

  return (
    <section id="estimate" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Cost estimator
          </div>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            Know the price <em>before</em> you commit.
          </h2>
          <p className="mt-5 max-w-lg text-muted-foreground">
            Every corridor is priced from a transparent fee tier and an FX rate. Try any pair of the
            ten currencies below — this is the same pricing engine that issues firm quotes to
            signed-in traders, shown here as an indicative figure.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            <li className="flex gap-3">
              <span className="font-mono text-xs text-muted-foreground">01</span> Fees are 0.80%
              inside a regional economic community and 1.20% across regions.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-muted-foreground">02</span> The rate is shown
              both ways, so there is no guessing which way it converts.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-muted-foreground">03</span> A firm quote locks
              fee, rate and delivered amount for ten minutes.
            </li>
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative">
            <div className="border border-border bg-card p-5 sm:p-7">
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="est-from"
                    className="font-mono text-[10px] uppercase tracking-[0.16em]"
                  >
                    You send from
                    <CurrencyFlag currency={from} countries={config.data?.countries ?? []} />
                  </Label>
                  <select
                    id="est-from"
                    value={from}
                    onChange={(x) => setFrom(x.target.value)}
                    className="h-10 w-full border border-input bg-background px-2 font-mono text-sm"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mb-0 size-10 rounded-none"
                  aria-label="Swap currencies"
                  onClick={() => {
                    setFrom(to);
                    setTo(from);
                  }}
                >
                  <ArrowLeftRight className="size-4" aria-hidden="true" />
                </Button>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="est-to"
                    className="font-mono text-[10px] uppercase tracking-[0.16em]"
                  >
                    Recipient gets
                    <CurrencyFlag currency={to} countries={config.data?.countries ?? []} />
                  </Label>
                  <select
                    id="est-to"
                    value={to}
                    onChange={(x) => setTo(x.target.value)}
                    className="h-10 w-full border border-input bg-background px-2 font-mono text-sm"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <Label
                  htmlFor="est-amount"
                  className="font-mono text-[10px] uppercase tracking-[0.16em]"
                >
                  Amount ({from})
                </Label>
                <Input
                  id="est-amount"
                  inputMode="decimal"
                  value={amountText}
                  onChange={(x) => setAmountText(x.target.value)}
                  className="h-11 rounded-none font-mono text-lg"
                  aria-invalid={amountText !== "" && amount === null}
                />
                {amountText !== "" && amount === null ? (
                  <p role="alert" className="text-xs">
                    Enter a positive amount, e.g. 100000 or 2,500.50
                  </p>
                ) : null}
              </div>

              <div aria-live="polite" className="mt-6 min-h-[290px]">
                {from === to ? (
                  <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Same currency: no conversion and no corridor fee — a domestic payment settles on
                    the ledger at par.
                  </p>
                ) : est.isError ? (
                  <div className="border-2 border-foreground p-4 text-sm">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em]">
                      No estimate
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {isApiError(est.error) ? est.error.message : describeError(est.error)}
                      {limitsBody?.min_amount !== undefined
                        ? ` Allowed range: ${money(limitsBody.min_amount, from)} – ${money(limitsBody.max_amount ?? 0, from)}.`
                        : ""}
                    </p>
                  </div>
                ) : e ? (
                  <Receipt e={e} />
                ) : (
                  <div className="border border-dashed border-border p-4 text-sm text-muted-foreground">
                    {est.isFetching ? "Pricing…" : "Enter an amount to see the estimate."}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="max-w-xs text-[11px] text-muted-foreground">
                  Indicative, at sandbox reference rates. Sign in for a firm quote that locks the
                  rate.
                </p>
                <Button asChild className="rounded-none font-mono text-xs uppercase">
                  <Link to="/register">Get a firm quote</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Sends the estimate through the phone's own share sheet (WhatsApp, SMS, ...) or a WhatsApp link. */
function ShareRow({ e }: { e: Estimate }) {
  const [note, setNote] = useState("");
  const text = `VUKA estimate (indicative, sandbox): send ${money(e.amount, e.from)}, fee ${money(e.fee, e.from)}, recipient gets ${money(e.delivered, e.to)}.`;
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: "VUKA estimate", text });
      else {
        await navigator.clipboard.writeText(text);
        setNote("Copied to clipboard");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setNote("Could not share on this device");
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
      <button
        type="button"
        onClick={() => void share()}
        className="inline-flex items-center gap-1.5 border border-foreground px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-accent"
      >
        <Share2 className="size-3" aria-hidden="true" />
        Share
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="border border-border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-accent"
      >
        WhatsApp
      </a>
      <span role="status" className="font-mono text-[10px] text-muted-foreground">
        {note}
      </span>
    </div>
  );
}

function Receipt({ e }: { e: Estimate }) {
  const rows: [string, string, string?][] = [
    ["You send", money(e.amount, e.from)],
    [`Corridor fee · ${(e.fee_bps / 100).toFixed(2)}%`, `− ${money(e.fee, e.from)}`],
    ["Rate", `1 ${e.from} = ${e.inverse_rate.toPrecision(5)} ${e.to}`],
    ["Payout rail", e.provider_id],
  ];
  return (
    <div className="relative border border-border bg-background" aria-label="Estimate receipt">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-px h-2 bg-[radial-gradient(circle_at_6px_0,var(--color-card)_5px,transparent_5.5px)] bg-[length:12px_8px]"
      />
      <dl className="space-y-2.5 px-5 pb-4 pt-6 font-mono text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="tabular text-right">{v}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 border-t border-dashed border-border pt-3">
          <dt className="text-sm">Recipient receives</dt>
          <dd className="tabular font-display text-3xl leading-none">{money(e.delivered, e.to)}</dd>
        </div>
      </dl>
      <ShareRow e={e} />
      <div
        className="stamp-in absolute right-4 top-3 border-2 border-foreground px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]"
        aria-hidden="true"
      >
        Indicative
      </div>
    </div>
  );
}

function CurrencyFlag({
  currency,
  countries,
}: {
  currency: string;
  countries: { code: string; currency: string; name: string }[];
}) {
  const c = countries.find((x) => x.currency === currency);
  return c ? (
    <Flag
      code={c.code}
      label={`Flag of ${c.name}`}
      className="ml-2 inline-block w-5 align-[-3px]"
    />
  ) : null;
}
