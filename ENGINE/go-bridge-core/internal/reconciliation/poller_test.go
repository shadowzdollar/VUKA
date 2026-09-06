package reconciliation

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestPollerConfiguration(t *testing.T) {
	poller, err := NewPoller("http://rpc", &Repository{}, 80002, "0xescrow", 128)
	if err != nil {
		t.Fatal(err)
	}
	if err := poller.SetMaxBlockRange(0); err == nil {
		t.Fatal("expected invalid block range error")
	}
	if err := poller.SetMaxBlockRange(100); err != nil {
		t.Fatal(err)
	}
	if err := poller.Run(context.Background(), 0); err == nil {
		t.Fatal("expected invalid interval error")
	}
}

func TestRunStopsOnCancellation(t *testing.T) {
	poller, err := NewPoller("://invalid", &Repository{}, 80002, "0xescrow", 0)
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	err = poller.Run(ctx, time.Millisecond)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("error = %v, want context canceled", err)
	}
}
