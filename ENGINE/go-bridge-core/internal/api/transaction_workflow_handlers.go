package api

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"vuka/go-bridge-core/internal/ledger"
	"vuka/go-bridge-core/internal/providers"
	"vuka/go-bridge-core/internal/transactionworkflow"
)

type workflowAccountResolver struct{ ledger *ledger.Service }

func (r workflowAccountResolver) ResolveAccount(ctx context.Context, id string) (string, string, bool, error) {
	account, err := r.ledger.GetAccount(ctx, id)
	if err != nil {
		return "", "", false, err
	}
	return account.UserID, account.Currency, account.Type == ledger.AccountTypeBusiness, nil
}

type workflowLedgerPoster struct{ ledger *ledger.Service }

func (p workflowLedgerPoster) PostCollectedCrossBorder(ctx context.Context, key, source, destination string, amount float64, from, to string, rate float64, invoice string) (string, error) {
	return p.ledger.PostCollectedCrossBorder(ctx, key, source, destination, amount, from, to, rate, invoice)
}

type workflowCollectionPoster struct{ ledger *ledger.Service }

func (p workflowCollectionPoster) FundCollectedAccount(ctx context.Context, key, accountID string, amount float64, currency, reference string) (string, error) {
	transfer, err := p.ledger.FundAccount(ctx, accountID, key, ledger.FundRequest{
		Amount: amount, Currency: currency, Reference: reference,
	})
	if err != nil {
		return "", err
	}
	return transfer.ID, nil
}

type workflowRequest struct {
	TraderID                 string  `json:"trader_id"`
	SourceAccountID          string  `json:"source_account_id"`
	DestinationAccountID     string  `json:"destination_account_id"`
	CollectionProvider       string  `json:"collection_provider"`
	PayoutProvider           string  `json:"payout_provider"`
	CollectionPhone          string  `json:"collection_phone"`
	PayoutPhone              string  `json:"payout_phone"`
	CorridorID               string  `json:"corridor_id"`
	QuoteID                  string  `json:"quote_id"`
	Amount                   float64 `json:"amount"`
	CurrencyFrom             string  `json:"currency_from"`
	CurrencyTo               string  `json:"currency_to"`
	Rate                     float64 `json:"rate"`
	ProviderAuthorizationRef string  `json:"provider_authorization_ref"`
	InvoiceNumber            string  `json:"invoice_number"`
}

func (s *Server) configureWorkflow() {
	if s.providerExecution == nil {
		return
	}
	store := transactionworkflow.Store(transactionworkflow.NewMemoryStore())
	var accounts transactionworkflow.AccountResolver
	var poster transactionworkflow.LedgerPoster
	var collector transactionworkflow.CollectionPoster
	if s.ledger != nil {
		accounts = workflowAccountResolver{s.ledger}
		poster = workflowLedgerPoster{s.ledger}
		collector = workflowCollectionPoster{s.ledger}
		if s.ledger.DB() != nil {
			store = transactionworkflow.NewPostgresStore(s.ledger.DB())
		}
	}
	s.workflow = transactionworkflow.NewService(store, s.providerExecution, s.providerCatalog, accounts, poster, collector)
	if s.support != nil {
		s.workflow.SetNotifier(s.support)
	}
}

