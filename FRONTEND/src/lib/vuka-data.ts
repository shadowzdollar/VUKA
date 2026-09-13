export type EscrowStatus = "CREATED" | "LOCKED" | "RELEASED" | "REFUNDED" | "DISPUTED";

export interface Escrow {
  id: string;
  invoice: string;
  buyer: string;
  supplier: string;
  corridor: string;
  amountUsdc: number;
  localAmount: string;
  status: EscrowStatus;
  createdAt: string;
  timeoutAt: string;
  buyerConfirmed: boolean;
  supplierConfirmed: boolean;
  txHash: string;
  rail: string;
}

export interface LedgerEntry {
  id: string;
  ts: string;
  account: string;
  ref: string;
  narrative: string;
  debit: number;
  credit: number;
}

export interface Account {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "REVENUE";
  owner: string;
  balance: number;
  currency: string;
  entries: number;
}

export interface Dispute {
  id: string;
  escrow: string;
  claimant: string;
  respondent: string;
  frozen: number;
  opened: string;
  reason: string;
  stage: "INTAKE" | "EVIDENCE" | "ARBITER_REVIEW" | "RESOLVED";
  evidence: { name: string; kind: string; hash: string; filed: string }[];
  verdict?: string;
}

export interface Trader {
  id: string;
  name: string;
  country: string;
  tier: 0 | 1 | 2;
  status: "PENDING" | "VERIFIED" | "FLAGGED";
  msisdn: string;
  nationalId: string;
  registration: string;
  sanctions: "CLEAR" | "REVIEW" | "HIT";
  volume30d: number;
  notes: string;
}

export interface Corridor {
  id: string;
  pair: string;
  route: string;
  rate: number;
  spreadBps: number;
  feePct: number;
  volume24h: number;
  settlements24h: number;
  latencyMin: number;
  rails: string[];
  status: "LIVE" | "PILOT" | "PLANNED";
}

export const corridors: Corridor[] = [
  {
    id: "RWF-KES",
    pair: "RWF / KES",
    route: "Kigali ↔ Nairobi",
    rate: 0.1129,
    spreadBps: 42,
    feePct: 0.85,
    volume24h: 418_920,
    settlements24h: 214,
    latencyMin: 6,
    rails: ["MTN MoMo RW", "Safaricom M-Pesa KE"],
    status: "LIVE",
  },
  {
    id: "KES-UGX",
    pair: "KES / UGX",
    route: "Nairobi ↔ Kampala",
    rate: 28.41,
    spreadBps: 55,
    feePct: 0.95,
    volume24h: 236_480,
    settlements24h: 131,
    latencyMin: 8,
    rails: ["M-Pesa KE", "MTN MoMo UG"],
    status: "LIVE",
  },
  {
    id: "RWF-UGX",
    pair: "RWF / UGX",
    route: "Kigali ↔ Kampala",
    rate: 2.61,
    spreadBps: 61,
    feePct: 1.05,
    volume24h: 94_310,
    settlements24h: 58,
    latencyMin: 9,
    rails: ["MTN MoMo RW", "Airtel Money UG"],
    status: "PILOT",
  },
  {
    id: "TZS-KES",
    pair: "TZS / KES",
    route: "Dar es Salaam ↔ Nairobi",
    rate: 0.0492,
    spreadBps: 70,
    feePct: 1.1,
    volume24h: 61_740,
    settlements24h: 33,
    latencyMin: 12,
    rails: ["Vodacom M-Pesa TZ", "M-Pesa KE"],
    status: "PILOT",
  },
  {
    id: "ETB-KES",
    pair: "ETB / KES",
    route: "Addis Ababa ↔ Nairobi",
    rate: 2.28,
    spreadBps: 118,
    feePct: 1.4,
    volume24h: 0,
    settlements24h: 0,
    latencyMin: 0,
    rails: ["Telebirr", "M-Pesa KE"],
    status: "PLANNED",
  },
];

