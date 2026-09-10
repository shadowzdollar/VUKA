// Command seed-settlement creates one clearly synthetic Phase 5 command for
// local dashboard inspection. It never calls a provider or moves funds.
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"vuka/go-bridge-core/internal/config"
	"vuka/go-bridge-core/internal/settlement"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()
	svc := settlement.NewService(pool, settlement.DefaultPolicy())
	if err := svc.EnsureSchema(ctx); err != nil {
		log.Fatal(err)
	}
	cmd, replay, err := svc.Submit(ctx, settlement.Request{
		Action: settlement.ActionPayout, Target: "synthetic-merchant-001",
		ProviderID: "mpesa-ke", CorridorID: "rw-rwf-ke-kes",
		AmountMinor: 1000, Currency: "KES", Reason: "local dashboard fixture",
		IdempotencyKey: "synthetic-settlement-fixture-001",
	}, "synthetic-seeder")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("synthetic command=%s replay=%t status=%s (no funds moved)\n", cmd.ID, replay, cmd.Status)
}
