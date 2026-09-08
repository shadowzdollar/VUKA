// Package api exposes the VUKA ledger engine over a REST interface.
//
// Endpoints (all JSON):
//
//	POST   /api/users                     create trader + PERSONAL/BUSINESS accounts
//	GET    /api/users/{id}                fetch a trader
//	GET    /api/users/{id}/accounts       list a trader's accounts
//	GET    /api/accounts/{id}             fetch an account
//	GET    /api/accounts/{id}/balance     derived balance (SUM of ledger entries)
//	POST   /api/accounts/{id}/fund        credit account with external cash-in
//	POST   /api/transfers                 initiate idempotent transfer
//	POST   /api/transfers/cross-border    initiate idempotent cross-currency transfer
//	GET    /api/transfers/{id}            fetch transfer status
//	GET    /api/transfers/{id}/entries    audit: double-entry rows
//	POST   /api/transfers/{id}/reverse    reverse a SUCCESS transfer
//	GET    /api/fx                        engine corridor FX rate
//	GET    /api/escrows                   reconciled on-chain escrow read model
//	GET    /api/reconciliation/status     reconciliation cursor and metrics
//	GET    /healthz                       liveness probe
//
// Transfers require the Idempotency-Key header (UUIDv4). Replaying a key
// returns the original transfer with HTTP 200 (never a duplicate charge).
package api

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"vuka/go-bridge-core/internal/ledger"
	"vuka/go-bridge-core/internal/reconciliation"
)

// Server holds the HTTP handlers and their dependencies.
type Server struct {
	ledger                    *ledger.Service
	log                       *slog.Logger
	mux                       *http.ServeMux
	hub                       *Hub
	reconciliation            *reconciliation.Repository
	reconciliationPoller      *reconciliation.Poller
	auth                      *AuthStore
	reconciliationLagWarning  int64
	reconciliationLagCritical int64
	readOnly                  bool
}

func reconciliationActivityResource(chainID int64, contract string) string {
	return fmt.Sprintf("reconciliation:%d:%s", chainID, strings.ToLower(strings.TrimSpace(contract)))
}

// NewServer builds the HTTP handler with all routes wired.
// corsOrigins is the allow-list of browser origins (e.g. "http://localhost:5173").
// Empty disables origin checking (sets the header echo for any origin).
func NewServer(ledgerSvc *ledger.Service, log *slog.Logger, corsOrigins []string) http.Handler {
	s := &Server{ledger: ledgerSvc, log: log, mux: http.NewServeMux(), hub: NewHub()}
	return s.handler(corsOrigins)
}

func NewServerWithAuth(ledgerSvc *ledger.Service, log *slog.Logger, corsOrigins []string, auth *AuthStore) http.Handler {
	s := &Server{ledger: ledgerSvc, log: log, mux: http.NewServeMux(), hub: NewHub(), auth: auth}
	return s.handler(corsOrigins)
}

func NewServerWithReconciliation(ledgerSvc *ledger.Service, log *slog.Logger, corsOrigins []string, repo *reconciliation.Repository, poller *reconciliation.Poller, auth *AuthStore, lagWarning, lagCritical int64, readOnly bool) http.Handler {
	s := &Server{ledger: ledgerSvc, log: log, mux: http.NewServeMux(), hub: NewHub(), reconciliation: repo, reconciliationPoller: poller, auth: auth, reconciliationLagWarning: lagWarning, reconciliationLagCritical: lagCritical, readOnly: readOnly}
	return s.handler(corsOrigins)
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if s.auth == nil {
		writeError(w, http.StatusNotImplemented, "authentication_disabled", "operator authentication is not configured")
		return
	}
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	token, err := s.auth.login(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, errInvalidCredentials) {
			writeError(w, http.StatusUnauthorized, "invalid_credentials", "invalid email or password")
			return
		}
		writeError(w, http.StatusInternalServerError, "authentication_error", err.Error())
		return
	}
	operator, err := s.auth.operatorForSession(r.Context(), token)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "authentication_error", err.Error())
		return
	}
	if err := s.auth.recordActivity(r.Context(), operator, "SIGN_IN", "session", "Operator authenticated"); err != nil {
		writeError(w, http.StatusInternalServerError, "activity_error", err.Error())
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name: sessionCookie, Value: token, Path: "/", HttpOnly: true,
		SameSite: http.SameSiteLaxMode, Secure: r.TLS != nil, MaxAge: 12 * 60 * 60,
	})
	writeJSON(w, http.StatusOK, map[string]string{"status": "authenticated"})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if s.auth == nil {
		writeError(w, http.StatusNotImplemented, "authentication_disabled", "operator authentication is not configured")
		return
	}
	if cookie, err := r.Cookie(sessionCookie); err == nil {
		if operator, operatorErr := s.auth.operatorForSession(r.Context(), cookie.Value); operatorErr == nil {
			if activityErr := s.auth.recordActivity(r.Context(), operator, "SIGN_OUT", "session", "Operator signed out"); activityErr != nil {
				writeError(w, http.StatusInternalServerError, "activity_error", activityErr.Error())
				return
			}
		}
		if err := s.auth.revoke(r.Context(), cookie.Value); err != nil {
			writeError(w, http.StatusInternalServerError, "authentication_error", "unable to end session")
			return
		}
		http.SetCookie(w, &http.Cookie{Name: sessionCookie, Value: "", Path: "/", MaxAge: -1, HttpOnly: true, SameSite: http.SameSiteLaxMode})
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "signed_out"})
}

