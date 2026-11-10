import { useLangCopy, type Lang } from "@/lib/i18n";
import { PublicPage, Section } from "../public-page";

interface TermsCopy {
  kicker: string;
  titlePrefix: string;
  titleEm: string;
  titleSuffix: string;
  lead: string;
  toc: { id: string; label: string }[];
  sandboxTitle: string;
  sandboxPrefix: string;
  sandboxStrong: string;
  sandboxSuffix: string;
  accountsTitle: string;
  accountsItems: string[];
  paymentsTitle: string;
  paymentsItems: string[];
  acceptableTitle: string;
  acceptableBody: string;
  liabilityTitle: string;
  liabilityBody: string;
}

const COPY: Record<Lang, TermsCopy> = {
  en: {
    kicker: "Terms of use",
    titlePrefix: "The ground rules, ",
    titleEm: "in plain words",
    titleSuffix: ".",
    lead: "Draft terms describing how the sandbox platform is intended to be used.",
    toc: [
      { id: "sandbox", label: "Sandbox status" },
      { id: "accounts", label: "Accounts" },
      { id: "payments", label: "Payments and escrow" },
      { id: "acceptable", label: "Acceptable use" },
      { id: "liability", label: "Liability" },
    ],
    sandboxTitle: "1. Sandbox status",
    sandboxPrefix: "The platform is currently a ",
    sandboxStrong: "sandbox",
    sandboxSuffix:
      ". Balances are simulated, payout rails do not move real money, and nothing here is a financial service until the operator states in writing that a specific corridor is live and licensed.",
    accountsTitle: "2. Accounts",
    accountsItems: [
      "You must provide accurate information and keep your password secret.",
      "You are responsible for activity under your account.",
      "Limits depend on your verification tier and may change as you verify.",
    ],
    paymentsTitle: "3. Payments and escrow",
    paymentsItems: [
      "A firm quote is valid for its stated period; after that a new quote is required.",
      "Escrow follows the contract's published rules: confirmation releases to the supplier, silence refunds the buyer, disputes go to an arbiter, and an unanswered dispute falls back to an even split.",
      "Payments that fail screening or exceed limits are refused; no payment is completed without a balanced ledger entry.",
    ],
    acceptableTitle: "4. Acceptable use",
    acceptableBody:
      "You must not use the platform for unlawful activity, sanctions evasion, fraud, or to interfere with its operation or other users' access.",
    liabilityTitle: "5. Liability",
    liabilityBody:
      "To be settled with counsel before launch, including governing law, dispute forum and limits of liability appropriate to each jurisdiction. Until then, do not rely on the sandbox for real financial decisions.",
  },
  fr: {
    kicker: "Conditions d'utilisation",
    titlePrefix: "Les règles de base, ",
    titleEm: "en termes simples",
    titleSuffix: ".",
    lead: "Projet de conditions décrivant l'usage prévu de la plateforme bac à sable.",
    toc: [
      { id: "sandbox", label: "Statut bac à sable" },
      { id: "accounts", label: "Comptes" },
      { id: "payments", label: "Paiements et séquestre" },
      { id: "acceptable", label: "Utilisation acceptable" },
      { id: "liability", label: "Responsabilité" },
    ],
    sandboxTitle: "1. Statut bac à sable",
    sandboxPrefix: "La plateforme est actuellement un ",
    sandboxStrong: "bac à sable (sandbox)",
    sandboxSuffix:
      ". Les soldes sont simulés, les rails de paiement ne déplacent pas d'argent réel et rien ici ne constitue un service financier tant que l'opérateur n'a pas déclaré par écrit qu'un corridor spécifique est actif et agréé.",
    accountsTitle: "2. Comptes",
    accountsItems: [
      "Vous devez fournir des informations exactes et garder votre mot de passe confidentiel.",
      "Vous êtes responsable de l'activité effectuée sous votre compte.",
      "Les plafonds dépendent de votre palier de vérification et évoluent au fil de vos vérifications.",
    ],
    paymentsTitle: "3. Paiements et séquestre",
    paymentsItems: [
      "Une cotation ferme est valable pendant la durée indiquée ; au-delà, une nouvelle cotation est requise.",
      "Le séquestre suit les règles publiées du contrat : la confirmation libère les fonds au fournisseur, le silence rembourse l'acheteur, les litiges sont soumis à un arbitre et un litige sans réponse aboutit à un partage à parts égales.",
      "Les paiements qui échouent aux contrôles de conformité ou dépassent les plafonds sont refusés ; aucun paiement n'est finalisé sans écriture comptable équilibrée.",
    ],
    acceptableTitle: "4. Utilisation acceptable",
    acceptableBody:
      "Vous ne devez pas utiliser la plateforme pour des activités illicites, le contournement de sanctions, la fraude ou pour entraver son fonctionnement ou l'accès des autres utilisateurs.",
    liabilityTitle: "5. Responsabilité",
    liabilityBody:
      "À finaliser avec un conseil juridique avant le lancement, y compris le droit applicable, la juridiction compétente et les limites de responsabilité propres à chaque pays. D'ici là, ne vous fiez pas au bac à sable pour des décisions financières réelles.",
  },
  sw: {
    kicker: "Masharti ya matumizi",
    titlePrefix: "Sheria za msingi, ",
    titleEm: "kwa maneno rahisi",
    titleSuffix: ".",
    lead: "Rasimu ya masharti inayoelezea jinsi jukwaa la majaribio linavyokusudiwa kutumiwa.",
    toc: [
      { id: "sandbox", label: "Hali ya majaribio" },
      { id: "accounts", label: "Akaunti" },
      { id: "payments", label: "Malipo na escrow" },
      { id: "acceptable", label: "Matumizi yanayokubalika" },
      { id: "liability", label: "Dhima" },
    ],
    sandboxTitle: "1. Hali ya majaribio (Sandbox)",
    sandboxPrefix: "Jukwaa hili kwa sasa ni la ",
    sandboxStrong: "majaribio (sandbox)",
    sandboxSuffix:
      ". Salio ni za kuigiza, njia za malipo hazihamishi pesa halisi, na hakuna chochote hapa kilicho huduma ya kifedha hadi mwendeshaji atakapoeleza kwa maandishi kuwa njia fulani ya malipo iko hai na ina leseni.",
    accountsTitle: "2. Akaunti",
    accountsItems: [
      "Lazima utoe taarifa sahihi na utunze siri ya nenosiri lako.",
      "Unawajibika kwa shughuli zote chini ya akaunti yako.",
      "Viwango vya ukomo vinategemea daraja lako la uthibitisho na vinaweza kubadilika unavyozidi kuthibitisha.",
    ],
    paymentsTitle: "3. Malipo na escrow",
    paymentsItems: [
      "Nukuu thabiti ya bei ni halali kwa muda uliotajwa; baada ya hapo nukuu mpya inahitajika.",
      "Escrow inafuata sheria zilizochapishwa za mkataba: uthibitisho hutoa pesa kwa muuzaji, ukimya humrudishia mnunuzi pesa, migogoro huenda kwa msuluhishi, na mgogoro usiojibiwa hugawanywa nusu kwa nusu.",
      "Malipo yanayoshindwa kwenye uchunguzi wa usalama au yanayozidi viwango vya ukomo yanakataliwa; hakuna malipo yanayokamilika bila ingizo la leja lililowiana.",
    ],
    acceptableTitle: "4. Matumizi yanayokubalika",
    acceptableBody:
      "Hupaswi kutumia jukwaa kwa shughuli zisizo halali, kukwepa vikwazo, ulaghai, au kuingilia uendeshaji wake au ufikiaji wa watumiaji wengine.",
    liabilityTitle: "5. Dhima",
    liabilityBody:
      "Itakamilishwa na wanasheria kabla ya uzinduzi, ikijumuisha sheria inayoongoza, mahakama ya migogoro na mipaka ya dhima inayofaa kwa kila nchi. Hadi wakati huo, usitegemee mazingira ya majaribio kwa maamuzi halisi ya kifedha.",
  },
  pt: {
    kicker: "Termos de utilização",
    titlePrefix: "As regras de base, ",
    titleEm: "em palavras simples",
    titleSuffix: ".",
    lead: "Rascunho dos termos que descrevem como a plataforma sandbox deve ser utilizada.",
    toc: [
      { id: "sandbox", label: "Estado sandbox" },
      { id: "accounts", label: "Contas" },
      { id: "payments", label: "Pagamentos e caução" },
      { id: "acceptable", label: "Utilização aceitável" },
      { id: "liability", label: "Responsabilidade" },
    ],
    sandboxTitle: "1. Estado sandbox",
    sandboxPrefix: "A plataforma é atualmente uma ",
    sandboxStrong: "sandbox",
    sandboxSuffix:
      ". Os saldos são simulados, os canais de pagamento não movimentam dinheiro real e nada aqui constitui um serviço financeiro até que o operador declare por escrito que um corredor específico está ativo e licenciado.",
    accountsTitle: "2. Contas",
    accountsItems: [
      "Deve fornecer informações exatas e manter a sua palavra-passe secreta.",
      "É responsável pela atividade realizada na sua conta.",
      "Os limites dependem do seu escalão de verificação e podem mudar à medida que verifica os seus dados.",
    ],
    paymentsTitle: "3. Pagamentos e caução (escrow)",
    paymentsItems: [
      "Uma cotação firme é válida pelo período indicado; após esse prazo é necessária uma nova cotação.",
      "A caução segue as regras publicadas do contrato: a confirmação liberta os fundos para o fornecedor, o silêncio reembolsa o comprador, os litígios vão para um árbitro e um litígio sem resposta resulta numa divisão em partes iguais.",
      "Os pagamentos que falhem a triagem ou excedam os limites são recusados; nenhum pagamento é concluído sem um lançamento equilibrado no razão.",
    ],
    acceptableTitle: "4. Utilização aceitável",
    acceptableBody:
      "Não deve utilizar a plataforma para atividades ilícitas, evasão a sanções, fraude ou para interferir com o seu funcionamento ou com o acesso de outros utilizadores.",
    liabilityTitle: "5. Responsabilidade",
    liabilityBody:
      "A definir com consultores jurídicos antes do lançamento, incluindo lei aplicável, foro de resolução de litígios e limites de responsabilidade adequados a cada jurisdição. Até lá, não confie na sandbox para decisões financeiras reais.",
  },
  rw: {
    kicker: "Amabwiriza yo gukoresha",
    titlePrefix: "Amategeko shingiro, ",
    titleEm: "mu magambo yoroshye",
    titleSuffix: ".",
    lead: "Umushinga w'amabwiriza asobanura uko urubuga rw'igerageza (sandbox) rugenewe gukoreshwa.",
    toc: [
      { id: "sandbox", label: "Imiterere ya Sandbox" },
      { id: "accounts", label: "Konti" },
      { id: "payments", label: "Ubwishyu na escrow" },
      { id: "acceptable", label: "Imikoreshereze yemewe" },
      { id: "liability", label: "Inshingano mu mategeko" },
    ],
    sandboxTitle: "1. Imiterere y'igerageza (Sandbox)",
    sandboxPrefix: "Uru rubuga ubu ruri mu rwego rw'",
    sandboxStrong: "igerageza (sandbox)",
    sandboxSuffix:
      ". Amafaranga agaragara ni ay'igerageza, inzira z'ubwishyu ntizimura amafaranga nyayo, kandi nta kiri hano cyafatwa nka serivisi y'imari kugeza igihe ubuyobozi bw'urubuga butangarije mu nyandiko ko inzira runaka y'ubwishyu ikora ku mugaragaro kandi ifite uruhushya.",
    accountsTitle: "2. Konti",
    accountsItems: [
      "Ugomba gutanga amakuru y'ukuri kandi ukabika ijambo ryawe ry'ibanga mu ibanga.",
      "Ubaza ibikorwa byose bikorerwa kuri konti yawe.",
      "Imbago z'amafaranga ziterwa n'icyiciro cy'igenzura ugezemo kandi zishobora guhinduka uko ugenzurwa.",
    ],
    paymentsTitle: "3. Ubwishyu na escrow",
    paymentsItems: [
      "Igiciro cyemejwe (firm quote) gifite agaciro mu gihe cyagaragajwe; iyo kirangiye hasabwa ikindi giciro gishya.",
      "Escrow ikurikiza amategeko y'amasezerano yatangajwe: kwemeza kohereza amafaranga ku wagurishije, guceceka gusubiza amafaranga umuguzi, impaka zijya ku mucamanza, kandi impaka zitabonye igisubizo zigabanywa 50/50.",
      "Ubwishyu butsinzwe mu igenzura cyangwa burenga imbago burangwa; nta bwishyu bwemerwa hatabayeho inyandiko iringaniye mu gitabo cy'ibaruramari.",
    ],
    acceptableTitle: "4. Imikoreshereze yemewe",
    acceptableBody:
      "Ntugomba gukoresha urubuga mu bikorwa binyuranyije n'amategeko, guca ku ruhande ibihano mpuzamahanga, uburiganya, cyangwa kubangamira imikorere yarwo cyangwa abandi bakoresha.",
    liabilityTitle: "5. Inshingano mu mategeko",
    liabilityBody:
      "Bizanozwa n'abanyamategeko mbere yo gutangiza urubuga ku mugaragaro, harimo amategeko agenga amasezerano, urwego rukemura impaka n'imbago z'inshingano zikwiye buri gihugu. Kugeza icyo gihe, ntukishingikirize kuri uru rubuga rw'igerageza mu gufata ibyemezo nyabyo by'imari.",
  },
};

export function TermsPage() {
  const copy = useLangCopy(COPY);
  return (
    <PublicPage
      kicker={copy.kicker}
      title={
        <>
          {copy.titlePrefix}
          <em>{copy.titleEm}</em>
          {copy.titleSuffix}
        </>
      }
      lead={copy.lead}
      draft
      toc={copy.toc}
    >
      <Section id="sandbox" title={copy.sandboxTitle}>
        <p>
          {copy.sandboxPrefix}
          <strong>{copy.sandboxStrong}</strong>
          {copy.sandboxSuffix}
        </p>
      </Section>
      <Section id="accounts" title={copy.accountsTitle}>
        <ul>
          {copy.accountsItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>
      <Section id="payments" title={copy.paymentsTitle}>
        <ul>
          {copy.paymentsItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>
      <Section id="acceptable" title={copy.acceptableTitle}>
        <p>{copy.acceptableBody}</p>
      </Section>
      <Section id="liability" title={copy.liabilityTitle}>
        <p>{copy.liabilityBody}</p>
      </Section>
    </PublicPage>
  );
}
