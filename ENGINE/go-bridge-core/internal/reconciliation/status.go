package reconciliation

import "context"

type Status struct {
	Metrics        Metrics `json:"metrics"`
	Cursor         int64   `json:"cursor"`
	LatestBlock    int64   `json:"latest_block"`
	FinalizedBlock int64   `json:"finalized_block"`
	LagBlocks      int64   `json:"lag_blocks"`
}

func (r *Repository) Status(ctx context.Context, chainID int64, contractAddress string, poller *Poller) (Status, error) {
	cursor, err := r.Cursor(ctx, chainID, contractAddress)
	if err != nil {
		return Status{}, err
	}
	latest, err := poller.LatestBlock(ctx)
	if err != nil {
		return Status{}, err
	}
	finalized := latest - poller.ConfirmationDepth()
	lag := finalized + 1 - cursor
	if lag < 0 {
		lag = 0
	}
	return Status{
		Metrics: poller.Metrics(), Cursor: cursor, LatestBlock: latest,
		FinalizedBlock: finalized, LagBlocks: lag,
	}, nil
}
