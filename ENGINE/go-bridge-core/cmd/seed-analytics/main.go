// Command seed-analytics fills a DEVELOPMENT database with ~70 varied payments
// spread over the last 60 days so the analytics dashboards have something
// realistic to show: growing volume, weekday/business-hour bias, domestic and
// cross-border flows, a few reversals and failed attempts. Payments go through
// the real ledger code (balances stay consistent) and are then backdated.
//
//	go run ./cmd/seed-analytics      (needs the demo traders: go run ./cmd/seed)
//
// It refuses to run when VUKA_ENV=production. Re-running adds another batch.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"math"
	"math/rand"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"vuka/go-bridge-core/internal/adapters"
	"vuka/go-bridge-core/internal/config"
	"vuka/go-bridge-core/internal/idempotency"
	"vuka/go-bridge-core/internal/ledger"
)

func main() {
	log := slog.New(slog.NewTextHandler(os.Stdout, nil))
	cfg, err := config.Load()
	if err != nil {
		log.Error("config", "err", err)
		os.Exit(1)
	}
	if cfg.Environment == "production" {
		log.Error("refusing to seed synthetic analytics data in production")
		os.Exit(1)
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("connect", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	reg := adapters.NewRegistry()
	for _, id := range []string{"mtn-rw", "mpesa-ke"} {
		reg.Register(adapters.NewSandboxRail(id, id, "SEED", 0, 0, "success", 5*time.Second))
	}
	svc := ledger.NewService(pool, idempotency.NewStore(pool), reg)
	svc.SetCurrencyRails(map[string]string{"RWF": "mtn-rw", "KES": "mpesa-ke"})
	if err := svc.EnsureSettlementAccounts(ctx, "RWF", "KES"); err != nil {
		log.Error("settlement accounts", "err", err)
		os.Exit(1)
	}

	biz := func(phone string) *ledger.Account {
		u, err := svc.GetUserByPhone(ctx, phone)
		if err != nil {
			log.Error("demo trader missing; run `go run ./cmd/seed` first", "phone", phone, "err", err)
			os.Exit(1)
		}
		a, err := svc.GetAccountByUserAndType(ctx, u.ID, ledger.AccountTypeBusiness)
		if err != nil {
			log.Error("business account", "err", err)
			os.Exit(1)
		}
		return a
	}
	amina, kethan, jp := biz("+250700000991"), biz("+254700000882"), biz("+250700000773")

	// Plenty of float so the seeded payments never bounce on balance.
	for i, a := range []*ledger.Account{amina, jp} {
		if _, err := svc.FundAccount(ctx, a.ID, fmt.Sprintf("seed-analytics-float-%d-%d", i, time.Now().UnixNano()), ledger.FundRequest{Amount: 6_000_000, Currency: "RWF", Reference: "seed-analytics"}); err != nil {
			log.Error("fund", "err", err)
			os.Exit(1)
		}
	}
	if _, err := svc.FundAccount(ctx, kethan.ID, fmt.Sprintf("seed-analytics-float-k-%d", time.Now().UnixNano()), ledger.FundRequest{Amount: 400_000, Currency: "KES", Reference: "seed-analytics"}); err != nil {
		log.Error("fund", "err", err)
		os.Exit(1)
	}

	rng := rand.New(rand.NewSource(20260921)) // #nosec G404 -- fixed seed for reproducible dev fixture data, not security-sensitive; refused in production above
	now := time.Now().UTC()
	batch := now.UnixNano()
	made, reversed, failed := 0, 0, 0
	invoiceN := 0

	for i := 0; i < 70; i++ {
		// Volume grows toward today; weekdays and business hours dominate.
		age := int(60 * math.Pow(rng.Float64(), 1.6))
		when := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC).AddDate(0, 0, -age)
		if wd := when.Weekday(); (wd == time.Saturday || wd == time.Sunday) && rng.Float64() < 0.7 {
			when = when.AddDate(0, 0, -1)
		}
		hour := 8 + rng.Intn(10)
		if rng.Float64() < 0.12 {
			hour = rng.Intn(24)
		}
		when = when.Add(time.Duration(hour)*time.Hour + time.Duration(rng.Intn(60))*time.Minute)
		if when.After(now) {
			when = now.Add(-time.Hour)
		}

		key := fmt.Sprintf("seed-analytics-%d-%d", batch, i)
		amount := math.Round(math.Exp(rng.NormFloat64()*0.9+math.Log(45_000))/500) * 500 // log-normal, RWF
		if amount < 2_000 {
			amount = 2_000
		}
		var id string
		switch r := rng.Float64(); {
		case r < 0.40: // Amina -> Jean-Paul (domestic RWF)
			t, _, err := svc.Transfer(ctx, key, ledger.TransferRequest{SourceAccountID: amina.ID, DestinationAccountID: jp.ID, Amount: amount, Currency: "RWF", InvoiceNumber: nextInvoice(&invoiceN, batch)})
			if err == nil {
				id = t.ID
			}
		case r < 0.55: // Jean-Paul -> Amina
			t, _, err := svc.Transfer(ctx, key, ledger.TransferRequest{SourceAccountID: jp.ID, DestinationAccountID: amina.ID, Amount: amount * 0.8, Currency: "RWF"})
			if err == nil {
				id = t.ID
			}
		case r < 0.80: // Amina -> Kethan (RWF -> KES, ledger convention: RWF per KES)
			t, _, err := svc.CrossBorderTransfer(ctx, key, ledger.CrossBorderRequest{SourceAccountID: amina.ID, DestinationAccountID: kethan.ID, Amount: amount, CurrencyFrom: "RWF", CurrencyTo: "KES", FxRate: 10.66})
			if err == nil {
				id = t.ID
			}
		default: // Kethan -> Jean-Paul (KES -> RWF, tiny KES amounts)
			kes := math.Max(50, math.Round(amount/10.66/50)*50)
			t, _, err := svc.CrossBorderTransfer(ctx, key, ledger.CrossBorderRequest{SourceAccountID: kethan.ID, DestinationAccountID: jp.ID, Amount: kes, CurrencyFrom: "KES", CurrencyTo: "RWF", FxRate: 1 / 10.66})
			if err == nil {
				id = t.ID
			}
		}
		if id == "" {
			continue
		}
		made++
		if _, err := pool.Exec(ctx, `UPDATE transactions SET created_at=$2, updated_at=$2 WHERE id=$1`, id, when); err != nil {
			log.Error("backdate", "err", err)
			os.Exit(1)
		}
		if made%18 == 0 { // a proper reversal through the ledger
			if _, err := svc.ReverseTransfer(ctx, id, "seed: customer-requested reversal"); err == nil {
				reversed++
			}
		}
	}

	// A few failed attempts (failed transfers legitimately have no ledger entries).
	for i := 0; i < 6; i++ {
		when := now.AddDate(0, 0, -rng.Intn(45)).Add(-time.Duration(rng.Intn(600)) * time.Minute)
		if _, err := pool.Exec(ctx, `
			INSERT INTO transactions (idempotency_key, source_account_id, destination_account_id, amount, currency, status, failure_reason, created_at, updated_at)
			VALUES ($1,$2,$3,$4,'RWF','FAILED','provider rejected payout (seeded)',$5,$5)`,
			fmt.Sprintf("seed-analytics-failed-%d-%d", batch, i), amina.ID, jp.ID, 10_000+rng.Intn(40_000), when); err == nil {
			failed++
		}
	}
	log.Info("analytics fixture ready", "payments", made, "reversed", reversed, "failed", failed)
}

func nextInvoice(n *int, batch int64) string {
	*n++
	return fmt.Sprintf("INV-SEED-%d-%03d", batch%100000, *n)
}
