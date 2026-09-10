package api

import (
	"errors"
	"net/http"
	"strings"

	"vuka/go-bridge-core/internal/adapters"
	"vuka/go-bridge-core/internal/providerexec"
)

func defaultProviderExecution() *providerexec.Service {
	registry := adapters.NewRegistry()
	registry.Register(adapters.NewMTNAdapter(0, 0, "success", 1))
	registry.Register(adapters.NewMpesaAdapter(0, 0, "success", 1))
	return providerexec.NewService(registry, providerexec.NewMemoryStore())
}

type providerExecutionRequest struct {
	TransactionID    string            `json:"transaction_id"`
	Provider         string            `json:"provider"`
	Operation        string            `json:"operation"`
	RequestReference string            `json:"request_reference"`
	Amount           float64           `json:"amount"`
	Currency         string            `json:"currency"`
	Phone            string            `json:"phone"`
	InvoiceNumber    string            `json:"invoice_number"`
	Metadata         map[string]string `json:"metadata"`
}

func (s *Server) handleProviderExecution(w http.ResponseWriter, r *http.Request) {
	if s.readOnly {
		writeError(w, http.StatusForbidden, "read_only", "provider execution is disabled in read-only mode")
		return
	}
	if s.providerExecution == nil {
		writeError(w, http.StatusServiceUnavailable, "providers_unavailable", "provider execution is not configured")
		return
	}
	var input providerExecutionRequest
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	key := strings.TrimSpace(r.Header.Get("Idempotency-Key"))
	if input.RequestReference == "" {
		input.RequestReference = key
	}
	if input.RequestReference == "" {
		writeError(w, http.StatusBadRequest, "missing_replay_key", "Idempotency-Key or request_reference is required")
		return
	}
	req := providerexec.Request{
		TransactionID: input.TransactionID, Provider: input.Provider, Operation: strings.ToUpper(input.Operation),
		RequestReference: input.RequestReference,
		Payout:           adapters.PayoutRequest{Amount: input.Amount, Currency: input.Currency, Phone: input.Phone, Reference: input.RequestReference, InvoiceNumber: input.InvoiceNumber, Metadata: input.Metadata},
		Collection:       adapters.CollectionRequest{Amount: input.Amount, Currency: input.Currency, Phone: input.Phone, Reference: input.RequestReference, InvoiceNumber: input.InvoiceNumber, Metadata: input.Metadata},
	}
	execution, replay, err := s.providerExecution.Execute(r.Context(), req)
	if err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, providerexec.ErrProviderUnavailable) || errors.Is(err, providerexec.ErrCredentialsMissing) {
			status = http.StatusServiceUnavailable
		} else if execution.ID != "" {
			status = http.StatusBadGateway
		}
		writeJSON(w, status, map[string]any{"error": "provider_execution_failed", "message": err.Error(), "execution": execution})
		return
	}
	status := http.StatusAccepted
	if execution.State == providerexec.StateSucceeded {
		status = http.StatusOK
	}
	writeJSON(w, status, map[string]any{"execution": execution, "replay": replay})
}

func (s *Server) handleProviderExecutionStatus(w http.ResponseWriter, r *http.Request) {
	if s.providerExecution == nil {
		writeError(w, http.StatusServiceUnavailable, "providers_unavailable", "provider execution is not configured")
		return
	}
	execution, err := s.providerExecution.Get(r.Context(), r.PathValue("id"))
	if errors.Is(err, providerexec.ErrNotFound) {
		writeError(w, http.StatusNotFound, "provider_execution_not_found", err.Error())
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "provider_execution_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, execution)
}

func (s *Server) handleProviderExecutionByTransaction(w http.ResponseWriter, r *http.Request) {
	if s.providerExecution == nil {
		writeError(w, http.StatusServiceUnavailable, "providers_unavailable", "provider execution is not configured")
		return
	}
	// The transaction status route is intentionally resolved through the
	// provider evidence store and remains read-only.
	execution, err := s.providerExecution.GetByTransaction(r.Context(), r.PathValue("id"))
	if errors.Is(err, providerexec.ErrNotFound) {
		writeError(w, http.StatusNotFound, "provider_execution_not_found", err.Error())
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "provider_execution_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, execution)
}
