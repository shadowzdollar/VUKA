import { useQuery } from "@tanstack/react-query";
import { geoCentroid, geoNaturalEarth1, geoPath } from "d3-geo";
import { useMemo, useState } from "react";
import { platform } from "@/lib/api/endpoints";
import type { PublicCountry } from "@/lib/api/types";
import { corridorFeeBps, DIAL, REGION_NAMES } from "@/lib/markets";
import { cn } from "@/lib/utils";
import { useDataSaver } from "./data-saver";
import { Flag, FlagArt, FlagCloth } from "./flags";
import { AFRICA, ATLAS_ID, byId, countries, type Feat } from "./geo";
import { Reveal } from "./reveal";
import { Tilt } from "./tilt";

const W = 600;
const H = 640;

/** A circular passport stamp: the flag in the centre, the country and currency set around the rim. */
function Stamp({ m, active, tilt }: { m: PublicCountry; active: boolean; tilt: number }) {
  const id = `ring-${m.code}`;
  const r = 41;
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-full overflow-visible"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path
          id={id}
          d={`M50 50 m-${r} 0 a${r} ${r} 0 1 1 ${2 * r} 0 a${r} ${r} 0 1 1 -${2 * r} 0`}
        />
        <clipPath id={`${id}-clip`}>
          <circle cx="50" cy="50" r="27" />
        </clipPath>
      </defs>
      <g
        transform={`rotate(${tilt} 50 50)`}
        className={cn(active && "stamp-in")}
        key={active ? "on" : "off"}
      >
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
        <text
          fontSize="7.6"
          letterSpacing="1.4"
          fill="currentColor"
          fontFamily="var(--font-mono, monospace)"
        >
          <textPath
            href={`#${id}`}
            startOffset="0"
          >{`${m.name.toUpperCase()} · ${m.currency} · ${m.code} ·`}</textPath>
        </text>
        <g
          clipPath={`url(#${id}-clip)`}
          className={cn("transition-[filter] duration-300", active ? "" : "grayscale contrast-125")}
        >
          <g transform={`translate(${50 - 27 * 1.5} ${50 - 27}) scale(${(54 / 600).toFixed(4)})`}>
            <FlagArt code={m.code} id={`stamp-${m.code}`} />
          </g>
        </g>
      </g>
    </svg>
  );
}

const TILTS = [-6, 4, -3, 7, -5, 2, -7, 5, -2, 6];

