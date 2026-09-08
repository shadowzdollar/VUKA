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

func TestFinalizedBlockRespectsConfirmationDepth(t *testing.T) {
	tests := []struct {
		latest, depth, want int64
	}{
		{latest: 500, depth: 128, want: 372},
		{latest: 10, depth: 10, want: 0},
		{latest: 10, depth: 11, want: -1},
	}
	for _, tt := range tests {
		if got := finalizedBlock(tt.latest, tt.depth); got != tt.want {
			t.Errorf("finalizedBlock(%d, %d) = %d, want %d",
				tt.latest, tt.depth, got, tt.want)
		}
	}
}

func TestFinalizedBlockRejectsInvalidInputs(t *testing.T) {
	if got := finalizedBlock(-1, 0); got != -1 {
		t.Fatalf("negative latest = %d, want -1", got)
	}
	if got := finalizedBlock(10, -1); got != -1 {
		t.Fatalf("negative confirmation depth = %d, want -1", got)
	}
}
