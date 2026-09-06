// Package reconciliation mirrors authoritative escrow events from the chain
// into PostgreSQL. Chain events are immutable; escrow state is derived from
// the accepted event sequence.
package reconciliation

import (
	"encoding/json"
	"errors"
	"fmt"
)

type EventType string

const (
	EventEscrowCreated       EventType = "EscrowCreated"
	EventFundsLocked         EventType = "FundsLocked"
	EventCompletionConfirmed EventType = "CompletionConfirmed"
	EventDisputeRaised       EventType = "DisputeRaised"
	EventEscrowReleased      EventType = "EscrowReleased"
	EventEscrowRefunded      EventType = "EscrowRefunded"
	EventDisputeResolved     EventType = "DisputeResolved"
)

type State string

const (
	StateCreated  State = "CREATED"
	StateLocked   State = "LOCKED"
	StateReleased State = "RELEASED"
	StateRefunded State = "REFUNDED"
	StateDisputed State = "DISPUTED"
)

var (
	ErrDuplicateEvent = errors.New("reconciliation: duplicate chain event")
	ErrUnknownEvent   = errors.New("reconciliation: unknown event")
	ErrInvalidEvent   = errors.New("reconciliation: invalid event")
	ErrInvalidState   = errors.New("reconciliation: invalid state transition")
	ErrReorgDetected  = errors.New("reconciliation: canonical block hash changed")
)

// ChainEvent is the normalized representation of one contract log. The
// transaction hash and log index form the event's stable idempotency key.
type ChainEvent struct {
	ChainID            int64
	ContractAddress    string
	BlockNumber        int64
	BlockHash          string
	TransactionHash    string
	LogIndex           int32
	EscrowID           int64
	Type               EventType
	Buyer              string
	Supplier           string
	Amount             string
	InvoiceRef         string
	Actor              string
	Reason             string
	ReleaseTo          string
	ReleasedToSupplier *bool
}

func (e ChainEvent) Key() string {
	return fmt.Sprintf("%d:%s:%s:%d", e.ChainID, e.ContractAddress, e.TransactionHash, e.LogIndex)
}

type Escrow struct {
	ChainID         int64
	ContractAddress string
	EscrowID        int64
	Buyer           string
	Supplier        string
	Amount          string
	InvoiceRef      string
	State           State
}

type Summary struct {
	ChainID         int64  `json:"chain_id"`
	ContractAddress string `json:"contract_address"`
	EscrowID        int64  `json:"escrow_id"`
	Buyer           string `json:"buyer"`
	Supplier        string `json:"supplier"`
	Amount          string `json:"amount"`
	InvoiceRef      string `json:"invoice_ref"`
	State           State  `json:"state"`
	UpdatedBlock    int64  `json:"updated_block"`
}

type EventRecord struct {
	ChainID         int64           `json:"chain_id"`
	ContractAddress string          `json:"contract_address"`
	TransactionHash string          `json:"transaction_hash"`
	LogIndex        int32           `json:"log_index"`
	BlockNumber     int64           `json:"block_number"`
	BlockHash       string          `json:"block_hash"`
	EscrowID        int64           `json:"escrow_id"`
	EventType       EventType       `json:"event_type"`
	Payload         json.RawMessage `json:"payload"`
	ObservedAt      string          `json:"observed_at"`
}

// Apply validates and applies one event to an escrow. The caller must persist
// the event and updated escrow atomically.
func Apply(current *Escrow, event ChainEvent) error {
	if event.EscrowID < 0 || event.ChainID <= 0 || event.ContractAddress == "" ||
		event.TransactionHash == "" || event.LogIndex < 0 || event.Type == "" {
		return ErrInvalidEvent
	}

	if current == nil {
		return ErrInvalidEvent
	}
	if current.State == "" {
		if event.Type != EventEscrowCreated {
			return fmt.Errorf("%w: first event must create escrow", ErrInvalidState)
		}
		if event.Buyer == "" || event.Supplier == "" || event.Amount == "" {
			return ErrInvalidEvent
		}
		*current = Escrow{
			ChainID: event.ChainID, ContractAddress: event.ContractAddress,
			EscrowID: event.EscrowID, Buyer: event.Buyer, Supplier: event.Supplier,
			Amount: event.Amount, InvoiceRef: event.InvoiceRef, State: StateCreated,
		}
		return nil
	}

	if current.ChainID != event.ChainID || current.ContractAddress != event.ContractAddress ||
		current.EscrowID != event.EscrowID {
		return ErrInvalidEvent
	}

	switch event.Type {
	case EventFundsLocked:
		if current.State != StateCreated {
			return ErrInvalidState
		}
		current.State = StateLocked
	case EventCompletionConfirmed, EventDisputeRaised:
		if current.State != StateLocked {
			return ErrInvalidState
		}
		if event.Type == EventDisputeRaised {
			current.State = StateDisputed
		}
	case EventEscrowReleased:
		if current.State != StateLocked && current.State != StateDisputed {
			return ErrInvalidState
		}
		current.State = StateReleased
	case EventEscrowRefunded:
		if current.State != StateDisputed {
			return ErrInvalidState
		}
		current.State = StateRefunded
	case EventDisputeResolved:
		if current.State != StateReleased && current.State != StateRefunded {
			return ErrInvalidState
		}
	default:
		return ErrUnknownEvent
	}
	return nil
}
