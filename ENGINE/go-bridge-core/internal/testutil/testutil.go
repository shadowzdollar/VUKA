// Package testutil provides shared helpers for the Go engine tests:
// a live-PostgreSQL test harness and a deterministic MTN adapter.
package testutil

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"vuka/go-bridge-core/internal/adapters"
	"vuka/go-bridge-core/internal/idempotency"
	"vuka/go-bridge-core/internal/identity"
	"vuka/go-bridge-core/internal/ledger"
	"vuka/go-bridge-core/internal/pilot"
	"vuka/go-bridge-core/internal/providerexec"
	"vuka/go-bridge-core/internal/providers"
	"vuka/go-bridge-core/internal/reconciliation"
	"vuka/go-bridge-core/internal/settlement"
	"vuka/go-bridge-core/internal/support"
	"vuka/go-bridge-core/internal/transactionworkflow"
)

var (
	poolOnce sync.Once
	poolPtr  *pgxpool.Pool
	poolURL  string
)

// Logger returns a discard logger for tests (avoids log noise in output).
func Logger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

// DefaultTestURL is used when TEST_DATABASE_URL is unset. It targets the
// vuka_test database provisioned on localhost:5432 (see deploy/).
const DefaultTestURL = "postgres://vuka:changeme@localhost:5432/vuka_test"

// TestPool returns a SHARED, process-wide pool to the test database and
// truncates all ledger tables so each test starts from a clean ledger.
//
// The pool is created once per test binary. Creating a pool per test leaks
// connections; those lingering connections hold lock pedges that make the
// next test's TRUNCATE deadlock (SQLSTATE 40P01) and poison later tests.
//
// go test ./internal/... runs packages in PARALLEL processes; each package
// shares the same vuka_test database. To keep packages from truncating each
// other's rows mid-test, TestPool takes a session-level advisory lock for the
// duration of the test, which serializes all packages onto the shared DB.
const advisoryLockKey = 0x564B41 // "VKA"

func TestPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		url = DefaultTestURL
	}
	poolOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		var err error
		poolPtr, err = pgxpool.New(ctx, url)
		if err != nil {
			t.Fatalf("testutil: connect to %s: %v", url, err)
		}
		poolURL = url
		// Package test binaries initialize the shared database concurrently.
		// Serialize DDL bootstrap so concurrent CREATE TABLE/INDEX statements
		// cannot deadlock on PostgreSQL catalog locks.
		schemaConn, err := poolPtr.Acquire(ctx)
		if err != nil {
			t.Fatalf("testutil: acquire schema connection: %v", err)
		}
		if _, err := schemaConn.Exec(ctx, `SELECT pg_advisory_lock($1)`, advisoryLockKey); err != nil {
			schemaConn.Release()
			t.Fatalf("testutil: schema advisory lock: %v", err)
		}
		defer func() {
			_, _ = schemaConn.Exec(context.Background(), `SELECT pg_advisory_unlock($1)`, advisoryLockKey)
			schemaConn.Release()
		}()

		idem := idempotency.NewStore(poolPtr)
		reg := adapters.NewRegistry()
		ledgerSvc := ledger.NewService(poolPtr, idem, reg)
		if err := ledgerSvc.EnsureSchema(ctx); err != nil {
			t.Fatalf("testutil: ensure ledger schema: %v", err)
		}
		authDDL := `
			CREATE TABLE IF NOT EXISTS operators (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				email VARCHAR(255) UNIQUE NOT NULL,
				password_hash TEXT NOT NULL,
				role VARCHAR(32) NOT NULL DEFAULT 'operator',
				created_at TIMESTAMPTZ NOT NULL DEFAULT now()
			);
			CREATE TABLE IF NOT EXISTS operator_sessions (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
				token_hash VARCHAR(64) UNIQUE NOT NULL,
				expires_at TIMESTAMPTZ NOT NULL,
				created_at TIMESTAMPTZ NOT NULL DEFAULT now()
			);
			CREATE INDEX IF NOT EXISTS idx_operator_sessions_expiry ON operator_sessions(expires_at);
			CREATE TABLE IF NOT EXISTS operator_activity (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				actor_email VARCHAR(255) NOT NULL,
				role VARCHAR(32) NOT NULL,
				action VARCHAR(64) NOT NULL,
				resource VARCHAR(255),
				details TEXT,
				created_at TIMESTAMPTZ NOT NULL DEFAULT now()
			);
			CREATE INDEX IF NOT EXISTS idx_operator_activity_created_at ON operator_activity(created_at DESC);
			CREATE OR REPLACE FUNCTION prevent_operator_activity_mutation()
			RETURNS trigger AS $$
			BEGIN
				RAISE EXCEPTION 'operator activity is append-only';
			END;
			$$ LANGUAGE plpgsql;
			DROP TRIGGER IF EXISTS operator_activity_append_only ON operator_activity;
			CREATE TRIGGER operator_activity_append_only
			BEFORE UPDATE OR DELETE ON operator_activity
			FOR EACH ROW EXECUTE FUNCTION prevent_operator_activity_mutation();

			CREATE TABLE IF NOT EXISTS trader_credentials (
				user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
				password_hash TEXT NOT NULL,
				created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
			);
			CREATE TABLE IF NOT EXISTS trader_sessions (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				token_hash VARCHAR(64) UNIQUE NOT NULL,
				expires_at TIMESTAMPTZ NOT NULL,
				created_at TIMESTAMPTZ NOT NULL DEFAULT now()
			);
			CREATE INDEX IF NOT EXISTS idx_trader_sessions_expiry ON trader_sessions(expires_at);
			CREATE TABLE IF NOT EXISTS transaction_authorizations (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				trader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
				idempotency_key VARCHAR(255) NOT NULL UNIQUE,
				source_account_id UUID NOT NULL,
				destination_account_id UUID NOT NULL,
				amount NUMERIC(20, 6) NOT NULL,
				currency_from VARCHAR(3) NOT NULL,
				currency_to VARCHAR(3) NOT NULL,
				status VARCHAR(32) NOT NULL,
				created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
				expires_at TIMESTAMPTZ NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_transaction_authorizations_trader ON transaction_authorizations(trader_id, created_at DESC);
		`
		if _, err := poolPtr.Exec(ctx, authDDL); err != nil {
			t.Fatalf("testutil: ensure auth schema: %v", err)
		}
		if err := identity.EnsureSchema(ctx, poolPtr); err != nil {
			t.Fatalf("testutil: ensure identity schema: %v", err)
		}
		if err := providers.EnsureSchema(ctx, poolPtr); err != nil {
			t.Fatalf("testutil: ensure provider schema: %v", err)
		}
		if err := providerexec.EnsureSchema(ctx, poolPtr); err != nil {
			t.Fatalf("testutil: ensure provider execution schema: %v", err)
		}
		if err := transactionworkflow.EnsureSchema(ctx, poolPtr); err != nil {
			t.Fatalf("testutil: ensure transaction workflow schema: %v", err)
		}
		if err := settlement.NewService(poolPtr, settlement.DefaultPolicy()).EnsureSchema(ctx); err != nil {
			t.Fatalf("testutil: ensure settlement schema: %v", err)
		}
		if err := pilot.NewService(poolPtr, false, true).EnsureSchema(ctx); err != nil {
			t.Fatalf("testutil: ensure pilot schema: %v", err)
		}
		if err := support.NewService(poolPtr, false).EnsureSchema(ctx); err != nil {
			t.Fatalf("testutil: ensure support schema: %v", err)
		}
		if err := reconciliation.EnsureSchema(ctx, poolPtr); err != nil {
			t.Fatalf("testutil: ensure reconciliation schema: %v", err)
		}
	})

	// Hold the advisory lock for the whole test on a dedicated connection,
	// released in t.Cleanup so the next test (or another package) can run.
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	lockConn, err := poolPtr.Acquire(ctx)
	if err != nil {
		t.Fatalf("testutil: acquire lock connection: %v", err)
	}
	if _, err := lockConn.Exec(ctx, `SELECT pg_advisory_lock($1)`, advisoryLockKey); err != nil {
		lockConn.Release()
		t.Fatalf("testutil: advisory lock: %v", err)
	}
	t.Cleanup(func() {
		unlockCtx, unlockCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer unlockCancel()
		_, _ = lockConn.Exec(unlockCtx, `SELECT pg_advisory_unlock($1)`, advisoryLockKey)
		lockConn.Release()
	})

	// Truncate all ledger tables (idempotency_keys first due to FK order).
	truncCtx, truncCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer truncCancel()
	if _, err := poolPtr.Exec(truncCtx, `
		TRUNCATE TABLE pilot_audit_events, pilot_incidents, pilot_observations, pilot_runs,
			pilot_scenarios, pilot_approvals, pilot_participants, pilot_programs;
		TRUNCATE TABLE settlement_audit_events, settlement_reconciliations, settlement_approvals, settlement_commands;
		TRUNCATE TABLE provider_webhook_events, provider_reconciliation_status,
			corridor_configs, provider_configs;
		TRUNCATE TABLE identity_verification_decisions, compliance_decisions,
			compliance_review_notes, compliance_risk_flags, compliance_reviews,
			identity_verifications, organization_memberships, organizations,
			idempotency_keys, ledger_entries, transactions, accounts, users
			RESTART IDENTITY CASCADE`); err != nil {
		t.Fatalf("testutil: truncate tables: %v", err)
	}
	return poolPtr
}

// MTNSuccessAsync returns a fast, always-succeeding MTN adapter for tests.
// Delay is zero so tests never block on simulated network latency.
func MTNSuccessAsync() *adapters.MTNAdapter {
	return adapters.NewMTNAdapter(0, 0, "success", 5*time.Second)
}

// MTNAdapterRegistry builds a registry containing a deterministic adapter
// and returns both, for tests that resolve adapters by name.
func MTNAdapterRegistry(mode string, failRate float64) (*adapters.Registry, *adapters.MTNAdapter) {
	reg := adapters.NewRegistry()
	a := adapters.NewMTNAdapter(0, failRate, mode, 5*time.Second)
	reg.Register(a)
	return reg, a
}

// CorridorRegistry builds a registry with BOTH rails registered (MTN Rwanda
// for RWF legs, M-Pesa Kenya for KES legs) — the Phase 2 corridor setup.
func CorridorRegistry() *adapters.Registry {
	reg := adapters.NewRegistry()
	reg.Register(adapters.NewMTNAdapter(0, 0, "success", 5*time.Second))
	reg.Register(adapters.NewMpesaAdapter(0, 0, "success", 5*time.Second))
	return reg
}

// UniqueID returns a distinct, time-based identifier for idempotency keys.
func UniqueID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}
