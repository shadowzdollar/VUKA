import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  ArrowRight,
  Globe2,
  Layers,
  Smartphone,
  Wallet,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import escrowGlobe from "@/assets/escrow-globe.png";
import heroBackdrop from "@/assets/hero-backdrop.jpg";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { corridors, platform } from "@/lib/api/endpoints";
import { useI18n, useLangCopy } from "@/lib/i18n";
import { CENTRAL_BANKS, corridorFeeBps, DIAL, REGION_NAMES } from "@/lib/markets";
import { Flag } from "./landing/flags";
import { HeroDashboard } from "./landing/hero-dashboard";
import { PhoneMockup } from "./landing/phone-mockup";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

const Globe = lazy(() => import("./landing/globe"));

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{children}</p>;
}

function SectionHead({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-gradient mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 text-muted-foreground">{intro}</p>
    </div>
  );
}

const HERO_ICONS = [ShieldCheck, Smartphone, Layers, Wallet, Globe2, Zap] as const;

const HERO_COPY = {
  en: {
    eyebrow: "CROSS-BORDER TRADE PAYMENTS",
    h1Line1: "Move money.",
    h1Line2: "Trade without",
    h1Line3: "borders.",
    description:
      "Pay suppliers with confidence. Invoice-linked escrow and mobile money, built for African trade.",
    features: [
      { title: "Escrow", detail: "Protected" },
      { title: "Mobile", detail: "Money" },
      { title: "Invoice", detail: "Linked" },
      { title: "Business", detail: "Payments" },
      { title: "Cross-border", detail: "Trade" },
      { title: "Trust", detail: "Built in" },
    ],
    cta: "Open an account",
    rails: ["MTN MoMo", "M-Pesa", "Airtel Money", "Polygon", "USDC", "PAPSS-ready"],
  },
  fr: {
    eyebrow: "PAIEMENTS COMMERCIAUX TRANSFRONTALIERS",
    h1Line1: "Transférez vos fonds.",
    h1Line2: "Commercez sans",
    h1Line3: "frontières.",
    description:
      "Payez vos fournisseurs en toute confiance. Séquestre lié aux factures et mobile money, conçus pour le commerce africain.",
    features: [
      { title: "Séquestre", detail: "Protégé" },
      { title: "Mobile", detail: "Money" },
      { title: "Facture", detail: "Liée" },
      { title: "Paiements", detail: "Entreprise" },
      { title: "Commerce", detail: "Transfrontalier" },
      { title: "Confiance", detail: "Intégrée" },
    ],
    cta: "Ouvrir un compte",
    rails: ["MTN MoMo", "M-Pesa", "Airtel Money", "Polygon", "USDC", "Prêt pour PAPSS"],
  },
  sw: {
    eyebrow: "MALIPO YA BIASHARA YA KUVUKA MIPAKA",
    h1Line1: "Tuma pesa.",
    h1Line2: "Fanya biashara",
    h1Line3: "bila mipaka.",
    description:
      "Lipa wauzaji kwa uhakika. Escrow iliyounganishwa na ankara na pesa za simu, iliyojengwa kwa biashara ya Afrika.",
    features: [
      { title: "Escrow", detail: "Imelindwa" },
      { title: "Pesa za", detail: "Simu" },
      { title: "Ankara", detail: "Imeunganishwa" },
      { title: "Malipo ya", detail: "Biashara" },
      { title: "Biashara ya", detail: "Mipakani" },
      { title: "Imani", detail: "Imejengwa ndani" },
    ],
    cta: "Fungua akaunti",
    rails: ["MTN MoMo", "M-Pesa", "Airtel Money", "Polygon", "USDC", "Tayari kwa PAPSS"],
  },
  pt: {
    eyebrow: "PAGAMENTOS COMERCIAIS TRANSFRONTEIRIÇOS",
    h1Line1: "Movimente fundos.",
    h1Line2: "Comercie sem",
    h1Line3: "fronteiras.",
    description:
      "Pague aos fornecedores com confiança. Caução associada a faturas e mobile money, criados para o comércio africano.",
    features: [
      { title: "Caução", detail: "Protegida" },
      { title: "Mobile", detail: "Money" },
      { title: "Fatura", detail: "Associada" },
      { title: "Pagamentos", detail: "Empresariais" },
      { title: "Comércio", detail: "Transfronteiriço" },
      { title: "Confiança", detail: "Integrada" },
    ],
    cta: "Abrir uma conta",
    rails: ["MTN MoMo", "M-Pesa", "Airtel Money", "Polygon", "USDC", "Pronto para PAPSS"],
  },
  rw: {
    eyebrow: "UBWISHYU BW'UBUCURUZI BWAMBUKIRANYA IMIPAKA",
    h1Line1: "Ohereza amafaranga.",
    h1Line2: "Curuza nta",
    h1Line3: "mipaka.",
    description:
      "Ishyura abaguhaye ibicuruzwa ufite icyizere. Escrow ihujwe n'inyemezabuguzi na mobile money, byubakiwe ubucuruzi bwa Afurika.",
    features: [
      { title: "Escrow", detail: "Irinzwe" },
      { title: "Mobile", detail: "Money" },
      { title: "Inyemezabuguzi", detail: "Ihujwe" },
      { title: "Ubwishyu", detail: "Bw'ubucuruzi" },
      { title: "Ubucuruzi", detail: "Bwambukiranya" },
      { title: "Icyizere", detail: "Cyubatswemo" },
    ],
    cta: "Fungura konti",
    rails: ["MTN MoMo", "M-Pesa", "Airtel Money", "Polygon", "USDC", "Yiteguye PAPSS"],
  },
};

