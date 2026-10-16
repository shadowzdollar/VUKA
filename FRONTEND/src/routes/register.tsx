import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flag } from "@/components/vuka/landing/flags";
import {
  PasswordField,
  StrengthMeter,
  passwordStrength,
} from "@/components/vuka/password-field";
import { describeError, isApiError } from "@/lib/api/client";
import { auth, platform } from "@/lib/api/endpoints";
import { money } from "@/lib/format";
import { DIAL } from "@/lib/markets";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [{ title: "Create account — VUKA" }],
  }),
  component: Register,
});

const PHONE = /^\+[1-9]\d{7,14}$/;

const STEPS = [
  "Account type",
  "Your details",
  "Security",
  "Review",
] as const;

type Kind = "individual" | "business";

const inputClass =
  "h-12 rounded-xl border-neutral-200 bg-white text-[14px] shadow-none transition-colors placeholder:text-neutral-400 hover:border-neutral-300 focus-visible:border-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950/10";

function VukaMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="VUKA home"
      className="inline-flex w-fit items-center gap-3"
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          inverse ? "bg-white text-neutral-950" : "bg-neutral-950 text-white",
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path
            d="M5 7L13.1 25H18.1L27 7H20.8L15.6 18.1L10.8 7H5Z"
            fill="currentColor"
          />
          <path
            d="M20.5 19.5H27L24 25H17.8L20.5 19.5Z"
            fill="currentColor"
            opacity=".58"
          />
        </svg>
      </span>
      <span
        className={cn(
          "text-[19px] font-bold tracking-[0.18em]",
          inverse ? "text-white" : "text-neutral-950",
        )}
      >
        VUKA
      </span>
    </Link>
  );
}

