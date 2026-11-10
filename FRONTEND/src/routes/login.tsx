import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, BriefcaseBusiness, Eye, EyeOff, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_BUTTON, AUTH_INPUT, AuthError, AuthField, AuthShell } from "@/components/vuka/auth-shared";
import { describeError, isApiError } from "@/lib/api/client";
import { auth, platform } from "@/lib/api/endpoints";
import { useLangCopy, useT, type Lang } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — VUKA" }] }),
  component: Login,
});

type Mode = "trader" | "operator";

const demoAccounts = [
  { key: "traderRw", mode: "trader", identifier: "+250700000991", password: "vuka-demo-2026" },
  { key: "traderKe", mode: "trader", identifier: "+254700000882", password: "vuka-demo-2026" },
  { key: "operator", mode: "operator", identifier: "operator@vuka.local", password: "operator-local-2026" },
  { key: "arbiter", mode: "operator", identifier: "arbiter@vuka.local", password: "arbiter-local-2026" },
] as const;

interface LoginCopy {
  kicker: string;
  title: string;
  subtitle: string;
  accountTypeAria: string;
  traderTab: string;
  operatorTab: string;
  phoneLabel: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  hidePassword: string;
  showPassword: string;
  forgotPassword: string;
  forgotBody: string;
  forgotSupportCta: string;
  signingIn: string;
  signIn: string;
  signedInToast: string;
  invalidTrader: string;
  invalidOperator: string;
  demoHeading: string;
  devOnly: string;
  demoLabels: Record<(typeof demoAccounts)[number]["key"], string>;
  newToVuka: string;
  createAccount: string;
}

