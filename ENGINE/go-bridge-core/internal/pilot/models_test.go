package pilot

import (
	"errors"
	"testing"
	"time"
)

func TestCreateValidationIsSandboxOnlyAndMultiParty(t *testing.T) {
	req := CreateRequest{PilotID: "p-1", CorridorID: "rw-rwf-ke-kes", ProviderID: "mpesa-ke",
		Environment: "production", Scope: "synthetic", MaxParticipants: 2,
		AmountLimitMinor: 100, TransactionLimitMinor: 10, DailyLimitMinor: 100,
		StartAt: time.Now(), EndAt: time.Now().Add(time.Hour), Owner: "owner",
		SupportOwner: "support", IncidentOwner: "incident", RequiredApprovals: 1}
	if !errors.Is(req.Validate(), ErrInvalid) {
		t.Fatal("production or single-approval pilot must fail closed")
	}
}

func TestParticipantValidationRequiresConsentAndOneSubject(t *testing.T) {
	req := ParticipantRequest{OrganizationID: "org", UserID: "user", Consent: true, TermsVersion: "v1"}
	if !errors.Is(req.Validate(), ErrInvalid) {
		t.Fatal("both organization and user must be rejected")
	}
	req.UserID = ""
	req.Consent = false
	if !errors.Is(req.Validate(), ErrInvalid) {
		t.Fatal("missing consent must be rejected")
	}
}
