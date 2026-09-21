package providers

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// QuoteSigner issues and verifies firm FX quotes without any server-side
// state. A quote id is `q1.<payload>.<signature>` where the payload locks the
// corridor, rate and expiry and the signature is an HMAC-SHA256 over it, so
// any replica holding the key can verify a quote issued by another replica and
// the rate a customer saw is the rate that is settled — even after the market
// (or a live rate source) has moved. Set VUKA_QUOTE_SIGNING_KEY identically on
// every replica in production.
type QuoteSigner struct {
	key []byte
}

// NewQuoteSigner returns a signer for key. A nil/short key is rejected so a
// misconfigured deployment fails loudly instead of signing with a weak secret.
func NewQuoteSigner(key []byte) (*QuoteSigner, error) {
	if len(key) < 16 {
		return nil, fmt.Errorf("%w: quote signing key must be at least 16 bytes", ErrInvalidConfig)
	}
	return &QuoteSigner{key: append([]byte(nil), key...)}, nil
}

// NewEphemeralQuoteSigner creates a signer with a random per-process key.
// Quotes then only verify on the process that issued them: fine for
// development and tests, wrong for a multi-replica deployment.
func NewEphemeralQuoteSigner() *QuoteSigner {
	key := make([]byte, 32)
	if _, err := rand.Read(key); err != nil {
		panic(fmt.Sprintf("providers: cannot read entropy: %v", err))
	}
	return &QuoteSigner{key: key}
}

type quotePayload struct {
	Corridor string  `json:"c"`
	Rate     float64 `json:"r"`
	Source   string  `json:"s"`
	Expires  int64   `json:"e"`
}

// VerifiedQuote is the locked content of a valid quote id.
type VerifiedQuote struct {
	CorridorID string
	Rate       float64
	Source     string
	ExpiresAt  time.Time
}

func (s *QuoteSigner) mac(payload string) string {
	m := hmac.New(sha256.New, s.key)
	_, _ = m.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(m.Sum(nil))
}

func (s *QuoteSigner) Sign(corridorID string, rate float64, source string, expires time.Time) string {
	raw, _ := json.Marshal(quotePayload{Corridor: corridorID, Rate: rate, Source: source, Expires: expires.Unix()})
	payload := base64.RawURLEncoding.EncodeToString(raw)
	return "q1." + payload + "." + s.mac(payload)
}

// Verify checks integrity and expiry. It never trusts fields outside the
// signed payload.
func (s *QuoteSigner) Verify(id string, now time.Time) (VerifiedQuote, error) {
	parts := strings.Split(strings.TrimSpace(id), ".")
	if len(parts) != 3 || parts[0] != "q1" {
		return VerifiedQuote{}, fmt.Errorf("%w: malformed quote id", ErrInvalidConfig)
	}
	if !hmac.Equal([]byte(s.mac(parts[1])), []byte(parts[2])) {
		return VerifiedQuote{}, fmt.Errorf("%w: quote signature is invalid", ErrInvalidConfig)
	}
	raw, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return VerifiedQuote{}, fmt.Errorf("%w: malformed quote payload", ErrInvalidConfig)
	}
	var p quotePayload
	if err := json.Unmarshal(raw, &p); err != nil || p.Rate <= 0 || p.Corridor == "" {
		return VerifiedQuote{}, fmt.Errorf("%w: malformed quote payload", ErrInvalidConfig)
	}
	exp := time.Unix(p.Expires, 0).UTC()
	if !now.Before(exp) {
		return VerifiedQuote{}, fmt.Errorf("%w: quote has expired", ErrInvalidConfig)
	}
	return VerifiedQuote{CorridorID: p.Corridor, Rate: p.Rate, Source: p.Source, ExpiresAt: exp}, nil
}
