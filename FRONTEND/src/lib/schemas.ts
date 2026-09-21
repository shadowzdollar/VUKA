import { z } from "zod";

/** Normalises a typed phone number to E.164-ish form: keeps digits, one leading "+", drops spaces/dashes. */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits ? `+${digits}` : "";
}

/** International format required by the engine: + country code, 8–14 more digits. */
export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .refine(
    (v) => /^\+[1-9]\d{7,14}$/.test(v),
    "Enter the number in international format, e.g. +250700000000",
  );

/**
 * Parses a user-typed money amount without floating-point surprises: optional thousands
 * separators, at most `decimals` fractional digits, strictly positive, bounded.
 * Returns null when the text is not a valid amount.
 */
export function parseAmount(input: string, decimals = 2): number | null {
  const cleaned = input.trim().replace(/[,\s]/g, "");
  const re = new RegExp(`^\\d{1,12}(\\.\\d{1,${decimals}})?$`);
  if (!re.test(cleaned)) return null;
  const n = Number(cleaned);
  return n > 0 && Number.isFinite(n) ? n : null;
}

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Required"),
  password: z.string().min(1, "Required"),
});

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full or business name").max(150),
    phone_number: phoneSchema,
    business_reg_number: z.string().trim().max(100).optional(),
    password: z.string().min(8, "Use at least 8 characters").max(128),
    confirm: z.string(),
    currency: z.string().regex(/^[A-Z]{3}$/),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

/** Verification evidence must be a pointer, never content — mirrors the engine's policy. */
export const evidenceReferenceSchema = z
  .string()
  .trim()
  .max(160)
  .refine((v) => /^(provider|registry|case):\/\/\S+$|^hash:sha256:[0-9a-f]{64}$/i.test(v), {
    message: "Use provider://…, registry://…, case://… or a document hash",
  });

/** SHA-256 of a file, computed entirely in the browser — the document itself is never uploaded. */
export async function sha256File(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
