package config

import "testing"

func TestReconciliationIsOptIn(t *testing.T) {
	t.Setenv("VUKA_RECONCILIATION_ENABLED", "")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.ReconciliationEnabled {
		t.Fatal("reconciliation should be disabled by default")
	}
}

func TestEnabledReconciliationRequiresEndpointAndContract(t *testing.T) {
	t.Setenv("VUKA_RECONCILIATION_ENABLED", "true")
	t.Setenv("VUKA_RECONCILIATION_RPC_URL", "")
	t.Setenv("VUKA_RECONCILIATION_CONTRACT", "")
	if _, err := Load(); err == nil {
		t.Fatal("expected enabled reconciliation validation error")
	}
}

func TestReconciliationLagThresholds(t *testing.T) {
	t.Setenv("VUKA_RECONCILIATION_ENABLED", "true")
	t.Setenv("VUKA_RECONCILIATION_RPC_URL", "http://rpc")
	t.Setenv("VUKA_RECONCILIATION_CONTRACT", "0xcontract")
	t.Setenv("VUKA_RECONCILIATION_LAG_WARNING_BLOCKS", "25")
	t.Setenv("VUKA_RECONCILIATION_LAG_CRITICAL_BLOCKS", "100")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.ReconciliationLagWarning != 25 || cfg.ReconciliationLagCritical != 100 {
		t.Fatalf("unexpected thresholds: warning=%d critical=%d", cfg.ReconciliationLagWarning, cfg.ReconciliationLagCritical)
	}
}

func TestReconciliationLagThresholdsMustBeOrdered(t *testing.T) {
	t.Setenv("VUKA_RECONCILIATION_ENABLED", "true")
	t.Setenv("VUKA_RECONCILIATION_RPC_URL", "http://rpc")
	t.Setenv("VUKA_RECONCILIATION_CONTRACT", "0xcontract")
	t.Setenv("VUKA_RECONCILIATION_LAG_WARNING_BLOCKS", "100")
	t.Setenv("VUKA_RECONCILIATION_LAG_CRITICAL_BLOCKS", "100")
	if _, err := Load(); err == nil {
		t.Fatal("expected invalid threshold ordering error")
	}
}

func TestProductionRequiresProtectedReadOnlyMode(t *testing.T) {
	t.Setenv("VUKA_ENV", "production")
	t.Setenv("VUKA_OPERATOR_EMAIL", "operator@example.com")
	t.Setenv("VUKA_OPERATOR_PASSWORD", "a-production-password")
	t.Setenv("VUKA_CORS_ORIGINS", "https://console.example.com")
	t.Setenv("VUKA_READ_ONLY", "false")
	t.Setenv("MTN_SIM_MODE", "")
	t.Setenv("MTN_SIM_FAIL_RATE", "0")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if err := cfg.Validate(); err == nil {
		t.Fatal("expected production read-only validation error")
	}
}

func TestProductionAcceptsProtectedReadOnlyMode(t *testing.T) {
	t.Setenv("VUKA_ENV", "production")
	t.Setenv("VUKA_OPERATOR_EMAIL", "operator@example.com")
	t.Setenv("VUKA_OPERATOR_PASSWORD", "a-production-password")
	t.Setenv("VUKA_CORS_ORIGINS", "https://console.example.com")
	t.Setenv("VUKA_READ_ONLY", "true")
	t.Setenv("MTN_SIM_MODE", "")
	t.Setenv("MTN_SIM_FAIL_RATE", "0")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if err := cfg.Validate(); err != nil {
		t.Fatal(err)
	}
}
