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
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — VUKA" }] }),
  component: Login,
});

type Mode = "trader" | "operator";

const demoAccounts = [
  { label: "Trader (RW)", mode: "trader", identifier: "+250700000991", password: "vuka-demo-2026" },
  { label: "Trader (KE)", mode: "trader", identifier: "+254700000882", password: "vuka-demo-2026" },
  { label: "Operator", mode: "operator", identifier: "operator@vuka.local", password: "operator-local-2026" },
  { label: "Arbiter", mode: "operator", identifier: "arbiter@vuka.local", password: "arbiter-local-2026" },
] as const;

function Login() {
  const t = useT();
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
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Welcome back</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Manage invoices, escrows and settlements.</p>

      <div role="tablist" aria-label="Account type" className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted p-1">
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
          <UserRound className="h-3.5 w-3.5" /> Trader
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
          <BriefcaseBusiness className="h-3.5 w-3.5" /> Operator
        </button>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <AuthField id="identifier" label={mode === "trader" ? "Phone number" : "Email address"}>
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
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
              {mode === "trader" ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
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
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </AuthField>

        <div className="flex justify-end">
          <details className="group inline-block text-right">
            <summary className="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground hover:underline underline-offset-4 marker:hidden">
              Forgot password?
            </summary>
            <div className="absolute right-6 left-6 mt-2 rounded-lg border border-border bg-card p-3 text-[11px] leading-relaxed text-muted-foreground shadow-float z-30">
              <p>
                Self-service reset isn't available yet. Trader passwords require identity confirmation; operator credentials
                are reset by your platform administrator.
              </p>
              <Link to="/support" className="mt-1.5 inline-block font-semibold text-foreground underline underline-offset-2">
                Contact help and support →
              </Link>
            </div>
          </details>
        </div>

        {error ? <AuthError>{error}</AuthError> : null}

        <Button type="submit" disabled={busy || !identifier.trim() || !password} className={cn("w-full group", AUTH_BUTTON)}>
          {busy ? "Signing in..." : "Sign in"}
          {!busy ? <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /> : null}
        </Button>
      </form>

      {showDemo ? (
        <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Demo credentials
            </span>
            <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/70">Dev only</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {demoAccounts.map((account) => (
              <button
                key={account.label}
                type="button"
                className="rounded border border-border bg-background px-2 py-1 font-mono text-[9px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
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
      ) : null}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to VUKA?{" "}
        <Link to="/register" className="font-semibold text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
