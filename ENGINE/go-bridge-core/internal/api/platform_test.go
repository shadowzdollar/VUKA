package api_test

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"vuka/go-bridge-core/internal/adapters"
	"vuka/go-bridge-core/internal/analytics"
	"vuka/go-bridge-core/internal/api"
	"vuka/go-bridge-core/internal/idempotency"
	"vuka/go-bridge-core/internal/identity"
	"vuka/go-bridge-core/internal/ledger"
	"vuka/go-bridge-core/internal/providers"
	"vuka/go-bridge-core/internal/risk"
	"vuka/go-bridge-core/internal/testutil"
)

type platform struct {
	pool *pgxpool.Pool
	h    http.Handler
	svc  *ledger.Service
	cat  *providers.Catalog
}

// newPlatform builds the full pan-African stack: catalog rails, currency-driven
// payout rails, settlement accounts for every currency, KYC limits and screening.
func newPlatform(t *testing.T, screener risk.Screener) platform {
	t.Helper()
	pool := testutil.TestPool(t)
	cat, err := providers.NewAfricaCatalog(providers.AfricaOptions{})
	if err != nil {
		t.Fatal(err)
	}
	reg := testutilRegistry(cat)
	svc := ledger.NewService(pool, idempotency.NewStore(pool), reg)
	rails := map[string]string{}
	for _, c := range providers.Countries {
		rails[c.Currency] = c.ProviderID
	}
	svc.SetCurrencyRails(rails)
	if err := svc.EnsureSettlementAccounts(context.Background(), providers.SupportedCurrencies(nil)...); err != nil {
		t.Fatal(err)
	}
	rs := risk.NewService(pool, providers.USDRates{PerUSD: cat.ReferenceRates(), Label: "test"}, nil)
	h := api.NewServerWithRuntimeOptionsAndProviderExecution(svc, testutil.Logger(), []string{"http://localhost:5173"},
		nil, nil, nil, 0, 0, false, nil, nil, nil, false, nil,
		api.WithProviderCatalog(cat), api.WithRisk(rs, screener),
		api.WithAnalytics(analytics.NewService(pool, providers.USDRates{PerUSD: cat.ReferenceRates(), Label: "test"}, "test")),
		api.WithPublicConfig(api.PublicConfig{Environment: "test", ChainID: 80002, EscrowContract: "0xabc", ReconciliationEnabled: true}))
	return platform{pool: pool, h: h, svc: svc, cat: cat}
}

func (p platform) get(t *testing.T, path, trader string) (int, map[string]any) {
	t.Helper()
	rec := doJSON(t, p.h, "GET", path, map[string]string{"X-Trader-ID": trader}, nil)
	var out map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	return rec.Code, out
}

func errCode(m map[string]any) string {
	if e, ok := m["error"].(map[string]any); ok {
		s, _ := e["code"].(string)
		return s
	}
	return ""
}

func (p platform) pay(t *testing.T, trader, key string, src, dst string, amount float64, cur string) (int, map[string]any) {
	t.Helper()
	rec := doJSON(t, p.h, "POST", "/api/transfers", map[string]string{"Idempotency-Key": key, "X-Trader-ID": trader},
		ledger.TransferRequest{SourceAccountID: src, DestinationAccountID: dst, Amount: amount, Currency: cur})
	var out map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	return rec.Code, out
}

