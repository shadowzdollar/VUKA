package reconciliation

import "context"

type Status struct {
	Metrics             Metrics `json:"metrics"`
	Cursor              int64   `json:"cursor"`
	LatestBlock         int64   `json:"latest_block"`
	FinalizedBlock      int64   `json:"finalized_block"`
	LagBlocks           int64   `json:"lag_blocks"`
	WarningLag          int64   `json:"warning_lag_blocks"`
	CriticalLag         int64   `json:"critical_lag_blocks"`
	AlertLevel          string  `json:"alert_level"`
	AcknowledgedBy      string  `json:"acknowledged_by,omitempty"`
	AcknowledgedAt      string  `json:"acknowledged_at,omitempty"`
	AcknowledgedLevel   string  `json:"acknowledged_level,omitempty"`
	AcknowledgedMessage string  `json:"acknowledged_message,omitempty"`
}

func alertLevel(lag int64, errors uint64, warningLag, criticalLag int64) string {
	if errors > 0 || lag > criticalLag {
		return "critical"
	}
	if lag > warningLag {
		return "warning"
	}
	return "ok"
}

func (r *Repository) Status(ctx context.Context, chainID int64, contractAddress string, poller *Poller, warningLag, criticalLag int64) (Status, error) {
	cursor, err := r.Cursor(ctx, chainID, contractAddress)
	if err != nil {
		return Status{}, err
	}
	latest, err := poller.LatestBlock(ctx)
	if err != nil {
		return Status{}, err
	}
	finalized := finalizedBlock(latest, poller.ConfirmationDepth())
	lag := finalized + 1 - cursor
	if lag < 0 {
		lag = 0
	}
	metrics := poller.Metrics()
	return Status{
		Metrics: metrics, Cursor: cursor, LatestBlock: latest,
		FinalizedBlock: finalized, LagBlocks: lag,
		WarningLag: warningLag, CriticalLag: criticalLag,
		AlertLevel: alertLevel(lag, metrics.Errors, warningLag, criticalLag),
	}, nil
}
