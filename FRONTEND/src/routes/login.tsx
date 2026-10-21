import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Globe2,
  Lock,
  Mail,
  Phone,
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
import { auth, platform } from "@/lib/api/endpoints";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — VUKA Global Trade" }] }),
  component: Login,
});

type Mode = "trader" | "operator";

const demoAccounts = [
  {
    label: "Trader (RW)",
    mode: "trader",
    identifier: "+250700000991",
    password: "vuka-demo-2026",
  },
  {
    label: "Trader (KE)",
    mode: "trader",
    identifier: "+254700000882",
    password: "vuka-demo-2026",
  },
  {
    label: "Operator",
    mode: "operator",
    identifier: "operator@vuka.local",
    password: "operator-local-2026",
  },
  {
    label: "Arbiter",
    mode: "operator",
    identifier: "arbiter@vuka.local",
    password: "arbiter-local-2026",
  },
] as const;

function Login() {
  const t = useT();
  const { session, refresh } = useSession();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("trader");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      toast.success("Signed in successfully");
    } catch (err) {
      setError(
        isApiError(err) && err.code === "too_many_attempts"
          ? t("auth.tooMany")
          : isApiError(err) && err.code === "invalid_credentials"
            ? mode === "trader"
              ? "Invalid phone number or password."
              : "Invalid email or password."
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
      <div className="flex flex-col h-full justify-between">
        {/* Top Header Block matching the reference */}
        <div>
          <div className="mb-6">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#787870] block mb-2">
              Welcome back
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0D12] leading-tight">
              Sign in to your
              <br />
              <span className="font-extrabold">VUKA account.</span>
            </h1>
            <div className="flex items-center gap-2 mt-2 font-mono text-[10px] font-medium tracking-[0.18em] text-[#787870] uppercase">
              <span>Secure</span>
              <span className="h-1 w-1 rounded-full bg-[#A8A8A2]" />
              <span>Fast</span>
              <span className="h-1 w-1 rounded-full bg-[#A8A8A2]" />
              <span>Global</span>
            </div>
          </div>

          {/* Account type switcher: Trader vs Operator */}
          <div
            role="tablist"
            aria-label="Account type"
            className="mb-5 grid grid-cols-2 rounded-lg bg-[#F0F0EC] p-1 border border-[#E4E4E0]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "trader"}
              onClick={() => changeMode("trader")}
              className={cn(
                "flex h-9 items-center justify-center gap-2 rounded-md font-mono text-[10px] font-semibold uppercase tracking-[0.16em] transition-all",
                mode === "trader"
                  ? "bg-white text-[#0A0D12] shadow-sm font-bold"
                  : "text-[#6B6B64] hover:text-[#0A0D12]",
              )}
            >
              <UserRound className="h-3.5 w-3.5" />
              Trader
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === "operator"}
              onClick={() => changeMode("operator")}
              className={cn(
                "flex h-9 items-center justify-center gap-2 rounded-md font-mono text-[10px] font-semibold uppercase tracking-[0.16em] transition-all",
                mode === "operator"
                  ? "bg-white text-[#0A0D12] shadow-sm font-bold"
                  : "text-[#6B6B64] hover:text-[#0A0D12]",
              )}
            >
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Operator
            </button>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            <AuthField
              id="identifier"
              label={mode === "trader" ? "Phone number" : "Email address"}
            >
              <div className="relative">
                <Input
                  id="identifier"
                  name="username"
                  className={cn("pr-10", AUTH_INPUT)}
                  autoComplete={mode === "trader" ? "tel" : "username"}
                  inputMode={mode === "trader" ? "tel" : "email"}
                  placeholder={mode === "trader" ? "+250 700 000 000" : "you@example.com"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#9B9B94]">
                  {mode === "trader" ? (
                    <Phone className="h-4 w-4" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </span>
              </div>
            </AuthField>

            <AuthField id="password" label="Password">
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={cn("pr-10", AUTH_INPUT)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-[#9B9B94] hover:text-[#0A0D12] transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </AuthField>

            {/* Remember me & Forgot password row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#D0D0CA] text-[#0A0D12] accent-[#0A0D12] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-[#52524D]">Remember me</span>
              </label>

              <details className="group inline-block text-right">
                <summary className="cursor-pointer list-none text-xs font-medium text-[#52524D] hover:text-[#0A0D12] hover:underline underline-offset-4 marker:hidden">
                  Forgot password?
                </summary>
                <div className="absolute right-6 left-6 mt-2 p-3 bg-[#F4F4F2] border border-[#E0E0DC] rounded-lg shadow-lg text-[11px] leading-relaxed text-[#555550] z-30">
                  <p>
                    Self-service reset is managed by support. Trader passwords require identity confirmation; operator credentials are reset by your platform administrator.
                  </p>
                  <Link
                    to="/support"
                    className="mt-1.5 inline-block font-semibold text-[#0A0D12] underline underline-offset-2"
                  >
                    Contact Help and Support →
                  </Link>
                </div>
              </details>
            </div>

            {error && <AuthError>{error}</AuthError>}

            {/* Primary Sign In Button */}
            <Button
              type="submit"
              disabled={busy || !identifier.trim() || !password}
              className={cn("w-full group", AUTH_BUTTON)}
            >
              {busy ? "Signing in..." : "Sign in"}
              {!busy && (
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              )}
            </Button>
          </form>

          {/* Divider with centered 'or' */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E7E7E3]" />
            </div>
            <span className="relative bg-white px-3 font-mono text-[10px] uppercase tracking-widest text-[#94948E]">
              or
            </span>
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={() => toast.info("Google authentication is available on production domains")}
            className="w-full h-11 rounded-lg border border-[#E4E4E0] bg-white hover:bg-[#FAFAF9] text-xs font-semibold text-[#18181B] flex items-center justify-center gap-2.5 transition-colors shadow-none active:scale-[0.99]"
          >
            <GoogleIcon className="h-4 w-4" />
            <span>Continue with Google</span>
          </button>

          {/* Development Demo Accounts */}
          {showDemo && (
            <div className="mt-4 rounded-lg border border-dashed border-[#D2D2CC] bg-[#FAFAF9] p-3 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7A7A72]">
                  Demo Credentials
                </span>
                <span className="font-mono text-[8px] uppercase tracking-wider text-[#A0A09A]">
                  Dev Only
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {demoAccounts.map((account) => (
                  <button
                    key={account.label}
                    type="button"
                    className="rounded border border-[#DCDCD6] bg-white px-2 py-1 font-mono text-[9px] text-[#4A4A44] transition-colors hover:border-[#0A0D12] hover:text-[#0A0D12]"
                    onClick={() => {
                      changeMode(account.mode);
                      setIdentifier(account.identifier);
                      setPassword(account.password);
                    }}
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom register link matching reference */}
        <div className="pt-6 border-t border-[#F0F0EB] text-center">
          <p className="text-xs text-[#6B6B64]">
            New to VUKA?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#0A0D12] underline underline-offset-4 hover:text-black transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}