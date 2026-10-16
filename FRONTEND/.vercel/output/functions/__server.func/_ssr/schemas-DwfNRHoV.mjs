import { n as stringType, t as objectType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/schemas-DwfNRHoV.js
/** Normalises a typed phone number to E.164-ish form: keeps digits, one leading "+", drops spaces/dashes. */
function normalizePhone(input) {
	const digits = input.trim().replace(/[^\d]/g, "");
	return digits ? `+${digits}` : "";
}
/** International format required by the engine: + country code, 8–14 more digits. */
var phoneSchema = stringType().transform(normalizePhone).refine((v) => /^\+[1-9]\d{7,14}$/.test(v), "Enter the number in international format, e.g. +250700000000");
/**
* Parses a user-typed money amount without floating-point surprises: optional thousands
* separators, at most `decimals` fractional digits, strictly positive, bounded.
* Returns null when the text is not a valid amount.
*/
function parseAmount(input, decimals = 2) {
	const cleaned = input.trim().replace(/[,\s]/g, "");
	if (!new RegExp(`^\\d{1,12}(\\.\\d{1,${decimals}})?$`).test(cleaned)) return null;
	const n = Number(cleaned);
	return n > 0 && Number.isFinite(n) ? n : null;
}
objectType({
	identifier: stringType().trim().min(3, "Required"),
	password: stringType().min(1, "Required")
});
objectType({
	full_name: stringType().trim().min(2, "Enter your full or business name").max(150),
	phone_number: phoneSchema,
	business_reg_number: stringType().trim().max(100).optional(),
	password: stringType().min(8, "Use at least 8 characters").max(128),
	confirm: stringType(),
	currency: stringType().regex(/^[A-Z]{3}$/)
}).refine((v) => v.password === v.confirm, {
	path: ["confirm"],
	message: "Passwords do not match"
});
/** Verification evidence must be a pointer, never content — mirrors the engine's policy. */
var evidenceReferenceSchema = stringType().trim().max(160).refine((v) => /^(provider|registry|case):\/\/\S+$|^hash:sha256:[0-9a-f]{64}$/i.test(v), { message: "Use provider://…, registry://…, case://… or a document hash" });
/** SHA-256 of a file, computed entirely in the browser — the document itself is never uploaded. */
async function sha256File(file) {
	const buf = await file.arrayBuffer();
	const digest = await crypto.subtle.digest("SHA-256", buf);
	return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
//#endregion
export { parseAmount as n, sha256File as r, evidenceReferenceSchema as t };
