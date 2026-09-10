// Package providers contains the Phase 4 provider/corridor control plane.
//
// This package is deliberately a local control-plane boundary. It describes
// provider contracts, corridor policy, webhook evidence, and health state; it
// does not make network calls, mutate the ledger, or submit blockchain
// transactions.
package providers

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"
	"sync"
	"time"

	"vuka/go-bridge-core/internal/adapters"
)

const (
	ContractVersion      = "v1"
	EnvironmentSandbox   = "sandbox"
	EnvironmentSimulated = "simulated"

	EventReceived   = "RECEIVED"
	EventAccepted   = "ACCEPTED"
	EventDuplicate  = "DUPLICATE"
	EventRejected   = "REJECTED"
	EventNotSettled = "NOT_SETTLED"
)

var (
	ErrProviderDisabled = errors.New("providers: provider or corridor is disabled")
	ErrKillSwitchActive = errors.New("providers: corridor kill switch is active")
	ErrWebhookRejected  = errors.New("providers: webhook authentication rejected")
	ErrWebhookReplay    = errors.New("providers: webhook replay detected")
	ErrInvalidConfig    = errors.New("providers: invalid configuration")
	ErrLimitExceeded    = errors.New("providers: corridor limit exceeded")
)

type CredentialConfig struct {
	SecretRef string `json:"secret_ref,omitempty"`
	Endpoint  string `json:"endpoint,omitempty"`
	External  bool   `json:"external"`
}

func (c CredentialConfig) Validate() error {
	if c.External {
		return fmt.Errorf("%w: external provider calls are disabled by default", ErrInvalidConfig)
	}
	if strings.Contains(strings.ToLower(c.SecretRef), "secret_") || strings.Contains(c.SecretRef, "=") {
		return fmt.Errorf("%w: secret_ref must be a reference, not a secret", ErrInvalidConfig)
	}
	if c.SecretRef != "" &&
		!strings.HasPrefix(c.SecretRef, "sandbox://") &&
		!strings.HasPrefix(c.SecretRef, "secret://") &&
		!strings.HasPrefix(c.SecretRef, "vault://") &&
		!strings.HasPrefix(c.SecretRef, "env://") {
		return fmt.Errorf("%w: secret_ref must use a managed reference scheme", ErrInvalidConfig)
	}
	if c.Endpoint != "" && !strings.HasPrefix(c.Endpoint, "sandbox://") &&
		!strings.HasPrefix(c.Endpoint, "http://127.0.0.1") &&
		!strings.HasPrefix(c.Endpoint, "http://localhost") {
		return fmt.Errorf("%w: endpoint must remain local/sandbox-only", ErrInvalidConfig)
	}
	return nil
}

type ProviderConfig struct {
	ID                  string           `json:"id"`
	DisplayName         string           `json:"display_name"`
	ContractVersion     string           `json:"contract_version"`
	Environment         string           `json:"environment"`
	Enabled             bool             `json:"enabled"`
	KillSwitch          bool             `json:"kill_switch"`
	ExternalCalls       bool             `json:"external_calls"`
	Credentials         CredentialConfig `json:"credentials"`
	SupportedCountries  []string         `json:"supported_countries"`
	SupportedCurrencies []string         `json:"supported_currencies"`
}

func (c ProviderConfig) Validate() error {
	if strings.TrimSpace(c.ID) == "" || strings.TrimSpace(c.DisplayName) == "" {
		return fmt.Errorf("%w: provider id and display name are required", ErrInvalidConfig)
	}
	if c.ContractVersion != ContractVersion {
		return fmt.Errorf("%w: unsupported contract version %q", ErrInvalidConfig, c.ContractVersion)
	}
	if c.Environment != EnvironmentSandbox && c.Environment != EnvironmentSimulated {
		return fmt.Errorf("%w: environment must be sandbox or simulated", ErrInvalidConfig)
	}
	if c.ExternalCalls {
		return fmt.Errorf("%w: external provider calls are disabled by default", ErrInvalidConfig)
	}
	return c.Credentials.Validate()
}

type FXQuote struct {
	Rate      float64   `json:"rate"`
	Source    string    `json:"source"`
	QuoteID   string    `json:"quote_id"`
	QuotedAt  time.Time `json:"quoted_at"`
	ExpiresAt time.Time `json:"expires_at"`
	MarkupBps int       `json:"markup_bps"`
}

