// ---------------------------------------------------------------------------
// VUKA dashboard demo content.
//
// Every widget of the dashboard renders from these shapes. When a trader is signed in,
// `src/lib/dashboard-data.tsx` replaces the parts the engine can answer (wallets, balances,
// transfers, invoices, analytics, KYC limits, trust score, notifications, support tickets)
// with live data in exactly these shapes; everything else stays as the illustrative VUKA
// sandbox content below. Nothing here is a real balance, rate, customer or partner endorsement.
// ---------------------------------------------------------------------------

// Avatar URLs (local)
const avatar = (id: number) => `/avatars/${id}.jpg`

// ── Logo helper ────────────────────────────────────────────────────────────
// VUKA has no third-party brand artwork: every counterparty, rail and asset gets a neutral
// monogram tile (inline SVG, so it works offline and in the PWA cache).
export const logo = (name: string) => {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean)
  const initials = (words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : (words[0] ?? "V").slice(0, 2)).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#262626"/><rect x="0.5" y="0.5" width="63" height="63" rx="13.5" fill="none" stroke="#3a3a3a"/><text x="32" y="40" text-anchor="middle" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="600" fill="#e5e5e5">${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// ── Contacts (Quick Transfer) — trade counterparties ──────────────────────
export type Contact = { id: string; name: string; avatar: string; phone?: string; city?: string }

export const contacts: Contact[] = [
  { id: "1", name: "Jean-Paul Niyonzima", avatar: avatar(3), phone: "+250700000773", city: "Kigali" },
  { id: "2", name: "Kethan Gasana", avatar: avatar(8), phone: "+254700000882", city: "Nairobi" },
  { id: "3", name: "Grace Nakato", avatar: avatar(1), phone: "+256700000514", city: "Kampala" },
  { id: "4", name: "Baraka Mushi", avatar: avatar(11), phone: "+255700000236", city: "Dar es Salaam" },
  { id: "5", name: "Amina Uwera", avatar: avatar(5), phone: "+250700000991", city: "Kigali" },
  { id: "6", name: "Chidi Okafor", avatar: avatar(12), phone: "+234700000318", city: "Lagos" },
  { id: "7", name: "Ama Mensah", avatar: avatar(9), phone: "+233700000427", city: "Accra" },
  { id: "8", name: "Thandiwe Dlamini", avatar: avatar(16), phone: "+27700000655", city: "Johannesburg" },
]

// ── Account Cards — VUKA wallets ──────────────────────────────────────────
export type AccountCard = {
  id: string
  label: string
  balance: string
  currency: string
  variant: "default" | "dark" | "primary"
}

export const accountCards: AccountCard[] = [
  { id: "1", label: "Business trade wallet", balance: "4,250,000", currency: "RWF ", variant: "default" },
  { id: "2", label: "Escrow (USDC · Polygon)", balance: "1,840.00", currency: "USDC", variant: "dark" },
  { id: "3", label: "Personal wallet", balance: "312,500", currency: "RWF ", variant: "primary" },
]

// ── Wallet Balance ─────────────────────────────────────────────────────────
export const walletBalance = {
  amount: 4562500,
  currency: "RWF",
  changePercent: 12.4,
  changeDirection: "up" as "up" | "down",
}

// ── Monthly limit (KYC tier, USD-equivalent, set by the engine) ────────────
export const spendingLimit = {
  budget: 2000,
  spent: 1480,
  remaining: 520,
  currency: "USD",
  periodStart: "Nov 01",
  periodEnd: "Nov 30",
  tier: "PENDING",
}

// ── Financial Overview — settled payment volume per month (USD-equivalent) ─
export const financialOverview = [
  { month: "Jan", currentYear: 4820, lastYear: 2210 },
  { month: "Feb", currentYear: 5180, lastYear: 2530 },
  { month: "Mar", currentYear: 5357, lastYear: 2890 },
  { month: "Apr", currentYear: 7240, lastYear: 3240 },
  { month: "May", currentYear: 6840, lastYear: 3610 },
  { month: "Jun", currentYear: 7560, lastYear: 3980 },
  { month: "Jul", currentYear: 8230, lastYear: 4150 },
  { month: "Aug", currentYear: 7890, lastYear: 4210 },
  { month: "Sep", currentYear: 8520, lastYear: 4540 },
  { month: "Oct", currentYear: 9180, lastYear: 4890 },
  { month: "Nov", currentYear: 9850, lastYear: 5230 },
  { month: "Dec", currentYear: 0, lastYear: 5850 },
]

// ── Money Movement (USD-equivalent) ────────────────────────────────────────
export type MovementPoint = { label: string; moneyIn: number; moneyOut: number }

export const moneyMovement7d: MovementPoint[] = [
  { label: "Sun", moneyIn: 120, moneyOut: 60 },
  { label: "Mon", moneyIn: 420, moneyOut: 310 },
  { label: "Tue", moneyIn: 380, moneyOut: 260 },
  { label: "Wed", moneyIn: 510, moneyOut: 412 },
  { label: "Thu", moneyIn: 460, moneyOut: 340 },
  { label: "Fri", moneyIn: 525, moneyOut: 402 },
  { label: "Sat", moneyIn: 190, moneyOut: 120 },
]

export const moneyMovement30d: MovementPoint[] = [
  { label: "Week 1", moneyIn: 1640, moneyOut: 1190 },
  { label: "Week 2", moneyIn: 1980, moneyOut: 1420 },
  { label: "Week 3", moneyIn: 1260, moneyOut: 940 },
  { label: "Week 4", moneyIn: 2320, moneyOut: 1750 },
]

export const moneyMovement90d: MovementPoint[] = [
  { label: "Sep", moneyIn: 5420, moneyOut: 3980 },
  { label: "Oct", moneyIn: 6180, moneyOut: 4410 },
  { label: "Nov", moneyIn: 7020, moneyOut: 5230 },
]

export const moneyMovementByPeriod: Record<"7d" | "30d" | "90d", MovementPoint[]> = {
  "7d": moneyMovement7d,
  "30d": moneyMovement30d,
  "90d": moneyMovement90d,
}

// ── Recent Transactions ────────────────────────────────────────────────────
export type Transaction = {
  id: string
  merchant: string
  transactionId: string
  amount: number
  /** ISO 4217 code (or USDC). Absent means USD. */
  currency?: string
  date: string
  logo: string
  category: string
}