func (s *Server) handleCreateWorkflow(w http.ResponseWriter, r *http.Request) {
	if s.readOnly {
		writeError(w, http.StatusLocked, "read_only_mode", "transaction workflow execution is disabled")
		return
	}
	if s.workflow == nil {
		writeError(w, http.StatusServiceUnavailable, "workflow_unavailable", "transaction workflow is not configured")
		return
	}
	var input workflowRequest
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	traderID, ok := traderIDFromRequest(r)
	if ok {
		if input.TraderID != "" && input.TraderID != traderID {
			writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot create for another trader")
			return
		}
		input.TraderID = traderID
	}
	// Default the rails from the corridor: the payer is collected on the rail of the
	// source currency's country and the recipient is paid on the corridor's provider.
	if input.CollectionProvider == "" {
		if id, ok := providers.ProviderIDForCurrency(input.CurrencyFrom); ok {
			input.CollectionProvider = id
		} else {
			input.CollectionProvider = "mtn-rw"
		}
	}
	if input.PayoutProvider == "" {
		if corridor, ok := s.providerCatalog.Corridor(input.CorridorID); ok {
			input.PayoutProvider = corridor.ProviderID
		} else if id, ok := providers.ProviderIDForCurrency(input.CurrencyTo); ok {
			input.PayoutProvider = id
		} else {
			input.PayoutProvider = "mpesa-ke"
		}
	}
	key := strings.TrimSpace(r.Header.Get("Idempotency-Key"))
	if input.TraderID == "" || key == "" {
		writeError(w, http.StatusBadRequest, "authorization_required", "authenticated trader and Idempotency-Key are required")
		return
	}
	if !s.ownsAccount(r.Context(), input.TraderID, input.SourceAccountID) {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot debit this account")
		return
	}
	if s.ledger == nil {
		writeError(w, http.StatusServiceUnavailable, "ledger_unavailable", "the ledger is unavailable")
		return
	}
	balance, err := s.ledger.GetBalance(r.Context(), input.SourceAccountID)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "source_account_unavailable", "unable to verify the source account balance")
		return
	}
	if balance.Amount < input.Amount {
		writeJSON(w, http.StatusUnprocessableEntity, map[string]any{
			"error": map[string]any{
				"code":    "insufficient_funds",
				"message": "the source account does not have enough available balance for this transaction",
			},
			"available": balance.Amount,
			"required":  input.Amount,
			"currency":  balance.Currency,
		})
		return
	}
	if strings.TrimSpace(input.ProviderAuthorizationRef) == "" && !s.localSyntheticExecution {
		writeError(w, http.StatusConflict, "provider_authorization_required", "complete the telecom provider authorization challenge before submitting the transaction")
		return
	}
	if s.localSyntheticExecution && strings.TrimSpace(input.ProviderAuthorizationRef) == "" {
		input.ProviderAuthorizationRef = "local-synthetic://" + key
	}
	if !s.enforceCompliance(w, r, key, input.SourceAccountID, input.DestinationAccountID, input.Amount, input.CurrencyFrom) {
		return
	}
	// The authorization ledger lives with the auth store; the legacy no-auth mode has none.
	if s.auth != nil {
		if err := s.auth.RecordTransactionAuthorization(r.Context(), input.TraderID, key, input.SourceAccountID, input.DestinationAccountID, input.Amount, input.CurrencyFrom, input.CurrencyTo); err != nil {
			writeError(w, http.StatusInternalServerError, "transaction_authorization_record_failed", "unable to record transaction authorization")
			return
		}
	}
	item, replay, err := s.workflow.Start(r.Context(), key, transactionworkflow.Request{
		TraderID: input.TraderID, SourceAccountID: input.SourceAccountID, DestinationAccountID: input.DestinationAccountID,
		CollectionProvider: input.CollectionProvider, PayoutProvider: input.PayoutProvider,
		CollectionPhone: input.CollectionPhone, PayoutPhone: input.PayoutPhone, CorridorID: input.CorridorID,
		QuoteID: input.QuoteID, Amount: input.Amount, CurrencyFrom: input.CurrencyFrom, CurrencyTo: input.CurrencyTo, Rate: input.Rate,
		InvoiceNumber: strings.TrimSpace(input.InvoiceNumber),
	})
	if err != nil {
		status := http.StatusUnprocessableEntity
		if item.ID != "" && item.State != transactionworkflow.StateCompleted {
			status = http.StatusAccepted
		}
		writeJSON(w, status, map[string]any{"workflow": item, "error": err.Error()})
		return
	}
	status := http.StatusAccepted
	if item.State == transactionworkflow.StateCompleted {
		status = http.StatusOK
	}
	writeJSON(w, status, map[string]any{"workflow": item, "replay": replay})
}

func (s *Server) getWorkflow(w http.ResponseWriter, r *http.Request) (transactionworkflow.Workflow, bool) {
	if s.workflow == nil {
		writeError(w, http.StatusServiceUnavailable, "workflow_unavailable", "transaction workflow is not configured")
		return transactionworkflow.Workflow{}, false
	}
	item, err := s.workflow.Get(r.Context(), r.PathValue("id"))
	if errors.Is(err, transactionworkflow.ErrNotFound) {
		writeError(w, http.StatusNotFound, "workflow_not_found", err.Error())
		return transactionworkflow.Workflow{}, false
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "workflow_error", err.Error())
		return transactionworkflow.Workflow{}, false
	}
	return item, true
}

func (s *Server) handleGetWorkflow(w http.ResponseWriter, r *http.Request) {
	item, ok := s.getWorkflow(w, r)
	if !ok {
		return
	}
	if traderID, supplied := traderIDFromRequest(r); supplied && traderID != item.TraderID {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot access this workflow")
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (s *Server) handleWorkflowEvents(w http.ResponseWriter, r *http.Request) {
	item, ok := s.getWorkflow(w, r)
	if !ok {
		return
	}
	if traderID, supplied := traderIDFromRequest(r); supplied && traderID != item.TraderID {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot access this workflow")
		return
	}
	events, err := s.workflow.Events(r.Context(), item.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "workflow_error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"events": events})
}

func (s *Server) handleRetryWorkflow(w http.ResponseWriter, r *http.Request) {
	if s.readOnly {
		writeError(w, http.StatusLocked, "read_only_mode", "transaction workflow retries are disabled")
		return
	}
	item, ok := s.getWorkflow(w, r)
	if !ok {
		return
	}
	if traderID, supplied := traderIDFromRequest(r); supplied && traderID != item.TraderID {
		writeError(w, http.StatusForbidden, "forbidden", "the authenticated trader cannot retry this workflow")
		return
	}
	var input struct {
		Phone string `json:"phone"`
	}
	_ = decodeJSON(r, &input)
	item, err := s.workflow.Retry(r.Context(), item.ID, input.Phone)
	if errors.Is(err, transactionworkflow.ErrNotRetryable) {
		writeError(w, http.StatusConflict, "workflow_not_retryable", err.Error())
		return
	}
	if err != nil {
		writeJSON(w, http.StatusAccepted, map[string]any{"workflow": item, "error": err.Error()})
		return
	}
	writeJSON(w, http.StatusAccepted, item)
}

func (s *Server) handleOperatorWorkflow(w http.ResponseWriter, r *http.Request) {
	item, ok := s.getWorkflow(w, r)
	if ok {
		writeJSON(w, http.StatusOK, item)
	}
}
