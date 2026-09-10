package pilot_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"vuka/go-bridge-core/internal/pilot"
	"vuka/go-bridge-core/internal/testutil"
)

func TestSupervisedPilotGovernanceAndReplay(t *testing.T) {
	pool := testutil.TestPool(t)
	ctx := context.Background()
	svc := pilot.NewService(pool, false, true)
	if err := svc.EnsureSchema(ctx); err != nil {
		t.Fatal(err)
	}
	var organizationID string
	if err := pool.QueryRow(ctx, `INSERT INTO organizations(legal_name,country_code,organization_type,verification_status)
		VALUES('Synthetic Trader','RW','company','approved') RETURNING id`).Scan(&organizationID); err != nil {
		t.Fatal(err)
	}
	now := time.Now().UTC()
	p, err := svc.Create(ctx, pilot.CreateRequest{
		PilotID: "integration-pilot", CorridorID: "rw-rwf-ke-kes", ProviderID: "mpesa-ke",
		Environment: "local", Scope: "synthetic supervised scenarios", MaxParticipants: 2,
		AmountLimitMinor: 1000, TransactionLimitMinor: 100, DailyLimitMinor: 500,
		StartAt: now, EndAt: now.Add(time.Hour), Owner: "owner@example.invalid",
		SupportOwner: "support@example.invalid", IncidentOwner: "incident@example.invalid",
		RequiredApprovals: 2,
	}, "owner@example.invalid")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := svc.AddParticipant(ctx, p.ID, pilot.ParticipantRequest{
		OrganizationID: organizationID, Consent: true, TermsVersion: "synthetic-v1",
	}, "operator@example.invalid"); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Approve(ctx, p.ID, "owner@example.invalid", "arbiter", pilot.ApprovalRequest{Decision: "approved"}); !errors.Is(err, pilot.ErrSelfApproval) {
		t.Fatalf("expected owner self-approval rejection, got %v", err)
	}
	if _, err := svc.Approve(ctx, p.ID, "security@example.invalid", "arbiter", pilot.ApprovalRequest{Decision: "approved"}); err != nil {
		t.Fatal(err)
	}
	p, err = svc.Approve(ctx, p.ID, "operations@example.invalid", "arbiter", pilot.ApprovalRequest{Decision: "approved"})
	if err != nil || p.Status != pilot.StatusApproved {
		t.Fatalf("expected approved pilot, p=%+v err=%v", p, err)
	}
	if _, err := svc.Resume(ctx, p.ID, "operator@example.invalid", "operator"); err != nil {
		t.Fatal(err)
	}
	scenario, err := svc.AddScenario(ctx, p.ID, pilot.ScenarioRequest{
		Code: "happy_path", Name: "Happy path", Description: "synthetic", Expected: "no settlement",
	}, "operator@example.invalid")
	if err != nil {
		t.Fatal(err)
	}
	run, replay, err := svc.AddRun(ctx, p.ID, scenario.ID, "operator@example.invalid", pilot.RunRequest{
		Observed: "recorded", Outcome: "pass", IdempotencyKey: "run-1", Completed: true,
	})
	if err != nil || replay || run.ID == "" {
		t.Fatalf("expected first run, run=%+v replay=%v err=%v", run, replay, err)
	}
	_, replay, err = svc.AddRun(ctx, p.ID, scenario.ID, "operator@example.invalid", pilot.RunRequest{
		Observed: "recorded", Outcome: "pass", IdempotencyKey: "run-1", Completed: true,
	})
	if err != nil || !replay {
		t.Fatalf("expected idempotent run replay, replay=%v err=%v", replay, err)
	}
	if _, _, err := svc.AddObservation(ctx, p.ID, "operator@example.invalid", "operator", pilot.ObservationRequest{
		Metric: "scenario_pass_rate", Value: "1", IdempotencyKey: "obs-1",
	}); err != nil {
		t.Fatal(err)
	}
	readonly := pilot.NewService(pool, true, true)
	if _, _, err := readonly.AddObservation(ctx, p.ID, "operator@example.invalid", "operator", pilot.ObservationRequest{
		Metric: "blocked", Value: "1", IdempotencyKey: "obs-readonly",
	}); !errors.Is(err, pilot.ErrReadOnly) {
		t.Fatalf("expected read-only refusal, got %v", err)
	}
}
