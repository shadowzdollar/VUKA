package reconciliation_test

import (
	"context"
	"testing"
	"time"

	"vuka/go-bridge-core/internal/reconciliation"
	"vuka/go-bridge-core/internal/testutil"
)

func TestEscrowKeeper_FindExpiredLockedEscrows(t *testing.T) {
	ctx := context.Background()
	pool := testutil.TestPool(t)

	// Insert test escrows directly into reconciliation schema
	now := time.Now().UTC()
	past := now.Add(-1 * time.Hour).Unix()
	future := now.Add(24 * time.Hour).Unix()

	contract := "0x491a0E68B440621435B606D17FDa50f7999DE4ef"

	// Clean up any test escrows from prior runs
	_, _ = pool.Exec(ctx, "DELETE FROM escrows WHERE contract_address = $1", contract)

	// 1. Expired LOCKED escrow -> Should be found
	_, err := pool.Exec(ctx, `
		INSERT INTO escrows (
			chain_id, contract_address, escrow_id, buyer_address, supplier_address,
			amount, timeout_at, invoice_ref, state, updated_block
		) VALUES (
			80002, $1, 101, '0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222',
			500000000, $2, 'INV-EXPIRED-01', 'LOCKED', 1000
		);
	`, contract, past)
	if err != nil {
		t.Fatalf("insert expired escrow: %v", err)
	}

	// 2. Future LOCKED escrow -> Should NOT be found
	_, err = pool.Exec(ctx, `
		INSERT INTO escrows (
			chain_id, contract_address, escrow_id, buyer_address, supplier_address,
			amount, timeout_at, invoice_ref, state, updated_block
		) VALUES (
			80002, $1, 102, '0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222',
			500000000, $2, 'INV-FUTURE-02', 'LOCKED', 1000
		);
	`, contract, future)
	if err != nil {
		t.Fatalf("insert future escrow: %v", err)
	}

	// 3. Expired RELEASED escrow -> Should NOT be found (already completed)
	_, err = pool.Exec(ctx, `
		INSERT INTO escrows (
			chain_id, contract_address, escrow_id, buyer_address, supplier_address,
			amount, timeout_at, invoice_ref, state, updated_block
		) VALUES (
			80002, $1, 103, '0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222',
			500000000, $2, 'INV-ALREADY-RELEASED-03', 'RELEASED', 1000
		);
	`, contract, past)
	if err != nil {
		t.Fatalf("insert released escrow: %v", err)
	}

	keeper := reconciliation.NewEscrowKeeper(pool, nil, 1*time.Minute)

	expired, err := keeper.FindExpiredLockedEscrows(ctx, now, contract)
	if err != nil {
		t.Fatalf("FindExpiredLockedEscrows: %v", err)
	}

	if len(expired) != 1 {
		t.Fatalf("expected 1 expired escrow, got %d", len(expired))
	}

	if expired[0].EscrowID != 101 {
		t.Errorf("expected escrow 101, got %d", expired[0].EscrowID)
	}

	actions, err := keeper.ProcessExpiredEscrows(ctx, contract)
	if err != nil {
		t.Fatalf("ProcessExpiredEscrows: %v", err)
	}

	if len(actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(actions))
	}

	if actions[0].Action != "ELIGIBLE" {
		t.Errorf("expected action ELIGIBLE, got %s", actions[0].Action)
	}
}
