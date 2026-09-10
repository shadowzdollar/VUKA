// Package adapters defines the telecom rail abstraction for VUKA.
//
// Phase 1 ships one production-shaped simulated adapter: MTN Rwanda Mobile
// Money (mtn-rw). The interface and registry mirror the real-world contract
// (dispatch a payout, receive an external reference or a failure) so that
// M-Pesa Kenya, Airtel Money, and Equity Bank adapters can be added in later
// phases without touching the ledger engine.
package adapters

import (
	"context"
	"errors"
	"fmt"
	"time"
)

// ErrPayoutFailed is returned when the rail definitively rejects a payout
// (e.g. insufficient wallet balance, invalid number, provider error).
var ErrPayoutFailed = errors.New("adapter: payout failed")

// ErrPayoutTimeout is returned when the rail did not respond within the
// configured window. The ledger treats this as a failed dispatch (no entries
// written) and the operator can retry with the same idempotency key.
var ErrPayoutTimeout = errors.New("adapter: payout timed out")

// ErrCollectionFailed is returned when a provider rejects a collection.
var ErrCollectionFailed = errors.New("adapter: collection failed")

// ErrCollectionTimeout is returned when a collection provider does not
// answer within its configured response window.
var ErrCollectionTimeout = errors.New("adapter: collection timed out")

// PayoutRequest is the normalized payload sent to a telecom rail.
type PayoutRequest struct {
	// Amount is the payout amount in the rail's minor-unit-free decimal form.
	Amount float64
	// Currency is the ISO-4217 code, e.g. "RWF".
	Currency string
	// Phone is the destination mobile-money number in E.164 shape, e.g.
	// "+250781234567".
	Phone string
	// Reference is the engine-side reference echoed to the rail for
	// reconciliation (the VUKA transaction id).
	Reference string
	// InvoiceNumber, when present, is carried through for audit tracing.
	InvoiceNumber string
	// Metadata carries rail-specific extras (narration, channel, etc.).
	Metadata map[string]string
}

// PayoutResult is the normalized response from a telecom rail.
type PayoutResult struct {
	// ExternalRef is the rail's own reference for the payout. Required on
	// success; used for end-to-end transaction tracing (spec §4).
	ExternalRef string
	// Raw is the provider's raw response payload for audit logging.
	Raw string
}

type NormalizedPayoutRequest = PayoutRequest
type NormalizedPayoutResult = PayoutResult

// CollectionRequest is the normalized payload sent to a collection rail.
// Providers may map this to a wallet debit, STK push, or bank collection.
type CollectionRequest struct {
	Amount        float64
	Currency      string
	Phone         string
	Reference     string
	InvoiceNumber string
	Metadata      map[string]string
}

// CollectionResult is the normalized response from a collection rail.
type CollectionResult struct {
	ExternalRef string
	Raw         string
}

type NormalizedCollectionRequest = CollectionRequest
type NormalizedCollectionResult = CollectionResult

// TransactionStatus is the provider-facing lifecycle state. It is kept
// separate from ledger transaction status because provider callbacks can be
// observed without mutating the ledger.
type TransactionStatus string

const (
	TransactionStatusAccepted  TransactionStatus = "ACCEPTED"
	TransactionStatusSucceeded TransactionStatus = "SUCCEEDED"
	TransactionStatusFailed    TransactionStatus = "FAILED"
	TransactionStatusTimeout   TransactionStatus = "TIMEOUT"
	TransactionStatusPending   TransactionStatus = "PENDING"
)

type TransactionEventType string

const (
	TransactionEventAccepted  TransactionEventType = "accepted"
	TransactionEventSucceeded TransactionEventType = "succeeded"
	TransactionEventFailed    TransactionEventType = "failed"
	TransactionEventTimeout   TransactionEventType = "timeout"
)