const COPY: Record<Lang, LoginCopy> = {
  en: {
    kicker: "Welcome back",
    title: "Sign in to your account",
    subtitle: "Manage invoices, escrows and settlements.",
    accountTypeAria: "Account type",
    traderTab: "Trader",
    operatorTab: "Operator",
    phoneLabel: "Phone number",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    hidePassword: "Hide password",
    showPassword: "Show password",
    forgotPassword: "Forgot password?",
    forgotBody:
      "Self-service reset isn't available yet. Trader passwords require identity confirmation; operator credentials are reset by your platform administrator.",
    forgotSupportCta: "Contact help and support →",
    signingIn: "Signing in...",
    signIn: "Sign in",
    signedInToast: "Signed in successfully",
    invalidTrader: "Invalid phone number or password.",
    invalidOperator: "Invalid email or password.",
    demoHeading: "Demo credentials",
    devOnly: "Dev only",
    demoLabels: {
      traderRw: "Trader (RW)",
      traderKe: "Trader (KE)",
      operator: "Operator",
      arbiter: "Arbiter",
    },
    newToVuka: "New to VUKA?",
    createAccount: "Create an account",
  },
  fr: {
    kicker: "Bon retour",
    title: "Connectez-vous à votre compte",
    subtitle: "Gérez vos factures, séquestres et règlements.",
    accountTypeAria: "Type de compte",
    traderTab: "Commerçant",
    operatorTab: "Opérateur",
    phoneLabel: "Numéro de téléphone",
    emailLabel: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.com",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "Saisissez votre mot de passe",
    hidePassword: "Masquer le mot de passe",
    showPassword: "Afficher le mot de passe",
    forgotPassword: "Mot de passe oublié ?",
    forgotBody:
      "La réinitialisation en libre-service n'est pas encore disponible. Les mots de passe commerçants nécessitent une confirmation d'identité ; les identifiants opérateurs sont réinitialisés par l'administrateur.",
    forgotSupportCta: "Contacter l'aide et l'assistance →",
    signingIn: "Connexion en cours...",
    signIn: "Se connecter",
    signedInToast: "Connexion réussie",
    invalidTrader: "Numéro de téléphone ou mot de passe invalide.",
    invalidOperator: "Adresse e-mail ou mot de passe invalide.",
    demoHeading: "Identifiants de démo",
    devOnly: "Dév uniquement",
    demoLabels: {
      traderRw: "Commerçant (RW)",
      traderKe: "Commerçant (KE)",
      operator: "Opérateur",
      arbiter: "Arbitre",
    },
    newToVuka: "Nouveau sur VUKA ?",
    createAccount: "Créer un compte",
  },
  sw: {
    kicker: "Karibu tena",
    title: "Ingia kwenye akaunti yako",
    subtitle: "Simamia ankara, escrow na malipo.",
    accountTypeAria: "Aina ya akaunti",
    traderTab: "Mfanyabiashara",
    operatorTab: "Mwendeshaji",
    phoneLabel: "Nambari ya simu",
    emailLabel: "Anwani ya barua pepe",
    emailPlaceholder: "wewe@mfano.com",
    passwordLabel: "Nenosiri",
    passwordPlaceholder: "Weka nenosiri lako",
    hidePassword: "Ficha nenosiri",
    showPassword: "Onyesha nenosiri",
    forgotPassword: "Umesahau nenosiri?",
    forgotBody:
      "Kuweka upya nenosiri mwenyewe bado hakupatikani. Manenosiri ya wafanyabiashara yanahitaji uthibitisho wa utambulisho; vitambulisho vya waendeshaji huwekwa upya na msimamizi wa jukwaa.",
    forgotSupportCta: "Wasiliana na msaada →",
    signingIn: "Inaingia...",
    signIn: "Ingia",
    signedInToast: "Umeingia kikamilifu",
    invalidTrader: "Nambari ya simu au nenosiri si sahihi.",
    invalidOperator: "Barua pepe au nenosiri si sahihi.",
    demoHeading: "Akaunti za majaribio",
    devOnly: "Majaribio pekee",
    demoLabels: {
      traderRw: "Mfanyabiashara (RW)",
      traderKe: "Mfanyabiashara (KE)",
      operator: "Mwendeshaji",
      arbiter: "Msuluhishi",
    },
    newToVuka: "Mgeni kwenye VUKA?",
    createAccount: "Fungua akaunti",
  },
  pt: {
    kicker: "Bem-vindo de volta",
    title: "Inicie sessão na sua conta",
    subtitle: "Gira faturas, cauções e liquidações.",
    accountTypeAria: "Tipo de conta",
    traderTab: "Comerciante",
    operatorTab: "Operador",
    phoneLabel: "Número de telefone",
    emailLabel: "Endereço de e-mail",
    emailPlaceholder: "voce@exemplo.com",
    passwordLabel: "Palavra-passe",
    passwordPlaceholder: "Introduza a sua palavra-passe",
    hidePassword: "Ocultar palavra-passe",
    showPassword: "Mostrar palavra-passe",
    forgotPassword: "Esqueceu-se da palavra-passe?",
    forgotBody:
      "A reposição automática ainda não está disponível. As palavras-passe de comerciantes requerem confirmação de identidade; as credenciais de operadores são repostas pelo administrador da plataforma.",
    forgotSupportCta: "Contactar ajuda e suporte →",
    signingIn: "A iniciar sessão...",
    signIn: "Iniciar sessão",
    signedInToast: "Sessão iniciada com sucesso",
    invalidTrader: "Número de telefone ou palavra-passe inválidos.",
    invalidOperator: "E-mail ou palavra-passe inválidos.",
    demoHeading: "Credenciais de demonstração",
    devOnly: "Apenas dev",
    demoLabels: {
      traderRw: "Comerciante (RW)",
      traderKe: "Comerciante (KE)",
      operator: "Operador",
      arbiter: "Árbitro",
    },
    newToVuka: "Novo na VUKA?",
    createAccount: "Criar uma conta",
  },
  rw: {
    kicker: "Ikaze nanone",
    title: "Injira muri konti yawe",
    subtitle: "Cunga inyemezabuguzi, escrow n'ubwishyu.",
    accountTypeAria: "Ubwoko bwa konti",
    traderTab: "Umucuruzi",
    operatorTab: "Umukozi",
    phoneLabel: "Nimero ya telefone",
    emailLabel: "Aderesi ya imeri",
    emailPlaceholder: "wowe@urugero.com",
    passwordLabel: "Ijambo ry'ibanga",
    passwordPlaceholder: "Andika ijambo ryawe ry'ibanga",
    hidePassword: "Hisha ijambo ry'ibanga",
    showPassword: "Erekana ijambo ry'ibanga",
    forgotPassword: "Wibagiwe ijambo ry'ibanga?",
    forgotBody:
      "Kwihindurira ijambo ry'ibanga ntibiratangira gukora. Amagambo y'ibanga y'abacuruzi asaba kwemeza umwirondoro; ay'abakozi asubizwaho n'umuyobozi w'urubuga.",
    forgotSupportCta: "Vugana n'abafasha →",
    signingIn: "Kwinjira...",
    signIn: "Injira",
    signedInToast: "Winjiye neza",
    invalidTrader: "Nimero ya telefone cyangwa ijambo ry'ibanga sibyo.",
    invalidOperator: "Imeri cyangwa ijambo ry'ibanga sibyo.",
    demoHeading: "Konti z'igerageza",
    devOnly: "Igerageza gusa",
    demoLabels: {
      traderRw: "Umucuruzi (RW)",
      traderKe: "Umucuruzi (KE)",
      operator: "Umukozi",
      arbiter: "Umucamanza",
    },
    newToVuka: "Uri mushya kuri VUKA?",
    createAccount: "Fungura konti",
  },
};

