import { Photo } from "./photo";
import { Reveal } from "./reveal";

const kicker = "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground";

const SCENES = [
  {
    src: "/images/landing/mombasa-port.webp",
    alt: "A container ship leaving the port of Mombasa, Kenya",
    width: 1600,
    height: 1200,
    caption: "Goods are already moving. The money should move as fast.",
    credit: {
      location: "Mombasa, Kenya",
      credit: "Ian Kiptoo",
      license: "CC BY 4.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Container_ship_exiting_Mombasa_port,_Kenya_01.jpg",
    },
  },
  {
    src: "/images/landing/mpesa-agent.webp",
    alt: "A mobile money agent kiosk in Nairobi, Kenya",
    width: 1600,
    height: 1067,
    caption: "Most traders already bank through a phone, not a branch.",
    credit: {
      location: "Nairobi, Kenya",
      credit: "Fiona Graham",
      license: "CC BY-SA 2.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:M-PESA_mobile_money_and_Equity_agent,_Nairobi,_Kenya.jpg",
    },
  },
  {
    src: "/images/landing/kenya-coffee.webp",
    alt: "Rows of coffee plants on red volcanic soil near Kiambu County, Kenya",
    width: 1200,
    height: 900,
    caption: "A single harvest can depend on one payment landing on time.",
    credit: {
      location: "Kiambu County, Kenya",
      credit: "Lebu Ayiga",
      license: "CC BY 4.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Coffee_plantation_near_Kawaida_Falls,_Cianda,_Kiambu_County_01.jpg",
    },
  },
] as const;

/** A quiet photographic break between the pitch and the interactive demos — real trade, real places. */
export function Scenes() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto px-4 py-20 sm:px-6 lg:px-10 2xl:px-16">
        <Reveal>
          <div className={kicker}>The trade this is built for</div>
          <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
            Not an abstraction. Ports, markets and phones, across ten countries.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {SCENES.map((s, i) => (
            <Reveal key={s.src} delay={i * 70}>
              <Photo
                src={s.src}
                alt={s.alt}
                width={s.width}
                height={s.height}
                credit={s.credit}
                className="h-full"
                imgClassName="aspect-[4/3]"
              />
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">{s.caption}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
