package transactionworkflow

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math"
	"strings"
	"time"

	"vuka/go-bridge-core/internal/providerexec"
)

func newID(prefix string) string {
	var b [12]byte
	if _, err := rand.Read(b[:]); err != nil {
		return fmt.Sprintf("%s-%d", prefix, time.Now().UnixNano())
	}
	return prefix + "-" + hex.EncodeToString(b[:])
}

func (s *Service) Start(ctx context.Context, key string, req Request) (Workflow, bool, error) {
	if s == nil || s.store == nil || s.provider == nil {
		return Workflow{}, false, ErrInvalidRequest
	}
	if err := s.validate(ctx, req); err != nil {
		return Workflow{}, false, err
	}
	now := time.Now().UTC()
	item := Workflow{ID: newID("wf"), IdempotencyKey: strings.TrimSpace(key), TraderID: strings.TrimSpace(req.TraderID),
		SourceAccountID: req.SourceAccountID, DestinationAccountID: req.DestinationAccountID,
		CorridorID: req.CorridorID, QuoteID: req.QuoteID, CollectionProvider: req.CollectionProvider,
		PayoutProvider: req.PayoutProvider, Amount: req.Amount, CurrencyFrom: req.CurrencyFrom,
		CurrencyTo: req.CurrencyTo, Rate: req.Rate, State: StateCreated, CreatedAt: now, UpdatedAt: now}
	if item.IdempotencyKey == "" {
		return Workflow{}, false, fmt.Errorf("%w: idempotency key is required", ErrInvalidRequest)
	}
	item, replay, err := s.store.Create(ctx, item)
	if err != nil || replay {
		return item, replay, err
	}
	if err := s.transition(ctx, &item, StateQuoted, "", ""); err != nil {
		return item, false, err
	}
	if err := s.transition(ctx, &item, StateCollectionPending, "", StepCollection); err != nil {
		return item, false, err
	}
	if err := s.runCollection(ctx, &item, req.CollectionPhone); err != nil {
		return item, false, err
	}
	if s.collector == nil {
		return item, false, s.review(ctx, &item, StepCollection, ErrLedgerUnavailable.Error())
	}
	if _, err := s.collector.FundCollectedAccount(ctx, "workflow:"+item.ID+":collection-credit", item.SourceAccountID, item.Amount, item.CurrencyFrom, item.CollectionExecutionID); err != nil {
		return item, false, s.review(ctx, &item, StepCollection, "collection credit failed: "+err.Error())
	}
	if s.ledger == nil {
		return item, false, s.review(ctx, &item, "", ErrLedgerUnavailable.Error())
	}
	ledgerID, err := s.ledger.PostCollectedCrossBorder(ctx, "workflow:"+item.ID, item.SourceAccountID, item.DestinationAccountID, item.Amount, item.CurrencyFrom, item.CurrencyTo, item.Rate)
	if err != nil {
		return item, false, s.review(ctx, &item, "", "ledger handoff failed: "+err.Error())
	}
	item.LedgerTransferID = ledgerID
	if err := s.transition(ctx, &item, StateLedgerPosted, "", ""); err != nil {
		return item, false, err
	}
	if err := s.transition(ctx, &item, StatePayoutPending, "", StepPayout); err != nil {
		return item, false, err
	}
	return item, false, s.runPayout(ctx, &item, req.PayoutPhone)
}

func (s *Service) Retry(ctx context.Context, id string, phone string) (Workflow, error) {
	item, err := s.store.Get(ctx, id)
	if err != nil {
		return Workflow{}, err
	}
	switch item.State {
	case StateFailed:
		if item.FailedStep != StepCollection {
			return item, ErrNotRetryable
		}
		if err := s.transition(ctx, &item, StateCollectionPending, "", StepCollection); err != nil {
			return item, err
		}
		if err := s.runCollectionRef(ctx, &item, phone, item.ID+":collection:retry:"+fmt.Sprint(time.Now().UnixNano())); err != nil {
			return item, err
		}
		if s.collector == nil {
			return item, s.review(ctx, &item, StepCollection, ErrLedgerUnavailable.Error())
		}
		if _, fundErr := s.collector.FundCollectedAccount(ctx, "workflow:"+item.ID+":collection-credit:retry:"+fmt.Sprint(time.Now().UnixNano()), item.SourceAccountID, item.Amount, item.CurrencyFrom, item.CollectionExecutionID); fundErr != nil {
			return item, s.review(ctx, &item, StepCollection, "collection credit failed: "+fundErr.Error())
		}
		if s.ledger == nil {
			return item, s.review(ctx, &item, StepCollection, ErrLedgerUnavailable.Error())
		}
		ledgerID, postErr := s.ledger.PostCollectedCrossBorder(ctx, "workflow:"+item.ID, item.SourceAccountID, item.DestinationAccountID, item.Amount, item.CurrencyFrom, item.CurrencyTo, item.Rate)
		if postErr != nil {
			return item, s.review(ctx, &item, "", "ledger handoff failed: "+postErr.Error())
		}
		item.LedgerTransferID = ledgerID
		if err := s.transition(ctx, &item, StateLedgerPosted, "", ""); err != nil {
			return item, err
		}
		if err := s.transition(ctx, &item, StatePayoutPending, "", StepPayout); err != nil {
			return item, err
		}
		return item, s.runPayoutRef(ctx, &item, phone, item.ID+":payout:retry:"+fmt.Sprint(time.Now().UnixNano()))
	case StateRequiresReview:
		if item.FailedStep != StepPayout {
			return item, ErrNotRetryable
		}
		if err := s.transition(ctx, &item, StatePayoutPending, "", StepPayout); err != nil {
			return item, err
		}
		return item, s.runPayoutRef(ctx, &item, phone, item.ID+":payout:retry:"+fmt.Sprint(time.Now().UnixNano()))
	default:
		return item, ErrNotRetryable
	}
}

