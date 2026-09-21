// Package config loads runtime configuration from environment variables
// with sensible development defaults. VUKA follows the twelve-factor style:
// every tunable knob is an env var, never a hardcoded constant.
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds all runtime settings for the VUKA Go bridge engine.
type Config struct {
	Environment string
	ReadOnly    bool
	// LocalSyntheticExecution enables the fully local simulated ledger rail for
	// development demos. It never enables external providers or settlement.
	LocalSyntheticExecution bool
	// HTTPAddr is the listen address for the REST API, e.g. ":8080".
	HTTPAddr string
	// GRPCAddr is the listen address for the gRPC bridge consumed by the
	// Python ISO 20022 gateway, e.g. ":50051".
	GRPCAddr string
	// DatabaseURL is the PostgreSQL DSN (pgx format), e.g.
	// "postgres://vuka:***@localhost:5432/vuka".
	DatabaseURL string

	// FxRateRWFKES is the engine-wide RWF->KES rate used when a cross-border
	// request omits its own fx_rate. Zero disables the default (requests must
	// then provide a rate).
	FxRateRWFKES float64

	// CORSOrigins is the allow-list of browser origins for the trader
	// dashboard, e.g. "http://localhost:5173". Comma-separated in the env.
	// Empty allows any origin (dev only).
	CORSOrigins []string

	// WebDir is an optional directory containing the built single-page
	// dashboard (Vite `dist/`). When set, the HTTP server serves the SPA
	// at "/" with index.html fallback so the whole product runs on one
	// port. Empty disables static serving (API-only mode).
	WebDir string

	// Pan-African corridor catalog (see internal/providers/africa.go).
	// QuoteSigningKey signs firm FX quotes; it MUST be identical on every replica
	// and at least 32 bytes in production. FxRates overrides the sandbox reference
	// table ("KES=129.5,RWF=1380", units per USD) until a live rate source is wired.
	QuoteSigningKey  string
	QuoteTTL         time.Duration
	FxRates          string
	FxSource         string
	EnabledCountries []string
	MaxTxnUSD        float64
	DailyCorridorUSD float64
	// AllowLiveProviders is the explicit acknowledgement required before any
	// provider may leave sandbox mode (VUKA_PROVIDER_MODE_<ID>=live).
	AllowLiveProviders bool
	// MetricsToken is the bearer token Prometheus presents to /metrics.
	MetricsToken string
	// Sandbox screening lists (test names only) — replaced by a vendor in production.
	SandboxSanctionsDeny   []string
	SandboxSanctionsReview []string

	OperatorEmail    string
	OperatorPassword string
	OperatorRole     string
	// ActivityRetentionDays limits activity visibility without deleting the
	// append-only records. Zero keeps the full history visible.
	ActivityRetentionDays int64

	// Adapter settings ----------------------------------------------------
	// AdapterName selects the telecom adapter from the registry, e.g. "mtn-rw".
	AdapterName string
	// ProviderCredentialRef is a managed reference only (never a credential
	// value). It is ignored for simulated adapters.
	ProviderCredentialRef string
	// MTNSimDelay is the simulated network latency of the MTN adapter.
	MTNSimDelay time.Duration
	// MTNSimFailRate is the probability (0.0-1.0) that a simulated payout fails.
	MTNSimFailRate float64
	// MTNSimMode forces a deterministic adapter behaviour:
	// "success", "fail", "timeout", or "" (random per fail rate).
	MTNSimMode string
	// MTNSimTimeout is how long the adapter waits before timing out.
	MTNSimTimeout time.Duration

	// Server timeouts ----------------------------------------------------
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
	// RateLimitRequests is the maximum requests per client/IP window. Zero disables it.
	RateLimitRequests int
	RateLimitWindow   time.Duration

	// Reconciliation is opt-in until the v2 chain service is operationally
	// configured. All values are ignored when ReconciliationEnabled is false.
	ReconciliationEnabled       bool
	ReconciliationRPCURL        string
	ReconciliationChainID       int64
	ReconciliationContract      string
	ReconciliationConfirmations int64
	ReconciliationInterval      time.Duration
	ReconciliationMaxRange      int64
	ReconciliationLagWarning    int64
	ReconciliationLagCritical   int64

	// Settlement remains a local dry-run boundary. The feature flag is
	// intentionally observed only as policy metadata; the service still
	// refuses live execution until a future audited implementation exists.
	SettlementRequiredApprovals int
	SettlementMaxAmountMinor    int64
	SettlementDailyLimitMinor   int64
	SettlementGlobalKillSwitch  bool
	SettlementExecutionEnabled  bool
}

