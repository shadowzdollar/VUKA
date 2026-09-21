package api

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

const sessionCookie = "vuka_operator_session"
const traderSessionCookie = "vuka_trader_session"

var errInvalidCredentials = errors.New("invalid credentials")

type AuthStore struct {
	pool          *pgxpool.Pool
	retentionDays int64
}

type Operator struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

type Trader struct {
	ID          string `json:"id"`
	FullName    string `json:"full_name"`
	PhoneNumber string `json:"phone_number"`
	KYCStatus   string `json:"kyc_status"`
}

type Activity struct {
	ID        string `json:"id"`
	Actor     string `json:"actor"`
	Role      string `json:"role"`
	Action    string `json:"action"`
	Resource  string `json:"resource,omitempty"`
	Details   string `json:"details,omitempty"`
	CreatedAt string `json:"created_at"`
}

type operatorContextKey struct{}
type traderContextKey struct{}

func operatorFromContext(ctx context.Context) (Operator, bool) {
	operator, ok := ctx.Value(operatorContextKey{}).(Operator)
	return operator, ok
}

func traderFromContext(ctx context.Context) (Trader, bool) {
	trader, ok := ctx.Value(traderContextKey{}).(Trader)
	return trader, ok
}

func NewAuthStore(pool *pgxpool.Pool) *AuthStore {
	return &AuthStore{pool: pool}
}

// ConfigureActivityRetention sets a read window without deleting audit records.
// Zero keeps the full append-only history visible.
func (s *AuthStore) ConfigureActivityRetention(days int64) {
	if days >= 0 {
		s.retentionDays = days
	}
}

func (s *AuthStore) EnsureSchema(ctx context.Context) error {
	statements := []string{
		`
		CREATE TABLE IF NOT EXISTS operators (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			role VARCHAR(32) NOT NULL DEFAULT 'operator',
			created_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);
		CREATE TABLE IF NOT EXISTS operator_sessions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
			token_hash VARCHAR(64) UNIQUE NOT NULL,
			expires_at TIMESTAMPTZ NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS idx_operator_sessions_expiry ON operator_sessions(expires_at);
		CREATE TABLE IF NOT EXISTS operator_activity (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			actor_email VARCHAR(255) NOT NULL,
			role VARCHAR(32) NOT NULL,
			action VARCHAR(64) NOT NULL,
			resource VARCHAR(255),
			details TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS idx_operator_activity_created_at ON operator_activity(created_at DESC);
		CREATE OR REPLACE FUNCTION prevent_operator_activity_mutation()
		RETURNS trigger AS $$
		BEGIN
			RAISE EXCEPTION 'operator activity is append-only';
		END;
		$$ LANGUAGE plpgsql;
		DROP TRIGGER IF EXISTS operator_activity_append_only ON operator_activity;
		`,
		`CREATE TRIGGER operator_activity_append_only
		BEFORE UPDATE OR DELETE ON operator_activity
		FOR EACH ROW EXECUTE FUNCTION prevent_operator_activity_mutation();
		`,
		`
		CREATE TABLE IF NOT EXISTS trader_credentials (
			user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
			password_hash TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);
		CREATE TABLE IF NOT EXISTS trader_sessions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			token_hash VARCHAR(64) UNIQUE NOT NULL,
			expires_at TIMESTAMPTZ NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS idx_trader_sessions_expiry ON trader_sessions(expires_at);
		CREATE TABLE IF NOT EXISTS transaction_authorizations (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			trader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
			idempotency_key VARCHAR(255) NOT NULL UNIQUE,
			source_account_id UUID NOT NULL,
			destination_account_id UUID NOT NULL,
			amount NUMERIC(20, 6) NOT NULL,
			currency_from VARCHAR(3) NOT NULL,
			currency_to VARCHAR(3) NOT NULL,
			status VARCHAR(32) NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			expires_at TIMESTAMPTZ NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_transaction_authorizations_trader ON transaction_authorizations(trader_id, created_at DESC);
		DROP TABLE IF EXISTS trader_transaction_credentials;
		`,
	}

	for index, statement := range statements {
		if _, err := s.pool.Exec(ctx, statement); err != nil {
			return fmt.Errorf("auth: ensure schema statement %d: %w", index+1, err)
		}
	}
	return s.ensureThrottleSchema(ctx)
}

