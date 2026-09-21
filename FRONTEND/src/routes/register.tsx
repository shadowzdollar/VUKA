import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Briefcase, Check, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFrame } from "@/components/vuka/auth-frame";
import { Flag } from "@/components/vuka/landing/flags";
import { PasswordField, StrengthMeter, passwordStrength } from "@/components/vuka/password-field";
import { describeError, isApiError } from "@/lib/api/client";
import { auth, platform } from "@/lib/api/endpoints";
import { money } from "@/lib/format";
import { DIAL } from "@/lib/markets";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — VUKA" }] }),
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
  const countries = useMemo(() => config.data?.countries ?? [], [config.data]);

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [kind, setKind] = useState<Kind>("business");
  const [country, setCountry] = useState("RW");
  const [currency, setCurrency] = useState("RWF");
  const [f, setF] = useState({ name: "", local: "", reg: "", password: "", confirm: "" });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const dial = DIAL[country] ?? "";
  const phone = useMemo(() => {
    const digits = f.local.replace(/[^\d]/g, "");
    if (f.local.trim().startsWith("+")) return `+${digits}`;
    return digits ? `+${dial}${digits.replace(/^0+/, "")}` : "";
  }, [f.local, dial]);

  // Moving between steps moves focus to the step heading so keyboard and screen-reader users follow along.
  useEffect(() => {
    heading.current?.focus();
  }, [step, done]);

  function pickCountry(code: string) {
    setCountry(code);
    const c = countries.find((x) => x.code === code);
    if (c) setCurrency(c.currency);
  }

  const problems: (string | null)[] = [
    null,
    f.name.trim().length < 2
      ? kind === "business"
        ? "Enter your business name."
        : "Enter your full name."
      : !PHONE.test(phone)
        ? "Enter a valid mobile number. Use the local number, or a full +country-code number."
        : null,
    f.password.length < 8
      ? "Password must be at least 8 characters."
      : f.password !== f.confirm
        ? "Passwords do not match."
        : passwordStrength(f.password).score < 2
          ? "Choose a stronger password."
          : !agree
            ? "Please accept the terms and privacy notice to continue."
            : null,
    null,
  ];

  function next() {
    const p = problems[step] ?? null;
    setError(p);
    if (!p) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) return next();
    for (const p of problems)
      if (p) {
        setError(p);
        return;
      }
    setError(null);
    setBusy(true);
    try {
      const input: Parameters<typeof auth.register>[0] = {
        full_name: f.name.trim(),
        phone_number: phone,
        password: f.password,
      };
      if (kind === "business" && f.reg.trim()) input.business_reg_number = f.reg.trim();
      await auth.register(input, currency);
      await auth.traderLogin(phone, f.password);
      await refresh();
      toast.success("Account created");
      setDone(true);
    } catch (err) {
      setError(
        isApiError(err) && err.status === 409
          ? "That mobile number is already registered. Try signing in instead."
          : describeError(err),
      );
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <Welcome
        name={f.name}
        currency={currency}
        onContinue={() => void navigate({ to: "/" })}
        limits={config.data?.kyc_limits?.["PENDING"]}
      />
    );

  return (
    <AuthFrame variant="register" wide>
      <h1
        ref={heading}
        tabIndex={-1}
        className="font-display text-4xl font-normal tracking-tight outline-none"
      >
        Create your trader account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        A business wallet for trade and a separate personal wallet, so business income never mixes
        with household spending.
      </p>

      <ol aria-label="Progress" className="mt-8 grid grid-cols-4 gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined}>
            <div className={cn("h-1 border border-foreground", i <= step && "bg-foreground")} />
            <div
              className={cn(
                "mt-1.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em]",
                i === step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3" aria-hidden="true" /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{s}</span>
              <span className="sr-only sm:hidden">{s}</span>
            </div>
          </li>
        ))}
      </ol>

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <h2 className="sr-only">{STEPS[step]}</h2>

        {step === 0 ? (
          <fieldset>
            <legend className="mb-3 text-sm font-medium">How will you use VUKA?</legend>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
              {(
                [
                  [
                    "business",
                    Briefcase,
                    "Registered business",
                    "Trade with suppliers and buyers, raise invoices, use escrow. You can add a registration number now or later.",
                  ],
                  [
                    "individual",
                    User,
                    "Individual trader",
                    "Sole trader or informal business. You can upgrade to business verification whenever you are ready.",
                  ],
                ] as const
              ).map(([k, Icon, h, b]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => setKind(k)}
                  className={cn(
                    "border p-4 text-left transition-colors",
                    kind === k
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <div className="mt-3 font-display text-xl">{h}</div>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      kind === k ? "opacity-80" : "text-muted-foreground",
                    )}
                  >
                    {b}
                  </p>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <Field label={kind === "business" ? "Business name" : "Full name"} id="name">
              <Input
                id="name"
                autoComplete={kind === "business" ? "organization" : "name"}
                className="rounded-none"
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Country" id="country">
                <select
                  id="country"
                  value={country}
                  onChange={(e) => pickCountry(e.target.value)}
                  className="h-9 w-full border border-input bg-background px-2 text-sm"
                >
                  {(countries.length
                    ? countries
                    : [{ code: "RW", name: "Rwanda", currency: "RWF" }]
                  ).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Home currency" id="currency">
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-9 w-full border border-input bg-background px-2 font-mono text-sm"
                >
                  {(config.data?.currencies ?? [currency]).map((c) => (
                    <option key={c} value={c}>
                      {c}
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
                  ? `Will be saved as ${phone}`
                  : `Local number or full international form, e.g. +${dial || "250"}700000000`
              }
            >
              <div className="flex">
                <span
                  className="flex items-center border border-r-0 border-input bg-muted px-3 font-mono text-sm"
                  aria-hidden="true"
                >
                  <Flag code={country} className="mr-2 w-5 shrink-0" />+{dial}
                </span>
                <Input
                  id="phone"
                  inputMode="tel"
                  autoComplete="tel-national"
                  className="rounded-none font-mono"
                  placeholder="700 000 000"
                  value={f.local}
                  onChange={(e) => setF({ ...f, local: e.target.value })}
                  required
                />
              </div>
            </Field>
            {kind === "business" ? (
              <Field
                label="Business registration number (optional)"
                id="reg"
                hint="Helps with business verification later. You can leave it blank."
              >
                <Input
                  id="reg"
                  className="rounded-none font-mono"
                  value={f.reg}
                  onChange={(e) => setF({ ...f, reg: e.target.value })}
                />
              </Field>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <Field label="Password" id="password">
              <PasswordField
                id="password"
                autoComplete="new-password"
                value={f.password}
                onChange={(e) => setF({ ...f, password: e.target.value })}
                required
                aria-describedby="strength"
              />
            </Field>
            <div id="strength">
              <StrengthMeter password={f.password} />
            </div>
            <Field label="Confirm password" id="confirm">
              <PasswordField
                id="confirm"
                warnCaps={false}
                autoComplete="new-password"
                value={f.confirm}
                onChange={(e) => setF({ ...f, confirm: e.target.value })}
                required
              />
            </Field>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 size-4 accent-[var(--color-foreground)]"
              />
              <span>
                I have read the{" "}
                <Link to="/terms" target="_blank" className="underline underline-offset-4">
                  terms of use
                </Link>{" "}
                and{" "}
                <Link to="/privacy" target="_blank" className="underline underline-offset-4">
                  privacy notice
                </Link>
                , and understand this is a sandbox where no real money moves.
              </span>
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <dl className="divide-y divide-border border border-border text-sm">
              {[
                ["Account type", kind === "business" ? "Registered business" : "Individual trader"],
                [kind === "business" ? "Business name" : "Name", f.name.trim()],
                ["Country", countries.find((c) => c.code === country)?.name ?? country],
                ["Home currency", currency],
                ["Mobile number", phone],
                ...(kind === "business" && f.reg.trim()
                  ? [["Registration no.", f.reg.trim()]]
                  : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 p-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-mono text-xs">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Your password is sent over an encrypted connection and stored only as a salted hash.
              You can go back to change anything.
            </p>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="border-2 border-foreground p-3 text-xs">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0 || busy}
            onClick={() => {
              setError(null);
              setStep((s) => s - 1);
            }}
            className="rounded-none font-mono text-xs uppercase"
          >
            <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={busy}
            className="rounded-none font-mono text-xs uppercase"
          >
            {step < STEPS.length - 1 ? (
              <>
                Continue
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </>
            ) : busy ? (
              "Creating account…"
            ) : (
              "Create account"
            )}
          </Button>
        </div>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">
        Already registered?{" "}
        <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
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
  limits: { per_txn_usd: number; daily_usd: number; monthly_usd: number } | undefined;
  onContinue: () => void;
}) {
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => h.current?.focus(), []);
  const next = [
    [
      "Explore your wallets",
      "A business wallet and a personal wallet were created in " + currency + ".",
      "/wallets",
    ],
    ["Get verified", "File a verification reference to raise your limits.", "/verification"],
    ["Send your first payment", "Quote a corridor, then pay; the price is shown first.", "/send"],
  ] as const;
  return (
    <AuthFrame variant="register" wide>
      <div className="stamp-in inline-block border-2 border-foreground px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]">
        Account opened
      </div>
      <h1
        ref={h}
        tabIndex={-1}
        className="mt-4 font-display text-4xl font-normal tracking-tight outline-none"
      >
        Welcome, {name.trim().split(" ")[0]}.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your account is ready. It starts unverified, with conservative limits until compliance
        reviews your reference.
      </p>
      {limits ? (
        <dl className="mt-6 grid grid-cols-3 border border-border text-center">
          {(
            [
              ["Per payment", limits.per_txn_usd],
              ["Per day", limits.daily_usd],
              ["Per month", limits.monthly_usd],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="border-r border-border p-3 last:border-r-0">
              <dd className="tabular font-display text-2xl">{money(v, "USD")}</dd>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {k}
              </dt>
            </div>
          ))}
        </dl>
      ) : null}
      <ol className="mt-6 space-y-2">
        {next.map(([h2, b, to], i) => (
          <li key={to}>
            <Link
              to={to}
              className="flex items-start gap-4 border border-border p-4 hover:bg-accent"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block font-display text-xl">{h2}</span>
                <span className="text-xs text-muted-foreground">{b}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <Button onClick={onContinue} className="mt-6 rounded-none font-mono text-xs uppercase">
        Go to my dashboard
        <ArrowRight className="ml-2 size-4" aria-hidden="true" />
      </Button>
    </AuthFrame>
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
    <div className="space-y-1.5">
      <Label htmlFor={id} className="font-mono text-[10px] uppercase tracking-[0.16em]">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
