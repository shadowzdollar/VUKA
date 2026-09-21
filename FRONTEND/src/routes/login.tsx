import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/vuka/auth-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { describeError, isApiError } from "@/lib/api/client";
import { auth } from "@/lib/api/endpoints";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — VUKA" }] }),
  component: Login,
});

type Mode = "trader" | "operator";

function Login() {
  const { session, refresh } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("trader");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        isApiError(err) && err.code === "invalid_credentials"
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
    <AuthFrame>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to move money, track invoices and settle across corridors.
      </p>

      <div role="tablist" className="mt-8 grid grid-cols-2 border border-border">
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
            {m === "trader" ? "Trader" : "Operator / Arbiter"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="identifier" className="font-mono text-[10px] uppercase tracking-[0.16em]">
            {mode === "trader" ? "Mobile number" : "Email"}
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
            Password
          </Label>
          <Input
            id="password"
            type="password"
            className="rounded-none"
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
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {mode === "trader" ? (
        <p className="mt-6 text-sm text-muted-foreground">
          New to VUKA?{" "}
          <Link to="/register" className="font-medium text-foreground underline underline-offset-4">
            Create a trader account
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
