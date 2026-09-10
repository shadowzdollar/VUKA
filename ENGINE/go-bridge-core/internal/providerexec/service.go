package providerexec

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"vuka/go-bridge-core/internal/adapters"
)

type Service struct {
	registry    *adapters.Registry
	store       Store
	credentials map[string]string
}

func NewService(registry *adapters.Registry, store Store) *Service {
	return &Service{registry: registry, store: store, credentials: make(map[string]string)}
}

// SetCredentialReference registers only a managed reference (never a secret).
// It is required before a non-simulated adapter can be invoked.
func (s *Service) SetCredentialReference(provider, reference string) {
	if s == nil {
		return
	}
	s.credentials[provider] = strings.TrimSpace(reference)
}

func (s *Service) Execute(ctx context.Context, req Request) (Execution, bool, error) {
	if s == nil || s.store == nil || s.registry == nil {
		return Execution{}, false, ErrProviderUnavailable
	}
	if err := validateRequest(req); err != nil {
		return Execution{}, false, err
	}
	if req.ID == "" {
		req.ID = newID("px")
	}
	execution, replay, err := s.store.Claim(ctx, req)
	if err != nil || replay {
		return execution, replay, err
	}
	execution.Attempts++
	execution.State = StateAccepted
	if err := s.store.Update(ctx, execution); err != nil {
		return Execution{}, false, err
	}

	adapter := s.registry.Get(req.Provider)
	if adapter == nil {
		return s.fail(ctx, execution, ErrProviderUnavailable)
	}
	if err := s.checkAdapter(adapter, req.Provider); err != nil {
		return s.fail(ctx, execution, err)
	}
	if req.Payout.Reference == "" {
		req.Payout.Reference = req.RequestReference
	}
	if req.Collection.Reference == "" {
		req.Collection.Reference = req.RequestReference
	}

	var externalRef, raw string
	switch req.Operation {
	case OperationPayout:
		result, dispatchErr := adapter.Payout(ctx, req.Payout)
		if dispatchErr != nil {
			return s.failDispatch(ctx, execution, dispatchErr)
		}
		if result == nil || strings.TrimSpace(result.ExternalRef) == "" {
			return s.fail(ctx, execution, fmt.Errorf("%w: provider returned no external reference", adapters.ErrPayoutFailed))
		}
		externalRef, raw = result.ExternalRef, result.Raw
	case OperationCollection:
		var result *adapters.CollectionResult
		var dispatchErr error
		if transactionAdapter, ok := adapter.(adapters.TransactionAdapter); ok {
			result, dispatchErr = transactionAdapter.Collection(ctx, req.Collection)
		} else if collectionAdapter, ok := adapter.(adapters.CollectionAdapter); ok {
			result, dispatchErr = collectionAdapter.Collect(ctx, req.Collection)
		} else {
			return s.fail(ctx, execution, ErrUnsupportedOperation)
		}
		if dispatchErr != nil {
			return s.failDispatch(ctx, execution, dispatchErr)
		}
		if result == nil || strings.TrimSpace(result.ExternalRef) == "" {
			return s.fail(ctx, execution, fmt.Errorf("%w: provider returned no external reference", adapters.ErrCollectionFailed))
		}
		externalRef, raw = result.ExternalRef, result.Raw
	default:
		return s.fail(ctx, execution, ErrUnsupportedOperation)
	}
	execution.State, execution.ExternalReference, execution.RawResponse = StateSucceeded, externalRef, raw
	if err := s.store.Update(ctx, execution); err != nil {
		return Execution{}, false, err
	}
	return execution, false, nil
}

func (s *Service) failDispatch(ctx context.Context, e Execution, err error) (Execution, bool, error) {
	state := StateFailed
	if errors.Is(err, adapters.ErrPayoutTimeout) || errors.Is(err, adapters.ErrCollectionTimeout) ||
		errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
		state = StateTimeout
	}
	e.State, e.LastError = state, err.Error()
	if updateErr := s.store.Update(ctx, e); updateErr != nil {
		return Execution{}, false, updateErr
	}
	return e, false, err
}

func (s *Service) fail(ctx context.Context, e Execution, err error) (Execution, bool, error) {
	e.State, e.LastError = StateFailed, err.Error()
	if updateErr := s.store.Update(ctx, e); updateErr != nil {
		return Execution{}, false, updateErr
	}
	return e, false, err
}

func (s *Service) checkAdapter(adapter adapters.TelecomAdapter, provider string) error {
	if versioned, ok := adapter.(adapters.VersionedAdapter); ok {
		if err := versioned.ValidateConfig(); err != nil {
			return fmt.Errorf("%w: invalid adapter configuration: %v", ErrProviderUnavailable, err)
		}
		if versioned.Environment() != "simulated" && strings.TrimSpace(s.credentials[provider]) == "" {
			return ErrCredentialsMissing
		}
	}
	return nil
}

