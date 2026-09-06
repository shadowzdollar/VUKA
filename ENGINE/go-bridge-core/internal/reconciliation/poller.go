package reconciliation

import (
	"context"
	"fmt"
	"sync/atomic"
	"time"
)

// Poller reads only blocks older than confirmationDepth. This protects the
// derived database state from short reorgs before events become authoritative.
type Poller struct {
	rpc               *rpcClient
	repository        *Repository
	chainID           int64
	contractAddress   string
	confirmationDepth int64
	maxBlockRange     int64
	metrics           pollMetrics
}

func NewPoller(rpcURL string, repository *Repository, chainID int64, contractAddress string, confirmationDepth int64) (*Poller, error) {
	if rpcURL == "" || repository == nil || chainID <= 0 || contractAddress == "" || confirmationDepth < 0 {
		return nil, fmt.Errorf("reconciliation: invalid poller configuration")
	}
	return &Poller{
		rpc: newRPCClient(rpcURL), repository: repository, chainID: chainID,
		contractAddress: contractAddress, confirmationDepth: confirmationDepth,
		// Polygon Amoy free-tier RPC providers commonly cap eth_getLogs
		// requests at ten blocks. Operators can raise this for a provider
		// with a larger advertised range.
		maxBlockRange: 10,
	}, nil
}

func (p *Poller) SetMaxBlockRange(maxBlockRange int64) error {
	if maxBlockRange <= 0 {
		return fmt.Errorf("reconciliation: max block range must be positive")
	}
	p.maxBlockRange = maxBlockRange
	return nil
}

type Metrics struct {
	Polls           uint64
	SuccessfulPolls uint64
	EventsApplied   uint64
	Errors          uint64
}

type pollMetrics struct {
	polls, successfulPolls, eventsApplied, errors atomic.Uint64
}

func (p *Poller) Metrics() Metrics {
	return Metrics{
		Polls: p.metrics.polls.Load(), SuccessfulPolls: p.metrics.successfulPolls.Load(),
		EventsApplied: p.metrics.eventsApplied.Load(), Errors: p.metrics.errors.Load(),
	}
}

func (p *Poller) LatestBlock(ctx context.Context) (int64, error) {
	if p == nil || p.rpc == nil {
		return 0, fmt.Errorf("reconciliation: poller is not configured")
	}
	return p.rpc.latestBlock(ctx)
}

func (p *Poller) ConfirmationDepth() int64 {
	if p == nil {
		return 0
	}
	return p.confirmationDepth
}

// PollRange fetches and applies finalized logs in [fromBlock, finalizedBlock].
// It returns the number of newly persisted events.
func (p *Poller) PollRange(ctx context.Context, fromBlock int64) (int, error) {
	p.metrics.polls.Add(1)
	defer func() {
		if r := recover(); r != nil {
			p.metrics.errors.Add(1)
			panic(r)
		}
	}()
	if fromBlock < 0 {
		p.metrics.errors.Add(1)
		return 0, fmt.Errorf("reconciliation: invalid from block")
	}
	latest, err := p.rpc.latestBlock(ctx)
	if err != nil {
		p.metrics.errors.Add(1)
		return 0, err
	}
	finalized := latest - p.confirmationDepth
	if p.maxBlockRange > 0 && finalized >= fromBlock+p.maxBlockRange {
		finalized = fromBlock + p.maxBlockRange - 1
	}
	if finalized < fromBlock {
		p.metrics.successfulPolls.Add(1)
		return 0, nil
	}
	logs, err := p.rpc.logs(ctx, p.contractAddress, fromBlock, finalized)
	if err != nil {
		p.metrics.errors.Add(1)
		return 0, err
	}
	events := make([]ChainEvent, 0, len(logs))
	for _, log := range logs {
		event, err := decodeLog(p.chainID, p.contractAddress, log)
		if err != nil {
			p.metrics.errors.Add(1)
			return 0, err
		}
		events = append(events, event)
	}
	if len(events) == 0 {
		if err := p.repository.AdvanceCursor(ctx, p.chainID, p.contractAddress, finalized+1); err != nil {
			p.metrics.errors.Add(1)
			return 0, err
		}
		p.metrics.successfulPolls.Add(1)
		return 0, nil
	}
	applied, err := p.repository.ApplyEventsAndAdvance(ctx, events, finalized+1)
	if err != nil {
		p.metrics.errors.Add(1)
		return 0, err
	}
	p.metrics.eventsApplied.Add(uint64(applied))
	p.metrics.successfulPolls.Add(1)
	return applied, nil
}

// PollOnce resumes from the durable cursor and advances it only after the
// finalized batch has been applied successfully.
func (p *Poller) PollOnce(ctx context.Context) (int, error) {
	fromBlock, err := p.repository.Cursor(ctx, p.chainID, p.contractAddress)
	if err != nil {
		return 0, err
	}
	return p.PollRange(ctx, fromBlock)
}

// Run polls until ctx is cancelled. A poll error is returned so the supervisor
// can apply its own retry and alert policy without silently losing failures.
func (p *Poller) Run(ctx context.Context, interval time.Duration) error {
	if interval <= 0 {
		return fmt.Errorf("reconciliation: poll interval must be positive")
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		if _, err := p.PollOnce(ctx); err != nil {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			return err
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}