func (s *Server) handler(corsOrigins []string) http.Handler {
	s.mux.HandleFunc("POST /api/users", s.handleCreateUser)
	s.mux.HandleFunc("GET /api/users/{id}", s.handleGetUser)
	s.mux.HandleFunc("GET /api/lookup/user/{phone}", s.handleGetUserByPhone)
	s.mux.HandleFunc("GET /api/users/{id}/accounts", s.handleListAccounts)
	s.mux.HandleFunc("GET /api/users/{id}/transfers", s.handleListUserTransfers)
	s.mux.HandleFunc("POST /api/users/{id}/invoices", s.handleCreateInvoice)
	s.mux.HandleFunc("GET /api/users/{id}/invoices", s.handleListInvoices)
	s.mux.HandleFunc("GET /api/invoices/{id}", s.handleGetInvoice)
	s.mux.HandleFunc("GET /api/accounts/{id}", s.handleGetAccount)
	s.mux.HandleFunc("GET /api/accounts/{id}/balance", s.handleGetBalance)
	s.mux.HandleFunc("POST /api/accounts/{id}/fund", s.handleFundAccount)
	s.mux.HandleFunc("POST /api/transfers", s.handleCreateTransfer)
	s.mux.HandleFunc("POST /api/transfers/cross-border", s.handleCreateCrossBorderTransfer)
	s.mux.HandleFunc("GET /api/transfers/{id}", s.handleGetTransfer)
	s.mux.HandleFunc("GET /api/transfers/{id}/entries", s.handleListEntries)
	s.mux.HandleFunc("POST /api/transfers/{id}/reverse", s.handleReverseTransfer)
	s.mux.HandleFunc("GET /api/fx", s.handleGetFx)
	s.mux.Handle("GET /api/events", s.hub)
	s.mux.HandleFunc("GET /healthz", s.handleHealthz)
	s.mux.HandleFunc("POST /api/auth/login", s.handleLogin)
	s.mux.HandleFunc("POST /api/auth/logout", s.handleLogout)
	s.mux.HandleFunc("GET /api/auth/me", s.handleCurrentOperator)
	s.mux.HandleFunc("GET /api/activity", s.handleListActivity)
	s.mux.HandleFunc("GET /api/activity/export", s.handleExportActivity)
	s.mux.HandleFunc("GET /api/escrows", s.handleListEscrows)
	s.mux.HandleFunc("GET /api/escrows/{id}/events", s.handleListEscrowEvents)
	s.mux.HandleFunc("GET /api/reconciliation/status", s.handleReconciliationStatus)
	s.mux.HandleFunc("GET /api/reconciliation/status/export", s.handleExportReconciliationStatus)
	s.mux.HandleFunc("POST /api/reconciliation/alerts/ack", s.handleAcknowledgeReconciliationAlert)
	s.mux.HandleFunc("GET /api/disputes", s.handleListDisputes)
	s.mux.HandleFunc("/api/disputes/{id}/reviews", s.handleDisputeReviews)
	s.mux.HandleFunc("GET /api/disputes/{id}/timeline", s.handleListDisputeTimeline)
	s.mux.HandleFunc("GET /api/disputes/{id}/export", s.handleExportDispute)
	s.mux.HandleFunc("POST /api/disputes/{id}/decision", s.handleAddDisputeDecision)
	s.mux.HandleFunc("GET /api/disputes/{id}/decisions", s.handleListDisputeDecisions)
	s.mux.HandleFunc("POST /api/dispute-decisions/{id}/approve", s.handleApproveDisputeDecision)

	protected := s.mux
	if s.auth != nil {
		protected = http.NewServeMux()
		protected.Handle("/", s.mux)
		protected.HandleFunc("POST /api/auth/login", s.handleLogin)
		protected.Handle("POST /api/auth/logout", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleLogout)))
		protected.Handle("GET /api/auth/me", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleCurrentOperator)))
		protected.Handle("GET /api/activity", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleListActivity)))
		protected.Handle("GET /api/activity/export", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleExportActivity)))
		protected.HandleFunc("GET /healthz", s.handleHealthz)
		protected.Handle("/api/escrows", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleListEscrows)))
		protected.Handle("/api/escrows/{id}/events", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleListEscrowEvents)))
		protected.Handle("/api/reconciliation/status", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleReconciliationStatus)))
		protected.Handle("GET /api/reconciliation/status/export", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleExportReconciliationStatus)))
		protected.Handle("POST /api/reconciliation/alerts/ack", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleAcknowledgeReconciliationAlert)))
		protected.Handle("/api/disputes", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleListDisputes)))
		protected.Handle("/api/disputes/{id}/reviews", s.auth.requireRole("arbiter")(http.HandlerFunc(s.handleDisputeReviews)))
		protected.Handle("GET /api/disputes/{id}/timeline", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleListDisputeTimeline)))
		protected.Handle("GET /api/disputes/{id}/export", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleExportDispute)))
		protected.Handle("POST /api/disputes/{id}/decision", s.auth.requireRole("arbiter")(http.HandlerFunc(s.handleAddDisputeDecision)))
		protected.Handle("GET /api/disputes/{id}/decisions", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleListDisputeDecisions)))
		protected.Handle("POST /api/dispute-decisions/{id}/approve", s.auth.requireRole("operator")(http.HandlerFunc(s.handleApproveDisputeDecision)))
	}
	return NewCORS(corsOrigins, s.withMiddleware(s.readOnlyGuard(protected)))
}