// Load reads configuration from the environment. Missing optional values fall
// back to development defaults; missing required values return an error so the
// process fails fast instead of starting half-configured.
func Load() (*Config, error) {
	cfg := &Config{
		Environment:                 getEnv("VUKA_ENV", "development"),
		ReadOnly:                    getBool("VUKA_READ_ONLY", false),
		LocalSyntheticExecution:     getBool("VUKA_LOCAL_SYNTHETIC_EXECUTION_ENABLED", false),
		HTTPAddr:                    getEnv("VUKA_HTTP_ADDR", ":8080"),
		GRPCAddr:                    getEnv("VUKA_GRPC_ADDR", ":50051"),
		DatabaseURL:                 os.Getenv("VUKA_DATABASE_URL"),
		FxRateRWFKES:                getFloat("VUKA_FX_RWF_KES", 0),
		CORSOrigins:                 splitList("VUKA_CORS_ORIGINS"),
		WebDir:                      getEnv("VUKA_WEB_DIR", ""),
		QuoteSigningKey:             os.Getenv("VUKA_QUOTE_SIGNING_KEY"),
		QuoteTTL:                    getDuration("VUKA_QUOTE_TTL_MS", 10*time.Minute),
		FxRates:                     os.Getenv("VUKA_FX_RATES"),
		FxSource:                    getEnv("VUKA_FX_SOURCE", "sandbox-reference"),
		EnabledCountries:            splitList("VUKA_ENABLED_COUNTRIES"),
		MaxTxnUSD:                   getFloat("VUKA_MAX_TXN_USD", 10000),
		DailyCorridorUSD:            getFloat("VUKA_DAILY_CORRIDOR_USD", 100000),
		AllowLiveProviders:          getBool("VUKA_ALLOW_LIVE_PROVIDERS", false),
		MetricsToken:                os.Getenv("VUKA_METRICS_TOKEN"),
		SandboxSanctionsDeny:        splitList("VUKA_SANDBOX_SANCTIONS_DENY"),
		SandboxSanctionsReview:      splitList("VUKA_SANDBOX_SANCTIONS_REVIEW"),
		OperatorEmail:               os.Getenv("VUKA_OPERATOR_EMAIL"),
		OperatorPassword:            os.Getenv("VUKA_OPERATOR_PASSWORD"),
		OperatorRole:                getEnv("VUKA_OPERATOR_ROLE", "operator"),
		ActivityRetentionDays:       getInt64("VUKA_ACTIVITY_RETENTION_DAYS", 0),
		AdapterName:                 getEnv("VUKA_ADAPTER", "mtn-rw"),
		ProviderCredentialRef:       os.Getenv("VUKA_PROVIDER_CREDENTIAL_REF"),
		MTNSimDelay:                 getDuration("MTN_SIM_DELAY_MS", 150*time.Millisecond),
		MTNSimFailRate:              getFloat("MTN_SIM_FAIL_RATE", 0.0),
		MTNSimMode:                  getEnv("MTN_SIM_MODE", ""),
		MTNSimTimeout:               getDuration("MTN_SIM_TIMEOUT_MS", 5*time.Second),
		ReadTimeout:                 getDuration("VUKA_READ_TIMEOUT_S", 10*time.Second),
		WriteTimeout:                getDuration("VUKA_WRITE_TIMEOUT_S", 30*time.Second),
		IdleTimeout:                 getDuration("VUKA_IDLE_TIMEOUT_S", 60*time.Second),
		RateLimitRequests:           int(getInt64("VUKA_RATE_LIMIT_REQUESTS", 0)),
		RateLimitWindow:             getDuration("VUKA_RATE_LIMIT_WINDOW_MS", 1000*time.Millisecond),
		ReconciliationEnabled:       getBool("VUKA_RECONCILIATION_ENABLED", false),
		ReconciliationRPCURL:        os.Getenv("VUKA_RECONCILIATION_RPC_URL"),
		ReconciliationChainID:       getInt64("VUKA_RECONCILIATION_CHAIN_ID", 80002),
		ReconciliationContract:      os.Getenv("VUKA_RECONCILIATION_CONTRACT"),
		ReconciliationConfirmations: getInt64("VUKA_RECONCILIATION_CONFIRMATIONS", 128),
		ReconciliationInterval:      getDuration("VUKA_RECONCILIATION_INTERVAL_MS", 15000*time.Millisecond),
		ReconciliationMaxRange:      getInt64("VUKA_RECONCILIATION_MAX_RANGE", 9),
		ReconciliationLagWarning:    getInt64("VUKA_RECONCILIATION_LAG_WARNING_BLOCKS", 50),
		ReconciliationLagCritical:   getInt64("VUKA_RECONCILIATION_LAG_CRITICAL_BLOCKS", 500),
		SettlementRequiredApprovals: int(getInt64("VUKA_SETTLEMENT_REQUIRED_APPROVALS", 2)),
		SettlementMaxAmountMinor:    getInt64("VUKA_SETTLEMENT_MAX_AMOUNT_MINOR", 50000000),
		SettlementDailyLimitMinor:   getInt64("VUKA_SETTLEMENT_DAILY_LIMIT_MINOR", 100000000),
		SettlementGlobalKillSwitch:  getBool("VUKA_SETTLEMENT_GLOBAL_KILL_SWITCH", true),
		SettlementExecutionEnabled:  getBool("VUKA_SETTLEMENT_EXECUTION_ENABLED", false),
	}

	if cfg.DatabaseURL == "" {
		// Dev default matching deploy/docker-compose.yml (host port 5432).
		// Placeholder password only — real dev credentials come from the
		// environment (VUKA_DATABASE_URL) or ~/.pgpass; never commit a
		// working credential to the repository.
		cfg.DatabaseURL = "postgres://vuka:changeme@localhost:5432/vuka?sslmode=disable"
	}

	if cfg.MTNSimFailRate < 0 || cfg.MTNSimFailRate > 1 {
		return nil, fmt.Errorf("config: MTN_SIM_FAIL_RATE must be within [0, 1], got %v", cfg.MTNSimFailRate)
	}
	if cfg.MTNSimMode != "" && cfg.MTNSimMode != "success" && cfg.MTNSimMode != "fail" && cfg.MTNSimMode != "timeout" {
		return nil, fmt.Errorf("config: MTN_SIM_MODE must be one of success|fail|timeout|empty, got %q", cfg.MTNSimMode)
	}
	if cfg.ReconciliationEnabled {
		if cfg.ReconciliationRPCURL == "" || cfg.ReconciliationContract == "" {
			return nil, fmt.Errorf("config: reconciliation RPC URL and contract are required when enabled")
		}
		if cfg.ReconciliationChainID <= 0 || cfg.ReconciliationConfirmations < 0 ||
			cfg.ReconciliationInterval <= 0 || cfg.ReconciliationMaxRange <= 0 ||
			cfg.ReconciliationLagWarning <= 0 || cfg.ReconciliationLagCritical <= cfg.ReconciliationLagWarning {
			return nil, fmt.Errorf("config: invalid reconciliation settings")
		}
	}

	return cfg, nil
}

