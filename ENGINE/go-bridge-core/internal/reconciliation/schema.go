package reconciliation

import (
	"context"
	_ "embed"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed schema.sql
var schemaSQL string

const (
	schemaName    = "reconciliation"
	schemaVersion = 2
)

func EnsureSchema(ctx context.Context, pool *pgxpool.Pool) error {
	if pool == nil {
		return fmt.Errorf("reconciliation: schema called with nil pool")
	}
	for _, statement := range strings.Split(schemaSQL, ";") {
		statement = strings.TrimSpace(statement)
		if statement == "" {
			continue
		}
		if _, err := pool.Exec(ctx, statement); err != nil {
			return fmt.Errorf("reconciliation: ensure schema: %w", err)
		}
	}
	var duplicateCount int
	if err := pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM (
			SELECT dispute_id
			FROM dispute_decisions
			GROUP BY dispute_id
			HAVING COUNT(*) > 1
		) duplicates`).Scan(&duplicateCount); err != nil {
		return fmt.Errorf("reconciliation: check recommendation duplicates: %w", err)
	}
	if duplicateCount > 0 {
		return fmt.Errorf("reconciliation: cannot enforce one recommendation per dispute; %d duplicate dispute groups require cleanup", duplicateCount)
	}
	if _, err := pool.Exec(ctx, `
		CREATE UNIQUE INDEX IF NOT EXISTS idx_dispute_decisions_one_per_dispute
		ON dispute_decisions (dispute_id)`); err != nil {
		return fmt.Errorf("reconciliation: enforce recommendation uniqueness: %w", err)
	}
	if _, err := pool.Exec(ctx, `
		INSERT INTO reconciliation_schema (name, version)
		VALUES ($1, $2)
		ON CONFLICT (name) DO UPDATE
		SET version = EXCLUDED.version, updated_at = now()`,
		schemaName, schemaVersion); err != nil {
		return fmt.Errorf("reconciliation: record schema version: %w", err)
	}
	return nil
}
