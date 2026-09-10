package api

import (
	"context"
	"net/http"
	"strings"
)

// WithTraderID attaches the authenticated trader to a request context. It is
// compatible with upstream authentication middleware and is also useful to
// callers embedding the API.
func WithTraderID(ctx context.Context, traderID string) context.Context {
	return context.WithValue(ctx, traderContextKey{}, Trader{ID: strings.TrimSpace(traderID)})
}

// TraderIDFromContext returns the authenticated trader, when one is present.
func TraderIDFromContext(ctx context.Context) (string, bool) {
	trader, ok := traderFromContext(ctx)
	return strings.TrimSpace(trader.ID), ok && strings.TrimSpace(trader.ID) != ""
}

func traderIDFromRequest(r *http.Request) (string, bool) {
	if id, ok := TraderIDFromContext(r.Context()); ok {
		return id, true
	}
	for _, name := range []string{"X-Trader-ID", "X-User-ID"} {
		if id := strings.TrimSpace(r.Header.Get(name)); id != "" {
			return id, true
		}
	}
	return "", false
}

// traderOwnsUser enforces ownership only when trader authentication has been
// supplied. Requests from the legacy unauthenticated surface remain
// compatible; authenticated requests cannot cross trader boundaries.
func (s *Server) traderOwnsUser(r *http.Request, userID string) bool {
	traderID, ok := traderIDFromRequest(r)
	return !ok || traderID == strings.TrimSpace(userID)
}

func (s *Server) requireTraderUser(w http.ResponseWriter, r *http.Request, userID string) bool {
	if s.traderOwnsUser(r, userID) {
		return true
	}
	writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot access this record")
	return false
}
