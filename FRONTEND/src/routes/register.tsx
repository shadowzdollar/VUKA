import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFrame } from "@/components/vuka/auth-frame";
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
const STEPS = ["Account type", "Your details", "Security", "Review"] as const;

type Kind = "individual" | "business";

function Register() {
  const { refresh } = useSession();
  const navigate = useNavigate();

  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });

  const countries = useMemo(
    () => config.data?.countries ?? [],
    [config.data],
  );

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
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const dial = DIAL[country] ?? "";

  const phone = useMemo(() => {
    const digits = f.local.replace(/[^\d]/g, "");

    if (f.local.trim().startsWith("+")) {
      return `+${digits}`;
    }

    return digits ? `+${dial}${digits.replace(/^0+/, "")}` : "";
  }, [f.local, dial]);

  useEffect(() => {
    heading.current?.focus();
  }, [step, done]);

  function pickCountry(code: string) {
    setCountry(code);
    const selected = countries.find((item) => item.code === code);

    if (selected) setCurrency(selected.currency);
  }

  const problems: (string | null)[] = [
    null,
    f.name.trim().length < 2
      ? kind === "business"
        ? "Enter your business name."
        : "Enter your full name."
      : !PHONE.test(phone)
        ? "Enter a valid mobile number using your country code."
        : null,
    f.password.length < 8
      ? "Password must be at least 8 characters."
      : f.password !== f.confirm
        ? "Passwords do not match."
        : passwordStrength(f.password).score < 2
          ? "Choose a stronger password."
          : !agree
            ? "Accept the terms and privacy notice to continue."
            : null,
    null,
  ];

  function next() {
    const problem = problems[step] ?? null;
    setError(problem);

    if (!problem) {
      setStep((current) => Math.min(STEPS.length - 1, current + 1));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;

    if (step < STEPS.length - 1) {
      next();
      return;
    }

    for (const problem of problems) {
      if (problem) {
        setError(problem);
        return;
      }
    }

    setError(null);
    setBusy(true);

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
      setError(
        isApiError(err) && err.status === 409
          ? "This mobile number is already registered. Try signing in."
          : describeError(err),
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Welcome
        name={f.name}
        currency={currency}
        onContinue={() => void navigate({ to: "/" })}
        limits={config.data?.kyc_limits?.["PENDING"]}
      />
    );
  }

  return (
    <AuthFrame variant="register" wide>
      <main className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Sign in
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
            <ShieldCheck className="size-3.5" />
            Secure registration
          </div>
        </div>

        <div className="mb-9">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-px w-7 bg-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              VUKA / Create account
            </p>
          </div>

          <h1
            ref={heading}
            tabIndex={-1}
            className="text-4xl font-semibold leading-[1.12] tracking-tight text-foreground outline-none sm:text-5xl"
          >
            Start trading.
            <br />
            <span className="text-muted-foreground">
              Move forward with VUKA.
            </span>
          </h1>

          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            One account for your trade, payments, and financial activity.
            Create your account in just a few steps.
          </p>
        </div>

        <section className="mb-8 rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Registration progress
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {STEPS[step]}
              </p>
            </div>

            <span className="rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
              {String(step + 1).padStart(2, "0")} / 04
            </span>
          </div>

          <ol
            aria-label="Registration progress"
            className="grid grid-cols-4 gap-2"
          >
            {STEPS.map((item, index) => (
              <li
                key={item}
                aria-current={index === step ? "step" : undefined}
                title={item}
              >
                <div
                  className={cn(
                    "h-1 rounded-full transition-colors duration-200",
                    index <= step ? "bg-foreground" : "bg-border",
                  )}
                />
                <span
                  className={cn(
                    "mt-2 hidden text-[10px] sm:block",
                    index === step
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <form onSubmit={submit} noValidate className="space-y-7">
          {step === 0 && (
            <fieldset>
              <legend className="text-lg font-semibold tracking-tight">
                What type of account do you need?
              </legend>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Choose the option that best describes your trading activity.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    {
                      value: "business",
                      Icon: Briefcase,
                      title: "Business",
                      description:
                        "For companies trading with suppliers and buyers, managing invoices and escrow.",
                      points: ["Company trading", "Business registration optional"],
                    },
                    {
                      value: "individual",
                      Icon: User,
                      title: "Individual",
                      description:
                        "For independent traders and entrepreneurs managing their own trade.",
                      points: ["Personal trading", "Simple account setup"],
                    },
                  ] as const
                ).map(({ value, Icon, title, description, points }) => {
                  const selected = kind === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setKind(value);
                        setError(null);
                      }}
                      className={cn(
                        "relative rounded-xl border p-5 text-left transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selected
                          ? "border-foreground bg-muted/40 shadow-sm"
                          : "border-border bg-background hover:border-foreground/40 hover:bg-muted/20",
                      )}
                    >
                      <div className="mb-5 flex items-start justify-between">
                        <span
                          className={cn(
                            "flex size-11 items-center justify-center rounded-lg border transition-colors",
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background text-foreground",
                          )}
                        >
                          <Icon className="size-5" />
                        </span>

                        <span
                          className={cn(
                            "flex size-5 items-center justify-center rounded-full border",
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border",
                          )}
                        >
                          {selected && <Check className="size-3.5" />}
                        </span>
                      </div>

                      <span className="block text-base font-semibold">
                        {title}
                      </span>

                      <span className="mt-2 block min-h-[60px] text-xs leading-5 text-muted-foreground">
                        {description}
                      </span>

                      <span className="mt-4 flex flex-wrap gap-2">
                        {points.map((point) => (
                          <span
                            key={point}
                            className="rounded-md border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground"
                          >
                            {point}
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <StepHeading
                title="Your details"
                description="Tell us who will be using this VUKA account."
              />

              <Field
                label={kind === "business" ? "Business name" : "Full name"}
                id="name"
              >
                <Input
                  id="name"
                  autoComplete={kind === "business" ? "organization" : "name"}
                  placeholder={
                    kind === "business"
                      ? "Enter your registered business name"
                      : "Enter your full name"
                  }
                  className="h-12 rounded-lg border-border bg-background px-3.5 shadow-sm transition-shadow placeholder:text-muted-foreground/70 focus-visible:ring-2"
                  value={f.name}
                  onChange={(event) =>
                    setF({ ...f, name: event.target.value })
                  }
                  required
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Country or region" id="country">
                  <select
                    id="country"
                    value={country}
                    onChange={(event) => pickCountry(event.target.value)}
                    className="h-12 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                  >
                    {(countries.length
                      ? countries
                      : [{ code: "RW", name: "Rwanda", currency: "RWF" }]
                    ).map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Account currency" id="currency">
                  <select
                    id="currency"
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                    className="h-12 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm shadow-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                  >
                    {(config.data?.currencies ?? [currency]).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field
                label="Mobile number"
                id="phone"
                hint={
                  phone
                    ? `International format: ${phone}`
                    : "Enter your mobile number without the country code."
                }
              >
                <div className="flex min-w-0">
                  <span className="flex h-12 shrink-0 items-center gap-2 rounded-l-lg border border-r-0 border-border bg-muted/40 px-3 font-mono text-sm">
                    <Flag code={country} className="w-5 shrink-0" />
                    +{dial}
                  </span>

                  <Input
                    id="phone"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="700 000 000"
                    className="h-12 min-w-0 rounded-l-none rounded-r-lg border-border bg-background shadow-sm focus-visible:ring-2"
                    value={f.local}
                    onChange={(event) =>
                      setF({ ...f, local: event.target.value })
                    }
                    required
                  />
                </div>
              </Field>

              {kind === "business" && (
                <Field
                  label="Business registration number"
                  id="reg"
                  hint="Optional. You can add this information later."
                >
                  <Input
                    id="reg"
                    placeholder="Enter registration number"
                    className="h-12 rounded-lg border-border bg-background px-3.5 shadow-sm focus-visible:ring-2"
                    value={f.reg}
                    onChange={(event) =>
                      setF({ ...f, reg: event.target.value })
                    }
                  />
                </Field>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <StepHeading
                title="Protect your account"
                description="Create a strong password to keep your account secure."
              />

              <Field label="Password" id="password">
                <PasswordField
                  id="password"
                  autoComplete="new-password"
                  value={f.password}
                  onChange={(event) =>
                    setF({ ...f, password: event.target.value })
                  }
                  required
                  aria-describedby="strength"
                />
              </Field>

              <div id="strength" className="rounded-lg border border-border bg-muted/20 p-3">
                <StrengthMeter password={f.password} />
              </div>

              <Field label="Confirm password" id="confirm">
                <PasswordField
                  id="confirm"
                  warnCaps={false}
                  autoComplete="new-password"
                  value={f.confirm}
                  onChange={(event) =>
                    setF({ ...f, confirm: event.target.value })
                  }
                  required
                />
              </Field>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(event) => setAgree(event.target.checked)}
                  className="mt-1 size-4 shrink-0 accent-black"
                />
                <span className="text-xs leading-5 text-muted-foreground">
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    Terms of Use
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    Privacy Notice
                  </Link>
                  . I understand this is a sandbox where no real money moves.
                </span>
              </label>

              <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-4 text-emerald-900">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <p className="text-xs leading-5">
                  Use a unique password that you do not use on other websites.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <StepHeading
                title="Review your details"
                description="Make sure everything is correct before creating your account."
              />

              <dl className="overflow-hidden rounded-xl border border-border">
                {[
                  [
                    "Account type",
                    kind === "business" ? "Business" : "Individual",
                  ],
                  [
                    kind === "business" ? "Business name" : "Full name",
                    f.name.trim(),
                  ],
                  [
                    "Country",
                    countries.find((item) => item.code === country)?.name ??
                      country,
                  ],
                  ["Currency", currency],
                  ["Mobile number", phone],
                  ...(kind === "business" && f.reg.trim()
                    ? [["Registration number", f.reg.trim()]]
                    : []),
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={cn(
                      "grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 px-4 py-4 sm:px-5",
                      index % 2 === 0 ? "bg-muted/20" : "bg-background",
                      "border-b border-border last:border-b-0",
                    )}
                  >
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="break-words text-right text-sm font-medium">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex items-start gap-3 rounded-xl border border-border p-4">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-xs leading-5 text-muted-foreground">
                  Your account will initially be unverified. Verification may
                  be required to access higher transaction limits.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="mt-4 text-xs font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
              >
                Edit your details
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"
            >
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0 || busy}
              onClick={() => {
                setError(null);
                setStep((current) => current - 1);
              }}
              className="h-11 rounded-lg px-3 text-sm"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>

            <Button
              type="submit"
              disabled={busy}
              className="h-11 min-w-40 rounded-lg bg-foreground px-5 text-sm font-medium text-background shadow-sm transition-all hover:bg-foreground/85"
            >
              {busy ? (
                "Creating account..."
              ) : step < STEPS.length - 1 ? (
                <>
                  Continue
                  <ArrowRight className="ml-2 size-4" />
                </>
              ) : (
                <>
                  Create account
                  <Check className="ml-2 size-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
          <span>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              Sign in
            </Link>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" />
            VUKA secure onboarding
          </span>
        </div>
      </main>
    </AuthFrame>
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
  limits:
    | {
        per_txn_usd: number;
        daily_usd: number;
        monthly_usd: number;
      }
    | undefined;
  onContinue: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  const actions = [
    [
      "Explore your wallets",
      `Your business and personal wallets use ${currency}.`,
      "/wallets",
    ],
    [
      "Get verified",
      "Submit a verification reference to raise your limits.",
      "/verification",
    ],
    [
      "Send your first payment",
      "Quote a corridor and review the price before paying.",
      "/send",
    ],
  ] as const;

  return (
    <AuthFrame variant="register" wide>
      <main className="mx-auto w-full max-w-xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
          <Check className="size-3.5" />
          Registration complete
        </div>

        <div className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-foreground text-background">
          <Check className="size-7" />
        </div>

        <h1
          ref={heading}
          tabIndex={-1}
          className="text-4xl font-semibold tracking-tight outline-none sm:text-5xl"
        >
          Welcome, {name.trim().split(" ")[0]}.
        </h1>

        <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          Your VUKA account is ready. Explore your wallets or complete
          verification to access higher transaction limits.
        </p>

        {limits && (
          <dl className="mt-8 grid grid-cols-3 overflow-hidden rounded-xl border border-border">
            {(
              [
                ["Per payment", limits.per_txn_usd],
                ["Per day", limits.daily_usd],
                ["Per month", limits.monthly_usd],
              ] as const
            ).map(([label, amount]) => (
              <div
                key={label}
                className="border-r border-border p-3 last:border-r-0 sm:p-5"
              >
                <dd className="text-base font-semibold tracking-tight sm:text-2xl">
                  {money(amount, "USD")}
                </dd>
                <dt className="mt-2 text-[10px] text-muted-foreground sm:text-xs">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-9">
          <h2 className="mb-3 text-sm font-semibold">Recommended next steps</h2>

          <ol className="overflow-hidden rounded-xl border border-border">
            {actions.map(([title, description, to], index) => (
              <li key={to} className="border-b border-border last:border-b-0">
                <Link
                  to={to}
                  className="group flex items-center gap-4 p-4 transition-colors hover:bg-muted/30 sm:p-5"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {description}
                    </span>
                  </span>

                  <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <Button
          onClick={onContinue}
          className="mt-7 h-12 w-full rounded-lg bg-foreground text-background hover:bg-foreground/85 sm:w-auto"
        >
          Go to my dashboard
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </main>
    </AuthFrame>
  );
}

function StepHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground">
        {label}
      </Label>
      {children}
      {hint && (
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}