func TestPublicConfigDescribesThePanAfricanDeployment(t *testing.T) {
	p := newPlatform(t, nil)
	rec := doJSON(t, p.h, "GET", "/api/config/public", nil, nil)
	if rec.Code != 200 {
		t.Fatalf("status %d: %s", rec.Code, rec.Body.String())
	}
	var cfg struct {
		Countries      []struct{ Code, Currency string } `json:"countries"`
		CorridorCount  int                               `json:"corridor_count"`
		RateConvention string                            `json:"rate_convention"`
		Chain          struct {
			ChainID  int64  `json:"chain_id"`
			Contract string `json:"escrow_contract"`
		} `json:"chain"`
		Features map[string]bool `json:"features"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &cfg); err != nil {
		t.Fatal(err)
	}
	if len(cfg.Countries) != 10 || cfg.CorridorCount != 90 || cfg.RateConvention != "source_per_destination" {
		t.Fatalf("config = %+v", cfg)
	}
	if cfg.Chain.ChainID != 80002 || cfg.Chain.Contract != "0xabc" || !cfg.Features["kyc_limits"] || cfg.Features["live_providers"] {
		t.Fatalf("chain/features = %+v %+v", cfg.Chain, cfg.Features)
	}
	// Security headers ride on every API response.
	if rec.Header().Get("X-Content-Type-Options") != "nosniff" || rec.Header().Get("Content-Security-Policy") == "" ||
		rec.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("missing hardening headers: %v", rec.Header())
	}
}

func TestKYCTierLimitsAreEnforcedAndLiftedByVerification(t *testing.T) {
	p := newPlatform(t, nil)
	alice, aliceBiz := setupTrader(t, p.h, "Alice Trader", "+250700100001", "RWF", 5_000_000)
	bob, bobBiz := setupTrader(t, p.h, "Bob Supplier", "+250700100002", "RWF", 0)

	// PENDING tier: USD 200/txn ~ RWF 276,000.
	code, body := p.pay(t, alice.User.ID, "kyc-over-"+testutil.UniqueID(), aliceBiz, bobBiz, 300_000, "RWF")
	if code != http.StatusUnprocessableEntity || errCode(body) != "kyc_limit_exceeded" {
		t.Fatalf("over-limit payment = %d %v", code, body)
	}
	if code, body = p.pay(t, alice.User.ID, "kyc-ok-"+testutil.UniqueID(), aliceBiz, bobBiz, 100_000, "RWF"); code != http.StatusCreated {
		t.Fatalf("within-limit payment = %d %v", code, body)
	}

	// Raw document-looking references are refused: evidence must be held elsewhere.
	if rec := doJSON(t, p.h, "POST", "/api/trader/kyc", map[string]string{"X-Trader-ID": alice.User.ID},
		map[string]string{"verification_type": "identity", "reference": "data:image/png;base64,AAAA"}); rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("raw document reference = %d, want 422", rec.Code)
	}
	// Trader files verification metadata; the compliance team verifies it.
	rec := doJSON(t, p.h, "POST", "/api/trader/kyc", map[string]string{"X-Trader-ID": alice.User.ID},
		map[string]string{"verification_type": "identity", "reference": "hash:sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", "evidence_label": "National ID (metadata only)"})
	if rec.Code != http.StatusCreated {
		t.Fatalf("submit kyc = %d %s", rec.Code, rec.Body.String())
	}
	var v struct {
		ID string `json:"id"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &v)
	if _, err := identity.NewService(p.pool).DecideVerification(context.Background(), v.ID, "compliance.officer@vuka.local",
		identity.DecideVerificationRequest{Status: "verified", Rationale: "ID matched registry"}); err != nil {
		t.Fatalf("decide: %v", err)
	}
	if _, body = p.get(t, "/api/trader/limits", alice.User.ID); body["kyc_status"] != "VERIFIED" {
		t.Fatalf("standing after verification = %v", body)
	}
	if code, body = p.pay(t, alice.User.ID, "kyc-after-"+testutil.UniqueID(), aliceBiz, bobBiz, 300_000, "RWF"); code != http.StatusCreated {
		t.Fatalf("payment after verification = %d %v", code, body)
	}
	_ = bob
}

func TestReplayOfAnExecutedPaymentIsNotBlockedByLimits(t *testing.T) {
	p := newPlatform(t, nil)
	a, aBiz := setupTrader(t, p.h, "Carol", "+250700100003", "RWF", 2_000_000)
	_, bBiz := setupTrader(t, p.h, "Dan", "+250700100004", "RWF", 0)
	key := "replay-" + testutil.UniqueID()
	if code, body := p.pay(t, a.User.ID, key, aBiz, bBiz, 250_000, "RWF"); code != http.StatusCreated {
		t.Fatalf("first = %d %v", code, body)
	}
	// 250k + 250k would breach the PENDING daily limit if re-evaluated; a replay must return the original.
	code, body := p.pay(t, a.User.ID, key, aBiz, bBiz, 250_000, "RWF")
	if code != http.StatusOK || body["replayed"] != true {
		t.Fatalf("replay = %d %v, want 200 replayed", code, body)
	}
}

