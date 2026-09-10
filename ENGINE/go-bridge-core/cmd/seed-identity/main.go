// seed-identity creates synthetic Phase 3 records for local demonstrations.
// It intentionally stores only metadata references and must not be used with
// production credentials or real identity documents.
package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"

	"vuka/go-bridge-core/internal/api"
	"vuka/go-bridge-core/internal/config"
	"vuka/go-bridge-core/internal/identity"
)

func main() {
	log := slog.New(slog.NewTextHandler(os.Stdout, nil))
	cfg, err := config.Load()
	if err != nil {
		log.Error("config", "err", err)
		os.Exit(1)
	}
	if cfg.Environment == "production" {
		log.Error("refusing synthetic seed in production")
		os.Exit(1)
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("connect", "err", err)
		os.Exit(1)
	}
	defer pool.Close()
	if err := api.NewAuthStore(pool).EnsureSchema(ctx); err != nil {
		log.Error("auth schema", "err", err)
		os.Exit(1)
	}
	if err := identity.EnsureSchema(ctx, pool); err != nil {
		log.Error("identity schema", "err", err)
		os.Exit(1)
	}
	actor := cfg.OperatorEmail
	if actor == "" {
		actor = "synthetic-reviewer@local.vuka"
	}
	svc := identity.NewService(pool)
	orgs, err := svc.ListOrganizations(ctx, "")
	if err != nil {
		log.Error("list organizations", "err", err)
		os.Exit(1)
	}
	var org *identity.Organization
	for _, candidate := range orgs {
		if candidate.LegalName == "Synthetic East Africa Traders Ltd" {
			org = candidate
			break
		}
	}
	if org == nil {
		org, err = svc.CreateOrganization(ctx, identity.CreateOrganizationRequest{
			LegalName: "Synthetic East Africa Traders Ltd", TradingName: "Synthetic Traders",
			CountryCode: "RW", OrganizationType: "company", RegistrationNumber: "SYNTH-LOCAL-0001",
		})
		if err != nil {
			log.Error("create organization", "err", err)
			os.Exit(1)
		}
	}
	_, _ = svc.AddMembership(ctx, org.ID, identity.CreateMembershipRequest{OperatorEmail: actor, Role: "reviewer"})
	verification, err := svc.CreateVerification(ctx, identity.CreateVerificationRequest{
		OrganizationID: org.ID, VerificationType: "business", Reference: "synthetic://business/0001",
		EvidenceLabel: "Synthetic fixture; no document stored",
	}, actor)
	if err != nil {
		log.Error("create verification", "err", err)
		os.Exit(1)
	}
	review, err := svc.CreateReview(ctx, identity.CreateReviewRequest{OrganizationID: org.ID, Reason: "Synthetic local compliance fixture"}, actor)
	if err != nil {
		log.Error("create review", "err", err)
		os.Exit(1)
	}
	if _, err := svc.AddRiskFlag(ctx, org.ID, identity.CreateRiskFlagRequest{
		Code: "SYNTHETIC_REVIEW", Severity: "low", Description: "Synthetic fixture only; not a real risk signal",
	}, actor); err != nil {
		log.Error("create risk flag", "err", err)
		os.Exit(1)
	}
	log.Info("synthetic identity seed ready", "organization_id", org.ID, "verification_id", verification.ID, "review_id", review.ID, "actor", actor)
}