function Hero() {
  const c = useLangCopy(HERO_COPY);
  return (
    <>
      <section className="vuka-hero">
        <img className="hero-backdrop" src={heroBackdrop} alt="" aria-hidden="true" />
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span /> {c.eyebrow}
          </p>
          <h1>
            {c.h1Line1}
            <br />
            {c.h1Line2}
            <br />
            {c.h1Line3}
          </h1>
          <p className="hero-description">{c.description}</p>
          <ul className="hero-features">
            {HERO_ICONS.map((Icon, i) => {
              const feat = c.features[i]!;
              return (
                <li key={i}>
                  <span className="hero-feature-icon">
                    <Icon size={23} strokeWidth={1.6} />
                  </span>
                  <p>
                    {feat.title}
                    <br />
                    {feat.detail}
                  </p>
                </li>
              );
            })}
          </ul>
          <Button asChild size="lg" className="hero-cta">
            <Link to="/register">
              {c.cta} <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="hero-device-scene">
          <HeroDashboard />
          <PhoneMockup className="hero-phone" />
        </div>
      </section>
      <div className="border-b border-border bg-background">
        <ul className="mx-auto flex w-full max-w-[1560px] flex-wrap items-center justify-between gap-x-10 gap-y-4 px-4 py-7 sm:px-6 lg:px-10 2xl:px-14">
          {c.rails.map((r) => (
            <li
              key={r}
              className="inline-flex items-center gap-2 text-base font-semibold text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:text-foreground"
            >
              <span className="size-1.5 rounded-full bg-[#79b200]/70" aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

const JOURNEY_COPY = {
  en: {
    titleLine1: "Built on Escrow, Proven",
    titleLine2: "by Trade",
    bullets: [
      "Suppliers raise an invoice in VUKA with the amount, goods and delivery terms fixed and shared with both sides.",
      "Buyers pay from mobile money. Funds convert at a firm quote and lock in an on-chain escrow — never in a stranger's wallet.",
      "Suppliers ship knowing the money is committed, while the buyer confirms delivery or the agreed timeout runs out.",
      "Escrow releases and the supplier cashes out to local mobile money, with both trust scores updated from the outcome.",
    ],
    globeAlt: "Low-poly globe showing 156K+ USDC settled, 5 live markets, and 4 steps to cash-out",
  },
  fr: {
    titleLine1: "Bâti sur le Séquestre, Prouvé",
    titleLine2: "par le Commerce",
    bullets: [
      "Les fournisseurs émettent une facture sur VUKA avec le montant, les marchandises et les conditions de livraison fixés et partagés entre les deux parties.",
      "Les acheteurs paient via mobile money. Les fonds sont convertis à un taux ferme et bloqués dans un séquestre sur la chaîne — jamais dans le portefeuille d'un inconnu.",
      "Les fournisseurs expédient en sachant que les fonds sont engagés, tandis que l'acheteur confirme la livraison ou que le délai convenu expire.",
      "Le séquestre est libéré et le fournisseur encaisse sur son mobile money local, tandis que les scores de confiance des deux parties sont mis à jour.",
    ],
    globeAlt: "Globe low-poly affichant plus de 156K USDC réglés, 5 marchés actifs et 4 étapes jusqu'au retrait",
  },
  sw: {
    titleLine1: "Imejengwa juu ya Escrow, Imethibitishwa",
    titleLine2: "na Biashara",
    bullets: [
      "Wauzaji huandaa ankara kwenye VUKA yenye kiasi, bidhaa na masharti ya uwasilishaji yaliyowekwa wazi kwa pande zote mbili.",
      "Wanunuzi hulipa kupitia pesa za simu. Fedha hubadilishwa kwa bei thabiti na kufungwa kwenye escrow ya mtandaoni — kamwe si kwenye pochi ya mtu usiyemjua.",
      "Wauzaji husafirisha bidhaa wakijua pesa imetengwa, huku mnunuzi akithibitisha kupokea au muda uliokubaliwa ukiisha.",
      "Escrow huachia fedha na muuzaji hutoa pesa kwenda kwenye simu yake ya mkononi, huku alama za imani za pande zote zikisasishwa.",
    ],
    globeAlt: "Globu inayoonyesha zaidi ya USDC 156K zilizolipwa, masoko 5 hai, na hatua 4 hadi kutoa pesa",
  },
  pt: {
    titleLine1: "Construído sobre Caução, Comprovado",
    titleLine2: "pelo Comércio",
    bullets: [
      "Os fornecedores emitem uma fatura na VUKA com o montante, mercadorias e prazos de entrega fixados e partilhados por ambas as partes.",
      "Os compradores pagam via mobile money. Os fundos são convertidos a uma cotação firme e bloqueados numa caução on-chain — nunca na carteira de um desconhecido.",
      "Os fornecedores expedem sabendo que o dinheiro está garantido, enquanto o comprador confirma a entrega ou o prazo acordado expira.",
      "A caução é libertada e o fornecedor levanta para o mobile money local, atualizando a pontuação de confiança de ambos os lados.",
    ],
    globeAlt: "Globo mostrando mais de 156K USDC liquidados, 5 mercados ativos e 4 passos até ao levantamento",
  },
  rw: {
    titleLine1: "Byubatswe kuri Escrow, Byemejwe",
    titleLine2: "n'Ubucuruzi",
    bullets: [
      "Abagurisha bakora inyemezabuguzi muri VUKA irimo amafaranga, ibicuruzwa n'amabwiriza yo kubigeza bigaragarira impande zombi.",
      "Abaguzi bishyura bakoresheje mobile money. Amafaranga avunjwa ku giciro kidahinduka agafungirwa muri escrow — ntabwo ajya mu ishakoshi y'umuntu utazi.",
      "Abagurisha bohereza ibicuruzwa bazi ko amafaranga yashyizweho, mu gihe umuguzi yemeza ko yabonye ibicuruzwa cyangwa igihe cyumvikanyweho kikarangira.",
      "Escrow irekura amafaranga umugurisha akayabikuza kuri mobile money ye, amanota y'icyizere ku mpande zombi agahita avugururwa.",
    ],
    globeAlt: "Umubumbe ugaragaza hejuru ya 156K USDC zishyuwe, amasoko 5 akora, n'intambwe 4 zo kubikuza",
  },
};

function Journey() {
  const c = useLangCopy(JOURNEY_COPY);

  // Scattered green network dots in the background outside the globe/card graphic
  const dots: [string, string][] = [
    ["52%", "8.5%"],
    ["66%", "2.5%"],
    ["71%", "4.5%"],
    ["80%", "7.5%"],
    ["95%", "11%"],
    ["63%", "12.5%"],
    ["84%", "15.5%"],
    ["88%", "20.5%"],
    ["49%", "30.5%"],
    ["90%", "32%"],
    ["86%", "36%"],
    ["97%", "44%"],
    ["93%", "52%"],
    ["46%", "60%"],
    ["99%", "62%"],
    ["96%", "81.5%"],
    ["47%", "91.5%"],
  ];

  return (
    <section id="journey" className="relative scroll-mt-24 overflow-hidden bg-white text-[#151515]">
      {/* Scattered background dots */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {dots.map(([left, top], idx) => (
          <span
            key={idx}
            className="vuka-dot-pulse absolute size-[4px] rounded-full bg-[#79b200]"
            style={{ left, top, animationDelay: `${(idx % 6) * 420}ms` }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid w-full max-w-[1560px] items-center gap-10 px-4 py-16 sm:px-6 lg:min-h-[680px] lg:grid-cols-[1fr_1.15fr] lg:gap-12 lg:px-10 2xl:px-14">
        {/* Left column: Heading and 4 bullet points */}
        <div className="vuka-reveal relative z-10 max-w-xl">
          <h2 className="text-[40px] leading-[1.18] font-bold tracking-[-0.02em] text-[#151515] sm:text-[44px]">
            {c.titleLine1}
            <br />
            {c.titleLine2}
          </h2>
          <ul className="mt-9 space-y-6 text-[16px] leading-[1.6] text-[#222222]">
            {c.bullets.map((b, i) => (
              <li
                key={i}
                className="vuka-reveal flex items-start gap-3 transition-transform duration-300 hover:translate-x-1"
                style={{ "--reveal-delay": `${(i + 1) * 90}ms` } as CSSProperties}
              >
                <span className="mt-[10px] size-[5px] shrink-0 rounded-full bg-[#151515]" aria-hidden="true" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column: Full globe + floating stat cards centered vertically and shifted rightward */}
        <div
          className="vuka-reveal relative flex items-center justify-center lg:justify-end"
          style={{ "--reveal-delay": "150ms" } as CSSProperties}
        >
          <img
            src={escrowGlobe}
            alt={c.globeAlt}
            className="vuka-float-slow block h-auto w-[620px] max-w-full select-none"
          />
        </div>
      </div>
    </section>
  );
}

const ESTIMATOR_COPY = {
  en: {
    title: "See Your Full Cost Before You Pay",
    leadLine1: "Get a firm exchange rate and fee up front — the quote you see",
    leadLine2: "is the quote that locks",
    primaryCta: "Estimate a Payment",
    cards: [
      {
        body: "Send a request here to get a payment quote.",
        cta: "Request a Quote",
        to: "/send",
      },
      {
        body: "Book a demo to see how VUKA protects your trade.",
        cta: "Get a Demo",
        to: "/register",
      },
      {
        body: "Talk to a VUKA expert to help you choose the right plan.",
        cta: "Contact Sales",
        to: "/support",
      },
    ],
  },
  fr: {
    title: "Voyez Votre Coût Total Avant de Payer",
    leadLine1: "Obtenez un taux de change ferme et les frais à l'avance — la cotation affichée",
    leadLine2: "est celle qui est verrouillée",
    primaryCta: "Estimer un Paiement",
    cards: [
      {
        body: "Envoyez une demande ici pour obtenir une cotation de paiement.",
        cta: "Demander une Cotation",
        to: "/send",
      },
      {
        body: "Réservez une démo pour voir comment VUKA protège vos échanges.",
        cta: "Obtenir une Démo",
        to: "/register",
      },
      {
        body: "Parlez à un expert VUKA pour choisir la formule adaptée.",
        cta: "Contacter l'Équipe",
        to: "/support",
      },
    ],
  },
  sw: {
    title: "Ona Gharama Yako Kamili Kabla ya Kulipa",
    leadLine1: "Pata kiwango thabiti cha ubadilishaji na ada mapema — nukuu unayoiona",
    leadLine2: "ndiyo nukuu inayofungwa",
    primaryCta: "Kadiria Malipo",
    cards: [
      {
        body: "Tuma ombi hapa ili kupata nukuu ya malipo.",
        cta: "Omba Nukuu",
        to: "/send",
      },
      {
        body: "Weka miadi ya onyesho uone jinsi VUKA inavyolinda biashara yako.",
        cta: "Pata Onyesho",
        to: "/register",
      },
      {
        body: "Zungumza na mtaalamu wa VUKA akusaidie kuchagua mpango sahihi.",
        cta: "Wasiliana na Mauzo",
        to: "/support",
      },
    ],
  },
  pt: {
    title: "Veja o Custo Total Antes de Pagar",
    leadLine1: "Obtenha uma taxa de câmbio firme e comissão antecipadamente — a cotação que vê",
    leadLine2: "é a cotação que fica garantida",
    primaryCta: "Estimar um Pagamento",
    cards: [
      {
        body: "Envie um pedido aqui para obter uma cotação de pagamento.",
        cta: "Pedir Cotação",
        to: "/send",
      },
      {
        body: "Marque uma demonstração para ver como a VUKA protege o seu comércio.",
        cta: "Ver Demonstração",
        to: "/register",
      },
      {
        body: "Fale com um especialista VUKA para ajudar a escolher o plano ideal.",
        cta: "Contactar Vendas",
        to: "/support",
      },
    ],
  },
  rw: {
    title: "Reba Ikiguzi Cyawe Cyose Mbere yo Kwishyura",
    leadLine1: "Bona igiciro cyo kuvunja n'amafaranga ya serivisi mbere y'igihe — igiciro ubona",
    leadLine2: "ni cyo gifungwa ntigihinduke",
    primaryCta: "Bara Ubwishyu",
    cards: [
      {
        body: "Ohereza ubusabe hano ubone igiciro cy'ubwishyu.",
        cta: "Saba Igiciro",
        to: "/send",
      },
      {
        body: "Saba icyerekezo ubone uko VUKA irinda ubucuruzi bwawe.",
        cta: "Reba Imikorere",
        to: "/register",
      },
      {
        body: "Vugana n'inzobere ya VUKA igufashe guhitamo uburyo bukubereye.",
        cta: "Vugana Natwe",
        to: "/support",
      },
    ],
  },
};

function Estimator() {
  const c = useLangCopy(ESTIMATOR_COPY);

  return (
    <section id="estimate" className="relative scroll-mt-24 overflow-hidden bg-[#f6f6f6] pt-36 pb-3 text-[#151515]">
      {/* Background curved lime arches and dark bottom band */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <svg
          viewBox="0 0 1642 738"
          preserveAspectRatio="none"
          className="size-full"
        >
          {/* Outer pale-lime arch band */}
          <path
            d="M -40 280 Q 821 -10 1682 280 L 1682 738 L -40 738 Z"
            fill="#eef6dd"
            stroke="#9fc84b"
            strokeWidth="1.2"
          />
          {/* Inner bright-lime arch */}
          <path
            d="M -40 448 Q 821 155 1682 448 L 1682 738 L -40 738 Z"
            fill="#c2f74d"
          />
          {/* Green dot on the right between the two curves */}
          <circle cx="1474" cy="364" r="8" fill="#79b200" />
        </svg>
        {/* Bottom dark bar */}
        <div className="absolute inset-x-0 bottom-0 h-[81px] bg-[#151515]" />
      </div>

      {/* Main translucent/frosted center container */}
      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-10 2xl:px-14">
        <div
          className="relative overflow-hidden rounded-t-[8px] border border-b-0 border-[#dcdcdc] px-6 pt-14 pb-0 text-center shadow-[0_18px_50px_rgba(0,0,0,0.06)]"
          style={{
            background:
              "radial-gradient(62% 72% at 50% 68%, rgba(194, 247, 77, 0.72) 0%, rgba(235, 252, 197, 0.78) 48%, rgba(249, 252, 245, 0.96) 82%)",
          }}
        >
          <h2 className="mx-auto max-w-3xl text-[36px] leading-[1.18] font-bold tracking-[-0.02em] text-[#151515] sm:text-[44px]">
            {c.title}
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.6] text-[#222222]">
            {c.leadLine1}
            <br className="hidden sm:inline" /> {c.leadLine2}
          </p>
          <div className="mt-8">
            <Link
              to="/send"
              className="inline-flex h-[54px] w-full max-w-[448px] items-center justify-center rounded-full bg-[#151515] px-8 text-[16px] font-normal text-white transition-opacity hover:opacity-90"
            >
              {c.primaryCta}
            </Link>
          </div>

          {/* 3 bottom white action cards */}
          <div className="mt-14 -mx-6 grid gap-6 sm:mx-0 md:grid-cols-3 md:gap-[33px]">
            {c.cards.map((card, idx) => (
              <div
                key={idx}
                style={{ "--reveal-delay": `${idx * 90}ms` } as CSSProperties}
                className="vuka-reveal vuka-card-lift flex flex-col items-center justify-between rounded-[6px] border border-[#e6e6e6] bg-[#fcfdf9] px-7 pt-9 pb-6 text-center shadow-[0_10px_28px_rgba(0,0,0,0.08)]"
              >
                <p className="max-w-[250px] text-[16px] leading-[1.55] font-normal text-[#151515]">
                  {card.body}
                </p>
                <Link
                  to={card.to}
                  className="mt-6 inline-flex h-[47px] w-full max-w-[255px] items-center justify-center rounded-full border border-[#79b200] bg-white px-6 text-[16px] font-semibold text-[#79b200] transition-colors hover:bg-[#79b200]/5"
                >
                  {card.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const ESCROW_COPY = {
  en: {
    title: "Money Never Moves Silently",
    leadLine1: "Every payment lives in a smart-contract escrow and can only",
    leadLine2: "leave through one of four doors",
    primaryCta: "How Escrow Works",
    learnMore: "Learn More",
    doors: [
      {
        name: "Locked",
        body: "Buyer's funds are committed on-chain against the invoice.",
      },
      {
        name: "Released",
        body: "Delivery confirmed or timeout passed. Supplier is paid.",
      },
      {
        name: "Refunded",
        body: "Order cancelled by agreement. Buyer is made whole.",
      },
      {
        name: "Disputed",
        body: "Funds freeze while arbitration decides the outcome.",
      },
    ],
  },
  fr: {
    title: "L'Argent ne Circule Jamais en Silence",
    leadLine1: "Chaque paiement réside dans un séquestre par contrat intelligent et ne peut",
    leadLine2: "en sortir que par l'une des quatre portes",
    primaryCta: "Fonctionnement du Séquestre",
    learnMore: "En Savoir Plus",
    doors: [
      {
        name: "Bloqué",
        body: "Les fonds de l'acheteur sont engagés sur la chaîne face à la facture.",
      },
      {
        name: "Libéré",
        body: "Livraison confirmée ou délai écoulé. Le fournisseur est payé.",
      },
      {
        name: "Remboursé",
        body: "Commande annulée d'un commun accord. L'acheteur est remboursé.",
      },
      {
        name: "En litige",
        body: "Les fonds sont gelés pendant que l'arbitrage tranche l'issue.",
      },
    ],
  },
  sw: {
    title: "Pesa Haihamishwi Kimya Kimya",
    leadLine1: "Kila malipo hukaa kwenye escrow ya mkataba-erevu na yanaweza",
    leadLine2: "kutoka kupitia mmoja kati ya milango minne tu",
    primaryCta: "Jinsi Escrow Inavyofanya Kazi",
    learnMore: "Jifunze Zaidi",
    doors: [
      {
        name: "Imefungwa",
        body: "Fedha za mnunuzi zimewekwa mtandaoni dhidi ya ankara.",
      },
      {
        name: "Imeachiwa",
        body: "Uwasilishaji umethibitishwa au muda umepita. Muuzaji analipwa.",
      },
      {
        name: "Imerejeshwa",
        body: "Oda imeghairiwa kwa makubaliano. Mnunuzi anarudishiwa pesa zake.",
      },
      {
        name: "Inabishaniwa",
        body: "Fedha huganda wakati usuluhishi ukiamua matokeo.",
      },
    ],
  },
  pt: {
    title: "O Dinheiro Nunca se Move em Silêncio",
    leadLine1: "Cada pagamento reside numa caução por contrato inteligente e só pode",
    leadLine2: "sair por uma de quatro portas",
    primaryCta: "Como Funciona a Caução",
    learnMore: "Saber Mais",
    doors: [
      {
        name: "Bloqueado",
        body: "Os fundos do comprador ficam comprometidos on-chain contra a fatura.",
      },
      {
        name: "Libertado",
        body: "Entrega confirmada ou prazo expirado. O fornecedor é pago.",
      },
      {
        name: "Reembolsado",
        body: "Encomenda cancelada por acordo. O comprador é ressarcido.",
      },
      {
        name: "Em litígio",
        body: "Os fundos congelam enquanto a arbitragem decide o desfecho.",
      },
    ],
  },
  rw: {
    title: "Amafaranga Ntabwo Agenda rwihishwa",
    leadLine1: "Buri bwishyu buba buri muri escrow y'amasezerano ikoranabuhanga kandi",
    leadLine2: "bushobora gusohoka gusa mu miryango ine",
    primaryCta: "Uko Escrow Ikora",
    learnMore: "Menya Byinshi",
    doors: [
      {
        name: "Birafunze",
        body: "Amafaranga y'umuguzi afungiye kuri konti hakurikijwe inyemezabuguzi.",
      },
      {
        name: "Byarekuwe",
        body: " Ibicuruzwa byagezeyo cyangwa igihe cyarenze. Umugurisha arishyurwa.",
      },
      {
        name: "Byasubijwe",
        body: "Ibicuruzwa byahagaritswe ku bwumvikane. Umuguzi asubizwa aye.",
      },
      {
        name: "Biri mu mpaka",
        body: "Amafaranga arahagarikwa mu gihe ubukemurampaka bufata umwanzuro.",
      },
    ],
  },
};

function EscrowExplained() {
  const c = useLangCopy(ESCROW_COPY);

  return (
    <section id="escrow" className="scroll-mt-24 bg-[#f6f6f6] pt-20 pb-28 text-[#151515]">
      <div className="mx-auto w-full max-w-[1560px] px-4 text-center sm:px-6 lg:px-10 2xl:px-14">
        <div className="vuka-reveal">
          <h2 className="text-[36px] leading-[1.18] font-bold tracking-[-0.02em] text-[#151515] sm:text-[44px]">
            {c.title}
          </h2>
          <p className="mx-auto mt-5 max-w-[580px] text-[16px] leading-[1.6] text-[#222222]">
            {c.leadLine1}
            <br className="hidden sm:inline" /> {c.leadLine2}
          </p>
          <div className="mt-9">
            <Link
              to="/escrow"
              className="inline-flex h-[55px] w-full max-w-[448px] items-center justify-center rounded-full bg-[#151515] px-8 text-[16px] font-normal text-white transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg"
            >
              {c.primaryCta}
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[36px]">
          {c.doors.map((d, idx) => (
            <div
              key={idx}
              style={{ "--reveal-delay": `${idx * 90}ms` } as CSSProperties}
              className="vuka-reveal vuka-card-lift flex min-h-[250px] flex-col items-center justify-between rounded-[6px] border border-[#ebebeb] bg-white px-5 pt-9 pb-6 text-center shadow-[0_12px_32px_rgba(0,0,0,0.05)]"
            >
              <div>
                <h3 className="text-[22px] leading-snug font-bold text-[#79b200]">{d.name}</h3>
                <p className="mt-3.5 text-[15px] leading-[1.55] text-[#151515]">{d.body}</p>
              </div>
              <Link
                to="/escrow"
                className="mt-6 inline-flex h-[47px] w-full max-w-[204px] items-center justify-center rounded-full border border-[#79b200] bg-white px-5 text-[15px] font-semibold text-[#79b200] transition-colors hover:bg-[#79b200]/5"
              >
                {c.learnMore}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const SCORE_MIN = 300;
const SCORE_MAX = 850;

type TrustBandInfo = {
  min: number;
  band: "A+" | "A" | "B" | "C";
  label: string;
  deposit: string;
  window: string;
  limit: string;
  desc: string;
};

type TrustPreset = {
  id: string;
  name: string;
  corridor: string;
  tag: string;
  onTime: number;
  invoices: number;
  disputes: number;
  months: number;
  partners: number;
};

const TRUST_COPY = {
  en: {
    eyebrowPill: "Algorithmic Trust Engine",
    title: "A Credit Score Earned From Settlements, Never Self-Reported",
    intro:
      "Every completed escrow updates your deterministic trade-credit certificate. Test real trader profiles or move the telemetry sliders to see how settlement behaviour unlocks lower deposits and faster releases.",
    formulaHeading: "Published Deterministic Formula",
    formulaText: "Score = 300 + 550 × Σ(Weight × Value × Evidence)",
    simulateProfile: "Simulate profile:",
    inputsTitle: "Settlement Telemetry Inputs",
    inputsSub: "Drag any slider to recompute the ledger score in real time",
    totalCycles: (n: number) => `${n} total cycles`,
    sliders: {
      onTime: { label: "Escrows released on time", unit: "releases" },
      invoices: { label: "Invoice-backed payments settled", unit: "invoices" },
      disputes: { label: "Disputes or reversals raised against you", unit: "disputes" },
      months: { label: "Active months trading on VUKA", unit: "months" },
      partners: { label: "Verified corridor counterparties", unit: "partners" },
    },
    factors: {
      cycles: { label: "Escrow completion rate", short: "Cycles" },
      disputes: { label: "Dispute-free record", short: "Clean" },
      invoices: { label: "Invoice-linked discipline", short: "Invoices" },
      volume: { label: "Trading tenure & cadence", short: "Cadence" },
      diversity: { label: "Counterparty diversity", short: "Partners" },
    },
    leverHeading: "Highest-Impact Score Lever",
    leverPrefix: "Strengthening this factor unlocks up to",
    leverPts: (n: number) => `+${n} pts`,
    leverSuffix: "toward the 850 ceiling.",
    inspectFormula: "Inspect formula →",
    certTitle: "VUKA TRADE-CREDIT CERTIFICATE",
    certSub: "Live counterparty preview · SHA-256 verifiable",
    zeroProxies: "0 Identity Proxies",
    composite: "COMPOSITE",
    bandBadge: (band: string, label: string) => `Band ${band} · ${label}`,
    floorLabel: "300 FLOOR",
    ceilingLabel: "850 CEILING",
    radarAria: "Five-factor trust score radar",
    weightedLegend: "Weighted",
    rawFactorLegend: "Raw factor",
    breakdownHeading: "Factor Attribution Breakdown",
    earnedMaxPts: "Earned / Max pts",
    weightUnit: "wt",
    ptsUnit: "pts",
    termsUnlocked: (label: string) => `Counterparty Terms Unlocked (${label})`,
    bandShort: (band: string) => `Band ${band}`,
    upfrontAsk: "Upfront Ask",
    autoRelease: "Auto-Release",
    corridorTier: "Corridor Tier",
    bands: [
      {
        min: 760,
        band: "A+",
        label: "Strong",
        deposit: "0–10% deposit",
        window: "24h release",
        limit: "$25,000 / tx",
        desc: "Proven settlement record across corridors. Counterparties extend open terms with confidence.",
      },
      {
        min: 660,
        band: "A",
        label: "Established",
        deposit: "15% deposit",
        window: "48h release",
        limit: "$10,000 / tx",
        desc: "Consistent on-time escrow releases and low reversal rate across repeat trade cycles.",
      },
      {
        min: 520,
        band: "B",
        label: "Building",
        deposit: "30% deposit",
        window: "5-day release",
        limit: "$2,500 / tx",
        desc: "Early ledger track record. Each completed invoice cycle raises evidence confidence.",
      },
      {
        min: 0,
        band: "C",
        label: "New",
        deposit: "50% deposit",
        window: "7-day release",
        limit: "$500 / tx",
        desc: "Starting baseline before sufficient on-chain and ledger settlement evidence accumulates.",
      },
    ] satisfies TrustBandInfo[],
    presets: [
      {
        id: "established",
        name: "Kigali Textiles exporter",
        corridor: "RW → KE · 48 cycles",
        tag: "Established exporter",
        onTime: 48,
        invoices: 22,
        disputes: 1,
        months: 14,
        partners: 9,
      },
      {
        id: "rising",
        name: "Nairobi Coffee buyer",
        corridor: "KE → UG · 16 cycles",
        tag: "Rising SME",
        onTime: 16,
        invoices: 8,
        disputes: 1,
        months: 5,
        partners: 4,
      },
      {
        id: "new",
        name: "First-time cross-border trader",
        corridor: "RW → TZ · 3 cycles",
        tag: "New trader",
        onTime: 3,
        invoices: 2,
        disputes: 0,
        months: 1,
        partners: 2,
      },
      {
        id: "friction",
        name: "High-dispute supplier",
        corridor: "UG → KE · 24 cycles",
        tag: "Dispute friction",
        onTime: 19,
        invoices: 9,
        disputes: 6,
        months: 8,
        partners: 3,
      },
    ] satisfies TrustPreset[],
  },
  fr: {
    eyebrowPill: "Moteur de Confiance Algorithmique",
    title: "Un Score de Crédit Gagné par les Règlements, Jamais Auto-Déclaré",
    intro:
      "Chaque séquestre finalisé met à jour votre certificat déterministe de crédit commercial. Testez des profils réels ou déplacez les curseurs pour voir comment vos règlements débloquent des acomptes réduits et des libérations plus rapides.",
    formulaHeading: "Formule Déterministe Publiée",
    formulaText: "Score = 300 + 550 × Σ(Poids × Valeur × Preuve)",
    simulateProfile: "Simuler un profil :",
    inputsTitle: "Paramètres de Télémétrie des Règlements",
    inputsSub: "Faites glisser un curseur pour recalculer le score du registre en temps réel",
    totalCycles: (n: number) => `${n} cycles au total`,
    sliders: {
      onTime: { label: "Séquestres libérés à temps", unit: "libérations" },
      invoices: { label: "Paiements adossés à des factures réglés", unit: "factures" },
      disputes: { label: "Litiges ou annulations ouverts contre vous", unit: "litiges" },
      months: { label: "Mois d'activité commerciale sur VUKA", unit: "mois" },
      partners: { label: "Contreparties de corridor vérifiées", unit: "partenaires" },
    },
    factors: {
      cycles: { label: "Taux de finalisation des séquestres", short: "Cycles" },
      disputes: { label: "Historique sans litige", short: "Intégrité" },
      invoices: { label: "Discipline liée aux factures", short: "Factures" },
      volume: { label: "Ancienneté et cadence d'échange", short: "Cadence" },
      diversity: { label: "Diversité des contreparties", short: "Partenaires" },
    },
    leverHeading: "Levier à Plus Fort Impact",
    leverPrefix: "Renforcer ce facteur débloque jusqu'à",
    leverPts: (n: number) => `+${n} pts`,
    leverSuffix: "vers le plafond de 850.",
    inspectFormula: "Voir la formule →",
    certTitle: "CERTIFICAT DE CRÉDIT COMMERCIAL VUKA",
    certSub: "Aperçu contrepartie en direct · Vérifiable par SHA-256",
    zeroProxies: "0 Proxy d'Identité",
    composite: "COMPOSITE",
    bandBadge: (band: string, label: string) => `Tranche ${band} · ${label}`,
    floorLabel: "300 PLANCHER",
    ceilingLabel: "850 PLAFOND",
    radarAria: "Radar du score de confiance à cinq facteurs",
    weightedLegend: "Pondéré",
    rawFactorLegend: "Facteur brut",
    breakdownHeading: "Répartition par Facteur",
    earnedMaxPts: "Acquis / Max pts",
    weightUnit: "pds",
    ptsUnit: "pts",
    termsUnlocked: (label: string) => `Conditions Contrepartie Débloquées (${label})`,
    bandShort: (band: string) => `Tranche ${band}`,
    upfrontAsk: "Acompte Requis",
    autoRelease: "Libération Auto",
    corridorTier: "Plafond Corridor",
    bands: [
      {
        min: 760,
        band: "A+",
        label: "Solide",
        deposit: "Acompte 0–10 %",
        window: "Libération 24h",
        limit: "25 000 $ / tx",
        desc: "Historique de règlement prouvé entre corridors. Les contreparties accordent des conditions souples en confiance.",
      },
      {
        min: 660,
        band: "A",
        label: "Établi",
        deposit: "Acompte 15 %",
        window: "Libération 48h",
        limit: "10 000 $ / tx",
        desc: "Libérations de séquestre ponctuelles et faible taux de litige sur des cycles répétés.",
      },
      {
        min: 520,
        band: "B",
        label: "En progression",
        deposit: "Acompte 30 %",
        window: "Libération 5 j",
        limit: "2 500 $ / tx",
        desc: "Premières références inscrites au registre. Chaque cycle de facture complété renforce la preuve.",
      },
      {
        min: 0,
        band: "C",
        label: "Nouveau",
        deposit: "Acompte 50 %",
        window: "Libération 7 j",
        limit: "500 $ / tx",
        desc: "Niveau de départ avant l'accumulation suffisante de preuves de règlement sur la chaîne et le registre.",
      },
    ] satisfies TrustBandInfo[],
    presets: [
      {
        id: "established",
        name: "Exportateur textile de Kigali",
        corridor: "RW → KE · 48 cycles",
        tag: "Exportateur établi",
        onTime: 48,
        invoices: 22,
        disputes: 1,
        months: 14,
        partners: 9,
      },
      {
        id: "rising",
        name: "Acheteur de café à Nairobi",
        corridor: "KE → UG · 16 cycles",
        tag: "PME en croissance",
        onTime: 16,
        invoices: 8,
        disputes: 1,
        months: 5,
        partners: 4,
      },
      {
        id: "new",
        name: "Nouveau commerçant transfrontalier",
        corridor: "RW → TZ · 3 cycles",
        tag: "Nouveau commerçant",
        onTime: 3,
        invoices: 2,
        disputes: 0,
        months: 1,
        partners: 2,
      },
      {
        id: "friction",
        name: "Fournisseur à litiges fréquents",
        corridor: "UG → KE · 24 cycles",
        tag: "Friction de litiges",
        onTime: 19,
        invoices: 9,
        disputes: 6,
        months: 8,
        partners: 3,
      },
    ] satisfies TrustPreset[],
  },
  sw: {
    eyebrowPill: "Injini ya Imani ya Kanuni",
    title: "Alama ya Mkopo Inayopatikana Kutokana na Malipo Halisi, Si Kujitangaza",
    intro:
      "Kila escrow inayokamilika husasisha cheti chako cha mkopo wa biashara. Jaribu wasifu halisi wa wafanyabiashara au sogeza vitelezi ili kuona jinsi ulipaji mzuri unavyofungua amana ndogo na kuachiliwa haraka.",
    formulaHeading: "Kanuni Wazi Iliyochapishwa",
    formulaText: "Alama = 300 + 550 × Σ(Uzito × Thamani × Ushahidi)",
    simulateProfile: "Iga wasifu:",
    inputsTitle: "Vipimo vya Takwimu za Malipo",
    inputsSub: "Vuta kitelezi chochote ili kukokotoa upya alama ya leja papo hapo",
    totalCycles: (n: number) => `mizunguko ${n} jumla`,
    sliders: {
      onTime: { label: "Escrow zilizoachiwa kwa wakati", unit: "malipo" },
      invoices: { label: "Malipo yenye ankara yaliyokamilika", unit: "ankara" },
      disputes: { label: "Migogoro au marejesho dhidi yako", unit: "migogoro" },
      months: { label: "Miezi hai ukifanya biashara VUKA", unit: "miezi" },
      partners: { label: "Washirika wa biashara waliothibitishwa", unit: "washirika" },
    },
    factors: {
      cycles: { label: "Kiwango cha ukamilishaji wa escrow", short: "Mizunguko" },
      disputes: { label: "Rekodi isiyo na migogoro", short: "Usafi" },
      invoices: { label: "Nidhamu ya malipo ya ankara", short: "Ankara" },
      volume: { label: "Muda na mzunguko wa biashara", short: "Mfululizo" },
      diversity: { label: "Mtawanyiko wa washirika", short: "Washirika" },
    },
    leverHeading: "Kichocheo Chenye Athari Kubwa Zaidi",
    leverPrefix: "Kuimarisha kipengele hiki kunafungua hadi",
    leverPts: (n: number) => `+pointi ${n}`,
    leverSuffix: "kuelekea ukomo wa 850.",
    inspectFormula: "Kagua kanuni →",
    certTitle: "CHETI CHA MKOPO WA BIASHARA CHA VUKA",
    certSub: "Mwonekano mubashara wa mshirika · Inathibitishwa kwa SHA-256",
    zeroProxies: "0 Upendeleo wa Utambulisho",
    composite: "JUMLA",
    bandBadge: (band: string, label: string) => `Daraja ${band} · ${label}`,
    floorLabel: "300 CHINI",
    ceilingLabel: "850 JUU",
    radarAria: "Rada ya vipengele vitano vya alama ya imani",
    weightedLegend: "Iliyopimwa",
    rawFactorLegend: "Kipengele ghafi",
    breakdownHeading: "Mgawanyo wa Alama kwa Kipengele",
    earnedMaxPts: "Zilizopatikana / Upeo",
    weightUnit: "uzito",
    ptsUnit: "pt",
    termsUnlocked: (label: string) => `Masharti ya Biashara Yaliyofunguliwa (${label})`,
    bandShort: (band: string) => `Daraja ${band}`,
    upfrontAsk: "Amana ya Awali",
    autoRelease: "Kuachia Otomatiki",
    corridorTier: "Kiwango cha Njia",
    bands: [
      {
        min: 760,
        band: "A+",
        label: "Imara",
        deposit: "Amana 0–10%",
        window: "Kuachia saa 24",
        limit: "$25,000 / muamala",
        desc: "Rekodi iliyothibitishwa ya malipo kuvuka mipaka. Washirika hutoa masharti nafuu kwa ujasiri.",
      },
      {
        min: 660,
        band: "A",
        label: "Thabiti",
        deposit: "Amana 15%",
        window: "Kuachia saa 48",
        limit: "$10,000 / muamala",
        desc: "Uachiaji wa escrow kwa wakati na kiwango kidogo cha migogoro katika mizunguko ya biashara.",
      },
      {
        min: 520,
        band: "B",
        label: "Inajengeka",
        deposit: "Amana 30%",
        window: "Kuachia siku 5",
        limit: "$2,500 / muamala",
        desc: "Rekodi ya awali kwenye leja. Kila mzunguko wa ankara unaokamilika huongeza uzito wa ushahidi.",
      },
      {
        min: 0,
        band: "C",
        label: "Mpya",
        deposit: "Amana 50%",
        window: "Kuachia siku 7",
        limit: "$500 / muamala",
        desc: "Msingi wa kuanzia kabla ya ushahidi wa kutosha wa malipo kukusanyika kwenye mnyororo na leja.",
      },
    ] satisfies TrustBandInfo[],
    presets: [
      {
        id: "established",
        name: "Msafirishaji nguo wa Kigali",
        corridor: "RW → KE · mizunguko 48",
        tag: "Msafirishaji thabiti",
        onTime: 48,
        invoices: 22,
        disputes: 1,
        months: 14,
        partners: 9,
      },
      {
        id: "rising",
        name: "Mnunuzi wa kahawa Nairobi",
        corridor: "KE → UG · mizunguko 16",
        tag: "Biashara inayokua",
        onTime: 16,
        invoices: 8,
        disputes: 1,
        months: 5,
        partners: 4,
      },
      {
        id: "new",
        name: "Mfanyabiashara mpya wa mipakani",
        corridor: "RW → TZ · mizunguko 3",
        tag: "Mfanyabiashara mpya",
        onTime: 3,
        invoices: 2,
        disputes: 0,
        months: 1,
        partners: 2,
      },
      {
        id: "friction",
        name: "Muuzaji mwenye migogoro mingi",
        corridor: "UG → KE · mizunguko 24",
        tag: "Msuguano wa migogoro",
        onTime: 19,
        invoices: 9,
        disputes: 6,
        months: 8,
        partners: 3,
      },
    ] satisfies TrustPreset[],
  },
  pt: {
    eyebrowPill: "Motor Algorítmico de Confiança",
    title: "Uma Pontuação de Crédito Conquistada em Liquidações, Nunca Autodeclarada",
    intro:
      "Cada caução concluída atualiza o seu certificado determinístico de crédito comercial. Teste perfis reais de comerciantes ou ajuste os controlos para ver como o histórico de liquidação desbloqueia depósitos menores e libertações mais rápidas.",
    formulaHeading: "Fórmula Determinística Publicada",
    formulaText: "Pontuação = 300 + 550 × Σ(Peso × Valor × Evidência)",
    simulateProfile: "Simular perfil:",
    inputsTitle: "Entradas de Telemetria de Liquidação",
    inputsSub: "Arraste qualquer controlo para recalcular a pontuação do razão em tempo real",
    totalCycles: (n: number) => `${n} ciclos totais`,
    sliders: {
      onTime: { label: "Cauções libertadas dentro do prazo", unit: "libertações" },
      invoices: { label: "Pagamentos com fatura liquidados", unit: "faturas" },
      disputes: { label: "Litígios ou estornos abertos contra si", unit: "litígios" },
      months: { label: "Meses ativos a negociar na VUKA", unit: "meses" },
      partners: { label: "Contrapartes verificadas no corredor", unit: "parceiros" },
    },
    factors: {
      cycles: { label: "Taxa de conclusão de cauções", short: "Ciclos" },
      disputes: { label: "Histórico sem litígios", short: "Limpo" },
      invoices: { label: "Disciplina associada a faturas", short: "Faturas" },
      volume: { label: "Antiguidade e cadência comercial", short: "Cadência" },
      diversity: { label: "Diversidade de contrapartes", short: "Parceiros" },
    },
    leverHeading: "Alavanca de Maior Impacto",
    leverPrefix: "Reforçar este fator desbloqueia até",
    leverPts: (n: number) => `+${n} pts`,
    leverSuffix: "rumo ao teto de 850.",
    inspectFormula: "Inspecionar fórmula →",
    certTitle: "CERTIFICADO DE CRÉDITO COMERCIAL VUKA",
    certSub: "Pré-visualização em tempo real · Verificável por SHA-256",
    zeroProxies: "0 Proxies de Identidade",
    composite: "COMPOSTO",
    bandBadge: (band: string, label: string) => `Escalão ${band} · ${label}`,
    floorLabel: "300 MÍNIMO",
    ceilingLabel: "850 MÁXIMO",
    radarAria: "Radar de pontuação de confiança de cinco fatores",
    weightedLegend: "Ponderado",
    rawFactorLegend: "Fator bruto",
    breakdownHeading: "Decomposição por Fator",
    earnedMaxPts: "Ganhos / Máx pts",
    weightUnit: "peso",
    ptsUnit: "pts",
    termsUnlocked: (label: string) => `Condições Comerciais Desbloqueadas (${label})`,
    bandShort: (band: string) => `Escalão ${band}`,
    upfrontAsk: "Sinal Inicial",
    autoRelease: "Libertação Auto",
    corridorTier: "Limite Corredor",
    bands: [
      {
        min: 760,
        band: "A+",
        label: "Forte",
        deposit: "Sinal 0–10%",
        window: "Libertação 24h",
        limit: "$25.000 / tx",
        desc: "Histórico comprovado entre corredores. As contrapartes concedem condições abertas com confiança.",
      },
      {
        min: 660,
        band: "A",
        label: "Estabelecido",
        deposit: "Sinal 15%",
        window: "Libertação 48h",
        limit: "$10.000 / tx",
        desc: "Libertações de caução pontuais e baixa taxa de reversão em ciclos comerciais repetidos.",
      },
      {
        min: 520,
        band: "B",
        label: "Em construção",
        deposit: "Sinal 30%",
        window: "Libertação 5 dias",
        limit: "$2.500 / tx",
        desc: "Histórico inicial no razão. Cada ciclo de fatura concluído eleva a confiança da evidência.",
      },
      {
        min: 0,
        band: "C",
        label: "Novo",
        deposit: "Sinal 50%",
        window: "Libertação 7 dias",
        limit: "$500 / tx",
        desc: "Base inicial antes de acumular evidência suficiente de liquidação on-chain e no razão.",
      },
    ] satisfies TrustBandInfo[],
    presets: [
      {
        id: "established",
        name: "Exportador têxtil de Kigali",
        corridor: "RW → KE · 48 ciclos",
        tag: "Exportador estabelecido",
        onTime: 48,
        invoices: 22,
        disputes: 1,
        months: 14,
        partners: 9,
      },
      {
        id: "rising",
        name: "Comprador de café de Nairobi",
        corridor: "KE → UG · 16 ciclos",
        tag: "PME em ascensão",
        onTime: 16,
        invoices: 8,
        disputes: 1,
        months: 5,
        partners: 4,
      },
      {
        id: "new",
        name: "Comerciante transfronteiriço estreante",
        corridor: "RW → TZ · 3 ciclos",
        tag: "Novo comerciante",
        onTime: 3,
        invoices: 2,
        disputes: 0,
        months: 1,
        partners: 2,
      },
      {
        id: "friction",
        name: "Fornecedor com litígios frequentes",
        corridor: "UG → KE · 24 ciclos",
        tag: "Fricção de litígios",
        onTime: 19,
        invoices: 9,
        disputes: 6,
        months: 8,
        partners: 3,
      },
    ] satisfies TrustPreset[],
  },
  rw: {
    eyebrowPill: "Moteri y'Icyizere Igenzurwa n'Imibare",
    title: "Amanota y'Inguzanyo Ava mu Kwishyurana Nyabyo, Ntiyishyirwaho",
    intro:
      "Buri escrow irangiye ivugurura icyemezo cyawe cy'icyizere mu bucuruzi. Gerageza imyirondoro y'abacuruzi cyangwa usunike ibipimo urebe uko kwishyurana neza bigabanya ubwishingizi bugasaba kurekura amafaranga vuba.",
    formulaHeading: "Inzira y'Imibare Igaragarira Bose",
    formulaText: "Amanota = 300 + 550 × Σ(Uburemere × Agaciro × Gihamya)",
    simulateProfile: "Gerageza umwirondoro:",
    inputsTitle: "Ibipimo by'Imikorere y'Ubwishyu",
    inputsSub: "Sunika igipimo icyo ari cyo cyose ubare amanota ako kanya",
    totalCycles: (n: number) => `inshuro ${n} zose hamwe`,
    sliders: {
      onTime: { label: "Escrow zarekuwe ku gihe", unit: "inshuro" },
      invoices: { label: "Ubwishyu bufite inyemezabuguzi bwarangiye", unit: "inyemezabuguzi" },
      disputes: { label: "Impaka cyangwa gusubiza amafaranga byakubayeho", unit: "impaka" },
      months: { label: "Amezi ukora ubucuruzi kuri VUKA", unit: "amezi" },
      partners: { label: "Abafatanyabikorwa bemejwe mu nzira z'ubwishyu", unit: "abafatanyabikorwa" },
    },
    factors: {
      cycles: { label: "Igipimo cyo kurangiza escrow", short: "Inshuro" },
      disputes: { label: "Amateka atarangwamo impaka", short: "Ubunyangamugayo" },
      invoices: { label: "Ikoreshwa ry'inyemezabuguzi", short: "Inyemezabuguzi" },
      volume: { label: "Igihe n'umuvuduko w'ubucuruzi", short: "Umuvuduko" },
      diversity: { label: "Umubare w'abo mukorana", short: "Abafatanya" },
    },
    leverHeading: "Igice Cyongera Amanota kurusha Ibindi",
    leverPrefix: "Kunoza iki gice bishobora kongeraho kugera kuri",
    leverPts: (n: number) => `+amanota ${n}`,
    leverSuffix: "ugana ku gisenge cya 850.",
    inspectFormula: "Reba imibare →",
    certTitle: "ICYEMEZO CY'ICYIZERE MU BUCURUZI CYA VUKA",
    certSub: " uko bigaragara ku bo mukorana · Byemezwa na SHA-256",
    zeroProxies: "Nta Marangamutima y'Umwirondoro",
    composite: "AMANOTA YOSE",
    bandBadge: (band: string, label: string) => `Icyiciro ${band} · ${label}`,
    floorLabel: "300 HASI",
    ceilingLabel: "850 HEJURU",
    radarAria: "Igishushanyo cy'ingingo eshanu z'amanota y'icyizere",
    weightedLegend: "Byahawe uburemere",
    rawFactorLegend: "Igipimo cy'ibanze",
    breakdownHeading: " uko Amanota Agabanyije mu Ngingo",
    earnedMaxPts: "Yabonetse / Yose",
    weightUnit: "uburemere",
    ptsUnit: "amanota",
    termsUnlocked: (label: string) => `Amabwiriza y'Ubucuruzi Yafunguwe (${label})`,
    bandShort: (band: string) => `Icyiciro ${band}`,
    upfrontAsk: "Avansi Isabwa",
    autoRelease: "Kurekura Byikora",
    corridorTier: "Urwego rw'Ubwishyu",
    bands: [
      {
        min: 760,
        band: "A+",
        label: "Akomeye",
        deposit: "0–10% avansi",
        window: "Kurekura amasaha 24",
        limit: "$25,000 / ubwishyu",
        desc: "Amateka yizewe yo kwishyurana hagati y'ibihugu. Abafatanyabikorwa batanga amabwiriza yoroshye bafite icyizere.",
      },
      {
        min: 660,
        band: "A",
        label: "Yizewe",
        deposit: "15% avansi",
        window: "Kurekura amasaha 48",
        limit: "$10,000 / ubwishyu",
        desc: "Kurekura escrow ku gihe n'impaka nke mu bucuruzi buhoraho.",
      },
      {
        min: 520,
        band: "B",
        label: "Arimo Kubakwa",
        deposit: "30% avansi",
        window: "Kurekura iminsi 5",
        limit: "$2,500 / ubwishyu",
        desc: "Intangiriro nziza mu gitabo cy'ibaruramari. Buri nyemezabuguzi irangiye izamura icyizere.",
      },
      {
        min: 0,
        band: "C",
        label: "Mushya",
        deposit: "50% avansi",
        window: "Kurekura iminsi 7",
        limit: "$500 / ubwishyu",
        desc: "Urwego rw'intangiriro mbere y'uko ibimenyetso bihagije by'ubwishyu bikusanywa.",
      },
    ] satisfies TrustBandInfo[],
    presets: [
      {
        id: "established",
        name: "Uwohereza imyenda mu mahanga i Kigali",
        corridor: "RW → KE · inshuro 48",
        tag: "Uwohereza ibicuruzwa wizewe",
        onTime: 48,
        invoices: 22,
        disputes: 1,
        months: 14,
        partners: 9,
      },
      {
        id: "rising",
        name: "Umuguzi w'ikawa i Nairobi",
        corridor: "KE → UG · inshuro 16",
        tag: "Ubucuruzi burimo kuzamuka",
        onTime: 16,
        invoices: 8,
        disputes: 1,
        months: 5,
        partners: 4,
      },
      {
        id: "new",
        name: "Umucuruzi mushya wambukiranya imipaka",
        corridor: "RW → TZ · inshuro 3",
        tag: "Umucuruzi mushya",
        onTime: 3,
        invoices: 2,
        disputes: 0,
        months: 1,
        partners: 2,
      },
      {
        id: "friction",
        name: "Umugurisha ugira impaka nyinshi",
        corridor: "UG → KE · inshuro 24",
        tag: "Impaka mu bucuruzi",
        onTime: 19,
        invoices: 9,
        disputes: 6,
        months: 8,
        partners: 3,
      },
    ] satisfies TrustPreset[],
  },
};

interface RadarFactor {
  key: string;
  label: string;
  short: string;
  weight: number;
  value: number;
  confidence: number;
  points: number;
  maxPoints: number;
}

/** 5-axis SVG radar polygon + precision arc dial for the interactive Trust Score Lab. */
function TrustRadarDial({
  score,
  band,
  factors,
}: {
  score: number;
  band: TrustBandInfo;
  factors: RadarFactor[];
}) {
  const c = useLangCopy(TRUST_COPY);
  const pct = Math.max(0, Math.min((score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN), 1));
  const arcR = 78;
  const arcC = 2 * Math.PI * arcR;
  // 250-degree speedometer sweep
  const sweep = arcC * (250 / 360);
  const dashOffset = sweep * (1 - pct);

  // 5-axis radar geometry
  const rCx = 95;
  const rCy = 95;
  const rMax = 66;
  const axisPoint = (i: number, radiusRatio: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / factors.length;
    return [rCx + Math.cos(angle) * rMax * radiusRatio, rCy + Math.sin(angle) * rMax * radiusRatio] as const;
  };

  const ceilingPts = factors.map((_, i) => axisPoint(i, 1).join(",")).join(" ");
  const midPts = factors.map((_, i) => axisPoint(i, 0.6).join(",")).join(" ");
  const innerPts = factors.map((_, i) => axisPoint(i, 0.3).join(",")).join(" ");
  const effectivePts = factors
    .map((f, i) => axisPoint(i, Math.max(0.08, (f.value / 100) * f.confidence)).join(","))
    .join(" ");
  const rawPts = factors
    .map((f, i) => axisPoint(i, Math.max(0.08, f.value / 100)).join(","))
    .join(" ");

  return (
    <div className="grid items-center gap-6 sm:grid-cols-2">
      {/* Left: Precision 250° speedometer dial */}
      <div className="relative mx-auto flex flex-col items-center">
        <div className="relative size-48">
          <svg viewBox="0 0 200 200" className="size-full">
            <defs>
              <linearGradient id="trust-dial-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#79b200" />
                <stop offset="100%" stopColor="#c2f74d" />
              </linearGradient>
            </defs>
            {/* Outer subtle tick ring */}
            {Array.from({ length: 21 }).map((_, idx) => {
              const deg = 145 + (idx / 20) * 250;
              const rad = (deg * Math.PI) / 180;
              const active = idx / 20 <= pct;
              const x1 = 100 + Math.cos(rad) * 90;
              const y1 = 100 + Math.sin(rad) * 90;
              const x2 = 100 + Math.cos(rad) * (idx % 5 === 0 ? 83 : 86);
              const y2 = 100 + Math.sin(rad) * (idx % 5 === 0 ? 83 : 86);
              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={active ? "#c2f74d" : "rgba(255,255,255,0.16)"}
                  strokeWidth={idx % 5 === 0 ? 2 : 1.2}
                  strokeLinecap="round"
                />
              );
            })}
            {/* Background track arc */}
            <circle
              cx={100}
              cy={100}
              r={arcR}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={`${sweep} ${arcC}`}
              transform="rotate(145 100 100)"
            />
            {/* Active lime arc */}
            <circle
              cx={100}
              cy={100}
              r={arcR}
              fill="none"
              stroke="url(#trust-dial-grad)"
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={`${sweep} ${arcC}`}
              strokeDashoffset={dashOffset}
              transform="rotate(145 100 100)"
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <span className="font-mono text-[10px] tracking-[0.22em] text-white/50 uppercase">
              {c.composite}
            </span>
            <span className="mt-0.5 font-mono text-5xl font-bold tracking-tight text-white tabular-nums">
              {score}
            </span>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#c2f74d]/40 bg-[#c2f74d]/15 px-3 py-0.5 font-mono text-[11px] font-semibold text-[#c2f74d]">
              <span className="size-1.5 rounded-full bg-[#c2f74d]" />
              {c.bandBadge(band.band, band.label)}
            </div>
          </div>
        </div>
        <div className="mt-1 flex w-40 justify-between font-mono text-[10px] text-white/45">
          <span>{c.floorLabel}</span>
          <span>{c.ceilingLabel}</span>
        </div>
      </div>

      {/* Right: 5-axis telemetry radar */}
      <div className="relative mx-auto flex flex-col items-center">
        <svg viewBox="0 0 190 190" className="size-48 overflow-visible" role="img" aria-label={c.radarAria}>
          <polygon points={ceilingPts} fill="none" stroke="rgba(255,255,255,0.16)" strokeDasharray="3 3" strokeWidth="1" />
          <polygon points={midPts} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <polygon points={innerPts} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          {factors.map((f, i) => {
            const [ex, ey] = axisPoint(i, 1);
            const [lx, ly] = axisPoint(i, 1.24);
            return (
              <g key={f.key}>
                <line x1={rCx} y1={rCy} x2={ex} y2={ey} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white/65 font-mono text-[9px] uppercase"
                >
                  {f.short}
                </text>
              </g>
            );
          })}
          {/* Raw performance outline */}
          <polygon
            points={rawPts}
            fill="none"
            stroke="rgba(194,247,77,0.4)"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            className="transition-all duration-300"
          />
          {/* Evidence-weighted effective polygon */}
          <polygon
            points={effectivePts}
            fill="rgba(194,247,77,0.22)"
            stroke="#c2f74d"
            strokeWidth="2"
            className="transition-all duration-300"
          />
          {factors.map((f, i) => {
            const [px, py] = axisPoint(i, Math.max(0.08, (f.value / 100) * f.confidence));
            return <circle key={f.key} cx={px} cy={py} r={3} fill="#c2f74d" className="transition-all duration-300" />;
          })}
        </svg>
        <div className="mt-1 flex items-center gap-4 font-mono text-[10px] text-white/55">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-xs bg-[#c2f74d]" /> {c.weightedLegend}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-t border-dashed border-[#c2f74d]/60" /> {c.rawFactorLegend}
          </span>
        </div>
      </div>
    </div>
  );
}

function TrustLab() {
  const c = useLangCopy(TRUST_COPY);
  const [activePreset, setActivePreset] = useState<string>("established");
  const [onTime, setOnTime] = useState([48]);
  const [invoices, setInvoices] = useState([22]);
  const [disputes, setDisputes] = useState([1]);
  const [months, setMonths] = useState([14]);
  const [partners, setPartners] = useState([9]);

  const applyPreset = (p: TrustPreset) => {
    setActivePreset(p.id);
    setOnTime([p.onTime]);
    setInvoices([p.invoices]);
    setDisputes([p.disputes]);
    setMonths([p.months]);
    setPartners([p.partners]);
  };

  // Exact 5-factor deterministic formula mirroring the VUKA credit engine:
  // score = 300 + 550 * sum(weight * value * confidence) / 10000
  const { score, factors, band, nextUnlock } = useMemo(() => {
    const ot = onTime[0] ?? 0;
    const inv = invoices[0] ?? 0;
    const disp = disputes[0] ?? 0;
    const mo = months[0] ?? 0;
    const part = partners[0] ?? 0;
    const totalCycles = ot + disp;

    // 1. Settlement completion (weight 30%)
    const completionVal = totalCycles === 0 ? 0 : Math.round((ot / totalCycles) * 100);
    const completionConf = Math.min(1, totalCycles / 12);

    // 2. Invoice discipline (weight 20%)
    const invoiceVal = totalCycles === 0 ? 0 : Math.min(100, Math.round((inv / Math.max(1, ot)) * 130));
    const invoiceConf = Math.min(1, inv / 6);

    // 3. Dispute & reversal cleanliness (weight 25%)
    const disputePenalty = totalCycles === 0 ? 0 : Math.min(1, (disp * 2.2) / Math.max(1, totalCycles));
    const disputeVal = totalCycles === 0 ? 0 : Math.round((1 - disputePenalty) * 100);
    const disputeConf = Math.min(1, totalCycles / 8);

    // 4. Tenure & volume consistency (weight 15%)
    const volumeVal = Math.min(100, Math.round((mo / 18) * 100));
    const volumeConf = Math.min(1, mo / 6);

    // 5. Counterparty diversity (weight 10%)
    const diversityVal = Math.min(100, Math.round((part / 8) * 100));
    const diversityConf = Math.min(1, part / 4);

    const rawFactors = [
      { key: "cycles", label: c.factors.cycles.label, short: c.factors.cycles.short, weight: 30, value: completionVal, confidence: completionConf },
      { key: "disputes", label: c.factors.disputes.label, short: c.factors.disputes.short, weight: 25, value: disputeVal, confidence: disputeConf },
      { key: "invoices", label: c.factors.invoices.label, short: c.factors.invoices.short, weight: 20, value: invoiceVal, confidence: invoiceConf },
      { key: "volume", label: c.factors.volume.label, short: c.factors.volume.short, weight: 15, value: volumeVal, confidence: volumeConf },
      { key: "diversity", label: c.factors.diversity.label, short: c.factors.diversity.short, weight: 10, value: diversityVal, confidence: diversityConf },
    ];

    const computed: RadarFactor[] = rawFactors.map((f) => {
      const maxPoints = Math.round((550 * f.weight) / 100);
      const points = Math.round((550 * f.weight * f.value * f.confidence) / 10_000);
      return { ...f, points, maxPoints };
    });

    const totalPoints = computed.reduce((acc, f) => acc + (550 * f.weight * f.value * f.confidence) / 10_000, 0);
    const finalScore = totalCycles === 0 ? SCORE_MIN : Math.min(SCORE_MAX, Math.round(SCORE_MIN + totalPoints));
    const currentBand = c.bands.find((b) => finalScore >= b.min) ?? c.bands[c.bands.length - 1]!;

    // Best single lever to raise score
    const bestLever = [...computed].sort((a, b) => (b.maxPoints - b.points) - (a.maxPoints - a.points))[0]!;

    return { score: finalScore, factors: computed, band: currentBand, nextUnlock: bestLever };
  }, [onTime, invoices, disputes, months, partners, c]);

  const sliderRow = (
    id: string,
    label: string,
    unit: string,
    v: number[],
    set: (val: number[]) => void,
    max: number,
  ) => (
    <div key={id} className="rounded-xl border border-[#ebebeb] bg-[#fafafa] p-4 transition-colors hover:border-[#79b200]/50">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[#151515]">{label}</span>
        <span className="rounded-md bg-[#151515] px-2 py-0.5 font-mono text-xs font-semibold text-[#c2f74d] tabular-nums">
          {v[0]} {unit}
        </span>
      </div>
      <Slider
        className="mt-3.5"
        value={v}
        onValueChange={(next) => {
          setActivePreset("custom");
          set(next);
        }}
        max={max}
        step={1}
        aria-label={label}
      />
    </div>
  );

  return (
    <section id="trust" className="relative scroll-mt-24 overflow-hidden border-y border-[#e5e5e5] bg-white py-24 text-[#151515]">
      {/* Subtle radial lime glow in the top-right corner */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full opacity-35 blur-3xl"
        style={{ background: "radial-gradient(circle, #c2f74d 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-10 2xl:px-14">
        {/* Top header + formula pill */}
        <div className="vuka-reveal flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#79b200]/30 bg-[#eef6dd] px-3.5 py-1 font-mono text-[11px] font-semibold tracking-[0.18em] text-[#557d00] uppercase">
              <span className="vuka-dot-pulse size-2 rounded-full bg-[#79b200]" />
              {c.eyebrowPill}
            </div>
            <h2 className="mt-4 text-[36px] leading-[1.15] font-bold tracking-[-0.02em] text-[#151515] sm:text-[44px]">
              {c.title}
            </h2>
            <p className="mt-4 text-[16px] leading-[1.6] text-[#444444]">
              {c.intro}
            </p>
          </div>

          {/* Transparent published formula badge */}
          <div className="vuka-card-lift shrink-0 rounded-xl border border-[#e2e8d5] bg-[#f8fbf2] px-4 py-3 font-mono text-xs text-[#222222]">
            <div className="text-[10px] tracking-[0.16em] text-[#79b200] uppercase">{c.formulaHeading}</div>
            <div className="mt-1 font-semibold">
              {c.formulaText}
            </div>
          </div>
        </div>

        {/* Interactive Trader Persona Switcher */}
        <div className="vuka-reveal mt-10 flex flex-wrap items-center gap-2.5" style={{ "--reveal-delay": "90ms" } as CSSProperties}>
          <span className="mr-1 font-mono text-[11px] tracking-[0.15em] text-[#666666] uppercase">
            {c.simulateProfile}
          </span>
          {c.presets.map((p) => {
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                  isSelected
                    ? "border-[#151515] bg-[#151515] text-white shadow-sm"
                    : "border-[#dcdcdc] bg-white text-[#222222] hover:border-[#79b200] hover:bg-[#f9fcf2]"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${isSelected ? "bg-[#c2f74d]" : "bg-[#79b200]"}`}
                />
                <span>{p.tag}</span>
                <span className={`font-mono text-[11px] ${isSelected ? "text-white/70" : "text-[#777777]"}`}>
                  ({p.corridor})
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Lab Workbench: Left Controls + Right Dark Telemetry Certificate */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-stretch">
          {/* Left column: Interactive Sliders + Guardrail Pill */}
          <div className="vuka-reveal vuka-card-lift flex flex-col justify-between rounded-2xl border border-[#e2e2e2] bg-white p-6 shadow-[0_14px_40px_rgba(0,0,0,0.05)] sm:p-7" style={{ "--reveal-delay": "140ms" } as CSSProperties}>
            <div>
              <div className="flex items-center justify-between border-b border-[#efefef] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#151515]">{c.inputsTitle}</h3>
                  <p className="text-xs text-[#666666]">{c.inputsSub}</p>
                </div>
                <span className="rounded-full border border-[#dcdcdc] bg-[#fafafa] px-3 py-1 font-mono text-[11px] text-[#444444]">
                  {c.totalCycles((onTime[0] ?? 0) + (disputes[0] ?? 0))}
                </span>
              </div>

              <div className="mt-5 space-y-3.5">
                {sliderRow("on-time", c.sliders.onTime.label, c.sliders.onTime.unit, onTime, setOnTime, 80)}
                {sliderRow("invoices", c.sliders.invoices.label, c.sliders.invoices.unit, invoices, setInvoices, 50)}
                {sliderRow("disputes", c.sliders.disputes.label, c.sliders.disputes.unit, disputes, setDisputes, 20)}
                {sliderRow("months", c.sliders.months.label, c.sliders.months.unit, months, setMonths, 36)}
                {sliderRow("partners", c.sliders.partners.label, c.sliders.partners.unit, partners, setPartners, 20)}
              </div>
            </div>

            {/* Next score unlock insight box */}
            <div className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-[#cfe899] bg-[#f4fbe4] p-4">
              <div>
                <div className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#557d00] uppercase">
                  {c.leverHeading}
                </div>
                <p className="mt-1 text-sm font-semibold text-[#151515]">
                  {nextUnlock.label}
                </p>
                <p className="mt-0.5 text-xs text-[#444444]">
                  {c.leverPrefix}{" "}
                  <strong className="font-mono text-[#151515]">
                    {c.leverPts(Math.max(0, nextUnlock.maxPoints - nextUnlock.points))}
                  </strong>{" "}
                  {c.leverSuffix}
                </p>
              </div>
              <Link
                to="/trust-score"
                className="shrink-0 rounded-full bg-[#151515] px-3.5 py-2 font-mono text-[11px] font-medium text-[#c2f74d] transition-opacity hover:opacity-90"
              >
                {c.inspectFormula}
              </Link>
            </div>
          </div>

          {/* Right column: Dark Ink Live Trade-Credit Certificate & Telemetry Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_rgba(21,21,21,0.18)] sm:p-8">
            {/* Certificate Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#c2f74d] text-[#151515]">
                  <ShieldCheck className="size-4.5" aria-hidden="true" />
                </span>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.2em] text-[#c2f74d] uppercase">
                    {c.certTitle}
                  </div>
                  <div className="text-xs text-white/65">
                    {c.certSub}
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-[0.15em] text-white/80 uppercase">
                {c.zeroProxies}
              </span>
            </div>

            {/* Center Gauges: Speedometer Dial + 5-Axis Radar */}
            <div className="my-6">
              <TrustRadarDial score={score} band={band} factors={factors} />
            </div>

            {/* 5-Factor Attribution Bars */}
            <div className="space-y-3 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.18em] text-white/50 uppercase">
                <span>{c.breakdownHeading}</span>
                <span>{c.earnedMaxPts}</span>
              </div>
              {factors.map((f) => {
                const fillPct = f.maxPoints > 0 ? Math.min(100, (f.points / f.maxPoints) * 100) : 0;
                return (
                  <div key={f.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/90">
                        {f.label}{" "}
                        <span className="font-mono text-[10px] text-white/45">({f.weight}% {c.weightUnit})</span>
                      </span>
                      <span className="font-mono text-xs text-[#c2f74d] tabular-nums">
                        +{f.points} <span className="text-white/40">/ {f.maxPoints} {c.ptsUnit}</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#c2f74d] transition-[width] duration-300 ease-out"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unlocked Trade Terms Footer Strip */}
            <div className="mt-6 rounded-xl border border-white/12 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.18em] text-[#c2f74d] uppercase">
                  {c.termsUnlocked(band.label)}
                </span>
                <span className="font-mono text-[11px] text-white/60">{c.bandShort(band.band)}</span>
              </div>
              <p className="mt-1 text-xs text-white/70">{band.desc}</p>
              <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                <div>
                  <div className="font-mono text-[10px] text-white/45 uppercase">{c.upfrontAsk}</div>
                  <div className="mt-0.5 font-mono text-xs font-semibold text-white">{band.deposit}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-white/45 uppercase">{c.autoRelease}</div>
                  <div className="mt-0.5 font-mono text-xs font-semibold text-[#c2f74d]">{band.window}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-white/45 uppercase">{c.corridorTier}</div>
                  <div className="mt-0.5 font-mono text-xs font-semibold text-white">{band.limit}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const MOBILE_COPY = {
  en: {
    eyebrow: "VUKA on mobile",
    title: "Built for the phone in your pocket",
    intro:
      "Cash in and cash out through the mobile money you already trust. Track every escrow, confirm deliveries and check a counterparty's score on the go.",
    bullets: [
      "Confirm delivery with one tap",
      "Live status from lock to release",
      "Separate business balance from personal wallet",
      "Works on low-bandwidth connections",
    ],
  },
  fr: {
    eyebrow: "VUKA sur mobile",
    title: "Conçu pour le téléphone dans votre poche",
    intro:
      "Déposez et retirez via le mobile money que vous utilisez déjà. Suivez chaque séquestre, confirmez les livraisons et vérifiez le score d'un partenaire en déplacement.",
    bullets: [
      "Confirmez la livraison en un geste",
      "Statut en direct du blocage à la libération",
      "Solde professionnel séparé du portefeuille personnel",
      "Fonctionne sur les connexions à faible débit",
    ],
  },
  sw: {
    eyebrow: "VUKA kwenye simu",
    title: "Imejengwa kwa simu iliyo mfukoni mwako",
    intro:
      "Weka na toa pesa kupitia huduma za simu unazoziamini tayari. Fuatilia kila escrow, thibitisha mizigo na angalia alama ya mshirika popote ulipo.",
    bullets: [
      "Thibitisha kupokea mzigo kwa mguso mmoja",
      "Hali mubashara kuanzia kufungwa hadi kuachiwa",
      "Tenganisha salio la biashara na pochi binafsi",
      "Inafanya kazi hata kwenye mtandao wenye kasi ndogo",
    ],
  },
  pt: {
    eyebrow: "VUKA no telemóvel",
    title: "Feito para o telemóvel no seu bolso",
    intro:
      "Deposite e levante através do mobile money em que já confia. Acompanhe cada caução, confirme entregas e verifique a pontuação de uma contraparte em movimento.",
    bullets: [
      "Confirme a entrega com um toque",
      "Estado em tempo real do bloqueio à libertação",
      "Saldo empresarial separado da carteira pessoal",
      "Funciona em ligações de baixa largura de banda",
    ],
  },
  rw: {
    eyebrow: "VUKA kuri telefone",
    title: "Yubakiwe telefone iri mu mufuka wawe",
    intro:
      "Shyiramo kandi ubikuze amafaranga ukoresheje mobile money usanzwe wizera. Kurikirana buri escrow, wemeze ibicuruzwa byagezeyo kandi urebe amanota y'uwo mukorana aho uri hose.",
    bullets: [
      "Emeza ko ibicuruzwa byagezeyo ukanda rimwe",
      "Kurikirana imimerere kuva amafaranga afunzwe kugeza arekuwe",
      "Tandukanya amafaranga y'ubucuruzi n'ay'umuntu ku giti cye",
      "Ikora neza no kuri interineti igenda gake",
    ],
  },
};

function Mobile() {
  const c = useLangCopy(MOBILE_COPY);
  return (
    <section id="mobile" className="scroll-mt-24 mx-auto grid w-full max-w-[1560px] items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-10 2xl:px-14">
      <div className="vuka-reveal">
        <SectionHead
          eyebrow={c.eyebrow}
          title={c.title}
          intro={c.intro}
        />
        <ul className="mt-8 space-y-3 text-sm">
          {c.bullets.map((t, i) => (
            <li
              key={i}
              style={{ "--reveal-delay": `${(i + 1) * 80}ms` } as CSSProperties}
              className="vuka-reveal flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition-all duration-300 hover:translate-x-1 hover:border-border hover:bg-muted/30"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#151515] text-[#c2f74d]">
                <Smartphone className="size-3.5" />
              </span>
              <span className="font-medium">{t}</span>
            </li>
          ))}
        </ul>
      </div>
      <div
        className="vuka-reveal flex justify-center py-8"
        style={{ "--reveal-delay": "160ms" } as CSSProperties}
      >
        <PhoneMockup className="vuka-float-slow" />
      </div>
    </section>
  );
}

const FEATURED_CORRIDORS: {
  label: string;
  from: string;
  to: string;
  commodity: string;
}[] = [
  { label: "Kigali ↔ Nairobi", from: "RW", to: "KE", commodity: "Tea, specialty coffee & FMCG" },
  { label: "Lagos ↔ Accra", from: "NG", to: "GH", commodity: "Electronics, textiles & industrial parts" },
  { label: "Joburg ↔ Lusaka", from: "ZA", to: "ZM", commodity: "Mining equipment & agri-inputs" },
  { label: "Nairobi ↔ Lagos", from: "KE", to: "NG", commodity: "Packaged goods & B2B services" },
  { label: "Addis ↔ Kampala", from: "ET", to: "UG", commodity: "Grains, oilseeds & leather" },
  { label: "Dakar ↔ Kigali", from: "SN", to: "RW", commodity: "Cross-continental wholesale trade" },
];

const MARKET_HUB_CITIES: Record<string, string> = {
  RW: "Kigali",
  KE: "Nairobi",
  UG: "Kampala",
  TZ: "Dar es Salaam",
  GH: "Accra",
  NG: "Lagos",
  SN: "Dakar",
  ET: "Addis Ababa",
  ZM: "Lusaka",
  ZA: "Johannesburg",
};

const MARKETS_COPY = {
  en: {
    eyebrowPill: "Markets & Corridors · Pan-African Settlement Mesh",
    title: "Starting where trade already flows.",
    intro: (corridorCount: number) =>
      `Ten launch markets and ${corridorCount} directed corridors across four regional economic blocs. Live sandbox corridors today — with every market opened for real money only once the right licences and local rail partners are in place.`,
    kpiMarkets: "Launch Markets",
    kpiMarketsSub: "Sovereign currencies",
    kpiCorridors: "Active Corridors",
    kpiCorridorsSub: "Directed trade pairs",
    kpiIntraFee: "Intra-Bloc Fee",
    kpiIntraFeeSub: "80 bps same-region",
    kpiCrossFee: "Cross-Bloc Fee",
    kpiCrossFeeSub: "120 bps inter-region",
    featuredCorridors: "Featured corridors:",
    projectionTitle: "Orthographic Corridor Projection",
    routesDrawn: (n: number) => `${n} ${n === 1 ? "route" : "routes"} drawn`,
    modeActivePair: "Active Pair",
    modeHub: (code: string, count: number) => `${code} Hub (${count})`,
    modeMesh: "Full Mesh",
    globeFallback: "Initialising African corridor projection…",
    originHub: "Origin Hub:",
    targetHub: "Target Hub:",
    legendLaunch: "Launch Market",
    legendOrigin: "Selected Origin Hub",
    legendArc: "Elevated Settlement Arc",
    globeHint: "Drag globe to rotate · Click any market to route",
    specHeading: "Live Corridor Specification",
    corridorIdPrefix: "CORRIDOR ID ·",
    intraBadge: (region: string, feePct: string, feeBps: number) =>
      `INTRA-${region} · ${feePct}% (${feeBps} bps)`,
    originBuyer: "Origin (Buyer)",
    originMarketAria: "Origin market",
    swapAria: "Swap origin and destination markets",
    destSupplier: "Destination (Supplier)",
    destMarketAria: "Destination market",
    regionNames: REGION_NAMES,
    pipelineTitle: "3-Hop Settlement Pipeline",
    pipelineBadge: "Atomic Lock → Confirm → Release",
    hop1Title: "1 · COLLECTION RAIL",
    hop1Sub: (currency: string, providerId: string) => `${currency} Cash-In · ${providerId}`,
    hop2Title: "2 · ESCROW VAULT",
    hop2Main: "Polygon USDC Contract",
    hop2Sub: "Invoice-linked neutral lock",
    hop3Title: "3 · PAYOUT RAIL",
    hop3Sub: (currency: string, providerId: string) => `${currency} Release · ${providerId}`,
    fxTitle: "Indicative FX Rate",
    fxSub: "Engine quote feed (live)",
    feeTierTitle: "Protocol Fee Tier",
    sameBlocSub: (region: string) => `Same bloc (${region})`,
    crossBlocSub: "Cross-bloc corridor",
    netPayoutTitle: (currency: string) => `1M ${currency} Net Payout`,
    calculating: "Calculating…",
    afterEscrowFee: (feePct: string) => `After ${feePct}% escrow fee`,
    monetaryAreas: "Monetary Areas:",
    testCorridor: "Test this corridor",
    sandboxNotice:
      "Central banks and rail operators are listed for factual monetary context only. VUKA is currently running in a simulated sandbox environment and claims no regulatory licence, partnership, or endorsement.",
    dirTitle: "Launch Market & Local Rail Directory",
    dirSub:
      "Click any market card to assign it as Origin or Destination in the corridor workbench above.",
    allBlocs: "All Blocs",
    badgeOrigin: "ORIGIN",
    badgeTarget: "TARGET",
    primaryRail: "Primary Rail",
    originSelected: "✓ Origin",
    setOrigin: "Set Origin",
    targetSelected: "✓ Target",
    setTarget: "Set Target",
  },
  fr: {
    eyebrowPill: "Marchés & Corridors · Maillage de Règlement Panafricain",
    title: "Commencer là où le commerce circule déjà.",
    intro: (corridorCount: number) =>
      `Dix marchés de lancement et ${corridorCount} corridors orientés à travers quatre blocs économiques régionaux. Des corridors sandbox actifs aujourd'hui — chaque marché n'étant ouvert aux fonds réels qu'une fois les licences et partenaires locaux en place.`,
    kpiMarkets: "Marchés de Lancement",
    kpiMarketsSub: "Devises souveraines",
    kpiCorridors: "Corridors Actifs",
    kpiCorridorsSub: "Paires commerciales orientées",
    kpiIntraFee: "Frais Intra-Bloc",
    kpiIntraFeeSub: "80 pdb même région",
    kpiCrossFee: "Frais Inter-Blocs",
    kpiCrossFeeSub: "120 pdb inter-régions",
    featuredCorridors: "Corridors phares :",
    projectionTitle: "Projection Orthographique des Corridors",
    routesDrawn: (n: number) => `${n} ${n === 1 ? "route tracée" : "routes tracées"}`,
    modeActivePair: "Paire Active",
    modeHub: (code: string, count: number) => `Hub ${code} (${count})`,
    modeMesh: "Maillage Complet",
    globeFallback: "Initialisation de la projection des corridors africains…",
    originHub: "Hub d'Origine :",
    targetHub: "Hub Cible :",
    legendLaunch: "Marché de Lancement",
    legendOrigin: "Hub d'Origine Sélectionné",
    legendArc: "Arc de Règlement Élevé",
    globeHint: "Faites glisser pour tourner · Cliquez sur un marché pour router",
    specHeading: "Spécification du Corridor en Direct",
    corridorIdPrefix: "ID CORRIDOR ·",
    intraBadge: (region: string, feePct: string, feeBps: number) =>
      `INTRA-${region} · ${feePct}% (${feeBps} pdb)`,
    originBuyer: "Origine (Acheteur)",
    originMarketAria: "Marché d'origine",
    swapAria: "Inverser les marchés d'origine et de destination",
    destSupplier: "Destination (Fournisseur)",
    destMarketAria: "Marché de destination",
    regionNames: {
      EAC: "Communauté d'Afrique de l'Est",
      ECOWAS: "Communauté Économique des États de l'Afrique de l'Ouest",
      SADC: "Communauté de Développement d'Afrique Australe",
      HORN: "Corne de l'Afrique",
    } as Record<string, string>,
    pipelineTitle: "Pipeline de Règlement en 3 Étapes",
    pipelineBadge: "Blocage Atomique → Confirmation → Libération",
    hop1Title: "1 · RAIL DE COLLECTE",
    hop1Sub: (currency: string, providerId: string) => `Encaissement ${currency} · ${providerId}`,
    hop2Title: "2 · COFFRE DE SÉQUESTRE",
    hop2Main: "Contrat USDC Polygon",
    hop2Sub: "Blocage neutre lié à la facture",
    hop3Title: "3 · RAIL DE DÉCAISSEMENT",
    hop3Sub: (currency: string, providerId: string) => `Libération ${currency} · ${providerId}`,
    fxTitle: "Taux de Change Indicatif",
    fxSub: "Flux de cotation moteur (en direct)",
    feeTierTitle: "Palier de Frais Protocole",
    sameBlocSub: (region: string) => `Même bloc (${region})`,
    crossBlocSub: "Corridor inter-blocs",
    netPayoutTitle: (currency: string) => `Net Versé pour 1M ${currency}`,
    calculating: "Calcul en cours…",
    afterEscrowFee: (feePct: string) => `Après ${feePct}% de frais de séquestre`,
    monetaryAreas: "Zones Monétaires :",
    testCorridor: "Tester ce corridor",
    sandboxNotice:
      "Les banques centrales et opérateurs sont mentionnés à titre purement factuel et monétaire. VUKA fonctionne actuellement dans un environnement sandbox simulé et ne revendique aucune licence réglementaire, partenariat ou approbation.",
    dirTitle: "Répertoire des Marchés de Lancement et Rails Locaux",
    dirSub:
      "Cliquez sur une carte de marché pour la définir comme Origine ou Destination dans l'atelier ci-dessus.",
    allBlocs: "Tous les Blocs",
    badgeOrigin: "ORIGINE",
    badgeTarget: "CIBLE",
    primaryRail: "Rail Principal",
    originSelected: "✓ Origine",
    setOrigin: "Définir Origine",
    targetSelected: "✓ Cible",
    setTarget: "Définir Cible",
  },
  sw: {
    eyebrowPill: "Masoko na Njia za Malipo · Mtandao wa Malipo wa Afrika Nzima",
    title: "Kuanzia pale ambapo biashara tayari inapita.",
    intro: (corridorCount: number) =>
      `Masoko kumi ya uzinduzi na njia ${corridorCount} za malipo katika kanda nne za kiuchumi. Njia za majaribio (sandbox) zinafanya kazi leo — na kila soko litafunguliwa kwa pesa halisi mara tu leseni sahihi na washirika wa ndani watakapokamilika.`,
    kpiMarkets: "Masoko ya Uzinduzi",
    kpiMarketsSub: "Sarafu za kitaifa",
    kpiCorridors: "Njia Hai za Malipo",
    kpiCorridorsSub: "Jozi za kibiashara",
    kpiIntraFee: "Ada Ndani ya Kanda",
    kpiIntraFeeSub: "bps 80 kanda moja",
    kpiCrossFee: "Ada Kati ya Kanda",
    kpiCrossFeeSub: "bps 120 kanda tofauti",
    featuredCorridors: "Njia kuu za malipo:",
    projectionTitle: "Ramani ya Mzunguko wa Njia za Malipo",
    routesDrawn: (n: number) => `${n === 1 ? "njia 1 imechorwa" : `njia ${n} zimechorwa`}`,
    modeActivePair: "Jozi Hai",
    modeHub: (code: string, count: number) => `Kitovu cha ${code} (${count})`,
    modeMesh: "Mtandao Kamili",
    globeFallback: "Inaanzisha ramani ya njia za malipo za Afrika…",
    originHub: "Kitovu cha Asili:",
    targetHub: "Kitovu Lengwa:",
    legendLaunch: "Soko la Uzinduzi",
    legendOrigin: "Kitovu cha Asili Kilichochaguliwa",
    legendArc: "Tao la Njia ya Malipo",
    globeHint: "Buruta globu kuzungusha · Bofya soko lolote kuchagua njia",
    specHeading: "Maelezo Mubashara ya Njia ya Malipo",
    corridorIdPrefix: "KITAMBULISHO CHA NJIA ·",
    intraBadge: (region: string, feePct: string, feeBps: number) =>
      `NDANI YA ${region} · ${feePct}% (bps ${feeBps})`,
    originBuyer: "Asili (Mnunuzi)",
    originMarketAria: "Soko la asili",
    swapAria: "Badilisha soko la asili na soko lengwa",
    destSupplier: "Mwisho (Muuzaji)",
    destMarketAria: "Soko lengwa",
    regionNames: {
      EAC: "Jumuiya ya Afrika Mashariki",
      ECOWAS: "Jumuiya ya Kiuchumi ya Afrika Magharibi",
      SADC: "Jumuiya ya Maendeleo Kusini mwa Afrika",
      HORN: "Pembe ya Afrika",
    } as Record<string, string>,
    pipelineTitle: "Mchakato wa Malipo wa Hatua 3",
    pipelineBadge: "Funga → Thibitisha → Achia",
    hop1Title: "1 · NJIA YA UKUSANYAJI",
    hop1Sub: (currency: string, providerId: string) => `Kuweka ${currency} · ${providerId}`,
    hop2Title: "2 · HAZINA YA ESCROW",
    hop2Main: "Mkataba wa Polygon USDC",
    hop2Sub: "Kufuli huru lililounganishwa na ankara",
    hop3Title: "3 · NJIA YA UTOAJI",
    hop3Sub: (currency: string, providerId: string) => `Kuachia ${currency} · ${providerId}`,
    fxTitle: "Kiwango cha Kubadilisha Fedha",
    fxSub: "Nukuu mubashara ya injini",
    feeTierTitle: "Kiwango cha Ada ya Itifaki",
    sameBlocSub: (region: string) => `Kanda moja (${region})`,
    crossBlocSub: "Njia ya kanda tofauti",
    netPayoutTitle: (currency: string) => `Malipo Halisi kwa 1M ${currency}`,
    calculating: "Inakokotoa…",
    afterEscrowFee: (feePct: string) => `Baada ya ada ya escrow ya ${feePct}%`,
    monetaryAreas: "Mamlaka za Kifedha:",
    testCorridor: "Jaribu njia hii",
    sandboxNotice:
      "Benki kuu na watoa huduma za malipo wameorodheshwa kwa muktadha wa kifedha pekee. VUKA kwa sasa inaendeshwa kwenye mazingira ya majaribio (sandbox) na haidai leseni ya udhibiti, ubia, au uidhinishaji wowote.",
    dirTitle: "Orodha ya Masoko ya Uzinduzi na Njia za Ndani",
    dirSub:
      "Bofya kadi yoyote ya soko ili kuichagua kama Asili au Mwisho kwenye jedwali la njia hapo juu.",
    allBlocs: "Kanda Zote",
    badgeOrigin: "ASILI",
    badgeTarget: "LENGWA",
    primaryRail: "Njia Kuu",
    originSelected: "✓ Asili",
    setOrigin: "Weka Asili",
    targetSelected: "✓ Lengwa",
    setTarget: "Weka Lengwa",
  },
  pt: {
    eyebrowPill: "Mercados e Corredores · Malha Pan-Africana de Liquidação",
    title: "Começando onde o comércio já flui.",
    intro: (corridorCount: number) =>
      `Dez mercados de lançamento e ${corridorCount} corredores direcionados em quatro blocos económicos regionais. Corredores sandbox ativos hoje — com cada mercado aberto para dinheiro real apenas quando as licenças e parceiros locais estiverem estabelecidos.`,
    kpiMarkets: "Mercados de Lançamento",
    kpiMarketsSub: "Moedas soberanas",
    kpiCorridors: "Corredores Ativos",
    kpiCorridorsSub: "Pares comerciais direcionados",
    kpiIntraFee: "Taxa Intra-Bloco",
    kpiIntraFeeSub: "80 pb mesma região",
    kpiCrossFee: "Taxa Entre Blocos",
    kpiCrossFeeSub: "120 pb entre regiões",
    featuredCorridors: "Corredores em destaque:",
    projectionTitle: "Projeção Ortográfica de Corredores",
    routesDrawn: (n: number) => `${n} ${n === 1 ? "rota traçada" : "rotas traçadas"}`,
    modeActivePair: "Par Ativo",
    modeHub: (code: string, count: number) => `Hub ${code} (${count})`,
    modeMesh: "Malha Completa",
    globeFallback: "A inicializar projeção de corredores africanos…",
    originHub: "Hub de Origem:",
    targetHub: "Hub de Destino:",
    legendLaunch: "Mercado de Lançamento",
    legendOrigin: "Hub de Origem Selecionado",
    legendArc: "Arco de Liquidação Elevado",
    globeHint: "Arraste o globo para rodar · Clique num mercado para rotear",
    specHeading: "Especificação do Corredor em Tempo Real",
    corridorIdPrefix: "ID DO CORREDOR ·",
    intraBadge: (region: string, feePct: string, feeBps: number) =>
      `INTRA-${region} · ${feePct}% (${feeBps} pb)`,
    originBuyer: "Origem (Comprador)",
    originMarketAria: "Mercado de origem",
    swapAria: "Trocar mercados de origem e destino",
    destSupplier: "Destino (Fornecedor)",
    destMarketAria: "Mercado de destino",
    regionNames: {
      EAC: "Comunidade da África Oriental",
      ECOWAS: "Comunidade Económica dos Estados da África Ocidental",
      SADC: "Comunidade de Desenvolvimento da África Austral",
      HORN: "Corno de África",
    } as Record<string, string>,
    pipelineTitle: "Pipeline de Liquidação em 3 Etapas",
    pipelineBadge: "Bloqueio Atómico → Confirmar → Libertar",
    hop1Title: "1 · REDE DE RECOLHA",
    hop1Sub: (currency: string, providerId: string) => `Depósito ${currency} · ${providerId}`,
    hop2Title: "2 · COFRE DE CAUÇÃO",
    hop2Main: "Contrato USDC Polygon",
    hop2Sub: "Bloqueio neutro associado à fatura",
    hop3Title: "3 · REDE DE PAGAMENTO",
    hop3Sub: (currency: string, providerId: string) => `Libertação ${currency} · ${providerId}`,
    fxTitle: "Taxa de Câmbio Indicativa",
    fxSub: "Cotação do motor (em direto)",
    feeTierTitle: "Escalão de Taxa do Protocolo",
    sameBlocSub: (region: string) => `Mesmo bloco (${region})`,
    crossBlocSub: "Corredor entre blocos",
    netPayoutTitle: (currency: string) => `Valor Líquido p/ 1M ${currency}`,
    calculating: "A calcular…",
    afterEscrowFee: (feePct: string) => `Após ${feePct}% de taxa de caução`,
    monetaryAreas: "Zonas Monetárias:",
    testCorridor: "Testar este corredor",
    sandboxNotice:
      "Os bancos centrais e operadores de pagamento são indicados apenas para contexto monetário factual. A VUKA opera atualmente num ambiente sandbox simulado e não reivindica qualquer licença regulamentar, parceria ou endosso.",
    dirTitle: "Diretório de Mercados de Lançamento e Redes Locais",
    dirSub:
      "Clique em qualquer cartão de mercado para o definir como Origem ou Destino na bancada acima.",
    allBlocs: "Todos os Blocos",
    badgeOrigin: "ORIGEM",
    badgeTarget: "DESTINO",
    primaryRail: "Rede Principal",
    originSelected: "✓ Origem",
    setOrigin: "Definir Origem",
    targetSelected: "✓ Destino",
    setTarget: "Definir Destino",
  },
  rw: {
    eyebrowPill: "Amasoko n'Inzira z'Ubwishyu · Urusobe Nyafurika rwo Kwishyurana",
    title: "Dutangirira aho ubucuruzi busanzwe bunyura.",
    intro: (corridorCount: number) =>
      `Amasoko icumi y'itangiriro n'inzira ${corridorCount} z'ubwishyu mu miryango ine y'ubukungu bw'uturere. Inzira z'igeragezwa (sandbox) zirakora uyu munsi — buri soko rikazafungurirwa amafaranga nyayo ari uko impushya n'abafatanyabikorwa b'imbere mu gihugu bimaze kuboneka.`,
    kpiMarkets: "Amasoko y'Itangiriro",
    kpiMarketsSub: "Amafaranga y'ibihugu",
    kpiCorridors: "Inzira Zikora",
    kpiCorridorsSub: "Imihigo y'ubucuruzi",
    kpiIntraFee: "Ikiguzi mu Karere Kamwe",
    kpiIntraFeeSub: "bps 80 mu karere kamwe",
    kpiCrossFee: "Ikiguzi Hagati y'Uturere",
    kpiCrossFeeSub: "bps 120 hagati y'uturere",
    featuredCorridors: "Inzira z'ingenzi:",
    projectionTitle: "Ishusho y'Inzira z'Ubwishyu ku Mubumbe",
    routesDrawn: (n: number) => `${n === 1 ? "inzira 1 yashushanyijwe" : `inzira ${n} zashushanyijwe`}`,
    modeActivePair: "Inzira Ihari",
    modeHub: (code: string, count: number) => `Igicumbi cya ${code} (${count})`,
    modeMesh: "Urusobe Rwose",
    globeFallback: "Gutangiza ishusho y'inzira z'ubwishyu muri Afurika…",
    originHub: " aho Bituruka:",
    targetHub: "Aho Bijya:",
    legendLaunch: "Isoko ry'Itangiriro",
    legendOrigin: "Igicumbi Gikoreshwa",
    legendArc: "Inzira y'Ubwishyu",
    globeHint: "Kurura umubumbe uwuzengurutse · Kanda ku isoko guhitamo inzira",
    specHeading: "Imiterere y'Inzira y'Ubwishyu Ako Kanya",
    corridorIdPrefix: "INDANGO Y'INZIRA ·",
    intraBadge: (region: string, feePct: string, feeBps: number) =>
      `MU KARERE KA ${region} · ${feePct}% (${feeBps} bps)`,
    originBuyer: "Aho Bituruka (Umuguzi)",
    originMarketAria: "Isoko biturukaho",
    swapAria: "Hinduranya isoko biturukaho n'aho bijya",
    destSupplier: "Aho Bijya (Umugurisha)",
    destMarketAria: "Isoko bijyaho",
    regionNames: {
      EAC: "Umuryango wa Afurika y'Iburasirazuba",
      ECOWAS: "Umuryango w'Ubukungu bwa Afurika y'Iburengerazuba",
      SADC: "Umuryango w'Iterambere rya Afurika y'Amajyepfo",
      HORN: "Ihembe rya Afurika",
    } as Record<string, string>,
    pipelineTitle: "Inzira y'Ubwishyu mu Ntambwe 3",
    pipelineBadge: "Gufunga → Kwemeza → Kurekura",
    hop1Title: "1 · UBURYO BWO KWAKIRA",
    hop1Sub: (currency: string, providerId: string) => `Kwinjiza ${currency} · ${providerId}`,
    hop2Title: "2 · ISANDUKU YA ESCROW",
    hop2Main: "Amasezerano ya Polygon USDC",
    hop2Sub: "Gufunga kudabogamye guhujwe n'inyemezabuguzi",
    hop3Title: "3 · UBURYO BWO KUBIKUZA",
    hop3Sub: (currency: string, providerId: string) => `Kurekura ${currency} · ${providerId}`,
    fxTitle: "Igiciro cyo Kuvunja",
    fxSub: "Igiciro cya moteri (ako kanya)",
    feeTierTitle: "Urwego rw'Ikiguzi cya Serivisi",
    sameBlocSub: (region: string) => `Akarere kamwe (${region})`,
    crossBlocSub: "Inzira ihuza uturere",
    netPayoutTitle: (currency: string) => `Ayagerayo kuri 1M ${currency}`,
    calculating: "Birimo kubarwa…",
    afterEscrowFee: (feePct: string) => `Havuyemo ${feePct}% y'ikiguzi cya escrow`,
    monetaryAreas: "Inzego z'Ifaranga:",
    testCorridor: "Gerageza iyi nzira",
    sandboxNotice:
      " za banki nkuru n'ibigo by'ubwishyu byanditswe gusa mu rwego rwo gusobanura imikorere y'ifaranga. VUKA ubu ikorera mu buryo bw'igeragezwa (sandbox) kandi ntiyiyitirira uruhushya rwa Leta cyangwa ubufatanye bwemewe.",
    dirTitle: "Urutonde rw'Amasoko y'Itangiriro n'Imiyoboro yo mu Gihugu",
    dirSub:
      "Kanda ku ikarita y'isoko iryo ari ryo ryose kugira ngo urigire Aho Bituruka cyangwa Aho Bijya.",
    allBlocs: "Uturere Twose",
    badgeOrigin: "AHO BITURUKA",
    badgeTarget: "AHO BIJYA",
    primaryRail: "Umuyoboro w'Ingenzi",
    originSelected: "✓ Aho Bituruka",
    setOrigin: "Gira Aho Bituruka",
    targetSelected: "✓ Aho Bijya",
    setTarget: "Gira Aho Bijya",
  },
};

function Markets() {
  const c = useLangCopy(MARKETS_COPY);
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });
  const markets = config.data?.countries ?? [];
  const corridorCount = config.data?.corridor_count ?? markets.length * Math.max(0, markets.length - 1);

  const [originCode, setOriginCode] = useState("RW");
  const [destCode, setDestCode] = useState("KE");
  const [regionFilter, setRegionFilter] = useState<string>("ALL");
  const [arcMode, setArcMode] = useState<"corridor" | "hub" | "mesh">("hub");

  const origin = useMemo(
    () => markets.find((m) => m.code === originCode) ?? markets[0],
    [markets, originCode],
  );
  const dest = useMemo(
    () =>
      markets.find((m) => m.code === destCode && m.code !== origin?.code) ??
      markets.find((m) => m.code !== origin?.code) ??
      markets[0],
    [markets, destCode, origin],
  );

  const sampleAmount = 1_000_000;
  const corridorId = origin && dest ? `${origin.code}-${dest.code}` : "";
  const routeQuote = useQuery({
    queryKey: ["market-corridor-quote", corridorId],
    queryFn: () => corridors.quote(corridorId, sampleAmount),
    enabled: Boolean(origin && dest && origin.code !== dest.code),
    staleTime: 120_000,
    retry: false,
  });

  const arcs = useMemo<[string, string][]>(() => {
    if (!markets.length || !origin || !dest) return [];
    if (arcMode === "corridor") {
      return [[origin.code, dest.code]];
    }
    if (arcMode === "hub") {
      return markets
        .filter((m) => m.code !== origin.code)
        .map((m) => [origin.code, m.code] as [string, string]);
    }
    const pairs: [string, string][] = [];
    for (let i = 0; i < markets.length; i += 1) {
      for (let j = i + 1; j < markets.length; j += 1) {
        const mA = markets[i];
        const mB = markets[j];
        if (mA && mB) {
          pairs.push([mA.code, mB.code]);
        }
      }
    }
    return pairs;
  }, [markets, origin, dest, arcMode]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: markets.length };
    for (const m of markets) {
      counts[m.region] = (counts[m.region] ?? 0) + 1;
    }
    return counts;
  }, [markets]);

  const filteredMarkets = useMemo(
    () => (regionFilter === "ALL" ? markets : markets.filter((m) => m.region === regionFilter)),
    [markets, regionFilter],
  );

  if (!markets.length || !origin || !dest) return null;

  const feeBps = corridorFeeBps(origin.region, dest.region);
  const isIntraBloc = origin.region === dest.region;
  const feePct = (feeBps / 100).toFixed(2);

  const handleSelectPair = (from: string, to: string) => {
    setOriginCode(from);
    setDestCode(to);
  };

  const handleSwap = () => {
    setOriginCode(dest.code);
    setDestCode(origin.code);
  };

  const handleGlobeSelect = (code: string | null) => {
    if (!code) return;
    if (code === origin.code) return;
    if (code === dest.code) {
      handleSwap();
      return;
    }
    setDestCode(code);
  };

  return (
    <section
      id="markets"
      className="relative scroll-mt-24 overflow-hidden border-t border-border bg-[#f6f6f4] text-[#141414]"
    >
      {/* Subtle architectural grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "radial-gradient(circle at 14% 18%, rgba(194, 247, 77, 0.24), transparent 36%), radial-gradient(circle at 86% 78%, rgba(194, 247, 77, 0.16), transparent 40%), linear-gradient(to right, rgba(20, 20, 20, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(20, 20, 20, 0.03) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 100% 100%, 40px 40px, 40px 40px",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1560px] px-4 py-24 sm:px-6 lg:px-10 2xl:px-14">
        {/* Header & Live Engine Network Telemetry Strip */}
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end vuka-reveal">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#141414]/10 bg-white px-3.5 py-1.5 shadow-2xs">
              <span className="size-2 rounded-full bg-[#79b200]" />
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[#141414]/80">
                {c.eyebrowPill}
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#141414] sm:text-[42px] sm:leading-[1.1]">
              {c.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#5a5d55]">
              {c.intro(corridorCount)}
            </p>
          </div>

          {/* 4 Live Network KPI Badges */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:shrink-0">
            <div className="rounded-2xl border border-[#e3e4de] bg-white px-4 py-3 shadow-2xs vuka-card-lift">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#767a70]">
                {c.kpiMarkets}
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-[#141414]">
                {markets.length}
              </p>
              <p className="text-[11px] text-[#686b62]">{c.kpiMarketsSub}</p>
            </div>
            <div className="rounded-2xl border border-[#e3e4de] bg-white px-4 py-3 shadow-2xs vuka-card-lift">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#767a70]">
                {c.kpiCorridors}
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-[#141414]">
                {corridorCount}
              </p>
              <p className="text-[11px] text-[#686b62]">{c.kpiCorridorsSub}</p>
            </div>
            <div className="rounded-2xl border border-[#e3e4de] bg-white px-4 py-3 shadow-2xs vuka-card-lift">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#767a70]">
                {c.kpiIntraFee}
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-[#4d7500]">
                0.80%
              </p>
              <p className="text-[11px] text-[#686b62]">{c.kpiIntraFeeSub}</p>
            </div>
            <div className="rounded-2xl border border-[#e3e4de] bg-white px-4 py-3 shadow-2xs vuka-card-lift">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#767a70]">
                {c.kpiCrossFee}
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-[#141414]">
                1.20%
              </p>
              <p className="text-[11px] text-[#686b62]">{c.kpiCrossFeeSub}</p>
            </div>
          </div>
        </div>

        {/* Featured Corridor Quick-Preset Bar */}
        <div className="mt-9 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6d7067]">
            {c.featuredCorridors}
          </span>
          {FEATURED_CORRIDORS.map((preset) => {
            const active = origin.code === preset.from && dest.code === preset.to;
            const pFrom = markets.find((m) => m.code === preset.from);
            const pTo = markets.find((m) => m.code === preset.to);
            const sameBloc = pFrom && pTo && pFrom.region === pTo.region;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPair(preset.from, preset.to)}
                className={`group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "border-[#141414] bg-[#141414] text-white shadow-sm"
                    : "border-[#dfdfd9] bg-white text-[#2c2e29] hover:border-[#141414]/40 hover:bg-[#fafaf8]"
                }`}
              >
                <Flag code={preset.from} className="w-4 rounded-[2px]" />
                <span>{preset.label}</span>
                <Flag code={preset.to} className="w-4 rounded-[2px]" />
                <span
                  className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                    active
                      ? "bg-[#c2f74d] font-semibold text-[#141414]"
                      : sameBloc
                        ? "bg-[#eef8d6] text-[#456b00]"
                        : "bg-[#f1f2ee] text-[#686b62]"
                  }`}
                >
                  {sameBloc ? "0.80%" : "1.20%"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main 2-Column Interactive Workbench: 3D Orthographic Globe + Dark Ink Corridor Inspector */}
        <div className="mt-6 grid gap-7 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
          {/* Left Column: Interactive 3D Orthographic Globe Card */}
          <div className="flex flex-col justify-between rounded-[28px] border border-[#e2e3dd] bg-white p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.08)] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeeeea] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#75796e]">
                    {c.projectionTitle}
                  </span>
                  <span className="rounded-full bg-[#eef8d6] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#476d00]">
                    {c.routesDrawn(arcs.length)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-[#141414]">
                  {MARKET_HUB_CITIES[origin.code] ?? origin.name} ({origin.code}) →{" "}
                  {MARKET_HUB_CITIES[dest.code] ?? dest.name} ({dest.code})
                </p>
              </div>

              {/* Arc topology switcher */}
              <div className="inline-flex rounded-xl border border-[#e3e4de] bg-[#f7f7f5] p-1">
                {(
                  [
                    { id: "corridor", label: c.modeActivePair },
                    { id: "hub", label: c.modeHub(origin.code, markets.length - 1) },
                    { id: "mesh", label: c.modeMesh },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setArcMode(mode.id)}
                    className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-medium transition-all ${
                      arcMode === mode.id
                        ? "bg-[#141414] text-[#c2f74d] shadow-2xs"
                        : "text-[#63665d] hover:text-[#141414]"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Canvas Globe */}
            <div className="relative my-2 h-[380px] w-full sm:h-[420px]">
              <Suspense
                fallback={
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#f9f9f7] font-mono text-xs text-[#75796e]">
                    {c.globeFallback}
                  </div>
                }
              >
                <Globe
                  markets={markets}
                  arcs={arcs}
                  activeCode={origin.code}
                  onActive={handleGlobeSelect}
                  className="h-full w-full"
                />
              </Suspense>

              {/* Floating Origin / Destination quick pill in top-left of globe */}
              <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1.5 rounded-2xl border border-[#e3e4de]/90 bg-white/90 px-3.5 py-2.5 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2 rounded-full bg-[#141414]" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#75796e]">
                    {c.originHub}
                  </span>
                  <Flag code={origin.code} className="w-4 rounded-[2px]" />
                  <span className="font-semibold text-[#141414]">
                    {origin.name} ({origin.currency})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2 rounded-full bg-[#79b200]" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#75796e]">
                    {c.targetHub}
                  </span>
                  <Flag code={dest.code} className="w-4 rounded-[2px]" />
                  <span className="font-semibold text-[#141414]">
                    {dest.name} ({dest.currency})
                  </span>
                </div>
              </div>
            </div>

            {/* Legend & interaction hint */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eeeeea] pt-4 text-xs text-[#666960]">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-[#c2f74d] ring-1 ring-[#141414]/30" />
                  {c.legendLaunch}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-[#141414]" />
                  {c.legendOrigin}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-[#141414]" />
                  {c.legendArc}
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#7a7d74]">
                {c.globeHint}
              </span>
            </div>
          </div>

          {/* Right Column: Dark Ink Live Corridor Route Inspector */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-[#141414] bg-[#151515] p-6 text-white shadow-[0_28px_70px_-24px_rgba(0,0,0,0.45)] sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full opacity-20 blur-3xl"
              style={{
                background: "radial-gradient(circle, #c2f74d 0%, rgba(194,247,77,0) 70%)",
              }}
            />

            <div>
              {/* Top Inspector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                    {c.specHeading}
                  </p>
                  <p className="mt-1 font-mono text-xs text-white/80">
                    {c.corridorIdPrefix}{" "}
                    <span className="font-semibold text-[#c2f74d]">
                      {origin.code}-{dest.code}-{origin.region}
                    </span>
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold ${
                    isIntraBloc
                      ? "border-[#c2f74d]/40 bg-[#c2f74d]/15 text-[#c2f74d]"
                      : "border-white/20 bg-white/10 text-white"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {isIntraBloc
                    ? c.intraBadge(origin.region, feePct, feeBps)
                    : `${origin.region} → ${dest.region} · ${feePct}% (${feeBps} bps)`}
                </span>
              </div>

              {/* Interactive Origin <-> Destination Route Selector */}
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
                {/* Origin selector */}
                <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
                      {c.originBuyer}
                    </span>
                    <span className="font-mono text-[10px] text-[#c2f74d]">
                      +{DIAL[origin.code] ?? "—"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2.5">
                    <Flag code={origin.code} className="w-7 shrink-0 rounded-xs" />
                    <select
                      aria-label={c.originMarketAria}
                      value={origin.code}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next === dest.code) {
                          handleSwap();
                        } else {
                          setOriginCode(next);
                        }
                      }}
                      className="w-full cursor-pointer bg-transparent text-sm font-semibold text-white focus:outline-none"
                    >
                      {markets.map((m) => (
                        <option key={m.code} value={m.code} className="bg-[#151515] text-white">
                          {m.name} ({m.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1.5 truncate font-mono text-[11px] text-white/55">
                    {origin.region} · {c.regionNames[origin.region] ?? REGION_NAMES[origin.region] ?? origin.region}
                  </p>
                </div>

                {/* Swap Direction Button */}
                <button
                  type="button"
                  onClick={handleSwap}
                  aria-label={c.swapAria}
                  className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#c2f74d] transition hover:border-[#c2f74d] hover:bg-[#c2f74d] hover:text-[#141414]"
                >
                  <ArrowLeftRight className="size-4" />
                </button>

                {/* Destination selector */}
                <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
                      {c.destSupplier}
                    </span>
                    <span className="font-mono text-[10px] text-[#c2f74d]">
                      +{DIAL[dest.code] ?? "—"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2.5">
                    <Flag code={dest.code} className="w-7 shrink-0 rounded-xs" />
                    <select
                      aria-label={c.destMarketAria}
                      value={dest.code}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next === origin.code) {
                          handleSwap();
                        } else {
                          setDestCode(next);
                        }
                      }}
                      className="w-full cursor-pointer bg-transparent text-sm font-semibold text-white focus:outline-none"
                    >
                      {markets.map((m) => (
                        <option key={m.code} value={m.code} className="bg-[#151515] text-white">
                          {m.name} ({m.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1.5 truncate font-mono text-[11px] text-white/55">
                    {dest.region} · {c.regionNames[dest.region] ?? REGION_NAMES[dest.region] ?? dest.region}
                  </p>
                </div>
              </div>

              {/* 3-Hop Settlement Pipeline Architecture */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                    {c.pipelineTitle}
                  </p>
                  <span className="font-mono text-[10px] text-[#c2f74d]">
                    {c.pipelineBadge}
                  </span>
                </div>

                <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <p className="font-mono text-[10px] text-white/45">{c.hop1Title}</p>
                    <p className="mt-1 text-xs font-semibold text-white">{origin.provider_name}</p>
                    <p className="mt-1 font-mono text-[11px] text-[#c2f74d]">
                      {c.hop1Sub(origin.currency, origin.provider_id)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#c2f74d]/30 bg-[#c2f74d]/[0.07] p-3">
                    <p className="font-mono text-[10px] text-[#c2f74d]">{c.hop2Title}</p>
                    <p className="mt-1 text-xs font-semibold text-white">{c.hop2Main}</p>
                    <p className="mt-1 font-mono text-[11px] text-white/70">
                      {c.hop2Sub}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <p className="font-mono text-[10px] text-white/45">{c.hop3Title}</p>
                    <p className="mt-1 text-xs font-semibold text-white">{dest.provider_name}</p>
                    <p className="mt-1 font-mono text-[11px] text-[#c2f74d]">
                      {c.hop3Sub(dest.currency, dest.provider_id)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Engine Quote & FX Telemetry */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                    {c.fxTitle}
                  </p>
                  <p className="mt-1.5 font-mono text-sm font-semibold text-white">
                    {routeQuote.data?.quote
                      ? `1 ${origin.currency} = ${routeQuote.data.quote.inverse_rate.toFixed(4)} ${dest.currency}`
                      : `${origin.currency} → ${dest.currency}`}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-white/45">
                    {c.fxSub}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                    {c.feeTierTitle}
                  </p>
                  <p className="mt-1.5 font-mono text-sm font-semibold text-[#c2f74d]">
                    {feePct}% ({feeBps} bps)
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-white/45">
                    {isIntraBloc ? c.sameBlocSub(origin.region) : c.crossBlocSub}
                  </p>
                </div>

                <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:col-span-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                    {c.netPayoutTitle(origin.currency)}
                  </p>
                  <p className="mt-1.5 font-mono text-sm font-semibold text-white">
                    {routeQuote.data?.quote
                      ? `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(routeQuote.data.quote.deliver_amount_minor)} ${dest.currency}`
                      : c.calculating}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-white/45">
                    {c.afterEscrowFee(feePct)}
                  </p>
                </div>
              </div>
            </div>

            {/* Factual Monetary Jurisdiction & Sandbox Honesty Footer */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/75">
                <span>
                  <strong className="font-mono text-[10px] uppercase tracking-wider text-white/45">
                    {c.monetaryAreas}
                  </strong>{" "}
                  {CENTRAL_BANKS[origin.code]} ({origin.currency}) ↔ {CENTRAL_BANKS[dest.code]} (
                  {dest.currency})
                </span>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#c2f74d] hover:underline"
                >
                  {c.testCorridor} <ArrowRight className="size-3" />
                </Link>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">
                {c.sandboxNotice}
              </p>
            </div>
          </div>
        </div>

        {/* Regional Bloc Filter Bar & 10-Market Directory Cards */}
        <div className="mt-14">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-semibold text-[#141414]">
                {c.dirTitle}
              </h3>
              <p className="text-xs text-[#666960]">
                {c.dirSub}
              </p>
            </div>

            {/* Regional Bloc Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {["ALL", "EAC", "ECOWAS", "SADC", "HORN"].map((bloc) => {
                const count = regionCounts[bloc] ?? 0;
                const active = regionFilter === bloc;
                return (
                  <button
                    key={bloc}
                    type="button"
                    onClick={() => setRegionFilter(bloc)}
                    className={`rounded-full border px-3 py-1 font-mono text-xs font-medium transition ${
                      active
                        ? "border-[#141414] bg-[#141414] text-[#c2f74d]"
                        : "border-[#dfdfd9] bg-white text-[#555850] hover:border-[#141414]/40"
                    }`}
                  >
                    {bloc === "ALL" ? c.allBlocs : bloc} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {filteredMarkets.map((m) => {
              const isOrigin = m.code === origin.code;
              const isDest = m.code === dest.code;
              return (
                <li
                  key={m.code}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                    isOrigin
                      ? "border-[#141414] bg-[#141414] text-white shadow-lg"
                      : isDest
                        ? "border-[#79b200] bg-white ring-2 ring-[#c2f74d]/70"
                        : "border-[#e2e3dd] bg-white hover:border-[#141414]/40 hover:shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Flag code={m.code} className="w-8 rounded-xs shadow-2xs" />
                        <div>
                          <span
                            className={`font-mono text-xs font-bold ${
                              isOrigin ? "text-white" : "text-[#141414]"
                            }`}
                          >
                            {m.code}
                          </span>
                          <span
                            className={`ml-1.5 font-mono text-[11px] ${
                              isOrigin ? "text-white/60" : "text-[#767a70]"
                            }`}
                          >
                            +{DIAL[m.code] ?? ""}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                          isOrigin
                            ? "bg-[#c2f74d] text-[#141414]"
                            : isDest
                              ? "bg-[#141414] text-[#c2f74d]"
                              : "bg-[#f2f3ef] text-[#5c5f57]"
                        }`}
                      >
                        {isOrigin ? c.badgeOrigin : isDest ? c.badgeTarget : m.region}
                      </span>
                    </div>

                    <div className="mt-5 flex items-baseline justify-between">
                      <p
                        className={`text-base font-semibold ${
                          isOrigin ? "text-white" : "text-[#141414]"
                        }`}
                      >
                        {m.name}
                      </p>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          isOrigin ? "text-[#c2f74d]" : "text-[#4d7500]"
                        }`}
                      >
                        {m.currency}
                      </span>
                    </div>

                    <div
                      className={`mt-3 rounded-xl border px-3 py-2 ${
                        isOrigin
                          ? "border-white/12 bg-white/[0.05]"
                          : "border-[#ebece6] bg-[#f9f9f7]"
                      }`}
                    >
                      <p
                        className={`font-mono text-[10px] uppercase tracking-wider ${
                          isOrigin ? "text-white/50" : "text-[#7a7d74]"
                        }`}
                      >
                        {c.primaryRail}
                      </p>
                      <p
                        className={`mt-0.5 truncate text-xs font-medium ${
                          isOrigin ? "text-white/90" : "text-[#22241f]"
                        }`}
                      >
                        {m.provider_name}
                      </p>
                    </div>
                  </div>

                  {/* Quick Set Origin / Set Target Buttons */}
                  <div className="mt-4 grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (m.code === dest.code) {
                          handleSwap();
                        } else {
                          setOriginCode(m.code);
                        }
                      }}
                      className={`rounded-lg border px-2 py-1 font-mono text-[10px] font-semibold transition ${
                        isOrigin
                          ? "border-[#c2f74d] bg-[#c2f74d] text-[#141414]"
                          : "border-[#dfdfd9] bg-white text-[#353731] hover:border-[#141414]"
                      }`}
                    >
                      {isOrigin ? c.originSelected : c.setOrigin}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (m.code === origin.code) {
                          handleSwap();
                        } else {
                          setDestCode(m.code);
                        }
                      }}
                      className={`rounded-lg border px-2 py-1 font-mono text-[10px] font-semibold transition ${
                        isDest
                          ? "border-[#141414] bg-[#141414] text-[#c2f74d]"
                          : isOrigin
                            ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                            : "border-[#dfdfd9] bg-white text-[#353731] hover:border-[#141414]"
                      }`}
                    >
                      {isDest ? c.targetSelected : c.setTarget}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

const FAQ_COPY = {
  en: {
    eyebrow: "Questions",
    title: "What traders ask us first",
    intro: "Something else on your mind? Our support team answers in English, French, Kiswahili, Portuguese and Kinyarwanda.",
    items: [
      [
        "Is VUKA a bank or a mobile money provider?",
        "No. VUKA sits on top of existing mobile money rails. It adds invoices, escrow and a trust record — your money still moves through providers you know.",
      ],
      [
        "Why stablecoin escrow?",
        "A stablecoin escrow on a public chain lets funds lock in a neutral contract both sides can verify, with low fees. You never have to hold crypto: conversion happens at lock and at release.",
      ],
      [
        "What happens if the goods never arrive?",
        "Raise a dispute before release. The funds freeze in the contract until arbitration decides, and the outcome is recorded permanently for both parties.",
      ],
      [
        "Do I need business registration?",
        "No. Informal traders can start with light verification. Fuller verification is only required once your volumes cross a threshold.",
      ],
      [
        "How is my trust score calculated?",
        "Only from real settlement behaviour on VUKA: on-time releases, refunds, disputes and how they resolved. It is never bought or self-reported.",
      ],
    ] as [string, string][],
  },
  fr: {
    eyebrow: "Questions",
    title: "Ce que les commerçants nous demandent en premier",
    intro: "Une autre question ? Notre équipe d'assistance répond en anglais, français, kiswahili, portugais et kinyarwanda.",
    items: [
      [
        "VUKA est-elle une banque ou un opérateur de mobile money ?",
        "Non. VUKA s'appuie sur les réseaux de mobile money existants. Elle ajoute les factures, le séquestre et un registre de confiance — votre argent circule toujours via les opérateurs que vous connaissez.",
      ],
      [
        "Pourquoi un séquestre en stablecoin ?",
        "Un séquestre en stablecoin sur une chaîne publique permet de verrouiller les fonds dans un contrat neutre vérifiable par les deux parties, à faibles frais. Vous n'avez jamais à détenir de crypto : la conversion a lieu au blocage et à la libération.",
      ],
      [
        "Que se passe-t-il si la marchandise n'arrive jamais ?",
        "Ouvrez un litige avant la libération. Les fonds sont gelés dans le contrat jusqu'à la décision d'arbitrage, et l'issue est inscrite de façon permanente pour les deux parties.",
      ],
      [
        "Ai-je besoin d'un registre de commerce ?",
        "Non. Les commerçants informels peuvent démarrer avec une vérification légère. Une vérification complète n'est requise que lorsque vos volumes dépassent un certain seuil.",
      ],
      [
        "Comment mon score de confiance est-il calculé ?",
        "Uniquement à partir de vos règlements réels sur VUKA : libérations ponctuelles, remboursements, litiges et leur résolution. Il ne s'achète jamais et n'est jamais auto-déclaré.",
      ],
    ] as [string, string][],
  },
  sw: {
    eyebrow: "Maswali",
    title: "Maswali ambayo wafanyabiashara hutuuliza kwanza",
    intro: "Una swali lingine? Timu yetu ya msaada inajibu kwa Kiingereza, Kifaransa, Kiswahili, Kireno na Kinyarwanda.",
    items: [
      [
        "Je, VUKA ni benki au mtoa huduma wa pesa za simu?",
        "Hapana. VUKA inakaa juu ya mitandao ya pesa za simu iliyopo. Inaongeza ankara, escrow na rekodi ya imani — pesa zako bado zinapita kwa watoa huduma unaowajua.",
      ],
      [
        "Kwa nini escrow ya stablecoin?",
        "Escrow ya stablecoin kwenye mnyororo wa umma huwezesha fedha kufungwa kwenye mkataba huru ambao pande zote zinaweza kuuthibitisha, kwa ada ndogo. Huhitaji kushikilia sarafu fiche: ubadilishaji hufanyika wakati wa kufunga na kuachia.",
      ],
      [
        "Nini hutokea ikiwa bidhaa hazitafika?",
        "Fungua mgogoro kabla ya kuachiwa. Fedha huganda kwenye mkataba hadi usuluhishi utakapoamua, na matokeo hurekodiwa kudumu kwa pande zote mbili.",
      ],
      [
        "Je, ninahitaji usajili wa biashara?",
        "Hapana. Wafanyabiashara wasio rasmi wanaweza kuanza na uthibitisho mwepesi. Uthibitisho kamili unahitajika tu pale viwango vyako vya biashara vinapovuka kiwango maalum.",
      ],
      [
        "Alama yangu ya imani inakokotolewaje?",
        "Kutokana na tabia halisi ya ulipaji kwenye VUKA pekee: kuachia kwa wakati, marejesho, migogoro na jinsi ilivyotatuliwa. Hainunuliwi wala kujitangaza.",
      ],
    ] as [string, string][],
  },
  pt: {
    eyebrow: "Perguntas",
    title: "O que os comerciantes nos perguntam primeiro",
    intro: "Tem outra dúvida? A nossa equipa de apoio responde em inglês, francês, suaíli, português e kinyarwanda.",
    items: [
      [
        "A VUKA é um banco ou um operador de mobile money?",
        "Não. A VUKA opera sobre as redes de mobile money existentes. Adiciona faturas, caução e um registo de confiança — o seu dinheiro continua a circular pelos operadores que já conhece.",
      ],
      [
        "Porquê caução em stablecoin?",
        "Uma caução em stablecoin numa rede pública permite bloquear fundos num contrato neutro que ambas as partes podem verificar, com taxas baixas. Nunca precisa de deter cripto: a conversão ocorre no bloqueio e na libertação.",
      ],
      [
        "O que acontece se a mercadoria nunca chegar?",
        "Abra um litígio antes da libertação. Os fundos ficam congelados no contrato até que a arbitragem decida, e o resultado fica registado permanentemente para ambas as partes.",
      ],
      [
        "Preciso de registo comercial?",
        "Não. Comerciantes informais podem começar com uma verificação ligeira. A verificação completa só é exigida quando os seus volumes ultrapassam um determinado limite.",
      ],
      [
        "Como é calculada a minha pontuação de confiança?",
        "Apenas a partir do comportamento real de liquidação na VUKA: libertações dentro do prazo, reembolsos, litígios e como foram resolvidos. Nunca é comprada nem autodeclarada.",
      ],
    ] as [string, string][],
  },
  rw: {
    eyebrow: "Ibibazo",
    title: "Ibibazo abacuruzi bakunze kutubaza mbere",
    intro: "Ufite ikindi kibazo? Ikipe yacu y'ubufasha isubiza mu Cyongereza, Igifaransa, Igiswahili, Igiporutugali n'Ikinyarwanda.",
    items: [
      [
        "Ese VUKA ni banki cyangwa ikigo cya mobile money?",
        "Oya. VUKA ikorera hejuru y'imiyoboro ya mobile money isanzwe ihari. Yongeraho inyemezabuguzi, escrow n'amateka y'icyizere — amafaranga yawe akomeza kunyura mu bigo usanzwe uzi.",
      ],
      [
        "Kuki hakoreshwa escrow ya stablecoin?",
        "Escrow ya stablecoin kuri konti rusange ituma amafaranga afungirwa mu masezerano adabogamye impande zombi zishobora kugenzura, ku kiguzi gito. Ntabwo ugomba gutunga crypto: kuvunja bikorwa mu gufunga no mu kurekura amafaranga.",
      ],
      [
        "Bigenda bite iyo ibicuruzwa bitagezeyo?",
        "Tangiza impaka mbere y'uko amafaranga arekurwa. Amafaranga arahagarikwa mu masezerano kugeza ubukemurampaka bufashe umwanzuro, kandi imyanzuro ikandikwa burundu ku mpande zombi.",
      ],
      [
        "Ese nkeneye icyangombwa cy'iyandikishwa ry'ubucuruzi?",
        "Oya. Abacuruzi batanditse bashobora gutangirana n'igenzura ryoroheje. Igenzura ryuzuye risabwa gusa iyo ingano y'ubucuruzi bwawe irenze urugero runaka.",
      ],
      [
        "Amanota yanjye y'icyizere abarwa ate?",
        "Abarwa gusa hakurikijwe imyitwarire nyayo yo kwishyurana kuri VUKA: kurekura amafaranga ku gihe, gusubiza amafaranga, impaka n'uko zakemuwe. Ntabwo agurwa cyangwa ngo umuntu ayishyireho.",
      ],
    ] as [string, string][],
  },
};

function Faq() {
  const c = useLangCopy(FAQ_COPY);
  return (
    <section id="faq" className="scroll-mt-24 border-t border-border bg-surface">
      <div className="vuka-reveal mx-auto grid w-full max-w-[1560px] gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-10 2xl:px-14">
        <SectionHead
          eyebrow={c.eyebrow}
          title={c.title}
          intro={c.intro}
        />
        <Accordion type="single" collapsible className="w-full">
          {c.items.map(([q, a], idx) => (
            <AccordionItem key={idx} value={`faq-${idx}`}>
              <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

const CTA_COPY = {
  en: {
    title: "Your next supplier doesn't need to know you. They need to trust the payment.",
    openAccount: "Open an account",
    talkToUs: "Talk to us",
  },
  fr: {
    title: "Votre prochain fournisseur n'a pas besoin de vous connaître. Il doit pouvoir faire confiance au paiement.",
    openAccount: "Ouvrir un compte",
    talkToUs: "Parlez-nous",
  },
  sw: {
    title: "Muuzaji wako ajaye hahitaji kukufahamu. Anahitaji kuamini malipo.",
    openAccount: "Fungua akaunti",
    talkToUs: "Zungumza nasi",
  },
  pt: {
    title: "O seu próximo fornecedor não precisa de o conhecer. Precisa de confiar no pagamento.",
    openAccount: "Abrir uma conta",
    talkToUs: "Fale connosco",
  },
  rw: {
    title: "Umugurisha ukurikira mukorana ntakenera kukumenya. Akeneye kwizera ubwishyu.",
    openAccount: "Fungura konti",
    talkToUs: "Vugana natwe",
  },
};

function Cta() {
  const c = useLangCopy(CTA_COPY);
  return (
    <section className="relative overflow-hidden border-t border-border">
      <div className="hero-glow pointer-events-none absolute inset-0 rotate-180 opacity-70" aria-hidden="true" />
      <div className="vuka-reveal relative mx-auto w-full max-w-[1560px] px-4 py-28 text-center sm:px-6 lg:px-10 2xl:px-14">
        <h2 className="text-gradient mx-auto max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl">
          {c.title}
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md"
          >
            {c.openAccount}
          </Link>
          <Link to="/support" className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent">
            {c.talkToUs}
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Public landing page shown to signed-out visitors. */
export function Landing() {
  const { t } = useI18n();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".vuka-reveal"));
    if (!els.length) return;
    if (typeof IntersectionObserver === "undefined") {
      for (const el of els) el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -36px 0px" },
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
      >
        {t("skip.content")}
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Journey />
        <EscrowExplained />
        <TrustLab />
        <Mobile />
        <Markets />
        <Faq />
        <Cta />
        <Estimator />
      </main>
      <SiteFooter />
    </div>
  );
}