func TestSanctionsHitBlocksBeforeAnyMoneyMoves(t *testing.T) {
	p := newPlatform(t, risk.SandboxScreener{Deny: []string{"Blocked Trading"}, Review: []string{"Review Me"}})
	a, aBiz := setupTrader(t, p.h, "Eve Honest", "+250700100005", "RWF", 500_000)
	_, badBiz := setupTrader(t, p.h, "Acme Blocked Trading Ltd", "+250700100006", "RWF", 0)
	_, revBiz := setupTrader(t, p.h, "Review Me Co", "+250700100007", "RWF", 0)

	code, body := p.pay(t, a.User.ID, "sx-"+testutil.UniqueID(), aBiz, badBiz, 10_000, "RWF")
	if code != http.StatusForbidden || errCode(body) != "sanctions_hit" {
		t.Fatalf("sanctions payment = %d %v", code, body)
	}
	msg := fmt.Sprint(body)
	if containsAny(msg, "Blocked", "sandbox", "list") {
		t.Fatalf("rejection leaks screening detail (tipping off): %s", msg)
	}
	code, body = p.pay(t, a.User.ID, "sr-"+testutil.UniqueID(), aBiz, revBiz, 10_000, "RWF")
	if code != http.StatusForbidden || errCode(body) != "compliance_review_required" {
		t.Fatalf("review payment = %d %v", code, body)
	}
	bal, _ := p.svc.GetBalance(context.Background(), aBiz)
	if bal.Amount != 500_000 {
		t.Fatalf("balance moved to %v despite the block", bal.Amount)
	}
}

func containsAny(s string, subs ...string) bool {
	for _, x := range subs {
		for i := 0; i+len(x) <= len(s); i++ {
			if s[i:i+len(x)] == x {
				return true
			}
		}
	}
	return false
}