func (s *Service) Get(ctx context.Context, id string) (Execution, error) {
	if s == nil || s.store == nil {
		return Execution{}, ErrProviderUnavailable
	}
	return s.store.Get(ctx, id)
}

func (s *Service) GetByTransaction(ctx context.Context, transactionID string) (Execution, error) {
	if s == nil || s.store == nil {
		return Execution{}, ErrProviderUnavailable
	}
	return s.store.GetByTransaction(ctx, transactionID)
}

func (s *Service) IngestEvent(ctx context.Context, event Event) (Event, bool, error) {
	if s == nil || s.store == nil {
		return Event{}, false, ErrProviderUnavailable
	}
	if strings.TrimSpace(event.Provider) == "" || strings.TrimSpace(event.ReplayKey) == "" ||
		strings.TrimSpace(event.State) == "" {
		return Event{}, false, ErrInvalidRequest
	}
	if event.ID == "" {
		event.ID = newID("pe")
	}
	stored, replay, err := s.store.AppendEvent(ctx, event)
	if err != nil || replay {
		return stored, replay, err
	}
	if event.TransactionID != "" {
		execution, getErr := s.store.GetByTransaction(ctx, event.TransactionID)
		if getErr == nil {
			if event.ExternalReference != "" {
				execution.ExternalReference = event.ExternalReference
			}
			execution.State = callbackState(event.State, execution.State)
			execution.RawResponse = event.RawPayload
			if updateErr := s.store.Update(ctx, execution); updateErr != nil {
				return stored, false, updateErr
			}
		}
	}
	return stored, false, nil
}

func callbackState(incoming, current string) string {
	switch strings.ToUpper(incoming) {
	case StateSucceeded:
		return StateSucceeded
	case StateFailed:
		if current == StateSucceeded {
			return current
		}
		return StateFailed
	case StateTimeout:
		if current == StateSucceeded || current == StateFailed {
			return current
		}
		return StateTimeout
	case StateAccepted:
		if current == StateSucceeded || current == StateFailed || current == StateTimeout {
			return current
		}
		return StateAccepted
	default:
		return current
	}
}

func validateRequest(r Request) error {
	if strings.TrimSpace(r.Provider) == "" || strings.TrimSpace(r.Operation) == "" ||
		strings.TrimSpace(r.TransactionID) == "" || strings.TrimSpace(r.RequestReference) == "" {
		return ErrInvalidRequest
	}
	if r.Operation != OperationPayout && r.Operation != OperationCollection {
		return ErrUnsupportedOperation
	}
	return nil
}

func newID(prefix string) string {
	var b [12]byte
	if _, err := rand.Read(b[:]); err != nil {
		return fmt.Sprintf("%s-%d", prefix, time.Now().UnixNano())
	}
	return prefix + "-" + hex.EncodeToString(b[:])
}

// DecodeCallback maps common provider callback envelopes without trusting
// provider-specific fields. Unknown status values remain evidence-only.
func DecodeCallback(provider string, body []byte, replayKey string) (Event, error) {
	var payload struct {
		ID                string `json:"id"`
		EventID           string `json:"event_id"`
		TransactionID     string `json:"transaction_id"`
		RequestReference  string `json:"request_reference"`
		ProviderReference string `json:"provider_reference"`
		ExternalReference string `json:"external_reference"`
		Status            string `json:"status"`
		EventType         string `json:"event_type"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return Event{}, ErrInvalidRequest
	}
	state := normalizeState(payload.Status)
	if state == "" {
		state = normalizeState(payload.EventType)
	}
	return Event{
		ID: firstNonEmpty(payload.ID, payload.EventID), Provider: provider, ReplayKey: replayKey,
		EventType:     payload.EventType,
		TransactionID: payload.TransactionID, RequestReference: payload.RequestReference,
		ExternalReference: firstNonEmpty(payload.ExternalReference, payload.ProviderReference),
		State:             state, RawPayload: string(body), ReceivedAt: time.Now().UTC(),
	}, nil
}

func normalizeState(value string) string {
	value = strings.ToUpper(strings.TrimSpace(value))
	switch value {
	case "SUCCESS", "SUCCEEDED", "COMPLETED", "PAYOUT.COMPLETED", "COLLECTION.COMPLETED":
		return StateSucceeded
	case "FAILED", "FAILURE", "REJECTED", "DECLINED", "PAYOUT.FAILED", "COLLECTION.FAILED":
		return StateFailed
	case "TIMEOUT", "TIMED_OUT", "PAYOUT.TIMEOUT", "COLLECTION.TIMEOUT":
		return StateTimeout
	case "ACCEPTED", "PROCESSING", "PENDING", "PAYOUT.ACCEPTED", "COLLECTION.ACCEPTED":
		return StateAccepted
	default:
		return value
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}
