/**
 * Live data for the dashboard (the cloned shadcn-fintech widgets).
 *
 * Every dashboard widget was written against the shapes in `src/data/seed.ts`. This provider
 * answers those same shapes from the VUKA engine, so the widgets keep their layout and options
 * and only their numbers change:
 *
 *   wallets / balances      GET /api/users/{id}/accounts, GET /api/accounts/{id}/balance
 *   transactions/transfers  GET /api/users/{id}/transfers
 *   charts, heatmap, flows  GET /api/trader/analytics?days=365   (operators: /api/operator/analytics)
 *   monthly limit           GET /api/trader/limits               (KYC tier, USD-equivalent)
 *   health score            GET /api/trader/trust-score
 *   notifications           GET /api/notifications  (+ POST /api/notifications/{id}/read)
 *   support tickets         GET /api/support/tickets (+ POST to open one)
 *   wallet providers        GET /api/config/public
 *
 * Anything the engine has no concept of (cards, crypto prices, investments, budgets, savings
 * goals) keeps the illustrative VUKA content from `seed.ts`; `isLive(key)` tells a widget which
 * case it is in. Amounts from the ledger are shown in the wallet's own currency; analytics are
 * the engine's USD-equivalents at its reference rates.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { invoices, ledger, operator, platform, support } from "@/lib/api/endpoints";
import type {
  AnalyticsReport,
  Notification as EngineNotification,
  SupportTicket as EngineTicket,
  Transfer,
  TrustResult,
} from "@/lib/api/types";
import { relativeTime } from "@/lib/format";
import { useSession } from "@/lib/session";
import { accountLabel, directionFor, useWallet, type Wallet } from "@/lib/trader-data";
import * as seed from "@/data/seed";

// ---- Shape of everything the dashboard reads -------------------------------------------------

export interface DashboardData {
  contacts: seed.Contact[];
  accountCards: seed.AccountCard[];
  walletBalance: typeof seed.walletBalance;
  spendingLimit: typeof seed.spendingLimit;
  financialOverview: typeof seed.financialOverview;
  moneyMovementByPeriod: typeof seed.moneyMovementByPeriod;
  recentTransactions: seed.Transaction[];
  fullTransactions: seed.FullTransaction[];
  cardsData: seed.CardData[];
  spendingHeatmapData: seed.SpendingHeatmapDay[];
  categoryBreakdowns: seed.CategoryBreakdown[];
  recurringCharges: seed.RecurringCharge[];
  monthComparisons: seed.MonthComparison[];
  aiInsights: seed.AiInsight[];
  holdings: seed.Holding[];
  watchlistItems: seed.WatchlistItem[];
  portfolioHistory: seed.PortfolioHistoryPoint[];
  budgetCategories: seed.BudgetCategory[];
  savingsGoals: seed.SavingsGoal[];
  dailySpending: seed.DailySpending[];
  bankAccounts: seed.BankAccount[];
  transferRecords: seed.TransferRecord[];
  notifications: seed.Notification[];
  cryptoCoins: seed.CryptoCoin[];
  financialHealthScore: typeof seed.financialHealthScore & { rawScore?: number; band?: string };
  faqItems: seed.FaqItem[];
  supportTickets: seed.SupportTicket[];
  systemStatus: typeof seed.systemStatus;
}

export type DataKey = keyof DashboardData;

export interface DashboardContextValue extends DashboardData {
  /** "trader" / "operator" when signed in, otherwise "demo". */
  mode: "trader" | "operator" | "demo";
  /** True when `key` is answered by the engine rather than the illustrative seed. */
  isLive: (key: DataKey) => boolean;
  /** True while the first engine responses for a signed-in user are still loading. */
  loading: boolean;
  /** The signed-in identity for the sidebar user menu. */
  user: { name: string; email: string; avatar: string; initials: string };
  /** Marks an engine notification read (no-op for demo items). */
  markNotificationRead: (id: string) => void;
  /** Opens a support ticket on the engine; resolves to false when not signed in as a trader. */
  createTicket: (input: { subject: string; description: string; priority: string }) => Promise<boolean>;
}

