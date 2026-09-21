package api

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"math"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"vuka/go-bridge-core/internal/analytics"
	"vuka/go-bridge-core/internal/identity"
	"vuka/go-bridge-core/internal/providers"
	"vuka/go-bridge-core/internal/risk"
	"vuka/go-bridge-core/internal/trust"
)

// PublicConfig is the non-secret deployment description the web app needs to
// configure itself (chain, contract, environment). It is served unauthenticated
// and must never contain credentials or internal hostnames.
type PublicConfig struct {
	Environment           string
	ChainID               int64
	EscrowContract        string
	ReconciliationEnabled bool
	LiveProviders         bool
	SettlementExecution   bool
}

// WithRisk enables KYC-tiered limits and sanctions screening on money-moving
// routes. Without it the engine behaves as before (no limits), which is only
// acceptable for local development.
func WithRisk(svc *risk.Service, screener risk.Screener) Option {
	return func(s *Server) { s.risk, s.screener = svc, screener }
}

// WithPublicConfig sets what GET /api/config/public reports.
func WithPublicConfig(c PublicConfig) Option {
	return func(s *Server) { s.publicCfg = c }
}

// ---- public configuration ---------------------------------------------------------------

func (s *Server) handlePublicConfig(w http.ResponseWriter, r *http.Request) {
	type country struct {
		Code         string `json:"code"`
		Name         string `json:"name"`
		Currency     string `json:"currency"`
		Region       string `json:"region"`
		ProviderID   string `json:"provider_id"`
		ProviderName string `json:"provider_name"`
	}
	active := map[string]bool{}
	corridorCount := 0
	if s.providerCatalog != nil {
		for _, p := range s.providerCatalog.Providers() {
			for _, c := range p.Config.SupportedCountries {
				active[c] = true
			}
		}
		corridorCount = len(s.providerCatalog.Corridors())
	}
	countries := []country{}
	currencies := []string{}
	for _, c := range providers.Countries {
		if active[c.Code] {
			countries = append(countries, country{c.Code, c.Name, c.Currency, c.Region, c.ProviderID, c.ProviderName})
			currencies = append(currencies, c.Currency)
		}
	}
	sort.Strings(currencies)
	var limits map[string]risk.Limits
	if s.risk != nil {
		limits = s.risk.Table()
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"api_version":     "1",
		"environment":     s.publicCfg.Environment,
		"countries":       countries,
		"currencies":      currencies,
		"corridor_count":  corridorCount,
		"rate_convention": providers.RateConvention,
		"kyc_limits":      limits,
		"chain": map[string]any{
			"enabled": s.publicCfg.ReconciliationEnabled, "chain_id": s.publicCfg.ChainID,
			"escrow_contract": s.publicCfg.EscrowContract,
		},
		"features": map[string]bool{
			"sandbox_rails":        !s.publicCfg.LiveProviders,
			"live_providers":       s.publicCfg.LiveProviders,
			"settlement_execution": s.publicCfg.SettlementExecution,
			"sanctions_screening":  s.screener != nil,
			"kyc_limits":           s.risk != nil,
		},
	})
}

// ---- health -------------------------------------------------------------------------------

// handleReadyz is the readiness probe: unlike /healthz (liveness) it verifies
// the dependencies a request needs — the database and the provider catalog.
func (s *Server) handleReadyz(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	checks := map[string]string{}
	ready := true
	if s.ledger == nil || s.ledger.Ping(ctx) != nil {
		checks["database"], ready = "unavailable", false
	} else {
		checks["database"] = "ok"
	}
	if s.providerCatalog == nil || len(s.providerCatalog.Corridors()) == 0 {
		checks["providers"], ready = "no corridors configured", false
	} else {
		checks["providers"] = "ok"
	}
	code := http.StatusOK
	if !ready {
		code = http.StatusServiceUnavailable
	}
	writeJSON(w, code, map[string]any{"ready": ready, "checks": checks})
}

func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
	s.metrics.write(w)
}

// ---- trader KYC ---------------------------------------------------------------------------