export const recentTransactions: Transaction[] = [
  { id: "1", merchant: "Kethan Gasana · Nairobi", transactionId: "INV-2026-0141", amount: -185000, currency: "RWF", date: "Nov 17, 2026", logo: logo("Kethan Gasana"), category: "Cross-border" },
  { id: "2", merchant: "MTN MoMo cash-in", transactionId: "TOP-58A1C2", amount: 500000, currency: "RWF", date: "Nov 16, 2026", logo: logo("MTN MoMo"), category: "Cash-in" },
  { id: "3", merchant: "Jean-Paul Niyonzima", transactionId: "INV-2026-0137", amount: 240000, currency: "RWF", date: "Nov 15, 2026", logo: logo("Jean-Paul Niyonzima"), category: "Invoice" },
  { id: "4", merchant: "Grace Nakato · Kampala", transactionId: "INV-2026-0132", amount: -96000, currency: "RWF", date: "Nov 14, 2026", logo: logo("Grace Nakato"), category: "Supplier" },
  { id: "5", merchant: "Escrow release #1043", transactionId: "ESC-1043", amount: 310000, currency: "RWF", date: "Nov 12, 2026", logo: logo("Escrow Release"), category: "Escrow" },
  { id: "6", merchant: "Baraka Mushi · Dar es Salaam", transactionId: "INV-2026-0128", amount: -142500, currency: "RWF", date: "Nov 10, 2026", logo: logo("Baraka Mushi"), category: "Cross-border" },
  { id: "7", merchant: "Corridor fee RWF→KES", transactionId: "FEE-77C210", amount: -1850, currency: "RWF", date: "Nov 09, 2026", logo: logo("VUKA Fee"), category: "Fees" },
]

// ══════════════════════════════════════════════════════════════════════════════
// PAGE DATA: Transactions
// ══════════════════════════════════════════════════════════════════════════════

export type FullTransaction = {
  id: string
  merchant: string
  transactionId: string
  amount: number
  /** ISO 4217 code (or USDC). Absent means USD. */
  currency?: string
  date: string
  logo: string
  category: string
  status: "completed" | "pending" | "failed"
  type: "expense" | "income"
  notes?: string
  merchantInfo?: string
  /** Last four characters of the VUKA wallet the entry posted to. */
  cardLast4?: string
}

const tx = (
  id: string,
  merchant: string,
  transactionId: string,
  amount: number,
  date: string,
  category: string,
  status: FullTransaction["status"],
  extra: Partial<FullTransaction> = {},
): FullTransaction => ({
  id,
  merchant,
  transactionId,
  amount,
  currency: "RWF",
  date,
  logo: logo(merchant),
  category,
  status,
  type: amount < 0 ? "expense" : "income",
  cardLast4: "7d80",
  ...extra,
})

export const fullTransactions: FullTransaction[] = [
  tx("t1", "Kethan Gasana", "INV-2026-0141", -185000, "Nov 17, 2026", "Cross-border", "completed", { merchantInfo: "RWF → KES · M-Pesa payout · Nairobi, KE" }),
  tx("t2", "MTN MoMo cash-in", "TOP-58A1C2", 500000, "Nov 16, 2026", "Cash-in", "completed", { merchantInfo: "Top-up from MTN MoMo Rwanda" }),
  tx("t3", "Jean-Paul Niyonzima", "INV-2026-0137", 240000, "Nov 15, 2026", "Invoice", "completed", { merchantInfo: "Invoice settled in full · Kigali, RW" }),
  tx("t4", "Grace Nakato", "INV-2026-0132", -96000, "Nov 14, 2026", "Supplier", "completed", { merchantInfo: "RWF → UGX · MTN MoMo Uganda · Kampala, UG" }),
  tx("t5", "Escrow release #1043", "ESC-1043", 310000, "Nov 12, 2026", "Escrow", "completed", { notes: "Buyer confirmed delivery — escrow released" }),
  tx("t6", "Baraka Mushi", "INV-2026-0128", -142500, "Nov 10, 2026", "Cross-border", "completed", { merchantInfo: "RWF → TZS · Airtel Money Tanzania · Dar es Salaam, TZ" }),
  tx("t7", "Corridor fee RWF→KES", "FEE-77C210", -1850, "Nov 09, 2026", "Fees", "completed"),
  tx("t8", "Chidi Okafor", "INV-2026-0124", -220000, "Nov 08, 2026", "Cross-border", "pending", { merchantInfo: "RWF → NGN · awaiting provider confirmation · Lagos, NG" }),
  tx("t9", "Airtel Money cash-in", "TOP-41D0E7", 150000, "Nov 06, 2026", "Cash-in", "completed"),
  tx("t10", "Amina Uwera", "INV-2026-0119", 87500, "Nov 05, 2026", "Invoice", "completed", { merchantInfo: "Domestic invoice · Kigali, RW" }),
  tx("t11", "Logistics — Kigali depot", "INV-2026-0117", -45000, "Nov 04, 2026", "Logistics", "completed"),
  tx("t12", "Ama Mensah", "INV-2026-0112", -132000, "Nov 02, 2026", "Cross-border", "failed", { notes: "Provider declined the payout — funds returned to wallet", merchantInfo: "RWF → GHS · Accra, GH" }),
  tx("t13", "Escrow lock #1051", "ESC-1051", -260000, "Oct 31, 2026", "Escrow", "completed", { notes: "Locked against INV-2026-0109 until delivery" }),
  tx("t14", "Thandiwe Dlamini", "INV-2026-0109", 198000, "Oct 29, 2026", "Invoice", "completed", { merchantInfo: "ZAR → RWF · Johannesburg, ZA" }),
  tx("t15", "Corridor fee RWF→UGX", "FEE-63B901", -960, "Oct 28, 2026", "Fees", "completed"),
  tx("t16", "Kethan Gasana", "INV-2026-0104", -175000, "Oct 26, 2026", "Cross-border", "completed", { merchantInfo: "RWF → KES · Nairobi, KE" }),
  tx("t17", "Jean-Paul Niyonzima", "INV-2026-0101", 120000, "Oct 24, 2026", "Invoice", "pending"),
  tx("t18", "Reversal — INV-2026-0098", "REV-0098", 64000, "Oct 22, 2026", "Reversal", "completed", { notes: "Reversed after a duplicate payment was detected" }),
  tx("t19", "Grace Nakato", "INV-2026-0095", -88000, "Oct 20, 2026", "Supplier", "completed"),
  tx("t20", "MTN MoMo cash-in", "TOP-2F7A90", 400000, "Oct 18, 2026", "Cash-in", "completed"),
]