func (q FXQuote) Validate() error {
	if q.Rate <= 0 || math.IsNaN(q.Rate) || math.IsInf(q.Rate, 0) {
		return fmt.Errorf("%w: FX rate must be finite and positive", ErrInvalidConfig)
	}
	if strings.TrimSpace(q.Source) == "" || strings.TrimSpace(q.QuoteID) == "" {
		return fmt.Errorf("%w: FX source and quote id are required", ErrInvalidConfig)
	}
	if !q.ExpiresAt.After(q.QuotedAt) {
		return fmt.Errorf("%w: FX quote expiry must be after quote time", ErrInvalidConfig)
	}
	return nil
}

type CorridorConfig struct {
	ID              string  `json:"id"`
	FromCountry     string  `json:"from_country"`
	ToCountry       string  `json:"to_country"`
	FromCurrency    string  `json:"from_currency"`
	ToCurrency      string  `json:"to_currency"`
	ProviderID      string  `json:"provider_id"`
	FeesBps         int     `json:"fees_bps"`
	FixedFeeMinor   int64   `json:"fixed_fee_minor"`
	MinAmountMinor  int64   `json:"min_amount_minor"`
	MaxAmountMinor  int64   `json:"max_amount_minor"`
	DailyLimitMinor int64   `json:"daily_limit_minor"`
	LiquidityOwner  string  `json:"liquidity_owner"`
	OperationsOwner string  `json:"operations_owner"`
	KillSwitch      bool    `json:"kill_switch"`
	Enabled         bool    `json:"enabled"`
	FX              FXQuote `json:"fx"`
}

type Quote struct {
	ID              string    `json:"id"`
	CorridorID      string    `json:"corridor_id"`
	ProviderID      string    `json:"provider_id"`
	SourceAmount    int64     `json:"source_amount_minor"`
	FeeMinor        int64     `json:"fee_minor"`
	DeliverAmount   int64     `json:"deliver_amount_minor"`
	FromCurrency    string    `json:"from_currency"`
	ToCurrency      string    `json:"to_currency"`
	Rate            float64   `json:"rate"`
	QuotedAt        time.Time `json:"quoted_at"`
	ExpiresAt       time.Time `json:"expires_at"`
	ObservationOnly bool      `json:"observation_only"`
}

func (c CorridorConfig) Validate() error {
	if strings.TrimSpace(c.ID) == "" || strings.TrimSpace(c.ProviderID) == "" {
		return fmt.Errorf("%w: corridor id and provider are required", ErrInvalidConfig)
	}
	if len(c.FromCountry) != 2 || len(c.ToCountry) != 2 ||
		len(c.FromCurrency) != 3 || len(c.ToCurrency) != 3 {
		return fmt.Errorf("%w: country and currency codes must be ISO-shaped", ErrInvalidConfig)
	}
	if c.FeesBps < 0 || c.FeesBps > 5000 || c.FixedFeeMinor < 0 ||
		c.MinAmountMinor <= 0 || c.MaxAmountMinor < c.MinAmountMinor ||
		c.DailyLimitMinor < c.MaxAmountMinor {
		return fmt.Errorf("%w: invalid corridor limits or fees", ErrInvalidConfig)
	}
	if strings.TrimSpace(c.LiquidityOwner) == "" || strings.TrimSpace(c.OperationsOwner) == "" {
		return fmt.Errorf("%w: liquidity and operations owners are required", ErrInvalidConfig)
	}
	return c.FX.Validate()
}

type ProviderStatus struct {
	Config       ProviderConfig `json:"config"`
	AdapterReady bool           `json:"adapter_ready"`
	Healthy      bool           `json:"healthy"`
	LastChecked  time.Time      `json:"last_checked"`
	Reason       string         `json:"reason,omitempty"`
}

type ReconciliationStatus struct {
	ProviderID  string    `json:"provider_id"`
	CorridorID  string    `json:"corridor_id"`
	State       string    `json:"state"`
	LastEventAt time.Time `json:"last_event_at"`
	OpenItems   int       `json:"open_items"`
	CheckedAt   time.Time `json:"checked_at"`
}

type WebhookEvent struct {
	ID               string          `json:"id"`
	ProviderID       string          `json:"provider_id"`
	EventType        string          `json:"event_type"`
	State            string          `json:"state"`
	ReplayKey        string          `json:"replay_key"`
	Authenticated    bool            `json:"authenticated"`
	Payload          json.RawMessage `json:"payload"`
	ReceivedAt       time.Time       `json:"received_at"`
	SettlementAction string          `json:"settlement_action"`
}