const SEED: DashboardData = {
  contacts: seed.contacts,
  accountCards: seed.accountCards,
  walletBalance: seed.walletBalance,
  spendingLimit: seed.spendingLimit,
  financialOverview: seed.financialOverview,
  moneyMovementByPeriod: seed.moneyMovementByPeriod,
  recentTransactions: seed.recentTransactions,
  fullTransactions: seed.fullTransactions,
  cardsData: seed.cardsData,
  spendingHeatmapData: seed.spendingHeatmapData,
  categoryBreakdowns: seed.categoryBreakdowns,
  recurringCharges: seed.recurringCharges,
  monthComparisons: seed.monthComparisons,
  aiInsights: seed.aiInsights,
  holdings: seed.holdings,
  watchlistItems: seed.watchlistItems,
  portfolioHistory: seed.portfolioHistory,
  budgetCategories: seed.budgetCategories,
  savingsGoals: seed.savingsGoals,
  dailySpending: seed.dailySpending,
  bankAccounts: seed.bankAccounts,
  transferRecords: seed.transferRecords,
  notifications: seed.notifications,
  cryptoCoins: seed.cryptoCoins,
  financialHealthScore: seed.financialHealthScore,
  faqItems: seed.faqItems,
  supportTickets: seed.supportTickets,
  systemStatus: seed.systemStatus,
};

const DEMO_USER = { name: "VUKA demo", email: "sandbox", avatar: "", initials: "VK" };

const DashboardContext = createContext<DashboardContextValue | null>(null);

// ---- Formatting helpers -----------------------------------------------------------------------

const ZERO_DECIMALS = new Set(["RWF", "UGX", "TZS", "BIF", "XOF", "XAF"]);

/** "$1,234.50" for USD (or no currency), "RWF 250,000" otherwise. */
export function formatMoney(n: number, currency?: string, opts: { signed?: boolean } = {}): string {
  const cur = (currency ?? "USD").trim();
  const d = ZERO_DECIMALS.has(cur) ? 0 : 2;
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const sign = opts.signed ? (n < 0 ? "-" : "+") : n < 0 ? "-" : "";
  return cur === "USD" || cur === "$" ? `${sign}$${abs}` : `${sign}${cur} ${abs}`;
}

/** Axis label for USD charts that stays readable from $40 to $400k. */
export function compactUsd(v: number): string {
  const a = Math.abs(v)
  if (a >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (a >= 10_000) return `$${(v / 1000).toFixed(0)}k`
  if (a >= 1000) return `$${(v / 1000).toFixed(1)}k`
  return `$${Math.round(v)}`
}

/** The currency most rows are in — summary tiles total only those rows instead of mixing currencies. */
export function dominantCurrency(rows: { currency?: string }[]): string {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const c = (r.currency ?? "USD").trim()
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD"
}

const dateLabel = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : format(d, "MMM dd, yyyy");
};
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "V";
const ymKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const round = (n: number) => Math.round(n * 100) / 100;

// ---- Transfers -> transaction rows ------------------------------------------------------------

interface Booked {
  t: Transfer;
  dir: "in" | "out" | "internal";
  /** Amount in the trader's home currency (cross-border credits converted at the locked rate). */
  home: number;
  currency: string;
  topUp: boolean;
  crossBorder: boolean;
}

const TOP_UP = /fund|top.?up|float|cash.?in/i;

function book(transfers: Transfer[], wallet: Wallet, home: string): Booked[] {
  const own = new Set(wallet.accounts.map((a) => a.id));
  return transfers
    .map((t) => {
      const dir = directionFor(t, own);
      const foreign = t.currency !== home;
      const crossBorder = foreign || (t.fx_rate !== undefined && t.fx_rate !== 1);
      const topUp = dir === "in" && !t.invoice_number && TOP_UP.test(`${t.external_reference ?? ""} ${t.idempotency_key}`);
      // Ledger convention: destination amount = source amount / rate, so an incoming foreign
      // payment is shown as what actually landed in the trader's home-currency wallet.
      if (dir === "in" && foreign && t.fx_rate) return { t, dir, home: t.amount / t.fx_rate, currency: home, topUp, crossBorder };
      return { t, dir, home: t.amount, currency: foreign ? t.currency : home, topUp, crossBorder };
    })
    .sort((a, b) => b.t.created_at.localeCompare(a.t.created_at));
}

