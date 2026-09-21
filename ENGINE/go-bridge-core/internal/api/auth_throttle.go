package api

import (
	"context"
	"fmt"
	"strings"
	"time"
)

// Login throttling: after MaxLoginFailures failed attempts for the same
// subject (phone/email) inside LoginFailureWindow the subject is locked out
// until the window slides past. Failures live in PostgreSQL so the limit holds
// across replicas and restarts, and it is keyed by subject (not only by IP) so
// a distributed credential-stuffing run against one account is also slowed.
const (
	MaxLoginFailures   = 5
	LoginFailureWindow = 15 * time.Minute
)

func (s *AuthStore) ensureThrottleSchema(ctx context.Context) error {
	_, err := s.pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS auth_login_failures (
			id BIGSERIAL PRIMARY KEY,
			kind VARCHAR(16) NOT NULL,
			subject VARCHAR(255) NOT NULL,
			occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS idx_auth_login_failures_lookup ON auth_login_failures(kind, subject, occurred_at DESC);`)
	if err != nil {
		return fmt.Errorf("auth: ensure throttle schema: %w", err)
	}
	return nil
}

func throttleSubject(subject string) string { return strings.ToLower(strings.TrimSpace(subject)) }

// lockedFor returns how long the subject must wait, or 0 when not locked.
func (s *AuthStore) lockedFor(ctx context.Context, kind, subject string) time.Duration {
	var count int
	var oldest *time.Time
	err := s.pool.QueryRow(ctx, `
		SELECT COUNT(*), MIN(occurred_at) FROM (
			SELECT occurred_at FROM auth_login_failures
			WHERE kind=$1 AND subject=$2 AND occurred_at > now() - $3::interval
			ORDER BY occurred_at DESC LIMIT $4
		) recent`, kind, throttleSubject(subject), fmt.Sprintf("%d seconds", int(LoginFailureWindow.Seconds())), MaxLoginFailures).
		Scan(&count, &oldest)
	if err != nil || count < MaxLoginFailures || oldest == nil {
		return 0 // fail open on a throttle-store error: authentication itself still checks the password
	}
	if wait := time.Until(oldest.Add(LoginFailureWindow)); wait > 0 {
		return wait
	}
	return 0
}

func (s *AuthStore) recordLoginFailure(ctx context.Context, kind, subject string) {
	_, _ = s.pool.Exec(ctx, `INSERT INTO auth_login_failures(kind, subject) VALUES($1,$2)`, kind, throttleSubject(subject))
}

func (s *AuthStore) clearLoginFailures(ctx context.Context, kind, subject string) {
	_, _ = s.pool.Exec(ctx, `DELETE FROM auth_login_failures WHERE kind=$1 AND subject=$2`, kind, throttleSubject(subject))
}
