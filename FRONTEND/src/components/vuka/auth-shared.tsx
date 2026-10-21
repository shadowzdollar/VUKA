import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Clean architectural styling matching the VUKA Global Trade reference:
 * Warm linen/paper ground (#F4F4F2), centered dual-panel card with 20px radii,
 * dark obsidian left hero with glowing trade globe and cargo ship,
 * crisp white right form panel with fine typography and subtle borders.
 */

export const AUTH_INPUT =
  "h-11 rounded-lg border border-[#E4E4E0] bg-[#FAFAF9] px-3.5 text-sm text-[#0A0D12] shadow-none transition-all " +
  "placeholder:text-[#9B9B94] hover:border-[#CACAC4] focus-visible:border-[#0A0D12] focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#0A0D12]";

export const AUTH_BUTTON =
  "h-11 rounded-lg bg-[#0A0D12] font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white " +
  "shadow-sm transition-all hover:bg-[#1C2028] hover:shadow active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none";

/** The VUKA geometric emblem & word mark */
export function AuthMark({
  className,
  compact = false,
  inverted = false,
}: {
  className?: string;
  compact?: boolean;
  inverted?: boolean;
}) {
  return (
    <Link to="/" aria-label="VUKA home" className="inline-flex items-center gap-2.5 group">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        className={cn("h-7 w-7 transition-transform group-hover:scale-105", className)}
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="8" fill={inverted ? "#FFFFFF" : "#0A0D12"} />
        <path
          d="M10 11L20 30L30 11L24.5 16.5L20 23.5L15.5 16.5L10 11Z"
          fill={inverted ? "#0A0D12" : "#FFFFFF"}
        />
      </svg>
      <span
        className={cn(
          "font-semibold tracking-[0.22em] transition-colors",
          inverted ? "text-white" : "text-[#0A0D12]",
          compact ? "text-lg" : "text-xl",
        )}
      >
        VUKA
      </span>
    </Link>
  );
}

/** Left Hero Panel inside the center card — matches the visual reference */
export function AuthHeroPanel({ onWatchVideo }: { onWatchVideo?: () => void }) {
  return (
    <div className="relative min-h-[580px] overflow-hidden bg-[#070A0F] lg:min-h-[720px] select-none">
      {/*
       * This is the supplied, cropped reference artwork rather than a remote stock image.
       * Keeping it local makes the authentication screen reliable offline and preserves the
       * detailed globe, vessel and technical drawing treatment from the approved design.
       */}
      <img
        src="/images/auth/trade-network.webp"
        alt="VUKA global trade network"
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="eager"
      />
      <button
        type="button"
        onClick={onWatchVideo}
        className="absolute left-[7%] top-[53%] h-[9%] w-[35%] rounded-full focus-visible:outline-white"
        aria-label="Watch how VUKA works"
      />
    </div>
  );
}

/**
 * Full page layout faithfully reproducing the VUKA design template:
 * - Canvas: Warm linen #F4F4F2
 * - Margin annotations: technical text, ship blueprint schematic, corridor radar
 * - Centered 2-column card with 20px corners
 */
export function AuthShell({
  children,
  page = "login",
  wide = false,
}: {
  children: ReactNode;
  page?: "login" | "register";
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-screen w-full bg-[#F4F4F2] text-[#0A0D12] flex flex-col justify-between selection:bg-[#0A0D12] selection:text-white overflow-x-hidden">
      {/* Outer Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-14 border-b border-[#E7E7E3]">
        <div className="flex items-center gap-3">
          <AuthMark />
          <span className="h-4 w-px bg-[#D6D6D0] hidden sm:block" />
          <span className="hidden sm:inline-block font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#787870]">
            Global Trade. Verified.
          </span>
        </div>

        <div>
          {page === "login" ? (
            <div className="flex items-center gap-2 text-xs text-[#63635E]">
              <span className="hidden md:inline">Don't have an account?</span>
              <Link
                to="/register"
                className="font-medium text-[#0A0D12] underline underline-offset-4 hover:text-black transition-colors"
              >
                Create one
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#63635E]">
              <span className="hidden md:inline">Already have an account?</span>
              <Link
                to="/login"
                className="font-medium text-[#0A0D12] underline underline-offset-4 hover:text-black transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Canvas Body with Outer Technical Drawings & Centered Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12">
        {/* Left Outer Margin Technical Drawings (visible on xl screens >= 1320px) */}
        <aside
          aria-hidden="true"
          className="hidden 2xl:flex fixed left-6 top-28 bottom-20 w-44 flex-col justify-between pointer-events-none select-none text-[#76766F]"
        >
          {/* Top text block */}
          <div className="space-y-1 font-mono text-[9px] uppercase tracking-[0.24em] font-semibold leading-relaxed">
            <p>Real Businesses.</p>
            <p>Real Markets.</p>
            <p>Real Opportunities.</p>
          </div>

          {/* Middle Radar / Coordinates schematic */}
          <div className="relative py-4">
            <img
              src="/images/auth-radar-schematic.webp"
              alt=""
              className="w-32 opacity-40 mix-blend-multiply"
            />
            <div className="mt-2 font-mono text-[8px] uppercase tracking-[0.18em] text-[#8A8A82]">
              <p>LAT 01° 17′ S</p>
              <p>LON 36° 49′ E</p>
            </div>
          </div>

          {/* Bottom Region corridor tags */}
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] space-y-1 border-l-2 border-[#D2D2CC] pl-3 py-1">
            <p className="font-bold text-[#0A0D12]">Africa</p>
            <p className="text-[#8A8A82]">Europe</p>
            <p className="text-[#8A8A82]">Asia</p>
            <p className="text-[#8A8A82]">Americas</p>
          </div>
        </aside>

        {/* Right Outer Margin Technical Drawings (visible on xl screens >= 1320px) */}
        <aside
          aria-hidden="true"
          className="hidden 2xl:flex fixed right-6 top-28 bottom-20 w-48 flex-col justify-between items-end pointer-events-none select-none text-[#76766F] text-right"
        >
          {/* Top trade connects text */}
          <div className="space-y-1 font-mono text-[9px] uppercase tracking-[0.24em] font-semibold leading-relaxed">
            <p>Trade</p>
            <p>Connects</p>
            <p>People</p>
            <p>And</p>
            <p>Economies.</p>
          </div>

          {/* Middle Cargo Vessel blueprint schematic */}
          <div className="relative py-2 flex flex-col items-end">
            <img
              src="/images/auth-ship-schematic.webp"
              alt=""
              className="w-40 opacity-45 mix-blend-multiply"
            />
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#8A8A82] mt-1">
              CONTAINER VESSEL // CLASS 04
            </span>
          </div>

          {/* Bottom Process steps */}
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] space-y-1.5 border-r-2 border-[#D2D2CC] pr-3 py-1">
            <p className="text-[#8A8A82]">
              <span className="text-[#0A0D12] font-semibold">01</span> Documents
            </p>
            <p className="text-[#8A8A82]">
              <span className="text-[#0A0D12] font-semibold">02</span> Transactions
            </p>
            <p className="text-[#8A8A82]">
              <span className="text-[#0A0D12] font-semibold">03</span> Settlement
            </p>
            <p className="text-[#8A8A82]">
              <span className="text-[#0A0D12] font-semibold">04</span> Growth
            </p>
          </div>
        </aside>

        {/* Center 2-Column Split Card Container */}
        <div
          className={cn(
            "w-full bg-white rounded-2xl lg:rounded-[22px] overflow-hidden shadow-[0_24px_70px_-15px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06)] border border-[#E7E7E3] grid grid-cols-1 lg:grid-cols-[1.28fr_1fr]",
            wide ? "max-w-[1140px]" : "max-w-[1040px]",
          )}
        >
          {/* Left Hero Artwork Panel */}
          <AuthHeroPanel />

          {/* Right White Form Panel */}
          <div className="relative flex flex-col justify-between p-7 sm:p-9 lg:p-11 bg-white">
            {children}
          </div>
        </div>
      </main>

      {/* Outer Bottom Footer Bar */}
      <footer className="relative z-20 flex flex-col sm:flex-row items-center justify-between px-6 py-4 sm:px-10 lg:px-14 border-t border-[#E7E7E3] gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#767670]">
        <div className="flex items-center gap-3">
          <span>VUKA © {new Date().getFullYear()}</span>
          <span className="h-3 w-px bg-[#D6D6D0]" />
          <span className="inline-flex items-center gap-1.5 text-[#2E7D32]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
            System Operational
          </span>
        </div>

        <div className="text-center sm:text-right">
          <span>More than a platform. A bridge for African trade.</span>
        </div>
      </footer>
    </div>
  );
}

/** Field wrapper with crisp floating or uppercase mono labels */
export function AuthField({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="space-y-1.5 text-left">
      <label
        htmlFor={id}
        className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#55554E]"
      >
        {label}
      </label>

      {children}

      {hint && <p className="text-[11px] leading-4 text-[#7A7A72]">{hint}</p>}
    </div>
  );
}

/** Error alert banner styled cleanly */
export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs leading-5 text-red-900"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-200/80 font-mono text-[10px] font-bold text-red-900"
      >
        !
      </span>
      <span className="min-w-0 font-medium">{children}</span>
    </div>
  );
}

/** Google SVG colored logo */
export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}
