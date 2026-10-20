import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  Globe2,
  LockKeyhole,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/vuka/password-field";
import {
  AUTH_BUTTON,
  AUTH_INPUT,
  AuthError,
  AuthField,
  AuthShell,
} from "@/components/vuka/auth-shared";
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
      toast.success("Signed in");
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
    <AuthShell>
      {/* Intro */}
      <div className="mb-7">
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-neutral-500">
          Sign in
        </p>

        <h1 className="text-3xl font-medium tracking-[-0.045em] text-neutral-50 sm:text-4xl">
          {t("auth.welcome")}
        </h1>

        <p className="mt-3 text-sm leading-6 text-neutral-400">{t("auth.welcome.sub")}</p>
      </div>

      {/* Account type selector */}
      <div
        role="tablist"
        aria-label="Account type"
        className="mb-7 grid grid-cols-2 border border-neutral-700"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "trader"}
          onClick={() => changeMode("trader")}
          className={cn(
            "flex min-h-[52px] items-center justify-center gap-3 px-3",
            "font-mono text-[10px] font-medium uppercase tracking-[0.2em]",
            "transition-colors duration-200 focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-neutral-100 focus-visible:ring-inset",
            mode === "trader"
              ? "bg-neutral-100 text-neutral-950"
              : "bg-transparent text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300",
          )}
        >
          <UserRound className="h-5 w-5" strokeWidth={1.5} />
          Trader
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === "operator"}
          onClick={() => changeMode("operator")}
          className={cn(
            "flex min-h-[52px] items-center justify-center gap-3 border-l border-neutral-700 px-3",
            "font-mono text-[10px] font-medium uppercase tracking-[0.2em]",
            "transition-colors duration-200 focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-neutral-100 focus-visible:ring-inset",
            mode === "operator"
              ? "bg-neutral-100 text-neutral-950"
              : "bg-transparent text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300",
          )}
        >
          <BriefcaseBusiness className="h-5 w-5" strokeWidth={1.5} />
          Operator
        </button>
      </div>

      {/* Login form */}
      <form onSubmit={submit} className="space-y-5">
        <AuthField id="identifier" label={mode === "trader" ? t("auth.phone") : t("auth.email")}>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-500">
              {mode === "trader" ? (
                <Phone className="h-[17px] w-[17px]" strokeWidth={1.5} />
              ) : (
                <Globe2 className="h-[17px] w-[17px]" strokeWidth={1.5} />
              )}
            </span>

            <Input
              id="identifier"
              name="username"
              className={cn("pl-10", AUTH_INPUT)}
              autoComplete={mode === "trader" ? "tel" : "username"}
              inputMode={mode === "trader" ? "tel" : "email"}
              placeholder={mode === "trader" ? "+250700000000" : "operator@company.com"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
        </AuthField>

        <AuthField id="password" label={t("auth.password")}>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-neutral-500">
              <LockKeyhole className="h-[17px] w-[17px]" strokeWidth={1.5} />
            </span>

            <PasswordField
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={cn("pl-10", AUTH_INPUT)}
            />
          </div>
        </AuthField>

        {error && <AuthError>{error}</AuthError>}

        <Button
          type="submit"
          disabled={busy || !identifier.trim() || !password}
          className={cn("group h-12 w-full disabled:opacity-50", AUTH_BUTTON)}
        >
          {busy ? t("auth.signingIn") : t("auth.signIn")}
          {!busy && (
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          )}
        </Button>
      </form>

      {/* Password assistance */}
      <details className="group mt-5 border border-neutral-800 px-4 py-3">
        <summary className="cursor-pointer list-none font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-300 marker:hidden">
          <span className="flex items-center justify-between gap-3">
            Forgot your password?
            <span className="text-base transition-transform group-open:rotate-45">+</span>
          </span>
        </summary>

        <p className="mt-3 text-xs leading-5 text-neutral-500">
          Self-service reset is not yet available. Trader passwords are reset by support after
          identity confirmation; operator credentials are re-issued by the platform administrator.
          Contact{" "}
          <Link to="/support" className="font-medium text-neutral-100 underline underline-offset-4">
            Help and support
          </Link>
          .
        </p>
      </details>

      {/* Development-only demo accounts */}
      {showDemo && (
        <section
          aria-label="Development demo accounts"
          className="mt-5 border border-dashed border-neutral-700 p-4"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-neutral-500">
              <Globe2 className="h-4 w-4" />
            </span>

            <div className="min-w-0">
              <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-300">
                Development demo access
              </h2>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Seeded accounts are available only in development mode.
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {demoAccounts.map((account) => (
              <button
                key={account.label}
                type="button"
                className="border border-neutral-700 px-2.5 py-2 font-mono text-[9px] uppercase tracking-wider text-neutral-400 transition-colors hover:border-neutral-100 hover:bg-neutral-800 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-100"
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
        </section>
      )}

      {/* Security notes */}
      <div className="mt-7 grid grid-cols-3 border-t border-neutral-800 pt-5">
        <div className="flex items-start gap-2 pr-3">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" strokeWidth={1.5} />
          <p className="text-[10px] leading-4 text-neutral-500">Sessions end after inactivity.</p>
        </div>

        <div className="flex items-start gap-2 border-l border-neutral-800 px-3">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" strokeWidth={1.5} />
          <p className="text-[10px] leading-4 text-neutral-500">
            Failed sign-ins are temporarily blocked.
          </p>
        </div>

        <div className="flex items-start gap-2 border-l border-neutral-800 pl-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" strokeWidth={1.5} />
          <p className="text-[10px] leading-4 text-neutral-500">
            Staff will never ask for your password.
          </p>
        </div>
      </div>

      {/* Registration */}
      <div className="mt-7 border-t border-neutral-800 pt-5">
        {mode === "trader" ? (
          <p className="flex flex-wrap items-center gap-2 text-sm text-neutral-400">
            {t("auth.newHere")}
            <Link
              to="/register"
              className="inline-flex items-center gap-1 font-medium text-neutral-50 underline underline-offset-4 decoration-neutral-600 hover:text-neutral-100"
            >
              {t("auth.createAccount")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        ) : (
          <p className="text-xs leading-5 text-neutral-500">
            Operator accounts are provisioned by the platform team and cannot be self-registered.
          </p>
        )}
      </div>
    </AuthShell>
  );
}
