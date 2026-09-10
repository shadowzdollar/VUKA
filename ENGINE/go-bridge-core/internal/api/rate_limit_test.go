package api

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRateLimitMiddlewarePerClientAndRetryAfter(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	h := RateLimitMiddleware(next, 1, time.Minute)

	req := httptest.NewRequest(http.MethodGet, "/api/fx", nil)
	req.Header.Set("X-Client-ID", "client-a")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("first request = %d, want 204", rec.Code)
	}

	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("second request = %d, want 429", rec.Code)
	}
	if rec.Header().Get("Retry-After") == "" || rec.Header().Get("X-Request-ID") == "" {
		t.Fatalf("429 missing Retry-After or X-Request-ID: headers=%v", rec.Header())
	}
	if rec.Body.String() != "{\"error\":{\"code\":\"rate_limited\",\"message\":\"too many requests; retry later\"}}\n" {
		t.Fatalf("unexpected error envelope: %s", rec.Body.String())
	}

	// A different client has an independent budget.
	req.Header.Set("X-Client-ID", "client-b")
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("different client = %d, want 204", rec.Code)
	}
}

func TestRateLimitExcludesHealth(t *testing.T) {
	calls := 0
	h := RateLimitMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		w.WriteHeader(http.StatusOK)
	}), 1, time.Minute)
	for i := 0; i < 2; i++ {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/healthz", nil))
		if rec.Code != http.StatusOK {
			t.Fatalf("health request = %d, want 200", rec.Code)
		}
	}
	if calls != 2 {
		t.Fatalf("health calls = %d, want 2", calls)
	}
}
