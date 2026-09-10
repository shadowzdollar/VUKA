package providers

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
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
	quote, err := catalog.Quote("rw-rwf-ke-kes", 10000, time.Now().UTC())
	if err != nil {
		t.Fatalf("Quote returned error: %v", err)
	}
	if quote.ID == "" || quote.FeeMinor != 100 {
		t.Fatalf("unexpected quote metadata: %+v", quote)
	}
	if quote.DeliverAmount != 9405 {
		t.Fatalf("expected 9405 minor deliverable amount, got %d", quote.DeliverAmount)
	}
	if !quote.ObservationOnly {
		t.Fatal("quotes must remain observation-only")
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