func (s *Service) ApplyProviderEvent(ctx context.Context, event providerexec.Event) error {
	if event.TransactionID == "" {
		return nil
	}
	item, err := s.store.Get(ctx, event.TransactionID)
	if err != nil {
		return err
	}
	if item.State == StateCompleted {
		return nil
	}
	exec, err := s.provider.GetByTransaction(ctx, item.ID)
	if err != nil {
		return err
	}
	if exec.Operation == providerexec.OperationCollection && event.State == providerexec.StateSucceeded &&
		item.State == StateCollectionPending {
		item.CollectionExecutionID = exec.ID
		return s.transition(ctx, &item, StateCollected, event.ExternalReference, StepCollection)
	}
	if exec.Operation == providerexec.OperationPayout && event.State == providerexec.StateSucceeded &&
		item.State == StatePayoutPending {
		item.PayoutExecutionID = exec.ID
		return s.transition(ctx, &item, StateCompleted, event.ExternalReference, StepPayout)
	}
	if event.State == providerexec.StateFailed || event.State == providerexec.StateTimeout {
		from := item.State
		item.FailedStep = exec.Operation
		item.FailureReason = "provider callback: " + event.State
		item.State = StateFailed
		if exec.Operation == providerexec.OperationPayout {
			item.State = StateRequiresReview
		}
		return s.persistWithEvent(ctx, &item, from, item.State, exec.Operation, item.FailureReason)
	}
	return nil
}

func (s *Service) Get(ctx context.Context, id string) (Workflow, error) { return s.store.Get(ctx, id) }
func (s *Service) Events(ctx context.Context, id string) ([]Event, error) {
	return s.store.ListEvents(ctx, id)
}

func (s *Service) validate(ctx context.Context, req Request) error {
	if strings.TrimSpace(req.TraderID) == "" || strings.TrimSpace(req.SourceAccountID) == "" ||
		strings.TrimSpace(req.DestinationAccountID) == "" || req.SourceAccountID == req.DestinationAccountID ||
		req.Amount <= 0 || math.IsNaN(req.Amount) || math.IsInf(req.Amount, 0) ||
		strings.TrimSpace(req.CorridorID) == "" || strings.TrimSpace(req.QuoteID) == "" {
		return fmt.Errorf("%w: trader, distinct accounts, corridor, quote, and positive finite amount are required", ErrInvalidRequest)
	}
	if s.accounts != nil {
		user, currency, business, err := s.accounts.ResolveAccount(ctx, req.SourceAccountID)
		if err != nil || user != req.TraderID || !business || currency != req.CurrencyFrom {
			return fmt.Errorf("%w: source account ownership or currency check failed", ErrInvalidRequest)
		}
		_, destinationCurrency, destinationBusiness, err := s.accounts.ResolveAccount(ctx, req.DestinationAccountID)
		if err != nil || !destinationBusiness || destinationCurrency != req.CurrencyTo {
			return fmt.Errorf("%w: destination account or currency check failed", ErrInvalidRequest)
		}
	}
	if s.catalog != nil {
		quote, err := s.catalog.Quote(req.CorridorID, int64(math.Round(req.Amount*100)), time.Now().UTC())
		if err != nil {
			return fmt.Errorf("%w: quote/corridor validation: %v", ErrInvalidRequest, err)
		}
		if quote.ID != req.QuoteID || quote.FromCurrency != req.CurrencyFrom || quote.ToCurrency != req.CurrencyTo ||
			math.Abs(quote.Rate-req.Rate) > 1e-9 || !time.Now().UTC().Before(quote.ExpiresAt) {
			return fmt.Errorf("%w: quote id, rate, or expiry does not match corridor binding", ErrInvalidRequest)
		}
		if err := s.catalog.ValidateQuote(req.CorridorID, req.QuoteID, int64(math.Round(req.Amount*100)), time.Now().UTC()); err != nil {
			return fmt.Errorf("%w: quote/corridor validation: %v", ErrInvalidRequest, err)
		}
	}
	if req.Rate <= 0 {
		return fmt.Errorf("%w: rate must be positive", ErrInvalidRequest)
	}
	return nil
}