// ══════════════════════════════════════════════════════════════════════════════
// PAGE DATA: Cards — VUKA wallet cards (illustrative; the sandbox issues no cards)
// ══════════════════════════════════════════════════════════════════════════════

export type CardData = {
  id: string
  name: string
  type: "physical" | "virtual"
  last4: string
  cardNumber: string
  holder: string
  expiry: string
  cvv: string
  network: "visa" | "mastercard"
  frozen: boolean
  dailyLimit: number
  monthlySpend: number
  monthlyLimit: number
  color: string
}

export const cardsData: CardData[] = [
  { id: "c1", name: "Business Trade", type: "physical", last4: "4589", cardNumber: "**** **** **** 4589", holder: "AMINA UWERA", expiry: "09/28", cvv: "317", network: "visa", frozen: false, dailyLimit: 500, monthlySpend: 1480, monthlyLimit: 2000, color: "bg-primary text-primary-foreground" },
  { id: "c2", name: "Supplier Payouts", type: "virtual", last4: "7321", cardNumber: "**** **** **** 7321", holder: "AMINA UWERA", expiry: "03/27", cvv: "892", network: "mastercard", frozen: false, dailyLimit: 300, monthlySpend: 640, monthlyLimit: 1500, color: "bg-secondary text-secondary-foreground" },
  { id: "c3", name: "Cross-border Travel", type: "virtual", last4: "9012", cardNumber: "**** **** **** 9012", holder: "AMINA UWERA", expiry: "12/26", cvv: "445", network: "visa", frozen: false, dailyLimit: 200, monthlySpend: 156, monthlyLimit: 800, color: "bg-muted text-foreground" },
  { id: "c4", name: "Escrow Reserve", type: "physical", last4: "3456", cardNumber: "**** **** **** 3456", holder: "AMINA UWERA", expiry: "06/29", cvv: "661", network: "mastercard", frozen: true, dailyLimit: 1000, monthlySpend: 0, monthlyLimit: 5000, color: "bg-card text-card-foreground ring-1 ring-border" },
]

// ══════════════════════════════════════════════════════════════════════════════
// PAGE DATA: Analytics
// ══════════════════════════════════════════════════════════════════════════════

export type SpendingHeatmapDay = { date: string; amount: number }

// Deterministic so server and client render the same heatmap.
function generateHeatmap(): SpendingHeatmapDay[] {
  const data: SpendingHeatmapDay[] = []
  const start = new Date(2025, 10, 18)
  for (let i = 0; i < 365; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const dayOfWeek = d.getDay()
    const base = dayOfWeek === 0 || dayOfWeek === 6 ? 20 : 90
    const noise = Math.sin(i * 0.3) * 45 + Math.cos(i * 0.7) * 30
    const amount = Math.max(0, Math.round(base + noise + (i % 7) * 12))
    data.push({ date: d.toISOString().split("T")[0] ?? "", amount: (i * 7919) % 10 === 0 ? 0 : amount })
  }
  return data
}

export const spendingHeatmapData = generateHeatmap()

export type CategoryBreakdown = {
  category: string
  amount: number
  color: string
  subcategories: { name: string; amount: number }[]
}

// Payment volume by corridor (USD-equivalent).
export const categoryBreakdowns: CategoryBreakdown[] = [
  { category: "RWF → KES", amount: 1820, color: "var(--color-chart-1)", subcategories: [{ name: "Kethan Gasana", amount: 1240 }, { name: "Other Nairobi suppliers", amount: 580 }] },
  { category: "RWF → UGX", amount: 960, color: "var(--color-chart-2)", subcategories: [{ name: "Grace Nakato", amount: 720 }, { name: "Kampala logistics", amount: 240 }] },
  { category: "RWF → TZS", amount: 740, color: "var(--color-chart-3)", subcategories: [{ name: "Baraka Mushi", amount: 740 }] },
  { category: "RWF → RWF", amount: 1360, color: "var(--color-chart-4)", subcategories: [{ name: "Jean-Paul Niyonzima", amount: 980 }, { name: "Kigali depot", amount: 380 }] },
  { category: "RWF → NGN", amount: 410, color: "var(--color-chart-5)", subcategories: [{ name: "Chidi Okafor", amount: 410 }] },
  { category: "RWF → GHS", amount: 230, color: "var(--color-chart-1)", subcategories: [{ name: "Ama Mensah", amount: 230 }] },
  { category: "ZAR → RWF", amount: 340, color: "var(--color-chart-2)", subcategories: [{ name: "Thandiwe Dlamini", amount: 340 }] },
]

export type RecurringCharge = {
  id: string
  merchant: string
  logo: string
  amount: number
  frequency: "monthly" | "yearly"
  nextDate: string
  status: "wanted" | "review" | "unset"
  category: string
}

// Repeat supplier payments VUKA spotted in the payment history (USD-equivalent).
export const recurringCharges: RecurringCharge[] = [
  { id: "r1", merchant: "Kethan Gasana", logo: logo("Kethan Gasana"), amount: 135.0, frequency: "monthly", nextDate: "Dec 17, 2026", status: "wanted", category: "Cross-border" },
  { id: "r2", merchant: "Grace Nakato", logo: logo("Grace Nakato"), amount: 72.0, frequency: "monthly", nextDate: "Dec 14, 2026", status: "wanted", category: "Supplier" },
  { id: "r3", merchant: "Kigali depot", logo: logo("Kigali depot"), amount: 34.0, frequency: "monthly", nextDate: "Dec 04, 2026", status: "wanted", category: "Logistics" },
  { id: "r4", merchant: "Baraka Mushi", logo: logo("Baraka Mushi"), amount: 106.0, frequency: "monthly", nextDate: "Dec 10, 2026", status: "review", category: "Cross-border" },
  { id: "r5", merchant: "Warehouse rent", logo: logo("Warehouse rent"), amount: 180.0, frequency: "monthly", nextDate: "Dec 01, 2026", status: "wanted", category: "Operations" },
  { id: "r6", merchant: "Chidi Okafor", logo: logo("Chidi Okafor"), amount: 164.0, frequency: "monthly", nextDate: "Dec 08, 2026", status: "review", category: "Cross-border" },
  { id: "r7", merchant: "Customs broker", logo: logo("Customs broker"), amount: 48.0, frequency: "monthly", nextDate: "Dec 05, 2026", status: "unset", category: "Logistics" },
  { id: "r8", merchant: "Business registration", logo: logo("Business registration"), amount: 60.0, frequency: "yearly", nextDate: "Mar 02, 2027", status: "wanted", category: "Compliance" },
]

