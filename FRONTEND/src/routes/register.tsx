import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  Lock,
  Phone,
  ShieldCheck,
  User,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AUTH_BUTTON,
  AUTH_INPUT,
  AuthError,
  AuthField,
  AuthShell,
  GoogleIcon,
} from "@/components/vuka/auth-shared";
import { describeError, isApiError } from "@/lib/api/client";
import { auth } from "@/lib/api/endpoints";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — VUKA Global Trade" }] }),
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

    if (s === 0) {
      return true;
    }

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
      const payload = {
        name: form.fullName.trim(),
        phone: form.phone.replace(/\s+/g, ""),
        password: form.password,
        account_type: form.accountType,
        business_name:
          form.accountType === "business" ? form.businessName.trim() : undefined,
        registration_number:
          form.accountType === "business" && form.registrationNumber.trim()
            ? form.registrationNumber.trim()
            : undefined,
        country: form.country,
        currency: form.currency,
      };

      await auth.register(payload);

      // Automatically sign in the freshly created user
      try {
        await auth.traderLogin(payload.phone, payload.password);
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

  // Registration Complete Success View
  if (completed) {
    return (
      <AuthShell page="register">
        <div className="flex flex-col h-full justify-between items-center text-center py-6">
          <div className="my-auto space-y-4 max-w-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0A0D12]">
              Welcome to VUKA
            </h1>
            <p className="text-xs sm:text-sm text-[#63635E] leading-relaxed">
              Your trader account has been created and verified. You are now connected to verified trade corridors across Africa.
            </p>
            <div className="pt-2">
              <Button
                onClick={() => void navigate({ to: "/" })}
                className={cn("w-full", AUTH_BUTTON)}
              >
                Go to Trade Dashboard
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell page="register" wide>
      <div className="flex flex-col h-full justify-between">
        {/* Top Header Block matching reference style */}
        <div>
          <div className="mb-5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#787870] block mb-1">
              Get Started
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0D12] leading-tight">
              Create your
              <br />
              <span className="font-extrabold">VUKA account.</span>
            </h1>
            <div className="flex items-center gap-2 mt-2 font-mono text-[10px] font-medium tracking-[0.18em] text-[#787870] uppercase">
              <span>Secure</span>
              <span className="h-1 w-1 rounded-full bg-[#A8A8A2]" />
              <span>Compliant</span>
              <span className="h-1 w-1 rounded-full bg-[#A8A8A2]" />
              <span>Global</span>
            </div>
          </div>

          {/* Stepper progress indicator */}
          <div className="mb-6 flex items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  step >= i ? "bg-[#0A0D12]" : "bg-[#E6E6E2]",
                )}
              />
            ))}
          </div>

          {/* Step 0: Account Type Selection */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-xs text-[#52524D] mb-2">
                Select the structure that matches your trade operations:
              </p>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => update("accountType", "business")}
                  className={cn(
                    "flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all",
                    form.accountType === "business"
                      ? "border-[#0A0D12] bg-[#FAFAF9] shadow-sm ring-1 ring-[#0A0D12]"
                      : "border-[#E4E4E0] bg-white hover:border-[#CACAC4]",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      form.accountType === "business"
                        ? "bg-[#0A0D12] text-white"
                        : "bg-[#F0F0EB] text-[#55554E]",
                    )}
                  >
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0A0D12]">
                        Registered Business / Corporation
                      </span>
                      {form.accountType === "business" && (
                        <Check className="h-3.5 w-3.5 text-[#0A0D12]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#6E6E67] mt-0.5 leading-snug">
                      For registered companies, freight forwarders, manufacturers, and trade houses.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => update("accountType", "individual")}
                  className={cn(
                    "flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all",
                    form.accountType === "individual"
                      ? "border-[#0A0D12] bg-[#FAFAF9] shadow-sm ring-1 ring-[#0A0D12]"
                      : "border-[#E4E4E0] bg-white hover:border-[#CACAC4]",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      form.accountType === "individual"
                        ? "bg-[#0A0D12] text-white"
                        : "bg-[#F0F0EB] text-[#55554E]",
                    )}
                  >
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0A0D12]">
                        Individual Trader / Sole Trader
                      </span>
                      {form.accountType === "individual" && (
                        <Check className="h-3.5 w-3.5 text-[#0A0D12]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#6E6E67] mt-0.5 leading-snug">
                      For sole proprietors, independent brokers, and individual merchant importers.
                    </p>
                  </div>
                </button>
              </div>

              <div className="pt-3">
                <Button
                  type="button"
                  onClick={nextStep}
                  className={cn("w-full group", AUTH_BUTTON)}
                >
                  Continue
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>

              {/* Quick Google Option */}
              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#E7E7E3]" />
                </div>
                <span className="relative bg-white px-3 font-mono text-[9px] uppercase tracking-widest text-[#94948E]">
                  or
                </span>
              </div>

              <button
                type="button"
                onClick={() => toast.info("Google registration is available on production domains")}
                className="w-full h-11 rounded-lg border border-[#E4E4E0] bg-white hover:bg-[#FAFAF9] text-xs font-semibold text-[#18181B] flex items-center justify-center gap-2.5 transition-colors"
              >
                <GoogleIcon className="h-4 w-4" />
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* Step 1: Entity & Contact Details */}
          {step === 1 && (
            <div className="space-y-3.5">
              <AuthField id="fullName" label="Full Name">
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

              {form.accountType === "business" && (
                <>
                  <AuthField id="businessName" label="Business / Company Name">
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
                    label="Business Reg / TIN (Optional)"
                    hint="Helps speed up settlement limit verifications"
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
              )}

              <div className="grid grid-cols-2 gap-3">
                <AuthField id="country" label="Primary Country">
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

                <AuthField id="currency" label="Operating Currency">
                  <Input
                    id="currency"
                    value={form.currency}
                    readOnly
                    className={cn("bg-[#F0F0EB] text-[#55554E]", AUTH_INPUT)}
                  />
                </AuthField>
              </div>

              <AuthField id="phone" label="Mobile Phone (Login &amp; OTP)">
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
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#9B9B94]">
                    <Phone className="h-4 w-4" />
                  </span>
                </div>
              </AuthField>

              {error && <AuthError>{error}</AuthError>}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="h-11 px-4 border-[#E4E4E0] text-xs font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  className={cn("flex-1 group", AUTH_BUTTON)}
                >
                  Next: Security
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Password & Agreement */}
          {step === 2 && (
            <div className="space-y-3.5">
              <AuthField id="password" label="Create Password">
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
                    className="absolute inset-y-0 right-3 flex items-center text-[#9B9B94] hover:text-[#0A0D12]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </AuthField>

              <AuthField id="confirmPassword" label="Confirm Password">
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

              {/* Password strength mini bar */}
              <div className="space-y-1">
                <div className="flex h-1 gap-1">
                  <div
                    className={cn(
                      "flex-1 rounded-full",
                      form.password.length >= 8 ? "bg-[#2E7D32]" : "bg-[#E0E0DC]",
                    )}
                  />
                  <div
                    className={cn(
                      "flex-1 rounded-full",
                      form.password.length >= 10 && /[0-9]/.test(form.password)
                        ? "bg-[#2E7D32]"
                        : "bg-[#E0E0DC]",
                    )}
                  />
                  <div
                    className={cn(
                      "flex-1 rounded-full",
                      form.password.length >= 12 && /[^a-zA-Z0-9]/.test(form.password)
                        ? "bg-[#2E7D32]"
                        : "bg-[#E0E0DC]",
                    )}
                  />
                </div>
                <span className="text-[10px] text-[#7A7A72]">
                  {form.password.length >= 8 ? "Good security level" : "Minimum 8 characters"}
                </span>
              </div>

              {/* Terms agreement checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.agreeTerms}
                    onChange={(e) => update("agreeTerms", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#D0D0CA] text-[#0A0D12] accent-[#0A0D12] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-[#52524D] leading-snug">
                    I agree to the{" "}
                    <Link to="/terms" className="underline underline-offset-2 text-[#0A0D12]">
                      Terms of Trade
                    </Link>{" "}
                    and acknowledge the{" "}
                    <Link to="/privacy" className="underline underline-offset-2 text-[#0A0D12]">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              {error && <AuthError>{error}</AuthError>}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="h-11 px-4 border-[#E4E4E0] text-xs font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  className={cn("flex-1 group", AUTH_BUTTON)}
                >
                  Review Details
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <form onSubmit={submit} className="space-y-4">
              <div className="rounded-xl border border-[#E4E4E0] bg-[#FAFAF9] p-4 text-xs space-y-2.5">
                <div className="flex justify-between border-b border-[#ECECE8] pb-2">
                  <span className="text-[#7A7A72]">Account Type</span>
                  <span className="font-semibold text-[#0A0D12] capitalize">
                    {form.accountType === "business" ? "Registered Business" : "Individual Trader"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#ECECE8] pb-2">
                  <span className="text-[#7A7A72]">Full Name</span>
                  <span className="font-semibold text-[#0A0D12]">{form.fullName}</span>
                </div>
                {form.accountType === "business" && (
                  <div className="flex justify-between border-b border-[#ECECE8] pb-2">
                    <span className="text-[#7A7A72]">Business</span>
                    <span className="font-semibold text-[#0A0D12]">{form.businessName}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-[#ECECE8] pb-2">
                  <span className="text-[#7A7A72]">Country &amp; Currency</span>
                  <span className="font-semibold text-[#0A0D12]">
                    {COUNTRIES.find((c) => c.code === form.country)?.name} ({form.currency})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A7A72]">Mobile Phone</span>
                  <span className="font-mono font-semibold text-[#0A0D12]">{form.phone}</span>
                </div>
              </div>

              {error && <AuthError>{error}</AuthError>}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={busy}
                  className="h-11 px-4 border-[#E4E4E0] text-xs font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  className={cn("flex-1 group", AUTH_BUTTON)}
                >
                  {busy ? "Creating account..." : "Complete Registration"}
                  {!busy && (
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom sign-in link matching reference */}
        <div className="pt-6 border-t border-[#F0F0EB] text-center">
          <p className="text-xs text-[#6B6B64]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#0A0D12] underline underline-offset-4 hover:text-black transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}