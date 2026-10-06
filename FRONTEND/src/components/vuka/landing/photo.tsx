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
          className="shrink-0 underline-offset-2 hover:underline"
        >
          {credit.credit} · {credit.license}
        </a>
      </figcaption>
    </figure>
  );
}
