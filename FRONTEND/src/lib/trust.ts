import type { Invoice, Transfer } from "@/lib/api/types";

/**
 * Deterministic trust score derived ONLY from a trader's own settlement history in the ledger.
 * The engine exposes no scoring endpoint, so this is computed in the client from transfers and
 * invoices. No identity, demographic or inferred-behaviour inputs are used.
 *
 * Not derivable from engine data today (and therefore not scored): mutual-release rate and
 * arbitration record — on-chain escrows are keyed by wallet address, not by trader.
 */
export interface ScoreFactor {
  key: string;
  label: string;
  weight: number; // percent; all weights sum to 100
  value: number; // 0..100
  detail: string;
  /** Fraction (0..1) of the evidence needed for the value to be fully trusted. */
  confidence: number;
}

export interface TrustResult {
  score: number; // 300..850
  band: string;
  factors: ScoreFactor[];
  cyclesScored: number;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const DAY = 86_400_000;

export function computeTrust(
  transfers: Transfer[],
  invoices: Invoice[],
  ownAccountIds: Set<string>,
  now = Date.now(),
): TrustResult {
  // Only money that moved between the trader and someone else counts as a settlement cycle;
  // top-ups (external cash-in) touch only one of the trader's accounts and are ignored.
  const trade = transfers.filter(
    (t) => ownAccountIds.has(t.source_account_id) !== ownAccountIds.has(t.destination_account_id),
  );
  const success = trade.filter((t) => t.status === "SUCCESS");
  const failed = trade.filter((t) => t.status === "FAILED");
  const reversed = trade.filter((t) => t.status === "REVERSED");
  const finished = success.length + failed.length + reversed.length;

  const cycles: ScoreFactor = {
    key: "cycles",
    label: "Completed settlement cycles",
    weight: 35,
    value: finished ? (100 * success.length) / finished : 0,
    detail: `${success.length} of ${finished} finished payments settled successfully.`,
    confidence: clamp((finished / 10) * 100, 0, 100) / 100,
  };

  const settledOrReversed = success.length + reversed.length;
  const reversals: ScoreFactor = {
    key: "reversals",
    label: "Reversal record",
    weight: 20,
    value: settledOrReversed ? 100 * (1 - reversed.length / settledOrReversed) : 0,
    detail: `${reversed.length} of ${settledOrReversed} settled payments were later reversed.`,
    confidence: clamp((settledOrReversed / 10) * 100, 0, 100) / 100,
  };

  const paid = invoices.filter((i) => i.status === "PAID").length;
  const invoiceFactor: ScoreFactor = {
    key: "invoices",
    label: "Invoice settlement",
    weight: 25,
    value: invoices.length ? (100 * paid) / invoices.length : 0,
    detail: `${paid} of ${invoices.length} invoices are fully paid.`,
    confidence: clamp((invoices.length / 5) * 100, 0, 100) / 100,
  };

  const inWindow = (t: Transfer, from: number, to: number) => {
    const at = new Date(t.created_at).getTime();
    return at >= from && at < to;
  };
  const recent = success.filter((t) => inWindow(t, now - 30 * DAY, now + DAY)).length;
  const prior = success.filter((t) => inWindow(t, now - 60 * DAY, now - 30 * DAY)).length;
  const growth: ScoreFactor = {
    key: "volume",
    label: "Volume progression",
    weight: 10,
    value:
      recent === 0 && prior === 0
        ? 0
        : prior === 0
          ? 70
          : clamp(50 + (50 * (recent - prior)) / prior),
    detail: `${recent} settled payments in the last 30 days vs ${prior} in the 30 days before.`,
    confidence: clamp(((recent + prior) / 4) * 100, 0, 100) / 100,
  };

  const counterparties = new Set(
    success.map((t) =>
      ownAccountIds.has(t.source_account_id) ? t.destination_account_id : t.source_account_id,
    ),
  );
  const diversity: ScoreFactor = {
    key: "diversity",
    label: "Counterparty diversity",
    weight: 10,
    value: clamp(counterparties.size * 20),
    detail: `${counterparties.size} distinct counterparty accounts across settled payments.`,
    confidence: clamp((success.length / 5) * 100, 0, 100) / 100,
  };

  const factors = [cycles, invoiceFactor, reversals, growth, diversity];
  // A factor backed by little evidence is pulled toward the neutral floor so that one lucky
  // payment cannot produce a top score.
  const weighted = factors.reduce((sum, f) => sum + f.weight * (f.value * f.confidence), 0);
  const score = Math.round(300 + (550 * weighted) / 10_000);

  const band =
    finished === 0
      ? "Unrated"
      : score >= 780
        ? "A"
        : score >= 700
          ? "B"
          : score >= 600
            ? "C"
            : score >= 500
              ? "D"
              : "E";
  return { score, band, factors, cyclesScored: finished };
}
