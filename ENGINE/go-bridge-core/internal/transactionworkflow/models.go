// Package transactionworkflow owns the durable cross-border provider
// orchestration state machine. It is intentionally separate from ledger
// transaction headers: provider retries and callbacks must never be mistaken
// for an atomic ledger transfer.
package transactionworkflow

import (
	"context"
	"errors"
	"time"

	"vuka/go-bridge-core/internal/adapters"
	"vuka/go-bridge-core/internal/providerexec"
	"vuka/go-bridge-core/internal/providers"
)

const (
	StateCreated           = "CREATED"
	StateQuoted            = "QUOTED"
	StateCollectionPending = "COLLECTION_PENDING"
	StateCollected         = "COLLECTED"
	StateLedgerPosted      = "LEDGER_POSTED"
	StatePayoutPending     = "PAYOUT_PENDING"
	StateCompleted         = "COMPLETED"
	StateFailed            = "FAILED"
	StateRequiresReview    = "REQUIRES_REVIEW"

	StepCollection = "COLLECTION"
	StepPayout     = "PAYOUT"
)

var (
	ErrNotFound          = errors.New("transaction workflow: not found")
	ErrInvalidRequest    = errors.New("transaction workflow: invalid request")
	ErrNotRetryable      = errors.New("transaction workflow: step is not retryable")
	ErrLedgerUnavailable = errors.New("transaction workflow: ledger handoff is not configured")
	ErrRequiresReview    = errors.New("transaction workflow: provider result requires review")
)

type Request struct {
	TraderID             string  `json:"trader_id"`
	SourceAccountID      string  `json:"source_account_id"`
	DestinationAccountID string  `json:"destination_account_id"`
	CollectionProvider   string  `json:"collection_provider"`
	PayoutProvider       string  `json:"payout_provider"`
	CollectionPhone      string  `json:"collection_phone"`
	PayoutPhone          string  `json:"payout_phone"`
	CorridorID           string  `json:"corridor_id"`
	QuoteID              string  `json:"quote_id"`
	Amount               float64 `json:"amount"`
	CurrencyFrom         string  `json:"currency_from"`
	CurrencyTo           string  `json:"currency_to"`
	Rate                 float64 `json:"rate"`
	InvoiceNumber        string  `json:"invoice_number,omitempty"`
}

type Workflow struct {
	ID                    string    `json:"id"`
	IdempotencyKey        string    `json:"idempotency_key"`
	TraderID              string    `json:"trader_id"`
	SourceAccountID       string    `json:"source_account_id"`
	DestinationAccountID  string    `json:"destination_account_id"`
	CorridorID            string    `json:"corridor_id"`
	QuoteID               string    `json:"quote_id"`
	CollectionProvider    string    `json:"collection_provider"`
	PayoutProvider        string    `json:"payout_provider"`
	CollectionExecutionID string    `json:"collection_execution_id,omitempty"`
	PayoutExecutionID     string    `json:"payout_execution_id,omitempty"`
	LedgerTransferID      string    `json:"ledger_transfer_id,omitempty"`
	Amount                float64   `json:"amount"`
	CurrencyFrom          string    `json:"currency_from"`
	CurrencyTo            string    `json:"currency_to"`
	Rate                  float64   `json:"rate"`
	InvoiceNumber         string    `json:"invoice_number,omitempty"`
	State                 string    `json:"state"`
	FailedStep            string    `json:"failed_step,omitempty"`
	FailureReason         string    `json:"failure_reason,omitempty"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

type Event struct {
	ID         string    `json:"id"`
	WorkflowID string    `json:"workflow_id"`
	Sequence   int64     `json:"sequence"`
	FromState  string    `json:"from_state"`
	ToState    string    `json:"to_state"`
	Step       string    `json:"step,omitempty"`
	Reason     string    `json:"reason,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type Store interface {
	Create(context.Context, Workflow) (Workflow, bool, error)
	Get(context.Context, string) (Workflow, error)
	Update(context.Context, Workflow) error
	AppendEvent(context.Context, Event) (Event, error)
	ListEvents(context.Context, string) ([]Event, error)
}

type transitionStore interface {
	UpdateWithEvent(context.Context, Workflow, Event) error
}

// AccountResolver is the API-boundary ownership and currency check. The
// ledger service satisfies this through the adapter in api.
type AccountResolver interface {
	ResolveAccount(context.Context, string) (userID, currency string, business bool, err error)
}

type LedgerPoster interface {
	PostCollectedCrossBorder(context.Context, string, string, string, float64, string, string, float64, string) (string, error)
}

type CollectionPoster interface {
	FundCollectedAccount(context.Context, string, string, float64, string, string) (string, error)
}

type NotificationAppender interface {
	AppendWorkflowNotification(context.Context, string, string, string, string, string) error
}

type Service struct {
	store     Store
	provider  *providerexec.Service
	catalog   *providers.Catalog
	accounts  AccountResolver
	ledger    LedgerPoster
	collector CollectionPoster
	notifier  NotificationAppender
}

func NewService(store Store, provider *providerexec.Service, catalog *providers.Catalog, accounts AccountResolver, poster LedgerPoster, collector CollectionPoster) *Service {
	return &Service{store: store, provider: provider, catalog: catalog, accounts: accounts, ledger: poster, collector: collector}
}

func (s *Service) SetNotifier(notifier NotificationAppender) {
	s.notifier = notifier
}

type providerRequest struct {
	transactionID string
	provider      string
	operation     string
	reference     string
	amount        float64
	currency      string
	phone         string
}

func executionRequest(p providerRequest) providerexec.Request {
	return providerexec.Request{
		TransactionID: p.transactionID, Provider: p.provider, Operation: p.operation,
		RequestReference: p.reference,
		Payout:           adapters.PayoutRequest{Amount: p.amount, Currency: p.currency, Phone: p.phone, Reference: p.reference},
		Collection:       adapters.CollectionRequest{Amount: p.amount, Currency: p.currency, Phone: p.phone, Reference: p.reference},
	}
}