export type MonthComparison = { category: string; thisMonth: number; lastMonth: number }

export const monthComparisons: MonthComparison[] = [
  { category: "Sent", thisMonth: 2180, lastMonth: 1840 },
  { category: "Received", thisMonth: 290, lastMonth: 410 },
  { category: "Cross-border", thisMonth: 1360, lastMonth: 1120 },
  { category: "Domestic", thisMonth: 820, lastMonth: 720 },
  { category: "Escrow", thisMonth: 640, lastMonth: 380 },
  { category: "Fees", thisMonth: 22, lastMonth: 18 },
]

export type AiInsight = {
  id: string
  text: string
  trend: "up" | "down" | "neutral"
  percentChange: number
  category: string
}

export const aiInsights: AiInsight[] = [
  { id: "ai1", text: "Cross-border volume is up 21% this month — RWF → KES is now your busiest corridor.", trend: "up", percentChange: 21, category: "Corridors" },
  { id: "ai2", text: "86% of your payments settled first time; 6 failed at the provider and were returned to your wallet.", trend: "neutral", percentChange: 0, category: "Reliability" },
  { id: "ai3", text: "You have used 74% of this month's KYC limit. Business verification raises it to $250,000/month.", trend: "up", percentChange: 74, category: "Limits" },
  { id: "ai4", text: "Invoice-linked payments lift your trust score fastest — 3 open invoices are awaiting settlement.", trend: "up", percentChange: 12, category: "Trust score" },
  { id: "ai5", text: "Reversals fell 40% compared with last month.", trend: "down", percentChange: 40, category: "Reversals" },
]

// ══════════════════════════════════════════════════════════════════════════════
// PAGE DATA: Investments — treasury & regional market watch (illustrative only)
// ══════════════════════════════════════════════════════════════════════════════

// Deterministic sparkline so SSR and hydration agree.
function generateSparkline(base: number, volatility: number): number[] {
  const points: number[] = []
  let price = base
  for (let i = 0; i < 30; i++) {
    price += Math.sin(i * 0.5) * volatility + Math.cos(i * 1.3 + base) * volatility * 0.4
    points.push(Math.round(price * 100) / 100)
  }
  return points
}

export type Holding = {
  id: string
  symbol: string
  name: string
  quantity: number
  avgBuyPrice: number
  currentPrice: number
  logo: string
  sparklineData: number[]
  sector: string
}

export const holdings: Holding[] = [
  { id: "h1", symbol: "USDC", name: "USDC escrow float", quantity: 1840, avgBuyPrice: 1.0, currentPrice: 1.0, logo: logo("USD Coin"), sparklineData: generateSparkline(1, 0.001), sector: "Settlement float" },
  { id: "h2", symbol: "RW-TB91", name: "Rwanda 91-day T-bill", quantity: 20, avgBuyPrice: 96.4, currentPrice: 97.8, logo: logo("Rwanda Treasury"), sparklineData: generateSparkline(97.8, 0.2), sector: "Treasury bills" },
  { id: "h3", symbol: "KE-TB182", name: "Kenya 182-day T-bill", quantity: 15, avgBuyPrice: 92.1, currentPrice: 94.6, logo: logo("Kenya Treasury"), sparklineData: generateSparkline(94.6, 0.3), sector: "Treasury bills" },
  { id: "h4", symbol: "BOK", name: "Bank of Kigali Group", quantity: 400, avgBuyPrice: 0.21, currentPrice: 0.24, logo: logo("Bank Kigali"), sparklineData: generateSparkline(0.24, 0.004), sector: "Banking" },
  { id: "h5", symbol: "SCOM", name: "Safaricom", quantity: 900, avgBuyPrice: 0.13, currentPrice: 0.15, logo: logo("Safaricom"), sparklineData: generateSparkline(0.15, 0.003), sector: "Telecom" },
  { id: "h6", symbol: "MTNU", name: "MTN Uganda", quantity: 5000, avgBuyPrice: 0.05, currentPrice: 0.06, logo: logo("MTN Uganda"), sparklineData: generateSparkline(0.06, 0.001), sector: "Telecom" },
  { id: "h7", symbol: "EQTY", name: "Equity Group", quantity: 600, avgBuyPrice: 0.33, currentPrice: 0.31, logo: logo("Equity Group"), sparklineData: generateSparkline(0.31, 0.006), sector: "Banking" },
  { id: "h8", symbol: "TRADE", name: "Trade receivables (invoices)", quantity: 1, avgBuyPrice: 820, currentPrice: 860, logo: logo("Trade Receivables"), sparklineData: generateSparkline(860, 6), sector: "Receivables" },
]

export type WatchlistItem = {
  id: string
  symbol: string
  name: string
  currentPrice: number
  dayChange: number
  logo: string
  sparklineData: number[]
}

export const watchlistItems: WatchlistItem[] = [
  { id: "w1", symbol: "KCB", name: "KCB Group", currentPrice: 0.29, dayChange: 1.24, logo: logo("KCB Group"), sparklineData: generateSparkline(0.29, 0.004) },
  { id: "w2", symbol: "AAF", name: "Airtel Africa", currentPrice: 1.42, dayChange: -0.87, logo: logo("Airtel Africa"), sparklineData: generateSparkline(1.42, 0.02) },
  { id: "w3", symbol: "CRDB", name: "CRDB Bank", currentPrice: 0.26, dayChange: 0.56, logo: logo("CRDB Bank"), sparklineData: generateSparkline(0.26, 0.003) },
  { id: "w4", symbol: "UG-TB364", name: "Uganda 364-day T-bill", currentPrice: 88.9, dayChange: 0.12, logo: logo("Uganda Treasury"), sparklineData: generateSparkline(88.9, 0.2) },
  { id: "w5", symbol: "GH-TB91", name: "Ghana 91-day T-bill", currentPrice: 93.2, dayChange: -0.32, logo: logo("Ghana Treasury"), sparklineData: generateSparkline(93.2, 0.3) },
]

