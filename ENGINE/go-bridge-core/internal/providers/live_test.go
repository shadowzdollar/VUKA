package providers

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"vuka/go-bridge-core/internal/adapters"
)

type fakeLive struct{ *adapters.SandboxRail }

func (f fakeLive) Environment() string { return "sandbox" } // wrapper must override this

func fakeFactory(creds map[string]string) AdapterFactory {
	return func(id string, got map[string]string, _ time.Duration) (adapters.ProviderAdapter, error) {
		for k, v := range creds {
			if got[k] != v {
				return nil, errors.New("unexpected credential " + k)
			}
		}
		return fakeLive{adapters.NewSandboxRail("vendor-name", "Vendor", "V", 0, 0, "success", time.Second)}, nil
	}
}

func env(m map[string]string) func(string) string { return func(k string) string { return m[k] } }

func TestLiveActivationRequiresExplicitAcknowledgement(t *testing.T) {
	c := NewDefaultCatalog()
	e := env(map[string]string{"VUKA_PROVIDER_MTN_RW_CREDENTIALS": `{"api_key":"k"}`})
	if err := c.ActivateLive(LiveRequestFromEnv("mtn-rw"), false, e, fakeFactory(nil)); err == nil ||
		!strings.Contains(err.Error(), "VUKA_ALLOW_LIVE_PROVIDERS") {
		t.Fatalf("live without the acknowledgement flag = %v", err)
	}
	cfg := c.Providers()
	for _, p := range cfg {
		if p.Config.Environment == EnvironmentLive {
			t.Fatalf("%s went live without acknowledgement", p.Config.ID)
		}
	}
}

func TestLiveActivationSwitchesOnlyTheRequestedProvider(t *testing.T) {
	c := NewDefaultCatalog()
	e := env(map[string]string{
		"VUKA_PROVIDER_MTN_RW_CREDENTIALS":    `{"api_key":"k","api_user":"u"}`,
		"VUKA_PROVIDER_MTN_RW_WEBHOOK_SECRET": "whsec",
	})
	if err := c.ActivateLive(LiveRequestFromEnv("mtn-rw"), true, e, fakeFactory(map[string]string{"api_key": "k"})); err != nil {
		t.Fatalf("activate: %v", err)
	}
	live, sandbox := 0, 0
	for _, p := range c.Providers() {
		if p.Config.Environment == EnvironmentLive {
			live++
			if p.Config.ID != "mtn-rw" || !p.Config.ExternalCalls || p.Config.Credentials.SecretRef != "env://VUKA_PROVIDER_MTN_RW_CREDENTIALS" {
				t.Fatalf("live provider config = %+v", p.Config)
			}
			if !strings.HasSuffix(p.Config.DisplayName, "(live)") {
				t.Fatalf("display name = %q", p.Config.DisplayName)
			}
		} else {
			sandbox++
		}
	}
	if live != 1 || sandbox != len(Countries)-1 {
		t.Fatalf("live=%d sandbox=%d", live, sandbox)
	}
	// The adapter is registered under the catalog id and reports live, whatever the vendor object says.
	a := c.Adapters()["mtn-rw"]
	if a.Name() != "mtn-rw" || a.Environment() != "live" {
		t.Fatalf("adapter = %s/%s", a.Name(), a.Environment())
	}
	// The webhook validator from the secret reference is installed: an unsigned callback is refused.
	if _, err := c.ReceiveWebhook(context.Background(), "mtn-rw", "evt", "bad-sig", []byte(`{}`)); !errors.Is(err, ErrWebhookRejected) {
		t.Fatalf("unsigned live webhook = %v", err)
	}
}

func TestLiveActivationFailsClosed(t *testing.T) {
	cases := map[string]struct {
		env     map[string]string
		id      string
		factory AdapterFactory
		want    string
	}{
		"credentials variable unset":  {map[string]string{}, "mtn-rw", fakeFactory(nil), "not set"},
		"credentials not JSON":        {map[string]string{"VUKA_PROVIDER_MTN_RW_CREDENTIALS": "plain-text-secret-123"}, "mtn-rw", fakeFactory(nil), "JSON object"},
		"unknown provider":            {map[string]string{}, "nope-xx", fakeFactory(nil), "unknown provider"},
		"family has no live adapter":  {map[string]string{"VUKA_PROVIDER_ORANGE_SN_CREDENTIALS": `{"a":"b"}`}, "orange-sn", nil, "no live adapter"},
		"adapter rejects credentials": {map[string]string{"VUKA_PROVIDER_MTN_UG_CREDENTIALS": `{"api_key":"k"}`}, "mtn-ug", nil, "rejected its credentials"},
	}
	for name, tc := range cases {
		c := NewDefaultCatalog()
		err := c.ActivateLive(LiveRequestFromEnv(tc.id), true, env(tc.env), tc.factory)
		if err == nil || !strings.Contains(err.Error(), tc.want) {
			t.Errorf("%s: err = %v, want containing %q", name, err, tc.want)
		}
		// A failed activation must leave every provider in the sandbox.
		for _, p := range c.Providers() {
			if p.Config.Environment == EnvironmentLive {
				t.Errorf("%s: %s is live after a failed activation", name, p.Config.ID)
			}
		}
		// And must never leak the credential blob.
		if err != nil && strings.Contains(err.Error(), "plain-text-secret-123") {
			t.Errorf("%s: error leaks the credential value: %v", name, err)
		}
	}
	// A vault reference without a secret-manager client is refused, not treated as empty.
	if _, err := ResolveEnvRef("vault://payments/mtn-rw", os_getenvNone); err == nil {
		t.Error("vault:// must fail closed until a secret manager client is wired")
	}
}

func os_getenvNone(string) string { return "" }

func TestLiveConfigValidation(t *testing.T) {
	good := CredentialConfig{SecretRef: "env://VUKA_PROVIDER_X_CREDENTIALS", External: true}
	if err := good.validateLive(); err != nil {
		t.Fatal(err)
	}
	for name, c := range map[string]CredentialConfig{
		"sandbox ref":   {SecretRef: "sandbox://x", External: true},
		"literal":       {SecretRef: "secret_value", External: true},
		"http endpoint": {SecretRef: "env://X", Endpoint: "http://provider.example", External: true},
	} {
		if err := c.validateLive(); err == nil {
			t.Errorf("%s accepted for a live provider", name)
		}
	}
	// Sandbox rules are unchanged: still no external calls.
	if err := (ProviderConfig{ID: "x", DisplayName: "X", ContractVersion: ContractVersion, Environment: EnvironmentSimulated, ExternalCalls: true}).Validate(); err == nil {
		t.Error("a simulated provider must not declare external calls")
	}
}
