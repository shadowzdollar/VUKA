import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Flag } from "./landing/flags";
import { ArrowUp } from "lucide-react";
import { platform } from "@/lib/api/endpoints";
import { LANGUAGES, useI18n, useLangCopy, useT, type Lang } from "@/lib/i18n";
import { VukaLogo } from "./brand";

type FooterLink = { label: string; to?: string; href?: string };

const COPY: Record<
  Lang,
  {
    headlinePrefix: string;
    headlineEm: string;
    headlineSuffix: string;
    summary: string;
    languageLabel: string;
    footerNavAria: string;
    launchMarkets: string;
    sandboxTitle: string;
    sandboxBody: string;
    copyrightSuffix: string;
    termsShort: string;
    privacyShort: string;
    statusShort: string;
    backToTop: string;
    columns: { title: string; links: FooterLink[] }[];
  }
> = {
  en: {
    headlinePrefix: "Trade across borders on trust that is ",
    headlineEm: "enforced",
    headlineSuffix: ", not just displayed.",
    summary:
      "VUKA is the settlement layer between African mobile money and real trade: invoice-linked payments, escrow, firm FX quotes and a ledger both sides can cite.",
    languageLabel: "Language",
    footerNavAria: "Footer",
    launchMarkets: "Launch markets",
    sandboxTitle: "Sandbox environment.",
    sandboxBody:
      "This deployment uses simulated payment rails and indicative reference exchange rates; no live funds move. VUKA is not a licensed payment provider in any jurisdiction, and nothing on this site is financial advice or an offer of services. Operating each corridor requires the relevant licences and partner agreements.",
    copyrightSuffix: "Built for African traders",
    termsShort: "Terms",
    privacyShort: "Privacy",
    statusShort: "Status",
    backToTop: "Back to top",
    columns: [
      {
        title: "Product",
        links: [
          { label: "How a payment works", href: "/#journey" },
          { label: "Cost estimator", href: "/#estimate" },
          { label: "Escrow explained", href: "/#escrow" },
          { label: "VUKA on mobile", href: "/#mobile" },
          { label: "Markets and corridors", href: "/#markets" },
          { label: "Trust score lab", href: "/#trust" },
          { label: "Questions", href: "/#faq" },
        ],
      },
      {
        title: "For traders",
        links: [
          { label: "Open an account", to: "/register" },
          { label: "Sign in", to: "/login" },
          { label: "Send a payment", to: "/send" },
          { label: "Invoices", to: "/escrow" },
          { label: "Verification and limits", to: "/verification" },
          { label: "Help and support", to: "/support" },
        ],
      },
      {
        title: "Trust and security",
        links: [
          { label: "Security practices", to: "/security" },
          { label: "System status", to: "/status" },
          { label: "Data protection", to: "/privacy" },
          { label: "How disputes are resolved", href: "/#escrow" },
          { label: "Report a vulnerability", to: "/security" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About VUKA", to: "/about" },
          { label: "Principles", href: "/about#principles" },
          { label: "Roadmap", href: "/about#roadmap" },
          { label: "Accessibility", href: "/about#accessibility" },
          { label: "Contact", href: "/about#contact" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Terms of use", to: "/terms" },
          { label: "Privacy notice", to: "/privacy" },
          { label: "Cookies and storage", href: "/privacy#storage" },
        ],
      },
    ],
  },
  fr: {
    headlinePrefix: "Commercez au-delà des frontières avec une confiance ",
    headlineEm: "garantie",
    headlineSuffix: ", pas seulement affichée.",
    summary:
      "VUKA est la couche de règlement entre la monnaie mobile africaine et le commerce réel : paiements liés aux factures, séquestre, cotations FX fermes et registre opposable aux deux parties.",
    languageLabel: "Langue",
    footerNavAria: "Pied de page",
    launchMarkets: "Marchés de lancement",
    sandboxTitle: "Environnement bac à sable.",
    sandboxBody:
      "Ce déploiement utilise des rails de paiement simulés et des taux de change de référence indicatifs ; aucun fonds réel ne circule. VUKA n'est un prestataire de paiement agréé dans aucune juridiction, et rien sur ce site ne constitue un conseil financier ou une offre de services. L'exploitation de chaque corridor nécessite les licences et accords partenaires appropriés.",
    copyrightSuffix: "Conçu pour les commerçants africains",
    termsShort: "Conditions",
    privacyShort: "Confidentialité",
    statusShort: "Statut",
    backToTop: "Haut de page",
    columns: [
      {
        title: "Produit",
        links: [
          { label: "Comment fonctionne un paiement", href: "/#journey" },
          { label: "Simulateur de coûts", href: "/#estimate" },
          { label: "Le séquestre expliqué", href: "/#escrow" },
          { label: "VUKA sur mobile", href: "/#mobile" },
          { label: "Marchés et corridors", href: "/#markets" },
          { label: "Laboratoire du score de confiance", href: "/#trust" },
          { label: "Questions fréquentes", href: "/#faq" },
        ],
      },
      {
        title: "Pour les commerçants",
        links: [
          { label: "Ouvrir un compte", to: "/register" },
          { label: "Se connecter", to: "/login" },
          { label: "Envoyer un paiement", to: "/send" },
          { label: "Factures", to: "/escrow" },
          { label: "Vérification et plafonds", to: "/verification" },
          { label: "Aide et assistance", to: "/support" },
        ],
      },
      {
        title: "Confiance et sécurité",
        links: [
          { label: "Pratiques de sécurité", to: "/security" },
          { label: "État du système", to: "/status" },
          { label: "Protection des données", to: "/privacy" },
          { label: "Résolution des litiges", href: "/#escrow" },
          { label: "Signaler une vulnérabilité", to: "/security" },
        ],
      },
      {
        title: "Entreprise",
        links: [
          { label: "À propos de VUKA", to: "/about" },
          { label: "Principes", href: "/about#principles" },
          { label: "Feuille de route", href: "/about#roadmap" },
          { label: "Accessibilité", href: "/about#accessibility" },
          { label: "Contact", href: "/about#contact" },
        ],
      },
      {
        title: "Mentions légales",
        links: [
          { label: "Conditions d'utilisation", to: "/terms" },
          { label: "Politique de confidentialité", to: "/privacy" },
          { label: "Cookies et stockage", href: "/privacy#storage" },
        ],
      },
    ],
  },
  sw: {
    headlinePrefix: "Fanya biashara kuvuka mipaka kwa imani ",
    headlineEm: "inayotekelezwa",
    headlineSuffix: ", si inayoonyeshwa tu.",
    summary:
      "VUKA ni safu ya malipo kati ya pesa za simu barani Afrika na biashara halisi: malipo yanayofungwa na ankara, escrow, viwango thabiti vya FX na leja ambayo pande zote mbili zinaweza kurejelea.",
    languageLabel: "Lugha",
    footerNavAria: "Kijachini",
    launchMarkets: "Masoko ya uzinduzi",
    sandboxTitle: "Mazingira ya majaribio (sandbox).",
    sandboxBody:
      "Toleo hili linatumia njia za malipo za majaribio na viwango elekezi vya kubadilisha fedha; hakuna pesa halisi zinazohamishwa. VUKA haina leseni ya kutoa huduma za malipo katika nchi yoyote, na hakuna chochote kwenye tovuti hii kilicho ushauri wa kifedha au ofa ya huduma. Kuendesha kila njia kunahitaji leseni husika na mikataba ya washirika.",
    copyrightSuffix: "Imejengwa kwa wafanyabiashara wa Afrika",
    termsShort: "Masharti",
    privacyShort: "Faragha",
    statusShort: "Hali ya mfumo",
    backToTop: "Rudi juu",
    columns: [
      {
        title: "Bidhaa",
        links: [
          { label: "Malipo yanavyofanya kazi", href: "/#journey" },
          { label: "Kikokotoo cha gharama", href: "/#estimate" },
          { label: "Maelezo ya escrow", href: "/#escrow" },
          { label: "VUKA kwenye simu", href: "/#mobile" },
          { label: "Masoko na njia za malipo", href: "/#markets" },
          { label: "Maabara ya alama ya uaminifu", href: "/#trust" },
          { label: "Maswali", href: "/#faq" },
        ],
      },
      {
        title: "Kwa wafanyabiashara",
        links: [
          { label: "Fungua akaunti", to: "/register" },
          { label: "Ingia", to: "/login" },
          { label: "Tuma malipo", to: "/send" },
          { label: "Ankara", to: "/escrow" },
          { label: "Uthibitisho na viwango", to: "/verification" },
          { label: "Msaada na usaidizi", to: "/support" },
        ],
      },
      {
        title: "Uaminifu na usalama",
        links: [
          { label: "Taratibu za usalama", to: "/security" },
          { label: "Hali ya mfumo", to: "/status" },
          { label: "Ulinzi wa data", to: "/privacy" },
          { label: "Utatuzi wa migogoro", href: "/#escrow" },
          { label: "Ripoti udhaifu wa kiusalama", to: "/security" },
        ],
      },
      {
        title: "Kampuni",
        links: [
          { label: "Kuhusu VUKA", to: "/about" },
          { label: "Kanuni", href: "/about#principles" },
          { label: "Mpango wa maendeleo", href: "/about#roadmap" },
          { label: "Ufikivu", href: "/about#accessibility" },
          { label: "Mawasiliano", href: "/about#contact" },
        ],
      },
      {
        title: "Kisheria",
        links: [
          { label: "Masharti ya matumizi", to: "/terms" },
          { label: "Ilani ya faragha", to: "/privacy" },
          { label: "Vidakuzi na hifadhi", href: "/privacy#storage" },
        ],
      },
    ],
  },
  pt: {
    headlinePrefix: "Comercie além-fronteiras com uma confiança ",
    headlineEm: "aplicada",
    headlineSuffix: ", não apenas exibida.",
    summary:
      "A VUKA é a camada de liquidação entre o dinheiro móvel africano e o comércio real: pagamentos ligados a faturas, caução (escrow), cotações cambiais firmes e um razão que ambas as partes podem citar.",
    languageLabel: "Idioma",
    footerNavAria: "Rodapé",
    launchMarkets: "Mercados de lançamento",
    sandboxTitle: "Ambiente de testes (sandbox).",
    sandboxBody:
      "Esta implementação utiliza canais de pagamento simulados e taxas de câmbio de referência indicativas; nenhum fundo real é movimentado. A VUKA não é um prestador de serviços de pagamento licenciado em nenhuma jurisdição e nada neste site constitui aconselhamento financeiro ou oferta de serviços. Operar cada corredor requer as respetivas licenças e acordos de parceria.",
    copyrightSuffix: "Construído para comerciantes africanos",
    termsShort: "Termos",
    privacyShort: "Privacidade",
    statusShort: "Estado",
    backToTop: "Voltar ao topo",
    columns: [
      {
        title: "Produto",
        links: [
          { label: "Como funciona um pagamento", href: "/#journey" },
          { label: "Simulador de custos", href: "/#estimate" },
          { label: "Caução explicada", href: "/#escrow" },
          { label: "VUKA no telemóvel", href: "/#mobile" },
          { label: "Mercados e corredores", href: "/#markets" },
          { label: "Laboratório de confiança", href: "/#trust" },
          { label: "Perguntas frequentes", href: "/#faq" },
        ],
      },
      {
        title: "Para comerciantes",
        links: [
          { label: "Abrir uma conta", to: "/register" },
          { label: "Iniciar sessão", to: "/login" },
          { label: "Enviar um pagamento", to: "/send" },
          { label: "Faturas", to: "/escrow" },
          { label: "Verificação e limites", to: "/verification" },
          { label: "Ajuda e suporte", to: "/support" },
        ],
      },
      {
        title: "Confiança e segurança",
        links: [
          { label: "Práticas de segurança", to: "/security" },
          { label: "Estado do sistema", to: "/status" },
          { label: "Proteção de dados", to: "/privacy" },
          { label: "Como são resolvidos os litígios", href: "/#escrow" },
          { label: "Reportar uma vulnerabilidade", to: "/security" },
        ],
      },
      {
        title: "Empresa",
        links: [
          { label: "Sobre a VUKA", to: "/about" },
          { label: "Princípios", href: "/about#principles" },
          { label: "Roteiro", href: "/about#roadmap" },
          { label: "Acessibilidade", href: "/about#accessibility" },
          { label: "Contacto", href: "/about#contact" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Termos de utilização", to: "/terms" },
          { label: "Aviso de privacidade", to: "/privacy" },
          { label: "Cookies e armazenamento", href: "/privacy#storage" },
        ],
      },
    ],
  },
  rw: {
    headlinePrefix: "Curuza wambukiranya imipaka ku cyizere ",
    headlineEm: "cyubahirizwa",
    headlineSuffix: ", atari icyanditse gusa.",
    summary:
      "VUKA ni urwego rw'ubwishyu ruhuza mobile money yo muri Afurika n'ubucuruzi nyabwo: ubwishyu buhujwe n'inyemezabuguzi, escrow, ibiciro by'ivunjisha bidahinduka n'igitabo cy'ibaruramari impande zombi zishingiraho.",
    languageLabel: "Ururimi",
    footerNavAria: "Imperampangano",
    launchMarkets: "Amasoko yatangirijweho",
    sandboxTitle: "urubuga rw'igerageza (Sandbox).",
    sandboxBody:
      "Uru rubuga rukoresha inzira z'ubwishyu z'igerageza n'ibipimo by'ivunjisha ngenderwaho; nta mafaranga nyayo ava aho ari. VUKA ntabwo ari ikigo cy'ubwishyu gifite uruhushya mu gihugu icyo ari cyo cyose, kandi nta kiri kuri uru rubuga cyafatwa nk'inama y'imari cyangwa serivisi. Gukoresha buri nzira bisaba impushya n'amasezerano y'abafatanyabikorwa.",
    copyrightSuffix: "Rwakorewe abacuruzi b'Abanyafurika",
    termsShort: "Amabwiriza",
    privacyShort: "Ibanga",
    statusShort: "Imikorere",
    backToTop: "Subira hejuru",
    columns: [
      {
        title: "Igicuruzwa",
        links: [
          { label: "Uko ubwishyu bukora", href: "/#journey" },
          { label: "Ibara ry'ikiguzi", href: "/#estimate" },
          { label: " uko Escrow ikora", href: "/#escrow" },
          { label: "VUKA kuri telefone", href: "/#mobile" },
          { label: "Amasoko n'inzira z'ubwishyu", href: "/#markets" },
          { label: " Laboratwari y'amanota y'icyizere", href: "/#trust" },
          { label: "Ibibazo", href: "/#faq" },
        ],
      },
      {
        title: "Ku bacuruzi",
        links: [
          { label: "Fungura konti", to: "/register" },
          { label: "Injira", to: "/login" },
          { label: "Ohereza ubwishyu", to: "/send" },
          { label: "Inyemezabuguzi", to: "/escrow" },
          { label: "Igenzura n'imbago", to: "/verification" },
          { label: "Ubufasha", to: "/support" },
        ],
      },
      {
        title: "Icyizere n'umutekano",
        links: [
          { label: "Ingamba z'umutekano", to: "/security" },
          { label: "Imikorere ya sisitemu", to: "/status" },
          { label: "Kurinda amakuru", to: "/privacy" },
          { label: "Uko impaka zikemurwa", href: "/#escrow" },
          { label: "Menyesha ikibazo cy'umutekano", to: "/security" },
        ],
      },
      {
        title: "Ikigo",
        links: [
          { label: "Ibyerekeye VUKA", to: "/about" },
          { label: "Amahame", href: "/about#principles" },
          { label: "Icyerekezo", href: "/about#roadmap" },
          { label: " korohereza bose", href: "/about#accessibility" },
          { label: "Twandikire", href: "/about#contact" },
        ],
      },
      {
        title: "Amategeko",
        links: [
          { label: "Amabwiriza yo gukoresha", to: "/terms" },
          { label: "Politiki y'ibanga", to: "/privacy" },
          { label: "Cookies n'ububiko", href: "/privacy#storage" },
        ],
      },
    ],
  },
};

function FooterAnchor({ l }: { l: FooterLink }) {
  const cls =
    "text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";
  return l.to ? (
    <Link to={l.to} className={cls}>
      {l.label}
    </Link>
  ) : (
    <a href={l.href} className={cls}>
      {l.label}
    </a>
  );
}

export function SiteFooter() {
  const t = useT();
  const { lang, setLang } = useI18n();
  const copy = useLangCopy(COPY);
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });
  const markets = config.data?.countries ?? [];

  return (
    <footer className="border-t border-border bg-muted/30" data-app-chrome>
      <div className="mx-auto px-4 pt-14 sm:px-6 lg:px-10 2xl:px-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <VukaLogo size="xl" tagline={t("app.tagline")} />
            <p className="mt-5 max-w-sm font-display text-xl leading-snug">
              {copy.headlinePrefix}
              <em>{copy.headlineEm}</em>
              {copy.headlineSuffix}
            </p>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">{copy.summary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="footer-lang">
                {copy.languageLabel}
              </label>
              <select
                id="footer-lang"
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="h-9 border border-border bg-background px-2 font-mono text-xs"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <nav
            aria-label={copy.footerNavAria}
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5"
          >
            {copy.columns.map((col) => (
              <div key={col.title}>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.22em]">{col.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <FooterAnchor l={l} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {markets.length ? (
          <div className="mt-12 border-t border-border pt-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.22em]">{copy.launchMarkets}</h2>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              {markets.map((m) => (
                <li key={m.code} className="flex items-center gap-1.5">
                  <Flag code={m.code} className="w-4 shrink-0" />
                  {m.name} <span className="font-mono text-[11px]">{m.currency}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 border border-dashed border-border p-4 text-xs text-muted-foreground">
          <strong className="font-medium text-foreground">{copy.sandboxTitle}</strong>{" "}
          {copy.sandboxBody}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            © {new Date().getFullYear()} VUKA · {copy.copyrightSuffix}
          </p>
          <div className="flex items-center gap-5 text-xs">
            <Link to="/terms" className="underline-offset-4 hover:underline">
              {copy.termsShort}
            </Link>
            <Link to="/privacy" className="underline-offset-4 hover:underline">
              {copy.privacyShort}
            </Link>
            <Link to="/status" className="underline-offset-4 hover:underline">
              {copy.statusShort}
            </Link>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] hover:underline"
            >
              {copy.backToTop} <ArrowUp className="size-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="select-none overflow-hidden border-t border-border">
        <div
          data-word="vuka"
          className="mx-auto whitespace-nowrap px-4 text-center font-display text-[24vw] leading-[0.8] tracking-tight text-foreground/[0.06] before:content-[attr(data-word)] sm:px-6 lg:px-10 2xl:px-16 lg:text-[15rem]"
        />
      </div>
    </footer>
  );
}