export type PortfolioHistoryPoint = { date: string; portfolio: number; sp500: number }

// `sp500` is kept as the benchmark key; it holds the regional treasury-bill benchmark.
export const portfolioHistory: PortfolioHistoryPoint[] = [
  { date: "Dec 2025", portfolio: 4200, sp500: 4400 },
  { date: "Jan 2026", portfolio: 4450, sp500: 4520 },
  { date: "Feb 2026", portfolio: 4380, sp500: 4480 },
  { date: "Mar 2026", portfolio: 4620, sp500: 4610 },
  { date: "Apr 2026", portfolio: 4810, sp500: 4730 },
  { date: "May 2026", portfolio: 4750, sp500: 4680 },
  { date: "Jun 2026", portfolio: 5120, sp500: 4890 },
  { date: "Jul 2026", portfolio: 5380, sp500: 5020 },
  { date: "Aug 2026", portfolio: 5240, sp500: 4980 },
  { date: "Sep 2026", portfolio: 5510, sp500: 5140 },
  { date: "Oct 2026", portfolio: 5820, sp500: 5310 },
  { date: "Nov 2026", portfolio: 6145, sp500: 5480 },
]

// ══════════════════════════════════════════════════════════════════════════════
// PAGE DATA: Budgets — trade operating budget (USD-equivalent)
// ══════════════════════════════════════════════════════════════════════════════

export type BudgetCategory = {
  id: string
  category: string
  iconName: string
  budget: number
  spent: number
  color: string
}

export const budgetCategories: BudgetCategory[] = [
  { id: "b1", category: "Supplier payments", iconName: "shopping-bag", budget: 1200, spent: 1260, color: "text-orange-500" },
  { id: "b2", category: "Logistics & freight", iconName: "car", budget: 300, spent: 214, color: "text-blue-500" },
  { id: "b3", category: "Corridor fees", iconName: "repeat", budget: 40, spent: 22, color: "text-purple-500" },
  { id: "b4", category: "Escrow deposits", iconName: "utensils", budget: 600, spent: 640, color: "text-pink-500" },
  { id: "b5", category: "Customs & duties", iconName: "gamepad-2", budget: 150, spent: 96, color: "text-cyan-500" },
  { id: "b6", category: "Staff & casual labour", iconName: "heart-pulse", budget: 250, spent: 180, color: "text-emerald-500" },
  { id: "b7", category: "Compliance & KYC", iconName: "graduation-cap", budget: 60, spent: 15, color: "text-amber-500" },
  { id: "b8", category: "Market trips", iconName: "plane", budget: 200, spent: 212, color: "text-rose-500" },
]

export type SavingsGoal = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  iconName: string
  monthlyContribution: number
}

export const savingsGoals: SavingsGoal[] = [
  { id: "g1", name: "Escrow buffer for Q1 orders", targetAmount: 2500, currentAmount: 1840, deadline: "Jan 2027", iconName: "shield", monthlyContribution: 300 },
  { id: "g2", name: "Inventory restock", targetAmount: 5000, currentAmount: 2400, deadline: "Mar 2027", iconName: "home", monthlyContribution: 450 },
  { id: "g3", name: "Delivery motorbike", targetAmount: 1800, currentAmount: 650, deadline: "Jun 2027", iconName: "car", monthlyContribution: 150 },
  { id: "g4", name: "Nairobi trade fair", targetAmount: 900, currentAmount: 420, deadline: "Feb 2027", iconName: "palm-tree", monthlyContribution: 120 },
]

export type DailySpending = { date: string; amount: number }

// Daily payments sent (USD-equivalent) for the current month; deterministic for SSR.
export const dailySpending: DailySpending[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 10, i + 1) // November 2026
  const dayOfWeek = d.getDay()
  const base = dayOfWeek === 0 || dayOfWeek === 6 ? 25 : 75
  const amount = Math.round(base + Math.sin(i * 0.8) * 30 + ((i * 37) % 20))
  return { date: d.toISOString().split("T")[0] ?? "", amount: i < 17 ? amount : 0 }
})

// ══════════════════════════════════════════════════════════════════════════════
// PAGE DATA: Accounts — VUKA wallets
// ══════════════════════════════════════════════════════════════════════════════

export type BankAccount = {
  id: string
  name: string
  type: "checking" | "savings" | "crypto" | "investment"
  institution: string
  institutionLogo: string
  accountNumber: string
  balance: number
  currency: string
  change: number
  changePercent: number
  lastActivity: string
  color: string
}

export const bankAccounts: BankAccount[] = [
  { id: "ba1", name: "Business trade wallet", type: "checking", institution: "VUKA ledger · MTN MoMo Rwanda", institutionLogo: logo("VUKA Business"), accountNumber: "****7d80", balance: 4250000, currency: "RWF ", change: 315000, changePercent: 8.0, lastActivity: "Today", color: "bg-blue-500" },
  { id: "ba2", name: "Personal wallet", type: "savings", institution: "VUKA ledger · MTN MoMo Rwanda", institutionLogo: logo("VUKA Personal"), accountNumber: "****9cc7", balance: 312500, currency: "RWF ", change: 12500, changePercent: 4.2, lastActivity: "Yesterday", color: "bg-emerald-500" },
  { id: "ba3", name: "Escrow (USDC)", type: "crypto", institution: "Polygon · on-chain escrow", institutionLogo: logo("Polygon Escrow"), accountNumber: "****3bc9", balance: 1840, currency: "USDC ", change: 260, changePercent: 16.5, lastActivity: "2 hours ago", color: "bg-orange-500" },
  { id: "ba4", name: "Trade receivables", type: "investment", institution: "VUKA invoices", institutionLogo: logo("VUKA Invoices"), accountNumber: "****0141", balance: 860, currency: "USD ", change: 40, changePercent: 4.9, lastActivity: "Today", color: "bg-violet-500" },
  { id: "ba5", name: "Kenya wallet", type: "checking", institution: "VUKA ledger · Safaricom M-Pesa", institutionLogo: logo("VUKA Kenya"), accountNumber: "****af5c", balance: 25000, currency: "KES ", change: 2500, changePercent: 11.1, lastActivity: "3 days ago", color: "bg-pink-500" },
  { id: "ba6", name: "Uganda wallet", type: "savings", institution: "VUKA ledger · MTN MoMo Uganda", institutionLogo: logo("VUKA Uganda"), accountNumber: "****8834", balance: 640000, currency: "UGX ", change: 32000, changePercent: 5.3, lastActivity: "Today", color: "bg-cyan-500" },
]

