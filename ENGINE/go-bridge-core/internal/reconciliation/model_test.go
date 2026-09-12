package reconciliation

import (
	"errors"
	"testing"
)

func event(eventType EventType) ChainEvent {
	return ChainEvent{
		ChainID: 80002, ContractAddress: "0xescrow", TransactionHash: "0xtx",
		LogIndex: 0, EscrowID: 7, Type: eventType,
	}
}

func TestApplyLifecycle(t *testing.T) {
	created := event(EventEscrowCreated)
	created.Buyer, created.Supplier, created.Amount, created.TimeoutAt = "0xbuyer", "0xsupplier", "1000000", 1
	var item Escrow

	if err := Apply(&item, created); err != nil {
		t.Fatal(err)
	}
	if err := Apply(&item, event(EventFundsLocked)); err != nil {
		t.Fatal(err)
	}
	if err := Apply(&item, event(EventDisputeRaised)); err != nil {
		t.Fatal(err)
	}
	if err := Apply(&item, event(EventEscrowRefunded)); err != nil {
		t.Fatal(err)
	}
	if err := Apply(&item, event(EventDisputeResolved)); err != nil {
		t.Fatal(err)
	}
	if item.State != StateRefunded {
		t.Fatalf("state = %q, want %q", item.State, StateRefunded)
	}
}

func TestApplyRejectsInvalidOrder(t *testing.T) {
	var item Escrow
	err := Apply(&item, event(EventFundsLocked))
	if !errors.Is(err, ErrInvalidState) {
		t.Fatalf("error = %v, want invalid state", err)
	}

	created := event(EventEscrowCreated)
	created.Buyer, created.Supplier, created.Amount, created.TimeoutAt = "0xbuyer", "0xsupplier", "1", 1
	if err := Apply(&item, created); err != nil {
		t.Fatal(err)
	}
	if err := Apply(&item, event(EventEscrowRefunded)); !errors.Is(err, ErrInvalidState) {
		t.Fatalf("error = %v, want invalid state", err)
	}
}

func TestApplyRejectsMismatchedEscrowIdentity(t *testing.T) {
	created := event(EventEscrowCreated)
	created.Buyer, created.Supplier, created.Amount, created.TimeoutAt = "0xbuyer", "0xsupplier", "1", 1
	var item Escrow
	if err := Apply(&item, created); err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name   string
		mutate func(*ChainEvent)
	}{
		{
			name: "chain",
			mutate: func(e *ChainEvent) {
				e.ChainID++
			},
		},
		{
			name: "contract",
			mutate: func(e *ChainEvent) {
				e.ContractAddress = "0xother"
			},
		},
		{
			name: "escrow",
			mutate: func(e *ChainEvent) {
				e.EscrowID++
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			next := event(EventFundsLocked)
			tt.mutate(&next)
			if err := Apply(&item, next); !errors.Is(err, ErrInvalidEvent) {
				t.Fatalf("error = %v, want invalid event", err)
			}
			if item.State != StateCreated {
				t.Fatalf("state changed to %q after rejected event", item.State)
			}
		})
	}
}

func TestApplyRejectsIncompleteCreateEvent(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(*ChainEvent)
	}{
		{
			name: "missing buyer",
			mutate: func(e *ChainEvent) {
				e.Buyer = ""
			},
		},
		{
			name: "missing supplier",
			mutate: func(e *ChainEvent) {
				e.Supplier = ""
			},
		},
		{
			name: "missing amount",
			mutate: func(e *ChainEvent) {
				e.Amount = ""
			},
		},
		{
			name: "missing timeout",
			mutate: func(e *ChainEvent) {
				e.TimeoutAt = 0
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			created := event(EventEscrowCreated)
			created.Buyer, created.Supplier, created.Amount, created.TimeoutAt = "0xbuyer", "0xsupplier", "1", 1
			tt.mutate(&created)
			var item Escrow
			if err := Apply(&item, created); !errors.Is(err, ErrInvalidEvent) {
				t.Fatalf("error = %v, want invalid event", err)
			}
			if item.State != "" {
				t.Fatalf("state = %q, want empty after rejected create", item.State)
			}
		})
	}
}

func TestApplyRejectsTerminalStateTransitions(t *testing.T) {
	created := event(EventEscrowCreated)
	created.Buyer, created.Supplier, created.Amount, created.TimeoutAt = "0xbuyer", "0xsupplier", "1", 1

	for _, terminal := range []EventType{EventEscrowReleased, EventEscrowRefunded} {
		t.Run(string(terminal), func(t *testing.T) {
			var item Escrow
			if err := Apply(&item, created); err != nil {
				t.Fatal(err)
			}
			if err := Apply(&item, event(EventFundsLocked)); err != nil {
				t.Fatal(err)
			}
			if terminal == EventEscrowRefunded {
				if err := Apply(&item, event(EventDisputeRaised)); err != nil {
					t.Fatal(err)
				}
			}
			if err := Apply(&item, event(terminal)); err != nil {
				t.Fatal(err)
			}
			for _, next := range []EventType{
				EventFundsLocked, EventCompletionConfirmed, EventDisputeRaised,
				EventEscrowReleased, EventEscrowRefunded,
			} {
				if err := Apply(&item, event(next)); !errors.Is(err, ErrInvalidState) {
					t.Fatalf("event %s error = %v, want invalid state", next, err)
				}
			}
		})
	}
}

func TestEventKeyIsStable(t *testing.T) {
	got := event(EventFundsLocked).Key()
	want := "80002:0xescrow:0xtx:0"
	if got != want {
		t.Fatalf("key = %q, want %q", got, want)
	}
}
