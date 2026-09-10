package providers

import (
	"context"
	_ "embed"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed schema.sql
var schemaSQL string

// EnsureSchema bootstraps only provider control-plane tables. It does not
// enable a provider and does not write ledger or blockchain state.
func EnsureSchema(ctx context.Context, pool *pgxpool.Pool) error {
	if pool == nil {
		return fmt.Errorf("providers: nil database pool")
	}
	if _, err := pool.Exec(ctx, schemaSQL); err != nil {
		return fmt.Errorf("providers: ensure schema: %w", err)
	}
	return nil
}