function BrandPanel() {
  return (
    <section className="relative isolate hidden min-h-screen overflow-hidden bg-neutral-950 text-white lg:flex lg:flex-col">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url('/images/vuka-login-hero.png'), radial-gradient(ellipse at 20% 10%, #353535 0%, #171717 42%, #090909 100%)",
          backgroundPosition: "center, center",
          backgroundSize: "auto 100%, cover",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/35 to-black/90"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/10"
      />

      <div className="relative z-10 flex min-h-screen flex-col px-10 py-10 xl:px-14 xl:py-12">
        <VukaMark inverse />

        <div className="my-auto max-w-[540px] pb-16 pt-20">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.07] px-3.5 py-2 text-[11px] font-medium tracking-wide text-white/85 backdrop-blur-sm">
            <Globe2 className="h-3.5 w-3.5" />
            CROSS-BORDER COMMERCE
          </div>

          <p className="mb-4 text-sm font-medium tracking-[0.18em] text-white/65">
            TRADE. OPERATE. GROW.
          </p>

          <h1 className="max-w-[510px] text-5xl font-semibold leading-[1.08] tracking-[-0.055em] xl:text-[64px]">
            Global trade,
            <br />
            smarter together.
          </h1>

          <p className="mt-6 max-w-[400px] text-[15px] leading-7 text-white/70">
            One platform for your business and personal cross-border financial
            operations. Create your account and move forward with confidence.
          </p>

          <div className="mt-10 flex items-center gap-3">
            <span className="h-1.5 w-8 rounded-full bg-white" />
            <span className="h-1.5 w-3 rounded-full bg-white/30" />
            <span className="h-1.5 w-3 rounded-full bg-white/30" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5 border-t border-white/15 pt-6">
          {[
            { icon: ShieldCheck, title: "Secure transactions" },
            { icon: Globe2, title: "Cross-border trade" },
            { icon: LockKeyhole, title: "Protected access" },
          ].map(({ icon: Icon, title }) => (
            <div key={title} className="flex items-center gap-2.5">
              <Icon className="h-[17px] w-[17px] shrink-0 text-white/70" />
              <span className="text-[11px] leading-4 text-white/75">
                {title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileBrand() {
  return (
    <div className="mb-8 flex items-center justify-between lg:hidden">
      <VukaMark />
      <span className="text-xs text-neutral-400">Create account</span>
    </div>
  );
}

function Field({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-[13px] font-medium text-neutral-800"
      >
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs leading-5 text-neutral-500">{hint}</p>}
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-neutral-500">
          STEP {step + 1} OF {STEPS.length}
        </span>
        <span className="text-xs font-medium text-neutral-700">
          {STEPS[step]}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2" aria-label="Registration progress">
        {STEPS.map((name, index) => (
          <div
            key={name}
            className={cn(
              "h-1 rounded-full transition-colors duration-300",
              index <= step ? "bg-neutral-950" : "bg-neutral-200",
            )}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {STEPS.map((name, index) => (
          <span
            key={name}
            className={cn(
              "text-[10px] leading-4 sm:text-[11px]",
              index === step
                ? "font-semibold text-neutral-950"
                : index < step
                  ? "text-neutral-600"
                  : "text-neutral-400",
            )}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function AccountTypeCard({
  selected,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: typeof Briefcase;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative flex min-h-[158px] flex-col items-start rounded-2xl border p-5 text-left transition-all duration-200",
        selected
          ? "border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950"
          : "border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50/60",
      )}
    >
      <div className="flex w-full items-start justify-between">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
            selected
              ? "bg-neutral-950 text-white"
              : "bg-neutral-100 text-neutral-700 group-hover:bg-neutral-200",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>

        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
            selected
              ? "border-neutral-950 bg-neutral-950 text-white"
              : "border-neutral-300 text-transparent",
          )}
        >
          <Check className="h-3 w-3" />
        </span>
      </div>

      <span className="mt-5 text-sm font-semibold text-neutral-950">
        {title}
      </span>
      <span className="mt-1.5 text-xs leading-5 text-neutral-500">
        {description}
      </span>
    </button>
  );
}

function Register() {
  const { refresh } = useSession();
  const navigate = useNavigate();

  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });

  const countries = config.data?.countries ?? [];

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [kind, setKind] = useState<Kind>("business");
  const [country, setCountry] = useState("RW");
  const [currency, setCurrency] = useState("RWF");
  const [f, setF] = useState({
    name: "",
    local: "",
    reg: "",
    password: "",
    confirm: "",
  });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);

  const dial = DIAL[country] ?? "";

  const phone = useMemo(() => {
    const digits = f.local.replace(/\D/g, "");

    if (f.local.trim().startsWith("+")) {
      return `+${digits}`;
    }

    return `${dial}${digits.replace(/^0+/, "")}`;
  }, [f.local, dial]);

  useEffect(() => {
    heading.current?.focus();
  }, [step, done]);

  function update<K extends keyof typeof f>(key: K, value: (typeof f)[K]) {
    setF((previous) => ({ ...previous, [key]: value }));
    setError("");
  }

  function pickCountry(code: string) {
    setCountry(code);

    const selected = countries.find(
      (item: { code: string }) => item.code === code,
    ) as { currency?: string } | undefined;

    if (selected?.currency) {
      setCurrency(selected.currency);
    }

    setError("");
  }

  const problems = useMemo(() => {
    const result: string[] = [];

    if (step === 1) {
      if (f.name.trim().length < 2) {
        result.push(
          kind === "business"
            ? "Enter your business name."
            : "Enter your full name.",
        );
      }

      if (!PHONE.test(phone)) {
        result.push("Enter a valid phone number with your country code.");
      }
    }

    if (step === 2) {
      if (f.password.length < 8) {
        result.push("Your password must contain at least 8 characters.");
      }

      if (passwordStrength(f.password).score < 2) {
        result.push("Choose a stronger password.");
      }

      if (f.password !== f.confirm) {
        result.push("Your passwords do not match.");
      }

      if (!agree) {
        result.push("Accept the Terms of Service and Privacy Policy.");
      }
    }

    return result;
  }, [step, f, kind, phone, agree]);

  function next() {
    setError("");

    if (problems.length > 0) {
      setError(problems[0]);
      return;
    }

    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function back() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    if (step < STEPS.length - 1) {
      next();
      return;
    }

    const allProblems: string[] = [];

    if (f.name.trim().length < 2) {
      allProblems.push("Enter your name or business name.");
    }

    if (!PHONE.test(phone)) {
      allProblems.push("Enter a valid phone number.");
    }

    if (f.password.length < 8 || passwordStrength(f.password).score < 2) {
      allProblems.push("Choose a stronger password of at least 8 characters.");
    }

    if (f.password !== f.confirm) {
      allProblems.push("Your passwords do not match.");
    }

    if (!agree) {
      allProblems.push("Accept the Terms of Service and Privacy Policy.");
    }

    if (allProblems.length > 0) {
      setError(allProblems[0]);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const input: Parameters<typeof auth.register>[0] = {
        full_name: f.name.trim(),
        phone_number: phone,
        password: f.password,
      };

      if (kind === "business" && f.reg.trim()) {
        input.business_reg_number = f.reg.trim();
      }

      await auth.register(input, currency);
      await auth.traderLogin(phone, f.password);
      await refresh();

      toast.success("Account created");
      setDone(true);
    } catch (err) {
      const message =
        isApiError(err) && err.status === 409
          ? "An account with this phone number already exists."
          : describeError(err);

      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Welcome
        name={f.name}
        currency={currency}
        limits={config.data?.kyc_limits?.["PENDING"]}
        onContinue={() => navigate({ to: "/" })}
      />
    );
  }

  const countryOptions =
    countries.length > 0
      ? countries
      : [{ code: "RW", name: "Rwanda", currency: "RWF" }];

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        <BrandPanel />

        <section className="flex min-h-screen min-w-0 flex-col bg-white">
          <div className="flex flex-1 flex-col px-5 py-6 sm:px-10 sm:py-9 lg:px-12 lg:py-10 xl:px-[clamp(3rem,6vw,6.5rem)]">
            <div className="mx-auto w-full max-w-[560px]">
              <MobileBrand />

              <div className="mb-8 flex items-center justify-between border-b border-neutral-100 pb-5">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-950"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </Link>

                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure registration
                </span>
              </div>

              <div className="mb-8">
                <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-neutral-500">
                  GET STARTED WITH VUKA
                </p>

                <h1
                  ref={heading}
                  tabIndex={-1}
                  className="text-[32px] font-semibold leading-[1.15] tracking-[-0.045em] text-neutral-950 outline-none sm:text-[38px]"
                >
                  Create your account.
                </h1>

                <p className="mt-3 max-w-[430px] text-sm leading-6 text-neutral-500">
                  Set up your account to manage your business and cross-border
                  transactions in one place.
                </p>
              </div>

              <StepIndicator step={step} />

              <form onSubmit={submit} noValidate>
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-sm font-semibold text-neutral-950">
                        How will you use VUKA?
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        Choose the account type that best describes you.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <AccountTypeCard
                        selected={kind === "business"}
                        title="Registered business"
                        description="For companies managing trade and business payments."
                        icon={Briefcase}
                        onClick={() => {
                          setKind("business");
                          setError("");
                        }}
                      />

                      <AccountTypeCard
                        selected={kind === "individual"}
                        title="Individual trader"
                        description="For individuals managing personal trading activities."
                        icon={UserRound}
                        onClick={() => {
                          setKind("individual");
                          setError("");
                        }}
                      />
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-4">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-700" />
                      <p className="text-xs leading-5 text-neutral-600">
                        Your account type helps us tailor your onboarding and
                        verification requirements.
                      </p>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-sm font-semibold text-neutral-950">
                        Tell us about yourself
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        Enter your details exactly as you want them associated
                        with your account.
                      </p>
                    </div>

                    <Field
                      id="register-name"
                      label={
                        kind === "business" ? "Business name" : "Full name"
                      }
                    >
                      <Input
                        id="register-name"
                        className={inputClass}
                        placeholder={
                          kind === "business"
                            ? "Enter your registered business name"
                            : "Enter your full name"
                        }
                        value={f.name}
                        onChange={(event) => update("name", event.target.value)}
                        autoComplete="name"
                        required
                      />
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field id="register-country" label="Country of residence">
                        <select
                          id="register-country"
                          value={country}
                          onChange={(event) => pickCountry(event.target.value)}
                          className={cn(
                            inputClass,
                            "w-full appearance-none px-3",
                          )}
                        >
                          {countryOptions.map(
                            (item: {
                              code: string;
                              name: string;
                            }) => (
                              <option key={item.code} value={item.code}>
                                {item.name}
                              </option>
                            ),
                          )}
                        </select>
                      </Field>

                      <Field
                        id="register-currency"
                        label="Preferred currency"
                      >
                        <select
                          id="register-currency"
                          value={currency}
                          onChange={(event) => {
                            setCurrency(event.target.value);
                            setError("");
                          }}
                          className={cn(
                            inputClass,
                            "w-full appearance-none px-3",
                          )}
                        >
                          {Array.from(
                            new Set([
                              currency,
                              ...countryOptions.map(
                                (item: { currency?: string }) =>
                                  item.currency,
                              ),
                            ]),
                          )
                            .filter(Boolean)
                            .map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                        </select>
                      </Field>
                    </div>

                    <Field
                      id="register-phone"
                      label="Phone number"
                      hint="Use a number you can access. We'll use it to sign you in."
                    >
                      <div className="flex h-12 min-w-0 items-center rounded-xl border border-neutral-200 bg-white transition-colors focus-within:border-neutral-950 focus-within:ring-2 focus-within:ring-neutral-950/10">
                        <span className="flex h-full shrink-0 items-center gap-2 border-r border-neutral-200 px-3">
                          <Flag code={country} className="w-5 shrink-0" />
                          <span className="text-sm text-neutral-600">
                            {dial || "+—"}
                          </span>
                        </span>

                        <input
                          id="register-phone"
                          type="tel"
                          autoComplete="tel-national"
                          inputMode="tel"
                          placeholder="7XX XXX XXX"
                          value={f.local}
                          onChange={(event) =>
                            update("local", event.target.value)
                          }
                          required
                          className="h-full min-w-0 flex-1 rounded-r-xl bg-transparent px-3 text-sm outline-none placeholder:text-neutral-400"
                        />
                      </div>
                    </Field>

                    {kind === "business" && (
                      <Field
                        id="register-business-reg"
                        label="Business registration number"
                        hint="Optional. You can provide verification details later."
                      >
                        <Input
                          id="register-business-reg"
                          className={inputClass}
                          placeholder="Enter registration number"
                          value={f.reg}
                          onChange={(event) => update("reg", event.target.value)}
                          autoComplete="off"
                        />
                      </Field>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-sm font-semibold text-neutral-950">
                        Secure your account
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        Choose a strong password to protect your account.
                      </p>
                    </div>

                    <Field
                      id="register-password"
                      label="Create password"
                      hint="Use at least 8 characters and avoid passwords you use elsewhere."
                    >
                      <PasswordField
                        id="register-password"
                        value={f.password}
                        onChange={(value) => update("password", value)}
                        autoComplete="new-password"
                      />
                    </Field>

                    <StrengthMeter password={f.password} />

                    <Field
                      id="register-confirm"
                      label="Confirm password"
                    >
                      <PasswordField
                        id="register-confirm"
                        value={f.confirm}
                        onChange={(value) => update("confirm", value)}
                        autoComplete="new-password"
                      />
                      {f.confirm.length > 0 && (
                        <p
                          className={cn(
                            "mt-2 text-xs",
                            f.password === f.confirm
                              ? "text-neutral-600"
                              : "text-red-600",
                          )}
                        >
                          {f.password === f.confirm
                            ? "Passwords match."
                            : "Passwords do not match."}
                        </p>
                      )}
                    </Field>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-4 transition-colors hover:bg-neutral-50">
                      <input
                        type="checkbox"
                        checked={agree}
                        onChange={(event) => {
                          setAgree(event.target.checked);
                          setError("");
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-neutral-950"
                      />
                      <span className="text-xs leading-5 text-neutral-600">
                        I agree to the{" "}
                        <Link
                          to="/terms"
                          className="font-semibold text-neutral-950 underline underline-offset-4"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/privacy"
                          className="font-semibold text-neutral-950 underline underline-offset-4"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>

                    <div className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
                      <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-neutral-700" />
                      <p className="text-xs leading-5 text-neutral-600">
                        Your credentials are used to secure your VUKA account.
                        Keep your password private.
                      </p>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-sm font-semibold text-neutral-950">
                        Review your details
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        Check that everything is correct before creating your
                        account.
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-neutral-200">
                      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3.5">
                        <span className="text-xs font-medium text-neutral-600">
                          Account information
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setStep(0);
                            setError("");
                          }}
                          className="text-xs font-semibold text-neutral-950 underline underline-offset-4"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="space-y-4 p-4">
                        <ReviewRow
                          label="Account type"
                          value={
                            kind === "business"
                              ? "Registered business"
                              : "Individual trader"
                          }
                        />
                        <ReviewRow
                          label={
                            kind === "business" ? "Business name" : "Full name"
                          }
                          value={f.name.trim()}
                        />
                        <ReviewRow label="Country" value={country} />
                        <ReviewRow label="Currency" value={currency} />
                        <ReviewRow label="Phone number" value={phone} />

                        {kind === "business" && f.reg.trim() && (
                          <ReviewRow
                            label="Registration number"
                            value={f.reg.trim()}
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-neutral-700" />
                      <div>
                        <p className="text-xs font-semibold text-neutral-900">
                          Verification and compliance
                        </p>
                        <p className="mt-1 text-xs leading-5 text-neutral-500">
                          Additional verification may be required before you
                          can access certain account features or transaction
                          limits.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Check className="h-4 w-4 text-neutral-800" />
                      Your details have been reviewed.
                    </div>
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-red-300 font-semibold">
                      !
                    </span>
                    {error}
                  </div>
                )}

                <div className="mt-7 flex gap-3">
                  {step > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={back}
                      disabled={busy}
                      className="h-12 rounded-xl border-neutral-200 px-5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}

                  <Button
                    type="submit"
                    disabled={busy}
                    className="h-12 flex-1 rounded-xl bg-neutral-950 text-sm font-semibold text-white shadow-none transition-colors hover:bg-neutral-800 disabled:opacity-60"
                  >
                    {busy ? (
                      "Creating account..."
                    ) : step === STEPS.length - 1 ? (
                      <>
                        Create account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-8 border-t border-neutral-100 pt-6 text-center">
                <p className="text-sm text-neutral-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <footer className="border-t border-neutral-100 px-5 py-4 sm:px-10 lg:px-12 xl:px-[clamp(3rem,6vw,6.5rem)]">
            <div className="mx-auto flex w-full max-w-[560px] flex-col justify-between gap-2 text-[10px] text-neutral-400 sm:flex-row">
              <span>© {new Date().getFullYear()} VUKA</span>
              <span>Secure onboarding for global trade.</span>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-5">
      <span className="shrink-0 text-xs text-neutral-500">{label}</span>
      <span className="break-words text-right text-xs font-medium text-neutral-950">
        {value}
      </span>
    </div>
  );
}

function Welcome({
  name,
  currency,
  limits,
  onContinue,
}: {
  name: string;
  currency: string;
  limits?: Record<string, number>;
  onContinue: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  const actions = [
    {
      title: "Explore your wallets",
      description: `Your business and personal wallets use ${currency}.`,
      href: "/wallets",
    },
    {
      title: "Get verified",
      description: "Submit a verification reference to raise your limits.",
      href: "/verification",
    },
    {
      title: "Send your first payment",
      description: "Quote a corridor and review the price before paying.",
      href: "/send",
    },
  ] as const;

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        <BrandPanel />

        <section className="flex min-h-screen min-w-0 flex-col">
          <div className="flex flex-1 flex-col px-5 py-6 sm:px-10 sm:py-9 lg:px-12 lg:py-10 xl:px-[clamp(3rem,6vw,6.5rem)]">
            <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col">
              <MobileBrand />

              <div className="my-auto py-10">
                <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                  <Check className="h-7 w-7" />
                </div>

                <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-neutral-500">
                  ACCOUNT CREATED
                </p>

                <h1
                  ref={heading}
                  tabIndex={-1}
                  className="text-[34px] font-semibold leading-tight tracking-[-0.045em] outline-none sm:text-[42px]"
                >
                  Welcome, {name.trim().split(" ")[0]}.
                </h1>

                <p className="mt-4 max-w-[430px] text-sm leading-6 text-neutral-500">
                  Your VUKA account is ready. You can now explore your wallets,
                  complete verification, and prepare your first transaction.
                </p>

                {limits && Object.keys(limits).length > 0 && (
                  <div className="mt-7 rounded-2xl border border-neutral-200 p-5">
                    <h2 className="text-sm font-semibold">
                      Your initial limits
                    </h2>
                    <div className="mt-4 space-y-3">
                      {Object.entries(limits).map(([key, amount]) => (
                        <ReviewRow
                          key={key}
                          label={key
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                          value={money(amount, "USD")}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 space-y-3">
                  {actions.map((action, index) => (
                    <Link
                      key={action.href}
                      to={action.href}
                      className="group flex items-center gap-4 rounded-2xl border border-neutral-200 p-4 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                        {index === 0 ? (
                          <Globe2 className="h-5 w-5" />
                        ) : index === 1 ? (
                          <ShieldCheck className="h-5 w-5" />
                        ) : (
                          <ArrowRight className="h-5 w-5" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-neutral-950">
                          {action.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-neutral-500">
                          {action.description}
                        </span>
                      </span>

                      <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-neutral-950" />
                    </Link>
                  ))}
                </div>

                <Button
                  onClick={onContinue}
                  className="mt-7 h-12 w-full rounded-xl bg-neutral-950 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                  Continue to VUKA
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <footer className="border-t border-neutral-100 px-5 py-4 sm:px-10 lg:px-12 xl:px-[clamp(3rem,6vw,6.5rem)]">
            <div className="mx-auto flex w-full max-w-[560px] justify-between text-[10px] text-neutral-400">
              <span>© {new Date().getFullYear()} VUKA</span>
              <span>Secure onboarding for global trade.</span>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}