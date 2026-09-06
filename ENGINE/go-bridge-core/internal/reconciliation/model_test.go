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
	created.Buyer, created.Supplier, created.Amount = "0xbuyer", "0xsupplier", "1000000"
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
	created.Buyer, created.Supplier, created.Amount = "0xbuyer", "0xsupplier", "1"
	if err := Apply(&item, created); err != nil {
		t.Fatal(err)
	}
	if err := Apply(&item, event(EventEscrowRefunded)); !errors.Is(err, ErrInvalidState) {
		t.Fatalf("error = %v, want invalid state", err)
	}
}

func TestEventKeyIsStable(t *testing.T) {
	got := event(EventFundsLocked).Key()
	want := "80002:0xescrow:0xtx:0"
	if got != want {
		t.Fatalf("key = %q, want %q", got, want)
	}
}