type WebhookSignatureValidator interface {
	Validate(body []byte, signature string) bool
}

type HMACSHA256Validator struct {
	Secret []byte
}

func (v HMACSHA256Validator) Validate(body []byte, signature string) bool {
	if len(v.Secret) == 0 {
		return false
	}
	sig := strings.TrimPrefix(strings.TrimSpace(signature), "sha256=")
	got, err := hex.DecodeString(sig)
	if err != nil {
		return false
	}
	mac := hmac.New(sha256.New, v.Secret)
	_, _ = mac.Write(body)
	return hmac.Equal(got, mac.Sum(nil))
}

type ProviderAdapter interface {
	adapters.TelecomAdapter
	ContractVersion() string
	Environment() string
	ValidateConfig() error
}

type Catalog struct {
	mu             sync.RWMutex
	providers      map[string]ProviderConfig
	adapters       map[string]ProviderAdapter
	corridors      map[string]CorridorConfig
	webhookEvents  []WebhookEvent
	reconciliation map[string]ReconciliationStatus
	validators     map[string]WebhookSignatureValidator
}

func NewCatalog() *Catalog {
	return &Catalog{
		providers:      make(map[string]ProviderConfig),
		adapters:       make(map[string]ProviderAdapter),
		corridors:      make(map[string]CorridorConfig),
		reconciliation: make(map[string]ReconciliationStatus),
		validators:     make(map[string]WebhookSignatureValidator),
	}
}

func NewDefaultCatalog() *Catalog {
	c := NewCatalog()
	_ = c.RegisterProvider(ProviderConfig{
		ID: "mtn-rw", DisplayName: "MTN MoMo Rwanda (sandbox)",
		ContractVersion: ContractVersion, Environment: EnvironmentSimulated, Enabled: true,
		Credentials:        CredentialConfig{SecretRef: "sandbox://mtn-rw/webhook"},
		SupportedCountries: []string{"RW"}, SupportedCurrencies: []string{"RWF"},
	}, adapters.NewMTNAdapter(0, 0, "success", 5*time.Second))
	_ = c.RegisterProvider(ProviderConfig{
		ID: "mpesa-ke", DisplayName: "M-Pesa Kenya (sandbox)",
		ContractVersion: ContractVersion, Environment: EnvironmentSimulated, Enabled: true,
		Credentials:        CredentialConfig{SecretRef: "sandbox://mpesa-ke/webhook"},
		SupportedCountries: []string{"KE"}, SupportedCurrencies: []string{"KES"},
	}, adapters.NewMpesaAdapter(0, 0, "success", 5*time.Second))
	_ = c.RegisterCorridor(CorridorConfig{
		ID: "rw-rwf-ke-kes", FromCountry: "RW", ToCountry: "KE",
		FromCurrency: "RWF", ToCurrency: "KES", ProviderID: "mpesa-ke",
		FeesBps: 100, FixedFeeMinor: 0, MinAmountMinor: 1, MaxAmountMinor: 50000000,
		DailyLimitMinor: 100000000, LiquidityOwner: "vuka-treasury",
		OperationsOwner: "vuka-operations", Enabled: true,
		FX: FXQuote{Rate: 0.95, Source: "sandbox-fixture", QuoteID: "fixture-rwf-kes-1",
			QuotedAt: time.Now().UTC(), ExpiresAt: time.Now().UTC().Add(24 * time.Hour)},
	})
	return c
}