func TestCrossBorderSettlesAtTheFirmQuoteRateAcrossAfricanCurrencies(t *testing.T) {
	p := newPlatform(t, nil)
	// Verified-level amounts stay under the PENDING cap: RWF 200,000 ~ USD 145.
	rw, rwBiz := setupTrader(t, p.h, "Rwanda Buyer", "+250700100008", "RWF", 1_000_000)
	ng, ngBiz := setupTrader(t, p.h, "Lagos Supplier", "+234700100009", "NGN", 0)

	corridor := "rw-rwf-ng-ngn"
	amount := 200_000.0
	rec := doJSON(t, p.h, "GET", fmt.Sprintf("/api/quotes?corridor_id=%s&amount_minor=%d", corridor, int64(amount*100)), map[string]string{"X-Trader-ID": rw.User.ID}, nil)
	if rec.Code != 200 {
		t.Fatalf("quote = %d %s", rec.Code, rec.Body.String())
	}
	var q struct {
		Quote struct {
			ID   string  `json:"id"`
			Rate float64 `json:"rate"`
			Inv  float64 `json:"inverse_rate"`
		} `json:"quote"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &q)
	wantRate := 1380.0 / 1550.0
	if math.Abs(q.Quote.Rate-wantRate) > 1e-9 {
		t.Fatalf("rate = %v want %v", q.Quote.Rate, wantRate)
	}

	rec = doJSON(t, p.h, "POST", "/api/transfers/cross-border", map[string]string{"Idempotency-Key": "xb-" + testutil.UniqueID(), "X-Trader-ID": rw.User.ID},
		ledger.CrossBorderRequest{SourceAccountID: rwBiz, DestinationAccountID: ngBiz, Amount: amount, CurrencyFrom: "RWF", CurrencyTo: "NGN", QuoteID: q.Quote.ID})
	if rec.Code != http.StatusCreated {
		t.Fatalf("cross-border = %d %s", rec.Code, rec.Body.String())
	}
	bal, _ := p.svc.GetBalance(context.Background(), ngBiz)
	want := math.Round(amount/wantRate*10000) / 10000
	if math.Abs(bal.Amount-want) > 0.01 {
		t.Fatalf("NGN credited %v, want %v (amount / quoted rate)", bal.Amount, want)
	}
	// Roughly: RWF 200,000 (~USD 145) must land as ~NGN 224,638, not an inverted figure.
	if bal.Amount < 200_000 || bal.Amount > 250_000 {
		t.Fatalf("NGN credited %v is implausible for RWF 200,000", bal.Amount)
	}

	// A forged/foreign rate is refused.
	rec = doJSON(t, p.h, "POST", "/api/transfers/cross-border", map[string]string{"Idempotency-Key": "xb2-" + testutil.UniqueID(), "X-Trader-ID": rw.User.ID},
		ledger.CrossBorderRequest{SourceAccountID: rwBiz, DestinationAccountID: ngBiz, Amount: amount, CurrencyFrom: "RWF", CurrencyTo: "NGN", QuoteID: q.Quote.ID, FxRate: 0.5})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("mismatched fx_rate = %d, want 422", rec.Code)
	}
	_ = ng
}

func TestTraderTrustScoreIsServedFromTheLedger(t *testing.T) {
	p := newPlatform(t, nil)
	a, aBiz := setupTrader(t, p.h, "Trusty", "+250700100010", "RWF", 500_000)
	code, body := p.get(t, "/api/trader/trust-score", a.User.ID)
	if code != 200 || body["band"] != "Unrated" {
		t.Fatalf("new trader trust = %d %v", code, body)
	}
	_, bBiz := setupTrader(t, p.h, "Counterparty", "+250700100011", "RWF", 0)
	if code, b := p.pay(t, a.User.ID, "tr-"+testutil.UniqueID(), aBiz, bBiz, 50_000, "RWF"); code != http.StatusCreated {
		t.Fatalf("pay = %d %v", code, b)
	}
	_, body = p.get(t, "/api/trader/trust-score", a.User.ID)
	if body["cycles_scored"].(float64) != 1 {
		t.Fatalf("trust after a payment = %v", body)
	}
}

func TestReadinessAndMetrics(t *testing.T) {
	p := newPlatform(t, nil)
	if rec := doJSON(t, p.h, "GET", "/readyz", nil, nil); rec.Code != 200 {
		t.Fatalf("readyz = %d %s", rec.Code, rec.Body.String())
	}
	_ = doJSON(t, p.h, "GET", "/healthz", nil, nil)
	rec := doJSON(t, p.h, "GET", "/metrics", nil, nil)
	if rec.Code != 200 || !containsAny(rec.Body.String(), "vuka_http_requests_total", "vuka_http_request_duration_seconds") {
		t.Fatalf("metrics = %d %s", rec.Code, rec.Body.String())
	}
}

func TestLoginThrottleLocksAfterRepeatedFailures(t *testing.T) {
	pool := testutil.TestPool(t)
	svc := ledger.NewService(pool, idempotency.NewStore(pool), testutilRegistry(nil))
	authStore := api.NewAuthStore(pool)
	if err := authStore.EnsureSchema(context.Background()); err != nil {
		t.Fatal(err)
	}
	h := api.NewServerWithAuth(svc, testutil.Logger(), nil, authStore)
	phone := "+2507" + testutil.UniqueID()[:9]
	login := func(pw string) *http.Response {
		rec := doJSON(t, h, "POST", "/api/trader/auth/login", nil, map[string]string{"phone": phone, "password": pw})
		return rec.Result()
	}
	for i := 0; i < api.MaxLoginFailures; i++ {
		if r := login("wrong"); r.StatusCode != http.StatusUnauthorized {
			t.Fatalf("attempt %d = %d, want 401", i, r.StatusCode)
		}
	}
	r := login("wrong")
	if r.StatusCode != http.StatusTooManyRequests || r.Header.Get("Retry-After") == "" {
		t.Fatalf("locked attempt = %d retry-after=%q", r.StatusCode, r.Header.Get("Retry-After"))
	}
	_ = time.Second
}

// testutilRegistry registers the catalog's rails (or the legacy pair when cat is nil).
func testutilRegistry(cat *providers.Catalog) *adapters.Registry {
	if cat == nil {
		return testutil.CorridorRegistry()
	}
	reg := adapters.NewRegistry()
	for _, a := range cat.Adapters() {
		reg.Register(a)
	}
	return reg
}

// Regression: signed quote ids exceeded the old quote_id VARCHAR(120), so every
// workflow start failed at the database. This drives a workflow through the real
// Postgres store, invoice-linked, across the rails the catalog selects.
func TestInvoiceLinkedWorkflowRunsThroughPostgresWithASignedQuote(t *testing.T) {
	p := newPlatform(t, nil)
	rw, rwBiz := setupTrader(t, p.h, "Kigali Importer", "+250700100020", "RWF", 500_000)
	_, keBiz := setupTrader(t, p.h, "Nairobi Exporter", "+254700100021", "KES", 0)

	rec := doJSON(t, p.h, "GET", "/api/quotes?corridor_id=rw-rwf-ke-kes&amount_minor=10000000", map[string]string{"X-Trader-ID": rw.User.ID}, nil)
	var q struct {
		Quote struct {
			ID   string  `json:"id"`
			Rate float64 `json:"rate"`
		} `json:"quote"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &q)
	if len(q.Quote.ID) <= 120 {
		t.Fatalf("expected a signed quote id longer than the old column (%d chars)", len(q.Quote.ID))
	}

	rec = doJSON(t, p.h, "POST", "/api/transaction-workflows",
		map[string]string{"Idempotency-Key": "wf-" + testutil.UniqueID(), "X-Trader-ID": rw.User.ID},
		map[string]any{
			"source_account_id": rwBiz, "destination_account_id": keBiz,
			"collection_phone": "+250700100020", "payout_phone": "+254700100021",
			"corridor_id": "rw-rwf-ke-kes", "quote_id": q.Quote.ID, "amount": 100_000,
			"currency_from": "RWF", "currency_to": "KES", "rate": q.Quote.Rate, "invoice_number": "INV-2026-77",
			"provider_authorization_ref": "mtn-auth-ref-test",
		})
	var out struct {
		Workflow struct {
			State, InvoiceNumber, LedgerTransferID, CollectionProvider, PayoutProvider string
		} `json:"workflow"`
		Error string `json:"error"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	// Field names in the payload are snake_case; decode explicitly.
	var raw map[string]map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &raw)
	w := raw["workflow"]
	if rec.Code != http.StatusOK || w["state"] != "COMPLETED" {
		t.Fatalf("workflow = %d %s", rec.Code, rec.Body.String())
	}
	if w["invoice_number"] != "INV-2026-77" || w["collection_provider"] != "mtn-rw" || w["payout_provider"] != "mpesa-ke" {
		t.Fatalf("workflow fields = %v", w)
	}
	// The invoice reference reached the ledger header, so the invoice reads as paid.
	tr, err := p.svc.GetTransfer(context.Background(), w["ledger_transfer_id"].(string))
	if err != nil || tr.InvoiceNumber == nil || *tr.InvoiceNumber != "INV-2026-77" {
		t.Fatalf("ledger transfer invoice = %+v, %v", tr, err)
	}
}

func TestAnalyticsEndpointsAggregateRealLedgerData(t *testing.T) {
	p := newPlatform(t, nil)
	a, aBiz := setupTrader(t, p.h, "Anna Analytics", "+250700100030", "RWF", 800_000)
	_, bBiz := setupTrader(t, p.h, "Ben Counterparty", "+250700100031", "RWF", 0)
	for i, amt := range []float64{20_000, 60_000, 150_000} {
		if code, b := p.pay(t, a.User.ID, fmt.Sprintf("an-%d-%s", i, testutil.UniqueID()), aBiz, bBiz, amt, "RWF"); code != http.StatusCreated {
			t.Fatalf("pay %d = %d %v", i, code, b)
		}
	}
	code, rep := p.get(t, "/api/trader/analytics?days=30", a.User.ID)
	if code != 200 || rep["scope"] != "trader" {
		t.Fatalf("trader analytics = %d %v", code, rep)
	}
	totals := rep["totals"].(map[string]any)
	// RWF 230,000 at the sandbox reference (1380/USD) is ~USD 166.67.
	if got := totals["sent_usd"].(float64); math.Abs(got-166.67) > 0.05 || totals["payments_out"].(float64) != 3 {
		t.Fatalf("sent = %v, out = %v", totals["sent_usd"], totals["payments_out"])
	}
	if totals["cash_in_usd"].(float64) < 500 {
		t.Fatalf("top-up not reported as cash-in: %v", totals["cash_in_usd"])
	}
	if len(rep["daily"].([]any)) != 30 || len(rep["histogram"].([]any)) != 8 {
		t.Fatalf("series shape = %d/%d", len(rep["daily"].([]any)), len(rep["histogram"].([]any)))
	}
	cps := rep["counterparties"].([]any)
	if len(cps) != 1 || cps[0].(map[string]any)["name"] != "Ben Counterparty" {
		t.Fatalf("counterparties = %v", cps)
	}
	// A trader only ever sees their own data: another trader's report excludes these payments.
	_, other := p.get(t, "/api/trader/analytics?days=30", "00000000-0000-0000-0000-000000000000")
	if other["totals"].(map[string]any)["payments"].(float64) != 0 {
		t.Fatalf("report leaked another trader's payments: %v", other["totals"])
	}

	code, plat := p.get(t, "/api/operator/analytics?days=30", "")
	if code != 200 || plat["scope"] != "platform" {
		t.Fatalf("platform analytics = %d %v", code, plat)
	}
	pt := plat["totals"].(map[string]any)
	if pt["payments"].(float64) < 3 || pt["total_traders"].(float64) < 2 || pt["active_traders"].(float64) < 1 {
		t.Fatalf("platform totals = %v", pt)
	}
	if _, ok := plat["kyc"].([]any); !ok {
		t.Fatalf("platform report lacks the KYC distribution: %v", plat)
	}
}

func TestPublicEstimateIsIndicativeUnauthenticatedAndBounded(t *testing.T) {
	p := newPlatform(t, nil)
	rec := doJSON(t, p.h, "GET", "/api/public/estimate?from=RWF&to=KES&amount=100000", nil, nil)
	if rec.Code != 200 {
		t.Fatalf("estimate = %d %s", rec.Code, rec.Body.String())
	}
	var e map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &e)
	if e["indicative"] != true || e["corridor_id"] != "rw-rwf-ke-kes" {
		t.Fatalf("estimate = %v", e)
	}
	if _, has := e["id"]; has {
		t.Fatal("an estimate must not carry a bindable quote id")
	}
	// EAC corridor: 80 bps fee; delivered = (amount - fee) / rate, and KES is the stronger currency.
	if e["fee"].(float64) != 800 || e["delivered"].(float64) >= 100000 || e["delivered"].(float64) < 9000 {
		t.Fatalf("fee/delivered = %v/%v", e["fee"], e["delivered"])
	}
	for _, bad := range []string{"from=RWF&to=KES", "from=RWF&to=KES&amount=-5", "from=XX&to=KES&amount=10", "from=RWF&to=KES&amount=abc"} {
		if rc := doJSON(t, p.h, "GET", "/api/public/estimate?"+bad, nil, nil); rc.Code != http.StatusBadRequest {
			t.Errorf("%q = %d, want 400", bad, rc.Code)
		}
	}
	if rc := doJSON(t, p.h, "GET", "/api/public/estimate?from=RWF&to=USD&amount=10", nil, nil); rc.Code != http.StatusNotFound {
		t.Errorf("unknown corridor = %d, want 404", rc.Code)
	}
	over := doJSON(t, p.h, "GET", "/api/public/estimate?from=RWF&to=KES&amount=999999999", nil, nil)
	if over.Code != http.StatusUnprocessableEntity || !containsAny(over.Body.String(), "max_amount") {
		t.Errorf("over-limit estimate = %d %s", over.Code, over.Body.String())
	}
}
