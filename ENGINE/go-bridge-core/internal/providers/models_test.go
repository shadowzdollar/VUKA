package providers

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"math"
	"strings"
	"testing"
	"time"

	"vuka/go-bridge-core/internal/adapters"
)

func validCorridor() CorridorConfig {
	now := time.Now().UTC()
	return CorridorConfig{
		ID: "rw-rwf-ke-kes", FromCountry: "RW", ToCountry: "KE",
		FromCurrency: "RWF", ToCurrency: "KES", ProviderID: "mpesa-ke",
		FeesBps: 100, MinAmountMinor: 1, MaxAmountMinor: 1000, DailyLimitMinor: 2000,
		LiquidityOwner: "treasury", OperationsOwner: "ops", Enabled: true,
		FX: FXQuote{Rate: 0.95, Source: "fixture", QuoteID: "q1", QuotedAt: now, ExpiresAt: now.Add(time.Hour)},
	}
}

func TestCatalogContractAndCorridorPolicy(t *testing.T) {
	c := NewCatalog()
	a := adapters.NewMpesaAdapter(0, 0, "success", time.Second)
	if err := c.RegisterProvider(ProviderConfig{
		ID: "mpesa-ke", DisplayName: "M-Pesa", ContractVersion: ContractVersion,
		Environment: EnvironmentSimulated, Enabled: true,
		Credentials: CredentialConfig{SecretRef: "sandbox://mpesa"},
	}, a); err != nil {
		t.Fatal(err)
	}

	if err := c.RegisterCorridor(validCorridor()); err != nil {
		t.Fatal(err)
	}
	if err := c.Authorize("rw-rwf-ke-kes", 1001); !errors.Is(err, ErrLimitExceeded) {
		t.Fatalf("authorize over limit = %v, want ErrLimitExceeded", err)
	}
	if err := c.SetKillSwitch("rw-rwf-ke-kes", true); err != nil {
		t.Fatal(err)
	}
	if err := c.Authorize("rw-rwf-ke-kes", 100); !errors.Is(err, ErrKillSwitchActive) {
		t.Fatalf("authorize with kill switch = %v", err)
	}
}

func TestCatalogQuoteCalculatesFeeAndDelivery(t *testing.T) {
	catalog := NewDefaultCatalog()
	quote, err := catalog.Quote("rw-rwf-ke-kes", 1_000_000, time.Now().UTC())
	if err != nil {
		t.Fatalf("Quote returned error: %v", err)
	}
	// Same-region (EAC) corridor: 80 bps fee, rounded up.
	if quote.ID == "" || quote.FeeMinor != 8000 {
		t.Fatalf("unexpected quote metadata: %+v", quote)
	}
	// Convention: rate is RWF per ONE KES (1380/129.5), the destination is credited
	// (amount-fee)/rate — exactly how the ledger posts amount/fx_rate.
	wantRate := 1380.0 / 129.5
	if math.Abs(quote.Rate-wantRate) > 1e-9 || math.Abs(quote.InverseRate-1/wantRate) > 1e-12 {
		t.Fatalf("rate = %v inverse = %v, want %v", quote.Rate, quote.InverseRate, wantRate)
	}
	if quote.RateConvention != RateConvention {
		t.Fatalf("rate convention = %q", quote.RateConvention)
	}
	if want := int64(math.Floor(float64(1_000_000-8000) / wantRate)); quote.DeliverAmount != want {
		t.Fatalf("deliver = %d, want %d", quote.DeliverAmount, want)
	}
	// A 1,000,000 RWF-minor payment must deliver LESS KES than RWF (KES is the stronger currency).
	if quote.DeliverAmount >= quote.SourceAmount {
		t.Fatalf("delivered %d >= sent %d: rate convention is inverted", quote.DeliverAmount, quote.SourceAmount)
	}
	if !quote.ObservationOnly {
		t.Fatal("quotes must remain observation-only")
	}
}

