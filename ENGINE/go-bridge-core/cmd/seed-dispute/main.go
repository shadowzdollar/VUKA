// Package main seeds a local-only dispute fixture for testing the arbiter
// review and operator approval workflow. It does not create chain activity.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"vuka/go-bridge-core/internal/api"
	"vuka/go-bridge-core/internal/config"
	"vuka/go-bridge-core/internal/reconciliation"
)

func main() {
	log := slog.New(slog.NewTextHandler(os.Stdout, nil))
	cfg, err := config.Load()
	if err != nil {
		log.Error("config", "err", err)
		os.Exit(1)
	}
	arbiterEmail, arbiterPassword, operatorEmail, operatorPassword, err := seedCredentials()
	if err != nil {
		log.Error("credentials", "err", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("connect", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := reconciliation.EnsureSchema(ctx, pool); err != nil {
		log.Error("reconciliation schema", "err", err)
		os.Exit(1)
	}
	auth := api.NewAuthStore(pool)
	if err := auth.EnsureSchema(ctx); err != nil {
		log.Error("auth schema", "err", err)
		os.Exit(1)
	}
	if err := auth.EnsureOperator(ctx, arbiterEmail, arbiterPassword, "arbiter"); err != nil {
		log.Error("arbiter", "err", err)
		os.Exit(1)
	}
	if err := auth.EnsureOperator(ctx, operatorEmail, operatorPassword, "operator"); err != nil {
		log.Error("operator", "err", err)
		os.Exit(1)
	}

	const (
		escrowID  = int64(990001)
		txHash    = "0x0000000000000000000000000000000000000000000000000000000000000001"
		blockHash = "0x0000000000000000000000000000000000000000000000000000000000000002"
	)
	chainID := int64(80002)
	if configuredChainID := os.Getenv("VUKA_RECONCILIATION_CHAIN_ID"); configuredChainID != "" {
		if _, err := fmt.Sscan(configuredChainID, &chainID); err != nil {
			log.Error("chain id", "err", err)
			os.Exit(1)
		}
	}
	contract := os.Getenv("VUKA_RECONCILIATION_CONTRACT")
	if contract == "" {
		contract = "0x491a0E68B440621435B606D17FDa50f7999DE4ef"
	}
	_, err = pool.Exec(ctx, `
		INSERT INTO escrows
			(chain_id, contract_address, escrow_id, buyer_address, supplier_address,
			 amount, timeout_at, invoice_ref, state, updated_block)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'DISPUTED',$9)
		ON CONFLICT (chain_id, contract_address, escrow_id) DO UPDATE
		SET state = 'DISPUTED', updated_block = EXCLUDED.updated_block`,
		chainID, contract, escrowID,
		"0x0000000000000000000000000000000000000011",
		"0x0000000000000000000000000000000000000022",
		"1250000", time.Now().Add(24*time.Hour).Unix(), "LOCAL-DISPUTE-990001", 990001)
	if err != nil {
		log.Error("escrow fixture", "err", err)
		os.Exit(1)
	}
	_, err = pool.Exec(ctx, `
		INSERT INTO escrow_disputes
			(chain_id, contract_address, escrow_id, raised_transaction_hash,
			 raised_log_index, reason, status)
		VALUES ($1,$2,$3,$4,0,$5,'OPEN')
		ON CONFLICT (chain_id, contract_address, escrow_id, raised_transaction_hash, raised_log_index)
		DO UPDATE SET reason = EXCLUDED.reason, status = 'OPEN', resolved_at = NULL`,
		chainID, contract, escrowID, txHash,
		"Local fixture: delivery evidence requires arbiter review")
	if err != nil {
		log.Error("dispute fixture", "err", err)
		os.Exit(1)
	}
	_, err = pool.Exec(ctx, `
		INSERT INTO chain_events
			(chain_id, contract_address, transaction_hash, log_index,
			 block_number, block_hash, escrow_id, event_type, payload)
		VALUES ($1,$2,$3,0,990001,$4,$5,'DisputeRaised',
			'{"fixture":true,"reason":"delivery evidence requires arbiter review"}')
		ON CONFLICT DO NOTHING`,
		chainID, contract, txHash, blockHash, escrowID)
	if err != nil {
		log.Error("event fixture", "err", err)
		os.Exit(1)
	}

	fmt.Printf("seeded local dispute fixture for escrow %d\n", escrowID)
	fmt.Printf("arbiter email: %s\noperator email: %s\n", arbiterEmail, operatorEmail)
}

func seedCredentials() (string, string, string, string, error) {
	values := []string{
		"VUKA_SEED_ARBITER_EMAIL", "VUKA_SEED_ARBITER_PASSWORD",
		"VUKA_SEED_OPERATOR_EMAIL", "VUKA_SEED_OPERATOR_PASSWORD",
	}
	result := make([]string, len(values))
	for i, key := range values {
		result[i] = os.Getenv(key)
		if result[i] == "" {
			return "", "", "", "", fmt.Errorf("%s is required", key)
		}
	}
	return result[0], result[1], result[2], result[3], nil
}
