import type { Transfer } from "@/lib/api/types";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const MNO: Record<string, string> = {
  RWF: "MTN-MOMO-RW",
  KES: "MPESA-KE",
  UGX: "MTN-MOMO-UG",
  TZS: "MPESA-TZ",
};

export interface Pacs008Parties {
  debtorName: string;
  creditorName: string;
  /** Currency of the creditor leg (defaults to the transfer currency). */
  creditorCurrency?: string;
}

/**
 * Renders a ledger transfer as an ISO 20022 pacs.008.001.08 FIToFICstmrCdtTrf message. This is a
 * client-side rendering of data the engine already holds; the authoritative translation/validation
 * lives in the Python ISO gateway (ENGINE/python-iso-gateway), which is a separate service.
 */
export function buildPacs008(t: Transfer, parties: Pacs008Parties): string {
  const to = parties.creditorCurrency ?? t.currency;
  const created = new Date(t.created_at).toISOString().replace(/\.\d+Z$/, "Z");
  const e2e = t.invoice_number ?? t.id;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>VUKA-${esc(t.id.replace(/-/g, "").slice(0, 20).toUpperCase())}</MsgId>
      <CreDtTm>${created}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf><SttlmMtd>CLRG</SttlmMtd><ClrSys><Prtry>VUKA-LEDGER</Prtry></ClrSys></SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId><InstrId>${esc(t.id)}</InstrId><EndToEndId>${esc(e2e)}</EndToEndId></PmtId>
      <IntrBkSttlmAmt Ccy="${esc(t.currency)}">${t.amount.toFixed(2)}</IntrBkSttlmAmt>
      <ChrgBr>SHAR</ChrgBr>
      <Dbtr><Nm>${esc(parties.debtorName)}</Nm></Dbtr>
      <DbtrAgt><FinInstnId><Othr><Id>${MNO[t.currency] ?? "VUKA-LEDGER"}</Id></Othr></FinInstnId></DbtrAgt>
      <Cdtr><Nm>${esc(parties.creditorName)}</Nm></Cdtr>
      <CdtrAgt><FinInstnId><Othr><Id>${MNO[to] ?? "VUKA-LEDGER"}</Id></Othr></FinInstnId></CdtrAgt>${
        t.invoice_number
          ? `\n      <RmtInf><Strd><RfrdDocInf><Nb>${esc(t.invoice_number)}</Nb></RfrdDocInf></Strd></RmtInf>`
          : ""
      }
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
}

const REQUIRED = [
  "MsgId",
  "CreDtTm",
  "NbOfTxs",
  "InstrId",
  "EndToEndId",
  "IntrBkSttlmAmt",
  "Dbtr",
  "Cdtr",
];

export interface StructuralCheck {
  ok: boolean;
  problems: string[];
}

/**
 * Well-formedness plus presence of the mandatory pacs.008 elements. This is NOT XSD validation;
 * it says so in the UI.
 */
export function structuralCheck(xml: string): StructuralCheck {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    return { ok: false, problems: ["XML is not well-formed"] };
  }
  const problems = REQUIRED.filter((tag) => doc.getElementsByTagName(tag).length === 0).map(
    (tag) => `Missing mandatory element <${tag}>`,
  );
  return { ok: problems.length === 0, problems };
}
