
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
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/vuka/password-field";
import { Label } from "@/components/ui/label";
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
    <main className="min-h-screen bg-white text-neutral-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT: Cinematic monochrome brand panel */}
        <section className="relative isolate hidden min-h-screen overflow-hidden bg-neutral-950 text-white lg:block">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-cover bg-left"
            style={{
              backgroundImage: "url('/images/vuka-login-hero.png')",
              backgroundSize: "auto 100%",
              backgroundPosition: "left center",
              backgroundRepeat: "no-repeat",
            }}
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/10 to-black/15"
          />

          {/* Brand header */}
          <div className="absolute left-10 right-10 top-9 flex items-center justify-between xl:left-14 xl:right-14">
            <Link
              to="/login"
              aria-label="VUKA home"
              className="inline-flex items-center gap-3"
            >
              <span className="flex h-11 w-11 items-center justify-center">
                <svg
                  viewBox="0 0 40 40"
                  fill="none"
                  className="h-10 w-10"
                  aria-hidden="true"
                >
                  <path
                    d="M4 5L20 35L36 5L25 13L20 24L15 13L4 5Z"
                    fill="currentColor"
                  />
                </svg>
              </span>

              <span className="text-3xl font-medium tracking-[0.24em]">
                VUKA
              </span>
            </Link>

            <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-white/65 xl:block">
              Trade / Operate / Grow
            </span>
          </div>

          {/* Brand story */}
          <div className="absolute bottom-36 left-10 max-w-lg xl:bottom-40 xl:left-14">
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-white/65">
              Built for cross-border commerce
            </p>

            <h2 className="max-w-md text-4xl font-medium leading-[1.12] tracking-tight xl:text-6xl">
              Global trade,
              <span className="mt-1 block text-white/65">
                smarter together.
              </span>
            </h2>

            <p className="mt-6 max-w-sm text-sm leading-6 text-white/75 xl:text-base">
              Connect across borders with secure, reliable and efficient
              digital trade solutions.
            </p>
          </div>

          {/* Brand values */}
          <div className="absolute bottom-9 left-10 right-10 flex items-center gap-5 border-t border-white/20 pt-5 xl:left-14 xl:right-14">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <span className="text-[10px] leading-4 text-white/85 xl:text-xs">
                Secure
                <br />
                transactions
              </span>
            </div>

            <div className="h-8 w-px bg-white/20" />

            <div className="flex items-center gap-2.5">
              <Globe2 className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <span className="text-[10px] leading-4 text-white/85 xl:text-xs">
                Cross-border
                <br />
                trade
              </span>
            </div>

            <div className="h-8 w-px bg-white/20" />

            <div className="flex items-center gap-2.5">
              <Zap className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <span className="text-[10px] leading-4 text-white/85 xl:text-xs">
                Real-time
                <br />
                operations
              </span>
            </div>
          </div>
        </section>

        {/* RIGHT: Authentication */}
        <section className="relative flex min-h-screen flex-col bg-white px-6 py-8 sm:px-12 lg:px-14 xl:px-20">
          {/* Mobile brand header */}
          <div className="mb-12 flex items-center justify-between lg:hidden">
            <Link
              to="/login"
              className="flex items-center gap-2.5"
              aria-label="VUKA home"
            >
              <svg
                viewBox="0 0 40 40"
                fill="none"
                className="h-8 w-8"
                aria-hidden="true"
              >
                <path
                  d="M4 5L20 35L36 5L25 13L20 24L15 13L4 5Z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-2xl font-medium tracking-[0.22em]">
                VUKA
              </span>
            </Link>

            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
              Trade / Operate
            </span>
          </div>

          <div className="mx-auto flex w-full max-w-[510px] flex-1 flex-col justify-center py-4">
            {/* Intro */}
            <div className="mb-8">
              <p className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-neutral-500">
                Welcome back
              </p>

              <h1 className="text-4xl font-medium tracking-[-0.045em] sm:text-5xl">
                {t("auth.welcome")}
              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-neutral-500 sm:text-base">
                {t("auth.welcome.sub")}
              </p>
            </div>

            {/* Account type selector */}
            <div
              role="tablist"
              aria-label="Account type"
              className="mb-8 grid grid-cols-2 border border-neutral-300"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "trader"}
                onClick={() => changeMode("trader")}
                className={cn(
                  "flex min-h-[58px] items-center justify-center gap-3 px-3",
                  "font-mono text-[10px] font-medium uppercase tracking-[0.2em]",
                  "transition-colors duration-200 focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-inset",
                  mode === "trader"
                    ? "bg-neutral-950 text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-100",
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
                  "flex min-h-[58px] items-center justify-center gap-3 border-l border-neutral-300 px-3",
                  "font-mono text-[10px] font-medium uppercase tracking-[0.2em]",
                  "transition-colors duration-200 focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-inset",
                  mode === "operator"
                    ? "bg-neutral-950 text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-100",
                )}
              >
                <BriefcaseBusiness className="h-5 w-5" strokeWidth={1.5} />
                Operator
              </button>
            </div>

            {/* Login form */}
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="identifier"
                  className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-700"
                >
                  {mode === "trader" ? t("auth.phone") : t("auth.email")}
                </Label>

                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-neutral-500">
                    {mode === "trader" ? (
                      <Phone className="h-[17px] w-[17px]" strokeWidth={1.5} />
                    ) : (
                      <Globe2 className="h-[17px] w-[17px]" strokeWidth={1.5} />
                    )}
                  </span>

                  <Input
                    id="identifier"
                    name="username"
                    className="h-[54px] rounded-none border-neutral-300 bg-white pl-11 text-sm shadow-none transition-colors placeholder:text-neutral-400 focus-visible:border-neutral-950 focus-visible:ring-1 focus-visible:ring-neutral-950"
                    autoComplete={mode === "trader" ? "tel" : "username"}
                    inputMode={mode === "trader" ? "tel" : "email"}
                    placeholder={
                      mode === "trader"
                        ? "+250700000000"
                        : "operator@company.com"
                    }
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-700"
                >
                  {t("auth.password")}
                </Label>

                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center text-neutral-500">
                    <LockKeyhole
                      className="h-[17px] w-[17px]"
                      strokeWidth={1.5}
                    />
                  </span>

                  <PasswordField
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-[54px] rounded-none border-neutral-300 bg-white pl-11 shadow-none focus-visible:border-neutral-950 focus-visible:ring-1 focus-visible:ring-neutral-950"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="border border-neutral-300 bg-neutral-50 p-3 text-sm leading-5 text-neutral-800"
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={busy || !identifier.trim() || !password}
                className="group h-[54px] w-full rounded-none bg-neutral-950 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-white shadow-none transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                {busy ? t("auth.signingIn") : t("auth.signIn")}
                {!busy && (
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                )}
              </Button>
            </form>

            {/* Password assistance */}
            <details className="group mt-5 border border-neutral-200 px-4 py-3">
              <summary className="cursor-pointer list-none font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-700 marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  Forgot your password?
                  <span className="text-base transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>

              <p className="mt-3 text-xs leading-5 text-neutral-500">
                Self-service reset is not yet available. Trader passwords
                are reset by support after identity confirmation; operator
                credentials are re-issued by the platform administrator.
                Contact{" "}
                <Link
                  to="/support"
                  className="font-medium text-neutral-950 underline underline-offset-4"
                >
                  Help and support
                </Link>
                .
              </p>
            </details>

            {/* Development-only demo accounts */}
            {showDemo && (
              <section
                aria-label="Development demo accounts"
                className="mt-5 border border-dashed border-neutral-400 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-neutral-700">
                    <Globe2 className="h-4 w-4" />
                  </span>

                  <div className="min-w-0">
                    <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.18em]">
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
                      className="border border-neutral-300 px-2.5 py-2 font-mono text-[9px] uppercase tracking-wider transition-colors hover:border-neutral-950 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
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
            <div className="mt-8 grid grid-cols-3 border-t border-neutral-200 pt-5">
              <div className="flex items-start gap-2 pr-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-neutral-600" strokeWidth={1.5} />
                <p className="text-[10px] leading-4 text-neutral-600">
                  Sessions end after inactivity.
                </p>
              </div>

              <div className="flex items-start gap-2 border-l border-neutral-200 px-3">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-neutral-600" strokeWidth={1.5} />
                <p className="text-[10px] leading-4 text-neutral-600">
                  Failed sign-ins are temporarily blocked.
                </p>
              </div>

              <div className="flex items-start gap-2 border-l border-neutral-200 pl-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-600" strokeWidth={1.5} />
                <p className="text-[10px] leading-4 text-neutral-600">
                  Staff will never ask for your password.
                </p>
              </div>
            </div>

            {/* Registration */}
            <div className="mt-8">
              {mode === "trader" ? (
                <p className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                  {t("auth.newHere")}
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1 font-medium text-neutral-950 underline underline-offset-4 decoration-neutral-400 hover:decoration-neutral-950"
                  >
                    {t("auth.createAccount")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </p>
              ) : (
                <p className="text-xs leading-5 text-neutral-500">
                  Operator accounts are provisioned by the platform team
                  and cannot be self-registered.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4 text-[10px] text-neutral-400">
            <span className="font-mono uppercase tracking-[0.16em]">
              VUKA · Cross-border commerce
            </span>
            <span>Secure access</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
