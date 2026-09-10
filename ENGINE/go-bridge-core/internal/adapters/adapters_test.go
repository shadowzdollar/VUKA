package adapters_test

import (
	"context"
	"testing"
	"time"

	"vuka/go-bridge-core/internal/adapters"
)

func TestMTNAdapter_Success(t *testing.T) {
	a := adapters.NewMTNAdapter(0, 0, "success", 5*time.Second)
	res, err := a.Payout(context.Background(), adapters.PayoutRequest{
		Amount:    1000,
		Currency:  "RWF",
		Phone:     "+250****0001",
		Reference: "tx-1",
	})
	if err != nil {
		t.Fatalf("Payout: %v", err)
	}
	if res.ExternalRef == "" {
		t.Error("expected an external reference")
	}
	// Deterministic reference: same input -> same ref.
	res2, err := a.Payout(context.Background(), adapters.PayoutRequest{
		Amount: 1000, Currency: "RWF", Phone: "+250****0001", Reference: "tx-1",
	})
	if err != nil {
		t.Fatalf("second Payout: %v", err)
	}
	if res2.ExternalRef != res.ExternalRef {
		t.Errorf("reference not deterministic: %q vs %q", res.ExternalRef, res2.ExternalRef)
	}
}

func TestMTNAdapter_Rejected(t *testing.T) {
	a := adapters.NewMTNAdapter(0, 0, "fail", 5*time.Second)
	_, err := a.Payout(context.Background(), adapters.PayoutRequest{
		Amount: 1000, Currency: "RWF", Phone: "+250****0001", Reference: "tx-2",
	})
	if err == nil {
		t.Fatal("expected rejection error")
	}
	if got := a.Name(); got != "mtn-rw" {
		t.Errorf("Name = %q, want mtn-rw", got)
	}
}

func TestMTNAdapter_FailRate(t *testing.T) {
	// failRate=1 -> always fail.
	a := adapters.NewMTNAdapter(0, 1, "", 5*time.Second)
	for i := 0; i < 5; i++ {
		_, err := a.Payout(context.Background(), adapters.PayoutRequest{
			Amount: 1000, Currency: "RWF", Phone: "+250****0001", Reference: "tx-f",
		})
		if err == nil {
			t.Fatal("expected failure with failRate=1")
		}
	}
}

func TestMTNAdapter_Timeout(t *testing.T) {
	// Mode "timeout": the rail sleeps past its window and returns
	// ErrPayoutTimeout instead of answering.
	a := adapters.NewMTNAdapter(0, 0, "timeout", 50*time.Millisecond)
	_, err := a.Payout(context.Background(), adapters.PayoutRequest{
		Amount: 1000, Currency: "RWF", Phone: "+250****0001", Reference: "tx-4",
	})
	if err == nil {
		t.Fatal("expected timeout error")
	}
}

func TestRegistry_RegisterAndResolve(t *testing.T) {
	reg := adapters.NewRegistry()
	if n := reg.Names(); len(n) != 0 {
		t.Errorf("expected empty registry, got %v", n)
	}
	a := adapters.NewMTNAdapter(0, 0, "success", 5*time.Second)
	reg.Register(a)
	if got := reg.Get("mtn-rw"); got == nil {
		t.Fatal("expected mtn-rw in registry")
	}
	if got := reg.Get("safaricom-ke"); got != nil {
		t.Fatal("did not expect safaricom-ke")
	}
}

func TestSandboxAdaptersExposeVersionedContract(t *testing.T) {
	var mtn adapters.VersionedAdapter = adapters.NewMTNAdapter(0, 0, "success", time.Second)
	if mtn.ContractVersion() != adapters.ContractVersion || mtn.Environment() != "simulated" {
		t.Fatalf("unexpected MTN contract: version=%q environment=%q", mtn.ContractVersion(), mtn.Environment())
	}
	if err := mtn.ValidateConfig(); err != nil {
		t.Fatalf("MTN ValidateConfig: %v", err)
	}
	var mpesa adapters.VersionedAdapter = adapters.NewMpesaAdapter(0, 0, "success", time.Second)
	if err := mpesa.ValidateConfig(); err != nil {
		t.Fatalf("M-Pesa ValidateConfig: %v", err)
	}
}

func TestMpesaAdapter_Success(t *testing.T) {
	a := adapters.NewMpesaAdapter(0, 0, "success", 5*time.Second)
	res, err := a.Payout(context.Background(), adapters.PayoutRequest{
		Amount: 40000, Currency: "KES", Phone: "+254****0001", Reference: "cb-1",
	})
	if err != nil {
		t.Fatalf("Payout: %v", err)
	}
	if res.ExternalRef == "" {
		t.Error("expected an external reference")
	}
	if got := a.Name(); got != "mpesa-ke" {
		t.Errorf("Name = %q, want mpesa-ke", got)
	}
	// Deterministic reference for retries.
	res2, _ := a.Payout(context.Background(), adapters.PayoutRequest{
		Amount: 40000, Currency: "KES", Phone: "+254****0001", Reference: "cb-1",
	})
	if res2.ExternalRef != res.ExternalRef {
		t.Errorf("reference not deterministic: %q vs %q", res.ExternalRef, res2.ExternalRef)
	}
	// Reference prefix marks the Kenya rail.
	if len(res.ExternalRef) < 6 || res.ExternalRef[:6] != "MPESA-" {
		t.Errorf("expected MPESA- prefix, got %q", res.ExternalRef)
	}
}

func TestMpesaAdapter_Rejected(t *testing.T) {
	a := adapters.NewMpesaAdapter(0, 0, "fail", 5*time.Second)
	_, err := a.Payout(context.Background(), adapters.PayoutRequest{
		Amount: 40000, Currency: "KES", Phone: "+254****0001", Reference: "cb-2",
	})
	if err == nil {
		t.Fatal("expected rejection error")
	}
}

func TestMpesaAdapter_Timeout(t *testing.T) {
	a := adapters.NewMpesaAdapter(0, 0, "timeout", 50*time.Millisecond)
	_, err := a.Payout(context.Background(), adapters.PayoutRequest{
		Amount: 40000, Currency: "KES", Phone: "+254****0001", Reference: "cb-3",
	})
	if err == nil {
		t.Fatal("expected timeout error")
	}
}

func TestNormalizedCollectionContract(t *testing.T) {
	var a adapters.TransactionAdapter = adapters.NewMTNAdapter(0, 0, "success", time.Second)
	result, err := a.Collection(context.Background(), adapters.CollectionRequest{
		Amount: 100, Currency: "RWF", Phone: "+250****0001", Reference: "collect-1",
	})
	if err != nil {
		t.Fatalf("Collection: %v", err)
	}
	if result.ExternalRef == "" {
		t.Fatal("expected collection external reference")
	}
}