// Validate returns an error when required configuration is missing or invalid.
// Called explicitly by the entrypoint before any connection is attempted.
func (c *Config) Validate() error {
	if c.Environment != "development" && c.Environment != "staging" && c.Environment != "production" {
		return fmt.Errorf("config: VUKA_ENV must be development, staging, or production")
	}
	if c.DatabaseURL == "" {
		return fmt.Errorf("config: VUKA_DATABASE_URL is required")
	}
	if c.HTTPAddr == "" {
		return fmt.Errorf("config: VUKA_HTTP_ADDR is required")
	}
	if c.GRPCAddr == "" {
		return fmt.Errorf("config: VUKA_GRPC_ADDR is required")
	}
	if c.ProviderCredentialRef != "" &&
		(!strings.Contains(c.ProviderCredentialRef, "://") || strings.Contains(c.ProviderCredentialRef, "=")) {
		return fmt.Errorf("config: VUKA_PROVIDER_CREDENTIAL_REF must be a managed reference, not a secret")
	}
	if (c.OperatorEmail == "") != (c.OperatorPassword == "") {
		return fmt.Errorf("config: VUKA_OPERATOR_EMAIL and VUKA_OPERATOR_PASSWORD must be provided together")
	}
	if c.QuoteSigningKey != "" && len(c.QuoteSigningKey) < 32 {
		return fmt.Errorf("config: VUKA_QUOTE_SIGNING_KEY must be at least 32 characters")
	}
	if c.MaxTxnUSD <= 0 || c.DailyCorridorUSD < c.MaxTxnUSD {
		return fmt.Errorf("config: VUKA_MAX_TXN_USD must be positive and not exceed VUKA_DAILY_CORRIDOR_USD")
	}
	if c.Environment == "production" {
		if c.QuoteSigningKey == "" {
			return fmt.Errorf("config: VUKA_QUOTE_SIGNING_KEY is required in production (shared by every replica)")
		}
		if c.OperatorEmail == "" || c.OperatorPassword == "" {
			return fmt.Errorf("config: operator credentials are required in production")
		}
		if len(c.OperatorPassword) < 12 {
			return fmt.Errorf("config: VUKA_OPERATOR_PASSWORD must be at least 12 characters in production")
		}
		if len(c.CORSOrigins) == 0 {
			return fmt.Errorf("config: VUKA_CORS_ORIGINS is required in production")
		}
		if c.MTNSimMode != "" || c.MTNSimFailRate != 0 {
			return fmt.Errorf("config: deterministic or failing simulated adapter settings are not allowed in production")
		}
		if !c.ReadOnly {
			return fmt.Errorf("config: VUKA_READ_ONLY must be true in production")
		}
		if c.LocalSyntheticExecution {
			return fmt.Errorf("config: local synthetic execution is development-only")
		}
	}
	if c.LocalSyntheticExecution && c.Environment != "development" {
		return fmt.Errorf("config: local synthetic execution requires VUKA_ENV=development")
	}
	if c.LocalSyntheticExecution && c.ReadOnly {
		return fmt.Errorf("config: local synthetic execution requires VUKA_READ_ONLY=false")
	}
	if c.OperatorRole != "operator" && c.OperatorRole != "arbiter" {
		return fmt.Errorf("config: VUKA_OPERATOR_ROLE must be operator or arbiter")
	}
	if c.FxRateRWFKES < 0 {
		return fmt.Errorf("config: VUKA_FX_RWF_KES must be >= 0, got %v", c.FxRateRWFKES)
	}
	if c.ActivityRetentionDays < 0 {
		return fmt.Errorf("config: VUKA_ACTIVITY_RETENTION_DAYS must be >= 0, got %v", c.ActivityRetentionDays)
	}
	if c.RateLimitRequests < 0 || c.RateLimitWindow < 0 {
		return fmt.Errorf("config: rate limit settings must be non-negative")
	}
	if c.RateLimitRequests > 0 && c.RateLimitWindow == 0 {
		return fmt.Errorf("config: VUKA_RATE_LIMIT_WINDOW_MS must be positive when rate limiting is enabled")
	}
	if c.SettlementRequiredApprovals < 2 || c.SettlementMaxAmountMinor <= 0 ||
		c.SettlementDailyLimitMinor < c.SettlementMaxAmountMinor {
		return fmt.Errorf("config: invalid settlement approvals or limits")
	}
	if !c.SettlementGlobalKillSwitch {
		return fmt.Errorf("config: settlement global kill switch must remain active until explicit multi-party governance approval")
	}
	if c.SettlementExecutionEnabled {
		return fmt.Errorf("config: settlement live execution is not implemented and must remain disabled")
	}
	return nil
}

