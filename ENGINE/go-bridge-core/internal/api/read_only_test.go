package api

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"vuka/go-bridge-core/internal/testutil"
)

func TestReadOnlyGuardBlocksLedgerWrites(t *testing.T) {
	handler := NewServerWithReconciliation(nil, testutil.Logger(), nil, nil, nil, nil, 50, 500, true)

	for _, path := range []string{
		"/api/users",
		"/api/transfers",
		"/api/transfers/cross-border",
		"/api/accounts/123/fund",
		"/api/transfers/123/reverse",
		"/api/users/123/invoices",
		"/api/settlements",
		"/api/settlements/123/approve",
		"/api/settlements/123/execute",
		"/api/settlements/123/cancel",
		"/api/pilots",
		"/api/pilots/123/participants",
		"/api/pilots/123/approve",
		"/api/pilots/123/resume",
		"/api/pilots/123/complete",
		"/api/pilots/123/observations",
		"/api/support/tickets",
		"/api/support/tickets/123",
		"/api/notifications/123/read",
	} {
		method := http.MethodPost
		if path == "/api/support/tickets/123" {
			method = http.MethodPatch
		}
		req := httptest.NewRequest(method, path, nil)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusLocked {
			t.Errorf("POST %s returned %d, want %d", path, rec.Code, http.StatusLocked)
		}
	}
}
