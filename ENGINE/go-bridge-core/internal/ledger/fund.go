// Account funding (external cash-in).
//
// A funding operation models money arriving from OUTSIDE the VUKA ledger
// (a trader topping up their Business wallet from MTN MoMo, a bank transfer,
// or a cash deposit). VUKA still records this as double-entry bookkeeping:
// debit a reserved external-funding SETTLEMENT account and credit the target
// trader account. The external account's negative balance represents value
// introduced from outside VUKA and keeps every transaction internally balanced.
package ledger

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

const (
	systemLedgerUserPhone = "__vuka_system_ledger__"
	systemLedgerUserName  = "VUKA System Ledger"
)

// FundRequest is the payload for crediting an account with external funds.
type FundRequest struct {
	Amount   float64 `json:"amount"`
	Currency string  `json:"currency"`
	// Reference is an optional external reference (e.g. the MTN transaction
	// id of the incoming mobile-money transfer).
	Reference string `json:"reference,omitempty"`
}

// FundAccount credits an account from an external source. It returns the
// created transaction header. The operation is atomic and idempotency-keyed
// like a transfer.
func (s *Service) FundAccount(ctx context.Context, accountID, key string, req FundRequest) (*Transfer, error) {
	if key == "" {
		return nil, fmt.Errorf("%w: funding requires an idempotency key", ErrIdempotencyKeyRequired)
	}
	if req.Amount <= 0 {
		return nil, fmt.Errorf("%w: funding amount must be positive", ErrInvalidAmount)
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("ledger: begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck // no-op after commit

	acc, err := lockAccount(ctx, tx, accountID)
	if err != nil {
		return nil, err
	}
	if req.Currency != "" && req.Currency != acc.Currency {
		return nil, fmt.Errorf("%w: account currency is %s, got %s", ErrCurrencyMismatch, acc.Currency, req.Currency)
	}
	currency := acc.Currency
	external, err := ensureExternalFundingAccount(ctx, tx, currency)
	if err != nil {
		return nil, err
	}

	// Header insert. UNIQUE on idempotency_key is the first guard; if a
	// concurrent funding with the same key won the race, replay its result.
	var id string
	err = tx.QueryRow(ctx, `
		INSERT INTO transactions (idempotency_key, source_account_id, destination_account_id,
		                          amount, currency, status, external_reference)
		VALUES ($1, $2, $3, $4, $5, 'SUCCESS', $6)
		RETURNING id`,
		key, external.ID, accountID, req.Amount, currency, nullIfEmpty(req.Reference),
	).Scan(&id)
	if err != nil {
		if isUniqueViolation(err) {
			_ = tx.Rollback(ctx)
			t, ferr := s.GetTransferByIdempotencyKey(ctx, key)
			if ferr != nil {
				return nil, fmt.Errorf("ledger: funding idempotency replay: %w", ferr)
			}
			return t, nil
		}
		return nil, fmt.Errorf("ledger: insert funding header: %w", err)
	}

	if err := writeDoubleEntry(ctx, tx, id, external.ID, accountID, req.Amount); err != nil {
		return nil, fmt.Errorf("ledger: insert funding entry: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("ledger: commit funding: %w", err)
	}
	return s.GetTransfer(ctx, id)
}

func ensureExternalFundingAccount(ctx context.Context, tx pgx.Tx, currency string) (*Account, error) {
	var userID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO users (full_name, phone_number, kyc_status)
		VALUES ($1, $2, 'APPROVED')
		ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
		RETURNING id`,
		systemLedgerUserName, systemLedgerUserPhone,
	).Scan(&userID); err != nil {
		return nil, fmt.Errorf("ledger: ensure system ledger user: %w", err)
	}

	var account Account
	if err := tx.QueryRow(ctx, `
		INSERT INTO accounts (user_id, type, currency)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, type, currency) DO UPDATE SET currency = EXCLUDED.currency
		RETURNING id, user_id, type, currency, created_at`,
		userID, AccountTypeSettlement, currency,
	).Scan(&account.ID, &account.UserID, &account.Type, &account.Currency, &account.CreatedAt); err != nil {
		return nil, fmt.Errorf("ledger: ensure external funding account: %w", err)
	}
	return &account, nil
}

// GetAccountByUserAndType resolves the account of a given type for a user.
// Used by tests and the API to find a trader's Business wallet.
func (s *Service) GetAccountByUserAndType(ctx context.Context, userID string, at AccountType) (*Account, error) {
	var a Account
	err := s.pool.QueryRow(ctx, `
		SELECT id, user_id, type, currency, created_at
		FROM accounts WHERE user_id = $1 AND type = $2`, userID, at,
	).Scan(&a.ID, &a.UserID, &a.Type, &a.Currency, &a.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrAccountNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("ledger: get account by user/type: %w", err)
	}
	return &a, nil
}