func (s *Server) readOnlyGuard(next http.Handler) http.Handler {
	if !s.readOnly {
		return next
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && (r.URL.Path == "/api/users" ||
			r.URL.Path == "/api/transfers" ||
			r.URL.Path == "/api/transfers/cross-border" ||
			(strings.HasPrefix(r.URL.Path, "/api/accounts/") && strings.HasSuffix(r.URL.Path, "/fund")) ||
			strings.HasSuffix(r.URL.Path, "/reverse") ||
			strings.HasSuffix(r.URL.Path, "/invoices")) {
			writeError(w, http.StatusLocked, "read_only_mode", "state-changing ledger operations are disabled")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) handleCurrentOperator(w http.ResponseWriter, r *http.Request) {
	if s.auth == nil {
		writeError(w, http.StatusNotImplemented, "authentication_disabled", "operator authentication is not configured")
		return
	}

	cookie, err := r.Cookie(sessionCookie)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	operator, err := s.auth.operatorForSession(r.Context(), cookie.Value)
	if errors.Is(err, errInvalidCredentials) {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "authentication_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, operator)
}

func (s *Server) handleListActivity(w http.ResponseWriter, r *http.Request) {
	if s.auth == nil {
		writeError(w, http.StatusNotImplemented, "authentication_disabled", "operator authentication is not configured")
		return
	}
	limit := 50
	offset := 0
	if value := r.URL.Query().Get("limit"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_limit", "limit must be an integer")
			return
		}
		limit = parsed
	}
	if value := r.URL.Query().Get("offset"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_offset", "offset must be an integer")
			return
		}
		offset = parsed
	}
	activities, total, err := s.auth.listActivity(r.Context(), limit, offset,
		r.URL.Query().Get("action"), r.URL.Query().Get("search"),
		r.URL.Query().Get("from"), r.URL.Query().Get("to"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "activity_error", err.Error())
		return
	}
	if operator, ok := operatorFromContext(r.Context()); ok {
		if err := s.auth.recordActivity(r.Context(), operator, "ACTIVITY_VIEWED", "operator_activity", "Operator activity log viewed"); err != nil {
			s.log.Error("activity log", "err", err, "action", "ACTIVITY_VIEWED")
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"activities": activities, "total": total})
}

func (s *Server) handleExportActivity(w http.ResponseWriter, r *http.Request) {
	if s.auth == nil {
		writeError(w, http.StatusNotImplemented, "authentication_disabled", "operator authentication is not configured")
		return
	}
	operator, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	activities, _, err := s.auth.listActivity(r.Context(), 200, 0,
		r.URL.Query().Get("action"), r.URL.Query().Get("search"),
		r.URL.Query().Get("from"), r.URL.Query().Get("to"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "activity_error", err.Error())
		return
	}
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="operator-activity.csv"`)
	writer := csv.NewWriter(w)
	if err := writer.Write([]string{"id", "actor", "role", "action", "resource", "details", "created_at"}); err != nil {
		return
	}
	for _, item := range activities {
		if err := writer.Write([]string{item.ID, item.Actor, item.Role, item.Action, item.Resource, item.Details, item.CreatedAt}); err != nil {
			return
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		s.log.Error("activity export", "err", err)
		return
	}
	if err := s.auth.recordActivity(r.Context(), operator, "ACTIVITY_EXPORTED", "operator_activity", "Operator activity CSV exported"); err != nil {
		s.log.Error("activity log", "err", err, "action", "ACTIVITY_EXPORTED")
	}
}

// withMiddleware layers request logging, panic recovery, and JSON content
// defaults over the raw mux.
func (s *Server) withMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		defer func() {
			if rec := recover(); rec != nil {
				s.log.Error("panic recovered", "err", rec, "path", r.URL.Path)
				writeError(w, http.StatusInternalServerError, "internal_error", "internal server error")
			}
			s.log.Info("request",
				"method", r.Method,
				"path", r.URL.Path,
				"status", sw.status,
				"duration_ms", time.Since(start).Milliseconds(),
			)
		}()
		next.ServeHTTP(sw, r)
	})
}

// statusWriter captures the response status for request logging.
type statusWriter struct {
	http.ResponseWriter
	status int
}

func (sw *statusWriter) WriteHeader(code int) {
	sw.status = code
	sw.ResponseWriter.WriteHeader(code)
}

// Flush forwards to the underlying writer so streaming handlers (SSE) work
// through the middleware chain.
func (sw *statusWriter) Flush() {
	if f, ok := sw.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

// ---------------------------------------------------------------------------
// Handlers

func (s *Server) handleCreateUser(w http.ResponseWriter, r *http.Request) {
	var req ledger.CreateUserRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	currency := r.URL.Query().Get("currency")
	user, accounts, err := s.ledger.CreateUser(r.Context(), req, currency)
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"user":     user,
		"accounts": accounts,
	})
}

func (s *Server) handleGetUser(w http.ResponseWriter, r *http.Request) {
	user, err := s.ledger.GetUser(r.Context(), r.PathValue("id"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (s *Server) handleGetUserByPhone(w http.ResponseWriter, r *http.Request) {
	user, err := s.ledger.GetUserByPhone(r.Context(), r.PathValue("phone"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (s *Server) handleListAccounts(w http.ResponseWriter, r *http.Request) {
	accounts, err := s.ledger.ListAccounts(r.Context(), r.PathValue("id"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"accounts": accounts})
}

func (s *Server) handleListUserTransfers(w http.ResponseWriter, r *http.Request) {
	filter := ledger.TransferFilter{
		UserID:    r.PathValue("id"),
		AccountID: r.URL.Query().Get("account_id"),
		Status:    ledger.TransactionStatus(r.URL.Query().Get("status")),
	}
	transfers, err := s.ledger.ListTransfers(r.Context(), filter)
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	if transfers == nil {
		transfers = []*ledger.Transfer{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"transfers": transfers})
}

func (s *Server) handleCreateInvoice(w http.ResponseWriter, r *http.Request) {
	var req ledger.CreateInvoiceRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	inv, err := s.ledger.CreateInvoice(r.Context(), r.PathValue("id"), req)
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, inv)
}

func (s *Server) handleListInvoices(w http.ResponseWriter, r *http.Request) {
	direction := r.URL.Query().Get("direction")
	inv, err := s.ledger.ListInvoices(r.Context(), r.PathValue("id"), direction)
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	if inv == nil {
		inv = []*ledger.Invoice{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"invoices": inv})
}

func (s *Server) handleGetInvoice(w http.ResponseWriter, r *http.Request) {
	inv, err := s.ledger.GetInvoice(r.Context(), r.PathValue("id"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, inv)
}

func (s *Server) handleGetAccount(w http.ResponseWriter, r *http.Request) {
	acc, err := s.ledger.GetAccount(r.Context(), r.PathValue("id"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, acc)
}

func (s *Server) handleGetBalance(w http.ResponseWriter, r *http.Request) {
	balance, err := s.ledger.GetBalance(r.Context(), r.PathValue("id"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, balance)
}

func (s *Server) handleFundAccount(w http.ResponseWriter, r *http.Request) {
	key := r.Header.Get("Idempotency-Key")
	if key == "" {
		writeError(w, http.StatusBadRequest, "missing_idempotency_key",
			"Idempotency-Key header is required (UUIDv4)")
		return
	}
	var req ledger.FundRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	t, err := s.ledger.FundAccount(r.Context(), r.PathValue("id"), key, req)
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	s.publishTransfer(t)
	writeJSON(w, http.StatusCreated, map[string]any{"transfer": t})
}

func (s *Server) handleCreateTransfer(w http.ResponseWriter, r *http.Request) {
	key := r.Header.Get("Idempotency-Key")
	if key == "" {
		writeError(w, http.StatusBadRequest, "missing_idempotency_key",
			"Idempotency-Key header is required (UUIDv4)")
		return
	}
	var req ledger.TransferRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}

	t, replay, err := s.ledger.Transfer(r.Context(), key, req)
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	if !replay {
		s.publishTransfer(t)
	}

	status := http.StatusCreated
	if replay {
		status = http.StatusOK
	}
	writeJSON(w, status, map[string]any{
		"transfer": t,
		"replayed": replay,
	})
}

func (s *Server) handleCreateCrossBorderTransfer(w http.ResponseWriter, r *http.Request) {
	key := r.Header.Get("Idempotency-Key")
	if key == "" {
		writeError(w, http.StatusBadRequest, "missing_idempotency_key",
			"Idempotency-Key header is required (UUIDv4)")
		return
	}
	var req ledger.CrossBorderRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}

	t, replay, err := s.ledger.CrossBorderTransfer(r.Context(), key, req)
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	if !replay {
		s.publishTransfer(t)
	}

	status := http.StatusCreated
	if replay {
		status = http.StatusOK
	}
	writeJSON(w, status, map[string]any{
		"transfer": t,
		"replayed": replay,
	})
}

// handleGetFx reports the engine's corridor FX rate (RWF->KES default) so the
// dashboard renders live pricing instead of a hardcoded constant.
func (s *Server) handleGetFx(w http.ResponseWriter, r *http.Request) {
	rate := s.ledger.DefaultFxRate()
	if rate <= 0 {
		writeError(w, http.StatusServiceUnavailable, "fx_unconfigured",
			"no engine-wide FX rate configured (VUKA_FX_RATE_RWF_KES unset)")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"pair":    "RWF/KES",
		"rate":    rate,
		"updated": time.Now().UTC().Format(time.RFC3339),
		"source":  "engine",
	})
}

func (s *Server) handleGetTransfer(w http.ResponseWriter, r *http.Request) {
	t, err := s.ledger.GetTransfer(r.Context(), r.PathValue("id"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (s *Server) handleListEntries(w http.ResponseWriter, r *http.Request) {
	entries, err := s.ledger.ListLedgerEntries(r.Context(), r.PathValue("id"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"entries": entries})
}

func (s *Server) handleReverseTransfer(w http.ResponseWriter, r *http.Request) {
	var req ledger.ReverseRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	t, err := s.ledger.ReverseTransfer(r.Context(), r.PathValue("id"), req.Reason)
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	s.publishTransfer(t)
	writeJSON(w, http.StatusOK, t)
}

// publishTransfer fans a transfer status change to SSE subscribers.
func (s *Server) publishTransfer(t *ledger.Transfer) {
	ev := TransferEvent{
		ID:        t.ID,
		Status:    string(t.Status),
		AccountID: t.SourceAccountID,
		Amount:    t.Amount,
		Currency:  t.Currency,
		UpdatedAt: t.UpdatedAt.UTC().Format(time.RFC3339),
	}
	s.hub.Publish(ev)
}

func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	if err := s.ledger.Ping(ctx); err != nil {
		s.log.Error("healthz failed", "err", err)
		writeError(w, http.StatusServiceUnavailable, "db_unreachable", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleListEscrows(w http.ResponseWriter, r *http.Request) {
	if s.reconciliation == nil {
		writeError(w, http.StatusNotImplemented, "reconciliation_disabled", "reconciliation is not configured")
		return
	}
	chainID, err := parseInt64Query(r, "chain_id", 80002)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_chain_id", err.Error())
		return
	}
	contract := r.URL.Query().Get("contract")
	if contract == "" {
		writeError(w, http.StatusBadRequest, "missing_contract", "contract is required")
		return
	}
	items, err := s.reconciliation.ListEscrows(r.Context(), chainID, contract)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "reconciliation_error", err.Error())
		return
	}
	if items == nil {
		items = []reconciliation.Summary{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"escrows": items})
}

func (s *Server) handleReconciliationStatus(w http.ResponseWriter, r *http.Request) {
	if s.reconciliation == nil || s.reconciliationPoller == nil {
		writeError(w, http.StatusNotImplemented, "reconciliation_disabled", "reconciliation is not configured")
		return
	}
	chainID, err := parseInt64Query(r, "chain_id", 80002)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_chain_id", err.Error())
		return
	}
	contract := r.URL.Query().Get("contract")
	if contract == "" {
		writeError(w, http.StatusBadRequest, "missing_contract", "contract is required")
		return
	}
	status, err := s.reconciliation.Status(r.Context(), chainID, contract, s.reconciliationPoller, s.reconciliationLagWarning, s.reconciliationLagCritical)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "reconciliation_error", err.Error())
		return
	}
	if s.auth != nil {
		acknowledgement, activityErr := s.auth.latestActivity(r.Context(), "ALERT_ACKNOWLEDGED", reconciliationActivityResource(chainID, contract))
		if activityErr != nil {
			writeError(w, http.StatusInternalServerError, "activity_error", activityErr.Error())
			return
		}
		if acknowledgement != nil {
			status.AcknowledgedBy = acknowledgement.Actor
			status.AcknowledgedAt = acknowledgement.CreatedAt
			if separator := strings.Index(acknowledgement.Details, ":"); separator > 0 {
				status.AcknowledgedLevel = strings.ToLower(strings.TrimSpace(acknowledgement.Details[:separator]))
				status.AcknowledgedMessage = strings.TrimSpace(acknowledgement.Details[separator+1:])
			}
		}
	}
	writeJSON(w, http.StatusOK, status)
}

func (s *Server) handleExportReconciliationStatus(w http.ResponseWriter, r *http.Request) {
	if s.auth == nil || s.reconciliation == nil || s.reconciliationPoller == nil {
		writeError(w, http.StatusNotImplemented, "reconciliation_disabled", "reconciliation is not configured")
		return
	}
	operator, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	chainID, err := parseInt64Query(r, "chain_id", 80002)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_chain_id", err.Error())
		return
	}
	contract := r.URL.Query().Get("contract")
	if contract == "" {
		writeError(w, http.StatusBadRequest, "missing_contract", "contract is required")
		return
	}
	status, err := s.reconciliation.Status(r.Context(), chainID, contract, s.reconciliationPoller, s.reconciliationLagWarning, s.reconciliationLagCritical)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "reconciliation_error", err.Error())
		return
	}
	acknowledgement, activityErr := s.auth.latestActivity(r.Context(), "ALERT_ACKNOWLEDGED", reconciliationActivityResource(chainID, contract))
	if activityErr != nil {
		writeError(w, http.StatusInternalServerError, "activity_error", activityErr.Error())
		return
	}
	if acknowledgement != nil {
		status.AcknowledgedBy = acknowledgement.Actor
		status.AcknowledgedAt = acknowledgement.CreatedAt
		if separator := strings.Index(acknowledgement.Details, ":"); separator > 0 {
			status.AcknowledgedLevel = strings.ToLower(strings.TrimSpace(acknowledgement.Details[:separator]))
			status.AcknowledgedMessage = strings.TrimSpace(acknowledgement.Details[separator+1:])
		}
	}
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="reconciliation-status.csv"`)
	writer := csv.NewWriter(w)
	if err := writer.Write([]string{"metric", "value"}); err != nil {
		return
	}
	rows := [][]string{
		{"exported_at", time.Now().UTC().Format(time.RFC3339)},
		{"chain_id", strconv.FormatInt(chainID, 10)},
		{"contract", contract},
		{"alert_level", status.AlertLevel},
		{"cursor", strconv.FormatInt(status.Cursor, 10)},
		{"latest_block", strconv.FormatInt(status.LatestBlock, 10)},
		{"finalized_block", strconv.FormatInt(status.FinalizedBlock, 10)},
		{"lag_blocks", strconv.FormatInt(status.LagBlocks, 10)},
		{"warning_lag_blocks", strconv.FormatInt(status.WarningLag, 10)},
		{"critical_lag_blocks", strconv.FormatInt(status.CriticalLag, 10)},
		{"acknowledged_by", status.AcknowledgedBy},
		{"acknowledged_at", status.AcknowledgedAt},
		{"acknowledged_level", status.AcknowledgedLevel},
		{"acknowledged_message", status.AcknowledgedMessage},
		{"polls", strconv.FormatUint(status.Metrics.Polls, 10)},
		{"successful_polls", strconv.FormatUint(status.Metrics.SuccessfulPolls, 10)},
		{"events_applied", strconv.FormatUint(status.Metrics.EventsApplied, 10)},
		{"errors", strconv.FormatUint(status.Metrics.Errors, 10)},
	}
	for _, row := range rows {
		if err := writer.Write(row); err != nil {
			return
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		s.log.Error("reconciliation status export", "err", err)
		return
	}
	if err := s.auth.recordActivity(r.Context(), operator, "RECONCILIATION_STATUS_EXPORTED", reconciliationActivityResource(chainID, contract), "Reconciliation status CSV exported"); err != nil {
		s.log.Error("activity log", "err", err, "action", "RECONCILIATION_STATUS_EXPORTED")
	}
}

func (s *Server) handleAcknowledgeReconciliationAlert(w http.ResponseWriter, r *http.Request) {
	if s.auth == nil {
		writeError(w, http.StatusNotImplemented, "authentication_disabled", "operator authentication is not configured")
		return
	}
	operator, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	var req struct {
		ChainID  int64  `json:"chain_id"`
		Contract string `json:"contract"`
		Level    string `json:"level"`
		Message  string `json:"message"`
	}
	if err := decodeJSON(r, &req); err != nil || (req.Level != "warning" && req.Level != "critical") {
		writeError(w, http.StatusBadRequest, "invalid_alert", "alert level must be warning or critical")
		return
	}
	message := strings.TrimSpace(req.Message)
	if req.ChainID <= 0 || strings.TrimSpace(req.Contract) == "" || message == "" {
		writeError(w, http.StatusBadRequest, "invalid_alert", "alert message is required")
		return
	}
	if s.reconciliation == nil || s.reconciliationPoller == nil {
		writeError(w, http.StatusNotImplemented, "reconciliation_disabled", "reconciliation is not configured")
		return
	}
	status, err := s.reconciliation.Status(r.Context(), req.ChainID, req.Contract, s.reconciliationPoller, s.reconciliationLagWarning, s.reconciliationLagCritical)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "reconciliation_error", err.Error())
		return
	}
	currentMessage := fmt.Sprintf("The worker has reported %d error%s.", status.Metrics.Errors, func() string {
		if status.Metrics.Errors == 1 {
			return ""
		}
		return "s"
	}())
	if status.Metrics.Errors == 0 {
		currentMessage = fmt.Sprintf("Indexing is behind by %d finalized blocks.", status.LagBlocks)
	}
	if status.AlertLevel != req.Level || currentMessage != message {
		writeError(w, http.StatusConflict, "stale_alert", "the alert has changed; refresh reconciliation status")
		return
	}
	if err := s.auth.recordActivity(r.Context(), operator, "ALERT_ACKNOWLEDGED", reconciliationActivityResource(req.ChainID, req.Contract), fmt.Sprintf("%s: %s", strings.ToUpper(req.Level), message)); err != nil {
		writeError(w, http.StatusInternalServerError, "activity_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "acknowledged"})
}

func (s *Server) handleListEscrowEvents(w http.ResponseWriter, r *http.Request) {
	if s.reconciliation == nil {
		writeError(w, http.StatusNotImplemented, "reconciliation_disabled", "reconciliation is not configured")
		return
	}
	chainID, err := parseInt64Query(r, "chain_id", 80002)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_chain_id", err.Error())
		return
	}
	escrowID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || escrowID < 0 {
		writeError(w, http.StatusBadRequest, "invalid_escrow_id", "escrow id must be a non-negative integer")
		return
	}
	contract := r.URL.Query().Get("contract")
	if contract == "" {
		writeError(w, http.StatusBadRequest, "missing_contract", "contract is required")
		return
	}
	events, err := s.reconciliation.ListEvents(r.Context(), chainID, contract, escrowID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "reconciliation_error", err.Error())
		return
	}
	if events == nil {
		events = []reconciliation.EventRecord{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"events": events})
}

