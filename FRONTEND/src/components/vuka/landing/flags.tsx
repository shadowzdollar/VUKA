import { cn } from "@/lib/utils";

/**
 * National flags for the ten launch markets, drawn as inline SVG on a 900x600 canvas so they scale
 * crisply, cost no network requests and stay within the CSP. Emblems (Kenya's shield, Uganda's crane,
 * Zambia's eagle, Ethiopia's pentagram) are simplified renderings, not heraldic reproductions.
 */

const star = (cx: number, cy: number, R: number, r = R * 0.382) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (-90 + i * 36) * (Math.PI / 180);
    const d = i % 2 === 0 ? R : r;
    return `${(cx + d * Math.cos(a)).toFixed(1)},${(cy + d * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

const rays = (cx: number, cy: number, r1: number, r2: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((i * 360) / n) * (Math.PI / 180);
    return `M${(cx + r1 * Math.cos(a)).toFixed(1)},${(cy + r1 * Math.sin(a)).toFixed(1)}L${(cx + r2 * Math.cos(a)).toFixed(1)},${(cy + r2 * Math.sin(a)).toFixed(1)}`;
  }).join("");

const ART: Record<string, (id: string) => React.ReactNode> = {
  RW: () => (
    <>
      <rect width="900" height="300" fill="#00A1DE" />
      <rect y="300" width="900" height="150" fill="#FAD201" />
      <rect y="450" width="900" height="150" fill="#20603D" />
      <circle cx="720" cy="150" r="38" fill="#E5BE01" />
      <path
        d={rays(720, 150, 50, 112, 24)}
        stroke="#E5BE01"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </>
  ),
  KE: () => (
    <>
      <rect width="900" height="600" fill="#fff" />
      <rect width="900" height="170" fill="#000" />
      <rect y="200" width="900" height="200" fill="#BB0000" />
      <rect y="430" width="900" height="170" fill="#006600" />
      <g stroke="#fff" strokeWidth="14" strokeLinecap="round">
        <path d="M330 120L570 480M570 120L330 480" />
      </g>
      <ellipse cx="450" cy="300" rx="82" ry="150" fill="#000" />
      <ellipse cx="450" cy="300" rx="72" ry="140" fill="#BB0000" />
      <ellipse cx="450" cy="300" rx="34" ry="128" fill="#fff" />
      <ellipse cx="450" cy="300" rx="22" ry="110" fill="#000" />
      <path d="M450 190V410" stroke="#fff" strokeWidth="8" />
      <path d="M380 300H520" stroke="#fff" strokeWidth="8" />
    </>
  ),
  UG: () => (
    <>
      {["#000", "#FCDC04", "#D90000", "#000", "#FCDC04", "#D90000"].map((c, i) => (
        <rect key={i} y={i * 100} width="900" height="100" fill={c} />
      ))}
      <circle cx="450" cy="300" r="105" fill="#fff" />
      <g fill="#3b3b3b">
        <ellipse cx="452" cy="318" rx="46" ry="26" />
        <path d="M412 312C388 290 392 250 420 236C428 232 436 236 432 244C420 254 424 274 440 290Z" />
        <circle cx="424" cy="236" r="12" />
        <path d="M414 232L370 240L414 244Z" fill="#8b0000" />
        <path
          d="M430 224l10-22M438 228l18-16M444 234l24-8"
          stroke="#3b3b3b"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M440 340V392M462 340V388" stroke="#3b3b3b" strokeWidth="8" strokeLinecap="round" />
      </g>
    </>
  ),
  TZ: (id) => (
    <>
      <clipPath id={`${id}-c`}>
        <rect width="900" height="600" />
      </clipPath>
      <g clipPath={`url(#${id}-c)`}>
        <polygon points="0,0 900,0 0,600" fill="#1EB53A" />
        <polygon points="900,600 900,0 0,600" fill="#00A3DD" />
        <path d="M-40 640L940 -40" stroke="#FCD116" strokeWidth="230" />
        <path d="M-40 640L940 -40" stroke="#000" strokeWidth="150" />
      </g>
    </>
  ),
  GH: () => (
    <>
      <rect width="900" height="200" fill="#CE1126" />
      <rect y="200" width="900" height="200" fill="#FCD116" />
      <rect y="400" width="900" height="200" fill="#006B3F" />
      <polygon points={star(450, 305, 96)} fill="#000" />
    </>
  ),
  NG: () => (
    <>
      <rect width="900" height="600" fill="#fff" />
      <rect width="300" height="600" fill="#008751" />
      <rect x="600" width="300" height="600" fill="#008751" />
    </>
  ),
  SN: () => (
    <>
      <rect width="300" height="600" fill="#00853F" />
      <rect x="300" width="300" height="600" fill="#FDEF42" />
      <rect x="600" width="300" height="600" fill="#E31B23" />
      <polygon points={star(450, 305, 98)} fill="#00853F" />
    </>
  ),
  ET: () => (
    <>
      <rect width="900" height="200" fill="#078930" />
      <rect y="200" width="900" height="200" fill="#FCDD09" />
      <rect y="400" width="900" height="200" fill="#DA121A" />
      <circle cx="450" cy="300" r="135" fill="#0F47AF" />
      <polygon
        points={star(450, 300, 100, 100 * 0.5)}
        fill="none"
        stroke="#FCDD09"
        strokeWidth="9"
        strokeLinejoin="round"
      />
      <path
        d={rays(450, 300, 30, 60, 5).replace(/M/g, "M")}
        stroke="#FCDD09"
        strokeWidth="7"
        transform="rotate(-90 450 300)"
      />
    </>
  ),
  ZM: () => (
    <>
      <rect width="900" height="600" fill="#198A00" />
      <rect x="640" y="340" width="70" height="260" fill="#DE2010" />
      <rect x="710" y="340" width="70" height="260" fill="#000" />
      <rect x="780" y="340" width="70" height="260" fill="#EF7D00" />
      <g fill="#EF7D00">
        <path d="M690 160C700 120 740 110 770 130C790 100 830 100 850 120C820 120 800 140 792 160C806 176 826 178 846 172C820 196 786 190 770 176C752 192 720 192 690 160Z" />
        <path d="M770 176L760 232L780 216L800 232L790 180Z" />
        <path d="M690 160L664 172L688 176Z" />
      </g>
    </>
  ),
  ZA: (id) => (
    <>
      <rect width="900" height="300" fill="#DE3831" />
      <rect y="300" width="900" height="300" fill="#002395" />
      <clipPath id={`${id}-c`}>
        <rect width="900" height="600" />
      </clipPath>
      <g clipPath={`url(#${id}-c)`} fill="none" strokeLinejoin="miter">
        <path d="M-20 -20L390 300H920M-20 620L390 300" stroke="#fff" strokeWidth="190" />
        <path d="M-20 -20L390 300H920M-20 620L390 300" stroke="#007A4D" strokeWidth="112" />
      </g>
      <polygon points="0,20 0,580 330,300" fill="#FFB612" />
      <polygon points="0,105 0,495 235,300" fill="#000" />
    </>
  ),
};

