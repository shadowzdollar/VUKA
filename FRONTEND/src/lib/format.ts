/** Currencies the engine settles in and how many decimals each conventionally shows. */
const DECIMALS: Record<string, number> = { RWF: 0, UGX: 0, TZS: 0, KES: 2, USD: 2, USDC: 2 };

export function money(amount: number, currency?: string): string {
  const d = currency ? (DECIMALS[currency] ?? 2) : 2;
  const n = amount.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return currency ? `${currency} ${n}` : n;
}

/** Corridor quotes are integers in the minor unit (cents), independent of display decimals. */
export function fromMinor(minor: number): number {
  return minor / 100;
}

export function toMinor(major: number): number {
  return Math.round(major * 100);
}

export function when(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function day(iso?: string | null): string {
  return iso ? iso.slice(0, 10) : "—";
}

export function shortId(id?: string | null, n = 8): string {
  if (!id) return "—";
  return id.length > n ? id.slice(0, n) : id;
}

export function truncMid(value: string, head = 8, tail = 6): string {
  return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** Token base units (string) -> display units. VukaTestToken and USDC both use 6 decimals. */
export function tokenUnits(raw: string, decimals = 6): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n / 10 ** decimals : 0;
}

export function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, header: string[], rows: unknown[][]): void {
  const body = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
