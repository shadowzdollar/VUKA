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
	} {
		req := httptest.NewRequest(http.MethodPost, path, nil)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusLocked {
			t.Errorf("POST %s returned %d, want %d", path, rec.Code, http.StatusLocked)
		}
	}
}