func (c *Catalog) RegisterProvider(config ProviderConfig, adapter ProviderAdapter) error {
	if err := config.Validate(); err != nil {
		return err
	}
	if adapter == nil || adapter.Name() != config.ID ||
		adapter.ContractVersion() != ContractVersion ||
		adapter.Environment() != config.Environment {
		return fmt.Errorf("%w: adapter does not match provider %q", ErrInvalidConfig, config.ID)
	}
	if err := adapter.ValidateConfig(); err != nil {
		return err
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	c.providers[config.ID], c.adapters[config.ID] = config, adapter
	return nil
}

func (c *Catalog) RegisterCorridor(config CorridorConfig) error {
	if err := config.Validate(); err != nil {
		return err
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if _, ok := c.providers[config.ProviderID]; !ok {
		return fmt.Errorf("%w: corridor provider %q is not registered", ErrInvalidConfig, config.ProviderID)
	}
	c.corridors[config.ID] = config
	return nil
}

func (c *Catalog) Quote(corridorID string, amountMinor int64, now time.Time) (Quote, error) {
	c.mu.RLock()
	corridor, ok := c.corridors[corridorID]
	provider := c.providers[corridor.ProviderID]
	c.mu.RUnlock()
	if !ok {
		return Quote{}, fmt.Errorf("%w: unknown corridor %q", ErrInvalidConfig, corridorID)
	}

	if !corridor.Enabled || !provider.Enabled {
		return Quote{}, ErrProviderDisabled
	}
	if corridor.KillSwitch || provider.KillSwitch {
		return Quote{}, ErrKillSwitchActive
	}
	if amountMinor < corridor.MinAmountMinor || amountMinor > corridor.MaxAmountMinor ||
		amountMinor > corridor.DailyLimitMinor {
		return Quote{}, ErrLimitExceeded
	}
	if err := corridor.FX.Validate(); err != nil {
		return Quote{}, err
	}
	if now.IsZero() {
		now = time.Now().UTC()
	}
	fee := (amountMinor*int64(corridor.FeesBps) + 9999) / 10000
	fee += corridor.FixedFeeMinor
	deliver := int64(float64(amountMinor-fee) * corridor.FX.Rate)
	if deliver <= 0 {
		return Quote{}, ErrLimitExceeded
	}
	return Quote{
		ID: corridor.FX.QuoteID, CorridorID: corridor.ID, ProviderID: corridor.ProviderID,
		SourceAmount: amountMinor, FeeMinor: fee, DeliverAmount: deliver,
		FromCurrency: corridor.FromCurrency, ToCurrency: corridor.ToCurrency,
		Rate: corridor.FX.Rate, QuotedAt: now, ExpiresAt: corridor.FX.ExpiresAt,
		ObservationOnly: true,
	}, nil
}

func (c *Catalog) ValidateQuote(corridorID, quoteID string, amountMinor int64, now time.Time) error {
	quote, err := c.Quote(corridorID, amountMinor, now)
	if err != nil {
		return err
	}
	if strings.TrimSpace(quoteID) == "" || quote.ID != quoteID {
		return fmt.Errorf("%w: quote id does not match corridor quote", ErrInvalidConfig)
	}
	if !now.Before(quote.ExpiresAt) {
		return fmt.Errorf("%w: quote has expired", ErrInvalidConfig)
	}
	return nil
}

func (c *Catalog) Providers() []ProviderStatus {
	c.mu.RLock()
	defer c.mu.RUnlock()
	result := make([]ProviderStatus, 0, len(c.providers))
	for id, config := range c.providers {
		_, ready := c.adapters[id]
		healthy := ready && config.Enabled && !config.KillSwitch
		reason := ""
		if !config.Enabled {
			reason = "disabled by default/configuration"
		}
		if config.KillSwitch {
			reason = "provider kill switch active"
		}
		result = append(result, ProviderStatus{Config: config, AdapterReady: ready, Healthy: healthy, Reason: reason, LastChecked: time.Now().UTC()})
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Config.ID < result[j].Config.ID })
	return result
}

func (c *Catalog) Corridors() []CorridorConfig {
	c.mu.RLock()
	defer c.mu.RUnlock()
	result := make([]CorridorConfig, 0, len(c.corridors))
	for _, corridor := range c.corridors {
		result = append(result, corridor)
	}
	sort.Slice(result, func(i, j int) bool { return result[i].ID < result[j].ID })
	return result
}

func (c *Catalog) WebhookEvents() []WebhookEvent {
	c.mu.RLock()
	defer c.mu.RUnlock()
	result := append([]WebhookEvent(nil), c.webhookEvents...)
	return result
}

func (c *Catalog) Reconciliations() []ReconciliationStatus {
	c.mu.RLock()
	defer c.mu.RUnlock()
	result := make([]ReconciliationStatus, 0, len(c.reconciliation))
	for _, item := range c.reconciliation {
		result = append(result, item)
	}
	sort.Slice(result, func(i, j int) bool { return result[i].ProviderID < result[j].ProviderID })
	return result
}

func (c *Catalog) SetKillSwitch(corridorID string, active bool) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	item, ok := c.corridors[corridorID]
	if !ok {
		return fmt.Errorf("%w: unknown corridor %q", ErrInvalidConfig, corridorID)
	}
	item.KillSwitch = active
	c.corridors[corridorID] = item
	return nil
}