function Login() {
  const t = useT();
  const copy = useLangCopy(COPY);
  const { session, refresh } = useSession();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("trader");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });

  const showDemo = config.data?.environment === "development";

  useEffect(() => {
    if (session.status === "trader" || session.status === "operator") {
      void navigate({ to: "/" });
    }
  }, [session.status, navigate]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === "trader") {
        await auth.traderLogin(identifier.trim(), password);
      } else {
        await auth.operatorLogin(identifier.trim(), password);
      }
      await refresh();
      toast.success(copy.signedInToast);
    } catch (err) {
      setError(
        isApiError(err) && err.code === "too_many_attempts"
          ? t("auth.tooMany")
          : isApiError(err) && err.code === "invalid_credentials"
            ? mode === "trader"
              ? copy.invalidTrader
              : copy.invalidOperator
            : describeError(err),
      );
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setIdentifier("");
    setPassword("");
    setError(null);
  }

  return (
    <AuthShell page="login">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{copy.kicker}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{copy.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>

      <div
        role="tablist"
        aria-label={copy.accountTypeAria}
        className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "trader"}
          onClick={() => changeMode("trader")}
          className={cn(
            "flex h-9 items-center justify-center gap-2 rounded-md text-xs font-medium transition-all",
            mode === "trader" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <UserRound className="h-3.5 w-3.5" /> {copy.traderTab}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "operator"}
          onClick={() => changeMode("operator")}
          className={cn(
            "flex h-9 items-center justify-center gap-2 rounded-md text-xs font-medium transition-all",
            mode === "operator" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <BriefcaseBusiness className="h-3.5 w-3.5" /> {copy.operatorTab}
        </button>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <AuthField id="identifier" label={mode === "trader" ? copy.phoneLabel : copy.emailLabel}>
          <div className="relative">
            <Input
              id="identifier"
              name="username"
              className={cn("pr-10", AUTH_INPUT)}
              autoComplete={mode === "trader" ? "tel" : "username"}
              inputMode={mode === "trader" ? "tel" : "email"}
              placeholder={mode === "trader" ? "+250 700 000 000" : copy.emailPlaceholder}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
              {mode === "trader" ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
            </span>
          </div>
        </AuthField>

        <AuthField id="password" label={copy.passwordLabel}>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              className={cn("pr-10", AUTH_INPUT)}
              autoComplete="current-password"
              placeholder={copy.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
              aria-label={showPassword ? copy.hidePassword : copy.showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </AuthField>

        <div className="flex justify-end">
          <details className="group inline-block text-right">
            <summary className="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground hover:underline underline-offset-4 marker:hidden">
              {copy.forgotPassword}
            </summary>
            <div className="absolute right-6 left-6 mt-2 rounded-lg border border-border bg-card p-3 text-[11px] leading-relaxed text-muted-foreground shadow-float z-30">
              <p>{copy.forgotBody}</p>
              <Link to="/support" className="mt-1.5 inline-block font-semibold text-foreground underline underline-offset-2">
                {copy.forgotSupportCta}
              </Link>
            </div>
          </details>
        </div>

        {error ? <AuthError>{error}</AuthError> : null}

        <Button type="submit" disabled={busy || !identifier.trim() || !password} className={cn("w-full group", AUTH_BUTTON)}>
          {busy ? copy.signingIn : copy.signIn}
          {!busy ? <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /> : null}
        </Button>
      </form>

      {showDemo ? (
        <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {copy.demoHeading}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/70">{copy.devOnly}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {demoAccounts.map((account) => (
              <button
                key={account.key}
                type="button"
                className="rounded border border-border bg-background px-2 py-1 font-mono text-[9px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                onClick={() => {
                  changeMode(account.mode);
                  setIdentifier(account.identifier);
                  setPassword(account.password);
                }}
              >
                {copy.demoLabels[account.key]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {copy.newToVuka}{" "}
        <Link to="/register" className="font-semibold text-foreground underline underline-offset-4">
          {copy.createAccount}
        </Link>
      </p>
    </AuthShell>
  );
}