// String returns a redacted, log-safe representation of the config.
// The database URL is printed without its password component.
func (c *Config) String() string {
	dsn := c.DatabaseURL
	// Strip credentials for logs: postgres://user:pass@host -> postgres://user:***@host
	if scheme := strings.Index(dsn, "://"); scheme >= 0 {
		rest := dsn[scheme+3:]
		if at := strings.Index(rest, "@"); at >= 0 {
			userinfo := rest[:at]
			if colon := strings.Index(userinfo, ":"); colon >= 0 {
				dsn = dsn[:scheme+3+colon+1] + "***@" + rest[at+1:]
			}
		}
	}
	return fmt.Sprintf(
		"http_addr=%s grpc_addr=%s db=%s adapter=%s mtn_delay=%s mtn_fail_rate=%.2f mtn_mode=%q fx_rwf_kes=%.4f",
		c.HTTPAddr, c.GRPCAddr, dsn, c.AdapterName, c.MTNSimDelay, c.MTNSimFailRate, c.MTNSimMode, c.FxRateRWFKES,
	)
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

// splitList parses a comma-separated env list into a trimmed slice, dropping
// empty entries (e.g. VUKA_CORS_ORIGINS).
func splitList(key string) []string {
	raw := os.Getenv(key)
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

func getDuration(key string, fallback time.Duration) time.Duration {
	if raw, ok := os.LookupEnv(key); ok && raw != "" {
		if ms, err := strconv.ParseInt(raw, 10, 64); err == nil && ms >= 0 {
			return time.Duration(ms) * time.Millisecond
		}
	}
	return fallback
}

func getFloat(key string, fallback float64) float64 {
	if raw, ok := os.LookupEnv(key); ok && raw != "" {
		if f, err := strconv.ParseFloat(raw, 64); err == nil {
			return f
		}
	}
	return fallback
}

func getInt64(key string, fallback int64) int64 {
	if raw, ok := os.LookupEnv(key); ok && raw != "" {
		if value, err := strconv.ParseInt(raw, 10, 64); err == nil {
			return value
		}
	}
	return fallback
}

func getBool(key string, fallback bool) bool {
	if raw, ok := os.LookupEnv(key); ok && raw != "" {
		if value, err := strconv.ParseBool(raw); err == nil {
			return value
		}
	}
	return fallback
}