export const escrows: Escrow[] = [
  {
    id: "ESC-4821",
    invoice: "INV-RW-2291",
    buyer: "Nairobi Fresh Distributors Ltd",
    supplier: "Gikondo Coffee Collective",
    corridor: "RWF / KES",
    amountUsdc: 18_400,
    localAmount: "RWF 24,288,000",
    status: "LOCKED",
    createdAt: "2026-09-08 09:14:02",
    timeoutAt: "2026-09-18 09:14:02",
    buyerConfirmed: true,
    supplierConfirmed: false,
    txHash: "0x8f2a41c9b7e0d3a5619c4f8827de10b3a9c5f6710e4db28a3c91f0455dd7a612",
    rail: "MTN MoMo RW → M-Pesa KE",
  },
  {
    id: "ESC-4818",
    invoice: "INV-KE-8840",
    buyer: "Kampala Hardware Group",
    supplier: "Mombasa Steel Imports",
    corridor: "KES / UGX",
    amountUsdc: 42_150,
    localAmount: "KES 5,441,000",
    status: "RELEASED",
    createdAt: "2026-09-04 16:41:55",
    timeoutAt: "2026-09-14 16:41:55",
    buyerConfirmed: true,
    supplierConfirmed: true,
    txHash: "0x21c7de55a0f4b9138e6c7a2249df80b1c3e5a7719bb40c2d8f6e13a40c9b7752",
    rail: "M-Pesa KE → MTN MoMo UG",
  },
  {
    id: "ESC-4805",
    invoice: "INV-RW-2274",
    buyer: "Rubavu Agro Traders",
    supplier: "Eldoret Grain Union",
    corridor: "RWF / KES",
    amountUsdc: 9_760,
    localAmount: "RWF 12,883,200",
    status: "DISPUTED",
    createdAt: "2026-08-29 11:02:33",
    timeoutAt: "2026-09-08 11:02:33",
    buyerConfirmed: false,
    supplierConfirmed: true,
    txHash: "0x5b9e07a4413cf2d6a7180be59c3f4471d02a8e6693cb15d7f80ea2c4419b6ad3",
    rail: "MTN MoMo RW → M-Pesa KE",
  },
  {
    id: "ESC-4799",
    invoice: "INV-TZ-1108",
    buyer: "Nakuru Textile Works",
    supplier: "Arusha Cotton Mills",
    corridor: "TZS / KES",
    amountUsdc: 6_320,
    localAmount: "TZS 16,430,000",
    status: "REFUNDED",
    createdAt: "2026-08-25 08:22:10",
    timeoutAt: "2026-09-04 08:22:10",
    buyerConfirmed: false,
    supplierConfirmed: false,
    txHash: "0x74ca1d3e8802b5f9a6c1074be23d9f5510ab8c7e4d29f6031bb75cae0182d449",
    rail: "Vodacom M-Pesa TZ → M-Pesa KE",
  },
  {
    id: "ESC-4830",
    invoice: "INV-UG-3301",
    buyer: "Kigali Building Supply",
    supplier: "Jinja Cement Depot",
    corridor: "RWF / UGX",
    amountUsdc: 27_500,
    localAmount: "RWF 36,300,000",
    status: "CREATED",
    createdAt: "2026-09-12 07:55:47",
    timeoutAt: "2026-09-22 07:55:47",
    buyerConfirmed: false,
    supplierConfirmed: false,
    txHash: "0x0d61bb7e49a3c825f70148ae2c93d5b6710fe8a4c25db3907fa6e14c88b30215",
    rail: "MTN MoMo RW → Airtel Money UG",
  },
  {
    id: "ESC-4826",
    invoice: "INV-KE-8871",
    buyer: "Musanze Poultry Coop",
    supplier: "Kisumu Feeds Ltd",
    corridor: "RWF / KES",
    amountUsdc: 13_080,
    localAmount: "RWF 17,265,600",
    status: "LOCKED",
    createdAt: "2026-09-10 13:31:09",
    timeoutAt: "2026-09-20 13:31:09",
    buyerConfirmed: false,
    supplierConfirmed: true,
    txHash: "0x9ae2f0451cb7d8362a4019fe75cb3d80126af4e7093b5ad6c218ef740b9c3315",
    rail: "MTN MoMo RW → M-Pesa KE",
  },
];

export const accounts: Account[] = [
  {
    code: "1000-PER",
    name: "Personal MoMo Wallet",
    type: "ASSET",
    owner: "Gikondo Coffee Collective",
    balance: 1_240.55,
    currency: "USDC",
    entries: 84,
  },
  {
    code: "1100-BIZ",
    name: "Business Trade Wallet",
    type: "ASSET",
    owner: "Gikondo Coffee Collective",
    balance: 58_412.0,
    currency: "USDC",
    entries: 391,
  },
  {
    code: "2000-ESC",
    name: "ESCROW_HELD",
    type: "LIABILITY",
    owner: "VUKA Protocol",
    balance: 58_980.0,
    currency: "USDC",
    entries: 612,
  },
  {
    code: "1200-SET",
    name: "Settlement Account",
    type: "ASSET",
    owner: "VUKA Treasury",
    balance: 204_330.18,
    currency: "USDC",
    entries: 1_044,
  },
  {
    code: "4000-FEE",
    name: "Fee Account",
    type: "REVENUE",
    owner: "VUKA Treasury",
    balance: 9_871.42,
    currency: "USDC",
    entries: 508,
  },
];

