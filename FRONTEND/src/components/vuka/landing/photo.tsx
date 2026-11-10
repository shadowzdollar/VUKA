import { useLangCopy } from "@/lib/i18n";

/**
 * Real, CC-licensed photography, kept inside the monochrome system via a grayscale filter
 * (no hue is introduced — see frontend_color_guidelines.md). Credit is shown the way a
 * reputable editorial site does it: small, factual, never hidden.
 */
export type PhotoCredit = {
  location: string;
  credit: string;
  license: string;
  sourceUrl: string;
};

const PHOTO_COPY = {
  en: { sourceTitle: "View original photograph and license source" },
  fr: { sourceTitle: "Voir la photographie originale et la source de la licence" },
  sw: { sourceTitle: "Tazama picha halisi na chanzo cha leseni" },
  pt: { sourceTitle: "Ver fotografia original e fonte da licença" },
  rw: { sourceTitle: "Reba ifoto y'umwimerere n'isoko ry'uruhushya" },
};

export function Photo({
  src,
  alt,
  width,
  height,
  credit,
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  credit: PhotoCredit;
  className?: string;
  imgClassName?: string;
}) {
  const copy = useLangCopy(PHOTO_COPY);
  return (
    <figure className={className}>
      <div className="overflow-hidden border border-border bg-muted/30">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className={`size-full object-cover grayscale contrast-[1.08] ${imgClassName ?? ""}`}
        />
      </div>
      <figcaption className="mt-2 flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <span>{credit.location}</span>
        <a
          href={credit.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          title={copy.sourceTitle}
          aria-label={`${credit.credit} · ${credit.license} (${copy.sourceTitle})`}
          className="shrink-0 underline-offset-2 hover:underline"
        >
          {credit.credit} · {credit.license}
        </a>
      </figcaption>
    </figure>
  );
}
