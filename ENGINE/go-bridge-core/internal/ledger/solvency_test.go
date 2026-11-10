package ledger_test

import (
	"context"
	"testing"

	"vuka/go-bridge-core/internal/ledger"
)

func TestVerifySolvency_EmptyLedger_Balanced(t *testing.T) {
	ctx := context.Background()
	svc, _ := newService(t)

	att, err := svc.VerifySolvency(ctx)
	if err != nil {
		t.Fatalf("VerifySolvency failed: %v", err)
	}

	if !att.GlobalBalanced {
		t.Errorf("expected empty ledger to be globally balanced")
	}

	if att.AuditHash == "" {
		t.Errorf("expected non-empty audit hash")
	}
}

func TestVerifySolvency_AfterTransfers_RemainsBalanced(t *testing.T) {
	ctx := context.Background()
	svc, _ := newService(t)

	// Ensure currency settlement accounts exist
	if err := svc.EnsureSettlementAccounts(ctx, "RWF", "KES"); err != nil {
		t.Fatalf("EnsureSettlementAccounts failed: %v", err)
	}

	// Create two users
	_, _, bizA := createTrader(t, svc, "Trader A", "+250788000001")
	_, _, bizB := createTrader(t, svc, "Trader B", "+250788000002")

	// Fund Trader A business account with 100,000 RWF
	fund(t, svc, bizA.ID, 100000)

	// Transfer 30,000 RWF from A to B
	_, _, err := svc.Transfer(ctx, "tx-solvency-test-01", ledger.TransferRequest{
		SourceAccountID:      bizA.ID,
		DestinationAccountID: bizB.ID,
		Amount:               30000,
		Currency:             "RWF",
	})
	if err != nil {
		t.Fatalf("Transfer: %v", err)
	}

	att, err := svc.VerifySolvency(ctx)
	if err != nil {
		t.Fatalf("VerifySolvency: %v", err)
	}

	if !att.GlobalBalanced {
		t.Errorf("expected ledger to be globally balanced, reports: %+v", att.Currencies)
	}

	var rwfReport *ledger.SolvencyCurrencyReport
	for _, c := range att.Currencies {
		if c.Currency == "RWF" {
			rwfReport = &c
			break
		}
	}

	if rwfReport == nil {
		t.Fatalf("expected RWF currency report in solvency attestation")
	}

	if !rwfReport.Balanced {
		t.Errorf("expected RWF to be balanced, got net sum %.4f", rwfReport.NetSum)
	}

	if rwfReport.EntryCount == 0 {
		t.Errorf("expected positive ledger entry count")
	}
}