// TransactionEvent is the normalized callback/evidence envelope accepted
// from a provider webhook.
type TransactionEvent struct {
	EventID          string
	Provider         string
	ReplayKey        string
	EventType        TransactionEventType
	TransactionID    string
	RequestReference string
	ExternalRef      string
	Status           TransactionStatus
	Raw              string
	OccurredAt       time.Time
}

type ProviderTransactionStatus = TransactionStatus
type ProviderTransactionEvent = TransactionEvent

// TelecomAdapter is the contract every rail adapter must satisfy.
type TelecomAdapter interface {
	// Name returns the adapter's registry key, e.g. "mtn-rw".
	Name() string
	// Payout dispatches a payout to the rail and waits for the outcome.
	// It must return (result, nil) on success, ErrPayoutFailed with a
	// descriptive error on provider rejection, or ErrPayoutTimeout when the
	// rail does not answer in time. It MUST NOT panic on context
	// cancellation; it should return ctx.Err() wrapped appropriately.
	Payout(ctx context.Context, req PayoutRequest) (*PayoutResult, error)
}

// TransactionAdapter extends the original payout-only contract with
// normalized collection support. Keeping TelecomAdapter unchanged preserves
// source compatibility for existing adapters while new providers can adopt
// this richer contract incrementally.
type TransactionAdapter interface {
	TelecomAdapter
	Collection(context.Context, CollectionRequest) (*CollectionResult, error)
}

// CollectionAdapter is the verb-oriented spelling accepted by provider
// implementations that prefer Collect over Collection.
type CollectionAdapter interface {
	TelecomAdapter
	Collect(context.Context, CollectionRequest) (*CollectionResult, error)
}

// ProviderAdapter is the full contract expected by the provider execution
// service. Real implementations can add HTTP/authentication internals while
// exposing only this normalized boundary to the engine.
type ProviderAdapter interface {
	TransactionAdapter
	ContractVersion() string
	Environment() string
	ValidateConfig() error
}

// CredentialedAdapter is an optional capability implemented by real
// adapters. The execution service requires a managed credential reference
// before invoking non-simulated adapters.
type CredentialedAdapter interface {
	TelecomAdapter
	CredentialsConfigured() bool
}

// ContractVersion is the versioned provider boundary shared by sandbox
// adapters. It is separate from TelecomAdapter so existing ledger adapters
// remain source-compatible while provider controls evolve.
const ContractVersion = "v1"

// VersionedAdapter describes the provider integration foundation. Sandbox
// implementations must never perform network calls.
type VersionedAdapter interface {
	TelecomAdapter
	ContractVersion() string
	Environment() string
	ValidateConfig() error
}

// Registry resolves adapters by name. The ledger engine asks the registry
// for the configured adapter and never imports concrete implementations.
type Registry struct {
	adapters map[string]TelecomAdapter
}

// NewRegistry builds an empty registry.
func NewRegistry() *Registry {
	return &Registry{adapters: make(map[string]TelecomAdapter)}
}

// Register adds an adapter under its Name(). Registering a duplicate name
// panics at startup time, which is the right failure mode for wiring errors.
func (r *Registry) Register(a TelecomAdapter) {
	name := a.Name()
	if _, exists := r.adapters[name]; exists {
		panic(fmt.Sprintf("adapters: duplicate registration for %q", name))
	}
	r.adapters[name] = a
}

// Get resolves an adapter by name. Returns nil when unknown.
func (r *Registry) Get(name string) TelecomAdapter {
	return r.adapters[name]
}

// Names returns the sorted set of registered adapter names (for logging).
func (r *Registry) Names() []string {
	names := make([]string, 0, len(r.adapters))
	for name := range r.adapters {
		names = append(names, name)
	}
	return names
}

// SleepCtx sleeps for d unless the context is cancelled first. It is used by
// simulated adapters to model rail latency while remaining cancellable.
func SleepCtx(ctx context.Context, d time.Duration) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(d):
		return nil
	}
}
