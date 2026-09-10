// Package main is the VUKA Go bridge engine entrypoint.
//
// Startup order: load config -> connect PostgreSQL -> wire idempotency store,
// adapter registry, ledger service -> start HTTP server with graceful
// shutdown on SIGINT/SIGTERM.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"vuka/go-bridge-core/internal/adapters"
	"vuka/go-bridge-core/internal/api"
	"vuka/go-bridge-core/internal/config"
	bridgegrpc "vuka/go-bridge-core/internal/grpc"
	"vuka/go-bridge-core/internal/grpcpb"
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

func main() {
	log := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	if err := run(log); err != nil {
		log.Error("fatal", "err", err)
		os.Exit(1)
	}
}

func run(log *slog.Logger) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	if err := cfg.Validate(); err != nil {
		return err
	}
	log.Info("vuka bridge engine starting", "config", cfg.String())

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	// Verify the database is reachable before accepting traffic.
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		return err
	}
	log.Info("database connected")

	// Wire the adapter registry (Phase 1: simulated MTN Rwanda; Phase 2:
	// simulated M-Pesa Kenya for the RWF -> KES corridor).
	registry := adapters.NewRegistry()
	registry.Register(adapters.NewMTNAdapter(
		cfg.MTNSimDelay,
		cfg.MTNSimFailRate,
		cfg.MTNSimMode,
		cfg.MTNSimTimeout,
	))
	registry.Register(adapters.NewMpesaAdapter(
		cfg.MTNSimDelay,
		cfg.MTNSimFailRate,
		cfg.MTNSimMode,
		cfg.MTNSimTimeout,
	))
	log.Info("adapters registered", "available", registry.Names())

	idem := idempotency.NewStore(pool)
	ledgerSvc := ledger.NewService(pool, idem, registry)
	if cfg.FxRateRWFKES > 0 {
		ledgerSvc.SetDefaultFxRate(cfg.FxRateRWFKES)
	}

	// Bootstrap the ledger schema on every start (idempotent). This is what
	// makes the engine deployable to ANY empty PostgreSQL — Render's managed
	// DB never runs deploy/init.sql the way the local compose does, so the
	// engine must create its own tables if they are missing.
	{
		seedCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		defer cancel()
		if err := ledgerSvc.EnsureSchema(seedCtx); err != nil {
			return fmt.Errorf("ensure ledger schema: %w", err)
		}
		log.Info("ledger schema ready")
	}

	// Seed the SETTLEMENT accounts used by cross-border transfers.
	seedCtx, seedCancel := context.WithTimeout(ctx, 10*time.Second)
	defer seedCancel()
	if err := ledgerSvc.EnsureSettlementAccounts(seedCtx, "RWF", "KES"); err != nil {
		return err
	}
	log.Info("settlement accounts ready", "currencies", []string{"RWF", "KES"})

	var reconciliationRepo *reconciliation.Repository
	var reconciliationPoller *reconciliation.Poller
	var authStore *api.AuthStore
	// Operators are a foreign-key target for organization memberships, so the
	// auth tables exist even when authentication is disabled in development.
	authSchema := api.NewAuthStore(pool)
	authCtx, authCancel := context.WithTimeout(ctx, 10*time.Second)
	if err := authSchema.EnsureSchema(authCtx); err != nil {
		authCancel()
		return fmt.Errorf("ensure auth schema: %w", err)
	}
	authCancel()
	if cfg.OperatorEmail != "" {
		authStore = authSchema
		authStore.ConfigureActivityRetention(cfg.ActivityRetentionDays)
		authCtx, authCancel := context.WithTimeout(ctx, 10*time.Second)
		if err := authStore.EnsureOperator(authCtx, cfg.OperatorEmail, cfg.OperatorPassword, cfg.OperatorRole); err != nil {
			authCancel()
			return err
		}
		authCancel()
		log.Info("operator authentication enabled")
	}
	identityCtx, identityCancel := context.WithTimeout(ctx, 10*time.Second)
	if err := identity.EnsureSchema(identityCtx, pool); err != nil {
		identityCancel()
		return fmt.Errorf("ensure identity schema: %w", err)
	}
	identityCancel()
	log.Info("identity and compliance schema ready", "mode", "local-only")
	providerCtx, providerCancel := context.WithTimeout(ctx, 10*time.Second)
	if err := providers.EnsureSchema(providerCtx, pool); err != nil {
		providerCancel()
		return fmt.Errorf("ensure provider schema: %w", err)
	}
	providerCancel()
	log.Info("provider control-plane schema ready", "mode", "sandbox-only", "external_calls", false)
	executionCtx, executionCancel := context.WithTimeout(ctx, 10*time.Second)
	if err := providerexec.EnsureSchema(executionCtx, pool); err != nil {
		executionCancel()
		return fmt.Errorf("ensure provider execution schema: %w", err)
	}
	executionCancel()
	providerExecutionSvc := providerexec.NewService(registry, providerexec.NewPostgresStore(pool))
	if cfg.ProviderCredentialRef != "" {
		providerExecutionSvc.SetCredentialReference(cfg.AdapterName, cfg.ProviderCredentialRef)
	}
	log.Info("provider execution schema ready", "durable_evidence", true, "external_calls", false)
	workflowCtx, workflowCancel := context.WithTimeout(ctx, 10*time.Second)
	if err := transactionworkflow.EnsureSchema(workflowCtx, pool); err != nil {
		workflowCancel()
		return fmt.Errorf("ensure transaction workflow schema: %w", err)
	}
	workflowCancel()
	log.Info("transaction workflow schema ready", "external_calls", false, "approval_gated", true)
	settlementPolicy := settlement.DefaultPolicy()
	settlementPolicy.RequiredApprovals = cfg.SettlementRequiredApprovals
	settlementPolicy.MaxAmountMinor = cfg.SettlementMaxAmountMinor
	settlementPolicy.DailyLimitMinor = cfg.SettlementDailyLimitMinor
	settlementPolicy.GlobalKillSwitch = cfg.SettlementGlobalKillSwitch
	settlementPolicy.ExecutionEnabled = cfg.SettlementExecutionEnabled
	settlementPolicy.ReadOnly = cfg.ReadOnly
	settlementSvc := settlement.NewService(pool, settlementPolicy)
	settlementCtx, settlementCancel := context.WithTimeout(ctx, 10*time.Second)
	if err := settlementSvc.EnsureSchema(settlementCtx); err != nil {
		settlementCancel()
		return fmt.Errorf("ensure settlement schema: %w", err)
	}
	settlementCancel()
	log.Info("controlled settlement schema ready", "dry_run_only", true, "global_kill_switch", true)
	pilotSvc := pilot.NewService(pool, cfg.ReadOnly, cfg.SettlementGlobalKillSwitch)
	pilotCtx, pilotCancel := context.WithTimeout(ctx, 10*time.Second)
	if err := pilotSvc.EnsureSchema(pilotCtx); err != nil {
		pilotCancel()
		return fmt.Errorf("ensure pilot schema: %w", err)
	}
	pilotCancel()
	log.Info("supervised pilot schema ready", "observation_only", true, "live_execution", false)
	supportSvc := support.NewService(pool, cfg.ReadOnly)
	supportCtx, supportCancel := context.WithTimeout(ctx, 10*time.Second)
	if err := supportSvc.EnsureSchema(supportCtx); err != nil {
		supportCancel()
		return fmt.Errorf("ensure support schema: %w", err)
	}
	supportCancel()
	log.Info("trader support schema ready", "local_only", true)
	if cfg.ReconciliationEnabled {
		reconcileCtx, reconcileCancel := context.WithTimeout(ctx, 30*time.Second)
		if err := reconciliation.EnsureSchema(reconcileCtx, pool); err != nil {
			reconcileCancel()
			return fmt.Errorf("ensure reconciliation schema: %w", err)
		}

		reconcileCancel()
		reconciliationRepo = reconciliation.NewRepository(pool)
		reconciliationPoller, err = reconciliation.NewPoller(
			cfg.ReconciliationRPCURL,
			reconciliationRepo,
			cfg.ReconciliationChainID,
			cfg.ReconciliationContract,
			cfg.ReconciliationConfirmations,
		)
		if err != nil {
			return err
		}
		if err := reconciliationPoller.SetMaxBlockRange(cfg.ReconciliationMaxRange); err != nil {
			return err
		}
		go func() {
			log.Info("reconciliation worker started",
				"chain_id", cfg.ReconciliationChainID,
				"contract", cfg.ReconciliationContract,
				"confirmations", cfg.ReconciliationConfirmations,
				"interval", cfg.ReconciliationInterval,
			)
			for {
				if err := reconciliationPoller.Run(ctx, cfg.ReconciliationInterval); err != nil {
					if errors.Is(err, context.Canceled) {
						return
					}
					log.Error("reconciliation worker paused", "err", err, "retry_after", "5s")
					retry := time.NewTimer(5 * time.Second)
					select {
					case <-ctx.Done():
						retry.Stop()
						return
					case <-retry.C:
					}
					continue
				}
				return
			}
		}()
	}

	// Build the REST handler. When VUKA_WEB_DIR points at the built SPA,
	// serve the dashboard and the API from the same port (single-origin
	// production shape; tunnel-friendly).
	handler := api.NewServerWithRuntimeOptionsAndProviderExecution(ledgerSvc, log, cfg.CORSOrigins, reconciliationRepo, reconciliationPoller, authStore, cfg.ReconciliationLagWarning, cfg.ReconciliationLagCritical, cfg.ReadOnly, settlementSvc, pilotSvc, supportSvc, cfg.LocalSyntheticExecution, providerExecutionSvc)
	if cfg.WebDir != "" {
		handler = api.WithWebDir(handler, cfg.WebDir)
		log.Info("serving web dashboard", "dir", cfg.WebDir)
	}
	handler = api.RateLimitMiddleware(handler, cfg.RateLimitRequests, cfg.RateLimitWindow)

	srv := &http.Server{
		Addr:         cfg.HTTPAddr,
		Handler:      handler,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  cfg.IdleTimeout,
	}

	// gRPC bridge for the Python ISO 20022 gateway (Phase 2).
	lis, err := net.Listen("tcp", cfg.GRPCAddr)
	if err != nil {
		return err
	}
	gs := grpc.NewServer()
	grpcpb.RegisterBridgeServer(gs, bridgegrpc.NewServer(ledgerSvc))
	reflection.Register(gs)

	// Run both servers in the background and wait for a shutdown signal.
	errCh := make(chan error, 2)
	go func() {
		log.Info("http server listening", "addr", cfg.HTTPAddr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()
	go func() {
		log.Info("grpc server listening", "addr", cfg.GRPCAddr)
		if err := gs.Serve(lis); err != nil {
			errCh <- err
		}
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
		log.Info("shutdown signal received")
	}

	gs.GracefulStop()
	shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelShutdown()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		return err
	}
	log.Info("server stopped cleanly")
	return nil
}
