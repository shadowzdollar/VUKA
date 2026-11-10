import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { pickLang, useI18n, useLangCopy, type Lang } from "@/lib/i18n";

const COPY: Record<
  Lang,
  {
    hidePassword: string;
    showPassword: string;
    capsLock: string;
    empty: string;
    levels: readonly [string, string, string, string, string];
    hintShort: string;
    hintMedium: string;
    hintStrong: string;
  }
> = {
  en: {
    hidePassword: "Hide password",
    showPassword: "Show password",
    capsLock: "Caps Lock is on.",
    empty: "Empty",
    levels: ["Too short", "Weak", "Fair", "Good", "Strong"],
    hintShort: "Use at least 8 characters.",
    hintMedium: "Add length (12+), mixed case, a digit and a symbol.",
    hintStrong: "Good. A passphrase of several words is easy to remember and hard to guess.",
  },
  fr: {
    hidePassword: "Masquer le mot de passe",
    showPassword: "Afficher le mot de passe",
    capsLock: "Verr. Maj est activé.",
    empty: "Vide",
    levels: ["Trop court", "Faible", "Moyen", "Bon", "Fort"],
    hintShort: "Utilisez au moins 8 caractères.",
    hintMedium: "Ajoutez de la longueur (12+), majuscules/minuscules, un chiffre et un symbole.",
    hintStrong: "Bon. Une phrase secrète de plusieurs mots est facile à retenir et difficile à deviner.",
  },
  sw: {
    hidePassword: "Ficha nenosiri",
    showPassword: "Onyesha nenosiri",
    capsLock: "Caps Lock imewashwa.",
    empty: "Tupu",
    levels: ["Fupi mno", "Dhaifu", "Wastani", "Nzuri", "Imara"],
    hintShort: "Tumia angalau herufi 8.",
    hintMedium: "Ongeza urefu (12+), herufi kubwa na ndogo, nambari na alama.",
    hintStrong: "Nzuri. Maneno kadhaa ni rahisi kukumbuka na magumu kukisia.",
  },
  pt: {
    hidePassword: "Ocultar palavra-passe",
    showPassword: "Mostrar palavra-passe",
    capsLock: "Caps Lock está ativado.",
    empty: "Vazio",
    levels: ["Muito curta", "Fraca", "Razoável", "Boa", "Forte"],
    hintShort: "Use pelo menos 8 caracteres.",
    hintMedium: "Adicione comprimento (12+), maiúsculas/minúsculas, um dígito e um símbolo.",
    hintStrong: "Boa. Uma frase-passe com várias palavras é fácil de lembrar e difícil de adivinhar.",
  },
  rw: {
    hidePassword: "Hisha ijambo ry'ibanga",
    showPassword: "Erekana ijambo ry'ibanga",
    capsLock: "Caps Lock irafunguye.",
    empty: "Nta kintu",
    levels: ["Rigufi cyane", "Ryoroshye", "Riringaniye", "Ryiza", "Rikomeye"],
    hintShort: "Koresha nibura inyuguti 8.",
    hintMedium: "Ongeraho uburebure (12+), inyuguti nkuru n'into, umubare n'ikimenyetso.",
    hintStrong: "Ryiza. Interuro y'amagambo menshi yoroha kwibuka kandi igora gufora.",
  },
};

/** Password input with a show/hide toggle and an optional caps-lock warning. */
export function PasswordField({
  warnCaps = true,
  ...props
}: ComponentProps<typeof Input> & { warnCaps?: boolean }) {
  const copy = useLangCopy(COPY);
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
          aria-label={shown ? copy.hidePassword : copy.showPassword}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-500 hover:text-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {shown ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {warnCaps && caps ? (
        <p role="status" className="mt-1.5 font-mono text-[11px] text-neutral-400">
          {copy.capsLock}
        </p>
      ) : null}
    </div>
  );
}

/** Rough, transparent strength estimate: length and character variety, with common-pattern penalties. */
export function passwordStrength(
  pw: string,
  lang: Lang = "en",
): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  hint: string;
} {
  const copy = pickLang(lang, COPY);
  if (!pw) return { score: 0, label: copy.empty, hint: copy.hintShort };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  if (/^(.)\1+$/.test(pw) || /^(password|12345678|qwerty|vuka)/i.test(pw)) s = Math.min(s, 1);
  if (pw.length < 8) s = 0;
  const score = Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
  const label = copy.levels[score]!;
  const hint =
    pw.length < 8 ? copy.hintShort : score < 3 ? copy.hintMedium : copy.hintStrong;
  return { score, label, hint };
}

export function StrengthMeter({ password }: { password: string }) {
  const { lang } = useI18n();
  const { score, label, hint } = passwordStrength(password, lang);
  return (
    <div aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 border border-neutral-600 ${n <= score ? "bg-neutral-100" : ""}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-neutral-500">
        <span className="font-mono uppercase tracking-[0.12em] text-neutral-100">{label}</span> ·{" "}
        {hint}
      </p>
    </div>
  );
}
