package adapters

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"
)

var ErrUnsupportedCurrencyPair = errors.New("fx: unsupported currency pair")
var ErrStaleQuote = errors.New("fx: quote is stale")

type FXQuote struct {
	Pair      string    `json:"pair"`
	Rate      float64   `json:"rate"`
	Bid       float64   `json:"bid"`
	Ask       float64   `json:"ask"`
	Source    string    `json:"source"`
	Timestamp time.Time `json:"timestamp"`
	ExpiresAt time.Time `json:"expires_at"`
}

type FXProvider interface {
	GetQuote(ctx context.Context, fromCurrency, toCurrency string) (*FXQuote, error)
}

type LiveFXProvider struct {
	mu        sync.RWMutex
	baseRates map[string]float64
	spreadPct float64
	ttl       time.Duration
}

func NewLiveFXProvider(spreadPct float64, ttl time.Duration) *LiveFXProvider {
	if ttl <= 0 {
		ttl = 5 * time.Minute
	}
	p := &LiveFXProvider{
		baseRates: make(map[string]float64),
		spreadPct: spreadPct,
		ttl:       ttl,
	}
	// Initial baseline rates relative to USD
	p.baseRates["USD"] = 1.0
	p.baseRates["KES"] = 129.50  // 1 USD = 129.50 KES
	p.baseRates["RWF"] = 1380.00 // 1 USD = 1380 RWF
	p.baseRates["UGX"] = 3700.00 // 1 USD = 3700 UGX
	p.baseRates["TZS"] = 2700.00 // 1 USD = 2700 TZS
	return p
}

func (p *LiveFXProvider) SetBaseRate(currency string, rateRelativeToUSD float64) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.baseRates[currency] = rateRelativeToUSD
}

func (p *LiveFXProvider) GetQuote(ctx context.Context, from, to string) (*FXQuote, error) {
	from = fmt.Sprintf("%s", from)
	to = fmt.Sprintf("%s", to)
	pair := fmt.Sprintf("%s/%s", from, to)

	if from == to {
		now := time.Now().UTC()
		return &FXQuote{
			Pair:      pair,
			Rate:      1.0,
			Bid:       1.0,
			Ask:       1.0,
			Source:    "internal",
			Timestamp: now,
			ExpiresAt: now.Add(p.ttl),
		}, nil
	}

	p.mu.RLock()
	rateFrom, okFrom := p.baseRates[from]
	rateTo, okTo := p.baseRates[to]
	p.mu.RUnlock()

	if !okFrom || !okTo {
		return nil, fmt.Errorf("%w: %s", ErrUnsupportedCurrencyPair, pair)
	}

	// Mid rate: (rateTo / rateFrom)
	mid := rateTo / rateFrom
	halfSpread := mid * (p.spreadPct / 100.0) / 2.0
	bid := mid - halfSpread
	ask := mid + halfSpread

	now := time.Now().UTC()
	return &FXQuote{
		Pair:      pair,
		Rate:      mid,
		Bid:       bid,
		Ask:       ask,
		Source:    "live-fx-engine",
		Timestamp: now,
		ExpiresAt: now.Add(p.ttl),
	}, nil
}