function describe(b: Booked): { merchant: string; category: string; info: string } {
  const tail = (id: string) => id.slice(-4);
  const other = b.dir === "out" ? b.t.destination_account_id : b.t.source_account_id;
  if (b.dir === "internal") return { merchant: "Transfer between own wallets", category: "Internal", info: "Personal ↔ business wallet" };
  if (b.topUp) return { merchant: "Wallet top-up", category: "Cash-in", info: "Funded from a settlement account" };
  if (b.t.status === "REVERSED") return { merchant: `Reversal${b.t.invoice_number ? ` — ${b.t.invoice_number}` : ""}`, category: "Reversal", info: b.t.failure_reason ?? "Reversed by an operator" };
  const who = b.dir === "out" ? `Payment to wallet …${tail(other)}` : `Payment from wallet …${tail(other)}`;
  const merchant = b.t.invoice_number ? `Invoice ${b.t.invoice_number}` : who;
  const category = b.crossBorder ? "Cross-border" : b.t.invoice_number ? "Invoice" : "Domestic";
  const info = `${who}${b.crossBorder && b.t.fx_rate ? ` · locked rate ${b.t.fx_rate}` : ""}`;
  return { merchant, category, info };
}

function toFullTransaction(b: Booked): seed.FullTransaction {
  const { merchant, category, info } = describe(b);
  const sign = b.dir === "out" ? -1 : 1;
  const status: seed.FullTransaction["status"] =
    b.t.status === "SUCCESS" ? "completed" : b.t.status === "PENDING" || b.t.status === "PROCESSING" ? "pending" : "failed";
  const ownAccount = b.dir === "out" ? b.t.source_account_id : b.t.destination_account_id;
  return {
    id: b.t.id,
    merchant,
    transactionId: b.t.invoice_number ?? `TX-${b.t.id.slice(0, 8).toUpperCase()}`,
    amount: sign * b.home,
    currency: b.currency,
    date: dateLabel(b.t.created_at),
    logo: seed.logo(merchant),
    category,
    status,
    type: sign < 0 ? "expense" : "income",
    notes: b.t.failure_reason ?? (b.t.status === "REVERSED" ? "Reversed" : undefined),
    merchantInfo: info,
    cardLast4: ownAccount.slice(-4),
  };
}

// ---- Analytics -> chart series ----------------------------------------------------------------

function overviewFromDaily(r: AnalyticsReport): DashboardData["financialOverview"] {
  const now = new Date();
  const sums = new Map<string, number>();
  for (const d of r.daily) {
    const k = ymKey(new Date(`${d.date}T00:00:00`));
    sums.set(k, (sums.get(k) ?? 0) + d.out_usd + d.in_usd);
  }
  return MONTHS.map((month, m) => ({
    month,
    currentYear: round(sums.get(`${now.getFullYear()}-${m}`) ?? 0),
    lastYear: round(sums.get(`${now.getFullYear() - 1}-${m}`) ?? 0),
  }));
}

function movementFromDaily(r: AnalyticsReport): DashboardData["moneyMovementByPeriod"] {
  const daily = r.daily;
  const last = (n: number) => daily.slice(-n);
  const d7 = last(7).map((d) => ({
    label: format(new Date(`${d.date}T00:00:00`), "EEE"),
    moneyIn: round(d.in_usd),
    moneyOut: round(d.out_usd),
  }));
  const d28 = last(28);
  const d30 = [0, 1, 2, 3].map((w) => {
    const chunk = d28.slice(w * 7, w * 7 + 7);
    return {
      label: `Week ${w + 1}`,
      moneyIn: round(chunk.reduce((s, d) => s + d.in_usd, 0)),
      moneyOut: round(chunk.reduce((s, d) => s + d.out_usd, 0)),
    };
  });
  const byMonth = new Map<string, { label: string; moneyIn: number; moneyOut: number }>();
  for (const d of last(90)) {
    const date = new Date(`${d.date}T00:00:00`);
    const k = ymKey(date);
    const row = byMonth.get(k) ?? { label: MONTHS[date.getMonth()]!, moneyIn: 0, moneyOut: 0 };
    row.moneyIn = round(row.moneyIn + d.in_usd);
    row.moneyOut = round(row.moneyOut + d.out_usd);
    byMonth.set(k, row);
  }
  return { "7d": d7, "30d": d30, "90d": [...byMonth.values()] };
}

