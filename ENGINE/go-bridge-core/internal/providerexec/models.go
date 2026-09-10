// Package providerexec owns durable provider dispatch evidence. It never
// writes ledger entries; settlement remains behind the existing ledger and
// settlement services.
package providerexec

import (
	"context"
	"errors"
	"time"

	"vuka/go-bridge-core/internal/adapters"
)

const (
	OperationPayout     = "PAYOUT"
	OperationCollection = "COLLECTION"

	StatePending   = "PENDING"
	StateAccepted  = "ACCEPTED"
	StateSucceeded = "SUCCEEDED"
	StateFailed    = "FAILED"
	StateTimeout   = "TIMEOUT"
)

var (
	ErrProviderUnavailable  = errors.New("provider execution: adapter unavailable")
	ErrCredentialsMissing   = errors.New("provider execution: managed credentials are not configured")
	ErrUnsupportedOperation = errors.New("provider execution: unsupported operation")
	ErrInvalidRequest       = errors.New("provider execution: invalid request")
)

type Execution struct {
	ID                string    `json:"id"`
	TransactionID     string    `json:"transaction_id"`
	Provider          string    `json:"provider"`
	Operation         string    `json:"operation"`
	RequestReference  string    `json:"request_reference"`
	ExternalReference string    `json:"external_reference,omitempty"`
	State             string    `json:"state"`
	Attempts          int       `json:"attempts"`
	LastError         string    `json:"last_error,omitempty"`
	RawResponse       string    `json:"raw_response,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type Request struct {
	ID               string                     `json:"id,omitempty"`
	TransactionID    string                     `json:"transaction_id"`
	Provider         string                     `json:"provider"`
	Operation        string                     `json:"operation"`
	RequestReference string                     `json:"request_reference"`
	Payout           adapters.PayoutRequest     `json:"payout"`
	Collection       adapters.CollectionRequest `json:"collection"`
}

type Event struct {
	ID                string    `json:"id"`
	Provider          string    `json:"provider"`
	ReplayKey         string    `json:"replay_key"`
	EventType         string    `json:"event_type,omitempty"`
	TransactionID     string    `json:"transaction_id,omitempty"`
	RequestReference  string    `json:"request_reference,omitempty"`
	ExternalReference string    `json:"external_reference,omitempty"`
	State             string    `json:"state"`
	RawPayload        string    `json:"raw_payload,omitempty"`
	ReceivedAt        time.Time `json:"received_at"`
}

type Store interface {
	Claim(context.Context, Request) (Execution, bool, error)
	Get(context.Context, string) (Execution, error)
	GetByTransaction(context.Context, string) (Execution, error)
	Update(context.Context, Execution) error
	AppendEvent(context.Context, Event) (Event, bool, error)
	ListEvents(context.Context, int) ([]Event, error)
}
