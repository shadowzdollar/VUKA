package adapters

import (
	"context"
	"fmt"
	"math/rand"
	"time"
)

// SandboxRail is a generic simulated mobile-money / bank rail. One instance is
// registered per provider in the pan-African catalog (MTN, M-Pesa, Airtel,
// Orange, Telebirr, NIBSS, ...). It performs no network I/O: it models latency,
// success, provider rejection and timeout so the whole collect -> ledger ->
// payout state machine can be exercised end to end before real credentials
// exist. Real integrations replace it behind the same ProviderAdapter contract.
type SandboxRail struct {
	ID       string
	Label    string
	Prefix   string
	Delay    time.Duration
	FailRate float64
	Mode     string // "success", "fail", "timeout" or "" (random per FailRate)
	Timeout  time.Duration
}

// NewSandboxRail builds a simulated rail registered under id.
func NewSandboxRail(id, label, prefix string, delay time.Duration, failRate float64, mode string, timeout time.Duration) *SandboxRail {
	return &SandboxRail{ID: id, Label: label, Prefix: prefix, Delay: delay, FailRate: failRate, Mode: mode, Timeout: timeout}
}

func (r *SandboxRail) Name() string            { return r.ID }
func (r *SandboxRail) ContractVersion() string { return ContractVersion }
func (r *SandboxRail) Environment() string     { return "simulated" }

func (r *SandboxRail) ValidateConfig() error {
	if r.ID == "" || r.Delay < 0 || r.Timeout <= 0 || r.FailRate < 0 || r.FailRate > 1 {
		return fmt.Errorf("%s: invalid sandbox rail configuration", r.ID)
	}
	switch r.Mode {
	case "", "success", "fail", "timeout":
		return nil
	}
	return fmt.Errorf("%s: unsupported simulation mode %q", r.ID, r.Mode)
}

func (r *SandboxRail) outcome() string {
	switch r.Mode {
	case "success", "fail", "timeout":
		return r.Mode
	}
	// #nosec G404 -- sandbox failure-rate jitter, not security-sensitive
	if r.FailRate > 0 && rand.Float64() < r.FailRate {
		return "fail"
	}
	return "success"
}

func (r *SandboxRail) ref(reference string, amount float64) string {
	now := time.Now()
	if reference == "" {
		return fmt.Sprintf("%s-%d-%06x", r.Prefix, now.UnixNano(), rand.Uint32()&0xffffff) // #nosec G404 -- human-readable reference suffix, not a security token
	}
	seed := uint32(0)
	for i := 0; i < len(reference); i++ {
		seed = seed*31 + uint32(reference[i])
	}
	seed ^= uint32(amount * 100)
	return fmt.Sprintf("%s-%d-%06x", r.Prefix, now.Unix(), seed&0xffffff)
}

func (r *SandboxRail) Payout(ctx context.Context, req PayoutRequest) (*PayoutResult, error) {
	if err := SleepCtx(ctx, r.Delay); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrPayoutTimeout, err)
	}
	switch r.outcome() {
	case "timeout":
		if err := SleepCtx(ctx, r.Timeout); err != nil {
			return nil, fmt.Errorf("%w: %v", ErrPayoutTimeout, err)
		}
		return nil, fmt.Errorf("%w: %s did not respond within %s", ErrPayoutTimeout, r.Label, r.Timeout)
	case "fail":
		return nil, fmt.Errorf("%w: %s rejected payout for %s", ErrPayoutFailed, r.Label, req.Phone)
	}
	ref := r.ref(req.Reference, req.Amount)
	return &PayoutResult{ExternalRef: ref, Raw: fmt.Sprintf(`{"status":"SUCCESS","external_ref":%q}`, ref)}, nil
}

func (r *SandboxRail) Collection(ctx context.Context, req CollectionRequest) (*CollectionResult, error) {
	if err := SleepCtx(ctx, r.Delay); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCollectionTimeout, err)
	}
	switch r.outcome() {
	case "timeout":
		if err := SleepCtx(ctx, r.Timeout); err != nil {
			return nil, fmt.Errorf("%w: %v", ErrCollectionTimeout, err)
		}
		return nil, fmt.Errorf("%w: %s did not respond within %s", ErrCollectionTimeout, r.Label, r.Timeout)
	case "fail":
		return nil, fmt.Errorf("%w: %s rejected collection for %s", ErrCollectionFailed, r.Label, req.Phone)
	}
	ref := r.ref(req.Reference, req.Amount)
	return &CollectionResult{ExternalRef: ref, Raw: fmt.Sprintf(`{"status":"SUCCESS","external_ref":%q}`, ref)}, nil
}

func (r *SandboxRail) Collect(ctx context.Context, req CollectionRequest) (*CollectionResult, error) {
	return r.Collection(ctx, req)
}
