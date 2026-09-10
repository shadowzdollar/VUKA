package api

import (
	"errors"
	"net/http"
	"strings"

	"vuka/go-bridge-core/internal/pilot"
)

func (s *Server) pilotService(w http.ResponseWriter) *pilot.Service {
	if s.pilot == nil {
		writeError(w, http.StatusServiceUnavailable, "pilot_unavailable", "pilot control plane is not configured")
		return nil
	}
	return s.pilot
}

func (s *Server) handleListPilots(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	items, err := svc.List(r.Context(), r.URL.Query().Get("status"))
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"pilots": items, "settlement_kill_switch_active": true, "observation_only": true})
}

func (s *Server) handleCreatePilot(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	actor, role := settlementActor(r)
	var req pilot.CreateRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	p, err := svc.CreateAs(r.Context(), req, actor, role)
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"pilot": p, "observation_only": true, "live_execution": false})
}

func (s *Server) handleGetPilot(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	p, err := svc.Get(r.Context(), r.PathValue("id"))
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"pilot": p})
}

func (s *Server) handleUpdatePilot(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	actor, role := settlementActor(r)
	var req pilot.UpdateRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	p, err := svc.Update(r.Context(), r.PathValue("id"), req, actor)
	if err != nil {
		mapPilotError(w, err)
		return
	}
	_ = svc.Audit(r.Context(), p.ID, actor, role, "PILOT_UPDATED", "Pilot updated")
	writeJSON(w, http.StatusOK, map[string]any{"pilot": p})
}

func (s *Server) handlePilotParticipants(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	if r.Method == http.MethodGet {
		items, err := svc.Participants(r.Context(), r.PathValue("id"))
		if err != nil {
			mapPilotError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"participants": items})
		return
	}
	actor, _ := settlementActor(r)
	var req pilot.ParticipantRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := svc.AddParticipant(r.Context(), r.PathValue("id"), req, actor)
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"participant": item})
}

func (s *Server) handlePilotApprovals(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	items, err := svc.Approvals(r.Context(), r.PathValue("id"))
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"approvals": items})
}

func (s *Server) handleApprovePilot(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	actor, role := settlementActor(r)
	var req pilot.ApprovalRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	p, err := svc.Approve(r.Context(), r.PathValue("id"), actor, role, req)
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"pilot": p, "required_approvals": p.RequiredApprovals})
}

func (s *Server) handlePausePilot(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	actor, role := settlementActor(r)
	p, err := svc.Pause(r.Context(), r.PathValue("id"), actor, role)
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"pilot": p})
}

func (s *Server) handleResumePilot(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	actor, role := settlementActor(r)
	p, err := svc.Resume(r.Context(), r.PathValue("id"), actor, role)
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"pilot": p, "observation_only": true, "settlement_execution": "disabled"})
}

func (s *Server) handleCancelPilot(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	actor, role := settlementActor(r)
	p, err := svc.Cancel(r.Context(), r.PathValue("id"), actor, role)
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"pilot": p})
}

func (s *Server) handleCompletePilot(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	actor, role := settlementActor(r)
	p, err := svc.Complete(r.Context(), r.PathValue("id"), actor, role)
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"pilot": p})
}

func (s *Server) handlePilotScenarios(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	if r.Method == http.MethodGet {
		items, err := svc.Scenarios(r.Context(), r.PathValue("id"))
		if err != nil {
			mapPilotError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"scenarios": items})
		return
	}
	actor, _ := settlementActor(r)
	var req pilot.ScenarioRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := svc.AddScenario(r.Context(), r.PathValue("id"), req, actor)
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"scenario": item})
}

func (s *Server) handlePilotRuns(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	if r.Method == http.MethodGet {
		items, err := svc.Runs(r.Context(), r.PathValue("id"))
		if err != nil {
			mapPilotError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"runs": items})
		return
	}
	actor, _ := settlementActor(r)
	var req pilot.RunRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, replay, err := svc.AddRun(r.Context(), r.PathValue("id"), r.PathValue("scenario_id"), actor, req)
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"run": item, "replay": replay})
}

func (s *Server) handlePilotObservations(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	if r.Method == http.MethodGet {
		items, err := svc.Observations(r.Context(), r.PathValue("id"))
		if err != nil {
			mapPilotError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"observations": items})
		return
	}
	actor, role := settlementActor(r)
	var req pilot.ObservationRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, replay, err := svc.AddObservation(r.Context(), r.PathValue("id"), actor, role, req)
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"observation": item, "replay": replay})
}

func (s *Server) handlePilotIncidents(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	if r.Method == http.MethodGet {
		items, err := svc.Incidents(r.Context(), r.PathValue("id"))
		if err != nil {
			mapPilotError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"incidents": items})
		return
	}
	actor, role := settlementActor(r)
	var req pilot.IncidentRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := svc.AddIncident(r.Context(), r.PathValue("id"), actor, role, req)
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"incident": item})
}

func (s *Server) handlePilotAudit(w http.ResponseWriter, r *http.Request) {
	svc := s.pilotService(w)
	if svc == nil {
		return
	}
	items, err := svc.AuditEvents(r.Context(), r.PathValue("id"))
	if err != nil {
		mapPilotError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"audit": items})
}

func mapPilotError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, pilot.ErrNotFound):
		writeError(w, http.StatusNotFound, "pilot_not_found", err.Error())
	case errors.Is(err, pilot.ErrSelfApproval):
		writeError(w, http.StatusForbidden, "pilot_self_approval_forbidden", err.Error())
	case errors.Is(err, pilot.ErrGovernance), errors.Is(err, pilot.ErrKillSwitch), errors.Is(err, pilot.ErrNotObservation):
		writeError(w, http.StatusConflict, "pilot_governance_blocked", err.Error())
	case errors.Is(err, pilot.ErrReadOnly):
		writeError(w, http.StatusLocked, "read_only_mode", err.Error())
	case errors.Is(err, pilot.ErrConflict), errors.Is(err, pilot.ErrIdempotency):
		writeError(w, http.StatusConflict, "pilot_conflict", err.Error())
	case errors.Is(err, pilot.ErrInvalid):
		writeError(w, http.StatusBadRequest, "invalid_pilot", err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "pilot_error", strings.TrimSpace(err.Error()))
	}
}
