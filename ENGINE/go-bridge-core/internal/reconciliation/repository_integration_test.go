package reconciliation

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestRepositoryAppliesEventsIdempotently(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL is not configured")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		t.Fatal(err)
	}
	if err := EnsureSchema(ctx, pool); err != nil {
		t.Fatal(err)
	}

	contract := "0xintegration"
	for _, table := range []string{"chain_events", "canonical_blocks", "escrows", "reconciliation_cursors"} {
		if _, err = pool.Exec(ctx, "DELETE FROM "+table+" WHERE chain_id = 80002 AND contract_address = $1", contract); err != nil {
			t.Fatal(err)
		}
	}
	repo := NewRepository(pool)
	created := ChainEvent{
		ChainID: 80002, ContractAddress: contract, BlockNumber: 10,
		BlockHash: "0xblock", TransactionHash: "0xcreated", LogIndex: 0,
		EscrowID: 1, Type: EventEscrowCreated, Buyer: "0xbuyer",
		Supplier: "0xsupplier", Amount: "1000000", TimeoutAt: 1, InvoiceRef: "INV",
	}
	locked := created
	locked.Type = EventFundsLocked
	locked.TransactionHash = "0xlocked"

	inserted, err := repo.ApplyEventsAndAdvance(ctx, []ChainEvent{created, locked}, 11)
	if err != nil || inserted != 2 {
		t.Fatalf("apply batch = (%d, %v)", inserted, err)
	}
	replayed, err := repo.ApplyEvent(ctx, created)
	if err != nil || replayed {
		t.Fatalf("replay = (%t, %v), want false and nil", replayed, err)
	}
	var count int
	if err := pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM chain_events
		WHERE chain_id = 80002 AND contract_address = $1`, contract).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 2 {
		t.Fatalf("event count = %d, want 2", count)
	}
	cursor, err := repo.Cursor(ctx, 80002, contract)
	if err != nil || cursor != 11 {
		t.Fatalf("cursor = (%d, %v), want (11, nil)", cursor, err)
	}
	conflict := locked
	conflict.BlockHash = "0xreorged"
	if _, err := repo.ApplyEvent(ctx, conflict); !errors.Is(err, ErrReorgDetected) {
		t.Fatalf("conflicting block = %v, want reorg error", err)
	}

	conflictingPayload := locked
	conflictingPayload.BlockHash = "0xblock"
	conflictingPayload.Type = EventCompletionConfirmed
	if _, err := repo.ApplyEvent(ctx, conflictingPayload); !errors.Is(err, ErrDuplicateEvent) {
		t.Fatalf("conflicting replay = %v, want duplicate event error", err)
	}

	atomicContract := "0xatomic"
	for _, table := range []string{"chain_events", "canonical_blocks", "escrows", "reconciliation_cursors"} {
		if _, err = pool.Exec(ctx, "DELETE FROM "+table+" WHERE chain_id = 80002 AND contract_address = $1", atomicContract); err != nil {
			t.Fatal(err)
		}
	}
	atomicCreated := created
	atomicCreated.ContractAddress = atomicContract
	atomicCreated.TransactionHash = "0xatomic-created"
	atomicInvalid := atomicCreated
	atomicInvalid.TransactionHash = "0xatomic-invalid"
	atomicInvalid.Type = EventCompletionConfirmed

	if _, err := repo.ApplyEventsAndAdvance(ctx, []ChainEvent{atomicCreated, atomicInvalid}, 21); !errors.Is(err, ErrInvalidState) {
		t.Fatalf("failed atomic batch = %v, want invalid state", err)
	}
	var atomicEvents, atomicEscrows, atomicCursors int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM chain_events WHERE chain_id = 80002 AND contract_address = $1`, atomicContract).Scan(&atomicEvents); err != nil {
		t.Fatal(err)
	}
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM escrows WHERE chain_id = 80002 AND contract_address = $1`, atomicContract).Scan(&atomicEscrows); err != nil {
		t.Fatal(err)
	}
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM reconciliation_cursors WHERE chain_id = 80002 AND contract_address = $1`, atomicContract).Scan(&atomicCursors); err != nil {
		t.Fatal(err)
	}
	if atomicEvents != 0 || atomicEscrows != 0 || atomicCursors != 0 {
		t.Fatalf("failed batch left durable state: events=%d escrows=%d cursors=%d", atomicEvents, atomicEscrows, atomicCursors)
	}
}

// Regression: ApproveDisputeDecision used $2 both as an inserted value and in
// `decided_by <> $2`, which Postgres rejects with SQLSTATE 42P08 (inconsistent
// types deduced for parameter), so no dispute decision could ever be approved.
func TestRepositoryApprovesDisputeDecision(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL is not configured")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	if err := EnsureSchema(ctx, pool); err != nil {
		t.Fatal(err)
	}

	const contract = "0xapprovaltest"
	if _, err := pool.Exec(ctx, `DELETE FROM escrow_disputes WHERE contract_address = $1`, contract); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `
		INSERT INTO escrows (chain_id, contract_address, escrow_id, buyer_address, supplier_address,
			amount, timeout_at, invoice_ref, state, updated_block)
		VALUES (80002, $1, 1, '0xb', '0xs', '1', 1, 'INV', 'DISPUTED', 1)
		ON CONFLICT (chain_id, contract_address, escrow_id) DO NOTHING`, contract); err != nil {
		t.Fatal(err)
	}
	var disputeID string
	if err := pool.QueryRow(ctx, `
		INSERT INTO escrow_disputes (chain_id, contract_address, escrow_id, raised_transaction_hash,
			raised_log_index, reason, status)
		VALUES (80002, $1, 1, '0xraised', 0, 'test', 'OPEN') RETURNING id`, contract).Scan(&disputeID); err != nil {
		t.Fatal(err)
	}

	repo := NewRepository(pool)
	decision, err := repo.AddDisputeDecision(ctx, disputeID, "RELEASE", "evidence supports release", "arbiter@example.com")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := repo.ApproveDisputeDecision(ctx, decision.ID, "arbiter@example.com"); err == nil {
		t.Fatal("the deciding arbiter must not be able to approve their own decision")
	}
	approval, err := repo.ApproveDisputeDecision(ctx, decision.ID, "operator@example.com")
	if err != nil {
		t.Fatalf("approve: %v", err)
	}
	if approval.DecisionID != decision.ID || approval.ApproverEmail != "operator@example.com" {
		t.Fatalf("unexpected approval %+v", approval)
	}
	if _, err := repo.ApproveDisputeDecision(ctx, decision.ID, "operator@example.com"); err == nil {
		t.Fatal("the same operator must not approve a decision twice")
	}
}