func (s *AuthStore) RecordTransactionAuthorization(ctx context.Context, traderID, key, sourceID, destinationID string, amount float64, from, to string) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO transaction_authorizations
			(trader_id, idempotency_key, source_account_id, destination_account_id, amount, currency_from, currency_to, status, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'AUTHORIZED', now() + interval '10 minutes')
		ON CONFLICT (idempotency_key) DO NOTHING`,
		traderID, key, sourceID, destinationID, amount, from, to)
	return err
}

func (s *AuthStore) EnsureTraderPassword(ctx context.Context, userID, password string) error {
	if len(password) < 8 {
		return errors.New("auth: trader password must be at least 8 characters")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("auth: hash trader password: %w", err)
	}
	_, err = s.pool.Exec(ctx, `
				INSERT INTO trader_credentials (user_id, password_hash)
				VALUES ($1, $2)
				ON CONFLICT (user_id) DO UPDATE SET password_hash = $2, updated_at = now()`,
		userID, string(hash))
	return err
}

func (s *AuthStore) traderLogin(ctx context.Context, phone, password string) (string, error) {
	var userID, passwordHash string
	err := s.pool.QueryRow(ctx, `
				SELECT u.id, c.password_hash
				FROM users u JOIN trader_credentials c ON c.user_id = u.id
				WHERE u.phone_number = $1`, strings.TrimSpace(phone)).Scan(&userID, &passwordHash)
	if errors.Is(err, pgx.ErrNoRows) || bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)) != nil {
		return "", errInvalidCredentials
	}
	if err != nil {
		return "", fmt.Errorf("auth: find trader: %w", err)
	}
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", fmt.Errorf("auth: generate trader session: %w", err)
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	hash := sha256.Sum256([]byte(token))
	_, err = s.pool.Exec(ctx, `INSERT INTO trader_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
		userID, fmt.Sprintf("%x", hash), time.Now().UTC().Add(12*time.Hour))
	if err != nil {
		return "", fmt.Errorf("auth: create trader session: %w", err)
	}
	return token, nil
}

func traderToken(r *http.Request) (string, bool) {
	if cookie, err := r.Cookie(traderSessionCookie); err == nil && cookie.Value != "" {
		return cookie.Value, true
	}
	const prefix = "Bearer "
	if value := r.Header.Get("Authorization"); strings.HasPrefix(value, prefix) {
		return strings.TrimSpace(strings.TrimPrefix(value, prefix)), true
	}
	return "", false
}

func (s *AuthStore) traderForSession(ctx context.Context, token string) (Trader, error) {
	hash := sha256.Sum256([]byte(token))
	var trader Trader
	err := s.pool.QueryRow(ctx, `
				SELECT u.id, u.full_name, u.phone_number, u.kyc_status
				FROM users u JOIN trader_sessions ts ON ts.user_id = u.id
				WHERE ts.token_hash = $1 AND ts.expires_at > now()`, fmt.Sprintf("%x", hash)).
		Scan(&trader.ID, &trader.FullName, &trader.PhoneNumber, &trader.KYCStatus)
	if errors.Is(err, pgx.ErrNoRows) {
		return Trader{}, errInvalidCredentials
	}
	if err != nil {
		return Trader{}, fmt.Errorf("auth: read trader session: %w", err)
	}
	return trader, nil
}

func (s *AuthStore) traderRequire(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, ok := traderToken(r)
		if !ok {
			writeError(w, http.StatusUnauthorized, "authentication_required", "trader authentication is required")
			return
		}

		trader, err := s.traderForSession(r.Context(), token)
		if errors.Is(err, errInvalidCredentials) {
			writeError(w, http.StatusUnauthorized, "authentication_required", "trader authentication is required")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "authentication_error", err.Error())
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), traderContextKey{}, trader)))
	})
}

