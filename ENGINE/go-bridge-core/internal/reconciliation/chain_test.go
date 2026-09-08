package reconciliation

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRPCClientReturnsHTTPFailure(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "upstream unavailable", http.StatusBadGateway)
	}))
	defer server.Close()

	err := newRPCClient(server.URL).call(context.Background(), "eth_blockNumber", []any{}, new(string))
	if err == nil || !strings.Contains(err.Error(), "RPC HTTP status 502") {
		t.Fatalf("error = %v, want explicit HTTP status", err)
	}
}

func TestRPCClientReturnsJSONRPCFailure(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"jsonrpc":"2.0","id":1,"error":{"code":-32000,"message":"temporary failure"}}`))
	}))
	defer server.Close()

	err := newRPCClient(server.URL).call(context.Background(), "eth_getLogs", []any{}, new([]rpcLog))
	if err == nil || !strings.Contains(err.Error(), "temporary failure") {
		t.Fatalf("error = %v, want JSON-RPC failure", err)
	}
}

func TestRPCClientHonorsCancellation(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		<-r.Context().Done()
	}))
	defer server.Close()

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	err := newRPCClient(server.URL).call(ctx, "eth_blockNumber", []any{}, new(string))
	if err == nil {
		t.Fatal("expected canceled RPC request error")
	}
}

func TestValidateFinalizedBatchRejectsMixedResources(t *testing.T) {
	events := []ChainEvent{
		{ChainID: 80002, ContractAddress: "0xone"},
		{ChainID: 80002, ContractAddress: "0xtwo"},
	}
	if _, _, err := validateFinalizedBatch(events); err == nil {
		t.Fatal("expected mixed-resource batch error")
	}
}

func TestValidateFinalizedBatchRejectsUnorderedEvents(t *testing.T) {
	events := []ChainEvent{
		{ChainID: 80002, ContractAddress: "0xone", BlockNumber: 12, LogIndex: 1},
		{ChainID: 80002, ContractAddress: "0xone", BlockNumber: 12, LogIndex: 0},
	}
	if _, _, err := validateFinalizedBatch(events); err == nil {
		t.Fatal("expected unordered batch error")
	}
}

func TestValidateFinalizedBatchRejectsInvalidPosition(t *testing.T) {
	events := []ChainEvent{
		{ChainID: 80002, ContractAddress: "0xone", BlockNumber: -1, LogIndex: 0},
	}
	if _, _, err := validateFinalizedBatch(events); err == nil {
		t.Fatal("expected invalid position error")
	}
}

func TestPollRangeRecordsRPCFailure(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "upstream unavailable", http.StatusBadGateway)
	}))
	defer server.Close()

	poller, err := NewPoller(server.URL, &Repository{}, 80002, "0xescrow", 12)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := poller.PollRange(context.Background(), 0); err == nil {
		t.Fatal("expected RPC failure")
	}
	metrics := poller.Metrics()
	if metrics.Polls != 1 || metrics.Errors != 1 || metrics.SuccessfulPolls != 0 {
		t.Fatalf("metrics = %+v, want one failed poll", metrics)
	}
}