func (s *Service) runCollection(ctx context.Context, item *Workflow, phone string) error {
	return s.runCollectionRef(ctx, item, phone, item.ID+":collection")
}

func (s *Service) runCollectionRef(ctx context.Context, item *Workflow, phone, ref string) error {
	exec, _, err := s.provider.Execute(ctx, executionRequest(providerRequest{transactionID: item.ID, provider: item.CollectionProvider, operation: providerexec.OperationCollection, reference: ref, amount: item.Amount, currency: item.CurrencyFrom, phone: phone}))
	if exec.ID != "" {
		item.CollectionExecutionID = exec.ID
	}
	if err != nil {
		return s.fail(ctx, item, StepCollection, err.Error(), err)
	}
	return s.transition(ctx, item, StateCollected, exec.ExternalReference, StepCollection)
}

func (s *Service) runPayout(ctx context.Context, item *Workflow, phone string) error {
	return s.runPayoutRef(ctx, item, phone, item.ID+":payout")
}

func (s *Service) runPayoutRef(ctx context.Context, item *Workflow, phone, ref string) error {
	exec, _, err := s.provider.Execute(ctx, executionRequest(providerRequest{transactionID: item.ID, provider: item.PayoutProvider, operation: providerexec.OperationPayout, reference: ref, amount: item.Amount / item.Rate, currency: item.CurrencyTo, phone: phone}))
	if exec.ID != "" {
		item.PayoutExecutionID = exec.ID
	}
	if err != nil {
		return s.review(ctx, item, StepPayout, err.Error())
	}
	return s.transition(ctx, item, StateCompleted, exec.ExternalReference, StepPayout)
}

func (s *Service) transition(ctx context.Context, item *Workflow, to, reason, step string) error {
	from := item.State
	item.State, item.FailureReason, item.FailedStep = to, reason, ""
	return s.persistWithEvent(ctx, item, from, to, step, reason)
}

func (s *Service) fail(ctx context.Context, item *Workflow, step, reason string, returned error) error {
	from := item.State
	item.State, item.FailedStep, item.FailureReason = StateFailed, step, reason
	if err := s.persistWithEvent(ctx, item, from, StateFailed, step, reason); err != nil {
		return err
	}
	return returned
}

func (s *Service) review(ctx context.Context, item *Workflow, step, reason string) error {
	from := item.State
	item.State, item.FailedStep, item.FailureReason = StateRequiresReview, step, reason
	if err := s.persistWithEvent(ctx, item, from, StateRequiresReview, step, reason); err != nil {
		return err
	}
	return fmt.Errorf("%w: %s", ErrRequiresReview, reason)
}

func (s *Service) persist(ctx context.Context, item *Workflow, step, reason string) error {
	return s.persistWithEvent(ctx, item, item.State, item.State, step, reason)
}

func (s *Service) persistWithEvent(ctx context.Context, item *Workflow, from, to, step, reason string) error {
	event := Event{ID: newID("wfe"), WorkflowID: item.ID, FromState: from, ToState: to, Step: step, Reason: reason}
	var err error
	if atomic, ok := s.store.(transitionStore); ok {
		err = atomic.UpdateWithEvent(ctx, *item, event)
	} else if err = s.store.Update(ctx, *item); err == nil {
		_, err = s.store.AppendEvent(ctx, event)
	}
	if err != nil {
		return err
	}
	if s.notifier != nil && item.TraderID != "" && from != to {
		severity, title := "info", "Transaction updated"
		switch to {
		case StateCompleted:
			severity, title = "success", "Transfer completed"
		case StateFailed:
			severity, title = "error", "Transfer failed"
		case StateRequiresReview:
			severity, title = "error", "Transfer requires review"
		case StateCollectionPending, StatePayoutPending:
			severity, title = "warning", "Transfer is pending"
		}
		body := fmt.Sprintf("Transaction %s moved from %s to %s.", item.ID, from, to)
		if reason != "" {
			body += " " + reason
		}
		if err := s.notifier.AppendWorkflowNotification(ctx, item.TraderID, "transaction_workflow", severity, title, body); err != nil {
			return fmt.Errorf("transaction workflow: state persisted but notification failed: %w", err)
		}
	}
	return nil
}
