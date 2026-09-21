import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { platform } from "@/lib/api/endpoints";
import type { PublicCountry } from "@/lib/api/types";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Flag, FlagCloth } from "./flags";
import { setDataSaver, useDataSaver } from "./data-saver";

const Globe = lazy(() => import("./globe"));

/** A believable ring of corridors: every market to its regional neighbours plus a few long hauls. */
function arcsFor(markets: PublicCountry[]): [string, string][] {
  const has = (c: string) => markets.some((m) => m.code === c);
  const pairs: [string, string][] = [
    ["RW", "KE"],
    ["KE", "UG"],
    ["UG", "TZ"],
    ["RW", "TZ"],
    ["KE", "ET"],
    ["TZ", "ZM"],
    ["ZM", "ZA"],
    ["GH", "NG"],
    ["NG", "SN"],
    ["GH", "SN"],
    ["KE", "NG"],
    ["RW", "GH"],
    ["ZA", "KE"],
    ["ET", "NG"],
  ];
  return pairs.filter(([a, b]) => has(a) && has(b));
}

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export function Hero() {
  const t = useT();
  const mounted = useMounted();
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });
  const [active, setActive] = useState<string | null>(null);
  const markets = useMemo(() => config.data?.countries ?? [], [config.data]);
  const arcs = useMemo(() => arcsFor(markets), [markets]);
  const saver = useDataSaver();
  const onActive = useCallback((c: string | null) => setActive(c), []);
  const current = markets.find((m) => m.code === active);

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
        <div>
          <div className="reveal is-in flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <span aria-hidden="true" className="h-px w-10 bg-foreground" />
            {t("landing.eyebrow")}
          </div>
          <h1 className="mt-6 font-display text-5xl font-normal leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">
            Trade across borders on trust that is <em className="italic">enforced</em>, not just
            displayed.
          </h1>
          <p className="mt-7 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t("landing.lead")}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="group rounded-none font-mono text-xs uppercase">
              <Link to="/register">
                {t("landing.cta.register")}
                <ArrowRight
                  className="ml-2 size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-none font-mono text-xs uppercase"
            >
              <a href="#estimate">See what a payment costs</a>
            </Button>
          </div>

          <dl className="mt-12 grid max-w-xl grid-cols-3 border-y border-border">
            {[
              [config.data?.countries.length ?? "—", "countries"],
              [config.data?.corridor_count ?? "—", "corridors"],
              [config.data?.currencies.length ?? "—", "currencies"],
            ].map(([v, l]) => (
              <div key={String(l)} className="border-r border-border px-4 py-5 last:border-r-0">
                <dd className="tabular font-display text-4xl leading-none">{v}</dd>
                <dt className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {l}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="relative mx-auto aspect-square w-full max-w-[600px]">
            {saver ? (
              <div className="flex size-full flex-col items-center justify-center gap-3 border border-dashed border-border p-6 text-center">
                <p className="font-display text-2xl">Map paused to save data</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  The interactive globe is about 100 KB of map data. Everything else on the page
                  works as usual.
                </p>
                <button
                  type="button"
                  onClick={() => setDataSaver(false)}
                  className="border border-foreground px-3 py-1.5 font-mono text-xs uppercase hover:bg-accent"
                >
                  Load the map
                </button>
              </div>
            ) : mounted && markets.length ? (
              <Suspense
                fallback={<Skeleton className="size-full rounded-full" aria-label="Loading map" />}
              >
                <Globe
                  markets={markets}
                  arcs={arcs}
                  activeCode={active}
                  onActive={onActive}
                  className="relative size-full"
                />
              </Suspense>
            ) : (
              <Skeleton className="size-full rounded-full" aria-label="Loading map" />
            )}
          </div>
          <div
            aria-live="polite"
            className="mx-auto mt-4 min-h-[68px] max-w-[600px] border border-border bg-card p-3 text-sm"
          >
            {current ? (
              <>
                <div className="flex items-center gap-3">
                  <FlagCloth
                    code={current.code}
                    label={`Flag of ${current.name}`}
                    className="w-14 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-xl">{current.name}</span>
                      <span className="font-mono text-xs">{current.currency}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Payout rail: {current.provider_name} · {current.region} region
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Drag the globe. Hover a solid country to see its rail. Dashed arcs are live
                corridors.
              </p>
            )}
          </div>
          <ul
            className="mx-auto mt-3 flex max-w-[600px] flex-wrap justify-center gap-1.5"
            aria-label="Markets"
          >
            {markets.map((m) => (
              <li key={m.code}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(m.code)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(m.code)}
                  onBlur={() => setActive(null)}
                  className={cn(
                    "border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
                    active === m.code
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Flag
                    code={m.code}
                    ink={active !== m.code}
                    className="mr-1.5 inline-block w-4 align-[-2px]"
                  />
                  {m.code} · {m.currency}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