// ══════════════════════════════════════════════════════════════════════════════
// PAGE DATA: Transfers
// ══════════════════════════════════════════════════════════════════════════════

export type TransferRecord = {
  id: string
  type: "sent" | "received" | "scheduled"
  contactName: string
  contactAvatar: string
  amount: number
  /** ISO 4217 code (or USDC). Absent means USD. */
  currency?: string
  date: string
  status: "completed" | "pending" | "scheduled"
  note?: string
}

export const transferRecords: TransferRecord[] = [
  { id: "tr1", type: "sent", contactName: "Kethan Gasana", contactAvatar: avatar(8), amount: 185000, currency: "RWF", date: "Nov 17, 2026", status: "completed", note: "INV-2026-0141 · textiles" },
  { id: "tr2", type: "received", contactName: "Jean-Paul Niyonzima", contactAvatar: avatar(3), amount: 240000, currency: "RWF", date: "Nov 15, 2026", status: "completed", note: "INV-2026-0137 settled" },
  { id: "tr3", type: "sent", contactName: "Grace Nakato", contactAvatar: avatar(1), amount: 96000, currency: "RWF", date: "Nov 14, 2026", status: "completed", note: "INV-2026-0132 · maize flour" },
  { id: "tr4", type: "scheduled", contactName: "Baraka Mushi", contactAvatar: avatar(11), amount: 142500, currency: "RWF", date: "Dec 10, 2026", status: "scheduled", note: "Monthly coffee consignment" },
  { id: "tr5", type: "received", contactName: "Thandiwe Dlamini", contactAvatar: avatar(16), amount: 198000, currency: "RWF", date: "Oct 29, 2026", status: "completed", note: "INV-2026-0109" },
  { id: "tr6", type: "sent", contactName: "Chidi Okafor", contactAvatar: avatar(12), amount: 220000, currency: "RWF", date: "Nov 08, 2026", status: "pending", note: "Awaiting provider confirmation" },
  { id: "tr7", type: "scheduled", contactName: "Kethan Gasana", contactAvatar: avatar(8), amount: 185000, currency: "RWF", date: "Dec 17, 2026", status: "scheduled", note: "Repeat textiles order" },
  { id: "tr8", type: "received", contactName: "Amina Uwera", contactAvatar: avatar(5), amount: 87500, currency: "RWF", date: "Nov 05, 2026", status: "completed" },
  { id: "tr9", type: "sent", contactName: "Ama Mensah", contactAvatar: avatar(9), amount: 132000, currency: "RWF", date: "Nov 02, 2026", status: "completed", note: "Shea butter sample order" },
  { id: "tr10", type: "scheduled", contactName: "Grace Nakato", contactAvatar: avatar(1), amount: 96000, currency: "RWF", date: "Dec 14, 2026", status: "scheduled", note: "Repeat maize order" },
]

// ══════════════════════════════════════════════════════════════════════════════
// PAGE DATA: Notifications
// ══════════════════════════════════════════════════════════════════════════════

export type Notification = {
  id: string
  type: "transaction" | "security" | "system" | "promotion" | "request"
  title: string
  description: string
  time: string
  read: boolean
  icon: string
  actionable?: {
    accept: string
    decline: string
    amount?: string
    from?: string
    fromAvatar?: string
  }
}

export const notifications: Notification[] = [
  { id: "n0a", type: "request", title: "Invoice awaiting payment", description: "Kethan Gasana issued INV-2026-0145 for RWF 210,000 — pay into escrow to lock the order", time: "Just now", read: false, icon: "hand-coins", actionable: { accept: "Pay RWF 210,000", decline: "Decline", amount: "RWF 210,000", from: "Kethan Gasana", fromAvatar: "/avatars/8.jpg" } },
  { id: "n0b", type: "security", title: "Confirm new sign-in", description: "A sign-in to your trader account was attempted from a new browser in Nairobi, KE", time: "5 min ago", read: false, icon: "shield-alert", actionable: { accept: "It was me", decline: "Block" } },
  { id: "n0c", type: "request", title: "Delivery confirmation", description: "Grace Nakato marked INV-2026-0132 as delivered — confirm to release escrow #1047", time: "30 min ago", read: false, icon: "split", actionable: { accept: "Release escrow", decline: "Raise dispute", amount: "RWF 96,000", from: "Grace Nakato", fromAvatar: "/avatars/1.jpg" } },
  { id: "n1", type: "transaction", title: "Payment received", description: "Jean-Paul Niyonzima settled INV-2026-0137 — RWF 240,000", time: "2 min ago", read: false, icon: "arrow-down-left" },
  { id: "n2", type: "security", title: "New sign-in", description: "Your trader account was accessed from a new device in Kigali, RW", time: "1 hour ago", read: false, icon: "shield-alert" },
  { id: "n3", type: "transaction", title: "Cross-border payout sent", description: "RWF 185,000 → KES delivered to Kethan Gasana via M-Pesa", time: "3 hours ago", read: false, icon: "credit-card" },
  { id: "n4", type: "system", title: "KYC limit alert", description: "You have used 74% of this month's KYC limit (USD 2,000)", time: "5 hours ago", read: true, icon: "alert-triangle" },
  { id: "n5", type: "promotion", title: "Raise your limits", description: "Submit business registration evidence to move to BUSINESS_VERIFIED limits", time: "1 day ago", read: true, icon: "sparkles" },
  { id: "n6", type: "transaction", title: "Escrow released", description: "Escrow #1043 released RWF 310,000 to your business wallet", time: "1 day ago", read: true, icon: "check-circle" },
  { id: "n7", type: "security", title: "Password changed", description: "Your trader account password was updated", time: "2 days ago", read: true, icon: "lock" },
  { id: "n8", type: "transaction", title: "Repeat payment detected", description: "Payments to Grace Nakato look monthly — review them in Analytics", time: "2 days ago", read: true, icon: "repeat" },
  { id: "n9", type: "system", title: "Quote expired", description: "Your RWF → NGN quote expired before confirmation — request a new one", time: "3 days ago", read: true, icon: "clock" },
  { id: "n10", type: "transaction", title: "Trust score up", description: "Your trust score rose 12 points after 4 on-time settlements", time: "5 days ago", read: true, icon: "trending-up" },
  { id: "n11", type: "system", title: "Statement ready", description: "Your October 2026 camt.053 statement is available for download", time: "1 week ago", read: true, icon: "file-text" },
  { id: "n12", type: "security", title: "KYC evidence received", description: "Your national ID reference was received and is pending review", time: "2 weeks ago", read: true, icon: "shield-check" },
]