export const ledger: LedgerEntry[] = [
  {
    id: "LE-99120",
    ts: "2026-09-12 07:55:48.114",
    account: "1100-BIZ",
    ref: "ESC-4830",
    narrative: "Escrow funding — invoice INV-UG-3301",
    debit: 0,
    credit: 27_500,
  },
  {
    id: "LE-99121",
    ts: "2026-09-12 07:55:48.114",
    account: "2000-ESC",
    ref: "ESC-4830",
    narrative: "Escrow funding — invoice INV-UG-3301",
    debit: 27_500,
    credit: 0,
  },
  {
    id: "LE-99104",
    ts: "2026-09-11 18:02:11.902",
    account: "2000-ESC",
    ref: "ESC-4818",
    narrative: "Mutual confirmation release to supplier",
    debit: 0,
    credit: 42_150,
  },
  {
    id: "LE-99105",
    ts: "2026-09-11 18:02:11.902",
    account: "1200-SET",
    ref: "ESC-4818",
    narrative: "Supplier settlement leg — M-Pesa off-ramp",
    debit: 41_749.6,
    credit: 0,
  },
  {
    id: "LE-99106",
    ts: "2026-09-11 18:02:11.902",
    account: "4000-FEE",
    ref: "ESC-4818",
    narrative: "Corridor fee 0.95%",
    debit: 400.4,
    credit: 0,
  },
  {
    id: "LE-99088",
    ts: "2026-09-10 13:31:10.551",
    account: "1100-BIZ",
    ref: "ESC-4826",
    narrative: "Escrow funding — invoice INV-KE-8871",
    debit: 0,
    credit: 13_080,
  },
  {
    id: "LE-99089",
    ts: "2026-09-10 13:31:10.551",
    account: "2000-ESC",
    ref: "ESC-4826",
    narrative: "Escrow funding — invoice INV-KE-8871",
    debit: 13_080,
    credit: 0,
  },
  {
    id: "LE-99061",
    ts: "2026-09-08 09:14:03.220",
    account: "1000-PER",
    ref: "TOPUP-7712",
    narrative: "Personal MoMo top-up — segregated from trade capital",
    debit: 620.0,
    credit: 0,
  },
  {
    id: "LE-99062",
    ts: "2026-09-08 09:14:03.220",
    account: "1200-SET",
    ref: "TOPUP-7712",
    narrative: "On-ramp settlement offset",
    debit: 0,
    credit: 620.0,
  },
  {
    id: "LE-99040",
    ts: "2026-09-04 08:22:12.004",
    account: "2000-ESC",
    ref: "ESC-4799",
    narrative: "Timeout refund to buyer — no delivery confirmation",
    debit: 0,
    credit: 6_320,
  },
  {
    id: "LE-99041",
    ts: "2026-09-04 08:22:12.004",
    account: "1100-BIZ",
    ref: "ESC-4799",
    narrative: "Refund credit to buyer trade wallet",
    debit: 6_320,
    credit: 0,
  },
];

export const disputes: Dispute[] = [
  {
    id: "DSP-0312",
    escrow: "ESC-4805",
    claimant: "Rubavu Agro Traders",
    respondent: "Eldoret Grain Union",
    frozen: 9_760,
    opened: "2026-09-06 10:18:44",
    reason: "Short delivery — 12 of 40 tonnes missing on arrival at Gatuna",
    stage: "ARBITER_REVIEW",
    evidence: [
      { name: "Bill of lading BL-77219", kind: "BOL", hash: "0x3f9a…c218", filed: "2026-09-06" },
      { name: "Border weighbridge log", kind: "DELIVERY", hash: "0x71bd…04e7", filed: "2026-09-07" },
      { name: "WhatsApp transcript (redacted)", kind: "COMMS", hash: "0xa402…9f13", filed: "2026-09-08" },
    ],
  },
  {
    id: "DSP-0309",
    escrow: "ESC-4780",
    claimant: "Kigali Building Supply",
    respondent: "Jinja Cement Depot",
    frozen: 4_200,
    opened: "2026-09-02 15:40:02",
    reason: "Goods damaged in transit, supplier disputes liability",
    stage: "EVIDENCE",
    evidence: [
      { name: "Damage photo set (9 files)", kind: "DELIVERY", hash: "0x5cc1…7a10", filed: "2026-09-03" },
      { name: "Insurance claim notice", kind: "BOL", hash: "0x9d20…bb54", filed: "2026-09-04" },
    ],
  },
  {
    id: "DSP-0298",
    escrow: "ESC-4741",
    claimant: "Nakuru Textile Works",
    respondent: "Arusha Cotton Mills",
    frozen: 0,
    opened: "2026-08-18 09:05:29",
    reason: "Quality grade mismatch against invoice specification",
    stage: "RESOLVED",
    verdict: "Split settlement: 62% released to supplier, 38% refunded to buyer.",
    evidence: [
      { name: "Independent grading report", kind: "BOL", hash: "0x88fa…1d92", filed: "2026-08-19" },
    ],
  },
];

