import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";

/** Password input with a show/hide toggle and an optional caps-lock warning. */
export function PasswordField({
  warnCaps = true,
  ...props
}: ComponentProps<typeof Input> & { warnCaps?: boolean }) {
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const track = (e: KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState("CapsLock"));
  return (
    <div>
      <div className="relative">
        <Input
          {...props}
          type={shown ? "text" : "password"}
          className={`rounded-none pr-11 ${props.className ?? ""}`}
          onKeyUp={track}
          onKeyDown={track}
          onBlur={(e) => {
            setCaps(false);
            props.onBlur?.(e);
          }}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-label={shown ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {shown ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {warnCaps && caps ? (
        <p role="status" className="mt-1.5 font-mono text-[11px]">
          Caps Lock is on.
        </p>
      ) : null}
    </div>
  );
}

/** Rough, transparent strength estimate: length and character variety, with common-pattern penalties. */
export function passwordStrength(pw: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  hint: string;
} {
  if (!pw) return { score: 0, label: "Empty", hint: "Use at least 8 characters." };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  if (/^(.)\1+$/.test(pw) || /^(password|12345678|qwerty|vuka)/i.test(pw)) s = Math.min(s, 1);
  if (pw.length < 8) s = 0;
  const score = Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
  const label = ["Too short", "Weak", "Fair", "Good", "Strong"][score]!;
  const hint =
    pw.length < 8
      ? "Use at least 8 characters."
      : score < 3
        ? "Add length (12+), mixed case, a digit and a symbol."
        : "Good. A passphrase of several words is easy to remember and hard to guess.";
  return { score, label, hint };
}

export function StrengthMeter({ password }: { password: string }) {
  const { score, label, hint } = passwordStrength(password);
  return (
    <div aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 border border-foreground ${n <= score ? "bg-foreground" : ""}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        <span className="font-mono uppercase tracking-[0.12em] text-foreground">{label}</span> ·{" "}
        {hint}
      </p>
    </div>
  );
}