func (s *AuthStore) traderOrOperator(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if token, ok := traderToken(r); ok {
			trader, err := s.traderForSession(r.Context(), token)
			if err != nil {
				writeError(w, http.StatusUnauthorized, "authentication_required", "trader authentication is required")
				return
			}
			next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), traderContextKey{}, trader)))
			return
		}
		s.requireRole("operator", "arbiter")(next).ServeHTTP(w, r)
	})
}

func (s *AuthStore) revokeTrader(ctx context.Context, token string) error {
	hash := sha256.Sum256([]byte(token))
	_, err := s.pool.Exec(ctx, `DELETE FROM trader_sessions WHERE token_hash = $1`, fmt.Sprintf("%x", hash))
	return err
}

func (s *AuthStore) recordActivity(ctx context.Context, operator Operator, action, resource, details string) error {
	_, err := s.pool.Exec(ctx, `
			INSERT INTO operator_activity (actor_email, role, action, resource, details)
			VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''))`,
		operator.Email, operator.Role, action, resource, details)
	if err != nil {
		return fmt.Errorf("auth: record activity: %w", err)
	}
	return nil
}

func (s *AuthStore) listActivity(ctx context.Context, limit, offset int, action, search, from, to string) ([]Activity, int, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	rows, err := s.pool.Query(ctx, `
			SELECT id, actor_email, role, action, COALESCE(resource, ''), COALESCE(details, ''), created_at
			FROM operator_activity
			WHERE ($1 = '' OR action = $1)
			  AND ($2 = '' OR actor_email ILIKE '%' || $2 || '%' OR role ILIKE '%' || $2 || '%'
			       OR COALESCE(resource, '') ILIKE '%' || $2 || '%' OR COALESCE(details, '') ILIKE '%' || $2 || '%')
			  AND ($3 = '' OR created_at >= $3::timestamptz)
			  AND ($4 = '' OR created_at < ($4::date + INTERVAL '1 day'))
			  AND ($5 = 0 OR created_at >= now() - ($5 * INTERVAL '1 day'))
			ORDER BY created_at DESC
			LIMIT $6 OFFSET $7`, action, search, from, to, s.retentionDays, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("auth: list activity: %w", err)
	}
	defer rows.Close()
	activities := make([]Activity, 0)
	for rows.Next() {
		var item Activity
		var createdAt time.Time
		if err := rows.Scan(&item.ID, &item.Actor, &item.Role, &item.Action, &item.Resource, &item.Details, &createdAt); err != nil {
			return nil, 0, fmt.Errorf("auth: scan activity: %w", err)
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		activities = append(activities, item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	err = s.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM operator_activity
		WHERE ($1 = '' OR action = $1)
		  AND ($2 = '' OR actor_email ILIKE '%' || $2 || '%' OR role ILIKE '%' || $2 || '%'
		       OR COALESCE(resource, '') ILIKE '%' || $2 || '%' OR COALESCE(details, '') ILIKE '%' || $2 || '%')
		  AND ($3 = '' OR created_at >= $3::timestamptz)
		  AND ($4 = '' OR created_at < ($4::date + INTERVAL '1 day'))
		  AND ($5 = 0 OR created_at >= now() - ($5 * INTERVAL '1 day'))`,
		action, search, from, to, s.retentionDays).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("auth: count activity: %w", err)
	}
	return activities, total, nil
}

func (s *AuthStore) latestActivity(ctx context.Context, action, resource string) (*Activity, error) {
	var item Activity
	var createdAt time.Time
	err := s.pool.QueryRow(ctx, `
		SELECT id, actor_email, role, action, COALESCE(resource, ''), COALESCE(details, ''), created_at
		FROM operator_activity
		WHERE action = $1 AND COALESCE(resource, '') = $2
		ORDER BY created_at DESC
		LIMIT 1`, action, resource).Scan(
		&item.ID, &item.Actor, &item.Role, &item.Action, &item.Resource, &item.Details, &createdAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("auth: latest activity: %w", err)
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	return &item, nil
}

func (s *AuthStore) EnsureOperator(ctx context.Context, email, password, role string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("auth: hash operator password: %w", err)
	}
	_, err = s.pool.Exec(ctx, `
		INSERT INTO operators (email, password_hash, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = $3`,
		strings.ToLower(strings.TrimSpace(email)), string(hash), role)
	if err != nil {
		return fmt.Errorf("auth: create operator: %w", err)
	}
	return nil
}

func (s *AuthStore) requireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(roles))
	for _, role := range roles {
		allowed[role] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie(sessionCookie)
			if err != nil {
				writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
				return
			}
			operator, err := s.operatorForSession(r.Context(), cookie.Value)
			if errors.Is(err, errInvalidCredentials) {
				writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
				return
			}
			if err != nil {
				writeError(w, http.StatusInternalServerError, "authentication_error", err.Error())
				return
			}
			if _, ok := allowed[operator.Role]; !ok {
				writeError(w, http.StatusForbidden, "insufficient_role", "this action is not available to the current role")
				return
			}
			next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), operatorContextKey{}, operator)))
		})
	}
}

func (s *AuthStore) login(ctx context.Context, email, password string) (string, error) {
	var operatorID, passwordHash string
	err := s.pool.QueryRow(ctx, `SELECT id, password_hash FROM operators WHERE email = $1`,
		strings.ToLower(strings.TrimSpace(email))).Scan(&operatorID, &passwordHash)
	if errors.Is(err, pgx.ErrNoRows) || bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)) != nil {
		return "", errInvalidCredentials
	}
	if err != nil {
		return "", fmt.Errorf("auth: find operator: %w", err)
	}

	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", fmt.Errorf("auth: generate session: %w", err)
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	hash := sha256.Sum256([]byte(token))
	expires := time.Now().UTC().Add(12 * time.Hour)
	_, err = s.pool.Exec(ctx, `
		INSERT INTO operator_sessions (operator_id, token_hash, expires_at)
		VALUES ($1, $2, $3)`, operatorID, fmt.Sprintf("%x", hash), expires)
	if err != nil {
		return "", fmt.Errorf("auth: create session: %w", err)
	}
	return token, nil
}

func (s *AuthStore) validSession(ctx context.Context, token string) bool {
	if token == "" {
		return false
	}
	hash := sha256.Sum256([]byte(token))
	var exists bool
	err := s.pool.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM operator_sessions
			WHERE token_hash = $1 AND expires_at > now()
		)`, fmt.Sprintf("%x", hash)).Scan(&exists)
	return err == nil && exists
}

func (s *AuthStore) operatorForSession(ctx context.Context, token string) (Operator, error) {
	hash := sha256.Sum256([]byte(token))
	var operator Operator
	err := s.pool.QueryRow(ctx, `
		SELECT o.email, o.role
		FROM operators o
		JOIN operator_sessions os ON os.operator_id = o.id
		WHERE os.token_hash = $1 AND os.expires_at > now()`,
		fmt.Sprintf("%x", hash)).Scan(&operator.Email, &operator.Role)
	if errors.Is(err, pgx.ErrNoRows) {
		return Operator{}, errInvalidCredentials
	}
	if err != nil {
		return Operator{}, fmt.Errorf("auth: read operator session: %w", err)
	}
	return operator, nil
}

func (s *AuthStore) revoke(ctx context.Context, token string) error {
	hash := sha256.Sum256([]byte(token))
	_, err := s.pool.Exec(ctx, `DELETE FROM operator_sessions WHERE token_hash = $1`, fmt.Sprintf("%x", hash))
	return err
}

func (s *AuthStore) require(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(sessionCookie)
		if err != nil || !s.validSession(r.Context(), cookie.Value) {
			writeError(w, http.StatusUnauthorized, "authentication_required", "operator authentication is required")
			return
		}
		next.ServeHTTP(w, r)
	})
}