func (s *Server) handleListDisputes(w http.ResponseWriter, r *http.Request) {
	if s.reconciliation == nil {
		writeError(w, http.StatusNotImplemented, "reconciliation_disabled", "reconciliation is not configured")
		return
	}
	chainID, err := parseInt64Query(r, "chain_id", 80002)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_chain_id", err.Error())
		return
	}
	contract := r.URL.Query().Get("contract")
	if contract == "" {
		writeError(w, http.StatusBadRequest, "missing_contract", "contract is required")
		return
	}
	disputes, err := s.reconciliation.ListDisputes(r.Context(), chainID, contract, r.URL.Query().Get("status"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "reconciliation_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"disputes": disputes})
}

func (s *Server) handleAddDisputeReview(w http.ResponseWriter, r *http.Request) {
	if s.reconciliation == nil {
		writeError(w, http.StatusNotImplemented, "reconciliation_disabled", "reconciliation is not configured")
		return
	}
	operator, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	var req struct {
		Note string `json:"note"`
	}
	if err := decodeJSON(r, &req); err != nil || strings.TrimSpace(req.Note) == "" {
		writeError(w, http.StatusBadRequest, "invalid_review", "review note is required")
		return
	}
	review, err := s.reconciliation.AddDisputeReview(r.Context(), r.PathValue("id"), operator.Email, strings.TrimSpace(req.Note))
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "invalid_dispute", err.Error())
		return
	}
	if err := s.auth.recordActivity(r.Context(), operator, "REVIEW_NOTE_CREATED", r.PathValue("id"), "Dispute review note recorded"); err != nil {
		writeError(w, http.StatusInternalServerError, "activity_error", err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, review)
}

