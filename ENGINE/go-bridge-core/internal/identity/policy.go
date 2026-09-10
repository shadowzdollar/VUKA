package identity

import (
	"fmt"
	"strings"
	"time"
)

// RetentionPolicy is an engineering default pending formal legal approval.
// It controls metadata eligibility and never authorizes deletion of decision
// or audit history.
type RetentionPolicy struct {
	VerificationMetadataDays int
	ActivityReadWindowDays   int
}

var DefaultRetentionPolicy = RetentionPolicy{
	VerificationMetadataDays: 365,
	ActivityReadWindowDays:   0,
}

func (p RetentionPolicy) Validate() error {
	if p.VerificationMetadataDays < 30 || p.VerificationMetadataDays > 3650 ||
		p.ActivityReadWindowDays < 0 || p.ActivityReadWindowDays > 3650 {
		return fmt.Errorf("identity: conservative retention bounds are invalid")
	}
	return nil
}

func MetadataReferenceAllowed(reference, label string) bool {
	reference = strings.TrimSpace(reference)
	label = strings.TrimSpace(label)
	if reference == "" || len(reference) > 160 || len(label) > 160 {
		return false
	}
	lower := strings.ToLower(reference)
	for _, prefix := range []string{"synthetic://", "registry://", "provider://", "case://", "hash:"} {
		if strings.HasPrefix(lower, prefix) {
			return !strings.Contains(lower, "data:") && !strings.Contains(lower, "base64")
		}
	}
	return false
}

func MetadataDeletionEligible(createdAt, now time.Time, policy RetentionPolicy) bool {
	if policy.Validate() != nil {
		return false
	}
	return !now.Before(createdAt.Add(time.Duration(policy.VerificationMetadataDays) * 24 * time.Hour))
}
