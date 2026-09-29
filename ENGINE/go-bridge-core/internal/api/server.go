// Package api exposes the VUKA ledger engine over a REST interface.
//
// Endpoints (all JSON):
//
//	POST   /api/users                     create trader + PERSONAL/BUSINESS accounts
//	GET    /api/users/{id}                fetch a trader
//	GET    /api/users/{id}/accounts       list a trader's accounts
//	GET    /api/accounts/{id}             fetch an account
//	GET    /api/accounts/{id}/balance     derived balance (SUM of ledger entries)
//	GET    /api/accounts/{id}/statement   ISO 20022 camt.053 (default) or JSON account statement
//	POST   /api/accounts/{id}/fund        credit account with external cash-in
//	POST   /api/transfers                 initiate idempotent transfer
//	POST   /api/transfers/cross-border    initiate idempotent cross-currency transfer
//	GET    /api/transfers/{id}            fetch transfer status
//	GET    /api/transfers/{id}/entries    audit: double-entry rows
//	POST   /api/transfers/{id}/reverse    reverse a SUCCESS transfer
//	GET    /api/fx                        engine corridor FX rate
//	GET    /api/escrows                   reconciled on-chain escrow read model
//	GET    /api/reconciliation/status     reconciliation cursor and metrics
//	POST   /api/provider-executions       idempotent provider dispatch
//	GET    /api/provider-executions/{id}  provider execution evidence/status
//	GET    /healthz                       liveness probe
//
// Transfers require the Idempotency-Key header (UUIDv4). Replaying a key
// returns the original transfer with HTTP 200 (never a duplicate charge).
//
// Every response includes X-Request-ID (client supplied or generated) and
// X-API-Version: 1. Errors use {"error":{"code":"...","message":"..."}}.
// Set VUKA_RATE_LIMIT_REQUESTS and VUKA_RATE_LIMIT_WINDOW_MS to enable the
// in-process per-client/IP fixed-window limiter. /healthz is excluded.
package api

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"vuka/go-bridge-core/internal/adapters"
	"vuka/go-bridge-core/internal/analytics"
	"vuka/go-bridge-core/internal/identity"
	"vuka/go-bridge-core/internal/ledger"
	"vuka/go-bridge-core/internal/pilot"
	"vuka/go-bridge-core/internal/providerexec"
	"vuka/go-bridge-core/internal/providers"
	"vuka/go-bridge-core/internal/reconciliation"
	"vuka/go-bridge-core/internal/risk"
	"vuka/go-bridge-core/internal/settlement"
	"vuka/go-bridge-core/internal/support"
	"vuka/go-bridge-core/internal/transactionworkflow"
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
	localSyntheticExecution   bool
	identity                  *identity.Service
	providerCatalog           *providers.Catalog
	settlement                *settlement.Service
	pilot                     *pilot.Service
	support                   *support.Service
	providerExecution         *providerexec.Service
	workflow                  *transactionworkflow.Service
	risk                      *risk.Service
	analytics                 *analytics.Service
	screener                  risk.Screener
	publicCfg                 PublicConfig
	metrics                   *metrics
	metricsToken              string
}

// Option customises a Server at construction time. Options are variadic so
// existing constructors stay source-compatible.
type Option func(*Server)

// WithProviderCatalog replaces the default sandbox catalog (e.g. with the
// configured pan-African catalog).
func WithProviderCatalog(c *providers.Catalog) Option {
	return func(s *Server) {
		if c != nil {
			s.providerCatalog = c
		}
	}
}

func reconciliationActivityResource(chainID int64, contract string) string {
	return fmt.Sprintf("reconciliation:%d:%s", chainID, strings.ToLower(strings.TrimSpace(contract)))
}

// NewServer builds the HTTP handler with all routes wired.
// corsOrigins is the allow-list of browser origins (e.g. "http://localhost:5173").
// Empty disables origin checking (sets the header echo for any origin).
func NewServer(ledgerSvc *ledger.Service, log *slog.Logger, corsOrigins []string) http.Handler {
	s := &Server{ledger: ledgerSvc, log: log, mux: http.NewServeMux(), hub: NewHub(), providerCatalog: providers.NewDefaultCatalog(), providerExecution: defaultProviderExecution()}
	if ledgerSvc != nil {
		s.identity = identity.NewService(ledgerSvc.DB())
		s.settlement = settlement.NewService(ledgerSvc.DB(), settlement.DefaultPolicy())
		s.pilot = pilot.NewService(ledgerSvc.DB(), false, true)
		s.support = support.NewService(ledgerSvc.DB(), false)
	}
	s.configureWorkflow()
	return s.handler(corsOrigins)
}

func NewServerWithAuth(ledgerSvc *ledger.Service, log *slog.Logger, corsOrigins []string, auth *AuthStore) http.Handler {
	s := &Server{ledger: ledgerSvc, log: log, mux: http.NewServeMux(), hub: NewHub(), auth: auth, providerCatalog: providers.NewDefaultCatalog(), providerExecution: defaultProviderExecution()}
	if ledgerSvc != nil {
		s.identity = identity.NewService(ledgerSvc.DB())
		s.settlement = settlement.NewService(ledgerSvc.DB(), settlement.DefaultPolicy())
		s.pilot = pilot.NewService(ledgerSvc.DB(), false, true)
		s.support = support.NewService(ledgerSvc.DB(), false)
	}
	s.configureWorkflow()
	return s.handler(corsOrigins)
}

// NewServerWithProviderCatalog is used by sandbox harnesses and tests to
// inject a catalog with explicit webhook validators. The production
// constructor intentionally uses NewDefaultCatalog, whose webhook boundary
// remains fail-closed until a secret manager is wired.
func NewServerWithProviderCatalog(ledgerSvc *ledger.Service, log *slog.Logger, corsOrigins []string, auth *AuthStore, catalog *providers.Catalog) http.Handler {
	s := &Server{ledger: ledgerSvc, log: log, mux: http.NewServeMux(), hub: NewHub(), auth: auth, providerCatalog: catalog, providerExecution: defaultProviderExecution()}
	if ledgerSvc != nil {
		s.identity = identity.NewService(ledgerSvc.DB())
		s.settlement = settlement.NewService(ledgerSvc.DB(), settlement.DefaultPolicy())
		s.pilot = pilot.NewService(ledgerSvc.DB(), false, true)
		s.support = support.NewService(ledgerSvc.DB(), false)
	}
	s.configureWorkflow()
	return s.handler(corsOrigins)
}

func NewServerWithReconciliation(ledgerSvc *ledger.Service, log *slog.Logger, corsOrigins []string, repo *reconciliation.Repository, poller *reconciliation.Poller, auth *AuthStore, lagWarning, lagCritical int64, readOnly bool) http.Handler {
	s := &Server{ledger: ledgerSvc, log: log, mux: http.NewServeMux(), hub: NewHub(), reconciliation: repo, reconciliationPoller: poller, auth: auth, reconciliationLagWarning: lagWarning, reconciliationLagCritical: lagCritical, readOnly: readOnly, providerCatalog: providers.NewDefaultCatalog(), providerExecution: defaultProviderExecution()}
	if ledgerSvc != nil {
		s.identity = identity.NewService(ledgerSvc.DB())
		s.settlement = settlement.NewService(ledgerSvc.DB(), settlement.DefaultPolicy())
		s.support = support.NewService(ledgerSvc.DB(), readOnly)
	}
	s.configureWorkflow()
	return s.handler(corsOrigins)
}