func TestAfricaCatalogIsAFullMeshWithConsistentRates(t *testing.T) {
	c := NewDefaultCatalog()
	n := len(Countries)
	if got := len(c.Corridors()); got != n*(n-1) {
		t.Fatalf("corridors = %d, want %d", got, n*(n-1))
	}
	if got := len(c.Providers()); got != n {
		t.Fatalf("providers = %d, want %d", got, n)
	}
	// Round-trip: a->b rate times b->a rate must be 1.
	ab, _ := c.Corridor("ke-kes-ng-ngn")
	ba, _ := c.Corridor("ng-ngn-ke-kes")
	if math.Abs(ab.FX.Rate*ba.FX.Rate-1) > 1e-9 {
		t.Fatalf("rates are not reciprocal: %v * %v", ab.FX.Rate, ba.FX.Rate)
	}
	// Cross-region corridors cost more than intra-region ones.
	if ab.FeesBps <= func() int { x, _ := c.Corridor("rw-rwf-ke-kes"); return x.FeesBps }() {
		t.Fatalf("cross-region fee %d should exceed intra-EAC fee", ab.FeesBps)
	}
	// Limits are USD-equivalent: the NGN cap is far larger in minor units than the KES cap.
	ng, _ := c.Corridor("ng-ngn-ke-kes")
	ke, _ := c.Corridor("ke-kes-ng-ngn")
	if ng.MaxAmountMinor <= ke.MaxAmountMinor {
		t.Fatalf("NGN cap %d should exceed KES cap %d", ng.MaxAmountMinor, ke.MaxAmountMinor)
	}
	for _, corridor := range c.Corridors() {
		if err := corridor.Validate(); err != nil {
			t.Fatalf("corridor %s invalid: %v", corridor.ID, err)
		}
	}
}

func TestFirmQuotesAreSignedLockedAndExpire(t *testing.T) {
	c := NewDefaultCatalog()
	now := time.Now().UTC()
	q, err := c.Quote("rw-rwf-ke-kes", 500_000, now)
	if err != nil {
		t.Fatal(err)
	}
	if err := c.ValidateQuote("rw-rwf-ke-kes", q.ID, 500_000, now.Add(time.Minute)); err != nil {
		t.Fatalf("fresh quote rejected: %v", err)
	}
	locked, err := c.VerifyQuote(q.ID, now)
	if err != nil || locked.Rate != q.Rate || locked.CorridorID != "rw-rwf-ke-kes" {
		t.Fatalf("verify = %+v, %v", locked, err)
	}
	// Tampering with the payload (e.g. asking for a better rate) breaks the signature.
	parts := strings.Split(q.ID, ".")
	forged := parts[0] + "." + strings.Replace(parts[1], parts[1][:4], "AAAA", 1) + "." + parts[2]
	if _, err := c.VerifyQuote(forged, now); err == nil {
		t.Fatal("forged quote payload was accepted")
	}
	// A quote is bound to its corridor.
	if err := c.ValidateQuote("ke-kes-rw-rwf", q.ID, 500_000, now); err == nil {
		t.Fatal("quote accepted for a different corridor")
	}
	// It expires.
	if err := c.ValidateQuote("rw-rwf-ke-kes", q.ID, 500_000, now.Add(11*time.Minute)); err == nil {
		t.Fatal("expired quote accepted")
	}
	// Another catalog with a different key cannot honour it.
	other := NewDefaultCatalog()
	if _, err := other.VerifyQuote(q.ID, now); err == nil {
		t.Fatal("quote verified under a different signing key")
	}
	// A shared key makes quotes portable across replicas.
	a, _ := NewAfricaCatalog(AfricaOptions{QuoteKey: []byte("0123456789abcdef-shared-key")})
	b, _ := NewAfricaCatalog(AfricaOptions{QuoteKey: []byte("0123456789abcdef-shared-key")})
	qa, _ := a.Quote("rw-rwf-ke-kes", 500_000, now)
	if _, err := b.VerifyQuote(qa.ID, now); err != nil {
		t.Fatalf("shared-key replica rejected quote: %v", err)
	}
}