// ══════════════════════════════════════════════════════════════════════════════
// PAGE DATA: Crypto — on-chain settlement assets (sandbox, illustrative prices)
// ══════════════════════════════════════════════════════════════════════════════

export type CryptoCoin = {
  id: string
  symbol: string
  name: string
  logo: string
  price: number
  change24h: number
  change7d: number
  marketCap: number
  volume24h: number
  holdings: number
  sparklineData: number[]
}

export const cryptoCoins: CryptoCoin[] = [
  { id: "usdc", symbol: "USDC", name: "USD Coin (Polygon)", logo: logo("USD Coin"), price: 1.0, change24h: 0.01, change7d: -0.02, marketCap: 34000000000, volume24h: 6200000000, holdings: 1840, sparklineData: [1.0, 0.9998, 1.0001, 1.0, 0.9999, 1.0002, 1.0, 0.9999, 1.0, 1.0001, 1.0, 0.9998, 1.0, 1.0] },
  { id: "pol", symbol: "POL", name: "Polygon", logo: logo("Polygon"), price: 0.42, change24h: 2.34, change7d: 5.12, marketCap: 4200000000, volume24h: 210000000, holdings: 120, sparklineData: [0.39, 0.4, 0.39, 0.41, 0.41, 0.4, 0.42, 0.41, 0.42, 0.41, 0.42, 0.43, 0.42, 0.42] },
  { id: "usdt", symbol: "USDT", name: "Tether (Polygon)", logo: logo("Tether"), price: 1.0, change24h: -0.01, change7d: 0.01, marketCap: 118000000000, volume24h: 42000000000, holdings: 250, sparklineData: [1.0, 1.0001, 0.9999, 1.0, 1.0, 0.9998, 1.0, 1.0001, 1.0, 0.9999, 1.0, 1.0, 1.0001, 1.0] },
  { id: "eurc", symbol: "EURC", name: "Euro Coin", logo: logo("Euro Coin"), price: 1.08, change24h: 0.21, change7d: -0.45, marketCap: 120000000, volume24h: 18000000, holdings: 0, sparklineData: [1.085, 1.082, 1.079, 1.081, 1.083, 1.08, 1.078, 1.079, 1.081, 1.08, 1.082, 1.081, 1.079, 1.08] },
  { id: "cusd", symbol: "cUSD", name: "Celo Dollar", logo: logo("Celo Dollar"), price: 0.999, change24h: -0.05, change7d: 0.03, marketCap: 32000000, volume24h: 4100000, holdings: 0, sparklineData: [0.999, 1.0, 0.998, 0.999, 1.0, 0.999, 0.998, 0.999, 1.0, 0.999, 0.999, 1.0, 0.999, 0.999] },
  { id: "eth", symbol: "ETH", name: "Ethereum", logo: logo("Ethereum"), price: 3845.2, change24h: -1.15, change7d: 3.28, marketCap: 462000000000, volume24h: 15200000000, holdings: 0, sparklineData: [3720, 3680, 3750, 3810, 3790, 3850, 3820, 3780, 3860, 3830, 3845, 3870, 3810, 3845] },
  { id: "btc", symbol: "BTC", name: "Bitcoin", logo: logo("Bitcoin"), price: 68420.5, change24h: 1.34, change7d: 2.12, marketCap: 1340000000000, volume24h: 28500000000, holdings: 0, sparklineData: [64200, 65100, 63800, 66500, 67200, 65800, 68100, 67500, 68900, 67800, 68420, 69100, 68200, 68420] },
  { id: "celo", symbol: "CELO", name: "Celo", logo: logo("Celo"), price: 0.68, change24h: 3.1, change7d: 6.4, marketCap: 380000000, volume24h: 42000000, holdings: 0, sparklineData: [0.63, 0.64, 0.65, 0.64, 0.66, 0.65, 0.67, 0.66, 0.67, 0.66, 0.68, 0.69, 0.67, 0.68] },
]

export type CryptoTransaction = {
  id: string
  type: "buy" | "sell" | "swap" | "receive" | "send"
  coin: string
  coinSymbol: string
  logo: string
  amount: number
  value: number
  date: string
  status: "completed" | "pending"
}

export const cryptoTransactions: CryptoTransaction[] = [
  { id: "ct1", type: "receive", coin: "USD Coin", coinSymbol: "USDC", logo: logo("USD Coin"), amount: 260, value: 260, date: "Nov 12, 2026", status: "completed" },
  { id: "ct2", type: "send", coin: "USD Coin", coinSymbol: "USDC", logo: logo("USD Coin"), amount: 310, value: 310, date: "Nov 11, 2026", status: "completed" },
  { id: "ct3", type: "swap", coin: "USDT → USDC", coinSymbol: "USDT", logo: logo("Tether"), amount: 100, value: 100, date: "Nov 10, 2026", status: "completed" },
  { id: "ct4", type: "buy", coin: "Polygon", coinSymbol: "POL", logo: logo("Polygon"), amount: 120, value: 50.4, date: "Nov 09, 2026", status: "completed" },
  { id: "ct5", type: "send", coin: "USD Coin", coinSymbol: "USDC", logo: logo("USD Coin"), amount: 180, value: 180, date: "Nov 07, 2026", status: "pending" },
]

