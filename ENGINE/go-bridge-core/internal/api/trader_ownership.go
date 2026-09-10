package api

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5"
)

func (s *Server) ownsAccount(ctx context.Context, traderID, accountID string) bool {
	var exists bool
	err := s.ledger.DB().QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM accounts WHERE id=$1 AND user_id=$2)`,
		strings.TrimSpace(accountID), strings.TrimSpace(traderID)).Scan(&exists)
	return err == nil && exists
}

func (s *Server) ownsTransfer(ctx context.Context, traderID, transferID string) bool {
	var exists bool
	err := s.ledger.DB().QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM transactions t
			JOIN accounts a ON a.id=t.source_account_id OR a.id=t.destination_account_id
			WHERE t.id=$1 AND a.user_id=$2
		)`, strings.TrimSpace(transferID), strings.TrimSpace(traderID)).Scan(&exists)
	return err == nil && exists
}

func (s *Server) ownsInvoice(ctx context.Context, traderID, invoiceID string) bool {
	var exists bool
	err := s.ledger.DB().QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM invoices
			WHERE id=$1 AND (issuer_user_id=$2 OR counterparty_user_id=$2)
		)`, strings.TrimSpace(invoiceID), strings.TrimSpace(traderID)).Scan(&exists)
	return err == nil && exists
}

func (s *Server) ticketTrader(ctx context.Context, ticketID string) (string, error) {
	var traderID string
	err := s.ledger.DB().QueryRow(ctx, `SELECT trader_id FROM support_tickets WHERE id=$1`, ticketID).Scan(&traderID)
	return traderID, err
}

func (s *Server) notificationTrader(ctx context.Context, notificationID string) (string, error) {
	var traderID string
	err := s.ledger.DB().QueryRow(ctx, `SELECT trader_id FROM notifications WHERE id=$1`, notificationID).Scan(&traderID)
	return traderID, err
}

func noRows(err error) bool { return err == pgx.ErrNoRows }
