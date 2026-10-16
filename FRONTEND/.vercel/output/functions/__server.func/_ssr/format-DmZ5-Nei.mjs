//#region node_modules/.nitro/vite/services/ssr/assets/format-DmZ5-Nei.js
/** Currencies the engine settles in and how many decimals each conventionally shows. */
var DECIMALS = {
	RWF: 0,
	UGX: 0,
	TZS: 0,
	KES: 2,
	USD: 2,
	USDC: 2
};
function money(amount, currency) {
	const d = currency ? DECIMALS[currency] ?? 2 : 2;
	const n = amount.toLocaleString("en-US", {
		minimumFractionDigits: d,
		maximumFractionDigits: d
	});
	return currency ? `${currency} ${n}` : n;
}
/** Corridor quotes are integers in the minor unit (cents), independent of display decimals. */
function fromMinor(minor) {
	return minor / 100;
}
function toMinor(major) {
	return Math.round(major * 100);
}
function when(iso) {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	const p = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function day(iso) {
	return iso ? iso.slice(0, 10) : "—";
}
/** "3m ago", "2h ago", "5d ago" — falls back to the absolute date past a week, so an old item
* doesn't read as a vague "52w ago". */
function relativeTime(iso) {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	const seconds = Math.round((Date.now() - d.getTime()) / 1e3);
	if (seconds < 0) return when(iso);
	if (seconds < 60) return "just now";
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	if (days < 7) return `${days}d ago`;
	return when(iso);
}
function shortId(id, n = 8) {
	if (!id) return "—";
	return id.length > n ? id.slice(0, n) : id;
}
function truncMid(value, head = 8, tail = 6) {
	return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}
/** Token base units (string) -> display units. VukaTestToken and USDC both use 6 decimals. */
function tokenUnits(raw, decimals = 6) {
	const n = Number(raw);
	return Number.isFinite(n) ? n / 10 ** decimals : 0;
}
function csvCell(v) {
	const s = v === null || v === void 0 ? "" : String(v);
	return /[",\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
}
function downloadCsv(filename, header, rows) {
	const body = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
	const url = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
//#endregion
export { relativeTime as a, tokenUnits as c, money as i, truncMid as l, downloadCsv as n, shortId as o, fromMinor as r, toMinor as s, day as t, when as u };
