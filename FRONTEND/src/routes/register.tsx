import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Phone,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_BUTTON, AUTH_INPUT, AuthError, AuthField, AuthShell } from "@/components/vuka/auth-shared";
import { describeError, isApiError } from "@/lib/api/client";
import { auth } from "@/lib/api/endpoints";
import { useLangCopy, type Lang } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — VUKA" }] }),
  component: Register,
});

type AccountType = "business" | "individual";

interface FormState {
  accountType: AccountType;
  fullName: string;
  businessName: string;
  registrationNumber: string;
  country: string;
  currency: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

const COUNTRIES = [
  { code: "RW", name: "Rwanda", currency: "RWF", dial: "+250" },
  { code: "KE", name: "Kenya", currency: "KES", dial: "+254" },
  { code: "UG", name: "Uganda", currency: "UGX", dial: "+256" },
  { code: "TZ", name: "Tanzania", currency: "TZS", dial: "+255" },
  { code: "NG", name: "Nigeria", currency: "NGN", dial: "+234" },
  { code: "GH", name: "Ghana", currency: "GHS", dial: "+233" },
  { code: "ZA", name: "South Africa", currency: "ZAR", dial: "+27" },
  { code: "CD", name: "DR Congo", currency: "USD", dial: "+243" },
  { code: "ET", name: "Ethiopia", currency: "ETB", dial: "+251" },
];

interface RegisterCopy {
  kicker: string;
  title: string;
  step0Lead: string;
  businessTitle: string;
  businessDesc: string;
  individualTitle: string;
  individualDesc: string;
  continueBtn: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  businessNameLabel: string;
  businessNamePlaceholder: string;
  regNumberLabel: string;
  regNumberHint: string;
  regNumberPlaceholder: string;
  countryLabel: string;
  currencyLabel: string;
  phoneLabel: string;
  backBtn: string;
  nextSecurityBtn: string;
  createPasswordLabel: string;
  passwordPlaceholder: string;
  hidePassword: string;
  showPassword: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  goodSecurity: string;
  min8Chars: string;
  agreePrefix: string;
  termsLink: string;
  agreeMid: string;
  privacyLink: string;
  agreeSuffix: string;
  reviewDetailsBtn: string;
  summaryAccountType: string;
  summaryFullName: string;
  summaryBusiness: string;
  summaryCountryCurrency: string;
  summaryPhone: string;
  editBtn: string;
  creatingAccount: string;
  completeRegBtn: string;
  haveAccount: string;
  signIn: string;
  welcomeTitle: string;
  welcomeBody: string;
  goToDashboard: string;
  createdToast: string;
  errFullName: string;
  errBusinessName: string;
  errPhone: string;
  errPasswordLen: string;
  errPasswordMatch: string;
  errAgreeTerms: string;
  errConflict: string;
}

const COPY: Record<Lang, RegisterCopy> = {
  en: {
    kicker: "Get started",
    title: "Create your account",
    step0Lead: "Select the structure that matches your trade operations:",
    businessTitle: "Registered business",
    businessDesc: "For registered companies, freight forwarders, manufacturers and trade houses.",
    individualTitle: "Individual trader",
    individualDesc: "For sole proprietors, independent brokers and individual merchant importers.",
    continueBtn: "Continue",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "e.g. Samuel Mugisha",
    businessNameLabel: "Business / company name",
    businessNamePlaceholder: "e.g. Great Lakes Logistics Ltd",
    regNumberLabel: "Business reg. / TIN (optional)",
    regNumberHint: "Helps speed up settlement limit verification.",
    regNumberPlaceholder: "e.g. 100234567",
    countryLabel: "Primary country",
    currencyLabel: "Operating currency",
    phoneLabel: "Mobile phone (login & OTP)",
    backBtn: "Back",
    nextSecurityBtn: "Next: Security",
    createPasswordLabel: "Create password",
    passwordPlaceholder: "At least 8 characters",
    hidePassword: "Hide password",
    showPassword: "Show password",
    confirmPasswordLabel: "Confirm password",
    confirmPasswordPlaceholder: "Repeat your password",
    goodSecurity: "Good security level",
    min8Chars: "Minimum 8 characters",
    agreePrefix: "I agree to the ",
    termsLink: "Terms of Trade",
    agreeMid: " and acknowledge the ",
    privacyLink: "Privacy Policy",
    agreeSuffix: ".",
    reviewDetailsBtn: "Review details",
    summaryAccountType: "Account type",
    summaryFullName: "Full name",
    summaryBusiness: "Business",
    summaryCountryCurrency: "Country & currency",
    summaryPhone: "Mobile phone",
    editBtn: "Edit",
    creatingAccount: "Creating account...",
    completeRegBtn: "Complete registration",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    welcomeTitle: "Welcome to VUKA",
    welcomeBody: "Your trader account has been created. You're ready to start trading across corridors.",
    goToDashboard: "Go to dashboard",
    createdToast: "Account created successfully!",
    errFullName: "Please enter your full name.",
    errBusinessName: "Please enter your business or trading entity name.",
    errPhone: "Please provide a valid mobile phone number for verification.",
    errPasswordLen: "Password must be at least 8 characters long.",
    errPasswordMatch: "Passwords do not match.",
    errAgreeTerms: "Please accept the terms of trade and platform policy to continue.",
    errConflict: "A trader account with this phone number already exists.",
  },
  fr: {
    kicker: "Commencer",
    title: "Créez votre compte",
    step0Lead: "Sélectionnez la structure correspondant à vos opérations commerciales :",
    businessTitle: "Entreprise enregistrée",
    businessDesc: "Pour les sociétés immatriculées, transitaires, fabricants et maisons de négoce.",
    individualTitle: "Commerçant individuel",
    individualDesc: "Pour les entrepreneurs individuels, courtiers indépendants et importateurs.",
    continueBtn: "Continuer",
    fullNameLabel: "Nom complet",
    fullNamePlaceholder: "ex. Samuel Mugisha",
    businessNameLabel: "Nom de l'entreprise / société",
    businessNamePlaceholder: "ex. Great Lakes Logistics Ltd",
    regNumberLabel: "N° d'immatriculation / NIF (facultatif)",
    regNumberHint: "Accélère la vérification des plafonds de règlement.",
    regNumberPlaceholder: "ex. 100234567",
    countryLabel: "Pays principal",
    currencyLabel: "Devise d'exploitation",
    phoneLabel: "Téléphone mobile (connexion et OTP)",
    backBtn: "Retour",
    nextSecurityBtn: "Suivant : Sécurité",
    createPasswordLabel: "Créer un mot de passe",
    passwordPlaceholder: "Au moins 8 caractères",
    hidePassword: "Masquer le mot de passe",
    showPassword: "Afficher le mot de passe",
    confirmPasswordLabel: "Confirmer le mot de passe",
    confirmPasswordPlaceholder: "Répétez votre mot de passe",
    goodSecurity: "Bon niveau de sécurité",
    min8Chars: "Minimum 8 caractères",
    agreePrefix: "J'accepte les ",
    termsLink: "Conditions commerciales",
    agreeMid: " et prends acte de la ",
    privacyLink: "Politique de confidentialité",
    agreeSuffix: ".",
    reviewDetailsBtn: "Vérifier les informations",
    summaryAccountType: "Type de compte",
    summaryFullName: "Nom complet",
    summaryBusiness: "Entreprise",
    summaryCountryCurrency: "Pays et devise",
    summaryPhone: "Téléphone mobile",
    editBtn: "Modifier",
    creatingAccount: "Création du compte...",
    completeRegBtn: "Terminer l'inscription",
    haveAccount: "Vous avez déjà un compte ?",
    signIn: "Se connecter",
    welcomeTitle: "Bienvenue sur VUKA",
    welcomeBody: "Votre compte commerçant a été créé. Vous êtes prêt à commercer entre corridors.",
    goToDashboard: "Aller au tableau de bord",
    createdToast: "Compte créé avec succès !",
    errFullName: "Veuillez saisir votre nom complet.",
    errBusinessName: "Veuillez saisir le nom de votre entreprise ou entité commerciale.",
    errPhone: "Veuillez fournir un numéro de téléphone mobile valide.",
    errPasswordLen: "Le mot de passe doit contenir au moins 8 caractères.",
    errPasswordMatch: "Les mots de passe ne correspondent pas.",
    errAgreeTerms: "Veuillez accepter les conditions commerciales et la politique de la plateforme pour continuer.",
    errConflict: "Un compte commerçant avec ce numéro de téléphone existe déjà.",
  },
  sw: {
    kicker: "Anza sasa",
    title: "Fungua akaunti yako",
    step0Lead: "Chagua muundo unaolingana na shughuli zako za biashara:",
    businessTitle: "Biashara iliyosajiliwa",
    businessDesc: "Kwa kampuni zilizosajiliwa, mawakala wa mizigo, wazalishaji na makampuni ya biashara.",
    individualTitle: "Mfanyabiashara binafsi",
    individualDesc: "Kwa wamiliki pekee, madalali huru na waagizaji binafsi wa bidhaa.",
    continueBtn: "Endelea",
    fullNameLabel: "Jina kamili",
    fullNamePlaceholder: "mf. Samuel Mugisha",
    businessNameLabel: "Jina la biashara / kampuni",
    businessNamePlaceholder: "mf. Great Lakes Logistics Ltd",
    regNumberLabel: "Nambari ya usajili / TIN (hiari)",
    regNumberHint: "Inasaidia kuharakisha uthibitisho wa viwango vya malipo.",
    regNumberPlaceholder: "mf. 100234567",
    countryLabel: "Nchi kuu",
    currencyLabel: "Sarafu ya uendeshaji",
    phoneLabel: "Simu ya mkononi (kuingia na OTP)",
    backBtn: "Rudi",
    nextSecurityBtn: "Inayofuata: Usalama",
    createPasswordLabel: "Unda nenosiri",
    passwordPlaceholder: "Angalau herufi 8",
    hidePassword: "Ficha nenosiri",
    showPassword: "Onyesha nenosiri",
    confirmPasswordLabel: "Thibitisha nenosiri",
    confirmPasswordPlaceholder: "Rudia nenosiri lako",
    goodSecurity: "Kiwango kizuri cha usalama",
    min8Chars: "Kima cha chini herufi 8",
    agreePrefix: "Ninakubali ",
    termsLink: "Masharti ya Biashara",
    agreeMid: " na ninatambua ",
    privacyLink: "Sera ya Faragha",
    agreeSuffix: ".",
    reviewDetailsBtn: "Kagua maelezo",
    summaryAccountType: "Aina ya akaunti",
    summaryFullName: "Jina kamili",
    summaryBusiness: "Biashara",
    summaryCountryCurrency: "Nchi na sarafu",
    summaryPhone: "Simu ya mkononi",
    editBtn: "Hariri",
    creatingAccount: "Inafungua akaunti...",
    completeRegBtn: "Kamilisha usajili",
    haveAccount: "Tayari una akaunti?",
    signIn: "Ingia",
    welcomeTitle: "Karibu VUKA",
    welcomeBody: "Akaunti yako ya mfanyabiashara imefunguliwa. Uko tayari kuanza biashara kati ya nchi.",
    goToDashboard: "Nenda kwenye dashibodi",
    createdToast: "Akaunti imefunguliwa kikamilifu!",
    errFullName: "Tafadhali weka jina lako kamili.",
    errBusinessName: "Tafadhali weka jina la biashara au kampuni yako.",
    errPhone: "Tafadhali weka nambari sahihi ya simu ya mkononi kwa ajili ya uthibitisho.",
    errPasswordLen: "Nenosiri lazima liwe na angalau herufi 8.",
    errPasswordMatch: "Manenosiri hayalingani.",
    errAgreeTerms: "Tafadhali kubali masharti ya biashara na sera ya jukwaa ili kuendelea.",
    errConflict: "Akaunti ya mfanyabiashara yenye nambari hii ya simu tayari ipo.",
  },
  pt: {
    kicker: "Começar",
    title: "Crie a sua conta",
    step0Lead: "Selecione a estrutura que corresponde às suas operações comerciais:",
    businessTitle: "Empresa registada",
    businessDesc: "Para empresas registadas, transitários, fabricantes e casas comerciais.",
    individualTitle: "Comerciante individual",
    individualDesc: "Para empresários em nome individual, corretores independentes e importadores.",
    continueBtn: "Continuar",
    fullNameLabel: "Nome completo",
    fullNamePlaceholder: "ex. Samuel Mugisha",
    businessNameLabel: "Nome da empresa / negócio",
    businessNamePlaceholder: "ex. Great Lakes Logistics Ltd",
    regNumberLabel: "Registo comercial / NIF (opcional)",
    regNumberHint: "Ajuda a acelerar a verificação dos limites de liquidação.",
    regNumberPlaceholder: "ex. 100234567",
    countryLabel: "País principal",
    currencyLabel: "Moeda de operação",
    phoneLabel: "Telemóvel (início de sessão e OTP)",
    backBtn: "Voltar",
    nextSecurityBtn: "Seguinte: Segurança",
    createPasswordLabel: "Criar palavra-passe",
    passwordPlaceholder: "Pelo menos 8 caracteres",
    hidePassword: "Ocultar palavra-passe",
    showPassword: "Mostrar palavra-passe",
    confirmPasswordLabel: "Confirmar palavra-passe",
    confirmPasswordPlaceholder: "Repita a sua palavra-passe",
    goodSecurity: "Bom nível de segurança",
    min8Chars: "Mínimo de 8 caracteres",
    agreePrefix: "Concordo com os ",
    termsLink: "Termos de Comércio",
    agreeMid: " e reconheço a ",
    privacyLink: "Política de Privacidade",
    agreeSuffix: ".",
    reviewDetailsBtn: "Rever dados",
    summaryAccountType: "Tipo de conta",
    summaryFullName: "Nome completo",
    summaryBusiness: "Empresa",
    summaryCountryCurrency: "País e moeda",
    summaryPhone: "Telemóvel",
    editBtn: "Editar",
    creatingAccount: "A criar conta...",
    completeRegBtn: "Concluir registo",
    haveAccount: "Já tem uma conta?",
    signIn: "Iniciar sessão",
    welcomeTitle: "Bem-vindo à VUKA",
    welcomeBody: "A sua conta de comerciante foi criada. Está pronto para começar a comerciar entre corredores.",
    goToDashboard: "Ir para o painel",
    createdToast: "Conta criada com sucesso!",
    errFullName: "Por favor, introduza o seu nome completo.",
    errBusinessName: "Por favor, introduza o nome da sua empresa ou entidade comercial.",
    errPhone: "Por favor, forneça um número de telemóvel válido para verificação.",
    errPasswordLen: "A palavra-passe deve ter pelo menos 8 caracteres.",
    errPasswordMatch: "As palavras-passe não coincidem.",
    errAgreeTerms: "Por favor, aceite os termos de comércio e a política da plataforma para continuar.",
    errConflict: "Já existe uma conta de comerciante com este número de telefone.",
  },
  rw: {
    kicker: "Tangira",
    title: "Fungura konti yawe",
    step0Lead: "Hitamo imiterere ihuye n'ubucuruzi bwawe:",
    businessTitle: "Ubucuruzi bwanditse",
    businessDesc: "Ku masosiyete yanditse, abashinzwe ubwikorezi, inganda n'amazu y'ubucuruzi.",
    individualTitle: "Umucuruzi ku giti cye",
    individualDesc: "Ku bikorera ku giti cyabo, abahuza bigenga n'abatumiza ibicuruzwa mu mahanga.",
    continueBtn: "Komeza",
    fullNameLabel: "Amazina yose",
    fullNamePlaceholder: "urugero: Samuel Mugisha",
    businessNameLabel: "Izina ry'ubucuruzi / ikigo",
    businessNamePlaceholder: "urugero: Great Lakes Logistics Ltd",
    regNumberLabel: "Nimero y'ubucuruzi / TIN (si itegeko)",
    regNumberHint: "Bifasha kwihutisha igenzura ry'imbago z'ubwishyu.",
    regNumberPlaceholder: "urugero: 100234567",
    countryLabel: "Igihugu cy'ibanze",
    currencyLabel: "Ifaranga rikoreshwa",
    phoneLabel: "Telefone igendanwa (kwinjira na OTP)",
    backBtn: "Subira inyuma",
    nextSecurityBtn: "Igikurikira: Umutekano",
    createPasswordLabel: "Shyiraho ijambo ry'ibanga",
    passwordPlaceholder: "Nibura inyuguti 8",
    hidePassword: "Hisha ijambo ry'ibanga",
    showPassword: "Erekana ijambo ry'ibanga",
    confirmPasswordLabel: "Emeza ijambo ry'ibanga",
    confirmPasswordPlaceholder: "Subiramo ijambo ryawe ry'ibanga",
    goodSecurity: "Urwego rwiza rw'umutekano",
    min8Chars: "Nibura inyuguti 8",
    agreePrefix: "Nemeye ",
    termsLink: "Amabwiriza y'ubucuruzi",
    agreeMid: " kandi namenye ",
    privacyLink: "Politiki y'ibanga",
    agreeSuffix: ".",
    reviewDetailsBtn: "Suzuma amakuru",
    summaryAccountType: "Ubwoko bwa konti",
    summaryFullName: "Amazina yose",
    summaryBusiness: "Ubucuruzi",
    summaryCountryCurrency: "Igihugu n'ifaranga",
    summaryPhone: "Telefone igendanwa",
    editBtn: "Hindura",
    creatingAccount: "Konti irimo gufungurwa...",
    completeRegBtn: "Soza kwiyandikisha",
    haveAccount: "Usanzwe ufite konti?",
    signIn: "Injira",
    welcomeTitle: "Ikaze kuri VUKA",
    welcomeBody: "Konti yawe y'umucuruzi yafunguwe. Witeguye gutangira gucuruza wambukiranya imipaka.",
    goToDashboard: "Jya ku rubuga rw'ibanze",
    createdToast: "Konti yafunguwe neza!",
    errFullName: "Turagusaba kwandika amazina yawe yose.",
    errBusinessName: "Turagusaba kwandika izina ry'ubucuruzi cyangwa ikigo cyawe.",
    errPhone: "Turagusaba gutanga nimero ya telefone igendanwa yemewe.",
    errPasswordLen: "Ijambo ry'ibanga rigomba kugira nibura inyuguti 8.",
    errPasswordMatch: "Amagambo y'ibanga ntabwo ahura.",
    errAgreeTerms: "Turagusaba kwemera amabwiriza y'ubucuruzi na politiki y'urubuga kugira ngo ukomeze.",
    errConflict: "Konti y'umucuruzi ikoresha iyi nimero ya telefone isanzwe iriho.",
  },
};

function Register() {
  const copy = useLangCopy(COPY);
  const { session, refresh } = useSession();
  const navigate = useNavigate();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const [form, setForm] = useState<FormState>({
    accountType: "business",
    fullName: "",
    businessName: "",
    registrationNumber: "",
    country: "RW",
    currency: "RWF",
    phone: "+250",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  useEffect(() => {
    if (session.status === "trader" || session.status === "operator") {
      void navigate({ to: "/" });
    }
  }, [session.status, navigate]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "country") {
        const found = COUNTRIES.find((c) => c.code === value);
        if (found) {
          next.currency = found.currency;
          if (!prev.phone || prev.phone.startsWith("+")) {
            next.phone = `${found.dial} `;
          }
        }
      }
      return next;
    });
    setError(null);
  }