// ══════════════════════════════════════════════════════════════════════════════
// WIDGET DATA: Trust score (live: GET /api/trader/trust-score)
// ══════════════════════════════════════════════════════════════════════════════

export type HealthFactor = {
  id: string
  label: string
  score: number
  maxScore: number
  status: "excellent" | "good" | "fair" | "poor"
  description: string
}

export const financialHealthScore = {
  overall: 78,
  trend: "up" as "up" | "down",
  trendDelta: 3,
  factors: [
    { id: "hf1", label: "Settlement cycles", score: 86, maxScore: 100, status: "excellent" as const, description: "55 of 64 finished payments settled successfully" },
    { id: "hf2", label: "Invoice settlement", score: 72, maxScore: 100, status: "good" as const, description: "Most invoices are paid in full before their due date" },
    { id: "hf3", label: "Reversal record", score: 90, maxScore: 100, status: "excellent" as const, description: "3 of 58 settled payments were later reversed" },
    { id: "hf4", label: "Volume progression", score: 68, maxScore: 100, status: "good" as const, description: "Monthly settled volume is growing steadily" },
    { id: "hf5", label: "Counterparty diversity", score: 55, maxScore: 100, status: "fair" as const, description: "Trading with 2 counterparties — more corridors add confidence" },
    { id: "hf6", label: "Dispute record", score: 95, maxScore: 100, status: "excellent" as const, description: "No escrow disputes raised against you in 12 months" },
  ] as HealthFactor[],
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE DATA: Help & Support
// ══════════════════════════════════════════════════════════════════════════════

export type FaqItem = {
  id: string
  question: string
  answer: string
  category: "account" | "payments" | "security" | "billing" | "general"
}

export const faqItems: FaqItem[] = [
  { id: "faq1", category: "account", question: "Which wallets do I get when I register?", answer: "Every trader gets a PERSONAL and a BUSINESS wallet in their home currency. Balances are never stored — they are derived from the double-entry ledger, so they always add up." },
  { id: "faq2", category: "payments", question: "How long do cross-border payments take?", answer: "Collection from mobile money, the ledger handoff and the payout are separate steps. In this sandbox they complete in seconds; a payout the provider cannot confirm is marked REQUIRES_REVIEW rather than silently retried." },
  { id: "faq3", category: "security", question: "Does VUKA ever ask for my mobile-money PIN?", answer: "Never. Your provider (MTN MoMo, M-Pesa, Airtel Money…) runs its own USSD, app or API challenge. VUKA only records the authorization reference the provider returns." },
  { id: "faq4", category: "billing", question: "How are fees and exchange rates set?", answer: "The engine prices every corridor. You see the fee and a firm quote before you pay, and the transfer settles at that locked rate — the UI never hard-codes a fee or rate." },
  { id: "faq5", category: "account", question: "Can I hold more than one currency?", answer: "Your wallets are in your home currency. Cross-border payments convert at the corridor's quoted rate and deliver in the recipient's currency." },
  { id: "faq6", category: "security", question: "What happens if the goods never arrive?", answer: "Invoice-linked payments can be locked in escrow. If delivery is not confirmed before the timeout you can raise a dispute; an arbiter decides whether the escrow is released or refunded." },
  { id: "faq7", category: "payments", question: "What are my transaction limits?", answer: "Limits follow your KYC tier (per-transaction, daily and monthly, in USD-equivalent). Submitting verification evidence moves you to a higher tier." },
  { id: "faq8", category: "general", question: "How do I get a statement for my bank or auditor?", answer: "Each wallet can export an ISO 20022 camt.053 statement for any period, plus CSV exports of your transactions." },
  { id: "faq9", category: "billing", question: "Is this a live payment service?", answer: "No. This deployment uses sandbox providers and indicative rates; no real funds move and settlement execution is disabled." },
  { id: "faq10", category: "general", question: "How is my trust score calculated?", answer: "It is deterministic and explainable: completed settlement cycles, invoice settlement, reversals, volume progression and counterparty diversity, each with a published weight." },
]

export type SupportTicket = {
  id: string
  subject: string
  status: "open" | "in-progress" | "resolved"
  priority: "low" | "medium" | "high"
  createdAt: string
  lastUpdate: string
}

export const supportTickets: SupportTicket[] = [
  { id: "tk1", subject: "Payout to Lagos stuck in pending", status: "in-progress", priority: "high", createdAt: "Nov 08, 2026", lastUpdate: "Nov 12, 2026" },
  { id: "tk2", subject: "Request higher KYC limit", status: "open", priority: "medium", createdAt: "Nov 06, 2026", lastUpdate: "Nov 06, 2026" },
  { id: "tk3", subject: "camt.053 statement for October", status: "resolved", priority: "low", createdAt: "Oct 15, 2026", lastUpdate: "Oct 18, 2026" },
]

export const systemStatus = [
  { name: "Ledger engine", status: "operational" as "operational" | "degraded" | "outage" },
  { name: "Mobile-money rails (sandbox)", status: "operational" as "operational" | "degraded" | "outage" },
  { name: "On-chain escrow (Polygon)", status: "degraded" as "operational" | "degraded" | "outage" },
  { name: "Cross-border corridors", status: "operational" as "operational" | "degraded" | "outage" },
  { name: "Mobile app", status: "operational" as "operational" | "degraded" | "outage" },
]

export const cryptoPriceHistory = [
  { time: "00:00", btc: 67800, eth: 3790 },
  { time: "02:00", btc: 67500, eth: 3780 },
  { time: "04:00", btc: 67900, eth: 3810 },
  { time: "06:00", btc: 68200, eth: 3830 },
  { time: "08:00", btc: 67800, eth: 3820 },
  { time: "10:00", btc: 68500, eth: 3850 },
  { time: "12:00", btc: 68100, eth: 3840 },
  { time: "14:00", btc: 68800, eth: 3860 },
  { time: "16:00", btc: 68300, eth: 3835 },
  { time: "18:00", btc: 68600, eth: 3855 },
  { time: "20:00", btc: 68200, eth: 3840 },
  { time: "22:00", btc: 68420, eth: 3845 },
]