func TestRateOverridesAndCredentialPlaceholders(t *testing.T) {
	over, err := ParseRateOverrides("KES=150, rwf=1400")
	if err != nil || over["KES"] != 150 || over["RWF"] != 1400 {
		t.Fatalf("overrides = %v, %v", over, err)
	}
	if _, err := ParseRateOverrides("KES"); err == nil {
		t.Fatal("malformed override accepted")
	}
	if _, err := ParseRateOverrides("KES=-1"); err == nil {
		t.Fatal("negative override accepted")
	}
	c, err := NewAfricaCatalog(AfricaOptions{Rates: over, Countries: []string{"RW", "KE"}})
	if err != nil {
		t.Fatal(err)
	}
	if len(c.Corridors()) != 2 {
		t.Fatalf("corridors = %d, want 2 for a two-country deployment", len(c.Corridors()))
	}
	q, _ := c.Quote("rw-rwf-ke-kes", 1_000_000, time.Now())
	if math.Abs(q.Rate-1400.0/150.0) > 1e-9 {
		t.Fatalf("override not applied: rate %v", q.Rate)
	}
	if got := CredentialPlaceholder("mtn-rw"); got != "env://VUKA_PROVIDER_MTN_RW_CREDENTIALS" {
		t.Fatalf("placeholder = %q", got)
	}
	if err := (CredentialConfig{SecretRef: CredentialPlaceholder("mpesa-ke")}).Validate(); err != nil {
		t.Fatalf("placeholder must be a valid managed reference: %v", err)
	}
}

func TestCredentialBoundaryRejectsSecretsAndExternalCalls(t *testing.T) {
	if err := (CredentialConfig{SecretRef: "secret_value"}).Validate(); !errors.Is(err, ErrInvalidConfig) {
		t.Fatalf("literal secret validation = %v", err)
	}
	if err := (CredentialConfig{SecretRef: "plaintext-ref"}).Validate(); !errors.Is(err, ErrInvalidConfig) {
		t.Fatalf("unmanaged secret reference validation = %v", err)
	}
	if err := (CredentialConfig{External: true}).Validate(); !errors.Is(err, ErrInvalidConfig) {
		t.Fatalf("external call validation = %v", err)
	}
	if err := (CredentialConfig{Endpoint: "https://provider.example"}).Validate(); !errors.Is(err, ErrInvalidConfig) {
		t.Fatalf("external endpoint validation = %v", err)
	}
}

func TestWebhookSignatureReplayAndNoSettlement(t *testing.T) {
	c := NewDefaultCatalog()
	secret := []byte("local-fixture-only")
	c.SetWebhookValidator("mtn-rw", HMACSHA256Validator{Secret: secret})
	body := []byte(`{"event_type":"payout.completed","provider_reference":"sandbox-1"}`)
	mac := hmac.New(sha256.New, secret)
	_, _ = mac.Write(body)
	sig := hex.EncodeToString(mac.Sum(nil))

	event, err := c.ReceiveWebhook(context.Background(), "mtn-rw", "evt-1", sig, body)
	if err != nil || event.State != EventAccepted || event.SettlementAction != EventNotSettled {
		t.Fatalf("accepted webhook = %+v, err=%v", event, err)
	}
	_, err = c.ReceiveWebhook(context.Background(), "mtn-rw", "evt-1", sig, body)
	if !errors.Is(err, ErrWebhookReplay) {
		t.Fatalf("replay = %v, want ErrWebhookReplay", err)
	}
	_, err = c.ReceiveWebhook(context.Background(), "mtn-rw", "evt-2", "bad", body)
	if !errors.Is(err, ErrWebhookRejected) {
		t.Fatalf("bad signature = %v, want ErrWebhookRejected", err)
	}
}
