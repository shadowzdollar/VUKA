package risk

import (
	"context"
	"testing"
)

func TestEvaluateTiers(t *testing.T) {
	table := DefaultLimits()
	cases := []struct {
		name   string
		status string
		amount float64
		used   Usage
		want   string // "" = allowed
	}{
		{"pending small ok", StatusPending, 150, Usage{}, ""},
		{"pending over per-txn", StatusPending, 250, Usage{}, "kyc_limit_exceeded"},
		{"pending daily exceeded", StatusPending, 150, Usage{Day: 400}, "kyc_limit_exceeded"},
		{"pending monthly exceeded", StatusPending, 150, Usage{Day: 0, Month: 1_900}, "kyc_limit_exceeded"},
		{"verified mid ok", StatusVerified, 1_900, Usage{Day: 2_000}, ""},
		{"business large ok", StatusBusinessVerified, 9_500, Usage{}, ""},
		{"business over per-txn", StatusBusinessVerified, 10_001, Usage{}, "kyc_limit_exceeded"},
		{"rejected blocked", StatusRejected, 1, Usage{}, "kyc_not_permitted"},
		{"suspended blocked", StatusSuspended, 1, Usage{}, "kyc_not_permitted"},
		{"unknown status blocked", "WHATEVER", 1, Usage{}, "kyc_not_permitted"},
		{"case-insensitive status", "verified", 100, Usage{}, ""},
	}
	for _, c := range cases {
		d := Evaluate(c.status, c.amount, c.used, table)
		if c.want == "" && !d.Allowed {
			t.Errorf("%s: blocked (%s: %s)", c.name, d.Code, d.Message)
		}
		if c.want != "" && (d.Allowed || d.Code != c.want) {
			t.Errorf("%s: got allowed=%v code=%q, want %q", c.name, d.Allowed, d.Code, c.want)
		}
	}
}

func TestBoundaryIsInclusive(t *testing.T) {
	if d := Evaluate(StatusPending, 200, Usage{}, DefaultLimits()); !d.Allowed {
		t.Fatalf("exactly the per-txn limit must be allowed: %+v", d)
	}
	if d := Evaluate(StatusPending, 200, Usage{Day: 300}, DefaultLimits()); !d.Allowed {
		t.Fatalf("exactly the daily limit must be allowed: %+v", d)
	}
}

func TestSandboxScreener(t *testing.T) {
	s := SandboxScreener{Deny: []string{"Blocked Trading"}, Review: []string{"Politically"}}
	for name, want := range map[string]string{
		"Acme Blocked Trading Ltd": ScreenHit,
		"Politically Exposed Jo":   ScreenReview,
		"Amina Uwera":              ScreenClear,
	} {
		r, err := s.Screen(context.Background(), Subject{FullName: name})
		if err != nil || r.Status != want {
			t.Errorf("%q => %+v %v, want %s", name, r, err, want)
		}
	}
}
