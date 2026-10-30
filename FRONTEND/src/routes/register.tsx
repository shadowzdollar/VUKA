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

function Register() {
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
        setError("Please enter your full name.");
        return false;
      }
      if (form.accountType === "business" && !form.businessName.trim()) {
        setError("Please enter your business or trading entity name.");
        return false;
      }
      const rawPhone = form.phone.replace(/\s+/g, "");
      if (rawPhone.length < 8) {
        setError("Please provide a valid mobile phone number for verification.");
        return false;
      }
      return true;
    }

    if (s === 2) {
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
      if (!form.agreeTerms) {
        setError("Please accept the terms of trade and platform policy to continue.");
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
      toast.success("Account created successfully!");
    } catch (err) {
      setError(
        isApiError(err) && err.code === "conflict"
          ? "A trader account with this phone number already exists."
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
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Welcome to VUKA</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Your trader account has been created. You're ready to start trading across corridors.
          </p>
          <div className="mt-6 w-full max-w-sm">
            <Button onClick={() => void navigate({ to: "/" })} className={cn("w-full group", AUTH_BUTTON)}>
              Go to dashboard
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell page="register">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Get started</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create your account</h1>

      <div className="mt-6 mb-6 flex items-center gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", step >= i ? "bg-primary" : "bg-muted")} />
        ))}
      </div>

      {step === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select the structure that matches your trade operations:</p>
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
                  <span className="text-sm font-semibold">Registered business</span>
                  {form.accountType === "business" ? <Check className="h-3.5 w-3.5" /> : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  For registered companies, freight forwarders, manufacturers and trade houses.
                </p>
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
                  <span className="text-sm font-semibold">Individual trader</span>
                  {form.accountType === "individual" ? <Check className="h-3.5 w-3.5" /> : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  For sole proprietors, independent brokers and individual merchant importers.
                </p>
              </div>
            </button>
          </div>

          <Button type="button" onClick={nextStep} className={cn("w-full group", AUTH_BUTTON)}>
            Continue
            <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-3.5">
          <AuthField id="fullName" label="Full name">
            <Input
              id="fullName"
              placeholder="e.g. Samuel Mugisha"
              className={AUTH_INPUT}
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              autoComplete="name"
              required
            />
          </AuthField>

          {form.accountType === "business" ? (
            <>
              <AuthField id="businessName" label="Business / company name">
                <Input
                  id="businessName"
                  placeholder="e.g. Great Lakes Logistics Ltd"
                  className={AUTH_INPUT}
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  required
                />
              </AuthField>

              <AuthField
                id="registrationNumber"
                label="Business reg. / TIN (optional)"
                hint="Helps speed up settlement limit verification."
              >
                <Input
                  id="registrationNumber"
                  placeholder="e.g. 100234567"
                  className={AUTH_INPUT}
                  value={form.registrationNumber}
                  onChange={(e) => update("registrationNumber", e.target.value)}
                />
              </AuthField>
            </>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <AuthField id="country" label="Primary country">
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

            <AuthField id="currency" label="Operating currency">
              <Input id="currency" value={form.currency} readOnly className={cn("bg-muted text-muted-foreground", AUTH_INPUT)} />
            </AuthField>
          </div>

          <AuthField id="phone" label="Mobile phone (login & OTP)">
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
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
            </Button>
            <Button type="button" onClick={nextStep} className={cn("flex-1 group", AUTH_BUTTON)}>
              Next: Security
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3.5">
          <AuthField id="password" label="Create password">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                className={cn("pr-10", AUTH_INPUT)}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </AuthField>

          <AuthField id="confirmPassword" label="Confirm password">
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Repeat your password"
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
              {form.password.length >= 8 ? "Good security level" : "Minimum 8 characters"}
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
              I agree to the{" "}
              <Link to="/terms" className="underline underline-offset-2 text-foreground">
                Terms of Trade
              </Link>{" "}
              and acknowledge the{" "}
              <Link to="/privacy" className="underline underline-offset-2 text-foreground">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {error ? <AuthError>{error}</AuthError> : null}

          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="outline" onClick={prevStep} className="h-11 px-4 text-xs font-semibold">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
            </Button>
            <Button type="button" onClick={nextStep} className={cn("flex-1 group", AUTH_BUTTON)}>
              Review details
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2.5 rounded-xl border border-border bg-muted/40 p-4 text-xs">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Account type</span>
              <span className="font-semibold capitalize">
                {form.accountType === "business" ? "Registered business" : "Individual trader"}
              </span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Full name</span>
              <span className="font-semibold">{form.fullName}</span>
            </div>
            {form.accountType === "business" ? (
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Business</span>
                <span className="font-semibold">{form.businessName}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Country &amp; currency</span>
              <span className="font-semibold">
                {COUNTRIES.find((c) => c.code === form.country)?.name} ({form.currency})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mobile phone</span>
              <span className="font-mono font-semibold">{form.phone}</span>
            </div>
          </div>

          {error ? <AuthError>{error}</AuthError> : null}

          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="outline" onClick={prevStep} disabled={busy} className="h-11 px-4 text-xs font-semibold">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
            <Button type="submit" disabled={busy} className={cn("flex-1 group", AUTH_BUTTON)}>
              {busy ? "Creating account..." : "Complete registration"}
              {!busy ? <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /> : null}
            </Button>
          </div>
        </form>
      ) : null}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
