import { useQuery } from "@tanstack/react-query";
import { Check, Share2, Signal, SignalLow, Smartphone } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api/client";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { setDataSaver, useDataSaver } from "./data-saver";
import { Reveal } from "./reveal";

const TABS = [
  {
    id: "hold",
    label: "Hold to confirm",
    h: "A confirmation you cannot fat-finger.",
    b: "Releasing escrow is the one tap that moves money for good, so on a phone it takes a deliberate press-and-hold. A stray tap in a crowded market does nothing.",
  },
  {
    id: "signal",
    label: "Weak signal",
    h: "Bad network, one payment.",
    b: "Every payment carries an idempotency key. If the connection drops and the app retries, the engine recognises the key and returns the first result instead of paying twice.",
  },
  {
    id: "ussd",
    label: "Feature phone",
    h: "Not everyone has a smartphone.",
    b: "A USSD menu would let a feature phone check balances, send within limits and confirm delivery over a plain dial code. This is a working concept using the live pricing engine — the channel itself needs a telecom shortcode agreement.",
  },
  {
    id: "share",
    label: "Share & install",
    h: "Send it where trade already happens.",
    b: "Share a quote or receipt straight into WhatsApp or SMS from the phone's own share sheet, and add VUKA to the home screen so it opens like an app.",
  },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function MobileSection() {
  const [tab, setTab] = useState<TabId>("hold");
  const t = TABS.find((x) => x.id === tab)!;
  return (
    <section id="mobile" className="scroll-mt-20 overflow-x-clip border-t border-border">
      <div className="mx-auto px-4 py-20 sm:px-6 lg:px-10 2xl:px-16">
        <Reveal>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            In your pocket
          </div>
          <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            Built for the phone you actually have, on the network you actually get.
          </h2>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            Most SME trade here happens on a phone — often on patchy data, sometimes on a feature
            phone. These four interactions are live: try them on the handset.
          </p>
        </Reveal>

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[1fr_auto]">
          <div>
            <div
              role="tablist"
              aria-label="Mobile features"
              className="grid grid-cols-2 gap-1.5 sm:grid-cols-4"
            >
              {TABS.map((x, n) => (
                <button
                  key={x.id}
                  role="tab"
                  id={`mob-tab-${x.id}`}
                  aria-selected={tab === x.id}
                  aria-controls="mob-panel"
                  tabIndex={tab === x.id ? 0 : -1}
                  onClick={() => setTab(x.id)}
                  onKeyDown={(e) => {
                    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                    if (!d) return;
                    const next = TABS[(n + d + TABS.length) % TABS.length]!;
                    setTab(next.id);
                    document.getElementById(`mob-tab-${next.id}`)?.focus();
                  }}
                  className={cn(
                    "border px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
                    tab === x.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <span className="mb-1 block opacity-60">{String(n + 1).padStart(2, "0")}</span>
                  {x.label}
                </button>
              ))}
            </div>
            <div
              id="mob-panel"
              role="tabpanel"
              aria-labelledby={`mob-tab-${tab}`}
              tabIndex={0}
              className="mt-8 min-h-[190px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <h3 className="font-display text-3xl leading-snug">{t.h}</h3>
              <p className="mt-4 max-w-lg text-muted-foreground">{t.b}</p>
            </div>
            <DataMeter />
          </div>

          <Phone>
            {tab === "hold" ? (
              <HoldScreen />
            ) : tab === "signal" ? (
              <SignalScreen />
            ) : tab === "ussd" ? (
              <UssdScreen />
            ) : (
              <ShareScreen />
            )}
          </Phone>
        </div>
      </div>
    </section>
  );
}

/* ---- The handset: CSS-3D, tilts with the pointer, or with the phone itself when you opt in ---------- */

function Phone({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gyro, setGyro] = useState<"off" | "on" | "unavailable">("off");
  const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const apply = (x: number, y: number) => {
    if (ref.current && !still()) ref.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
  };
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    apply(
      ((e.clientX - r.left) / r.width - 0.5) * 22,
      -((e.clientY - r.top) / r.height - 0.5) * 16,
    );
  };

  useEffect(() => {
    if (gyro !== "on") return;
    const h = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      apply(
        Math.max(-18, Math.min(18, e.gamma / 2.5)),
        Math.max(-14, Math.min(14, -(e.beta - 50) / 3)),
      );
    };
    window.addEventListener("deviceorientation", h);
    return () => window.removeEventListener("deviceorientation", h);
  }, [gyro]);

  async function enableGyro() {
    const D = window.DeviceOrientationEvent as unknown as
      { requestPermission?: () => Promise<string> } | undefined;
    if (!D) return setGyro("unavailable");
    try {
      if (typeof D.requestPermission === "function" && (await D.requestPermission()) !== "granted")
        return setGyro("unavailable");
      setGyro("on");
    } catch {
      setGyro("unavailable");
    }
  }
  const canGyro =
    typeof window !== "undefined" &&
    "DeviceOrientationEvent" in window &&
    window.matchMedia("(pointer: coarse)").matches;

  return (
    <div className="mx-auto">
      <div
        className="stage-3d px-6 py-8"
        onPointerMove={onMove}
        onPointerLeave={() => apply(-8, 3)}
      >
        <div
          ref={ref}
          className="layer-3d relative w-[272px] transition-transform duration-150 ease-out"
          style={{ transform: "rotateY(-8deg) rotateX(3deg)" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-4 bg-foreground/10 [border-radius:2.6rem]"
            style={{ transform: "translateZ(-30px) translate(14px,18px)" }}
          />
          <div className="relative border-[3px] border-foreground bg-background p-2 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] [border-radius:2.6rem]">
            <div className="relative h-[540px] overflow-hidden border border-border bg-background [border-radius:2rem]">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-foreground"
              />
              <div className="flex h-full flex-col pt-8">{children}</div>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute -top-4 right-6 hidden border border-foreground bg-background px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] sm:block"
            style={{ transform: "translateZ(60px)" }}
          >
            SMS receipt ✓
          </div>
          <div
            aria-hidden="true"
            className="absolute -bottom-4 left-6 hidden border border-foreground bg-foreground px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-background sm:block"
            style={{ transform: "translateZ(80px)" }}
          >
            Idempotent
          </div>
        </div>
      </div>
      {canGyro ? (
        <button
          type="button"
          onClick={() => void enableGyro()}
          className="mx-auto mt-3 flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] hover:bg-accent"
        >
          <Smartphone className="size-3.5" aria-hidden="true" />
          {gyro === "on"
            ? "Tilting with your phone"
            : gyro === "unavailable"
              ? "Motion not available"
              : "Tilt with your phone"}
        </button>
      ) : null}
    </div>
  );
}

const ScreenHead = ({ title, right }: { title: string; right?: ReactNode }) => (
  <div className="flex items-center justify-between border-b border-border px-4 pb-2 pt-1.5">
    <span className="text-[13px] font-semibold tracking-[0.3em]">VUKA</span>
    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
      {right ?? title}
    </span>
  </div>
);

/* ---- 1. Press-and-hold confirmation ----------------------------------------------------------------- */

const HOLD_MS = 1200;
const R = 44;
const C = 2 * Math.PI * R;

function HoldScreen() {
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const finish = useCallback(() => {
    setHolding(false);
    setDone(true);
    try {
      navigator.vibrate?.([30, 40, 30]);
    } catch {
      /* haptics are optional */
    }
  }, []);
  const start = () => {
    if (done) return;
    setHolding(true);
    timer.current = window.setTimeout(finish, HOLD_MS);
  };
  const cancel = () => {
    window.clearTimeout(timer.current);
    if (!done) setHolding(false);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <>
      <ScreenHead title="Escrow" />
      <div className="flex-1 space-y-3 overflow-hidden p-4">
        <div className="border border-border p-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            Invoice #0412
          </div>
          <div className="mt-1 font-display text-lg leading-tight">Maize flour · 40 t</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Held in escrow · RWF 18,400,000
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Goods arrived as agreed? Confirming releases the money to the supplier.
        </p>
        <div className="flex flex-col items-center pt-2">
          <button
            type="button"
            aria-label={done ? "Delivery confirmed" : "Press and hold to confirm delivery"}
            aria-describedby="hold-help"
            disabled={done}
            onPointerDown={start}
            onPointerUp={cancel}
            onPointerLeave={cancel}
            onPointerCancel={cancel}
            onKeyDown={(e) => {
              if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                e.preventDefault();
                start();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === " " || e.key === "Enter") cancel();
            }}
            onClick={(e) => {
              if (e.detail === 0 && !done) finish();
            }} // assistive tech activates with a plain click
            onContextMenu={(e) => e.preventDefault()}
            className="relative grid size-[112px] touch-none select-none place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.2"
                strokeWidth="5"
              />
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeDasharray={C}
                strokeDashoffset={holding || done ? 0 : C}
                style={{
                  transition: holding
                    ? `stroke-dashoffset ${HOLD_MS}ms linear`
                    : done
                      ? "none"
                      : "stroke-dashoffset 250ms ease-out",
                }}
              />
            </svg>
            <span
              className={cn(
                "grid size-[76px] place-items-center rounded-full font-mono text-[10px] uppercase tracking-[0.12em] transition-all",
                done
                  ? "bg-foreground text-background"
                  : holding
                    ? "scale-95 bg-foreground/90 text-background"
                    : "border border-foreground",
              )}
            >
              {done ? (
                <Check className="size-6" aria-hidden="true" />
              ) : holding ? (
                "Keep holding"
              ) : (
                "Hold"
              )}
            </span>
          </button>
          <p id="hold-help" className="mt-3 text-center text-[11px] text-muted-foreground">
            {done
              ? "Released to the supplier. An SMS receipt is on its way."
              : "Press and hold for 1.2 seconds. Keyboard: hold Enter."}
          </p>
          {done ? (
            <button
              type="button"
              onClick={() => setDone(false)}
              className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] underline underline-offset-4"
            >
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ---- 2. Weak signal + idempotency ------------------------------------------------------------------- */

function SignalScreen() {
  const [weak, setWeak] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "sending" | "done">("idle");
  const [key] = useState(() => "idem_" + Math.random().toString(16).slice(2, 8));
  const timers = useRef<number[]>([]);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  function send() {
    clear();
    setPhase("sending");
    const after = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    const push = (l: string) => setLog((x) => [...x, l]);
    setLog([`POST /transfers · ${key}`]);
    if (!weak) {
      after(500, () => {
        push("200 · posted");
        setPhase("done");
      });
      return;
    }
    after(900, () => push("… no response (timeout)"));
    after(1300, () => push(`retry 1 · same ${key}`));
    after(2200, () => push("… no response (timeout)"));
    after(2600, () => push(`retry 2 · same ${key}`));
    after(3300, () => {
      push("200 · original result returned");
      setPhase("done");
    });
  }

  return (
    <>
      <ScreenHead
        title="Send"
        right={
          weak ? (
            <span className="inline-flex items-center gap-1">
              <SignalLow className="size-3" aria-hidden="true" />
              weak
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Signal className="size-3" aria-hidden="true" />
              good
            </span>
          )
        }
      />
      <div className="flex-1 space-y-3 overflow-hidden p-4">
        <div className="border border-border p-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">To</span>
            <span>Supplier · Nairobi</span>
          </div>
          <div className="mt-1 font-display text-2xl">RWF 100,000</div>
        </div>
        <label className="flex items-center justify-between border border-border p-2.5 text-xs">
          <span>Simulate weak network</span>
          <input
            type="checkbox"
            role="switch"
            checked={weak}
            onChange={(e) => {
              setWeak(e.target.checked);
              setPhase("idle");
              setLog([]);
              clear();
            }}
            className="size-4 accent-[var(--color-foreground)]"
          />
        </label>
        <button
          type="button"
          onClick={send}
          disabled={phase === "sending"}
          className="w-full bg-foreground py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-background disabled:opacity-60"
        >
          {phase === "sending" ? "Sending…" : phase === "done" ? "Send again" : "Send payment"}
        </button>
        <div
          aria-live="polite"
          className="min-h-[150px] border border-dashed border-border p-2.5 font-mono text-[10px] leading-relaxed"
        >
          {log.length ? (
            log.map((l, i) => (
              <div
                key={i}
                className={l.startsWith("200") ? "font-semibold" : "text-muted-foreground"}
              >
                {l}
              </div>
            ))
          ) : (
            <span className="text-muted-foreground">
              Tap send. With a weak network the app retries on its own.
            </span>
          )}
          {phase === "done" && weak ? (
            <div className="mt-2 border-t border-border pt-2">
              Result: <strong>1 payment</strong>, 2 retries recognised. Nobody was charged twice.
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ---- 3. USSD concept (live pricing) ------------------------------------------------------------------ */

interface Est {
  fee: number;
  delivered: number;
  from: string;
  to: string;
  amount: number;
}
const PLACEHOLDER_CODE = "*000#";

function UssdScreen() {
  const [path, setPath] = useState<string[]>([]);
  const key = path.join(".");
  const [to, amt] = [path[1], path[2]];
  const dest = { "1": "KES", "2": "UGX", "3": "GHS" }[to ?? ""];
  const amount = { "1": 10000, "2": 50000, "3": 100000 }[amt ?? ""];
  const quote = useQuery({
    queryKey: ["ussd-quote", dest, amount],
    queryFn: () =>
      api.get<Est>("/api/public/estimate", { from: "RWF", to: dest ?? "", amount: amount ?? 0 }),
    enabled: path[0] === "2" && !!dest && !!amount,
    retry: false,
    staleTime: 30_000,
  });

  const text = (() => {
    const q = quote.data;
    switch (key) {
      case "":
        return "VUKA\n1 Balance\n2 Send money\n3 Confirm delivery\n4 Trust score\n0 Exit";
      case "1":
        return "Business wallet\nRWF 1,240,500\nPersonal wallet\nRWF 86,200\n\n0 Back";
      case "2":
        return "Send to\n1 Kenya (KES)\n2 Uganda (UGX)\n3 Ghana (GHS)\n\n0 Back";
      case "3":
        return "Awaiting you\n1 Maize flour 40t\n   RWF 18.4M\n\n0 Back";
      case "3.1":
        return "Goods received?\n1 Yes, release\n2 Dispute\n\n0 Back";
      case "3.1.1":
        return "Released to supplier.\nSMS receipt sent.\n\n0 Menu";
      case "3.1.2":
        return "Dispute opened.\nAn arbiter will\ncontact you.\n\n0 Menu";
      case "4":
        return "Trust score\n742 · Strong\n(illustrative)\n\n0 Back";
      case "0":
        return "Session ended.";
      default:
        if (path[0] === "2" && path.length === 2 && dest)
          return `Amount (RWF)\n1 10,000\n2 50,000\n3 100,000\n\n0 Back`;
        if (path[0] === "2" && path.length === 3 && dest && amount)
          return quote.isPending
            ? "Pricing…"
            : quote.isError || !q
              ? "Amount outside\ncorridor limits.\n\n0 Back"
              : `Fee ${money(q.fee, "RWF")}\nThey get\n${money(q.delivered, q.to)}\nIndicative.\n1 Lock quote\n0 Cancel`;
        if (path[0] === "2" && path.length === 4 && dest && amount && path[3] === "1")
          return "Quote locked 10 min.\nApprove in the app.\nSandbox: no money\nmoved.\n\n0 Menu";
        return "Invalid choice.\n\n0 Back";
    }
  })();

  const terminal =
    key === "3.1.1" || key === "3.1.2" || (path[0] === "2" && path.length === 4 && path[3] === "1");
  const press = (d: string) => {
    if (key === "0") return setPath([]);
    if (d === "0") return setPath(path.length === 0 ? ["0"] : terminal ? [] : path.slice(0, -1));
    setPath([...path, d]);
  };
  const exit = path.length === 0;

  return (
    <div
      className="flex h-full flex-col bg-muted/40"
      onKeyDown={(e) => {
        if (/^\d$/.test(e.key)) press(e.key);
      }}
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        <span>Dial</span>
        <span>{PLACEHOLDER_CODE} · placeholder</span>
      </div>
      <div
        role="status"
        aria-live="polite"
        className="mx-3 min-h-[178px] whitespace-pre-line border border-foreground bg-background p-3 font-mono text-[12px] leading-snug"
      >
        {text}
      </div>
      <p className="px-4 pt-2 text-[10px] text-muted-foreground">
        {exit ? "Tap a number to reply." : "Reply with a number. 0 goes back."}
      </p>
      <div className="mt-auto grid grid-cols-3 gap-1.5 p-3" role="group" aria-label="Keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((d) => (
          <button
            key={d}
            type="button"
            disabled={d === "*" || d === "#"}
            onClick={() => press(d)}
            className="border border-border bg-background py-2.5 font-mono text-sm hover:bg-accent disabled:opacity-40"
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- 4. Share sheet + install ------------------------------------------------------------------------ */

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
}

function ShareScreen() {
  const [msg, setMsg] = useState("");
  const [install, setInstall] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  const text =
    "VUKA receipt (sandbox): RWF 500,000 sent · fee 0.80% · KES 46,100 delivered · escrow released.";
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "VUKA receipt", text });
        setMsg("Shared");
      } else {
        await navigator.clipboard.writeText(text);
        setMsg("Copied to clipboard");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setMsg("Could not share on this device");
    }
  }
  return (
    <>
      <ScreenHead title="Receipt" />
      <div className="flex-1 space-y-3 overflow-hidden p-4">
        <div className="border border-border p-3 font-mono text-[11px]">
          <div className="flex justify-between border-b border-dashed border-border pb-1.5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>Settlement receipt</span>
            <span>Sandbox</span>
          </div>
          <dl className="mt-2 space-y-1">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Sent</dt>
              <dd>RWF 500,000</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Fee · 0.80%</dt>
              <dd>RWF 4,000</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Escrow</dt>
              <dd>Released ✓</dd>
            </div>
          </dl>
          <div className="mt-2 flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
            <span>Delivered</span>
            <span className="font-display text-xl">KES 46,100</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void share()}
          className="flex w-full items-center justify-center gap-2 bg-foreground py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-background"
        >
          <Share2 className="size-3.5" aria-hidden="true" />
          Share receipt
        </button>
        <div role="status" className="h-4 text-center font-mono text-[10px]">
          {msg}
        </div>
        <div className="border border-dashed border-border p-3 text-[11px]">
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            Add to home screen
          </div>
          {install ? (
            <button
              type="button"
              onClick={() => void install.prompt()}
              className="mt-2 w-full border border-foreground py-2 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-accent"
            >
              Install VUKA
            </button>
          ) : (
            <p className="mt-1 text-muted-foreground">
              Open your browser menu and choose{" "}
              <strong className="text-foreground">Add to Home screen</strong>. VUKA then opens
              full-screen, like an app.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

/* ---- Light-on-data meter + data saver ------------------------------------------------------------------ */

function DataMeter() {
  const saver = useDataSaver();
  const [kb, setKb] = useState<number | null>(null);
  useEffect(() => {
    const measure = () => {
      const nav = performance.getEntriesByType("navigation")[0] as
        PerformanceNavigationTiming | undefined;
      const res = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const bytes = (nav?.transferSize ?? 0) + res.reduce((a, r) => a + (r.transferSize || 0), 0);
      setKb(bytes > 0 ? Math.round(bytes / 1024) : null);
    };
    measure();
    const id = window.setInterval(measure, 2500);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="mt-8 border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Light on data
          </div>
          <p className="mt-1 text-sm">
            This page has transferred{" "}
            <strong className="tabular font-mono">
              {kb === null ? "…" : kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`}
            </strong>{" "}
            so far{" "}
            <span className="text-muted-foreground">
              (measured in your browser; development builds are larger than production)
            </span>
            .
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            role="switch"
            checked={saver}
            onChange={(e) => setDataSaver(e.target.checked)}
            className="size-4 accent-[var(--color-foreground)]"
          />
          Data saver
        </label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Data saver skips the interactive globe and its map data. It turns on automatically if your
        browser sends a Save-Data hint.
      </p>
    </div>
  );
}