export function Atlas() {
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });
  const saver = useDataSaver();
  const markets = useMemo(() => config.data?.countries ?? [], [config.data]);
  const [picked, setPicked] = useState("KE");
  const [hover, setHover] = useState<string | null>(null);
  const activeCode = hover ?? picked;
  const active = markets.find((m) => m.code === activeCode) ?? markets[0];

  const scene = useMemo(() => {
    const africa = countries.filter((f) => AFRICA.has(String(f.id)));
    const proj = geoNaturalEarth1().fitExtent(
      [
        [6, 6],
        [W - 6, H - 6],
      ],
      { type: "FeatureCollection", features: africa } as never,
    );
    const path = geoPath(proj);
    const idToCode = new Map(Object.entries(ATLAS_ID).map(([c, id]) => [id, c]));
    const shapes = africa.map((f) => ({
      id: String(f.id),
      d: path(f as never) ?? "",
      code: idToCode.get(String(f.id)),
      f,
    }));
    const pins = Object.entries(ATLAS_ID).map(([code, id]) => {
      const f = byId.get(id) as Feat | undefined;
      const c = f ? proj(geoCentroid(f as never) as [number, number]) : null;
      const b = f ? path.bounds(f as never) : null;
      return { code, at: c, bounds: b };
    });
    return { shapes, pins };
  }, []);

  const same = markets.filter(
    (m) => active && m.code !== active.code && m.region === active.region,
  );
  const other = markets.filter(
    (m) => active && m.code !== active.code && m.region !== active.region,
  );
  const pinSide: Record<string, 1 | -1> = { RW: -1, GH: -1, SN: -1, TZ: 1 };

  return (
    <section id="atlas" className="scroll-mt-20 overflow-hidden border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
        <Reveal>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            The atlas of markets
          </div>
          <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            Ten flags, one ledger.
          </h2>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            Each launch market is cut from the map in its own colours. Pick one to see its payout
            rail, its dialling code, and which corridors sit in the same fee group.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <Reveal>
            {saver ? (
              <div className="flex h-[420px] items-center justify-center border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Map hidden while data saver is on. The passport stamps below still work.
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="mx-auto h-auto w-full max-w-[560px] text-foreground"
                aria-hidden="true"
                focusable="false"
              >
                <defs>
                  <pattern
                    id="atlas-hatch"
                    width="6"
                    height="6"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <rect width="6" height="6" style={{ fill: "var(--color-card)" }} />
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="6"
                      stroke="currentColor"
                      strokeOpacity="0.55"
                      strokeWidth="1"
                    />
                  </pattern>
                  {scene.shapes
                    .filter((s) => s.code)
                    .map((s) => (
                      <clipPath key={s.id} id={`atlas-clip-${s.code}`}>
                        <path d={s.d} />
                      </clipPath>
                    ))}
                </defs>
                {scene.shapes
                  .filter((s) => !s.code)
                  .map((s) => (
                    <path
                      key={s.id}
                      d={s.d}
                      fill="url(#atlas-hatch)"
                      style={{ stroke: "var(--color-foreground)", strokeOpacity: 0.4 }}
                      strokeWidth="0.6"
                    />
                  ))}
                {/* Launch markets: flag-printed cut-outs; the chosen one is lifted off the page. */}
                {scene.shapes
                  .filter((s) => s.code)
                  .sort((a, b) => Number(a.code === activeCode) - Number(b.code === activeCode))
                  .map((s) => {
                    const code = s.code!;
                    const b = scene.pins.find((p) => p.code === code)?.bounds;
                    const on = code === activeCode;
                    const w = b ? b[1][0] - b[0][0] : 0;
                    const h = b ? b[1][1] - b[0][1] : 0;
                    const k = b ? Math.max(w / 900, h / 600) : 0;
                    const dim =
                      markets.length > 0 &&
                      active &&
                      !on &&
                      markets.find((m) => m.code === code)?.region !== active.region;
                    return (
                      <g
                        key={s.id}
                        style={{
                          transform: on ? "translate(-2px,-5px)" : undefined,
                          transition: "transform .25s ease, filter .25s ease, opacity .25s",
                          filter: on
                            ? "drop-shadow(0 8px 6px rgba(0,0,0,.45))"
                            : "drop-shadow(0 2px 1.5px rgba(0,0,0,.35))",
                          opacity: dim ? 0.72 : 1,
                          cursor: "pointer",
                        }}
                        onPointerEnter={() => setHover(code)}
                        onPointerLeave={() => setHover(null)}
                        onClick={() => setPicked(code)}
                      >
                        <g clipPath={`url(#atlas-clip-${code})`}>
                          {b ? (
                            <g
                              transform={`translate(${b[0][0] + w / 2 - 450 * k} ${b[0][1] + h / 2 - 300 * k}) scale(${k})`}
                            >
                              <FlagArt code={code} id={`atlas-${code}`} />
                            </g>
                          ) : null}
                        </g>
                        <path
                          d={s.d}
                          fill="none"
                          style={{
                            stroke: on ? "var(--color-foreground)" : "var(--color-background)",
                          }}
                          strokeWidth={on ? 1.8 : 0.9}
                        />
                      </g>
                    );
                  })}
                {/* Planted flag pins, so the small markets stay legible. */}
                {scene.pins.map((p, i) => {
                  if (!p.at) return null;
                  const on = p.code === activeCode;
                  const side = pinSide[p.code] ?? 1;
                  const [x, y] = p.at;
                  const s = on ? 1.3 : 1;
                  return (
                    <g
                      key={p.code}
                      transform={`translate(${x} ${y}) scale(${s})`}
                      style={{ pointerEvents: "none", transition: "transform .25s" }}
                    >
                      <ellipse cx="0" cy="1" rx="4" ry="1.5" fill="rgba(0,0,0,.35)" />
                      <line x1="0" y1="0" x2="0" y2="-30" stroke="currentColor" strokeWidth="1.4" />
                      <g
                        className="sway"
                        style={{ transformOrigin: "0 -30px", animationDelay: `${i * -0.6}s` }}
                      >
                        <g transform={`translate(${side === 1 ? 0 : -27} -30) scale(${27 / 900})`}>
                          <rect width="900" height="600" fill="none" />
                          <FlagArt code={p.code} id={`pin-${p.code}`} />
                          <rect
                            width="900"
                            height="600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="24"
                          />
                        </g>
                      </g>
                      <circle cx="0" cy="-30" r="1.8" fill="currentColor" />
                    </g>
                  );
                })}
              </svg>
            )}
          </Reveal>

          <Reveal delay={100}>
            {active ? (
              <Tilt max={4} className="w-full">
                <div className="border border-border bg-card p-5 sm:p-6" aria-live="polite">
                  <div className="flex items-start gap-5">
                    <FlagCloth
                      code={active.code}
                      label={`Flag of ${active.name}`}
                      className="w-40 shrink-0 sm:w-48"
                    />
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Visa page · {active.code}
                      </div>
                      <h3 className="mt-1 font-display text-4xl leading-none">{active.name}</h3>
                      <dl className="mt-4 space-y-1.5 font-mono text-xs">
                        <div className="flex gap-3">
                          <dt className="w-16 text-muted-foreground">Currency</dt>
                          <dd>{active.currency}</dd>
                        </div>
                        <div className="flex gap-3">
                          <dt className="w-16 text-muted-foreground">Dial</dt>
                          <dd>+{DIAL[active.code] ?? ""}</dd>
                        </div>
                        <div className="flex gap-3">
                          <dt className="w-16 shrink-0 text-muted-foreground">Rail</dt>
                          <dd className="min-w-0">{active.provider_name}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-dashed border-border pt-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Fee group · {REGION_NAMES[active.region] ?? active.region}
                    </div>
                    <FeeRow
                      title={`Inside the group · ${(corridorFeeBps(active.region, active.region) / 100).toFixed(2)}%`}
                      list={same}
                      empty="No other launch market shares this group yet."
                    />
                    <FeeRow
                      title={`Across groups · ${(corridorFeeBps("a", "b") / 100).toFixed(2)}%`}
                      list={other}
                    />
                  </div>
                  <p className="mt-4 text-[11px] text-muted-foreground">
                    Fee tiers as configured in the engine; indicative and shown before any payment
                    is committed.
                  </p>
                </div>
              </Tilt>
            ) : (
              <div className="h-72 animate-pulse border border-border bg-card" />
            )}
          </Reveal>
        </div>

        <Reveal className="mt-14">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-2xl">The passport</h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Choose a market
            </span>
          </div>
          <div
            role="radiogroup"
            aria-label="Market"
            className="mt-4 grid grid-cols-5 gap-2 border border-border bg-card p-3 sm:gap-4 sm:p-5 lg:grid-cols-10"
          >
            {markets.map((m, i) => (
              <button
                key={m.code}
                type="button"
                role="radio"
                aria-checked={picked === m.code}
                aria-label={`${m.name}, ${m.currency}`}
                onClick={() => setPicked(m.code)}
                onMouseEnter={() => setHover(m.code)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(m.code)}
                onBlur={() => setHover(null)}
                className={cn(
                  "aspect-square text-muted-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
                  picked === m.code && "text-foreground",
                )}
              >
                <Stamp m={m} active={picked === m.code} tilt={TILTS[i % TILTS.length] ?? 0} />
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FeeRow({ title, list, empty }: { title: string; list: PublicCountry[]; empty?: string }) {
  return (
    <div className="mt-3">
      <div className="text-xs">{title}</div>
      {list.length ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {list.map((m) => (
            <li
              key={m.code}
              className="flex items-center gap-1.5 border border-border py-1 pl-1 pr-2 text-[11px]"
            >
              <Flag code={m.code} className="w-5 shrink-0" />
              {m.name}
            </li>
          ))}
        </ul>
      ) : empty ? (
        <p className="mt-1 text-xs text-muted-foreground">{empty}</p>
      ) : null}
    </div>
  );
}
