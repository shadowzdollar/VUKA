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

var errInvalidCredentials = errors.New("invalid credentials")

type AuthStore struct {
	pool *pgxpool.Pool
}

type Operator struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

type operatorContextKey struct{}

func operatorFromContext(ctx context.Context) (Operator, bool) {
	operator, ok := ctx.Value(operatorContextKey{}).(Operator)
	return operator, ok
}

func NewAuthStore(pool *pgxpool.Pool) *AuthStore {
	return &AuthStore{pool: pool}
}

func (s *AuthStore) EnsureSchema(ctx context.Context) error {
	_, err := s.pool.Exec(ctx, `
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
	`)
	if err != nil {
		return fmt.Errorf("auth: ensure schema: %w", err)
	}
	return nil
}

func (s *AuthStore) EnsureOperator(ctx context.Context, email, password, role string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("auth: hash operator password: %w", err)
	}
	_, err = s.pool.Exec(ctx, `
		INSERT INTO operators (email, password_hash, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (email) DO UPDATE SET role = $3`,
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
