package transactionworkflow

import (
	"context"
	"errors"
	"testing"
	"time"

	"vuka/go-bridge-core/internal/adapters"
	"vuka/go-bridge-core/internal/providerexec"
	"vuka/go-bridge-core/internal/providers"
)

type fakePoster struct {
	calls int
	err   error
}

type fakeCollector struct {
	calls int
	err   error
}

func (p *fakeCollector) FundCollectedAccount(_ context.Context, _ string, _ string, _ float64, _, _ string) (string, error) {
	p.calls++
	if p.err != nil {
		return "", p.err
	}
	return "fund-1", nil
}

func (p *fakePoster) PostCollectedCrossBorder(_ context.Context, _ string, _, _ string, _ float64, _, _ string, _ float64, _ string) (string, error) {
	p.calls++
	if p.err != nil {
		return "", p.err
	}
	return "ledger-1", nil
}

type fakeAccounts struct{}

func (fakeAccounts) ResolveAccount(_ context.Context, id string) (string, string, bool, error) {
	if id == "source" {
		return "trader-1", "RWF", true, nil
	}
	return "trader-2", "KES", true, nil
}

// One catalog for the whole test package so quotes issued in request() verify in the service.
var testCatalog = providers.NewDefaultCatalog()

func serviceForMode(collectionMode, payoutMode string, poster LedgerPoster) *Service {
	registry := adapters.NewRegistry()
	registry.Register(adapters.NewMTNAdapter(0, 0, collectionMode, time.Millisecond))
	registry.Register(adapters.NewMpesaAdapter(0, 0, payoutMode, time.Millisecond))
	exec := providerexec.NewService(registry, providerexec.NewMemoryStore())
	return NewService(NewMemoryStore(), exec, testCatalog, fakeAccounts{}, poster, &fakeCollector{})
}

func request() Request {
	q, err := testCatalog.Quote("rw-rwf-ke-kes", 500000, time.Now().UTC())
	if err != nil {
		panic(err)
	}
	return Request{TraderID: "trader-1", SourceAccountID: "source", DestinationAccountID: "destination",
		CollectionProvider: "mtn-rw", PayoutProvider: "mpesa-ke", CollectionPhone: "+2501",
		PayoutPhone: "+2541", CorridorID: "rw-rwf-ke-kes", QuoteID: q.ID,
		Amount: 5000, CurrencyFrom: "RWF", CurrencyTo: "KES", Rate: q.Rate}
}

func TestStartCompletesAndDuplicateReplays(t *testing.T) {
	poster := &fakePoster{}
	svc := serviceForMode("success", "success", poster)
	first, replay, err := svc.Start(context.Background(), "key-1", request())
	if err != nil || replay || first.State != StateCompleted || poster.calls != 1 {
		t.Fatalf("first workflow=%+v replay=%v calls=%d err=%v", first, replay, poster.calls, err)
	}
	second, replay, err := svc.Start(context.Background(), "key-1", request())
	if err != nil || !replay || second.ID != first.ID || poster.calls != 1 {
		t.Fatalf("replay workflow=%+v replay=%v calls=%d err=%v", second, replay, poster.calls, err)
	}
	events, err := svc.Events(context.Background(), first.ID)
	if err != nil || len(events) < 6 {
		t.Fatalf("events=%d err=%v", len(events), err)
	}
}

func TestCollectionFailureDoesNotTouchLedger(t *testing.T) {
	poster := &fakePoster{}
	item, _, err := serviceForMode("fail", "success", poster).Start(context.Background(), "key-2", request())
	if err == nil || item.State != StateFailed || item.FailedStep != StepCollection || poster.calls != 0 {
		t.Fatalf("collection failure workflow=%+v calls=%d err=%v", item, poster.calls, err)
	}
}

func TestPayoutFailureRequiresReviewAndCanRetry(t *testing.T) {
	poster := &fakePoster{}
	svc := serviceForMode("success", "fail", poster)
	item, _, err := svc.Start(context.Background(), "key-3", request())
	if err == nil || !errors.Is(err, ErrRequiresReview) || item.State != StateRequiresReview || item.FailedStep != StepPayout || poster.calls != 1 {
		t.Fatalf("payout failure workflow=%+v calls=%d err=%v", item, poster.calls, err)
	}
	if _, err := svc.Retry(context.Background(), item.ID, "+2541"); !errors.Is(err, ErrRequiresReview) {
		// The deterministic failed adapter must keep the workflow review-gated.
		t.Fatalf("retry error=%v, want review error", err)
	}
}

func TestRetryEligibility(t *testing.T) {
	svc := serviceForMode("success", "success", &fakePoster{})
	item, _, err := svc.Start(context.Background(), "key-4", request())
	if err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Retry(context.Background(), item.ID, "+2541"); !errors.Is(err, ErrNotRetryable) {
		t.Fatalf("completed retry=%v, want ErrNotRetryable", err)
	}
}

func TestCallbackUpdatesPendingCollection(t *testing.T) {
	svc := serviceForMode("success", "success", &fakePoster{})
	item := Workflow{ID: "wf-callback", IdempotencyKey: "callback-key", TraderID: "trader-1",
		SourceAccountID: "source", DestinationAccountID: "destination", CorridorID: "rw-rwf-ke-kes",
		QuoteID: "fixture-rwf-kes-1", CollectionProvider: "mtn-rw", PayoutProvider: "mpesa-ke",
		Amount: 100, CurrencyFrom: "RWF", CurrencyTo: "KES", Rate: .95, State: StateCollectionPending}
	if _, _, err := svc.store.Create(context.Background(), item); err != nil {
		t.Fatal(err)
	}

	exec, _, err := svc.provider.Execute(context.Background(), executionRequest(providerRequest{
		transactionID: item.ID, provider: "mtn-rw", operation: providerexec.OperationCollection,
		reference: item.ID + ":collection", amount: item.Amount, currency: item.CurrencyFrom, phone: "+2501",
	}))
	if err != nil {
		t.Fatal(err)
	}
	if err := svc.ApplyProviderEvent(context.Background(), providerexec.Event{
		Provider: "mtn-rw", ReplayKey: "callback-1", TransactionID: item.ID,
		RequestReference: item.ID + ":collection", State: providerexec.StateSucceeded,
		ExternalReference: exec.ExternalReference,
	}); err != nil {
		t.Fatal(err)
	}
	got, err := svc.Get(context.Background(), item.ID)
	if err != nil || got.State != StateCollected || got.CollectionExecutionID != exec.ID {
		t.Fatalf("callback workflow=%+v err=%v", got, err)
	}
}

func TestLateCallbackDoesNotRegressCompletedWorkflow(t *testing.T) {
	poster := &fakePoster{}
	svc := serviceForMode("success", "success", poster)
	item, _, err := svc.Start(context.Background(), "key-late", request())
	if err != nil {
		t.Fatal(err)
	}
	if err := svc.ApplyProviderEvent(context.Background(), providerexec.Event{
		Provider: "mpesa-ke", ReplayKey: "late-failure", TransactionID: item.ID,
		State: providerexec.StateFailed,
	}); err != nil {
		t.Fatal(err)
	}
	got, _ := svc.Get(context.Background(), item.ID)
	if got.State != StateCompleted {
		t.Fatalf("late callback regressed state to %s", got.State)
	}
}
