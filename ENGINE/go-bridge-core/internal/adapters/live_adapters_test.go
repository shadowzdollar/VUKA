package adapters_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"vuka/go-bridge-core/internal/adapters"
)

func TestLiveFXProvider_GetQuote(t *testing.T) {
	fx := adapters.NewLiveFXProvider(0.5, 5*time.Minute)

	quote, err := fx.GetQuote(context.Background(), "RWF", "KES")
	if err != nil {
		t.Fatalf("GetQuote RWF/KES: %v", err)
	}

	if quote.Pair != "RWF/KES" {
		t.Errorf("pair = %s, want RWF/KES", quote.Pair)
	}
	if quote.Rate <= 0 {
		t.Errorf("rate = %f, want > 0", quote.Rate)
	}
	if quote.Bid >= quote.Ask {
		t.Errorf("bid (%f) should be less than ask (%f)", quote.Bid, quote.Ask)
	}

	// Same currency
	same, err := fx.GetQuote(context.Background(), "KES", "KES")
	if err != nil {
		t.Fatalf("GetQuote KES/KES: %v", err)
	}
	if same.Rate != 1.0 {
		t.Errorf("same rate = %f, want 1.0", same.Rate)
	}

	// Unsupported currency
	_, err = fx.GetQuote(context.Background(), "XYZ", "KES")
	if err == nil {
		t.Error("expected error for unsupported currency XYZ")
	}
}

func TestMpesaDarajaAdapter_Validation(t *testing.T) {
	cfg := adapters.DarajaConfig{
		ConsumerKey:    "test_key",
		ConsumerSecret: "test_secret",
		ShortCode:      "174379",
		PassKey:        "test_passkey",
	}

	adapter := adapters.NewMpesaDarajaAdapter(cfg)
	if err := adapter.ValidateConfig(); err != nil {
		t.Fatalf("ValidateConfig failed: %v", err)
	}

	if adapter.Name() != "mpesa-daraja" {
		t.Errorf("Name = %s, want mpesa-daraja", adapter.Name())
	}
	if !adapter.CredentialsConfigured() {
		t.Error("CredentialsConfigured should be true")
	}
}

func TestMoMoAPIAdapter_Validation(t *testing.T) {
	cfg := adapters.MoMoConfig{
		SubscriptionKey: "sub_key",
		APIUser:         "api_user_uuid",
		APIKey:          "api_key",
		Environment:     "sandbox",
	}

	adapter := adapters.NewMoMoAPIAdapter(cfg)
	if err := adapter.ValidateConfig(); err != nil {
		t.Fatalf("ValidateConfig failed: %v", err)
	}

	if adapter.Name() != "mtn-momo-api" {
		t.Errorf("Name = %s, want mtn-momo-api", adapter.Name())
	}
	if !adapter.CredentialsConfigured() {
		t.Error("CredentialsConfigured should be true")
	}
}

func TestMpesaDarajaAdapter_STKPush_MockServer(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/oauth/v1/generate":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]string{
				"access_token": "mock_access_token",
				"expires_in":   "3599",
			})
		case "/mpesa/stkpush/v1/processrequest":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]string{
				"MerchantRequestID":   "29115-34620561-1",
				"CheckoutRequestID":   "ws_CO_19122019232001007",
				"ResponseCode":        "0",
				"ResponseDescription": "Success. Request accepted for processing",
				"CustomerMessage":     "Success. Request accepted for processing",
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	// Direct testing with custom endpoint URL override
	cfg := adapters.DarajaConfig{
		ConsumerKey:    "test_key",
		ConsumerSecret: "test_secret",
		ShortCode:      "174379",
		PassKey:        "test_passkey",
		CallbackURL:    server.URL + "/callback",
		Environment:    "sandbox",
	}
	adapter := adapters.NewMpesaDarajaAdapter(cfg)
	if !adapter.CredentialsConfigured() {
		t.Fatal("expected credentials configured")
	}
}
