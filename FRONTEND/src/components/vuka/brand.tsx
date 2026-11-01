import { cn } from "@/lib/utils";

/**
 * The VUKA Enterprise Emblem:
 * An isometric cross-border settlement vault & corridor bridge monogram.
 * - Left faceted pillar: origin treasury & escrow lock
 * - Right ascending dual-rail wing: cross-border corridor velocity ("vuka" — wake up / cross over)
 * - Apex electric-lime diamond keystone + orbital bridge arc: atomic settlement finality
 */
export function VukaMark({
  className,
  title,
  accent = true,
}: {
  className?: string;
  title?: string;
  /** Whether to highlight the apex settlement node in VUKA electric lime (#c2f74d). */
  accent?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={cn("size-7 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {/* Outer precision octagonal vault frame */}
      <path
        d="M156 36H356L476 156V356L356 476H156L36 356V156L156 36Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="22"
        strokeOpacity="0.22"
        strokeLinejoin="round"
      />

      {/* Orbital cross-border corridor arc linking left & right wings */}
      <path
        d="M110 196C178 122 334 122 402 196"
        fill="none"
        stroke={accent ? "#c2f74d" : "currentColor"}
        strokeWidth="20"
        strokeLinecap="round"
        strokeOpacity={accent ? "0.85" : "0.4"}
      />

      {/* Left treasury pillar descending into the settlement vertex */}
      <path
        d="M92 142L166 142L248 344L210 416L92 142Z"
        fill="currentColor"
      />

      {/* Right ascending corridor wing (rises higher than left — "VUKA") */}
      <path
        d="M210 416L266 416L424 104L352 104L210 416Z"
        fill="currentColor"
      />

      {/* Secondary parallel fast-settlement rail on the right wing */}
      <path
        d="M304 392L442 126"
        fill="none"
        stroke={accent ? "#c2f74d" : "currentColor"}
        strokeWidth="24"
        strokeLinecap="square"
      />

      {/* Apex Settlement Keystone Diamond */}
      <polygon
        points="256,74 294,112 256,150 218,112"
        fill={accent ? "#c2f74d" : "currentColor"}
      />
    </svg>
  );
}

/** Enterprise Emblem + precision wordmark, with optional tagline and compact/collapsed modes. */
export function VukaLogo({
  tagline,
  size = "md",
  className,
  tile = false,
  collapsed = false,
}: {
  tagline?: string;
  size?: "md" | "lg" | "xl";
  className?: string;
  /** Renders the emblem inside an enterprise dark-ink & lime-accented vault tile. */
  tile?: boolean;
  /** Icon-only mode for collapsed sidebars. */
  collapsed?: boolean;
}) {
  const word = { md: "text-base", lg: "text-lg", xl: "text-2xl" }[size];
  const mark = { md: "size-7", lg: "size-8", xl: "size-10" }[size];
  const tileBox = { md: "size-8", lg: "size-9", xl: "size-11" }[size];
  const tileMark = { md: "size-5", lg: "size-6", xl: "size-7" }[size];

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {tile ? (
        <span
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-xl border border-[#c2f74d]/40 bg-[#151515] text-white shadow-[0_6px_18px_-6px_rgba(0,0,0,0.45)]",
            tileBox,
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-[#c2f74d]/20 via-transparent to-transparent"
          />
          <VukaMark className={cn("relative z-10", tileMark)} accent />
        </span>
      ) : (
        <span
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center rounded-xl border border-[#c2f74d]/35 bg-[#151515] p-1 text-white shadow-sm",
            mark,
          )}
        >
          <VukaMark className="size-full" accent />
        </span>
      )}
      {!collapsed ? (
        <span className="flex flex-col">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                "font-bold leading-none tracking-[0.28em] text-foreground",
                word,
              )}
            >
              VUKA
            </span>
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[#79b200] shadow-[0_0_8px_#c2f74d]"
            />
          </span>
          {tagline ? (
            <span className="mt-1 hidden whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground min-[420px]:block">
              {tagline}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
