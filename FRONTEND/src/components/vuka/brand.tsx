import { cn } from "@/lib/utils";

/**
 * The VUKA mark: a "V" whose right arm rises higher than the left — waking up ("vuka") and crossing
 * over. Flat-topped, sharp-cornered, one colour (`currentColor`) so it follows the theme. The same
 * geometry is used for `public/icon.svg` and every raster icon.
 */
export function VukaMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="50 64 400 400"
      className={cn("size-7 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <clipPath id="vuka-mark-clip">
        <path d="M0 126H290V72H512V512H0Z" />
      </clipPath>
      <path
        d="M104 68L226 368L408 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="58"
        strokeLinejoin="miter"
        strokeMiterlimit="10"
        clipPath="url(#vuka-mark-clip)"
      />
    </svg>
  );
}

/** Mark + letter-spaced wordmark, with an optional tagline underneath. */
export function VukaLogo({
  tagline,
  size = "md",
  className,
  tile = false,
}: {
  tagline?: string;
  size?: "md" | "lg" | "xl";
  className?: string;
  /** Renders the mark on a small rounded lime tile, for dense chrome like a sidebar header. */
  tile?: boolean;
}) {
  const word = { md: "text-lg", lg: "text-xl", xl: "text-2xl" }[size];
  const mark = { md: "size-7", lg: "size-8", xl: "size-10" }[size];
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      {tile ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <VukaMark className="size-5" />
        </span>
      ) : (
        <VukaMark className={mark} />
      )}
      <span className="flex flex-col">
        <span className={cn("font-semibold leading-none tracking-[0.4em]", word)}>VUKA</span>
        {tagline ? (
          <span className="mt-1 hidden whitespace-nowrap font-mono min-[420px]:block text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
