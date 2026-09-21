import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Lightweight, dependency-free i18n for a continental product: English is the source of truth and
 * every other language falls back to it key by key, so a missing translation never renders a raw
 * key. Coverage today: navigation, shell chrome, authentication and the public landing page.
 * NOTE: French, Kiswahili, Portuguese and Kinyarwanda strings are first-pass and must be reviewed
 * by native speakers (ideally financial-sector terminology reviewers) before public launch.
 */
export type Lang = "en" | "fr" | "sw" | "pt" | "rw";

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "fr", label: "French", native: "Français" },
  { code: "sw", label: "Swahili", native: "Kiswahili" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "rw", label: "Kinyarwanda", native: "Ikinyarwanda" },
];

const en = {
  "app.tagline": "Rise & Cross Over",
  "skip.content": "Skip to main content",
  "nav.overview": "Overview",
  "nav.wallets": "Wallets & Ledger",
  "nav.send": "Send Payment",
  "nav.invoices": "Invoices",
  "nav.trust": "Trust & Credit",
  "nav.corridors": "Corridors",
  "nav.verification": "Verification",
  "nav.insights": "Insights",
  "nav.intelligence": "Network Intelligence",
  "nav.support": "Support",
  "nav.cockpit": "Operations Cockpit",
  "nav.escrow": "Escrow Register",
  "nav.disputes": "Dispute Tribunal",
  "nav.compliance": "Compliance & KYC",
  "nav.providers": "Corridors & Providers",
  "nav.settlements": "Settlements & Pilots",
  "nav.activity": "Activity Log",
  "nav.group.money": "Money",
  "nav.group.trust": "Trust",
  "nav.group.network": "Network",
  "nav.group.operations": "Operations",
  "nav.group.governance": "Governance",
  "shell.menu": "Menu",
  "shell.account": "Account",
  "shell.signOut": "Sign out",
  "shell.theme": "Theme",
  "shell.theme.light": "Light",
  "shell.theme.dark": "Dark",
  "shell.theme.system": "System",
  "shell.language": "Language",
  "shell.search": "Search or jump to…",
  "shell.notifications": "Notifications",
  "shell.engine.online": "Engine online",
  "shell.engine.down": "Engine unreachable",
  "shell.session.title": "Are you still there?",
  "shell.session.body": "For your security you will be signed out soon because of inactivity.",
  "shell.session.stay": "Stay signed in",
  "auth.welcome": "Welcome back",
  "auth.welcome.sub": "Sign in to move money, track invoices and settle across corridors.",
  "auth.trader": "Trader",
  "auth.operator": "Operator / Arbiter",
  "auth.phone": "Mobile number",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.signIn": "Sign in",
  "auth.signingIn": "Signing in…",
  "auth.newHere": "New to VUKA?",
  "auth.createAccount": "Create a trader account",
  "auth.register.title": "Create your trader account",
  "auth.register.sub":
    "You get a business wallet for trade and a separate personal wallet, so business income never mixes with household spending.",
  "auth.haveAccount": "Already registered?",
  "auth.tooMany": "Too many failed attempts. Please wait a few minutes and try again.",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.retry": "Retry",
  "common.loading": "Loading",
  "common.export": "Export CSV",
  "common.search": "Search",
  "common.rows": "rows",
  "common.previous": "Previous",
  "common.next": "Next",
  "landing.eyebrow": "Continental cross-border payments",
  "landing.title": "Trade across borders on trust that is enforced, not just displayed.",
  "landing.lead":
    "VUKA turns mobile-money rails into a trade-grade settlement layer for African SMEs: every payment is bound to an invoice, backed by escrow, priced with a firm quote and recorded in a double-entry ledger.",
  "landing.cta.signin": "Sign in",
  "landing.cta.register": "Open a trader account",
  "landing.how.title": "How a payment works",
  "landing.markets.title": "Markets and corridors",
  "landing.security.title": "Built for regulators and auditors",
} as const;

export type MessageKey = keyof typeof en;
type Dict = Partial<Record<MessageKey, string>>;

