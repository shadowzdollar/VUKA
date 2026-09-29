package api

// ISO 20022 camt.053.001.08 (Bank-to-Customer Statement) rendering for a VUKA account. This is the
// engine's own canonical statement — unlike the frontend's client-side pacs.008 demo rendering
// (FRONTEND/src/lib/pacs008.ts), this is built from the authoritative ledger data server-side and
// is what a bank, auditor or accounting system integrating with VUKA would actually consume.
//
// Structural well-formedness and the mandatory elements are covered by
// TestAccountStatementCamt053IsWellFormed; this is NOT XSD-validated, and that is documented in
// SECURITY.md and API.md rather than implied.

import (
	"fmt"
	"strings"
	"time"

	"vuka/go-bridge-core/internal/ledger"
)

const camt053NS = "urn:iso:std:iso:20022:tech:xsd:camt.053.001.08"

func xmlEscape(s string) string {
	r := strings.NewReplacer(`&`, "&amp;", `<`, "&lt;", `>`, "&gt;", `"`, "&quot;", `'`, "&apos;")
	return r.Replace(s)
}

func iso(t time.Time) string {
	return t.UTC().Format("2006-01-02T15:04:05.000Z")
}

func creditDebit(amount float64) string {
	if amount < 0 {
		return "DBIT"
	}
	return "CRDT"
}

func absAmount(amount float64) float64 {
	if amount < 0 {
		return -amount
	}
	return amount
}

// buildCamt053 renders a Statement as a camt.053.001.08 document. Money values are formatted to 2
// decimal places, matching the currencies VUKA supports (none of the ten launch currencies are
// zero- or three-decimal ISO 4217 currencies).
func buildCamt053(stmt *ledger.Statement) []byte {
	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	fmt.Fprintf(&b, `<Document xmlns="%s">`+"\n", camt053NS)
	b.WriteString("  <BkToCstmrStmt>\n")

	// Group header: one statement message, generated now.
	b.WriteString("    <GrpHdr>\n")
	fmt.Fprintf(&b, "      <MsgId>VUKA-STMT-%s-%d</MsgId>\n", stmt.Account.ID[:8], time.Now().UnixNano())
	fmt.Fprintf(&b, "      <CreDtTm>%s</CreDtTm>\n", iso(time.Now()))
	b.WriteString("    </GrpHdr>\n")

	b.WriteString("    <Stmt>\n")
	fmt.Fprintf(&b, "      <Id>VUKA-%s-%s</Id>\n", stmt.Account.ID[:8], stmt.To.Format("20060102"))
	b.WriteString("      <ElctrncSeqNb>1</ElctrncSeqNb>\n")
	fmt.Fprintf(&b, "      <CreDtTm>%s</CreDtTm>\n", iso(time.Now()))
	fmt.Fprintf(&b, "      <FrToDt><FrDtTm>%s</FrDtTm><ToDtTm>%s</ToDtTm></FrToDt>\n", iso(stmt.From), iso(stmt.To))

	// Account identification — VUKA has no IBAN/BIC; the account UUID is the "Other" identifier,
	// same convention as the account's own REST id.
	b.WriteString("      <Acct>\n")
	fmt.Fprintf(&b, "        <Id><Othr><Id>%s</Id></Othr></Id>\n", xmlEscape(stmt.Account.ID))
	fmt.Fprintf(&b, "        <Ccy>%s</Ccy>\n", xmlEscape(stmt.Account.Currency))
	fmt.Fprintf(&b, "        <Ownr><Id><Othr><Id>%s</Id></Othr></Id></Ownr>\n", xmlEscape(stmt.Account.UserID))
	fmt.Fprintf(&b, "        <Svcr><FinInstnId><Othr><Id>VUKA-LEDGER</Id></Othr></FinInstnId></Svcr>\n")
	b.WriteString("      </Acct>\n")

	// Opening / closing balances. Type codes per ISO 20022 ExternalBalanceSubType1Code / Balance
	// type: OPBD (opening booked) and CLBD (closing booked).
	writeBalance := func(code string, amount float64, dt time.Time) {
		b.WriteString("      <Bal>\n")
		fmt.Fprintf(&b, "        <Tp><CdOrPrtry><Cd>%s</Cd></CdOrPrtry></Tp>\n", code)
		fmt.Fprintf(&b, "        <Amt Ccy=\"%s\">%.2f</Amt>\n", xmlEscape(stmt.Account.Currency), absAmount(amount))
		fmt.Fprintf(&b, "        <CdtDbtInd>%s</CdtDbtInd>\n", creditDebit(amount))
		fmt.Fprintf(&b, "        <Dt><DtTm>%s</DtTm></Dt>\n", iso(dt))
		b.WriteString("      </Bal>\n")
	}
	writeBalance("OPBD", stmt.OpeningBalance, stmt.From)
	writeBalance("CLBD", stmt.ClosingBalance, stmt.To)

	// One Ntry per ledger entry, in order. NtryDtls carries the parent transfer's invoice/reference
	// so a reader can trace a statement line back to the trade it settles.
	for _, e := range stmt.Entries {
		b.WriteString("      <Ntry>\n")
		fmt.Fprintf(&b, "        <NtryRef>%s</NtryRef>\n", xmlEscape(e.ID))
		fmt.Fprintf(&b, "        <Amt Ccy=\"%s\">%.2f</Amt>\n", xmlEscape(stmt.Account.Currency), absAmount(e.Amount))
		fmt.Fprintf(&b, "        <CdtDbtInd>%s</CdtDbtInd>\n", creditDebit(e.Amount))
		fmt.Fprintf(&b, "        <Sts><Cd>BOOK</Cd></Sts>\n")
		fmt.Fprintf(&b, "        <BookgDt><DtTm>%s</DtTm></BookgDt>\n", iso(e.CreatedAt))
		fmt.Fprintf(&b, "        <ValDt><DtTm>%s</DtTm></ValDt>\n", iso(e.CreatedAt))
		b.WriteString("        <NtryDtls><TxDtls>\n")
		fmt.Fprintf(&b, "          <Refs><TxId>%s</TxId>", xmlEscape(e.TransactionID))
		if e.Reference != nil && *e.Reference != "" {
			fmt.Fprintf(&b, "<EndToEndId>%s</EndToEndId>", xmlEscape(*e.Reference))
		}
		b.WriteString("</Refs>\n")
		if e.InvoiceNumber != nil && *e.InvoiceNumber != "" {
			fmt.Fprintf(&b, "          <RmtInf><Ustrd>Invoice %s</Ustrd></RmtInf>\n", xmlEscape(*e.InvoiceNumber))
		}
		b.WriteString("        </TxDtls></NtryDtls>\n")
		b.WriteString("      </Ntry>\n")
	}

	b.WriteString("    </Stmt>\n")
	b.WriteString("  </BkToCstmrStmt>\n")
	b.WriteString("</Document>\n")
	return []byte(b.String())
}