export const traders: Trader[] = [
  {
    id: "TRD-1041",
    name: "Gikondo Coffee Collective",
    country: "Rwanda",
    tier: 2,
    status: "VERIFIED",
    msisdn: "+250 78* *** 412",
    nationalId: "1198…7742 (verified)",
    registration: "RDB 107724881",
    sanctions: "CLEAR",
    volume30d: 184_300,
    notes: "Cross-border volume above Tier 2 threshold; annual review due 2027-03.",
  },
  {
    id: "TRD-1102",
    name: "Nairobi Fresh Distributors Ltd",
    country: "Kenya",
    tier: 2,
    status: "VERIFIED",
    msisdn: "+254 72* *** 190",
    nationalId: "3021…5518 (verified)",
    registration: "CPR/2019/338201",
    sanctions: "CLEAR",
    volume30d: 221_880,
    notes: "Directors screened against OFAC, UN, EU consolidated lists.",
  },
  {
    id: "TRD-1188",
    name: "Rubavu Agro Traders",
    country: "Rwanda",
    tier: 1,
    status: "FLAGGED",
    msisdn: "+250 73* *** 008",
    nationalId: "1199…3310 (verified)",
    registration: "—",
    sanctions: "REVIEW",
    volume30d: 41_620,
    notes: "Volume approaching Tier 2 trigger while an arbitration is open.",
  },
  {
    id: "TRD-1207",
    name: "Jinja Cement Depot",
    country: "Uganda",
    tier: 1,
    status: "VERIFIED",
    msisdn: "+256 77* *** 645",
    nationalId: "CM88…2201 (verified)",
    registration: "—",
    sanctions: "CLEAR",
    volume30d: 28_740,
    notes: "Eligible for Tier 2 upgrade on submission of registration certificate.",
  },
  {
    id: "TRD-1244",
    name: "Arusha Cotton Mills",
    country: "Tanzania",
    tier: 0,
    status: "PENDING",
    msisdn: "+255 75* *** 331",
    nationalId: "—",
    registration: "—",
    sanctions: "CLEAR",
    volume30d: 0,
    notes: "Browsing tier only. Cannot fund escrow until phone + ID check passes.",
  },
];

export interface ScoreFactor {
  key: string;
  label: string;
  weight: number;
  value: number;
  detail: string;
}

export const scoreFactors: ScoreFactor[] = [
  {
    key: "cycles",
    label: "Completed settlement cycles",
    weight: 30,
    value: 92,
    detail: "47 of 51 escrows reached a terminal released state.",
  },
  {
    key: "mutual",
    label: "Mutual release rate",
    weight: 25,
    value: 88,
    detail: "41 releases by dual confirmation, 6 by timeout auto-release.",
  },
  {
    key: "arbitration",
    label: "Arbitration record",
    weight: 20,
    value: 80,
    detail: "2 disputes filed, 1 resolved in favour, 1 split settlement.",
  },
  {
    key: "volume",
    label: "Volume progression",
    weight: 15,
    value: 74,
    detail: "Trailing 90-day volume up 38% with no single-month spike above 2.5x.",
  },
  {
    key: "diversity",
    label: "Counterparty diversity",
    weight: 10,
    value: 66,
    detail: "14 distinct counterparties across 3 corridors; top partner is 29% of volume.",
  },
];

export const trustScore = Math.round(
  scoreFactors.reduce((sum, f) => sum + (f.weight * f.value) / 100, 0) * 8.5,
);

export const pacs008 = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>VUKA-RWKE-20260912-0004821</MsgId>
      <CreDtTm>2026-09-12T07:55:48Z</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf><SttlmMtd>CLRG</SttlmMtd><ClrSys><Prtry>VUKA-ESCROW</Prtry></ClrSys></SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId><InstrId>ESC-4830</InstrId><EndToEndId>INV-UG-3301</EndToEndId></PmtId>
      <IntrBkSttlmAmt Ccy="USD">27500.00</IntrBkSttlmAmt>
      <ChrgBr>SHAR</ChrgBr>
      <Dbtr><Nm>Kigali Building Supply</Nm><CtryOfRes>RW</CtryOfRes></Dbtr>
      <DbtrAgt><FinInstnId><Othr><Id>MTN-MOMO-RW</Id></Othr></FinInstnId></DbtrAgt>
      <Cdtr><Nm>Jinja Cement Depot</Nm><CtryOfRes>UG</CtryOfRes></Cdtr>
      <CdtrAgt><FinInstnId><Othr><Id>AIRTEL-MONEY-UG</Id></Othr></FinInstnId></CdtrAgt>
      <RmtInf><Strd><RfrdDocInf><Nb>INV-UG-3301</Nb></RfrdDocInf></Strd></RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;

export function usd(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