func (s *Server) handleDisputeReviews(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.handleListDisputeReviews(w, r)
	case http.MethodPost:
		s.handleAddDisputeReview(w, r)
	default:
		w.Header().Set("Allow", "GET, POST")
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method must be GET or POST")
	}
}

func (s *Server) handleAddDisputeDecision(w http.ResponseWriter, r *http.Request) {
	if s.reconciliation == nil {
		writeError(w, http.StatusNotImplemented, "reconciliation_disabled", "reconciliation is not configured")
		return
	}
	operator, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	var req struct {
		Decision  string `json:"decision"`
		Rationale string `json:"rationale"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	req.Decision = strings.ToUpper(strings.TrimSpace(req.Decision))
	req.Rationale = strings.TrimSpace(req.Rationale)
	if (req.Decision != "RELEASE" && req.Decision != "REFUND") || req.Rationale == "" {
		writeError(w, http.StatusBadRequest, "invalid_decision", "decision must be RELEASE or REFUND and rationale is required")
		return
	}
	decision, err := s.reconciliation.AddDisputeDecision(r.Context(), r.PathValue("id"), req.Decision, req.Rationale, operator.Email)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "invalid_dispute", err.Error())
		return
	}
	if err := s.auth.recordActivity(r.Context(), operator, "RECOMMENDATION_CREATED", r.PathValue("id"), req.Decision+" recommendation recorded"); err != nil {
		writeError(w, http.StatusInternalServerError, "activity_error", err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, decision)
}

func (s *Server) handleListDisputeReviews(w http.ResponseWriter, r *http.Request) {
	if s.reconciliation == nil {
		writeError(w, http.StatusNotImplemented, "reconciliation_disabled", "reconciliation is not configured")
		return
	}
	reviews, err := s.reconciliation.ListDisputeReviews(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "reconciliation_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"reviews": reviews})
}

func (s *Server) handleListDisputeTimeline(w http.ResponseWriter, r *http.Request) {
	if s.reconciliation == nil {
		writeError(w, http.StatusNotImplemented, "reconciliation_disabled", "reconciliation is not configured")
		return
	}
	timeline, err := s.reconciliation.ListDisputeTimeline(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "reconciliation_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"timeline": timeline})
}

func (s *Server) handleExportDispute(w http.ResponseWriter, r *http.Request) {
	if s.reconciliation == nil {
		writeError(w, http.StatusNotImplemented, "reconciliation_disabled", "reconciliation is not configured")
		return
	}
	operator, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	dispute, err := s.reconciliation.GetDispute(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "dispute_not_found", err.Error())
		return
	}
	timeline, err := s.reconciliation.ListDisputeTimeline(r.Context(), dispute.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "reconciliation_error", err.Error())
		return
	}

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="dispute-%d-audit.csv"`, dispute.EscrowID))
	writer := csv.NewWriter(w)
	if err := writer.Write([]string{"dispute_id", "escrow_id", "chain_id", "contract_address", "status", "reason", "raised_transaction_hash", "raised_log_index", "event_kind", "actor", "summary", "details", "created_at"}); err != nil {
		return
	}
	for _, entry := range timeline {
		if err := writer.Write([]string{
			dispute.ID, strconv.FormatInt(dispute.EscrowID, 10), strconv.FormatInt(dispute.ChainID, 10),
			dispute.ContractAddress, dispute.Status, dispute.Reason, dispute.RaisedTransactionHash,
			strconv.FormatInt(int64(dispute.RaisedLogIndex), 10), entry.Kind, entry.Actor,
			entry.Summary, entry.Details, entry.CreatedAt,
		}); err != nil {
			return
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		s.log.Error("dispute export", "err", err, "dispute_id", dispute.ID)
		return
	}
	if err := s.auth.recordActivity(r.Context(), operator, "DISPUTE_EXPORTED", dispute.ID, "Dispute audit CSV exported"); err != nil {
		s.log.Error("activity log", "err", err, "action", "DISPUTE_EXPORTED", "resource", dispute.ID)
	}
}