func (c *Catalog) SetProviderKillSwitch(providerID string, active bool) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	item, ok := c.providers[providerID]
	if !ok {
		return fmt.Errorf("%w: unknown provider %q", ErrInvalidConfig, providerID)
	}
	item.KillSwitch = active
	c.providers[providerID] = item
	return nil
}

func (c *Catalog) Authorize(corridorID string, amountMinor int64) error {
	c.mu.RLock()
	defer c.mu.RUnlock()
	item, ok := c.corridors[corridorID]
	if !ok {
		return fmt.Errorf("%w: unknown corridor %q", ErrInvalidConfig, corridorID)
	}

	provider := c.providers[item.ProviderID]
	if !item.Enabled || !provider.Enabled {
		return ErrProviderDisabled
	}
	if item.KillSwitch || provider.KillSwitch {
		return ErrKillSwitchActive
	}
	if amountMinor < item.MinAmountMinor || amountMinor > item.MaxAmountMinor || amountMinor > item.DailyLimitMinor {
		return ErrLimitExceeded
	}
	return nil
}

// SettlementState exposes only the fail-closed policy facts needed by the
// controlled settlement preflight. It never resolves credentials or calls a
// provider.
func (c *Catalog) SettlementState(providerID, corridorID string, amountMinor int64) (providerEnabled, corridorEnabled, providerKill, corridorKill, fxValid bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	provider, providerOK := c.providers[providerID]
	corridor, corridorOK := c.corridors[corridorID]
	providerEnabled = providerOK && provider.Enabled
	providerKill = providerOK && provider.KillSwitch
	corridorEnabled = corridorOK && corridor.Enabled && corridor.ProviderID == providerID
	corridorKill = corridorOK && corridor.KillSwitch
	fxValid = corridorOK && corridor.FX.Validate() == nil &&
		amountMinor >= corridor.MinAmountMinor && amountMinor <= corridor.MaxAmountMinor &&
		amountMinor <= corridor.DailyLimitMinor
	return
}

// ReceiveWebhook records provider evidence only. It intentionally has no
// ledger dependency and returns NOT_SETTLED for every accepted event.
func (c *Catalog) ReceiveWebhook(ctx context.Context, providerID, replayKey, signature string, body []byte) (WebhookEvent, error) {
	select {
	case <-ctx.Done():
		return WebhookEvent{}, ctx.Err()
	default:
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	config, ok := c.providers[providerID]
	if !ok || !config.Enabled {
		return WebhookEvent{}, ErrProviderDisabled
	}
	validator := c.validators[providerID]
	event := WebhookEvent{ID: replayKey, ProviderID: providerID, ReplayKey: replayKey, State: EventReceived, Payload: append([]byte(nil), body...), ReceivedAt: time.Now().UTC(), SettlementAction: EventNotSettled}
	if validator == nil || !validator.Validate(body, signature) {
		event.State = EventRejected
		c.webhookEvents = append(c.webhookEvents, event)
		return event, ErrWebhookRejected
	}
	event.Authenticated = true
	for _, prior := range c.webhookEvents {
		if prior.ProviderID == providerID && prior.ReplayKey == replayKey && prior.State != EventRejected {
			event.State = EventDuplicate
			c.webhookEvents = append(c.webhookEvents, event)
			return event, ErrWebhookReplay
		}
	}
	var envelope struct {
		EventType string `json:"event_type"`
	}
	if err := json.Unmarshal(body, &envelope); err != nil || strings.TrimSpace(envelope.EventType) == "" {
		event.State = EventRejected
		c.webhookEvents = append(c.webhookEvents, event)
		return event, ErrWebhookRejected
	}
	event.EventType, event.State = envelope.EventType, EventAccepted
	c.webhookEvents = append(c.webhookEvents, event)
	c.reconciliation[providerID] = ReconciliationStatus{ProviderID: providerID, State: "OBSERVED_ONLY", LastEventAt: event.ReceivedAt, CheckedAt: event.ReceivedAt}
	return event, nil
}

// SetWebhookValidator is intentionally explicit; production callers should
// resolve the secret from a secret manager and never put it in config.
func (c *Catalog) SetWebhookValidator(providerID string, validator WebhookSignatureValidator) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.validators[providerID] = validator
}
