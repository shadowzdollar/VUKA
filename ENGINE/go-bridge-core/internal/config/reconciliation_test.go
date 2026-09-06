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