func (s *Server) handleTraderKYCList(w http.ResponseWriter, r *http.Request) {
	traderID, ok := traderIDFromRequest(r)
	if !ok || s.identity == nil {
		writeError(w, http.StatusUnauthorized, "authentication_required", "trader authentication is required")
		return
	}
	items, err := s.identity.ListVerifications(r.Context(), "", traderID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "kyc_error", err.Error())
		return
	}
	if items == nil {
		items = []*identity.Verification{}
	}
	resp := map[string]any{"verifications": items}
	if s.risk != nil {
		if snap, err := s.risk.Snapshot(r.Context(), traderID); err == nil {
			resp["standing"] = snap
		}
	}
	writeJSON(w, http.StatusOK, resp)
}

// handleTraderKYCSubmit lets a trader file verification EVIDENCE METADATA
// (a document reference and label), never document contents — the identity
// service rejects anything that looks like raw content.
func (s *Server) handleTraderKYCSubmit(w http.ResponseWriter, r *http.Request) {
	traderID, ok := traderIDFromRequest(r)
	if !ok || s.identity == nil {
		writeError(w, http.StatusUnauthorized, "authentication_required", "trader authentication is required")
		return
	}
	if s.readOnly {
		writeError(w, http.StatusLocked, "read_only_mode", "state-changing identity operations are disabled")
		return
	}
	var req struct {
		VerificationType string `json:"verification_type"`
		Reference        string `json:"reference"`
		EvidenceLabel    string `json:"evidence_label"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	user, err := s.ledger.GetUser(r.Context(), traderID)
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	v, err := s.identity.CreateVerification(r.Context(), identity.CreateVerificationRequest{
		UserID: traderID, VerificationType: req.VerificationType, Reference: req.Reference, EvidenceLabel: req.EvidenceLabel,
	}, "trader:"+user.PhoneNumber)
	if err != nil {
		if errors.Is(err, identity.ErrInvalid) {
			writeError(w, http.StatusUnprocessableEntity, "invalid_verification",
				"verification_type must be identity, business, address or ownership, and reference must point to evidence held elsewhere "+
					"(provider://…, registry://…, case://… or hash:sha256:<digest>) — never the document itself")
			return
		}
		writeError(w, http.StatusInternalServerError, "kyc_error", "unable to record verification")
		return
	}
	writeJSON(w, http.StatusCreated, v)
}

// ---- trust score --------------------------------------------------------------------------

func (s *Server) handleTraderTrust(w http.ResponseWriter, r *http.Request) {
	traderID, ok := traderIDFromRequest(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "trader authentication is required")
		return
	}
	txs, err := trust.Load(r.Context(), s.ledger.DB(), traderID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "trust_error", err.Error())
		return
	}
	invs, err := s.ledger.ListInvoices(r.Context(), traderID, "")
	if err != nil {
		s.mapServiceError(w, err)
		return
	}
	paid := 0
	for _, inv := range invs {
		if inv.Status == "PAID" {
			paid++
		}
	}
	writeJSON(w, http.StatusOK, trust.Compute(trust.Input{Transfers: txs, InvoicesTotal: len(invs), InvoicesPaid: paid}))
}

// ---- limits & screening ---------------------------------------------------------------------

func (s *Server) handleTraderLimits(w http.ResponseWriter, r *http.Request) {
	traderID, ok := traderIDFromRequest(r)
	if !ok || s.risk == nil {
		writeError(w, http.StatusServiceUnavailable, "limits_unavailable", "transaction limits are not configured")
		return
	}
	snap, err := s.risk.Snapshot(r.Context(), traderID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "limits_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, snap)
}

// enforceCompliance applies the sanctions gate to both parties and the KYC
// limit to the sender. It returns false after writing the response when the
// payment must not proceed. Fail-closed: any error in a control blocks the
// payment. A replay of an already-recorded idempotency key is passed through
// so the client receives the original result instead of a fresh rejection.
func (s *Server) enforceCompliance(w http.ResponseWriter, r *http.Request, idemKey, sourceAccountID, destAccountID string, amount float64, currency string) bool {
	if s.risk == nil && s.screener == nil {
		return true
	}
	ctx := r.Context()
	if idemKey != "" {
		if prior, err := s.ledger.GetTransferByIdempotencyKey(ctx, idemKey); err == nil && prior != nil {
			return true
		}
	}
	src, err := s.ledger.GetAccount(ctx, sourceAccountID)
	if err != nil {
		s.mapServiceError(w, err)
		return false
	}
	dst, err := s.ledger.GetAccount(ctx, destAccountID)
	if err != nil {
		s.mapServiceError(w, err)
		return false
	}
	if s.screener != nil {
		for role, uid := range map[string]string{"sender": src.UserID, "recipient": dst.UserID} {
			user, uerr := s.ledger.GetUser(ctx, uid)
			if uerr != nil {
				s.mapServiceError(w, uerr)
				return false
			}
			res, serr := s.screener.Screen(ctx, risk.Subject{FullName: user.FullName, Phone: user.PhoneNumber})
			if serr != nil {
				s.log.Error("sanctions screening unavailable; blocking payment", "err", serr)
				writeError(w, http.StatusServiceUnavailable, "screening_unavailable", "compliance screening is temporarily unavailable; the payment was not processed")
				return false
			}
			if res.Status != risk.ScreenClear {
				s.log.Warn("payment blocked by screening", "role", role, "status", res.Status, "ref", res.Reference, "provider", res.Provider)
				code, status := "sanctions_hit", http.StatusForbidden
				if res.Status == risk.ScreenReview {
					code = "compliance_review_required"
				}
				// Deliberately generic: never tip off which party or list matched.
				writeError(w, status, code, "this payment cannot be processed; contact support quoting your request reference")
				return false
			}
		}
	}
	if s.risk != nil {
		d, cerr := s.risk.Check(ctx, src.UserID, amount, currency)
		if cerr != nil {
			s.log.Error("limit check failed; blocking payment", "err", cerr)
			writeError(w, http.StatusServiceUnavailable, "limits_unavailable", "transaction limits could not be verified; the payment was not processed")
			return false
		}
		if !d.Allowed {
			writeJSON(w, http.StatusUnprocessableEntity, map[string]any{
				"error":    map[string]string{"code": d.Code, "message": d.Message},
				"standing": d,
			})
			return false
		}
	}
	return true
}

// corridorFor resolves the corridor for a currency pair (each supported
// currency belongs to exactly one country, so the pair is unambiguous).
func (s *Server) corridorFor(from, to string) (string, bool) {
	if s.providerCatalog == nil {
		return "", false
	}
	for _, c := range s.providerCatalog.Corridors() {
		if c.FromCurrency == from && c.ToCurrency == to {
			return c.ID, true
		}
	}
	return "", false
}

var errNoCorridor = errors.New("no corridor is configured for this currency pair")

func (s *Server) requireCorridor(from, to string) (string, error) {
	if id, ok := s.corridorFor(from, to); ok {
		return id, nil
	}
	return "", fmt.Errorf("%w: %s to %s", errNoCorridor, strings.ToUpper(from), strings.ToUpper(to))
}

// WithMetricsToken sets the bearer token Prometheus must present to /metrics.
func WithMetricsToken(token string) Option { return func(s *Server) { s.metricsToken = token } }

// handleMetricsAuthed guards /metrics: with a token configured it must be
// presented as a bearer credential; without one the endpoint is only served
// outside production, so metrics are never exposed anonymously on the internet.
func (s *Server) handleMetricsAuthed(w http.ResponseWriter, r *http.Request) {
	if s.metricsToken != "" {
		got := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		if subtleEqual(got, s.metricsToken) {
			s.handleMetrics(w, r)
			return
		}
		writeError(w, http.StatusUnauthorized, "authentication_required", "metrics token required")
		return
	}
	if s.publicCfg.Environment == "production" {
		http.NotFound(w, r)
		return
	}
	s.handleMetrics(w, r)
}

func subtleEqual(a, b string) bool {
	return len(a) == len(b) && subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}

// WithAnalytics enables the dashboard aggregate endpoints.
func WithAnalytics(svc *analytics.Service) Option { return func(s *Server) { s.analytics = svc } }

func daysParam(r *http.Request) int {
	n, err := strconv.Atoi(r.URL.Query().Get("days"))
	if err != nil {
		return 30
	}
	return n
}

// handleTraderAnalytics reports one trader's own activity; the trader id comes
// from the session, never from a query parameter.
func (s *Server) handleTraderAnalytics(w http.ResponseWriter, r *http.Request) {
	traderID, ok := traderIDFromRequest(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication_required", "trader authentication is required")
		return
	}
	if s.analytics == nil {
		writeError(w, http.StatusServiceUnavailable, "analytics_unavailable", "analytics are not configured")
		return
	}
	rep, err := s.analytics.Trader(r.Context(), traderID, daysParam(r))
	if err != nil {
		s.log.Error("trader analytics", "err", err)
		writeError(w, http.StatusInternalServerError, "analytics_error", "unable to build the report")
		return
	}
	writeJSON(w, http.StatusOK, rep)
}

// handleOperatorAnalytics reports platform-wide activity (operator/arbiter roles).
func (s *Server) handleOperatorAnalytics(w http.ResponseWriter, r *http.Request) {
	if s.analytics == nil {
		writeError(w, http.StatusServiceUnavailable, "analytics_unavailable", "analytics are not configured")
		return
	}
	rep, err := s.analytics.Platform(r.Context(), daysParam(r))
	if err != nil {
		s.log.Error("platform analytics", "err", err)
		writeError(w, http.StatusInternalServerError, "analytics_error", "unable to build the report")
		return
	}
	writeJSON(w, http.StatusOK, rep)
}

// handlePublicEstimate is the unauthenticated "what will it cost?" calculator behind the public
// landing page. It reports an INDICATIVE fee, rate and delivered amount for a corridor at the
// platform's reference rates. It carries no signed quote id and cannot be used to pay: a firm,
// bindable quote requires a signed-in trader (GET /api/quotes).
func (s *Server) handlePublicEstimate(w http.ResponseWriter, r *http.Request) {
	if s.providerCatalog == nil {
		writeError(w, http.StatusServiceUnavailable, "providers_unavailable", "provider control plane is not configured")
		return
	}
	from := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("from")))
	to := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("to")))
	amount, err := strconv.ParseFloat(strings.TrimSpace(r.URL.Query().Get("amount")), 64)
	if len(from) != 3 || len(to) != 3 || err != nil || amount <= 0 || amount > 1e12 {
		writeError(w, http.StatusBadRequest, "invalid_estimate_request", "from, to (ISO currency codes) and a positive amount are required")
		return
	}
	corridorID, cerr := s.requireCorridor(from, to)
	if cerr != nil {
		writeError(w, http.StatusNotFound, "no_corridor", cerr.Error())
		return
	}
	corridor, _ := s.providerCatalog.Corridor(corridorID)
	minor := int64(math.Round(amount * 100))
	q, qerr := s.providerCatalog.Quote(corridorID, minor, time.Now().UTC())
	if qerr != nil {
		body := map[string]any{"error": map[string]string{"code": "estimate_unavailable", "message": qerr.Error()},
			"min_amount": float64(corridor.MinAmountMinor) / 100, "max_amount": float64(corridor.MaxAmountMinor) / 100}
		status := http.StatusUnprocessableEntity
		if errors.Is(qerr, providers.ErrKillSwitchActive) {
			status = http.StatusLocked
		}
		writeJSON(w, status, body)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"indicative": true, "corridor_id": corridorID,
		"from": from, "to": to, "amount": amount,
		"fee": float64(q.FeeMinor) / 100, "fee_bps": corridor.FeesBps,
		"delivered": float64(q.DeliverAmount) / 100,
		"rate":      q.Rate, "inverse_rate": q.InverseRate, "rate_convention": q.RateConvention, "rate_source": q.RateSource,
		"provider_id": corridor.ProviderID,
		"min_amount":  float64(corridor.MinAmountMinor) / 100, "max_amount": float64(corridor.MaxAmountMinor) / 100,
		"note": "Indicative only. Sign in for a firm, signed quote that locks this rate.",
	})
}
