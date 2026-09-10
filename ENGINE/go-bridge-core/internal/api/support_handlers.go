package api

import (
	"errors"
	"net/http"
	"strings"

	"vuka/go-bridge-core/internal/support"
)

func (s *Server) supportService(w http.ResponseWriter) *support.Service {
	if s.support == nil {
		writeError(w, http.StatusServiceUnavailable, "support_unavailable", "support service is not configured")
		return nil
	}
	return s.support
}

func supportActor(r *http.Request) string { return r.Header.Get("X-Actor") }

func (s *Server) handleListSupportTickets(w http.ResponseWriter, r *http.Request) {
	svc := s.supportService(w)
	if svc == nil {
		return
	}
	trader := r.URL.Query().Get("trader_id")
	if id, ok := traderIDFromRequest(r); ok {
		if trader != "" && trader != id {
			writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot access these tickets")
			return
		}
		trader = id
	}
	items, err := svc.ListTickets(r.Context(), trader, r.URL.Query().Get("status"))
	if err != nil {
		mapSupportError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"tickets": items})
}

func (s *Server) handleCreateSupportTicket(w http.ResponseWriter, r *http.Request) {
	svc := s.supportService(w)
	if svc == nil {
		return
	}
	var req support.CreateTicketRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	if id, ok := traderIDFromRequest(r); ok {
		if req.TraderID != "" && req.TraderID != id {
			writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot create a ticket for another trader")
			return
		}
		req.TraderID = id
	}
	item, replay, err := svc.CreateTicket(r.Context(), req, r.Header.Get("Idempotency-Key"), supportActor(r))
	if err != nil {
		mapSupportError(w, err)
		return
	}
	code := http.StatusCreated
	if replay {
		code = http.StatusOK
	}
	writeJSON(w, code, map[string]any{"ticket": item, "replay": replay})
}

func (s *Server) handleGetSupportTicket(w http.ResponseWriter, r *http.Request) {
	svc := s.supportService(w)
	if svc == nil {
		return
	}
	if id, ok := traderIDFromRequest(r); ok {
		trader, err := s.ticketTrader(r.Context(), r.PathValue("id"))
		if err != nil || trader != id {
			writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot access this ticket")
			return
		}
	}
	item, err := svc.GetTicket(r.Context(), r.PathValue("id"))
	if err != nil {
		mapSupportError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ticket": item})
}

func (s *Server) handleUpdateSupportTicket(w http.ResponseWriter, r *http.Request) {
	svc := s.supportService(w)
	if svc == nil {
		return
	}
	if id, ok := traderIDFromRequest(r); ok {
		trader, err := s.ticketTrader(r.Context(), r.PathValue("id"))
		if err != nil || trader != id {
			writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot update this ticket")
			return
		}
	}
	var req support.UpdateTicketRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	item, err := svc.UpdateStatus(r.Context(), r.PathValue("id"), req, supportActor(r))
	if err != nil {
		mapSupportError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ticket": item})
}

func (s *Server) handleListNotifications(w http.ResponseWriter, r *http.Request) {
	svc := s.supportService(w)
	if svc == nil {
		return
	}
	trader := r.URL.Query().Get("trader_id")
	if id, ok := traderIDFromRequest(r); ok {
		if trader != "" && trader != id {
			writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot access these notifications")
			return
		}
		trader = id
	}
	items, err := svc.ListNotifications(r.Context(), trader)
	if err != nil {
		mapSupportError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"notifications": items})
}

func (s *Server) handleReadNotification(w http.ResponseWriter, r *http.Request) {
	svc := s.supportService(w)
	if svc == nil {
		return
	}
	trader := r.URL.Query().Get("trader_id")
	if strings.TrimSpace(trader) == "" {
		writeError(w, http.StatusBadRequest, "invalid_request", "trader_id is required")
		return
	}
	if id, ok := traderIDFromRequest(r); ok {
		if trader != id {
			writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot mark another trader's notification")
			return
		}
		if owner, err := s.notificationTrader(r.Context(), r.PathValue("id")); err != nil || owner != id {
			writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot mark this notification")
			return
		}
	}
	if err := svc.MarkNotificationRead(r.Context(), r.PathValue("id"), trader, supportActor(r)); err != nil {
		mapSupportError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "read"})
}

func mapSupportError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, support.ErrNotFound):
		writeError(w, http.StatusNotFound, "support_not_found", err.Error())
	case errors.Is(err, support.ErrReadOnly):
		writeError(w, http.StatusLocked, "read_only_mode", err.Error())
	case errors.Is(err, support.ErrConflict), errors.Is(err, support.ErrIdempotency):
		writeError(w, http.StatusConflict, "support_conflict", err.Error())
	case errors.Is(err, support.ErrInvalid):
		writeError(w, http.StatusBadRequest, "invalid_support_request", err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "support_error", strings.TrimSpace(err.Error()))
	}
}
