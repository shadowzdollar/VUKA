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
		Supplier: "0xsupplier", Amount: "1000000", InvoiceRef: "INV",
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
}
