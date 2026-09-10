package identity

import (
	"testing"
	"time"
)

func TestMetadataReferencePolicyRejectsDocumentBytes(t *testing.T) {
	if MetadataReferenceAllowed("data:application/pdf;base64,abc", "document") {
		t.Fatal("document bytes must not be accepted")
	}
	if !MetadataReferenceAllowed("synthetic://business/0001", "registry label") {
		t.Fatal("synthetic metadata reference should be accepted")
	}
}

func TestRetentionPolicyIsConservativeAndDoesNotDeleteHistory(t *testing.T) {
	if err := DefaultRetentionPolicy.Validate(); err != nil {
		t.Fatal(err)
	}
	if !MetadataDeletionEligible(time.Now().UTC().Add(-400*24*time.Hour), time.Now().UTC(), DefaultRetentionPolicy) {
		t.Fatal("expected old metadata to be eligible")
	}
	if MetadataDeletionEligible(time.Now().UTC(), time.Now().UTC(), DefaultRetentionPolicy) {
		t.Fatal("new metadata must not be eligible")
	}
}