const fr: Dict = {
  "app.tagline": "Se lever et traverser",
  "skip.content": "Aller au contenu principal",
  "nav.overview": "Aperçu",
  "nav.wallets": "Portefeuilles et registre",
  "nav.send": "Envoyer un paiement",
  "nav.invoices": "Factures",
  "nav.trust": "Confiance et crédit",
  "nav.corridors": "Corridors",
  "nav.verification": "Vérification",
  "nav.insights": "Analyses",
  "nav.intelligence": "Intelligence réseau",
  "nav.support": "Assistance",
  "nav.cockpit": "Poste de pilotage",
  "nav.escrow": "Registre des séquestres",
  "nav.disputes": "Tribunal des litiges",
  "nav.compliance": "Conformité et KYC",
  "nav.providers": "Corridors et opérateurs",
  "nav.settlements": "Règlements et pilotes",
  "nav.activity": "Journal d'activité",
  "nav.group.money": "Argent",
  "nav.group.trust": "Confiance",
  "nav.group.network": "Réseau",
  "nav.group.operations": "Opérations",
  "nav.group.governance": "Gouvernance",
  "shell.menu": "Menu",
  "shell.account": "Compte",
  "shell.signOut": "Se déconnecter",
  "shell.theme": "Thème",
  "shell.theme.light": "Clair",
  "shell.theme.dark": "Sombre",
  "shell.theme.system": "Système",
  "shell.language": "Langue",
  "shell.search": "Rechercher ou aller à…",
  "shell.notifications": "Notifications",
  "shell.engine.online": "Moteur en ligne",
  "shell.engine.down": "Moteur injoignable",
  "shell.session.title": "Êtes-vous toujours là ?",
  "shell.session.body":
    "Pour votre sécurité, vous allez être déconnecté bientôt pour cause d'inactivité.",
  "shell.session.stay": "Rester connecté",
  "auth.welcome": "Bon retour",
  "auth.welcome.sub":
    "Connectez-vous pour envoyer de l'argent, suivre vos factures et régler entre pays.",
  "auth.trader": "Commerçant",
  "auth.operator": "Opérateur / Arbitre",
  "auth.phone": "Numéro de mobile",
  "auth.email": "E-mail",
  "auth.password": "Mot de passe",
  "auth.signIn": "Se connecter",
  "auth.signingIn": "Connexion…",
  "auth.newHere": "Nouveau sur VUKA ?",
  "auth.createAccount": "Créer un compte commerçant",
  "auth.register.title": "Créez votre compte commerçant",
  "auth.register.sub":
    "Vous obtenez un portefeuille professionnel et un portefeuille personnel séparé, pour ne jamais mélanger revenus d'activité et dépenses du foyer.",
  "auth.haveAccount": "Déjà inscrit ?",
  "auth.tooMany": "Trop de tentatives échouées. Patientez quelques minutes puis réessayez.",
  "common.cancel": "Annuler",
  "common.confirm": "Confirmer",
  "common.retry": "Réessayer",
  "common.loading": "Chargement",
  "common.export": "Exporter en CSV",
  "common.search": "Rechercher",
  "common.rows": "lignes",
  "common.previous": "Précédent",
  "common.next": "Suivant",
  "landing.eyebrow": "Paiements transfrontaliers continentaux",
  "landing.title":
    "Commercez au-delà des frontières avec une confiance garantie, pas seulement affichée.",
  "landing.lead":
    "VUKA transforme les réseaux de monnaie mobile en couche de règlement commerciale pour les PME africaines : chaque paiement est lié à une facture, adossé à un séquestre, tarifé par une cotation ferme et inscrit dans un registre à double entrée.",
  "landing.cta.signin": "Se connecter",
  "landing.cta.register": "Ouvrir un compte commerçant",
  "landing.how.title": "Comment fonctionne un paiement",
  "landing.markets.title": "Marchés et corridors",
  "landing.security.title": "Conçu pour les régulateurs et les auditeurs",
};

