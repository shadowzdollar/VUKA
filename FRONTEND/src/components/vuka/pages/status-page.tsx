import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { platform } from "@/lib/api/endpoints";
import { PublicPage, Section } from "../public-page";

const BASE = (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

async function probe(
  path: string,
): Promise<{ ok: boolean; status: number; ms: number; body: unknown }> {
  const t0 = performance.now();
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { Accept: "application/json" } });
    const body = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, ms: Math.round(performance.now() - t0), body };
  } catch {
    return { ok: false, status: 0, ms: Math.round(performance.now() - t0), body: null };
  }
}

export function StatusPage() {
  const live = useQuery({
    queryKey: ["probe", "healthz"],
    queryFn: () => probe("/healthz"),
    refetchInterval: 30_000,
    retry: false,
  });
  const ready = useQuery({
    queryKey: ["probe", "readyz"],
    queryFn: () => probe("/readyz"),
    refetchInterval: 30_000,
    retry: false,
  });
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    refetchInterval: 60_000,
    retry: false,
  });
  const checks = (ready.data?.body as { checks?: Record<string, string> } | null)?.checks ?? {};
  const all = live.data?.ok && ready.data?.ok;
  const loading = live.isPending || ready.isPending;

  const rows: [string, boolean | undefined, string][] = [
    [
      "Engine (liveness)",
      live.data?.ok,
      live.data ? `HTTP ${live.data.status || "no response"} · ${live.data.ms} ms` : "checking…",
    ],
    [
      "Engine (readiness)",
      ready.data?.ok,
      ready.data ? `HTTP ${ready.data.status || "no response"} · ${ready.data.ms} ms` : "checking…",
    ],
    ...Object.entries(checks).map(([k, v]): [string, boolean, string] => [
      k === "database" ? "Database" : k === "providers" ? "Payout provider catalogue" : k,
      v === "ok",
      v,
    ]),
  ];

  return (
    <PublicPage
      kicker="System status"
      title={
        loading ? (
          "Checking…"
        ) : all ? (
          <>
            All systems <em>operational</em>.
          </>
        ) : (
          <>
            Something is <em>not right</em>.
          </>
        )
      }
      lead="These checks run from your browser against the live engine and refresh every 30 seconds. They report only what this deployment can see about itself."
    >
      <Section id="checks" title="Current checks">
        <div
          aria-live="polite"
          className="divide-y divide-border border border-border bg-card text-foreground"
        >
          {rows.map(([name, ok, detail]) => (
            <div key={name} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`size-3 border-2 border-foreground ${ok ? "bg-foreground" : ok === undefined ? "border-dashed" : "bg-[repeating-linear-gradient(135deg,var(--color-foreground)_0_2px,transparent_2px_5px)]"}`}
                />
                <span className="text-sm">{name}</span>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                <span className="sr-only">
                  {ok ? "OK. " : ok === undefined ? "Checking. " : "Failing. "}
                </span>
                {detail}
              </span>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-none font-mono text-xs uppercase"
          onClick={() => {
            void live.refetch();
            void ready.refetch();
            void config.refetch();
          }}
        >
          <RefreshCw className="mr-2 size-3.5" aria-hidden="true" />
          Re-check now
        </Button>
      </Section>
      <Section id="deployment" title="This deployment">
        {config.data ? (
          <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {[
              ["Environment", config.data.environment],
              ["API version", config.data.api_version],
              ["Markets", String(config.data.countries.length)],
              ["Corridors", String(config.data.corridor_count)],
              [
                "On-chain escrow",
                config.data.chain.enabled
                  ? `enabled · chain ${config.data.chain.chain_id}`
                  : "disabled",
              ],
              ["Rates", config.data.rate_convention],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-4 border-b border-border py-2 text-sm"
              >
                <dt>{k}</dt>
                <dd className="font-mono text-xs text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>{config.isError ? "The engine could not be reached." : "Loading…"}</p>
        )}
        <p className="text-xs">
          Historical uptime and incident reporting are not yet published; this page is a live probe,
          not a service-level commitment.
        </p>
      </Section>
    </PublicPage>
  );
}
