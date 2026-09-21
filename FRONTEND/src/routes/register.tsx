import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/vuka/auth-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { describeError } from "@/lib/api/client";
import { auth } from "@/lib/api/endpoints";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — VUKA" }] }),
  component: Register,
});

/** Currencies with a provisioned settlement account on the engine (see cmd/main.go). */
const CURRENCIES = [
  { code: "RWF", label: "RWF — Rwandan franc" },
  { code: "KES", label: "KES — Kenyan shilling" },
];

// E.164: +, country code, 8-14 digits. The engine stores the string verbatim and logs in by exact match.
const PHONE = /^\+[1-9]\d{7,14}$/;

function Register() {
  const { refresh } = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    business_reg_number: "",
    password: "",
    confirm: "",
    currency: "RWF",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate(): string | null {
    if (form.full_name.trim().length < 2) return "Enter your full or business name.";
    if (!PHONE.test(form.phone_number.trim()))
      return "Mobile number must be in international format, e.g. +250700000000.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return null;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const phone = form.phone_number.trim();
      const input: Parameters<typeof auth.register>[0] = {
        full_name: form.full_name.trim(),
        phone_number: phone,
        password: form.password,
      };
      if (form.business_reg_number.trim())
        input.business_reg_number = form.business_reg_number.trim();
      await auth.register(input, form.currency);
      await auth.traderLogin(phone, form.password);
      await refresh();
      toast.success("Account created", {
        description: "Your personal and business wallets are ready.",
      });
      void navigate({ to: "/" });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame>
      <h1 className="text-3xl font-semibold tracking-tight">Create your trader account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You get a business wallet for trade and a separate personal wallet, so business income never
        mixes with household spending.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Full or business name" id="full_name">
          <Input
            id="full_name"
            className="rounded-none"
            value={form.full_name}
            onChange={set("full_name")}
            required
          />
        </Field>
        <Field label="Mobile number" id="phone">
          <Input
            id="phone"
            className="rounded-none font-mono"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+250700000000"
            value={form.phone_number}
            onChange={set("phone_number")}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business registration (optional)" id="reg">
            <Input
              id="reg"
              className="rounded-none font-mono"
              value={form.business_reg_number}
              onChange={set("business_reg_number")}
            />
          </Field>
          <Field label="Home currency" id="currency">
            <Select
              value={form.currency}
              onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
            >
              <SelectTrigger id="currency" className="rounded-none font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" id="password">
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              className="rounded-none"
              value={form.password}
              onChange={set("password")}
              required
            />
          </Field>
          <Field label="Confirm password" id="confirm">
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              className="rounded-none"
              value={form.confirm}
              onChange={set("confirm")}
              required
            />
          </Field>
        </div>
        {error ? (
          <p role="alert" className="border-2 border-foreground p-3 text-xs">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={busy}
          className="w-full rounded-none font-mono text-xs uppercase"
        >
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already registered?{" "}
        <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        New accounts start at KYC status PENDING. Verification is completed by the compliance team.
      </p>
    </AuthFrame>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="font-mono text-[10px] uppercase tracking-[0.16em]">
        {label}
      </Label>
      {children}
    </div>
  );
}
