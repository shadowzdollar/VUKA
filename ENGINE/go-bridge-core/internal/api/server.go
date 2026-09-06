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
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"vuka/go-bridge-core/internal/ledger"
	"vuka/go-bridge-core/internal/reconciliation"
)

// Server holds the HTTP handlers and their dependencies.
type Server struct {
	ledger               *ledger.Service
	log                  *slog.Logger
	mux                  *http.ServeMux
	hub                  *Hub
	reconciliation       *reconciliation.Repository
	reconciliationPoller *reconciliation.Poller
	auth                 *AuthStore
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

func NewServerWithReconciliation(ledgerSvc *ledger.Service, log *slog.Logger, corsOrigins []string, repo *reconciliation.Repository, poller *reconciliation.Poller, auth *AuthStore) http.Handler {
	s := &Server{ledger: ledgerSvc, log: log, mux: http.NewServeMux(), hub: NewHub(), reconciliation: repo, reconciliationPoller: poller, auth: auth}
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
	s.mux.HandleFunc("GET /api/escrows", s.handleListEscrows)
	s.mux.HandleFunc("GET /api/escrows/{id}/events", s.handleListEscrowEvents)
	s.mux.HandleFunc("GET /api/reconciliation/status", s.handleReconciliationStatus)

	protected := s.mux
	if s.auth != nil {
		protected = http.NewServeMux()
		protected.Handle("/", s.mux)
		protected.HandleFunc("POST /api/auth/login", s.handleLogin)
		protected.Handle("POST /api/auth/logout", s.auth.require(http.HandlerFunc(s.handleLogout)))
		protected.Handle("GET /api/auth/me", s.auth.require(http.HandlerFunc(s.handleCurrentOperator)))
		protected.HandleFunc("GET /healthz", s.handleHealthz)
		protected.Handle("/api/escrows", s.auth.require(http.HandlerFunc(s.handleListEscrows)))
		protected.Handle("/api/escrows/{id}/events", s.auth.require(http.HandlerFunc(s.handleListEscrowEvents)))
		protected.Handle("/api/reconciliation/status", s.auth.require(http.HandlerFunc(s.handleReconciliationStatus)))
	}
	return NewCORS(corsOrigins, s.withMiddleware(protected))
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
	status, err := s.reconciliation.Status(r.Context(), chainID, contract, s.reconciliationPoller)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "reconciliation_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, status)
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
