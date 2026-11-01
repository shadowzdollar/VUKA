import { useEffect, useState, type ReactNode } from "react";
import { VukaMark } from "@/components/vuka/brand";
import { cn } from "@/lib/utils";

const BOOT_STAGES = [
  "MOUNTING DOUBLE-ENTRY LEDGER KERNEL",
  "SYNCHRONIZING 10 AFRICAN CORRIDOR RAILS",
  "ATTESTING POLYGON ESCROW READ MODEL",
  "VUKA SETTLEMENT MESH ONLINE",
] as const;

const ORBIT_HUBS = [
  { code: "KGL", angle: 0 },
  { code: "NBO", angle: 60 },
  { code: "LOS", angle: 120 },
  { code: "JNB", angle: 180 },
  { code: "ACC", angle: 240 },
  { code: "DAR", angle: 300 },
] as const;

const SESSION_PRELOAD_KEY = "vuka.preload.seen.v2";

/**
 * Reusable core visual for both the first-visit site preloader and the in-app session Splash screen.
 */
export function VukaPreloadCanvas({
  progress = 78,
  stageText,
  children,
  onSkip,
}: {
  progress?: number;
  stageText?: string;
  children?: ReactNode;
  onSkip?: () => void;
}) {
  const stageIdx = Math.min(
    BOOT_STAGES.length - 1,
    Math.floor((progress / 100) * BOOT_STAGES.length),
  );
  const activeStage = stageText ?? BOOT_STAGES[stageIdx];

  return (
    <div
      onClick={onSkip}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#0b0b0b] px-4 text-white select-none"
    >
      {/* Keyframes for orbital rings and laser scan */}
      <style>{`
        @keyframes vuka-orbit-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes vuka-orbit-ccw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes vuka-pulse-ring {
          0%, 100% { transform: scale(0.96); opacity: 0.35; }
          50% { transform: scale(1.06); opacity: 0.8; }
        }
        @keyframes vuka-scanline {
          0% { transform: translateY(-100%); opacity: 0; }
          40% { opacity: 0.45; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>

      {/* Subtle architectural coordinate grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(194,247,77,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(194,247,77,0.22) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Ambient electric-lime aurora glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-[#c2f74d]/12 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[240px] w-[240px] rounded-full bg-[#79b200]/20 blur-[70px]"
      />

      {/* Horizontal laser scanline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-transparent via-[#c2f74d]/10 to-transparent"
        style={{ animation: "vuka-scanline 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite" }}
      />

      {/* Top Corner Telemetry Stamps */}
      <div className="pointer-events-none absolute left-6 top-6 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 sm:flex">
        <span className="size-2 rounded-full bg-[#c2f74d] shadow-[0_0_10px_#c2f74d]" />
        <span>VUKA OS v2.4 · PAN-AFRICAN SETTLEMENT MESH</span>
      </div>
      <div className="pointer-events-none absolute right-6 top-6 hidden font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 sm:block">
        <span>EAC · ECOWAS · SADC · HORN</span>
      </div>

      {/* Centerpiece 3D Orbital Settlement Reactor */}
      <div className="relative flex size-64 items-center justify-center sm:size-72">
        {/* Outer Counter-Rotating Telemetry Degree Ring */}
        <svg
          viewBox="0 0 280 280"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full"
          style={{ animation: "vuka-orbit-ccw 26s linear infinite" }}
        >
          <circle
            cx="140"
            cy="140"
            r="130"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            strokeDasharray="3 7"
          />
          <circle
            cx="140"
            cy="140"
            r="116"
            fill="none"
            stroke="rgba(194,247,77,0.28)"
            strokeWidth="1.5"
            strokeDasharray="48 90 24 70"
            strokeLinecap="round"
          />
        </svg>

        {/* Middle Clockwise Corridor Hub Ring */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-5 rounded-full border border-white/10"
          style={{ animation: "vuka-orbit-cw 18s linear infinite" }}
        >
          {ORBIT_HUBS.map((hub) => {
            const rad = (hub.angle * Math.PI) / 180;
            const x = 50 + 50 * Math.cos(rad);
            const y = 50 + 50 * Math.sin(rad);
            return (
              <div
                key={hub.code}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <span className="flex items-center gap-1 rounded-full border border-[#c2f74d]/45 bg-[#151515]/95 px-2 py-0.5 font-mono text-[8px] font-bold tracking-wider text-[#c2f74d] shadow-[0_0_12px_rgba(194,247,77,0.25)]">
                  <span className="size-1 rounded-full bg-[#c2f74d]" />
                  {hub.code}
                </span>
              </div>
            );
          })}
        </div>

        {/* Inner Pulsing Hexagonal Aura */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute size-36 rounded-3xl border border-[#c2f74d]/35 bg-[#c2f74d]/[0.04]"
          style={{ animation: "vuka-pulse-ring 2.6s ease-in-out infinite" }}
        />

        {/* Core VUKA Enterprise Emblem Vault Tile */}
        <div className="relative z-10 flex size-24 items-center justify-center rounded-2xl border border-[#c2f74d]/55 bg-gradient-to-b from-[#1e1e1e] to-[#111111] shadow-[0_0_50px_-10px_rgba(194,247,77,0.45)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#c2f74d]/20 via-transparent to-transparent"
          />
          <VukaMark className="relative z-10 size-14 text-white" accent />
        </div>
      </div>

      {/* Brand Wordmark & Telemetry Progress */}
      <div className="relative z-10 mt-6 flex w-full max-w-md flex-col items-center text-center">
        <div className="inline-flex items-center gap-2">
          <span className="text-2xl font-bold tracking-[0.38em] text-white sm:text-3xl">VUKA</span>
          <span className="size-2 rounded-full bg-[#c2f74d] shadow-[0_0_10px_#c2f74d]" />
        </div>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#c2f74d]">
          Cross-Border Trade Settlement & Escrow
        </p>

        {/* Progress Bar */}
        <div className="mt-6 w-full max-w-xs space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.18em]">
            <span className="truncate text-white/65">{activeStage}</span>
            <span className="ml-2 shrink-0 font-bold tabular-nums text-[#c2f74d]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#79b200] via-[#c2f74d] to-emerald-300 shadow-[0_0_12px_#c2f74d] transition-all duration-150 ease-out"
              style={{ width: `${Math.max(8, Math.min(100, progress))}%` }}
            />
          </div>
        </div>

        {children ? (
          <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
            {children}
          </div>
        ) : null}

        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="mt-6 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white/50 transition-colors hover:border-[#c2f74d]/40 hover:text-white"
          >
            Enter Workspace →
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * First-visit cinematic preloader overlay mounted in RootComponent.
 * Runs once per browser session on initial site visit, with smooth progress & curtain lift.
 */
export function InitialVisitPreloader() {
  const [phase, setPhase] = useState<"active" | "exiting" | "done">(() => {
    if (typeof window === "undefined") return "done";
    // Skip in automated test runners so unit tests never wait on animations
    if (import.meta.env.MODE === "test" || window.navigator?.webdriver) return "done";
    try {
      if (window.sessionStorage.getItem(SESSION_PRELOAD_KEY) === "1") return "done";
    } catch {
      // ignore storage errors
    }
    return "active";
  });
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    if (phase !== "active") return;
    try {
      window.sessionStorage.setItem(SESSION_PRELOAD_KEY, "1");
    } catch {
      // ignore
    }

    const start = performance.now();
    const duration = 1250;
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, 12 + (elapsed / duration) * 88);
      setProgress(pct);
      if (elapsed < duration) {
        raf = window.requestAnimationFrame(tick);
      } else {
        setPhase("exiting");
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase !== "exiting") return;
    const timer = window.setTimeout(() => setPhase("done"), 420);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-[200] transition-all duration-400 ease-out",
        phase === "exiting" && "pointer-events-none scale-[1.03] opacity-0",
      )}
    >
      <VukaPreloadCanvas
        progress={progress}
        onSkip={() => {
          setProgress(100);
          setPhase("exiting");
        }}
      />
    </div>
  );
}
