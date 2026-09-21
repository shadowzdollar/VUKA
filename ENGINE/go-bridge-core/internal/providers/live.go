package providers

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"vuka/go-bridge-core/internal/adapters"
)

// Live activation is the ONLY way a provider leaves the sandbox. It is
// deliberately a separate, explicit, per-provider step:
//
//  1. VUKA_ALLOW_LIVE_PROVIDERS=true            (deployment-wide acknowledgement)
//  2. VUKA_PROVIDER_MODE_<ID>=live              (this provider only)
//  3. VUKA_PROVIDER_<ID>_CREDENTIALS=<json>     (managed reference, never in source)
//
// Any missing piece, an unsupported provider family, or a credential blob that
// fails the adapter's own validation aborts startup. The engine never falls
// back to the sandbox silently when live was requested, and never starts a
// half-configured live provider.

// LiveRequest asks for one provider to be switched to a real network.
type LiveRequest struct {
	ProviderID       string
	CredentialRef    string // env://NAME resolves NAME as a JSON object
	WebhookSecretRef string // env://NAME resolves NAME as the raw HMAC secret (optional)
	// Timeout for the real HTTP client.
	Timeout time.Duration
}

// LiveModeRequested reports whether env asks for the provider to be live.
func LiveModeRequested(providerID string, getenv func(string) string) bool {
	return strings.EqualFold(strings.TrimSpace(getenv("VUKA_PROVIDER_MODE_"+envKey(providerID))), "live")
}

func envKey(providerID string) string {
	return strings.ToUpper(strings.NewReplacer("-", "_").Replace(providerID))
}

// LiveRequestFromEnv builds the standard request for a provider from the
// conventional variable names documented in ENGINE/PROVIDER_CREDENTIALS.md.
func LiveRequestFromEnv(providerID string) LiveRequest {
	return LiveRequest{
		ProviderID:       providerID,
		CredentialRef:    CredentialPlaceholder(providerID),
		WebhookSecretRef: "env://VUKA_PROVIDER_" + envKey(providerID) + "_WEBHOOK_SECRET",
	}
}

// ResolveEnvRef resolves env://NAME. Other schemes (vault://, secret://) need a
// secret-manager client that is not wired yet, so they fail closed with an
// actionable message instead of returning empty credentials.
func ResolveEnvRef(ref string, getenv func(string) string) (string, error) {
	switch {
	case strings.HasPrefix(ref, "env://"):
		name := strings.TrimPrefix(ref, "env://")
		v := strings.TrimSpace(getenv(name))
		if v == "" {
			return "", fmt.Errorf("%w: credential variable %s is not set", ErrInvalidConfig, name)
		}
		return v, nil
	case strings.HasPrefix(ref, "vault://"), strings.HasPrefix(ref, "secret://"):
		return "", fmt.Errorf("%w: %s needs a secret-manager client, which is not wired; use an env:// reference injected by your secret manager", ErrInvalidConfig, strings.SplitN(ref, "://", 2)[0]+"://")
	}
	return "", fmt.Errorf("%w: unsupported credential reference", ErrInvalidConfig)
}

// AdapterFactory builds the real adapter for a provider from its resolved
// credential fields. It is a parameter so tests never touch the network.
type AdapterFactory func(providerID string, creds map[string]string, timeout time.Duration) (adapters.ProviderAdapter, error)

// DefaultAdapterFactory supports the vendor integrations that exist today:
// MTN MoMo (mtn-*) and Safaricom M-Pesa Daraja (mpesa-ke). Every other rail is
// a documented integration to build once its credentials exist.
func DefaultAdapterFactory(providerID string, creds map[string]string, timeout time.Duration) (adapters.ProviderAdapter, error) {
	switch {
	case strings.HasPrefix(providerID, "mtn-"):
		return adapters.NewMoMoAPIAdapter(adapters.MoMoConfig{
			SubscriptionKey: creds["subscription_key"], APIUser: creds["api_user"], APIKey: creds["api_key"],
			Environment: creds["target_environment"], CallbackURL: creds["callback_url"], Timeout: timeout,
		}), nil
	case providerID == "mpesa-ke":
		return adapters.NewMpesaDarajaAdapter(adapters.DarajaConfig{
			ConsumerKey: creds["consumer_key"], ConsumerSecret: creds["consumer_secret"], PassKey: creds["pass_key"],
			ShortCode: creds["short_code"], B2CShortCode: creds["b2c_short_code"], InitiatorName: creds["initiator_name"],
			SecurityCredential: creds["security_credential"], CallbackURL: creds["callback_url"],
			Environment: creds["environment"], Timeout: timeout,
		}), nil
	}
	return nil, fmt.Errorf("%w: no live adapter is implemented for %q yet; it stays in sandbox until one is built", ErrInvalidConfig, providerID)
}

// ActivateLive switches one provider from its sandbox rail to a live adapter.
func (c *Catalog) ActivateLive(req LiveRequest, allow bool, getenv func(string) string, factory AdapterFactory) error {
	if getenv == nil {
		getenv = os.Getenv
	}
	if factory == nil {
		factory = DefaultAdapterFactory
	}
	if !allow {
		return fmt.Errorf("%w: %s requested live mode but VUKA_ALLOW_LIVE_PROVIDERS is not true", ErrInvalidConfig, req.ProviderID)
	}
	c.mu.RLock()
	current, ok := c.providers[req.ProviderID]
	c.mu.RUnlock()
	if !ok {
		return fmt.Errorf("%w: unknown provider %q", ErrInvalidConfig, req.ProviderID)
	}
	raw, err := ResolveEnvRef(req.CredentialRef, getenv)
	if err != nil {
		return fmt.Errorf("provider %s: %w", req.ProviderID, err)
	}
	creds := map[string]string{}
	if err := json.Unmarshal([]byte(raw), &creds); err != nil {
		// Never echo the blob: it may contain secrets.
		return fmt.Errorf("%w: credentials for %s must be a JSON object of string fields", ErrInvalidConfig, req.ProviderID)
	}
	timeout := req.Timeout
	if timeout <= 0 {
		timeout = 20 * time.Second
	}
	inner, err := factory(req.ProviderID, creds, timeout)
	if err != nil {
		return err
	}
	live := adapters.WrapLive(req.ProviderID, inner)
	if err := live.ValidateConfig(); err != nil {
		return fmt.Errorf("provider %s: live adapter rejected its credentials: %w", req.ProviderID, err)
	}

	cfg := current
	cfg.Environment = EnvironmentLive
	cfg.ExternalCalls = true
	cfg.DisplayName = strings.TrimSuffix(cfg.DisplayName, " (sandbox)") + " (live)"
	cfg.Credentials = CredentialConfig{SecretRef: req.CredentialRef, External: true}
	if err := c.RegisterProvider(cfg, live); err != nil {
		return err
	}
	if req.WebhookSecretRef != "" {
		if secret, err := ResolveEnvRef(req.WebhookSecretRef, getenv); err == nil {
			c.SetWebhookValidator(req.ProviderID, HMACSHA256Validator{Secret: []byte(secret)})
		}
		// A missing webhook secret is not fatal: the webhook boundary then stays
		// fail-closed (every callback rejected) until the secret is provided.
	}
	return nil
}

// ProviderIDForCurrency returns the primary rail id of the country that uses currency.
func ProviderIDForCurrency(currency string) (string, bool) {
	for _, c := range Countries {
		if c.Currency == currency {
			return c.ProviderID, true
		}
	}
	return "", false
}
