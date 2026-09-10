package providerexec

import (
	"context"
	"errors"
	"testing"
	"time"

	"vuka/go-bridge-core/internal/adapters"
)

func testService(mode string) *Service {
	registry := adapters.NewRegistry()
	registry.Register(adapters.NewMTNAdapter(0, 0, mode, 5*time.Millisecond))
	return NewService(registry, NewMemoryStore())
}

func payoutRequest() Request {
	return Request{
		TransactionID: "tx-1", Provider: "mtn-rw", Operation: OperationPayout,
		RequestReference: "replay-1",
		Payout:           adapters.PayoutRequest{Amount: 100, Currency: "RWF", Phone: "+250000000", Reference: "replay-1"},
	}
}

func TestExecuteIdempotencyAndSuccess(t *testing.T) {
	svc := testService("success")
	first, replay, err := svc.Execute(context.Background(), payoutRequest())
	if err != nil || replay || first.State != StateSucceeded {
		t.Fatalf("first execution=%+v replay=%v err=%v", first, replay, err)
	}
	second, replay, err := svc.Execute(context.Background(), payoutRequest())
	if err != nil || !replay || second.ID != first.ID || second.Attempts != 1 {
		t.Fatalf("replay execution=%+v replay=%v err=%v", second, replay, err)
	}
}

func TestExecuteFailureAndTimeoutStates(t *testing.T) {
	failed, _, err := testService("fail").Execute(context.Background(), payoutRequest())
	if err == nil || failed.State != StateFailed {
		t.Fatalf("failed execution=%+v err=%v", failed, err)
	}
	timedOut, _, err := testService("timeout").Execute(context.Background(), payoutRequest())
	if err == nil || timedOut.State != StateTimeout {
		t.Fatalf("timeout execution=%+v err=%v", timedOut, err)
	}
}

func TestCallbackReplayAndMonotonicTransition(t *testing.T) {
	svc := testService("success")
	execution, _, err := svc.Execute(context.Background(), payoutRequest())
	if err != nil {
		t.Fatal(err)
	}
	event := Event{Provider: "mtn-rw", ReplayKey: "evt-1", TransactionID: "tx-1",
		State: StateSucceeded, ExternalReference: "ext-1", RawPayload: `{"status":"SUCCEEDED"}`}
	first, replay, err := svc.IngestEvent(context.Background(), event)
	if err != nil || replay || first.ReplayKey != "evt-1" {
		t.Fatalf("callback=%+v replay=%v err=%v", first, replay, err)
	}
	_, replay, err = svc.IngestEvent(context.Background(), event)
	if err != nil || !replay {
		t.Fatalf("callback replay=%v err=%v", replay, err)
	}
	got, err := svc.Get(context.Background(), execution.ID)
	if err != nil || got.State != StateSucceeded || got.ExternalReference != "ext-1" {
		t.Fatalf("execution after callback=%+v err=%v", got, err)
	}
	_, _, _ = svc.IngestEvent(context.Background(), Event{
		Provider: "mtn-rw", ReplayKey: "evt-2", TransactionID: "tx-1", State: StateFailed,
	})
	got, _ = svc.Get(context.Background(), execution.ID)
	if got.State != StateSucceeded {
		t.Fatalf("late failed callback regressed terminal state to %s", got.State)
	}
}

func TestMissingProviderFailsClosed(t *testing.T) {
	svc := NewService(adapters.NewRegistry(), NewMemoryStore())
	execution, _, err := svc.Execute(context.Background(), payoutRequest())
	if !errors.Is(err, ErrProviderUnavailable) || execution.State != StateFailed {
		t.Fatalf("missing provider execution=%+v err=%v", execution, err)
	}
}

func TestDecodeCallbackNormalizesProviderEnvelope(t *testing.T) {
	event, err := DecodeCallback("mtn-rw", []byte(`{"event_id":"e1","transaction_id":"tx-1","provider_reference":"ext","status":"succeeded"}`), "replay")
	if err != nil || event.ExternalReference != "ext" || event.State != "SUCCEEDED" {
		t.Fatalf("decoded event=%+v err=%v", event, err)
	}
}
