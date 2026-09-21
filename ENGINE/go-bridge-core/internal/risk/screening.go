package risk

import (
	"context"
	"strings"
)

// Screening outcomes.
const (
	ScreenClear  = "CLEAR"
	ScreenReview = "REVIEW"
	ScreenHit    = "HIT"
)

// Subject is what is screened. Only the minimum needed to match a list entry is sent.
type Subject struct {
	FullName string
	Country  string
	Phone    string
}

// ScreenResult is the screening outcome plus a reference for the audit trail.
type ScreenResult struct {
	Status    string `json:"status"`
	Reference string `json:"reference,omitempty"`
	Provider  string `json:"provider"`
}

// Screener checks a party against sanctions / PEP / adverse-media lists. The
// production implementation calls a licensed screening vendor (credential:
// env://VUKA_SANCTIONS_API_KEY); until it exists the engine runs the sandbox
// screener below. Fail-closed contract: an error from Screen must block the
// payment, never be treated as CLEAR.
type Screener interface {
	Screen(ctx context.Context, s Subject) (ScreenResult, error)
}

// SandboxScreener matches names against a configured test list so the
// blocking paths can be exercised without a vendor. It is NOT a sanctions
// control and says so in every result it returns.
type SandboxScreener struct {
	Deny   []string // case-insensitive substrings => HIT
	Review []string // case-insensitive substrings => REVIEW
}

func (s SandboxScreener) Screen(_ context.Context, sub Subject) (ScreenResult, error) {
	name := strings.ToLower(sub.FullName)
	for _, d := range s.Deny {
		if d = strings.ToLower(strings.TrimSpace(d)); d != "" && strings.Contains(name, d) {
			return ScreenResult{Status: ScreenHit, Provider: "sandbox-screener", Reference: "sandbox:" + d}, nil
		}
	}
	for _, r := range s.Review {
		if r = strings.ToLower(strings.TrimSpace(r)); r != "" && strings.Contains(name, r) {
			return ScreenResult{Status: ScreenReview, Provider: "sandbox-screener", Reference: "sandbox:" + r}, nil
		}
	}
	return ScreenResult{Status: ScreenClear, Provider: "sandbox-screener"}, nil
}
