// Command seed-pilot creates a fully synthetic Phase 6 pilot fixture.
// It records no documents, calls no provider, and never enables settlement.
package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"vuka/go-bridge-core/internal/config"
	"vuka/go-bridge-core/internal/pilot"
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
	svc := pilot.NewService(pool, false, true)
	if err := svc.EnsureSchema(ctx); err != nil {
		log.Fatal(err)
	}
	now := time.Now().UTC()
	p, err := svc.Create(ctx, pilot.CreateRequest{
		PilotID: "synthetic-pilot-rw-ke-001", CorridorID: "rw-rwf-ke-kes", ProviderID: "mpesa-ke",
		Environment: "local", Scope: "synthetic supervised dry-run", MaxParticipants: 10,
		AmountLimitMinor: 100000, TransactionLimitMinor: 10000, DailyLimitMinor: 50000,
		StartAt: now, EndAt: now.Add(7 * 24 * time.Hour),
		Owner: "pilot-owner@example.invalid", SupportOwner: "pilot-support@example.invalid",
		IncidentOwner: "pilot-incident@example.invalid", RequiredApprovals: 2,
	}, "synthetic-seeder")
	if err != nil {
		if !errors.Is(err, pilot.ErrConflict) {
			log.Fatal(err)
		}
		p, err = svc.Get(ctx, "synthetic-pilot-rw-ke-001")
		if err != nil {
			log.Fatal(err)
		}
	}
	scenarios := []struct{ code, name, expected string }{
		{"happy_path", "Happy path", "Observation is recorded and no settlement side effect occurs"},
		{"provider_timeout", "Provider timeout", "Timeout becomes an observation/incident with no retry side effect"},
		{"webhook_replay", "Webhook replay", "Replay is rejected at the provider boundary"},
		{"corridor_kill_switch", "Corridor kill switch", "Scenario is refused while the corridor kill switch is active"},
		{"limit_exceedance", "Limit exceedance", "Amount or velocity limit is refused"},
		{"reconciliation_drift", "Reconciliation drift", "Drift opens an incident and records evidence"},
		{"operator_approval_failure", "Operator approval failure", "Self-approval or insufficient approvals is refused"},
		{"read_only_refusal", "Read-only refusal", "Every pilot mutation is blocked in read-only mode"},
	}
	for _, scenario := range scenarios {
		if _, err := svc.AddScenario(ctx, p.ID, pilot.ScenarioRequest{
			Code: scenario.code, Name: scenario.name, Description: "Synthetic supervised dry-run scenario",
			Expected: scenario.expected,
		}, "synthetic-seeder"); err != nil {
			if !errors.Is(err, pilot.ErrConflict) {
				log.Fatal(err)
			}
		}
	}
	fmt.Printf("synthetic pilot=%s status=%s observation_only=%t live_enabled=%t\n", p.PilotID, p.Status, p.ObservationOnly, p.LiveEnabled)
}
