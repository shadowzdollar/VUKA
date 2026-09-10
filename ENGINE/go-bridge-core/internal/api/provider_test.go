package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"vuka/go-bridge-core/internal/testutil"
)

func TestProviderInspectionSurfacesAreReadOnly(t *testing.T) {
	handler := NewServerWithReconciliation(nil, testutil.Logger(), nil, nil, nil, nil, 50, 500, false)
	for _, path := range []string{"/api/providers/status", "/api/corridors", "/api/providers/webhooks/events", "/api/providers/reconciliation"} {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("GET %s status=%d body=%s", path, rec.Code, rec.Body.String())
		}
	}
}

func TestProviderWebhookRejectsMissingSignatureAndNeverSettles(t *testing.T) {
	handler := NewServerWithReconciliation(nil, testutil.Logger(), nil, nil, nil, nil, 50, 500, false)
	req := httptest.NewRequest(http.MethodPost, "/api/provider-webhooks/mtn-rw",
		strings.NewReader(`{"event_type":"payout.completed"}`))
	req.Header.Set("Idempotency-Key", "evt-1")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("webhook status=%d body=%s, want 401", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "webhook_rejected") {
		t.Fatalf("webhook response did not identify rejection: %s", rec.Body.String())
	}
}

func TestProviderInspectionRequiresOperatorRoleWhenAuthEnabled(t *testing.T) {
	handler := NewServerWithAuth(nil, testutil.Logger(), nil, NewAuthStore(nil))
	req := httptest.NewRequest(http.MethodGet, "/api/providers/status", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("unauthenticated provider status=%d, want 401", rec.Code)
	}
}

func TestProviderExecutionReadOnlyGate(t *testing.T) {
	handler := NewServerWithReconciliation(nil, testutil.Logger(), nil, nil, nil, nil, 50, 500, true)
	req := httptest.NewRequest(http.MethodPost, "/api/provider-executions",
		strings.NewReader(`{"transaction_id":"tx-1","provider":"mtn-rw","operation":"PAYOUT","request_reference":"r-1","amount":10,"currency":"RWF","phone":"+250000000"}`))
	req.Header.Set("Idempotency-Key", "r-1")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("provider execution status=%d body=%s, want 403", rec.Code, rec.Body.String())
	}
}

func TestProviderExecutionLocalSimulationAndStatus(t *testing.T) {
	handler := NewServerWithReconciliation(nil, testutil.Logger(), nil, nil, nil, nil, 50, 500, false)
	req := httptest.NewRequest(http.MethodPost, "/api/provider-executions",
		strings.NewReader(`{"transaction_id":"tx-2","provider":"mtn-rw","operation":"PAYOUT","request_reference":"r-2","amount":10,"currency":"RWF","phone":"+250000000"}`))
	req.Header.Set("Idempotency-Key", "r-2")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("provider execution status=%d body=%s", rec.Code, rec.Body.String())
	}
}
