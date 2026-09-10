package api

import (
	"errors"
	"net/http"
	"strings"

	"vuka/go-bridge-core/internal/settlement"
)

func (s *Server) settlementService(w http.ResponseWriter) *settlement.Service {
	if s.settlement == nil {
		writeError(w, http.StatusServiceUnavailable, "settlement_unavailable", "settlement control plane is not configured")
	}
	return s.settlement
}

func settlementActor(r *http.Request) (string, string) {
	if operator, ok := operatorFromContext(r.Context()); ok {
		return operator.Email, operator.Role
	}
	return "local-operator", "operator"
}

func (s *Server) handleSubmitSettlement(w http.ResponseWriter, r *http.Request) {
	svc := s.settlementService(w)
	if svc == nil {
		return
	}
	actor, role := settlementActor(r)
	var req settlement.Request
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	if req.IdempotencyKey == "" {
		req.IdempotencyKey = r.Header.Get("Idempotency-Key")
	}
	cmd, replay, err := svc.Submit(r.Context(), req, actor)
	if err != nil {
		mapSettlementError(w, err)
		return
	}
	if err := svc.Audit(r.Context(), cmd.ID, actor, role, "SETTLEMENT_SUBMITTED", "Controlled settlement command submitted"); err != nil {
		mapSettlementError(w, err)
		return
	}
	status := http.StatusCreated
	if replay {
		status = http.StatusOK
	}
	writeJSON(w, status, map[string]any{"command": cmd, "replay": replay, "dry_run_only": true})
}

func (s *Server) handleListSettlements(w http.ResponseWriter, r *http.Request) {
	svc := s.settlementService(w)
	if svc == nil {
		return
	}
	items, err := svc.List(r.Context(), r.URL.Query().Get("status"), 100)
	if err != nil {
		mapSettlementError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"commands": items, "policy": svc.Policy()})
}

func (s *Server) handleGetSettlement(w http.ResponseWriter, r *http.Request) {
	svc := s.settlementService(w)
	if svc == nil {
		return
	}
	cmd, err := svc.Get(r.Context(), r.PathValue("id"))
	if err != nil {
		mapSettlementError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"command": cmd})
}

func (s *Server) handleSettlementApprovals(w http.ResponseWriter, r *http.Request) {
	svc := s.settlementService(w)
	if svc == nil {
		return
	}
	items, err := svc.Approvals(r.Context(), r.PathValue("id"))
	if err != nil {
		mapSettlementError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"approvals": items})
}

func (s *Server) handleSettlementPreflight(w http.ResponseWriter, r *http.Request) {
	svc := s.settlementService(w)
	if svc == nil {
		return
	}
	cmd, err := svc.Get(r.Context(), r.PathValue("id"))
	if err != nil {
		mapSettlementError(w, err)
		return
	}
	providerEnabled, corridorEnabled, providerKill, corridorKill, fxValid := false, false, false, false, false
	if s.providerCatalog != nil {
		providerEnabled, corridorEnabled, providerKill, corridorKill, fxValid =
			s.providerCatalog.SettlementState(cmd.ProviderID, cmd.CorridorID, cmd.AmountMinor)
	}
	var body struct {
		IdentityApproved bool `json:"identity_approved"`
	}
	if r.ContentLength != 0 {
		_ = decodeJSON(r, &body)
	}
	result, err := svc.Preflight(r.Context(), cmd.ID, providerEnabled, corridorEnabled, providerKill, corridorKill, fxValid, body.IdentityApproved)
	if err != nil {
		mapSettlementError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (s *Server) handleApproveSettlement(w http.ResponseWriter, r *http.Request) {
	svc := s.settlementService(w)
	if svc == nil {
		return
	}
	actor, role := settlementActor(r)
	var req settlement.ApprovalRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	cmd, err := svc.Approve(r.Context(), r.PathValue("id"), actor, role, req)
	if err != nil {
		mapSettlementError(w, err)
		return
	}
	if err := svc.Audit(r.Context(), cmd.ID, actor, role, "SETTLEMENT_APPROVAL", string(req.Decision)); err != nil {
		mapSettlementError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"command": cmd})
}

func (s *Server) handleExecuteSettlement(w http.ResponseWriter, r *http.Request) {
	svc := s.settlementService(w)
	if svc == nil {
		return
	}
	actor, role := settlementActor(r)
	var req struct {
		DryRun           *bool `json:"dry_run"`
		IdentityApproved bool  `json:"identity_approved"`
	}
	if r.ContentLength != 0 {
		_ = decodeJSON(r, &req)
	}
	dryRun := req.DryRun == nil || *req.DryRun
	cmd, err := svc.Get(r.Context(), r.PathValue("id"))
	if err != nil {
		mapSettlementError(w, err)
		return
	}
	if dryRun {
		providerEnabled, corridorEnabled, providerKill, corridorKill, fxValid := false, false, false, false, false
		if s.providerCatalog != nil {
			providerEnabled, corridorEnabled, providerKill, corridorKill, fxValid =
				s.providerCatalog.SettlementState(cmd.ProviderID, cmd.CorridorID, cmd.AmountMinor)
		}
		pe, e := svc.Preflight(r.Context(), cmd.ID, providerEnabled, corridorEnabled, providerKill, corridorKill, fxValid, req.IdentityApproved)
		if e != nil {
			mapSettlementError(w, e)
			return
		}
		if !pe.Passed {
			writeJSON(w, http.StatusConflict, map[string]any{"error": "preflight_failed", "preflight": pe})
			return
		}
		cmd, err = svc.DryRun(r.Context(), cmd.ID, pe)
		if err != nil {
			mapSettlementError(w, err)
			return
		}
		if err := svc.Audit(r.Context(), cmd.ID, actor, role, "SETTLEMENT_DRY_RUN", "Simulated execution; no provider or ledger side effects"); err != nil {
			mapSettlementError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"command": cmd, "preflight": pe, "simulated": true})
		return
	}
	_, err = svc.Execute(r.Context(), cmd.ID)
	if errors.Is(err, settlement.ErrLiveExecutionDisabled) {
		_ = svc.Audit(r.Context(), cmd.ID, actor, role, "SETTLEMENT_LIVE_REFUSED", "Live execution is disabled by the settlement boundary")
	}
	mapSettlementError(w, err)
}

