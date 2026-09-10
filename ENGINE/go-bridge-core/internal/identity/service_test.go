package identity

import "testing"

func TestComplianceTransitions(t *testing.T) {
	valid := [][2]string{
		{StatusPending, StatusApproved},
		{StatusPending, StatusRejected},
		{StatusPending, StatusNeedsInformation},
		{StatusApproved, StatusSuspended},
		{StatusNeedsInformation, StatusPending},
		{StatusRejected, StatusPending},
		{StatusSuspended, StatusApproved},
	}
	for _, pair := range valid {
		if !allowedTransition(pair[0], pair[1]) {
			t.Errorf("transition %s -> %s should be allowed", pair[0], pair[1])
		}
	}
	for _, pair := range [][2]string{
		{StatusApproved, StatusRejected},
		{StatusRejected, StatusApproved},
		{StatusPending, StatusPending},
	} {
		if allowedTransition(pair[0], pair[1]) {
			t.Errorf("transition %s -> %s should be rejected", pair[0], pair[1])
		}
	}
}

func TestStatusAndSeverityValidation(t *testing.T) {
	for _, status := range []string{StatusPending, StatusApproved, StatusRejected, StatusSuspended, StatusNeedsInformation} {
		if !validStatus(status) {
			t.Errorf("status %q should be valid", status)
		}
	}
	for _, severity := range []string{"low", "medium", "high", "critical"} {
		if !validSeverity(severity) {
			t.Errorf("severity %q should be valid", severity)
		}
	}
	if validStatus("approved ") || validSeverity("urgent") {
		t.Fatal("invalid workflow values accepted")
	}
}