const sw: Dict = {
  "app.tagline": "Inuka na Vuka Mipaka",
  "skip.content": "Ruka hadi maudhui makuu",
  "nav.overview": "Muhtasari",
  "nav.wallets": "Pochi na Leja",
  "nav.send": "Tuma Malipo",
  "nav.invoices": "Ankara",
  "nav.trust": "Imani na Mkopo",
  "nav.corridors": "Njia za Malipo",
  "nav.verification": "Uthibitisho",
  "nav.insights": "Uchambuzi",
  "nav.intelligence": "Akili ya Mtandao",
  "nav.support": "Msaada",
  "nav.cockpit": "Kituo cha Uendeshaji",
  "nav.escrow": "Rejista ya Escrow",
  "nav.disputes": "Baraza la Migogoro",
  "nav.compliance": "Utii na KYC",
  "nav.providers": "Njia na Watoa Huduma",
  "nav.settlements": "Malipo ya Mwisho na Majaribio",
  "nav.activity": "Kumbukumbu ya Shughuli",
  "nav.group.money": "Fedha",
  "nav.group.trust": "Imani",
  "nav.group.network": "Mtandao",
  "nav.group.operations": "Uendeshaji",
  "nav.group.governance": "Usimamizi",
  "shell.menu": "Menyu",
  "shell.account": "Akaunti",
  "shell.signOut": "Toka",
  "shell.theme": "Mandhari",
  "shell.theme.light": "Nyepesi",
  "shell.theme.dark": "Nyeusi",
  "shell.theme.system": "Mfumo",
  "shell.language": "Lugha",
  "shell.search": "Tafuta au nenda…",
  "shell.notifications": "Arifa",
  "shell.engine.online": "Mfumo unafanya kazi",
  "shell.engine.down": "Mfumo hauwezi kufikiwa",
  "shell.session.title": "Bado upo?",
  "shell.session.body": "Kwa usalama wako utatolewa hivi karibuni kwa sababu ya kutotumia.",
  "shell.session.stay": "Endelea kuwa ndani",
  "auth.welcome": "Karibu tena",
  "auth.welcome.sub": "Ingia ili kutuma pesa, kufuatilia ankara na kulipa kati ya nchi.",
  "auth.trader": "Mfanyabiashara",
  "auth.operator": "Mwendeshaji / Msuluhishi",
  "auth.phone": "Namba ya simu",
  "auth.email": "Barua pepe",
  "auth.password": "Nenosiri",
  "auth.signIn": "Ingia",
  "auth.signingIn": "Inaingia…",
  "auth.newHere": "Mgeni VUKA?",
  "auth.createAccount": "Fungua akaunti ya mfanyabiashara",
  "auth.register.title": "Fungua akaunti yako ya mfanyabiashara",
  "auth.register.sub":
    "Unapata pochi ya biashara na pochi binafsi tofauti, ili mapato ya biashara yasichanganyike na matumizi ya nyumbani.",
  "auth.haveAccount": "Umeshajisajili?",
  "auth.tooMany": "Majaribio mengi yameshindwa. Subiri dakika chache kisha ujaribu tena.",
  "common.cancel": "Ghairi",
  "common.confirm": "Thibitisha",
  "common.retry": "Jaribu tena",
  "common.loading": "Inapakia",
  "common.export": "Hamisha CSV",
  "common.search": "Tafuta",
  "common.rows": "safu",
  "common.previous": "Iliyotangulia",
  "common.next": "Inayofuata",
  "landing.eyebrow": "Malipo ya kuvuka mipaka barani",
  "landing.title": "Fanya biashara kuvuka mipaka kwa imani inayotekelezwa, si inayoonyeshwa tu.",
  "landing.cta.signin": "Ingia",
  "landing.cta.register": "Fungua akaunti ya mfanyabiashara",
  "landing.how.title": "Malipo yanavyofanya kazi",
  "landing.markets.title": "Masoko na njia za malipo",
  "landing.security.title": "Imejengwa kwa wadhibiti na wakaguzi",
};

