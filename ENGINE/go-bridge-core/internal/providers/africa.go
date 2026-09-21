package providers

import (
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"
	"time"

	"vuka/go-bridge-core/internal/adapters"
)

// Country describes one market on the platform and its primary payout rail.
// Every rail here is registered as a SANDBOX adapter by default; production
// activation is a separate, explicit, per-provider step (see
// ENGINE/PROVIDER_CREDENTIALS.md). Nothing in this table is a licence or
// partnership claim — it is the integration plan.
type Country struct {
	Code         string // ISO 3166-1 alpha-2
	Name         string
	Currency     string // ISO 4217
	Region       string // regional economic community used for fee tiering
	ProviderID   string // registry key of the primary rail
	ProviderName string
	RefPrefix    string // external reference prefix used by the sandbox rail
	// SandboxPerUSD is an INDICATIVE reference rate (currency units per USD).
	// It exists so the sandbox can quote; it is not market data. Production
	// deployments must override it (VUKA_FX_RATES) or install a live RateSource.
	SandboxPerUSD float64
}

// Countries is the launch matrix. Order is stable and used for deterministic output.
var Countries = []Country{
	{"RW", "Rwanda", "RWF", "EAC", "mtn-rw", "MTN MoMo Rwanda", "MTNRW", 1380},
	{"KE", "Kenya", "KES", "EAC", "mpesa-ke", "Safaricom M-Pesa Kenya", "MPESA", 129.5},
	{"UG", "Uganda", "UGX", "EAC", "mtn-ug", "MTN MoMo Uganda", "MTNUG", 3700},
	{"TZ", "Tanzania", "TZS", "EAC", "mpesa-tz", "Vodacom M-Pesa Tanzania", "MPTZ", 2700},
	{"GH", "Ghana", "GHS", "ECOWAS", "mtn-gh", "MTN MoMo Ghana", "MTNGH", 12},
	{"NG", "Nigeria", "NGN", "ECOWAS", "nibss-ng", "NIBSS Instant Payment (via licensed aggregator)", "NIP", 1550},
	{"SN", "Senegal", "XOF", "ECOWAS", "orange-sn", "Orange Money Senegal", "OMSN", 600},
	{"ET", "Ethiopia", "ETB", "HORN", "telebirr-et", "Telebirr Ethiopia", "TBET", 125},
	{"ZM", "Zambia", "ZMW", "SADC", "airtel-zm", "Airtel Money Zambia", "AMZM", 27},
	{"ZA", "South Africa", "ZAR", "SADC", "eft-za", "Instant EFT South Africa (via licensed aggregator)", "EFTZA", 18},
}

// AfricaOptions tunes the catalog. The zero value is a valid sandbox setup.
type AfricaOptions struct {
	SandboxDelay time.Duration
	SandboxMode  string // "success" | "fail" | "timeout" | "" (random per FailRate)
	SandboxFail  float64
	QuoteTTL     time.Duration
	QuoteKey     []byte             // shared signing key; nil => ephemeral (single replica only)
	Rates        map[string]float64 // currency => units per USD overrides (VUKA_FX_RATES)
	RateSource   string             // label for the reference rates, e.g. "sandbox-reference" or "vendor-x"
	Countries    []string           // restrict to these ISO codes; nil => all
	MaxTxnUSD    float64            // per-transaction cap, default 10,000
	DailyUSD     float64            // per-corridor daily cap, default 100,000
	MinTxnUSD    float64            // default 1
}

// USDRates is the static reference RateSource, cross-derived through USD.
type USDRates struct {
	PerUSD map[string]float64
	Label  string
}

// Rate implements RateSource with source-per-destination semantics.
func (u USDRates) Rate(from, to string) (float64, string, error) {
	f, okF := u.PerUSD[from]
	t, okT := u.PerUSD[to]
	if !okF || !okT || f <= 0 || t <= 0 {
		return 0, "", fmt.Errorf("%w: no reference rate for %s/%s", ErrInvalidConfig, from, to)
	}
	// 1 USD = f FROM = t TO  =>  FROM per one TO = f / t.
	return f / t, u.Label, nil
}

// ToUSD converts an amount in currency to USD using the reference table.
func (u USDRates) ToUSD(amount float64, currency string) (float64, error) {
	p, ok := u.PerUSD[currency]
	if !ok || p <= 0 {
		return 0, fmt.Errorf("%w: no reference rate for %s", ErrInvalidConfig, currency)
	}
	return amount / p, nil
}

// ParseRateOverrides parses "KES=129.5,RWF=1380". Empty input returns nil.
func ParseRateOverrides(spec string) (map[string]float64, error) {
	spec = strings.TrimSpace(spec)
	if spec == "" {
		return nil, nil
	}
	out := map[string]float64{}
	for _, part := range strings.Split(spec, ",") {
		kv := strings.SplitN(strings.TrimSpace(part), "=", 2)
		if len(kv) != 2 {
			return nil, fmt.Errorf("%w: bad rate override %q (want CUR=value)", ErrInvalidConfig, part)
		}
		cur := strings.ToUpper(strings.TrimSpace(kv[0]))
		v, err := strconv.ParseFloat(strings.TrimSpace(kv[1]), 64)
		if err != nil || v <= 0 || len(cur) != 3 || math.IsInf(v, 0) || math.IsNaN(v) {
			return nil, fmt.Errorf("%w: bad rate override %q", ErrInvalidConfig, part)
		}
		out[cur] = v
	}
	return out, nil
}