function monthTotals(r: AnalyticsReport, offset: number) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const k = ymKey(target);
  let out = 0;
  let inn = 0;
  let count = 0;
  let failed = 0;
  for (const d of r.daily) {
    if (ymKey(new Date(`${d.date}T00:00:00`)) !== k) continue;
    out += d.out_usd;
    inn += d.in_usd;
    count += d.count;
    failed += d.failed;
  }
  return { out: round(out), in: round(inn), count, failed };
}

function insightsFrom(
  r: AnalyticsReport,
  standing: DashboardData["spendingLimit"] | null,
  trust: TrustResult | null,
  openInvoices: number,
): seed.AiInsight[] {
  const out: seed.AiInsight[] = [];
  const thisM = monthTotals(r, 0);
  const lastM = monthTotals(r, 1);
  const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : 0);
  const sentChange = pct(thisM.out, lastM.out);
  out.push({
    id: "live-sent",
    text: `You sent ${formatMoney(thisM.out)} this month (USD-equivalent) versus ${formatMoney(lastM.out)} last month.`,
    trend: sentChange > 0 ? "up" : sentChange < 0 ? "down" : "neutral",
    percentChange: Math.abs(sentChange),
    category: "Volume",
  });
  const top = [...r.corridors].sort((a, b) => b.volume_usd - a.volume_usd)[0];
  if (top) {
    out.push({
      id: "live-corridor",
      text: `${top.from} → ${top.to} is your busiest corridor: ${top.count} payments worth ${formatMoney(top.volume_usd)} in the last ${r.period_days} days.`,
      trend: "neutral",
      percentChange: 0,
      category: "Corridors",
    });
  }
  out.push({
    id: "live-reliability",
    text: `${Math.round(r.totals.success_rate * 100)}% of your finished payments settled; ${r.totals.failed} failed and ${r.totals.reversed} were reversed.`,
    trend: r.totals.success_rate >= 0.9 ? "up" : "neutral",
    percentChange: Math.round(r.totals.success_rate * 100),
    category: "Reliability",
  });
  if (standing && standing.budget > 0) {
    const used = Math.round((standing.spent / standing.budget) * 100);
    out.push({
      id: "live-limit",
      text: `You have used ${used}% of this month's ${standing.tier} limit (${formatMoney(standing.budget)}). Verification evidence raises your tier.`,
      trend: used >= 75 ? "up" : "neutral",
      percentChange: used,
      category: "Limits",
    });
  }
  if (trust) {
    out.push({
      id: "live-trust",
      text: `Trust score ${trust.score} (band ${trust.band}) from ${trust.cycles_scored} settlement cycles${openInvoices ? ` — ${openInvoices} open invoice${openInvoices === 1 ? "" : "s"} can lift it further` : ""}.`,
      trend: "neutral",
      percentChange: 0,
      category: "Trust score",
    });
  }
  return out;
}

const factorStatus = (v: number): seed.HealthFactor["status"] =>
  v >= 80 ? "excellent" : v >= 60 ? "good" : v >= 40 ? "fair" : "poor";

function healthFrom(trust: TrustResult): DashboardData["financialHealthScore"] {
  const overall = Math.max(0, Math.min(100, Math.round(((trust.score - 300) / 550) * 100)));
  return {
    overall,
    trend: "up",
    trendDelta: 0,
    rawScore: trust.score,
    band: trust.band,
    factors: trust.factors.map((f, i) => ({
      id: `hf${(i % 6) + 1}`,
      label: f.label,
      score: Math.round(f.value),
      maxScore: 100,
      status: factorStatus(f.value),
      description: `${f.detail} (weight ${f.weight}%${f.confidence < 1 ? `, confidence ${Math.round(f.confidence * 100)}%` : ""})`,
    })),
  };
}

function notificationFrom(n: EngineNotification): seed.Notification {
  const t = `${n.type} ${n.severity}`.toLowerCase();
  const type: seed.Notification["type"] =
    /secur|login|sign|password|kyc|sanction/.test(t)
      ? "security"
      : /pay|transfer|invoice|escrow|payout|collect|workflow|fund/.test(t)
        ? "transaction"
        : /promo|offer/.test(t)
          ? "promotion"
          : "system";
  const icon =
    type === "security" ? "shield-alert" : /fail|error|critical|warn/.test(t) ? "alert-triangle" : type === "transaction" ? "check-circle" : "file-text";
  return { id: n.id, type, title: n.title, description: n.body, time: relativeTime(n.created_at), read: Boolean(n.read_at), icon };
}