func (s *Server) handleCancelSettlement(w http.ResponseWriter, r *http.Request) {
	svc := s.settlementService(w)
	if svc == nil {
		return
	}
	actor, role := settlementActor(r)
	cmd, err := svc.Cancel(r.Context(), r.PathValue("id"), actor)
	if err != nil {
		mapSettlementError(w, err)
		return
	}
	if err := svc.Audit(r.Context(), cmd.ID, actor, role, "SETTLEMENT_CANCELLED", "Command cancelled"); err != nil {
		mapSettlementError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"command": cmd})
}

func (s *Server) handleSettlementReconciliation(w http.ResponseWriter, r *http.Request) {
	svc := s.settlementService(w)
	if svc == nil {
		return
	}
	items, err := svc.Reconciliations(r.Context(), r.PathValue("id"))
	if err != nil {
		mapSettlementError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"reconciliation": items})
}

func (s *Server) handleRecordSettlementReconciliation(w http.ResponseWriter, r *http.Request) {
	svc := s.settlementService(w)
	if svc == nil {
		return
	}
	actor, role := settlementActor(r)
	var req struct {
		ProviderReference string `json:"provider_reference"`
		Outcome           string `json:"outcome"`
		Detail            string `json:"detail"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := svc.Reconcile(r.Context(), r.PathValue("id"), req.ProviderReference, req.Outcome, req.Detail)
	if err != nil {
		mapSettlementError(w, err)
		return
	}
	if err := svc.Audit(r.Context(), r.PathValue("id"), actor, role, "SETTLEMENT_RECONCILED", req.Outcome); err != nil {
		mapSettlementError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (s *Server) handleSettlementAudit(w http.ResponseWriter, r *http.Request) {
	svc := s.settlementService(w)
	if svc == nil {
		return
	}
	items, err := svc.AuditEvents(r.Context(), r.PathValue("id"))
	if err != nil {
		mapSettlementError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"audit": items})
}

func mapSettlementError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, settlement.ErrNotFound):
		writeError(w, http.StatusNotFound, "settlement_not_found", err.Error())
	case errors.Is(err, settlement.ErrSelfApproval):
		writeError(w, http.StatusForbidden, "self_approval_forbidden", err.Error())
	case errors.Is(err, settlement.ErrInsufficientApprovals):
		writeError(w, http.StatusForbidden, "insufficient_approvals", err.Error())
	case errors.Is(err, settlement.ErrLiveExecutionDisabled):
		writeError(w, http.StatusLocked, "live_execution_disabled", err.Error())
	case errors.Is(err, settlement.ErrConflict):
		writeError(w, http.StatusConflict, "settlement_conflict", err.Error())
	case errors.Is(err, settlement.ErrInvalid):
		writeError(w, http.StatusBadRequest, "invalid_settlement", err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "settlement_error", strings.TrimSpace(err.Error()))
	}
}