func (s *Server) handleListDisputeDecisions(w http.ResponseWriter, r *http.Request) {
	if s.reconciliation == nil {
		writeError(w, http.StatusNotImplemented, "reconciliation_disabled", "reconciliation is not configured")
		return
	}
	decisions, err := s.reconciliation.ListDisputeDecisions(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "reconciliation_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"decisions": decisions})
}

func (s *Server) handleApproveDisputeDecision(w http.ResponseWriter, r *http.Request) {
	if s.reconciliation == nil {
		writeError(w, http.StatusNotImplemented, "reconciliation_disabled", "reconciliation is not configured")
		return
	}
	operator, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	approval, err := s.reconciliation.ApproveDisputeDecision(r.Context(), r.PathValue("id"), operator.Email)
	if err != nil {
		if strings.Contains(err.Error(), "already approved") {
			writeError(w, http.StatusConflict, "approval_exists", err.Error())
			return
		}
		writeError(w, http.StatusUnprocessableEntity, "invalid_approval", err.Error())
		return
	}
	if err := s.auth.recordActivity(r.Context(), operator, "RECOMMENDATION_APPROVED", r.PathValue("id"), "Dispute recommendation approved"); err != nil {
		writeError(w, http.StatusInternalServerError, "activity_error", err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, approval)
}

// ---------------------------------------------------------------------------
// Error mapping

// mapServiceError translates ledger sentinels into HTTP semantics.
func (s *Server) mapServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ledger.ErrAccountNotFound),
		errors.Is(err, ledger.ErrUserNotFound),
		errors.Is(err, ledger.ErrTransferNotFound),
		errors.Is(err, ledger.ErrSettlementAccountNotFound):
		writeError(w, http.StatusNotFound, "not_found", err.Error())
	case errors.Is(err, ledger.ErrDuplicateKey),
		errors.Is(err, ledger.ErrSameAccount):
		writeError(w, http.StatusConflict, "conflict", err.Error())
	case errors.Is(err, ledger.ErrInsufficientFunds):
		writeError(w, http.StatusUnprocessableEntity, "insufficient_funds", err.Error())
	case errors.Is(err, ledger.ErrCurrencyMismatch),
		errors.Is(err, ledger.ErrInvalidAmount),
		errors.Is(err, ledger.ErrInvalidAccountType),
		errors.Is(err, ledger.ErrInvalidFxRate),
		errors.Is(err, ledger.ErrInvalidInvoiceNumber),
		errors.Is(err, ledger.ErrIdempotencyKeyRequired),
		errors.Is(err, ledger.ErrTransferNotSuccess):
		writeError(w, http.StatusUnprocessableEntity, "invalid_request", err.Error())
	default:
		s.log.Error("unhandled service error", "err", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "internal server error")
	}
}

// ---------------------------------------------------------------------------
// JSON helpers

func decodeJSON(r *http.Request, dst any) error {
	dec := json.NewDecoder(http.MaxBytesReader(nil, r.Body, 1<<20))
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// ErrorBody is the standard error envelope: {"error": {"code","message"}}.
type ErrorBody struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	var body ErrorBody
	body.Error.Code = code
	body.Error.Message = message
	writeJSON(w, status, body)
}

func parseInt64Query(r *http.Request, key string, fallback int64) (int64, error) {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return fallback, nil
	}
	value, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || value <= 0 {
		return 0, errors.New("query parameter must be a positive integer")
	}
	return value, nil
}
