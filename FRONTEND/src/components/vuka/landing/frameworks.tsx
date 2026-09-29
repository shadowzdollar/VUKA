import { Reveal } from "./reveal";
import { Tilt } from "./tilt";

/**
 * A generic engraved seal: concentric rings, a tick rim and a rotational motif, with the document
 * name on the rim. Deliberately NOT an official emblem of any institution.
 */
function Seal({
  id,
  rim,
  motif,
}: {
  id: string;
  rim: string;
  motif: "sun" | "star" | "wheat" | "link";
}) {
  const r = 44;
  const ticks = Array.from({ length: 48 }, (_, i) => {
    const a = (i * 7.5 * Math.PI) / 180;
    return `M${(50 + 36 * Math.cos(a)).toFixed(1)},${(50 + 36 * Math.sin(a)).toFixed(1)}L${(50 + 33 * Math.cos(a)).toFixed(1)},${(50 + 33 * Math.sin(a)).toFixed(1)}`;
  }).join("");
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true" focusable="false">
      <defs>
        <path
          id={id}
          d={`M50 50 m-${r} 0 a${r} ${r} 0 1 1 ${2 * r} 0 a${r} ${r} 0 1 1 -${2 * r} 0`}
        />
      </defs>
      <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="38.5" fill="none" stroke="currentColor" strokeWidth="0.7" />
      <path d={ticks} stroke="currentColor" strokeWidth="0.8" />
      <text
        fontSize="6.6"
        letterSpacing="1.2"
        fill="currentColor"
        fontFamily="var(--font-mono, monospace)"
      >
        <textPath href={`#${id}`}>{rim}</textPath>
      </text>
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        {motif === "sun" ? (
          <>
            <circle cx="50" cy="50" r="6" />
            {Array.from({ length: 16 }, (_, i) => {
              const a = (i * 22.5 * Math.PI) / 180;
              return (
                <path
                  key={i}
                  d={`M${50 + 10 * Math.cos(a)},${50 + 10 * Math.sin(a)}L${50 + 21 * Math.cos(a)},${50 + 21 * Math.sin(a)}`}
                />
              );
            })}
          </>
        ) : null}
        {motif === "star" ? (
          <polygon
            points={Array.from({ length: 10 }, (_, i) => {
              const a = ((-90 + i * 36) * Math.PI) / 180;
              const d = i % 2 ? 9 : 22;
              return `${(50 + d * Math.cos(a)).toFixed(1)},${(50 + d * Math.sin(a)).toFixed(1)}`;
            }).join(" ")}
          />
        ) : null}
        {motif === "wheat" ? (
          <>
            {[-1, 1].map((sd) => (
              <g key={sd}>
                {Array.from({ length: 5 }, (_, i) => (
                  <path key={i} d={`M50 ${68 - i * 8}q${sd * 12} -6 ${sd * 15} -${14}`} />
                ))}
              </g>
            ))}
            <path d="M50 72V30" />
          </>
        ) : null}
        {motif === "link" ? (
          <>
            <circle cx="42" cy="50" r="13" />
            <circle cx="58" cy="50" r="13" />
          </>
        ) : null}
      </g>
    </svg>
  );
}

const DOCS = [
  {
    year: "1991",
    title: "Abuja Treaty",
    motif: "wheat" as const,
    body: "Established the African Economic Community and laid out a staged path to continental integration, built on the regional economic communities.",
    tag: "Foundation",
  },
  {
    year: "2015",
    title: "Agenda 2063",
    motif: "sun" as const,
    body: "The African Union's long-term framework for an integrated and prosperous continent, with a first ten-year implementation plan.",
    tag: "Vision",
  },
  {
    year: "2018 – 2021",
    title: "AfCFTA",
    motif: "star" as const,
    body: "The African Continental Free Trade Area agreement: signed in Kigali in 2018, in force from 2019, with trading under way from 1 January 2021.",
    tag: "Trade",
  },
  {
    year: "2022",
    title: "PAPSS",
    motif: "link" as const,
    body: "The Pan-African Payment and Settlement System, developed with Afreximbank and the AfCFTA Secretariat to settle payments between African currencies.",
    tag: "Payments",
  },
];

export function Frameworks() {
  return (
    <section id="frameworks" className="scroll-mt-20 overflow-x-clip border-t border-border">
      <div className="mx-auto px-4 py-20 sm:px-6 lg:px-10 2xl:px-16">
        <Reveal>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            The frameworks around us
          </div>
          <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            A payment system is only as strong as the agreements behind it.
          </h2>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            Continental trade rests on a run of treaties and programmes. VUKA is designed to
            complement the direction they set: lower cost, shared rules, and settlement in African
            currencies.
          </p>
        </Reveal>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DOCS.map((d, i) => (
            <li key={d.title}>
              <Reveal delay={i * 90} className="h-full">
                <Tilt max={7} className="h-full">
                  <article className="relative flex h-full min-h-[340px] flex-col border border-border bg-card p-5 shadow-[0_18px_40px_-26px_rgba(0,0,0,0.5)]">
                    <div className="absolute -right-3 -top-4 size-20 rotate-12 text-foreground/70 [transform:translateZ(40px)]">
                      <Seal
                        id={`seal-${i}`}
                        rim={`${d.title.toUpperCase()} · ${d.year} · `}
                        motif={d.motif}
                      />
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {d.tag}
                    </div>
                    <div className="mt-14 font-display text-4xl leading-none tabular">{d.year}</div>
                    <h3 className="mt-3 font-display text-2xl">{d.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{d.body}</p>
                    <div aria-hidden="true" className="mt-auto pt-6">
                      <div className="h-px bg-border" />
                      <div className="mt-2 h-px w-2/3 bg-border" />
                      <div className="mt-2 h-px w-1/3 bg-border" />
                    </div>
                  </article>
                </Tilt>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal className="mt-10">
          <p
            role="note"
            className="max-w-3xl border-l-2 border-foreground pl-4 text-sm text-muted-foreground"
          >
            <strong className="font-medium text-foreground">Independence notice.</strong> VUKA is an
            independent project. It is not affiliated with, endorsed by, or an implementation of any
            of these instruments or their institutions. Seals shown are generic illustrations, not
            official emblems.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
