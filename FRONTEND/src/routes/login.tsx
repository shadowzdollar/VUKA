import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/vuka/auth-frame";
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
  // Seeded local accounts are offered only by a development engine — never in production.
  const showDemo = config.data?.environment === "development";

  useEffect(() => {
    if (session.status === "trader" || session.status === "operator") {
      void navigate({ to: "/" });
    }
  }, [session.status, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "trader") await auth.traderLogin(identifier.trim(), password);
      else await auth.operatorLogin(identifier.trim(), password);
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

  return (
    <AuthFrame variant="login">
      <h1 className="text-3xl font-semibold tracking-tight">{t("auth.welcome")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("auth.welcome.sub")}</p>

      <div
        role="tablist"
        aria-label="Account type"
        className="mt-8 grid grid-cols-2 border border-border"
      >
        {(["trader", "operator"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setIdentifier("");
              setError(null);
            }}
            className={cn(
              "px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
              mode === m
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {m === "trader" ? t("auth.trader") : t("auth.operator")}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="identifier" className="font-mono text-[10px] uppercase tracking-[0.16em]">
            {mode === "trader" ? t("auth.phone") : t("auth.email")}
          </Label>
          <Input
            id="identifier"
            className="rounded-none"
            autoComplete={mode === "trader" ? "tel" : "username"}
            inputMode={mode === "trader" ? "tel" : "email"}
            placeholder={mode === "trader" ? "+250700000000" : "operator@company.com"}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.16em]">
            {t("auth.password")}
          </Label>
          <PasswordField
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? (
          <p role="alert" className="border-2 border-foreground p-3 text-xs">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={busy || !identifier || !password}
          className="w-full rounded-none font-mono text-xs uppercase"
        >
          {busy ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>

      <details className="mt-5 border border-border p-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-mono uppercase tracking-[0.14em] text-foreground">
          Forgot your password?
        </summary>
        <p className="mt-2">
          Self-service reset is not yet available in this sandbox. Trader passwords are reset by the
          support team after identity confirmation; operator credentials are re-issued by the
          platform administrator. Use{" "}
          <Link to="/support" className="underline underline-offset-4">
            Help and support
          </Link>
          .
        </p>
      </details>

      {showDemo ? (
        <section
          aria-label="Development demo accounts"
          className="mt-5 border border-dashed border-foreground p-3 text-xs"
        >
          <div className="font-mono uppercase tracking-[0.16em]">Development demo access</div>
          <p className="mt-1 text-muted-foreground">
            Seeded local accounts, shown only because this engine reports environment=development.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              ["Trader (RW)", "trader", "+250700000991", "vuka-demo-2026"],
              ["Trader (KE)", "trader", "+254700000882", "vuka-demo-2026"],
              ["Operator", "operator", "operator@vuka.local", "operator-local-2026"],
              ["Arbiter", "operator", "arbiter@vuka.local", "arbiter-local-2026"],
            ].map(([label, m, id, pw]) => (
              <button
                key={label}
                type="button"
                className="border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-accent"
                onClick={() => {
                  setMode(m as Mode);
                  setIdentifier(id!);
                  setPassword(pw!);
                  setError(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <ul className="mt-6 grid gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:grid-cols-3">
        <li>Sessions end after a period of inactivity.</li>
        <li>Repeated failed sign-ins are temporarily blocked.</li>
        <li>VUKA staff will never ask for your password.</li>
      </ul>

      {mode === "trader" ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {t("auth.newHere")}{" "}
          <Link to="/register" className="font-medium text-foreground underline underline-offset-4">
            {t("auth.createAccount")}
          </Link>
        </p>
      ) : (
        <p className="mt-6 text-xs text-muted-foreground">
          Operator accounts are provisioned by the platform team and cannot be self-registered.
        </p>
      )}
    </AuthFrame>
  );
}