// CredentialPlaceholder is the managed reference used until real credentials
// exist, e.g. env://VUKA_PROVIDER_MTN_RW_CREDENTIALS. The variable is read only
// when a provider is switched to live mode.
func CredentialPlaceholder(providerID string) string {
	return "env://VUKA_PROVIDER_" + strings.ToUpper(strings.NewReplacer("-", "_").Replace(providerID)) + "_CREDENTIALS"
}

func regionFee(a, b Country) int {
	if a.Region == b.Region {
		return 80
	}
	return 120
}

// NewAfricaCatalog builds the pan-African sandbox catalog: one provider per
// country and a directed corridor for every ordered country pair, with limits
// expressed in USD equivalents so they are comparable across currencies.
func NewAfricaCatalog(o AfricaOptions) (*Catalog, error) {
	if o.MaxTxnUSD <= 0 {
		o.MaxTxnUSD = 10_000
	}
	if o.DailyUSD < o.MaxTxnUSD {
		o.DailyUSD = math.Max(100_000, o.MaxTxnUSD)
	}
	if o.MinTxnUSD <= 0 {
		o.MinTxnUSD = 1
	}
	if o.SandboxMode == "" && o.SandboxFail == 0 {
		o.SandboxMode = "success"
	}
	if o.RateSource == "" {
		o.RateSource = "sandbox-reference"
	}

	perUSD := map[string]float64{"USD": 1}
	for _, c := range Countries {
		perUSD[c.Currency] = c.SandboxPerUSD
	}
	for cur, v := range o.Rates {
		perUSD[cur] = v
	}
	rates := USDRates{PerUSD: perUSD, Label: o.RateSource}

	allow := map[string]bool{}
	for _, code := range o.Countries {
		allow[strings.ToUpper(strings.TrimSpace(code))] = true
	}
	var active []Country
	for _, c := range Countries {
		if len(allow) == 0 || allow[c.Code] {
			active = append(active, c)
		}
	}
	if len(active) == 0 {
		return nil, fmt.Errorf("%w: no supported country selected", ErrInvalidConfig)
	}

	cat := NewCatalog()
	if len(o.QuoteKey) > 0 {
		signer, err := NewQuoteSigner(o.QuoteKey)
		if err != nil {
			return nil, err
		}
		cat.SetQuoteSigner(signer)
	}
	cat.SetQuoteTTL(o.QuoteTTL)
	cat.SetRateSource(rates)

	timeout := 5 * time.Second
	for _, c := range active {
		rail := adapters.NewSandboxRail(c.ProviderID, c.ProviderName, c.RefPrefix, o.SandboxDelay, o.SandboxFail, o.SandboxMode, timeout)
		if err := cat.RegisterProvider(ProviderConfig{
			ID: c.ProviderID, DisplayName: c.ProviderName + " (sandbox)",
			ContractVersion: ContractVersion, Environment: EnvironmentSimulated, Enabled: true,
			Credentials:        CredentialConfig{SecretRef: "sandbox://" + c.ProviderID + "/webhook"},
			SupportedCountries: []string{c.Code}, SupportedCurrencies: []string{c.Currency},
		}, rail); err != nil {
			return nil, err
		}
	}

	now := time.Now().UTC()
	for _, from := range active {
		for _, to := range active {
			if from.Code == to.Code {
				continue
			}
			rate, src, err := rates.Rate(from.Currency, to.Currency)
			if err != nil {
				return nil, err
			}
			fromUSD := perUSD[from.Currency]
			minor := func(usd float64) int64 { return int64(math.Round(usd * fromUSD * 100)) }
			id := strings.ToLower(fmt.Sprintf("%s-%s-%s-%s", from.Code, from.Currency, to.Code, to.Currency))
			if err := cat.RegisterCorridor(CorridorConfig{
				ID: id, FromCountry: from.Code, ToCountry: to.Code,
				FromCurrency: from.Currency, ToCurrency: to.Currency,
				ProviderID: to.ProviderID, FeesBps: regionFee(from, to), FixedFeeMinor: 0,
				MinAmountMinor: minor(o.MinTxnUSD), MaxAmountMinor: minor(o.MaxTxnUSD), DailyLimitMinor: minor(o.DailyUSD),
				LiquidityOwner: "vuka-treasury", OperationsOwner: "vuka-operations", Enabled: true,
				FX: FXQuote{Rate: rate, InverseRate: 1 / rate, Source: src, QuoteID: "indicative",
					QuotedAt: now, ExpiresAt: now.Add(24 * time.Hour)},
			}); err != nil {
				return nil, err
			}
		}
	}
	return cat, nil
}

// NewDefaultCatalog is the sandbox catalog used by tests and local runs.
func NewDefaultCatalog() *Catalog {
	c, err := NewAfricaCatalog(AfricaOptions{SandboxDelay: 0})
	if err != nil {
		panic(err) // static configuration; cannot fail
	}
	return c
}

// SupportedCurrencies returns the sorted currencies of the given countries (nil => all).
func SupportedCurrencies(codes []string) []string {
	allow := map[string]bool{}
	for _, c := range codes {
		allow[strings.ToUpper(strings.TrimSpace(c))] = true
	}
	var out []string
	for _, c := range Countries {
		if len(allow) == 0 || allow[c.Code] {
			out = append(out, c.Currency)
		}
	}
	sort.Strings(out)
	return out
}