function ticketFrom(t: EngineTicket): seed.SupportTicket {
  const p = t.priority.toLowerCase();
  return {
    id: t.id,
    subject: t.subject,
    status: t.status === "closed" ? "resolved" : t.status === "pending" ? "in-progress" : "open",
    priority: p === "low" ? "low" : p === "high" || p === "urgent" || p === "critical" ? "high" : "medium",
    createdAt: dateLabel(t.created_at),
    lastUpdate: dateLabel(t.updated_at),
  };
}

// ---- Provider ---------------------------------------------------------------------------------

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  if (session.status === "trader") return <TraderData>{children}</TraderData>;
  if (session.status === "operator") return <OperatorData>{children}</OperatorData>;
  return <Static value={demoValue()}>{children}</Static>;
}

function Static({ value, children }: { value: DashboardContextValue; children: ReactNode }) {
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

function demoValue(): DashboardContextValue {
  return {
    ...SEED,
    mode: "demo",
    isLive: () => false,
    loading: false,
    user: DEMO_USER,
    markNotificationRead: () => undefined,
    createTicket: async () => false,
  };
}

function OperatorData({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const analytics = useQuery({
    queryKey: ["dashboard", "operator-analytics", 365],
    queryFn: () => operator.analytics(365),
    staleTime: 60_000,
  });
  const email = session.status === "operator" ? session.operator.email : "";
  const role = session.status === "operator" ? session.operator.role : "";
  const value = useMemo<DashboardContextValue>(() => {
    const r = analytics.data;
    const live = new Set<DataKey>(["notifications"]);
    // Operators have no trader inbox; their alerts live in the cockpit.
    const data: DashboardData = { ...SEED, notifications: [] };
    if (r) {
      data.financialOverview = overviewFromDaily(r);
      data.moneyMovementByPeriod = movementFromDaily(r);
      data.spendingHeatmapData = r.daily.map((d) => ({ date: d.date, amount: round(d.out_usd) }));
      data.categoryBreakdowns = corridorBreakdown(r);
      data.monthComparisons = comparisonFrom(r);
      data.aiInsights = insightsFrom(r, null, null, 0);
      for (const k of ["financialOverview", "moneyMovementByPeriod", "spendingHeatmapData", "categoryBreakdowns", "monthComparisons", "aiInsights"] as DataKey[]) live.add(k);
    }
    return {
      ...data,
      mode: "operator",
      isLive: (k) => live.has(k),
      loading: analytics.isPending,
      user: { name: `${role || "operator"} console`, email, avatar: "", initials: initialsOf(email.split("@")[0] ?? "OP") },
      markNotificationRead: () => undefined,
      createTicket: async () => false,
    };
  }, [analytics.data, analytics.isPending, email, role]);
  return <Static value={value}>{children}</Static>;
}

function corridorBreakdown(r: AnalyticsReport): seed.CategoryBreakdown[] {
  const colors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];
  return [...r.corridors]
    .sort((a, b) => b.volume_usd - a.volume_usd)
    .map((c, i) => ({
      category: `${c.from} → ${c.to}`,
      amount: round(c.volume_usd),
      color: colors[i % colors.length]!,
      subcategories: [{ name: `${c.count} payment${c.count === 1 ? "" : "s"}`, amount: round(c.volume_usd) }],
    }));
}

function comparisonFrom(r: AnalyticsReport): seed.MonthComparison[] {
  const a = monthTotals(r, 0);
  const b = monthTotals(r, 1);
  return [
    { category: "Sent", thisMonth: a.out, lastMonth: b.out },
    { category: "Received", thisMonth: a.in, lastMonth: b.in },
    { category: "Total volume", thisMonth: round(a.out + a.in), lastMonth: round(b.out + b.in) },
  ];
}

function TraderData({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const trader = session.status === "trader" ? session.trader : null;
  const traderId = trader?.id ?? "";
  const qc = useQueryClient();

  const wallet = useWallet();
  const transfers = useQuery({ queryKey: ["transfers", traderId, {}], queryFn: () => ledger.transfers(traderId) });
  const analytics = useQuery({ queryKey: ["dashboard", "analytics", traderId, 365], queryFn: () => platform.analytics(365), staleTime: 60_000 });
  const standing = useQuery({ queryKey: ["dashboard", "standing", traderId], queryFn: platform.standing, staleTime: 60_000 });
  const trust = useQuery({ queryKey: ["dashboard", "trust", traderId], queryFn: platform.trust, staleTime: 60_000 });
  const notes = useQuery({ queryKey: ["notifications", traderId], queryFn: () => support.notifications(), refetchInterval: 30_000 });
  const tickets = useQuery({ queryKey: ["dashboard", "tickets", traderId], queryFn: () => support.tickets() });
  const invoiceList = useQuery({ queryKey: ["invoices", traderId, "all"], queryFn: () => invoices.list(traderId) });
  const config = useQuery({ queryKey: ["public-config"], queryFn: platform.config, staleTime: 300_000 });

  const markRead = useMutation({
    mutationFn: (id: string) => support.markRead(id, traderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", traderId] }),
  });
  const markNotificationRead = useCallback(
    (id: string) => {
      if (notes.data?.some((n) => n.id === id)) markRead.mutate(id);
    },
    [notes.data, markRead],
  );
  const createTicket = useCallback(
    async (input: { subject: string; description: string; priority: string }) => {
      await support.createTicket(input);
      await qc.invalidateQueries({ queryKey: ["dashboard", "tickets", traderId] });
      return true;
    },
    [qc, traderId],
  );

  const value = useMemo<DashboardContextValue>(() => {
    const live = new Set<DataKey>();
    const data: DashboardData = { ...SEED };
    const mark = (...keys: DataKey[]) => keys.forEach((k) => live.add(k));

    const w = wallet.data;
    const accounts = w?.accounts ?? [];
    const home = accounts.find((a) => a.type === "BUSINESS")?.currency ?? accounts[0]?.currency ?? "RWF";
    const provider = (cur: string) =>
      config.data?.countries.find((c) => c.currency === cur)?.provider_name ?? "VUKA ledger";
    const booked = w && transfers.data ? book(transfers.data, w, home) : null;
    const now = new Date();
    const thisMonth = ymKey(now);

    if (w) {
      const styles: seed.AccountCard["variant"][] = ["default", "dark", "primary"];
      data.accountCards = accounts.map((a, i) => ({
        id: a.id,
        label: accountLabel(a),
        balance: formatMoney(w.balances[a.id]?.amount ?? 0, a.currency).replace(/^[A-Z]+ /, ""),
        currency: `${a.currency} `,
        variant: styles[i % styles.length]!,
      }));
      const total = accounts.filter((a) => a.currency === home).reduce((s, a) => s + (w.balances[a.id]?.amount ?? 0), 0);
      let net = 0;
      if (booked) for (const b of booked) if (b.t.status === "SUCCESS" && b.dir !== "internal" && ymKey(new Date(b.t.created_at)) === thisMonth && b.currency === home) net += b.dir === "in" ? b.home : -b.home;
      const base = total - net;
      const change = base > 0 ? Math.round((net / base) * 1000) / 10 : 0;
      data.walletBalance = { amount: total, currency: home, changePercent: Math.abs(change), changeDirection: change < 0 ? "down" : "up" };
      mark("accountCards", "walletBalance");

      const colors = ["bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-violet-500", "bg-pink-500", "bg-cyan-500"];
      data.bankAccounts = accounts.map((a, i) => {
        const mine = booked?.filter((b) => b.t.source_account_id === a.id || b.t.destination_account_id === a.id) ?? [];
        let accNet = 0;
        for (const b of mine) {
          if (b.t.status !== "SUCCESS" || ymKey(new Date(b.t.created_at)) !== thisMonth) continue;
          if (b.currency !== a.currency) continue;
          accNet += b.t.destination_account_id === a.id ? b.home : -b.home;
        }
        const bal = w.balances[a.id]?.amount ?? 0;
        const prior = bal - accNet;
        return {
          id: a.id,
          name: accountLabel(a),
          type: a.type === "BUSINESS" ? "checking" : a.type === "PERSONAL" ? "savings" : "investment",
          institution: `VUKA ledger · ${provider(a.currency)}`,
          institutionLogo: seed.logo(`VUKA ${a.type}`),
          accountNumber: `****${a.id.slice(-4)}`,
          balance: bal,
          currency: `${a.currency} `,
          change: accNet,
          changePercent: prior > 0 ? Math.round((accNet / prior) * 1000) / 10 : 0,
          lastActivity: mine[0] ? relativeTime(mine[0].t.created_at) : "No activity yet",
          color: colors[i % colors.length]!,
        } satisfies seed.BankAccount;
      });
      mark("bankAccounts");
    }

    if (booked) {
      const rows = booked.map(toFullTransaction);
      data.fullTransactions = rows;
      data.recentTransactions = rows.slice(0, 7).map(({ id, merchant, transactionId, amount, currency, date, logo, category }) => ({
        id, merchant, transactionId, amount, currency, date, logo, category,
      }));
      data.transferRecords = booked
        .filter((b) => b.dir !== "internal" && !b.topUp && (b.t.status === "SUCCESS" || b.t.status === "PENDING" || b.t.status === "PROCESSING"))
        .map((b) => {
          const d = describe(b);
          const name = d.merchant.startsWith("Invoice") ? d.info : d.merchant;
          return {
            id: b.t.id,
            type: b.dir === "out" ? "sent" : "received",
            contactName: name,
            contactAvatar: seed.logo(name),
            amount: b.home,
            currency: b.currency,
            date: dateLabel(b.t.created_at),
            status: b.t.status === "SUCCESS" ? "completed" : "pending",
            note: b.t.invoice_number ? `Invoice ${b.t.invoice_number}` : d.category,
          } satisfies seed.TransferRecord;
        });
      mark("fullTransactions", "recentTransactions", "transferRecords");
    }

    let limit: DashboardData["spendingLimit"] | null = null;
    if (standing.data) {
      const s = standing.data;
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      limit = {
        budget: s.limits.monthly_usd,
        spent: round(s.used_month_usd),
        remaining: round(Math.max(0, s.limits.monthly_usd - s.used_month_usd)),
        currency: "USD",
        periodStart: format(start, "MMM dd"),
        periodEnd: format(end, "MMM dd"),
        tier: s.kyc_status,
      };
      data.spendingLimit = limit;
      mark("spendingLimit");
    }

    if (trust.data) {
      data.financialHealthScore = healthFrom(trust.data);
      mark("financialHealthScore");
    }

    const r = analytics.data;
    if (r) {
      data.financialOverview = overviewFromDaily(r);
      data.moneyMovementByPeriod = movementFromDaily(r);
      data.spendingHeatmapData = r.daily.map((d) => ({ date: d.date, amount: round(d.out_usd) }));
      data.categoryBreakdowns = corridorBreakdown(r);
      data.monthComparisons = comparisonFrom(r);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const byDate = new Map(r.daily.map((d) => [d.date, d.out_usd]));
      data.dailySpending = Array.from({ length: daysInMonth }, (_, i) => {
        const key = format(new Date(now.getFullYear(), now.getMonth(), i + 1), "yyyy-MM-dd");
        return { date: key, amount: round(byDate.get(key) ?? 0) };
      });
      const openInvoices = (invoiceList.data ?? []).filter((i) => i.status !== "PAID").length;
      data.aiInsights = insightsFrom(r, limit, trust.data ?? null, openInvoices);
      data.contacts = (r.counterparties ?? []).map((c) => ({ id: c.name, name: c.name, avatar: seed.logo(c.name) }));
      mark("financialOverview", "moneyMovementByPeriod", "spendingHeatmapData", "categoryBreakdowns", "monthComparisons", "dailySpending", "aiInsights", "contacts");
    }

    if (notes.data) {
      data.notifications = notes.data.map(notificationFrom);
      mark("notifications");
    }
    if (tickets.data) {
      data.supportTickets = tickets.data.map(ticketFrom);
      mark("supportTickets");
    }

    return {
      ...data,
      mode: "trader",
      isLive: (k) => live.has(k),
      loading: wallet.isPending || transfers.isPending,
      user: {
        name: trader?.full_name ?? "Trader",
        email: trader?.phone_number ?? "",
        avatar: "",
        initials: initialsOf(trader?.full_name ?? "Trader"),
      },
      markNotificationRead,
      createTicket,
    };
  }, [
    wallet.data, wallet.isPending, transfers.data, transfers.isPending, analytics.data, standing.data,
    trust.data, notes.data, tickets.data, invoiceList.data, config.data, trader, markNotificationRead, createTicket,
  ]);

  return <Static value={value}>{children}</Static>;
}

/** Everything a dashboard widget reads. Outside the provider it returns the illustrative seed. */
export function useDashboardData(): DashboardContextValue {
  return useContext(DashboardContext) ?? demoValue();
}