  function validateStep(s: number): boolean {
    setError(null);

    if (s === 1) {
      if (!form.fullName.trim()) {
        setError(copy.errFullName);
        return false;
      }
      if (form.accountType === "business" && !form.businessName.trim()) {
        setError(copy.errBusinessName);
        return false;
      }
      const rawPhone = form.phone.replace(/\s+/g, "");
      if (rawPhone.length < 8) {
        setError(copy.errPhone);
        return false;
      }
      return true;
    }

    if (s === 2) {
      if (form.password.length < 8) {
        setError(copy.errPasswordLen);
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError(copy.errPasswordMatch);
        return false;
      }
      if (!form.agreeTerms) {
        setError(copy.errAgreeTerms);
        return false;
      }
      return true;
    }

    return true;
  }

  function nextStep() {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 3) as 0 | 1 | 2 | 3);
    }
  }

  function prevStep() {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 0) as 0 | 1 | 2 | 3);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!validateStep(2)) return;

    setError(null);
    setBusy(true);

    try {
      const phone = form.phone.replace(/\s+/g, "");

      const registrationNumber =
        form.accountType === "business" && form.registrationNumber.trim() ? form.registrationNumber.trim() : undefined;

      await auth.register(
        {
          full_name: form.fullName.trim(),
          phone_number: phone,
          password: form.password,
          ...(registrationNumber ? { business_reg_number: registrationNumber } : {}),
        },
        form.currency,
      );

      // Automatically sign in the freshly created user
      try {
        await auth.traderLogin(phone, form.password);
        await refresh();
      } catch {
        // If login fails, redirect to login page
      }

      setCompleted(true);
      toast.success(copy.createdToast);
    } catch (err) {
      setError(
        isApiError(err) && err.code === "conflict"
          ? copy.errConflict
          : describeError(err),
      );
    } finally {
      setBusy(false);
    }
  }

  if (completed) {
    return (
      <AuthShell page="register">
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">{copy.welcomeTitle}</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{copy.welcomeBody}</p>
          <div className="mt-6 w-full max-w-sm">
            <Button onClick={() => void navigate({ to: "/" })} className={cn("w-full group", AUTH_BUTTON)}>
              {copy.goToDashboard}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell page="register">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{copy.kicker}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{copy.title}</h1>

      <div className="mt-6 mb-6 flex items-center gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", step >= i ? "bg-primary" : "bg-muted")} />
        ))}
      </div>

      {step === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{copy.step0Lead}</p>
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => update("accountType", "business")}
              className={cn(
                "flex items-start gap-3.5 rounded-xl border p-4 text-left transition-all",
                form.accountType === "business" ? "border-ring bg-muted/50 ring-1 ring-ring" : "border-border bg-card hover:border-ring/40",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  form.accountType === "business" ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                )}
              >
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{copy.businessTitle}</span>
                  {form.accountType === "business" ? <Check className="h-3.5 w-3.5" /> : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{copy.businessDesc}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => update("accountType", "individual")}
              className={cn(
                "flex items-start gap-3.5 rounded-xl border p-4 text-left transition-all",
                form.accountType === "individual" ? "border-ring bg-muted/50 ring-1 ring-ring" : "border-border bg-card hover:border-ring/40",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  form.accountType === "individual" ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                )}
              >
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{copy.individualTitle}</span>
                  {form.accountType === "individual" ? <Check className="h-3.5 w-3.5" /> : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{copy.individualDesc}</p>
              </div>
            </button>
          </div>

          <Button type="button" onClick={nextStep} className={cn("w-full group", AUTH_BUTTON)}>
            {copy.continueBtn}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-3.5">
          <AuthField id="fullName" label={copy.fullNameLabel}>
            <Input
              id="fullName"
              placeholder={copy.fullNamePlaceholder}
              className={AUTH_INPUT}
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              autoComplete="name"
              required
            />
          </AuthField>

          {form.accountType === "business" ? (
            <>
              <AuthField id="businessName" label={copy.businessNameLabel}>
                <Input
                  id="businessName"
                  placeholder={copy.businessNamePlaceholder}
                  className={AUTH_INPUT}
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  required
                />
              </AuthField>

              <AuthField
                id="registrationNumber"
                label={copy.regNumberLabel}
                hint={copy.regNumberHint}
              >
                <Input
                  id="registrationNumber"
                  placeholder={copy.regNumberPlaceholder}
                  className={AUTH_INPUT}
                  value={form.registrationNumber}
                  onChange={(e) => update("registrationNumber", e.target.value)}
                />
              </AuthField>
            </>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <AuthField id="country" label={copy.countryLabel}>
              <select
                id="country"
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                className={cn("w-full appearance-none", AUTH_INPUT)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </AuthField>

            <AuthField id="currency" label={copy.currencyLabel}>
              <Input id="currency" value={form.currency} readOnly className={cn("bg-muted text-muted-foreground", AUTH_INPUT)} />
            </AuthField>
          </div>

          <AuthField id="phone" label={copy.phoneLabel}>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                placeholder="+250 788 000 000"
                className={cn("pr-10", AUTH_INPUT)}
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                <Phone className="h-4 w-4" />
              </span>
            </div>
          </AuthField>

          {error ? <AuthError>{error}</AuthError> : null}

          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="outline" onClick={prevStep} className="h-11 px-4 text-xs font-semibold">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {copy.backBtn}
            </Button>
            <Button type="button" onClick={nextStep} className={cn("flex-1 group", AUTH_BUTTON)}>
              {copy.nextSecurityBtn}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3.5">
          <AuthField id="password" label={copy.createPasswordLabel}>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={copy.passwordPlaceholder}
                className={cn("pr-10", AUTH_INPUT)}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </AuthField>

          <AuthField id="confirmPassword" label={copy.confirmPasswordLabel}>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder={copy.confirmPasswordPlaceholder}
              className={AUTH_INPUT}
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
            />
          </AuthField>

          <div className="space-y-1">
            <div className="flex h-1 gap-1">
              <div className={cn("flex-1 rounded-full", form.password.length >= 8 ? "bg-success" : "bg-muted")} />
              <div
                className={cn(
                  "flex-1 rounded-full",
                  form.password.length >= 10 && /[0-9]/.test(form.password) ? "bg-success" : "bg-muted",
                )}
              />
              <div
                className={cn(
                  "flex-1 rounded-full",
                  form.password.length >= 12 && /[^a-zA-Z0-9]/.test(form.password) ? "bg-success" : "bg-muted",
                )}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {form.password.length >= 8 ? copy.goodSecurity : copy.min8Chars}
            </span>
          </div>

          <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.agreeTerms}
              onChange={(e) => update("agreeTerms", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input accent-foreground focus:ring-0 cursor-pointer"
            />
            <span className="text-xs leading-snug text-muted-foreground">
              {copy.agreePrefix}
              <Link to="/terms" className="underline underline-offset-2 text-foreground">
                {copy.termsLink}
              </Link>
              {copy.agreeMid}
              <Link to="/privacy" className="underline underline-offset-2 text-foreground">
                {copy.privacyLink}
              </Link>
              {copy.agreeSuffix}
            </span>
          </label>

          {error ? <AuthError>{error}</AuthError> : null}

          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="outline" onClick={prevStep} className="h-11 px-4 text-xs font-semibold">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {copy.backBtn}
            </Button>
            <Button type="button" onClick={nextStep} className={cn("flex-1 group", AUTH_BUTTON)}>
              {copy.reviewDetailsBtn}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2.5 rounded-xl border border-border bg-muted/40 p-4 text-xs">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">{copy.summaryAccountType}</span>
              <span className="font-semibold">
                {form.accountType === "business" ? copy.businessTitle : copy.individualTitle}
              </span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">{copy.summaryFullName}</span>
              <span className="font-semibold">{form.fullName}</span>
            </div>
            {form.accountType === "business" ? (
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">{copy.summaryBusiness}</span>
                <span className="font-semibold">{form.businessName}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">{copy.summaryCountryCurrency}</span>
              <span className="font-semibold">
                {COUNTRIES.find((c) => c.code === form.country)?.name} ({form.currency})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{copy.summaryPhone}</span>
              <span className="font-mono font-semibold">{form.phone}</span>
            </div>
          </div>

          {error ? <AuthError>{error}</AuthError> : null}

          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="outline" onClick={prevStep} disabled={busy} className="h-11 px-4 text-xs font-semibold">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {copy.editBtn}
            </Button>
            <Button type="submit" disabled={busy} className={cn("flex-1 group", AUTH_BUTTON)}>
              {busy ? copy.creatingAccount : copy.completeRegBtn}
              {!busy ? <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /> : null}
            </Button>
          </div>
        </form>
      ) : null}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {copy.haveAccount}{" "}
        <Link to="/login" className="font-semibold text-foreground underline underline-offset-4">
          {copy.signIn}
        </Link>
      </p>
    </AuthShell>
  );
}
