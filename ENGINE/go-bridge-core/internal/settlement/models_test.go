package settlement

import (
	"errors"
	"testing"
)

func TestRequestValidationRejectsUnsafeShape(t *testing.T) {
	req := Request{Action: ActionPayout, Target: "merchant-1", ProviderID: "mtn-rw", CorridorID: "rw-rwf-ke-kes", AmountMinor: 0, Currency: "RWF", Reason: "test", IdempotencyKey: "one"}
	if !errors.Is(req.Validate(), ErrInvalid) {
		t.Fatal("expected non-positive amount to fail closed")
	}
	req.AmountMinor = 100
	req.Currency = "R"
	if !errors.Is(req.Validate(), ErrInvalid) {
		t.Fatal("expected malformed currency to fail closed")
	}
}

func TestDefaultPolicyIsDryRunAndKillSwitched(t *testing.T) {
	policy := DefaultPolicy()
	if !policy.GlobalKillSwitch || policy.ExecutionEnabled {
		t.Fatalf("unsafe settlement defaults: %+v", policy)
	}
	if policy.RequiredApprovals < 2 {
		t.Fatalf("role separation requires at least two approvals: %+v", policy)
	}
}