func NewServerWithReconciliationAndSettlement(ledgerSvc *ledger.Service, log *slog.Logger, corsOrigins []string, repo *reconciliation.Repository, poller *reconciliation.Poller, auth *AuthStore, lagWarning, lagCritical int64, readOnly bool, settlementSvc *settlement.Service) http.Handler {
	return NewServerWithReconciliationAndSettlementAndPilotAndSupport(ledgerSvc, log, corsOrigins, repo, poller, auth, lagWarning, lagCritical, readOnly, settlementSvc, nil, nil)
}

func NewServerWithReconciliationAndSettlementAndPilot(ledgerSvc *ledger.Service, log *slog.Logger, corsOrigins []string, repo *reconciliation.Repository, poller *reconciliation.Poller, auth *AuthStore, lagWarning, lagCritical int64, readOnly bool, settlementSvc *settlement.Service, pilotSvc *pilot.Service) http.Handler {
	return NewServerWithReconciliationAndSettlementAndPilotAndSupport(ledgerSvc, log, corsOrigins, repo, poller, auth, lagWarning, lagCritical, readOnly, settlementSvc, pilotSvc, nil)
}

// NewServerWithReconciliationAndSettlementAndPilotAndSupport wires the
// explicitly bootstrapped local support service into the API server.
func NewServerWithReconciliationAndSettlementAndPilotAndSupport(ledgerSvc *ledger.Service, log *slog.Logger, corsOrigins []string, repo *reconciliation.Repository, poller *reconciliation.Poller, auth *AuthStore, lagWarning, lagCritical int64, readOnly bool, settlementSvc *settlement.Service, pilotSvc *pilot.Service, supportSvc *support.Service) http.Handler {
	return NewServerWithRuntimeOptions(ledgerSvc, log, corsOrigins, repo, poller, auth, lagWarning, lagCritical, readOnly, settlementSvc, pilotSvc, supportSvc, false)
}

// NewServerWithRuntimeOptions wires the API with explicit local runtime
// capabilities. Synthetic execution is intentionally separate from provider
// settlement and is only enabled by the development command.
func NewServerWithRuntimeOptions(ledgerSvc *ledger.Service, log *slog.Logger, corsOrigins []string, repo *reconciliation.Repository, poller *reconciliation.Poller, auth *AuthStore, lagWarning, lagCritical int64, readOnly bool, settlementSvc *settlement.Service, pilotSvc *pilot.Service, supportSvc *support.Service, localSyntheticExecution bool) http.Handler {
	return NewServerWithRuntimeOptionsAndProviderExecution(ledgerSvc, log, corsOrigins, repo, poller, auth, lagWarning, lagCritical, readOnly, settlementSvc, pilotSvc, supportSvc, localSyntheticExecution, nil)
}

// NewServerWithRuntimeOptionsAndProviderExecution wires the durable provider
// execution boundary. A nil service uses a local simulated store for tests;
// production passes a PostgreSQL-backed service from main.
func NewServerWithRuntimeOptionsAndProviderExecution(ledgerSvc *ledger.Service, log *slog.Logger, corsOrigins []string, repo *reconciliation.Repository, poller *reconciliation.Poller, auth *AuthStore, lagWarning, lagCritical int64, readOnly bool, settlementSvc *settlement.Service, pilotSvc *pilot.Service, supportSvc *support.Service, localSyntheticExecution bool, executionSvc *providerexec.Service, opts ...Option) http.Handler {
	if executionSvc == nil {
		registry := adapters.NewRegistry()
		registry.Register(adapters.NewMTNAdapter(0, 0, "success", time.Second))
		registry.Register(adapters.NewMpesaAdapter(0, 0, "success", time.Second))
		executionSvc = providerexec.NewService(registry, providerexec.NewMemoryStore())
	}
	s := &Server{ledger: ledgerSvc, log: log, mux: http.NewServeMux(), hub: NewHub(), reconciliation: repo, reconciliationPoller: poller, auth: auth, reconciliationLagWarning: lagWarning, reconciliationLagCritical: lagCritical, readOnly: readOnly, localSyntheticExecution: localSyntheticExecution, providerCatalog: providers.NewDefaultCatalog(), settlement: settlementSvc, pilot: pilotSvc, support: supportSvc, providerExecution: executionSvc}
	for _, opt := range opts {
		opt(s)
	}
	if ledgerSvc != nil {
		s.identity = identity.NewService(ledgerSvc.DB())
		if s.settlement == nil {
			s.settlement = settlement.NewService(ledgerSvc.DB(), settlement.DefaultPolicy())
		}
		if s.pilot == nil {
			s.pilot = pilot.NewService(ledgerSvc.DB(), readOnly, true)
		}
		if s.support == nil {
			s.support = support.NewService(ledgerSvc.DB(), readOnly)
		}
	}
	s.configureWorkflow()
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
	if wait := s.auth.lockedFor(r.Context(), "operator", req.Email); wait > 0 {
		w.Header().Set("Retry-After", fmt.Sprintf("%d", int(wait.Seconds())+1))
		writeError(w, http.StatusTooManyRequests, "too_many_attempts", "too many failed sign-in attempts; try again later")
		return
	}
	token, err := s.auth.login(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, errInvalidCredentials) {
			s.auth.recordLoginFailure(r.Context(), "operator", req.Email)
			writeError(w, http.StatusUnauthorized, "invalid_credentials", "invalid email or password")
			return
		}
		writeError(w, http.StatusInternalServerError, "authentication_error", err.Error())
		return
	}
	s.auth.clearLoginFailures(r.Context(), "operator", req.Email)
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

