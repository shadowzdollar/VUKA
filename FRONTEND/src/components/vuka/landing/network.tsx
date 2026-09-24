import { useQuery } from "@tanstack/react-query";
import { Coffee, Cpu, Factory, HardHat, Landmark, Shirt, Store, Truck, Wheat } from "lucide-react";
import { platform } from "@/lib/api/endpoints";
import { CENTRAL_BANKS } from "@/lib/markets";
import { Flag } from "./flags";
import { Reveal } from "./reveal";

/**
 * Replaces decorative flag bunting with two factual, static galleries: the regulator each launch
 * market answers to, and the kinds of businesses the network is built for. No third-party logos or
 * seals are reproduced here — see the independence note below each gallery for why.
 */

const SECTORS: { icon: typeof Wheat; label: string; note: string }[] = [
  { icon: Wheat, label: "Agriculture & grain", note: "Maize, coffee cherry, grain wholesalers" },
  { icon: Coffee, label: "Coffee & beverages", note: "Cooperatives shipping green coffee" },
  { icon: Shirt, label: "Textiles & garments", note: "Fabric importers, garment makers" },
  { icon: Store, label: "Wholesale & retail", note: "Cross-border stock buyers" },
  { icon: Truck, label: "Logistics & freight", note: "Haulage and customs agents" },
  { icon: Factory, label: "Manufacturing", note: "Parts, packaging, light industry" },
  { icon: HardHat, label: "Construction materials", note: "Cement, steel, hardware" },
  { icon: Cpu, label: "Electronics & hardware", note: "Devices, components, spares" },
];

export function NetworkGallery() {
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });
  const markets = config.data?.countries ?? [];

  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            The network in view
          </div>
          <h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight sm:text-4xl">
            Real regulators. Real trades. No logos we haven&apos;t earned the right to use.
          </h2>
        </Reveal>

        <div className="mt-10 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
          <Reveal>
            <div className="flex h-full min-w-0 flex-col border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <Landmark className="size-4" aria-hidden="true" />
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Regulatory landscape, by market
                </h3>
              </div>
              <ul className="min-w-0 divide-y divide-border">
                {markets.length
                  ? markets.map((m) => (
                      <li
                        key={m.code}
                        className="flex min-w-0 items-center gap-2 px-4 py-2.5 text-sm sm:gap-3 sm:px-5"
                      >
                        <Flag code={m.code} className="w-6 shrink-0 border border-border" />
                        <span className="w-16 shrink-0 truncate font-medium sm:w-28">{m.name}</span>
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">
                          {CENTRAL_BANKS[m.code] ?? "—"}
                        </span>
                      </li>
                    ))
                  : Array.from({ length: 10 }, (_, i) => (
                      <li key={i} className="h-10 animate-pulse bg-muted/40" />
                    ))}
              </ul>
              <p className="mt-auto border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
                Named for information only. VUKA holds no licence, partnership or endorsement from
                any institution listed here — see{" "}
                <a href="#faq" className="underline underline-offset-4">
                  the FAQ
                </a>
                .
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex h-full min-w-0 flex-col border border-border bg-card">
              <div className="border-b border-border px-5 py-3">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Businesses the network is built for
                </h3>
              </div>
              <div className="grid flex-1 grid-cols-2 sm:grid-cols-4">
                {SECTORS.map(({ icon: Icon, label, note }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-2 border-l border-t border-border p-4"
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    <div className="text-sm font-medium leading-tight">{label}</div>
                    <div className="text-xs text-muted-foreground">{note}</div>
                  </div>
                ))}
              </div>
              <p className="border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
                Illustrative categories, not customer logos — see{" "}
                <span className="text-foreground">Illustrative stories</span> below for how a trade
                in each looks end to end.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
