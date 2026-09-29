package api_test

import (
	"context"
	"net/http"
	"strings"
	"testing"

	"vuka/go-bridge-core/internal/adapters"
	"vuka/go-bridge-core/internal/api"
	"vuka/go-bridge-core/internal/idempotency"
	"vuka/go-bridge-core/internal/ledger"
	"vuka/go-bridge-core/internal/testutil"
)

// loginOperator seeds an operator and returns an HTTP handler plus the session cookie header,
// so a test can call role-protected endpoints the same way a real client would.
func loginOperator(t *testing.T, email, password string) (http.Handler, string) {
	t.Helper()
	pool := testutil.TestPool(t)
	svc := ledger.NewService(pool, idempotency.NewStore(pool), adapters.NewRegistry())
	authStore := api.NewAuthStore(pool)
	if err := authStore.EnsureSchema(context.Background()); err != nil {
		t.Fatalf("EnsureSchema: %v", err)
	}
	if err := authStore.EnsureOperator(context.Background(), email, password, "operator"); err != nil {
		t.Fatalf("EnsureOperator: %v", err)
	}
	h := api.NewServerWithAuth(svc, testutil.Logger(), nil, authStore)

	rec := doJSON(t, h, "POST", "/api/auth/login", nil, map[string]string{"email": email, "password": password})
	if rec.Code != http.StatusOK {
		t.Fatalf("operator login: %d %s", rec.Code, rec.Body.String())
	}
	var cookie string
	for _, c := range rec.Result().Cookies() {
		if strings.Contains(c.Name, "session") {
			cookie = c.Name + "=" + c.Value
		}
	}
	if cookie == "" {
		t.Fatalf("no session cookie in login response: %v", rec.Header())
	}
	return h, cookie
}

// Regression: the export used to fetch a single 200-row page, silently truncating any export
// covering more activity than that — exactly the case a regulator asking for a full period would
// hit. handleExportActivity now pages through every row; this proves it actually does, by viewing
// the activity log (which itself logs one ACTIVITY_VIEWED row per call) more than 200 times.
func TestActivityExport_PagesBeyondTheOldTwoHundredRowCap(t *testing.T) {
	h, cookie := loginOperator(t, "export-"+testutil.UniqueID()+"@vuka.local", "operator-pw-1234")
	headers := map[string]string{"Cookie": cookie}

	const views = 210
	for i := 0; i < views; i++ {
		rec := doJSON(t, h, "GET", "/api/activity?limit=1", headers, nil)
		if rec.Code != http.StatusOK {
			t.Fatalf("view activity %d: %d %s", i, rec.Code, rec.Body.String())
		}
	}

	rec := doJSON(t, h, "GET", "/api/activity/export", headers, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("export: %d %s", rec.Code, rec.Body.String())
	}
	lines := strings.Split(strings.TrimRight(rec.Body.String(), "\n"), "\n")
	dataRows := len(lines) - 1 // minus the header row
	// At least `views` ACTIVITY_VIEWED rows, plus the SIGN_IN from login: comfortably over the old
	// 200-row cap, proving pagination — not asserting an exact count, since the export itself and
	// each prior export in this run also add their own ACTIVITY_EXPORTED/ACTIVITY_VIEWED rows.
	if dataRows <= 200 {
		t.Fatalf("export returned %d data rows, want > 200 (the old single-page cap)", dataRows)
	}
}