func (s *Server) handleTraderLogin(w http.ResponseWriter, r *http.Request) {
	if s.auth == nil {
		writeError(w, http.StatusNotImplemented, "authentication_disabled", "trader authentication is not configured")
		return
	}
	var req struct {
		Phone    string `json:"phone"`
		Password string `json:"password"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	if wait := s.auth.lockedFor(r.Context(), "trader", req.Phone); wait > 0 {
		w.Header().Set("Retry-After", fmt.Sprintf("%d", int(wait.Seconds())+1))
		writeError(w, http.StatusTooManyRequests, "too_many_attempts", "too many failed sign-in attempts; try again later")
		return
	}
	token, err := s.auth.traderLogin(r.Context(), req.Phone, req.Password)
	if errors.Is(err, errInvalidCredentials) {
		s.auth.recordLoginFailure(r.Context(), "trader", req.Phone)
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "invalid phone or password")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "authentication_error", err.Error())
		return
	}
	s.auth.clearLoginFailures(r.Context(), "trader", req.Phone)
	trader, err := s.auth.traderForSession(r.Context(), token)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "authentication_error", err.Error())
		return
	}
	http.SetCookie(w, &http.Cookie{Name: traderSessionCookie, Value: token, Path: "/", HttpOnly: true,
		SameSite: http.SameSiteLaxMode, Secure: r.TLS != nil, MaxAge: 12 * 60 * 60})
	writeJSON(w, http.StatusOK, trader)
}

func (s *Server) handleTraderLogout(w http.ResponseWriter, r *http.Request) {
	if s.auth == nil {
		writeError(w, http.StatusNotImplemented, "authentication_disabled", "trader authentication is not configured")
		return
	}
	if token, ok := traderToken(r); ok {
		if err := s.auth.revokeTrader(r.Context(), token); err != nil {
			writeError(w, http.StatusInternalServerError, "authentication_error", "unable to end session")
			return
		}
	}
	http.SetCookie(w, &http.Cookie{Name: traderSessionCookie, Value: "", Path: "/", MaxAge: -1, HttpOnly: true, SameSite: http.SameSiteLaxMode})
	writeJSON(w, http.StatusOK, map[string]string{"status": "signed_out"})
}

func (s *Server) handleCurrentTrader(w http.ResponseWriter, r *http.Request) {
	trader, ok := traderFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "trader authentication is required")
		return
	}
	writeJSON(w, http.StatusOK, trader)
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
	s.mux.HandleFunc("GET /api/accounts/{id}/statement", s.handleAccountStatement)
	s.mux.HandleFunc("POST /api/accounts/{id}/fund", s.handleFundAccount)
	s.mux.HandleFunc("POST /api/transfers", s.handleCreateTransfer)
	s.mux.HandleFunc("POST /api/transfers/cross-border", s.handleCreateCrossBorderTransfer)
	s.mux.HandleFunc("GET /api/transfers/{id}", s.handleGetTransfer)
	s.mux.HandleFunc("GET /api/transfers/{id}/entries", s.handleListEntries)
	s.mux.HandleFunc("POST /api/transfers/{id}/reverse", s.handleReverseTransfer)
	s.mux.HandleFunc("GET /api/fx", s.handleGetFx)
	s.mux.Handle("GET /api/events", s.hub)
	s.mux.HandleFunc("GET /healthz", s.handleHealthz)
	s.mux.HandleFunc("GET /readyz", s.handleReadyz)
	s.mux.HandleFunc("GET /metrics", s.handleMetricsAuthed)
	s.mux.HandleFunc("GET /api/config/public", s.handlePublicConfig)
	s.mux.HandleFunc("GET /api/public/estimate", s.handlePublicEstimate)
	s.mux.HandleFunc("GET /api/trader/kyc", s.handleTraderKYCList)
	s.mux.HandleFunc("POST /api/trader/kyc", s.handleTraderKYCSubmit)
	s.mux.HandleFunc("GET /api/trader/trust-score", s.handleTraderTrust)
	s.mux.HandleFunc("GET /api/trader/limits", s.handleTraderLimits)
	s.mux.HandleFunc("GET /api/trader/analytics", s.handleTraderAnalytics)
	s.mux.HandleFunc("GET /api/operator/analytics", s.handleOperatorAnalytics)
	s.mux.HandleFunc("POST /api/auth/login", s.handleLogin)
	s.mux.HandleFunc("POST /api/auth/logout", s.handleLogout)
	s.mux.HandleFunc("GET /api/auth/me", s.handleCurrentOperator)
	s.mux.HandleFunc("POST /api/trader/auth/login", s.handleTraderLogin)
	s.mux.HandleFunc("POST /api/trader/auth/logout", s.handleTraderLogout)
	s.mux.HandleFunc("GET /api/trader/auth/me", s.handleCurrentTrader)
	s.mux.HandleFunc("GET /api/trader/me", s.handleCurrentTrader)
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
	// Phase 3 identity/compliance workflow. These routes never call an
	// external provider and never store document bytes.
	s.mux.HandleFunc("GET /api/organizations", s.handleListOrganizations)
	s.mux.HandleFunc("POST /api/organizations", s.handleCreateOrganization)
	s.mux.HandleFunc("GET /api/organizations/{id}", s.handleGetOrganization)
	s.mux.HandleFunc("GET /api/organizations/{id}/memberships", s.handleListMemberships)
	s.mux.HandleFunc("POST /api/organizations/{id}/memberships", s.handleAddMembership)
	s.mux.HandleFunc("PATCH /api/organizations/{id}/memberships/{membership_id}", s.handleUpdateMembership)
	s.mux.HandleFunc("GET /api/organizations/{id}/verifications", s.handleListVerifications)
	s.mux.HandleFunc("GET /api/organizations/{id}/risk-flags", s.handleListRiskFlags)
	s.mux.HandleFunc("POST /api/organizations/{id}/risk-flags", s.handleAddRiskFlag)
	s.mux.HandleFunc("POST /api/organizations/{id}/risk-flags/{flag_id}/resolve", s.handleResolveRiskFlag)
	s.mux.HandleFunc("POST /api/verifications", s.handleCreateVerification)
	s.mux.HandleFunc("GET /api/verifications", s.handleListAllVerifications)
	s.mux.HandleFunc("POST /api/verifications/{id}/decision", s.handleDecideVerification)
	s.mux.HandleFunc("GET /api/verifications/{id}/decisions", s.handleListVerificationDecisions)
	s.mux.HandleFunc("GET /api/compliance/reviews", s.handleListReviews)
	s.mux.HandleFunc("POST /api/compliance/reviews", s.handleCreateReview)
	s.mux.HandleFunc("GET /api/compliance/reviews/{id}/notes", s.handleListReviewNotes)
	s.mux.HandleFunc("POST /api/compliance/reviews/{id}/notes", s.handleAddReviewNote)
	s.mux.HandleFunc("GET /api/compliance/reviews/{id}/decisions", s.handleListDecisions)
	s.mux.HandleFunc("POST /api/compliance/reviews/{id}/decision", s.handleDecideReview)
	s.mux.HandleFunc("GET /api/providers/status", s.handleProviderStatus)
	s.mux.HandleFunc("GET /api/corridors", s.handleCorridorStatus)
	s.mux.HandleFunc("GET /api/quotes", s.handleQuote)
	s.mux.HandleFunc("GET /api/providers/webhooks/events", s.handleProviderWebhookEvents)
	s.mux.HandleFunc("GET /api/providers/reconciliation", s.handleProviderReconciliation)
	s.mux.HandleFunc("POST /api/provider-executions", s.handleProviderExecution)
	s.mux.HandleFunc("GET /api/provider-executions/{id}", s.handleProviderExecutionStatus)
	s.mux.HandleFunc("GET /api/provider-executions/transaction/{id}", s.handleProviderExecutionByTransaction)
	// This endpoint is a local intake boundary. It only records authenticated
	// provider evidence and never dispatches a payout or writes settlement.
	s.mux.HandleFunc("POST /api/provider-webhooks/{provider}", s.handleProviderWebhook)
	s.mux.HandleFunc("POST /api/transaction-workflows", s.handleCreateWorkflow)
	s.mux.HandleFunc("GET /api/transaction-workflows/{id}", s.handleGetWorkflow)
	s.mux.HandleFunc("GET /api/transaction-workflows/{id}/events", s.handleWorkflowEvents)
	s.mux.HandleFunc("POST /api/transaction-workflows/{id}/retry", s.handleRetryWorkflow)
	s.mux.HandleFunc("GET /api/operator/transaction-workflows/{id}", s.handleOperatorWorkflow)
	s.mux.HandleFunc("POST /api/settlements", s.handleSubmitSettlement)
	s.mux.HandleFunc("GET /api/settlements", s.handleListSettlements)
	s.mux.HandleFunc("GET /api/settlements/{id}", s.handleGetSettlement)
	s.mux.HandleFunc("GET /api/settlements/{id}/approvals", s.handleSettlementApprovals)
	s.mux.HandleFunc("POST /api/settlements/{id}/preflight", s.handleSettlementPreflight)
	s.mux.HandleFunc("POST /api/settlements/{id}/approve", s.handleApproveSettlement)
	s.mux.HandleFunc("POST /api/settlements/{id}/execute", s.handleExecuteSettlement)
	s.mux.HandleFunc("POST /api/settlements/{id}/cancel", s.handleCancelSettlement)
	s.mux.HandleFunc("GET /api/settlements/{id}/reconciliation", s.handleSettlementReconciliation)
	s.mux.HandleFunc("POST /api/settlements/{id}/reconciliation", s.handleRecordSettlementReconciliation)
	s.mux.HandleFunc("GET /api/settlements/{id}/audit", s.handleSettlementAudit)
	s.mux.HandleFunc("GET /api/pilots", s.handleListPilots)
	s.mux.HandleFunc("POST /api/pilots", s.handleCreatePilot)
	s.mux.HandleFunc("GET /api/pilots/{id}", s.handleGetPilot)
	s.mux.HandleFunc("PATCH /api/pilots/{id}", s.handleUpdatePilot)
	s.mux.HandleFunc("GET /api/pilots/{id}/participants", s.handlePilotParticipants)
	s.mux.HandleFunc("POST /api/pilots/{id}/participants", s.handlePilotParticipants)
	s.mux.HandleFunc("GET /api/pilots/{id}/approvals", s.handlePilotApprovals)
	s.mux.HandleFunc("POST /api/pilots/{id}/approve", s.handleApprovePilot)
	s.mux.HandleFunc("POST /api/pilots/{id}/pause", s.handlePausePilot)
	s.mux.HandleFunc("POST /api/pilots/{id}/resume", s.handleResumePilot)
	s.mux.HandleFunc("POST /api/pilots/{id}/cancel", s.handleCancelPilot)
	s.mux.HandleFunc("POST /api/pilots/{id}/complete", s.handleCompletePilot)
	s.mux.HandleFunc("GET /api/pilots/{id}/scenarios", s.handlePilotScenarios)
	s.mux.HandleFunc("POST /api/pilots/{id}/scenarios", s.handlePilotScenarios)
	s.mux.HandleFunc("GET /api/pilots/{id}/scenarios/{scenario_id}/runs", s.handlePilotRuns)
	s.mux.HandleFunc("POST /api/pilots/{id}/scenarios/{scenario_id}/runs", s.handlePilotRuns)
	s.mux.HandleFunc("GET /api/pilots/{id}/observations", s.handlePilotObservations)
	s.mux.HandleFunc("POST /api/pilots/{id}/observations", s.handlePilotObservations)
	s.mux.HandleFunc("GET /api/pilots/{id}/incidents", s.handlePilotIncidents)
	s.mux.HandleFunc("POST /api/pilots/{id}/incidents", s.handlePilotIncidents)
	s.mux.HandleFunc("GET /api/pilots/{id}/support-tickets", s.handlePilotIncidents)
	s.mux.HandleFunc("POST /api/pilots/{id}/support-tickets", s.handlePilotIncidents)
	s.mux.HandleFunc("GET /api/support/tickets", s.handleListSupportTickets)
	s.mux.HandleFunc("POST /api/support/tickets", s.handleCreateSupportTicket)
	s.mux.HandleFunc("GET /api/support/tickets/{id}", s.handleGetSupportTicket)
	s.mux.HandleFunc("PATCH /api/support/tickets/{id}", s.handleUpdateSupportTicket)
	s.mux.HandleFunc("GET /api/notifications", s.handleListNotifications)
	s.mux.HandleFunc("POST /api/notifications/{id}/read", s.handleReadNotification)
	s.mux.HandleFunc("GET /api/pilots/{id}/audit", s.handlePilotAudit)

	protected := s.mux
	if s.auth != nil {
		protected = http.NewServeMux()
		protected.Handle("/", s.mux)
		// Trader-facing legacy endpoints are authenticated separately from
		// operator governance. The ownership checks below remain defense in
		// depth for requests carrying an upstream trader context.
		for _, route := range []struct {
			method string
			path   string
			h      http.Handler
		}{
			{"GET", "/api/users/{id}", http.HandlerFunc(s.handleGetUser)},
			{"GET", "/api/lookup/user/{phone}", http.HandlerFunc(s.handleGetUserByPhone)},
			{"GET", "/api/users/{id}/accounts", http.HandlerFunc(s.handleListAccounts)},
			{"GET", "/api/users/{id}/transfers", http.HandlerFunc(s.handleListUserTransfers)},
			{"POST", "/api/users/{id}/invoices", http.HandlerFunc(s.handleCreateInvoice)},
			{"GET", "/api/users/{id}/invoices", http.HandlerFunc(s.handleListInvoices)},
			{"GET", "/api/invoices/{id}", http.HandlerFunc(s.handleGetInvoice)},
			{"GET", "/api/accounts/{id}", http.HandlerFunc(s.handleGetAccount)},
			{"GET", "/api/accounts/{id}/balance", http.HandlerFunc(s.handleGetBalance)},
			{"GET", "/api/accounts/{id}/statement", http.HandlerFunc(s.handleAccountStatement)},
			{"POST", "/api/accounts/{id}/fund", http.HandlerFunc(s.handleFundAccount)},
			{"POST", "/api/transfers", http.HandlerFunc(s.handleCreateTransfer)},
			{"POST", "/api/transfers/cross-border", http.HandlerFunc(s.handleCreateCrossBorderTransfer)},
			{"GET", "/api/transfers/{id}", http.HandlerFunc(s.handleGetTransfer)},
			{"GET", "/api/transfers/{id}/entries", http.HandlerFunc(s.handleListEntries)},
			{"POST", "/api/transfers/{id}/reverse", http.HandlerFunc(s.handleReverseTransfer)},
			{"POST", "/api/transaction-workflows", http.HandlerFunc(s.handleCreateWorkflow)},
			{"GET", "/api/transaction-workflows/{id}", http.HandlerFunc(s.handleGetWorkflow)},
			{"GET", "/api/transaction-workflows/{id}/events", http.HandlerFunc(s.handleWorkflowEvents)},
			{"POST", "/api/transaction-workflows/{id}/retry", http.HandlerFunc(s.handleRetryWorkflow)},
		} {
			protected.Handle(route.method+" "+route.path, s.auth.traderRequire(route.h))
		}
		protected.HandleFunc("POST /api/auth/login", s.handleLogin)
		protected.HandleFunc("POST /api/trader/auth/login", s.handleTraderLogin)
		protected.Handle("POST /api/trader/auth/logout", s.auth.traderRequire(http.HandlerFunc(s.handleTraderLogout)))
		protected.Handle("GET /api/trader/auth/me", s.auth.traderRequire(http.HandlerFunc(s.handleCurrentTrader)))
		protected.Handle("GET /api/trader/me", s.auth.traderRequire(http.HandlerFunc(s.handleCurrentTrader)))
		protected.Handle("GET /api/trader/recipients", s.auth.traderRequire(http.HandlerFunc(s.handleTraderRecipient)))
		protected.Handle("GET /api/trader/kyc", s.auth.traderRequire(http.HandlerFunc(s.handleTraderKYCList)))
		protected.Handle("POST /api/trader/kyc", s.auth.traderRequire(http.HandlerFunc(s.handleTraderKYCSubmit)))
		protected.Handle("GET /api/trader/trust-score", s.auth.traderRequire(http.HandlerFunc(s.handleTraderTrust)))
		protected.Handle("GET /api/trader/limits", s.auth.traderRequire(http.HandlerFunc(s.handleTraderLimits)))
		protected.Handle("GET /api/trader/analytics", s.auth.traderRequire(http.HandlerFunc(s.handleTraderAnalytics)))
		protected.Handle("GET /api/operator/analytics", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleOperatorAnalytics)))
		protected.Handle("GET /api/quotes", s.auth.traderRequire(http.HandlerFunc(s.handleQuote)))
		protected.Handle("GET /api/corridors", s.auth.traderRequire(http.HandlerFunc(s.handleCorridorStatus)))
		protected.Handle("GET /api/support/tickets", s.auth.traderRequire(http.HandlerFunc(s.handleListSupportTickets)))
		protected.Handle("POST /api/support/tickets", s.auth.traderRequire(http.HandlerFunc(s.handleCreateSupportTicket)))
		protected.Handle("GET /api/support/tickets/{id}", s.auth.traderRequire(http.HandlerFunc(s.handleGetSupportTicket)))
		protected.Handle("PATCH /api/support/tickets/{id}", s.auth.traderRequire(http.HandlerFunc(s.handleUpdateSupportTicket)))
		protected.Handle("GET /api/notifications", s.auth.traderRequire(http.HandlerFunc(s.handleListNotifications)))
		protected.Handle("POST /api/notifications/{id}/read", s.auth.traderRequire(http.HandlerFunc(s.handleReadNotification)))
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
		protected.Handle("GET /api/providers/status", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleProviderStatus)))
		protected.Handle("GET /api/providers/webhooks/events", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleProviderWebhookEvents)))
		protected.Handle("GET /api/providers/reconciliation", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleProviderReconciliation)))
		protected.Handle("POST /api/provider-executions", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleProviderExecution)))
		protected.Handle("GET /api/provider-executions/{id}", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleProviderExecutionStatus)))
		protected.Handle("GET /api/provider-executions/transaction/{id}", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleProviderExecutionByTransaction)))
		protected.Handle("GET /api/operator/transaction-workflows/{id}", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleOperatorWorkflow)))
		protected.Handle("GET /api/settlements", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleListSettlements)))
		protected.Handle("GET /api/settlements/{id}", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleGetSettlement)))
		protected.Handle("GET /api/settlements/{id}/approvals", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleSettlementApprovals)))
		protected.Handle("GET /api/settlements/{id}/reconciliation", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleSettlementReconciliation)))
		protected.Handle("GET /api/settlements/{id}/audit", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleSettlementAudit)))
		protected.Handle("POST /api/settlements", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleSubmitSettlement)))
		protected.Handle("POST /api/settlements/{id}/preflight", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleSettlementPreflight)))
		protected.Handle("POST /api/settlements/{id}/approve", s.auth.requireRole("arbiter")(http.HandlerFunc(s.handleApproveSettlement)))
		protected.Handle("POST /api/settlements/{id}/execute", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleExecuteSettlement)))
		protected.Handle("POST /api/settlements/{id}/cancel", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleCancelSettlement)))
		protected.Handle("POST /api/settlements/{id}/reconciliation", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleRecordSettlementReconciliation)))
		protected.Handle("GET /api/pilots", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleListPilots)))
		protected.Handle("POST /api/pilots", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleCreatePilot)))
		protected.Handle("GET /api/pilots/{id}", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleGetPilot)))
		protected.Handle("PATCH /api/pilots/{id}", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleUpdatePilot)))
		protected.Handle("GET /api/pilots/{id}/participants", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotParticipants)))
		protected.Handle("POST /api/pilots/{id}/participants", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotParticipants)))
		protected.Handle("GET /api/pilots/{id}/approvals", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotApprovals)))
		protected.Handle("POST /api/pilots/{id}/approve", s.auth.requireRole("arbiter")(http.HandlerFunc(s.handleApprovePilot)))
		protected.Handle("POST /api/pilots/{id}/pause", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePausePilot)))
		protected.Handle("POST /api/pilots/{id}/resume", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleResumePilot)))
		protected.Handle("POST /api/pilots/{id}/cancel", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleCancelPilot)))
		protected.Handle("POST /api/pilots/{id}/complete", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handleCompletePilot)))
		protected.Handle("GET /api/pilots/{id}/scenarios", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotScenarios)))
		protected.Handle("POST /api/pilots/{id}/scenarios", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotScenarios)))
		protected.Handle("GET /api/pilots/{id}/scenarios/{scenario_id}/runs", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotRuns)))
		protected.Handle("POST /api/pilots/{id}/scenarios/{scenario_id}/runs", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotRuns)))
		protected.Handle("GET /api/pilots/{id}/observations", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotObservations)))
		protected.Handle("POST /api/pilots/{id}/observations", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotObservations)))
		protected.Handle("GET /api/pilots/{id}/incidents", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotIncidents)))
		protected.Handle("POST /api/pilots/{id}/incidents", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotIncidents)))
		protected.Handle("GET /api/pilots/{id}/support-tickets", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotIncidents)))
		protected.Handle("POST /api/pilots/{id}/support-tickets", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotIncidents)))
		protected.Handle("GET /api/pilots/{id}/audit", s.auth.requireRole("operator", "arbiter")(http.HandlerFunc(s.handlePilotAudit)))
		for _, route := range []struct {
			method, path string
			handler      http.Handler
			roles        []string
		}{
			{"GET", "/api/organizations", http.HandlerFunc(s.handleListOrganizations), []string{"operator", "arbiter"}},
			{"POST", "/api/organizations", http.HandlerFunc(s.handleCreateOrganization), []string{"operator", "arbiter"}},
			{"GET", "/api/organizations/{id}", http.HandlerFunc(s.handleGetOrganization), []string{"operator", "arbiter"}},
			{"GET", "/api/organizations/{id}/memberships", http.HandlerFunc(s.handleListMemberships), []string{"operator", "arbiter"}},
			{"POST", "/api/organizations/{id}/memberships", http.HandlerFunc(s.handleAddMembership), []string{"operator", "arbiter"}},
			{"PATCH", "/api/organizations/{id}/memberships/{membership_id}", http.HandlerFunc(s.handleUpdateMembership), []string{"operator", "arbiter"}},
			{"GET", "/api/organizations/{id}/verifications", http.HandlerFunc(s.handleListVerifications), []string{"operator", "arbiter"}},
			{"GET", "/api/organizations/{id}/risk-flags", http.HandlerFunc(s.handleListRiskFlags), []string{"operator", "arbiter"}},
			{"POST", "/api/organizations/{id}/risk-flags", http.HandlerFunc(s.handleAddRiskFlag), []string{"operator", "arbiter"}},
			{"POST", "/api/organizations/{id}/risk-flags/{flag_id}/resolve", http.HandlerFunc(s.handleResolveRiskFlag), []string{"operator", "arbiter"}},
			{"POST", "/api/verifications", http.HandlerFunc(s.handleCreateVerification), []string{"operator", "arbiter"}},
			{"GET", "/api/verifications", http.HandlerFunc(s.handleListAllVerifications), []string{"operator", "arbiter"}},
			{"POST", "/api/verifications/{id}/decision", http.HandlerFunc(s.handleDecideVerification), []string{"operator", "arbiter"}},
			{"GET", "/api/verifications/{id}/decisions", http.HandlerFunc(s.handleListVerificationDecisions), []string{"operator", "arbiter"}},
			{"GET", "/api/compliance/reviews", http.HandlerFunc(s.handleListReviews), []string{"operator", "arbiter"}},
			{"POST", "/api/compliance/reviews", http.HandlerFunc(s.handleCreateReview), []string{"operator", "arbiter"}},
			{"GET", "/api/compliance/reviews/{id}/notes", http.HandlerFunc(s.handleListReviewNotes), []string{"operator", "arbiter"}},
			{"POST", "/api/compliance/reviews/{id}/notes", http.HandlerFunc(s.handleAddReviewNote), []string{"operator", "arbiter"}},
			{"GET", "/api/compliance/reviews/{id}/decisions", http.HandlerFunc(s.handleListDecisions), []string{"operator", "arbiter"}},
			{"POST", "/api/compliance/reviews/{id}/decision", http.HandlerFunc(s.handleDecideReview), []string{"operator", "arbiter"}},
		} {
			var h http.Handler = route.handler
			h = s.auth.requireRole(route.roles...)(h)
			protected.Handle(route.method+" "+route.path, h)
		}
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
		if r.Method != http.MethodGet && (strings.HasPrefix(r.URL.Path, "/api/organizations") ||
			strings.HasPrefix(r.URL.Path, "/api/verifications") ||
			strings.HasPrefix(r.URL.Path, "/api/compliance/")) {
			writeError(w, http.StatusLocked, "read_only_mode", "state-changing identity operations are disabled")
			return
		}
		if strings.HasPrefix(r.URL.Path, "/api/settlements") && r.Method != http.MethodGet {
			writeError(w, http.StatusLocked, "read_only_mode", "state-changing settlement operations are disabled")
			return
		}
		if strings.HasPrefix(r.URL.Path, "/api/pilots") && r.Method != http.MethodGet {
			writeError(w, http.StatusLocked, "read_only_mode", "state-changing pilot operations are disabled")
			return
		}
		if (strings.HasPrefix(r.URL.Path, "/api/support/") || strings.HasPrefix(r.URL.Path, "/api/notifications/")) &&
			r.Method != http.MethodGet {
			writeError(w, http.StatusLocked, "read_only_mode", "state-changing support operations are disabled")
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

func (s *Server) handleProviderStatus(w http.ResponseWriter, r *http.Request) {
	if s.providerCatalog == nil {
		writeError(w, http.StatusServiceUnavailable, "providers_unavailable", "provider control plane is not configured")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"providers": s.providerCatalog.Providers()})
}

func (s *Server) handleCorridorStatus(w http.ResponseWriter, r *http.Request) {
	if s.providerCatalog == nil {
		writeError(w, http.StatusServiceUnavailable, "providers_unavailable", "provider control plane is not configured")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"corridors": s.providerCatalog.Corridors()})
}

func (s *Server) handleQuote(w http.ResponseWriter, r *http.Request) {
	if s.providerCatalog == nil {
		writeError(w, http.StatusServiceUnavailable, "providers_unavailable", "provider control plane is not configured")
		return
	}
	corridorID := strings.TrimSpace(r.URL.Query().Get("corridor_id"))
	amountText := strings.TrimSpace(r.URL.Query().Get("amount_minor"))
	if corridorID == "" || amountText == "" {
		writeError(w, http.StatusBadRequest, "invalid_quote_request", "corridor_id and amount_minor are required")
		return
	}
	amount, err := strconv.ParseInt(amountText, 10, 64)
	if err != nil || amount <= 0 {
		writeError(w, http.StatusBadRequest, "invalid_quote_request", "amount_minor must be a positive integer")
		return
	}
	quote, err := s.providerCatalog.Quote(corridorID, amount, time.Now().UTC())
	if err != nil {
		switch {
		case errors.Is(err, providers.ErrProviderDisabled):
			writeError(w, http.StatusServiceUnavailable, "provider_disabled", err.Error())
		case errors.Is(err, providers.ErrKillSwitchActive):
			writeError(w, http.StatusLocked, "kill_switch_active", err.Error())
		case errors.Is(err, providers.ErrLimitExceeded):
			writeError(w, http.StatusUnprocessableEntity, "limit_exceeded", err.Error())
		default:
			writeError(w, http.StatusBadRequest, "invalid_quote_request", err.Error())
		}
		return
	}
	quote.ObservationOnly = !s.localSyntheticExecution
	execution := "disabled"
	if s.localSyntheticExecution {
		execution = "local_synthetic"
	}
	writeJSON(w, http.StatusOK, map[string]any{"quote": quote, "execution": execution, "observation_only": quote.ObservationOnly})
}

func (s *Server) handleProviderWebhookEvents(w http.ResponseWriter, r *http.Request) {
	if s.providerCatalog == nil {
		writeError(w, http.StatusServiceUnavailable, "providers_unavailable", "provider control plane is not configured")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"events": s.providerCatalog.WebhookEvents()})
}

func (s *Server) handleProviderReconciliation(w http.ResponseWriter, r *http.Request) {
	if s.providerCatalog == nil {
		writeError(w, http.StatusServiceUnavailable, "providers_unavailable", "provider control plane is not configured")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"reconciliation": s.providerCatalog.Reconciliations()})
}

func (s *Server) handleProviderWebhook(w http.ResponseWriter, r *http.Request) {
	if s.providerCatalog == nil {
		writeError(w, http.StatusServiceUnavailable, "providers_unavailable", "provider control plane is not configured")
		return
	}
	replayKey := strings.TrimSpace(r.Header.Get("Idempotency-Key"))
	if replayKey == "" {
		replayKey = strings.TrimSpace(r.Header.Get("X-Provider-Event-ID"))
	}
	if replayKey == "" {
		writeError(w, http.StatusBadRequest, "missing_replay_key", "Idempotency-Key or X-Provider-Event-ID is required")
		return
	}
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_webhook", "unable to read webhook body")
		return
	}
	event, err := s.providerCatalog.ReceiveWebhook(r.Context(), r.PathValue("provider"), replayKey, r.Header.Get("X-Provider-Signature"), body)
	if err != nil {
		status := http.StatusUnauthorized
		code := "webhook_rejected"
		if errors.Is(err, providers.ErrWebhookReplay) {
			status, code = http.StatusConflict, "webhook_replay"
		} else if errors.Is(err, providers.ErrProviderDisabled) {
			status, code = http.StatusServiceUnavailable, "provider_disabled"
		}
		writeJSON(w, status, map[string]any{"error": code, "message": err.Error(), "event": event})
		return
	}
	var evidence any
	if s.providerExecution != nil {
		if callback, decodeErr := providerexec.DecodeCallback(event.ProviderID, body, replayKey); decodeErr == nil {
			stored, replay, ingestErr := s.providerExecution.IngestEvent(r.Context(), callback)
			if ingestErr != nil {
				writeError(w, http.StatusServiceUnavailable, "provider_evidence_unavailable", ingestErr.Error())
				return
			}
			evidence = map[string]any{"event": stored, "replay": replay}
			if s.workflow != nil && !replay {
				if workflowErr := s.workflow.ApplyProviderEvent(r.Context(), callback); workflowErr != nil {
					s.log.Warn("provider callback workflow update deferred", "err", workflowErr, "transaction_id", callback.TransactionID)
				}
			}
		}
	}
	writeJSON(w, http.StatusAccepted, map[string]any{"event": event, "provider_evidence": evidence, "settlement": "not_started"})
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
	action := r.URL.Query().Get("action")
	search := r.URL.Query().Get("search")
	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="operator-activity.csv"`)
	writer := csv.NewWriter(w)
	if err := writer.Write([]string{"id", "actor", "role", "action", "resource", "details", "created_at"}); err != nil {
		return
	}
	// A regulator's export can span a period much longer than any single page: fetch every page,
	// not just the first, up to exportRowCap rows as a sanity limit (that's over an hour of activity
	// at one event/second, which is far beyond this engine's current traffic).
	// pageSize must not exceed listActivity's own internal clamp (it silently falls back to 50 for
	// any limit outside (0, 200], rather than clamping to 200 — so 200 is the real per-page max).
	const pageSize, exportRowCap = 200, 100_000
	rows := 0
	for offset := 0; ; offset += pageSize {
		page, _, err := s.auth.listActivity(r.Context(), pageSize, offset, action, search, from, to)
		if err != nil {
			s.log.Error("activity export", "err", err)
			return
		}
		for _, item := range page {
			if err := writer.Write([]string{item.ID, item.Actor, item.Role, item.Action, item.Resource, item.Details, item.CreatedAt}); err != nil {
				return
			}
		}
		rows += len(page)
		if len(page) < pageSize || rows >= exportRowCap {
			break
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
		requestID := strings.TrimSpace(r.Header.Get("X-Request-ID"))
		if requestID == "" {
			requestID = fmt.Sprintf("vuka-%d", time.Now().UnixNano())
		}
		w.Header().Set("X-Request-ID", requestID)
		w.Header().Set("X-API-Version", "1")
		securityHeaders(w, r)
		if s.metrics == nil {
			s.metrics = newMetrics()
		}
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		defer func() {
			s.metrics.observe(r.Method, r.URL.Path, sw.status, time.Since(start))
			if rec := recover(); rec != nil {
				s.log.Error("panic recovered", "err", rec, "path", r.URL.Path)
				writeError(w, http.StatusInternalServerError, "internal_error", "internal server error")
			}
			s.log.Info("request",
				"method", r.Method,
				"path", r.URL.Path,
				"status", sw.status,
				"duration_ms", time.Since(start).Milliseconds(),
				"request_id", requestID,
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
	if s.auth != nil && req.Password != "" {
		if err := s.auth.EnsureTraderPassword(r.Context(), user.ID, req.Password); err != nil {
			writeError(w, http.StatusBadRequest, "invalid_password", err.Error())
			return
		}
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"user":     user,
		"accounts": accounts,
	})
}

func (s *Server) handleGetUser(w http.ResponseWriter, r *http.Request) {
	if !s.requireTraderUser(w, r, r.PathValue("id")) {
		return
	}
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
	if traderID, ok := traderIDFromRequest(r); ok && traderID != user.ID {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot access another trader's record")
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (s *Server) handleTraderRecipient(w http.ResponseWriter, r *http.Request) {
	phone := strings.TrimSpace(r.URL.Query().Get("phone"))
	if phone == "" {
		writeError(w, http.StatusBadRequest, "invalid_recipient", "phone is required")
		return
	}
	user, err := s.ledger.GetUserByPhone(r.Context(), phone)
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	accounts, err := s.ledger.ListAccounts(r.Context(), user.ID)
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"user": map[string]string{
			"id":           user.ID,
			"full_name":    user.FullName,
			"phone_number": user.PhoneNumber,
		},
		"accounts": accounts,
	})
}

func (s *Server) handleListAccounts(w http.ResponseWriter, r *http.Request) {
	if !s.requireTraderUser(w, r, r.PathValue("id")) {
		return
	}
	accounts, err := s.ledger.ListAccounts(r.Context(), r.PathValue("id"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"accounts": accounts})
}

func (s *Server) handleListUserTransfers(w http.ResponseWriter, r *http.Request) {
	if !s.requireTraderUser(w, r, r.PathValue("id")) {
		return
	}
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
	if !s.requireTraderUser(w, r, r.PathValue("id")) {
		return
	}
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
	if !s.requireTraderUser(w, r, r.PathValue("id")) {
		return
	}
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
	if traderID, ok := traderIDFromRequest(r); ok && !s.ownsInvoice(r.Context(), traderID, r.PathValue("id")) {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot access this invoice")
		return
	}
	inv, err := s.ledger.GetInvoice(r.Context(), r.PathValue("id"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, inv)
}

func (s *Server) handleGetAccount(w http.ResponseWriter, r *http.Request) {
	if traderID, ok := traderIDFromRequest(r); ok && !s.ownsAccount(r.Context(), traderID, r.PathValue("id")) {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot access this account")
		return
	}
	acc, err := s.ledger.GetAccount(r.Context(), r.PathValue("id"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, acc)
}

func (s *Server) handleGetBalance(w http.ResponseWriter, r *http.Request) {
	if traderID, ok := traderIDFromRequest(r); ok && !s.ownsAccount(r.Context(), traderID, r.PathValue("id")) {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot access this account")
		return
	}
	balance, err := s.ledger.GetBalance(r.Context(), r.PathValue("id"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, balance)
}

// handleAccountStatement returns an account's ledger activity over a period, as either an ISO
// 20022 camt.053.001.08 statement (default — the format a bank or auditor expects) or JSON
// (?format=json, for the trader UI). Query params: from, to (RFC3339; default: the last 30 days).
func (s *Server) handleAccountStatement(w http.ResponseWriter, r *http.Request) {
	accountID := r.PathValue("id")
	if traderID, ok := traderIDFromRequest(r); ok && !s.ownsAccount(r.Context(), traderID, accountID) {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot access this account")
		return
	}

	to := time.Now().UTC()
	from := to.AddDate(0, 0, -30)
	if v := r.URL.Query().Get("to"); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_to", "to must be RFC3339, e.g. 2026-09-01T00:00:00Z")
			return
		}
		to = t
	}
	if v := r.URL.Query().Get("from"); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_from", "from must be RFC3339, e.g. 2026-08-01T00:00:00Z")
			return
		}
		from = t
	}
	if !from.Before(to) {
		writeError(w, http.StatusBadRequest, "invalid_range", "from must be before to")
		return
	}

	stmt, err := s.ledger.Statement(r.Context(), accountID, from, to)
	if err != nil {
		s.mapServiceError(w, err)
		return
	}

	if r.URL.Query().Get("format") == "json" {
		writeJSON(w, http.StatusOK, stmt)
		return
	}

	xml := buildCamt053(stmt)
	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="statement-%s-%s.xml"`,
		accountID[:8], to.Format("20060102")))
	_, _ = w.Write(xml)
}

func (s *Server) handleFundAccount(w http.ResponseWriter, r *http.Request) {
	if traderID, ok := traderIDFromRequest(r); ok && !s.ownsAccount(r.Context(), traderID, r.PathValue("id")) {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot fund this account")
		return
	}
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
	if traderID, ok := traderIDFromRequest(r); ok && !s.ownsAccount(r.Context(), traderID, req.SourceAccountID) {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot debit this account")
		return
	}

	if !s.enforceCompliance(w, r, key, req.SourceAccountID, req.DestinationAccountID, req.Amount, req.Currency) {
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
	if traderID, ok := traderIDFromRequest(r); ok && !s.ownsAccount(r.Context(), traderID, req.SourceAccountID) {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot debit this account")
		return
	}
	if !s.enforceCompliance(w, r, key, req.SourceAccountID, req.DestinationAccountID, req.Amount, req.CurrencyFrom) {
		return
	}
	if req.QuoteID != "" && s.providerCatalog != nil {
		amountMinor := int64(math.Round(req.Amount * 100))
		corridorID := req.CorridorID
		if corridorID == "" {
			id, cerr := s.requireCorridor(req.CurrencyFrom, req.CurrencyTo)
			if cerr != nil {
				writeError(w, http.StatusUnprocessableEntity, "no_corridor", cerr.Error())
				return
			}
			corridorID = id
		}
		if err := s.providerCatalog.ValidateQuote(corridorID, req.QuoteID, amountMinor, time.Now().UTC()); err != nil {
			writeError(w, http.StatusUnprocessableEntity, "invalid_quote", err.Error())
			return
		}
		// The firm quote's locked rate is authoritative: the customer is settled at
		// the rate they were shown, not at whatever the engine default is now.
		locked, verr := s.providerCatalog.VerifyQuote(req.QuoteID, time.Now().UTC())
		if verr != nil {
			writeError(w, http.StatusUnprocessableEntity, "invalid_quote", verr.Error())
			return
		}
		if req.FxRate != 0 && math.Abs(req.FxRate-locked.Rate) > 1e-9 {
			writeError(w, http.StatusUnprocessableEntity, "invalid_quote", "fx_rate does not match the firm quote")
			return
		}
		req.FxRate = locked.Rate
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
	if traderID, ok := traderIDFromRequest(r); ok && !s.ownsTransfer(r.Context(), traderID, r.PathValue("id")) {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot access this transfer")
		return
	}
	t, err := s.ledger.GetTransfer(r.Context(), r.PathValue("id"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (s *Server) handleListEntries(w http.ResponseWriter, r *http.Request) {
	if traderID, ok := traderIDFromRequest(r); ok && !s.ownsTransfer(r.Context(), traderID, r.PathValue("id")) {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot access these entries")
		return
	}
	entries, err := s.ledger.ListLedgerEntries(r.Context(), r.PathValue("id"))
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"entries": entries})
}

func (s *Server) handleReverseTransfer(w http.ResponseWriter, r *http.Request) {
	if traderID, ok := traderIDFromRequest(r); ok && !s.ownsTransfer(r.Context(), traderID, r.PathValue("id")) {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot reverse this transfer")
		return
	}
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

// phase3Error preserves validation/conflict/not-found semantics instead of
// turning workflow errors into broad 500 responses.
func (s *Server) phase3Error(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, identity.ErrNotFound):
		writeError(w, http.StatusNotFound, "not_found", err.Error())
	case errors.Is(err, identity.ErrConflict):
		writeError(w, http.StatusConflict, "conflict", err.Error())
	case errors.Is(err, identity.ErrSelfApproval):
		writeError(w, http.StatusForbidden, "self_approval_forbidden", err.Error())
	case errors.Is(err, identity.ErrInvalidTransition):
		writeError(w, http.StatusConflict, "invalid_transition", err.Error())
	case errors.Is(err, identity.ErrInvalid):
		writeError(w, http.StatusUnprocessableEntity, "invalid_request", err.Error())
	default:
		s.log.Error("phase 3 service error", "err", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "internal server error")
	}
}

func (s *Server) phase3Ready(w http.ResponseWriter) bool {
	if s.identity == nil {
		writeError(w, http.StatusServiceUnavailable, "identity_unavailable", "identity service is not configured")
		return false
	}
	return true
}

func (s *Server) handleListOrganizations(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	items, err := s.identity.ListOrganizations(r.Context(), r.URL.Query().Get("status"))
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"organizations": items})
}

func (s *Server) handleCreateOrganization(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	var req identity.CreateOrganizationRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := s.identity.CreateOrganization(r.Context(), req)
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	if actor, ok := operatorFromContext(r.Context()); ok {
		if err := s.auth.recordActivity(r.Context(), actor, "ORGANIZATION_CREATED", item.ID, "Local organization profile created"); err != nil {
			s.phase3Error(w, err)
			return
		}
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *Server) handleGetOrganization(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	item, err := s.identity.GetOrganization(r.Context(), r.PathValue("id"))
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (s *Server) handleListMemberships(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	items, err := s.identity.ListMemberships(r.Context(), r.PathValue("id"))
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"memberships": items})
}

func (s *Server) handleAddMembership(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	var req identity.CreateMembershipRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := s.identity.AddMembership(r.Context(), r.PathValue("id"), req)
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	if actor, ok := operatorFromContext(r.Context()); ok {
		if err := s.auth.recordActivity(r.Context(), actor, "MEMBERSHIP_CREATED", item.OrganizationID, "Organization membership created"); err != nil {
			s.phase3Error(w, err)
			return
		}
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *Server) handleUpdateMembership(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	var req identity.UpdateMembershipRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := s.identity.UpdateMembership(r.Context(), r.PathValue("id"), r.PathValue("membership_id"), req)
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	if actor, ok := operatorFromContext(r.Context()); ok {
		if err := s.auth.recordActivity(r.Context(), actor, "MEMBERSHIP_UPDATED", item.ID, "Organization membership status or role changed"); err != nil {
			s.phase3Error(w, err)
			return
		}
	}
	writeJSON(w, http.StatusOK, item)
}

func (s *Server) handleListVerifications(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	items, err := s.identity.ListVerifications(r.Context(), r.PathValue("id"), "")
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"verifications": items})
}

func (s *Server) handleCreateVerification(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	actor, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	var req identity.CreateVerificationRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := s.identity.CreateVerification(r.Context(), req, actor.Email)
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	if err := s.auth.recordActivity(r.Context(), actor, "IDENTITY_VERIFICATION_SUBMITTED", item.ID, "Local verification metadata submitted"); err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *Server) handleListAllVerifications(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	items, err := s.identity.ListVerifications(r.Context(), r.URL.Query().Get("organization_id"), r.URL.Query().Get("user_id"))
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"verifications": items})
}

func (s *Server) handleDecideVerification(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	actor, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	var req identity.DecideVerificationRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := s.identity.DecideVerification(r.Context(), r.PathValue("id"), actor.Email, req)
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	if err := s.auth.recordActivity(r.Context(), actor, "IDENTITY_VERIFICATION_DECIDED", item.ID, "Local verification decision recorded"); err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *Server) handleListVerificationDecisions(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	items, err := s.identity.ListVerificationDecisions(r.Context(), r.PathValue("id"))
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"decisions": items})
}

func (s *Server) handleListReviews(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	items, err := s.identity.ListReviews(r.Context(), r.URL.Query().Get("organization_id"), r.URL.Query().Get("status"))
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"reviews": items})
}

func (s *Server) handleCreateReview(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	actor, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	var req identity.CreateReviewRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := s.identity.CreateReview(r.Context(), req, actor.Email)
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	if err := s.auth.recordActivity(r.Context(), actor, "COMPLIANCE_REVIEW_CREATED", item.ID, "Compliance review opened"); err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *Server) handleDecideReview(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	actor, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	var req identity.DecideReviewRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	review, decision, err := s.identity.DecideReview(r.Context(), r.PathValue("id"), actor.Email, req)
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	if err := s.auth.recordActivity(r.Context(), actor, "COMPLIANCE_DECISION_RECORDED", review.ID, decision.FromStatus+" -> "+decision.ToStatus); err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"review": review, "decision": decision})
}

func (s *Server) handleListRiskFlags(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	items, err := s.identity.ListRiskFlags(r.Context(), r.PathValue("id"), r.URL.Query().Get("status"))
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"risk_flags": items})
}

func (s *Server) handleAddRiskFlag(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	actor, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	var req identity.CreateRiskFlagRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := s.identity.AddRiskFlag(r.Context(), r.PathValue("id"), req, actor.Email)
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	if err := s.auth.recordActivity(r.Context(), actor, "RISK_FLAG_CREATED", item.ID, item.Code+" "+item.Severity); err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *Server) handleResolveRiskFlag(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	actor, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	var req identity.ResolveRiskFlagRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := s.identity.ResolveRiskFlag(r.Context(), r.PathValue("id"), r.PathValue("flag_id"), actor.Email, req.Resolution)
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	if err := s.auth.recordActivity(r.Context(), actor, "RISK_FLAG_RESOLVED", item.ID, "Risk flag resolved"); err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *Server) handleListReviewNotes(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	items, err := s.identity.ListReviewNotes(r.Context(), r.PathValue("id"))
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"notes": items})
}

func (s *Server) handleAddReviewNote(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	actor, ok := operatorFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
		return
	}
	var req identity.CreateReviewNoteRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := s.identity.AddReviewNote(r.Context(), r.PathValue("id"), actor.Email, req.Note)
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	if err := s.auth.recordActivity(r.Context(), actor, "COMPLIANCE_REVIEW_NOTE_CREATED", item.ReviewID, "Compliance review note added"); err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *Server) handleListDecisions(w http.ResponseWriter, r *http.Request) {
	if !s.phase3Ready(w) {
		return
	}
	items, err := s.identity.ListDecisions(r.Context(), r.PathValue("id"))
	if err != nil {
		s.phase3Error(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"decisions": items})
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