export const FLAG_NAMES: Record<string, string> = {
  RW: "Rwanda",
  KE: "Kenya",
  UG: "Uganda",
  TZ: "Tanzania",
  GH: "Ghana",
  NG: "Nigeria",
  SN: "Senegal",
  ET: "Ethiopia",
  ZM: "Zambia",
  ZA: "South Africa",
};

/** The flag artwork without an <svg> wrapper, for placing inside other SVG scenes (900x600 units). `id` must be unique per instance. */
export function FlagArt({ code, id }: { code: string; id: string }) {
  return <>{ART[code]?.(id) ?? null}</>;
}

/** A single flag. Decorative by default (`aria-hidden`); pass `label` when it is the only identifier. */
export function Flag({
  code,
  className,
  label,
  ink = false,
}: {
  code: string;
  className?: string;
  label?: string;
  ink?: boolean;
}) {
  const art = ART[code];
  if (!art) return null;
  return (
    <svg
      viewBox="0 0 900 600"
      className={cn("block h-auto w-full", ink && "grayscale contrast-125", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      {art(`f-${code}`)}
    </svg>
  );
}

/** A flag hung like cloth: a soft travelling highlight and a shaded fold give it a gentle ripple. */
export function FlagCloth({
  code,
  className,
  label,
}: {
  code: string;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "cloth relative aspect-[3/2] overflow-hidden shadow-[0_14px_30px_-16px_rgba(0,0,0,0.6)]",
        className,
      )}
    >
      <Flag code={code} {...(label ? { label } : {})} className="size-full" />
      <div aria-hidden="true" className="cloth-sheen pointer-events-none absolute inset-0" />
    </div>
  );
}
