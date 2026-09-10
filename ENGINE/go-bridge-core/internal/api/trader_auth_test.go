package api

import (
	"net/http/httptest"
	"testing"
)

func TestTraderIDFromRequestPrefersAuthenticatedContext(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/users/other", nil)
	req.Header.Set("X-Trader-ID", "header-trader")
	req = req.WithContext(WithTraderID(req.Context(), "context-trader"))

	id, ok := traderIDFromRequest(req)
	if !ok || id != "context-trader" {
		t.Fatalf("trader identity = %q, %v; want context-trader", id, ok)
	}
}

func TestTraderIDFromRequestAcceptsLegacyHeader(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/accounts/1", nil)
	req.Header.Set("X-Trader-ID", "trader-a")

	id, ok := traderIDFromRequest(req)
	if !ok || id != "trader-a" {
		t.Fatalf("trader identity = %q, %v; want trader-a", id, ok)
	}
}

func TestTraderOwnershipRejectsDifferentTrader(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/users/trader-b", nil)
	req = req.WithContext(WithTraderID(req.Context(), "trader-a"))
	rec := httptest.NewRecorder()

	s := &Server{}
	if s.requireTraderUser(rec, req, "trader-b") {
		t.Fatal("expected ownership check to reject another trader")
	}
	if rec.Code != 403 {
		t.Fatalf("status = %d, want 403", rec.Code)
	}
}
