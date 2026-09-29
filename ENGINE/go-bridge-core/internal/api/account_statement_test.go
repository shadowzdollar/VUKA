package api_test

import (
	"encoding/json"
	"encoding/xml"
	"net/http"
	"strings"
	"testing"
	"time"

	"vuka/go-bridge-core/internal/ledger"
	"vuka/go-bridge-core/internal/testutil"
)

func TestAccountStatement_JSON_BalancesReconcile(t *testing.T) {
	h := newServer(t)
	_, acct := setupTrader(t, h, "Statement User", "+250****0201", "RWF", 0)

	before := time.Now().UTC().Add(-time.Minute)

	fund := func(amount float64) {
		rec := doJSON(t, h, "POST", "/api/accounts/"+acct+"/fund", map[string]string{
			"Idempotency-Key": testutil.UniqueID(),
		}, ledger.FundRequest{Amount: amount, Currency: "RWF"})
		if rec.Code != http.StatusCreated {
			t.Fatalf("fund: %d %s", rec.Code, rec.Body.String())
		}
	}
	fund(10000)
	fund(2500)

	after := time.Now().UTC().Add(time.Minute)
	path := "/api/accounts/" + acct + "/statement?format=json&from=" +
		before.Format(time.RFC3339) + "&to=" + after.Format(time.RFC3339)
	rec := doJSON(t, h, "GET", path, nil, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("statement: %d %s", rec.Code, rec.Body.String())
	}

	var stmt ledger.Statement
	if err := json.Unmarshal(rec.Body.Bytes(), &stmt); err != nil {
		t.Fatalf("unmarshal statement: %v", err)
	}
	if stmt.OpeningBalance != 0 {
		t.Errorf("opening balance = %v, want 0 (nothing before `before`)", stmt.OpeningBalance)
	}
	if len(stmt.Entries) != 2 {
		t.Fatalf("entries = %d, want 2", len(stmt.Entries))
	}
	sum := 0.0
	for _, e := range stmt.Entries {
		sum += e.Amount
	}
	if got := stmt.OpeningBalance + sum; got != stmt.ClosingBalance {
		t.Errorf("opening (%v) + entries (%v) = %v, want closing balance %v",
			stmt.OpeningBalance, sum, got, stmt.ClosingBalance)
	}
	if stmt.ClosingBalance != 12500 {
		t.Errorf("closing balance = %v, want 12500", stmt.ClosingBalance)
	}
}

// A statement window that excludes an entry must exclude it from both the entry list AND the
// opening balance carried into a *later* window — i.e. the three-query split in ledger.Statement
// must actually reconcile across two adjacent calls, not just within one.
func TestAccountStatement_OpeningBalanceCarriesForward(t *testing.T) {
	h := newServer(t)
	_, acct := setupTrader(t, h, "Carry Forward User", "+250****0202", "RWF", 0)

	rec := doJSON(t, h, "POST", "/api/accounts/"+acct+"/fund", map[string]string{
		"Idempotency-Key": testutil.UniqueID(),
	}, ledger.FundRequest{Amount: 5000, Currency: "RWF"})
	if rec.Code != http.StatusCreated {
		t.Fatalf("fund: %d %s", rec.Code, rec.Body.String())
	}
	t1 := time.Now().UTC().Add(time.Second)

	rec = doJSON(t, h, "GET", "/api/accounts/"+acct+"/statement?format=json&from="+
		t1.Format(time.RFC3339)+"&to="+t1.Add(time.Minute).Format(time.RFC3339), nil, nil)
	var later ledger.Statement
	if err := json.Unmarshal(rec.Body.Bytes(), &later); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(later.Entries) != 0 {
		t.Errorf("later window entries = %d, want 0 (funding happened before it)", len(later.Entries))
	}
	if later.OpeningBalance != 5000 {
		t.Errorf("later window opening balance = %v, want 5000 (carried from the earlier fund)", later.OpeningBalance)
	}
}

func TestAccountStatement_Camt053IsWellFormedAndReferencesTheInvoice(t *testing.T) {
	h := newServer(t)
	_, acct := setupTrader(t, h, "Camt User", "+250****0203", "RWF", 20000)
	before := time.Now().UTC().Add(-time.Minute)
	after := time.Now().UTC().Add(time.Minute)

	path := "/api/accounts/" + acct + "/statement?from=" + before.Format(time.RFC3339) + "&to=" + after.Format(time.RFC3339)
	rec := doJSON(t, h, "GET", path, nil, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("statement: %d %s", rec.Code, rec.Body.String())
	}
	if ct := rec.Header().Get("Content-Type"); !strings.Contains(ct, "xml") {
		t.Errorf("Content-Type = %q, want xml (default format)", ct)
	}

	body := rec.Body.String()
	var doc struct {
		XMLName xml.Name `xml:"Document"`
	}
	if err := xml.Unmarshal([]byte(body), &doc); err != nil {
		t.Fatalf("camt.053 is not well-formed XML: %v\n%s", err, body)
	}
	for _, want := range []string{"<BkToCstmrStmt>", "<Stmt>", "<Ntry>", `CdOrPrtry><Cd>OPBD`, `CdOrPrtry><Cd>CLBD`, "camt.053.001.08"} {
		if !strings.Contains(body, want) {
			t.Errorf("statement XML missing %q\n%s", want, body)
		}
	}
}

func TestAccountStatement_InvalidRange_400(t *testing.T) {
	h := newServer(t)
	_, acct := setupTrader(t, h, "Range User", "+250****0204", "RWF", 0)
	now := time.Now().UTC()
	rec := doJSON(t, h, "GET", "/api/accounts/"+acct+
		"/statement?from="+now.Format(time.RFC3339)+"&to="+now.Add(-time.Hour).Format(time.RFC3339), nil, nil)
	if rec.Code != http.StatusBadRequest {
		t.Errorf("from-after-to statement = %d, want 400", rec.Code)
	}
}