const pt: Dict = {
  "app.tagline": "Levante-se e Atravesse",
  "skip.content": "Saltar para o conteúdo principal",
  "nav.overview": "Visão geral",
  "nav.wallets": "Carteiras e razão",
  "nav.send": "Enviar pagamento",
  "nav.invoices": "Faturas",
  "nav.trust": "Confiança e crédito",
  "nav.corridors": "Corredores",
  "nav.verification": "Verificação",
  "nav.insights": "Análises",
  "nav.intelligence": "Inteligência de rede",
  "nav.support": "Apoio",
  "nav.cockpit": "Centro de operações",
  "nav.escrow": "Registo de caução",
  "nav.disputes": "Tribunal de litígios",
  "nav.compliance": "Conformidade e KYC",
  "nav.providers": "Corredores e operadores",
  "nav.settlements": "Liquidações e pilotos",
  "nav.activity": "Registo de atividade",
  "nav.group.money": "Dinheiro",
  "nav.group.trust": "Confiança",
  "nav.group.network": "Rede",
  "nav.group.operations": "Operações",
  "nav.group.governance": "Governação",
  "shell.menu": "Menu",
  "shell.account": "Conta",
  "shell.signOut": "Terminar sessão",
  "shell.theme": "Tema",
  "shell.theme.light": "Claro",
  "shell.theme.dark": "Escuro",
  "shell.theme.system": "Sistema",
  "shell.language": "Idioma",
  "shell.search": "Pesquisar ou ir para…",
  "shell.notifications": "Notificações",
  "shell.engine.online": "Motor ativo",
  "shell.engine.down": "Motor inacessível",
  "shell.session.title": "Ainda está aí?",
  "shell.session.body": "Para sua segurança, a sessão será terminada em breve por inatividade.",
  "shell.session.stay": "Manter sessão",
  "auth.welcome": "Bem-vindo de volta",
  "auth.welcome.sub":
    "Inicie sessão para enviar dinheiro, acompanhar faturas e liquidar entre países.",
  "auth.trader": "Comerciante",
  "auth.operator": "Operador / Árbitro",
  "auth.phone": "Número de telemóvel",
  "auth.email": "E-mail",
  "auth.password": "Palavra-passe",
  "auth.signIn": "Iniciar sessão",
  "auth.signingIn": "A iniciar sessão…",
  "auth.newHere": "Novo na VUKA?",
  "auth.createAccount": "Criar conta de comerciante",
  "auth.register.title": "Crie a sua conta de comerciante",
  "auth.register.sub":
    "Recebe uma carteira empresarial e uma carteira pessoal separada, para que os rendimentos do negócio nunca se misturem com as despesas da casa.",
  "auth.haveAccount": "Já tem conta?",
  "auth.tooMany": "Demasiadas tentativas falhadas. Aguarde alguns minutos e tente novamente.",
  "common.cancel": "Cancelar",
  "common.confirm": "Confirmar",
  "common.retry": "Tentar novamente",
  "common.loading": "A carregar",
  "common.export": "Exportar CSV",
  "common.search": "Pesquisar",
  "common.rows": "linhas",
  "common.previous": "Anterior",
  "common.next": "Seguinte",
  "landing.eyebrow": "Pagamentos transfronteiriços continentais",
  "landing.title": "Comercie além-fronteiras com uma confiança aplicada, não apenas exibida.",
  "landing.cta.signin": "Iniciar sessão",
  "landing.cta.register": "Abrir conta de comerciante",
  "landing.how.title": "Como funciona um pagamento",
  "landing.markets.title": "Mercados e corredores",
  "landing.security.title": "Concebido para reguladores e auditores",
};

const rw: Dict = {
  "app.tagline": "Haguruka Ukore Ku Mipaka",
  "skip.content": "Simbukira ku bikubiyemo by'ingenzi",
  "nav.overview": "Incamake",
  "nav.wallets": "Amashakoshi n'igitabo",
  "nav.send": "Ohereza Amafaranga",
  "nav.invoices": "Inyemezabuguzi",
  "nav.trust": "Icyizere n'inguzanyo",
  "nav.corridors": "Inzira z'ubwishyu",
  "nav.verification": "Igenzura",
  "nav.support": "Ubufasha",
  "shell.menu": "Ibikubiyemo",
  "shell.account": "Konti",
  "shell.signOut": "Sohoka",
  "shell.theme": "Isura",
  "shell.theme.light": "Yoroheje",
  "shell.theme.dark": "Yijimye",
  "shell.theme.system": "Iya sisitemu",
  "shell.language": "Ururimi",
  "auth.welcome": "Ikaze nanone",
  "auth.trader": "Umucuruzi",
  "auth.operator": "Umukozi / Umucamanza",
  "auth.phone": "Nimero ya telefone",
  "auth.email": "Imeri",
  "auth.password": "Ijambo ry'ibanga",
  "auth.signIn": "Injira",
  "auth.signingIn": "Kwinjira…",
  "auth.newHere": "Uri mushya kuri VUKA?",
  "auth.createAccount": "Fungura konti y'umucuruzi",
  "auth.haveAccount": "Usanzwe wanditse?",
  "common.cancel": "Hagarika",
  "common.confirm": "Emeza",
  "common.retry": "Ongera ugerageze",
  "common.loading": "Birimo gutangira",
  "landing.cta.signin": "Injira",
  "landing.cta.register": "Fungura konti y'umucuruzi",
};

const DICTS: Record<Lang, Dict> = { en, fr, sw, pt, rw };
const KEY = "vuka.lang";

type Vars = Record<string, string | number>;
interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: MessageKey, vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function detect(): Lang {
  if (typeof navigator === "undefined") return "en";
  const code = navigator.language.slice(0, 2).toLowerCase();
  return (LANGUAGES.find((l) => l.code === code)?.code as Lang | undefined) ?? "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Start with English on both server and first client render to avoid a hydration mismatch,
  // then adopt the stored / browser language.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    let next = detect();
    try {
      const stored = window.localStorage.getItem(KEY);
      if (stored && LANGUAGES.some((l) => l.code === stored)) next = stored as Lang;
    } catch {
      /* fall back to the browser language */
    }
    setLangState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(KEY, l);
    } catch {
      /* applies for this session only */
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Vars) => {
      let text = DICTS[lang][key] ?? en[key];
      if (vars)
        for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
      return text;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
