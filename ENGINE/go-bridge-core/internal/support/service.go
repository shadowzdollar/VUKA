package support

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	pool     *pgxpool.Pool
	readOnly bool
}

func NewService(pool *pgxpool.Pool, readOnly bool) *Service {
	return &Service{pool: pool, readOnly: readOnly}
}

func (s *Service) guardWrite() error {
	if s == nil || s.pool == nil {
		return fmt.Errorf("support: service unavailable")
	}
	if s.readOnly {
		return ErrReadOnly
	}
	return nil
}

func (s *Service) CreateTicket(ctx context.Context, req CreateTicketRequest, key, actor string) (*Ticket, bool, error) {
	if err := s.guardWrite(); err != nil {
		return nil, false, err
	}
	if err := req.Validate(); err != nil {
		return nil, false, err
	}
	if strings.TrimSpace(req.Priority) == "" {
		req.Priority = "normal"
	}
	key = strings.TrimSpace(key)
	if key == "" {
		return nil, false, fmt.Errorf("%w: Idempotency-Key is required", ErrInvalid)
	}
	var t Ticket
	err := s.pool.QueryRow(ctx, `INSERT INTO support_tickets
		(trader_id,subject,description,priority,idempotency_key)
		VALUES($1,$2,$3,$4,$5)
		RETURNING id,trader_id,subject,description,priority,status,idempotency_key,created_at,updated_at`,
		req.TraderID, strings.TrimSpace(req.Subject), strings.TrimSpace(req.Description),
		req.Priority, key).Scan(&t.ID, &t.TraderID, &t.Subject, &t.Description, &t.Priority,
		&t.Status, &t.IdempotencyKey, &t.CreatedAt, &t.UpdatedAt)
	if err == nil {
		_, err = s.pool.Exec(ctx, `INSERT INTO support_ticket_events(ticket_id,actor,event_type,to_status) VALUES($1,$2,'created',$3)`, t.ID, actorOrSystem(actor), t.Status)
		return &t, false, err
	}
	if !isUnique(err) {
		return nil, false, err
	}
	err = s.pool.QueryRow(ctx, `SELECT id,trader_id,subject,description,priority,status,idempotency_key,created_at,updated_at
		FROM support_tickets WHERE trader_id=$1 AND idempotency_key=$2`, req.TraderID, key).Scan(
		&t.ID, &t.TraderID, &t.Subject, &t.Description, &t.Priority, &t.Status, &t.IdempotencyKey, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, false, err
	}
	if t.Subject != strings.TrimSpace(req.Subject) || t.Description != strings.TrimSpace(req.Description) || t.Priority != req.Priority {
		return nil, false, ErrIdempotency
	}
	return &t, true, nil
}

func (s *Service) ListTickets(ctx context.Context, traderID, status string) ([]Ticket, error) {
	if s == nil || s.pool == nil {
		return nil, fmt.Errorf("support: service unavailable")
	}
	rows, err := s.pool.Query(ctx, `SELECT id,trader_id,subject,description,priority,status,idempotency_key,created_at,updated_at
		FROM support_tickets WHERE ($1='' OR trader_id=$1::uuid) AND ($2='' OR status=$2) ORDER BY created_at DESC`, traderID, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Ticket
	for rows.Next() {
		var t Ticket
		if err := rows.Scan(&t.ID, &t.TraderID, &t.Subject, &t.Description, &t.Priority, &t.Status, &t.IdempotencyKey, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Service) GetTicket(ctx context.Context, id string) (*Ticket, error) {
	if s == nil || s.pool == nil {
		return nil, fmt.Errorf("support: service unavailable")
	}
	var t Ticket
	err := s.pool.QueryRow(ctx, `SELECT id,trader_id,subject,description,priority,status,idempotency_key,created_at,updated_at FROM support_tickets WHERE id=$1`, id).Scan(
		&t.ID, &t.TraderID, &t.Subject, &t.Description, &t.Priority, &t.Status, &t.IdempotencyKey, &t.CreatedAt, &t.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *Service) UpdateStatus(ctx context.Context, id string, req UpdateTicketRequest, actor string) (*Ticket, error) {
	if err := s.guardWrite(); err != nil {
		return nil, err
	}
	if err := req.Validate(); err != nil {
		return nil, err
	}
	t, err := s.GetTicket(ctx, id)
	if err != nil {
		return nil, err
	}
	if t.Status == *req.Status {
		return t, nil
	}
	_, err = s.pool.Exec(ctx, `UPDATE support_tickets SET status=$1,updated_at=now() WHERE id=$2`, *req.Status, id)
	if err != nil {
		return nil, err
	}
	_, err = s.pool.Exec(ctx, `INSERT INTO support_ticket_events(ticket_id,actor,event_type,from_status,to_status) VALUES($1,$2,'status_changed',$3,$4)`, id, actorOrSystem(actor), t.Status, *req.Status)
	if err != nil {
		return nil, err
	}
	return s.GetTicket(ctx, id)
}

func (s *Service) ListNotifications(ctx context.Context, traderID string) ([]Notification, error) {
	if s == nil || s.pool == nil {
		return nil, fmt.Errorf("support: service unavailable")
	}
	rows, err := s.pool.Query(ctx, `SELECT n.id,n.trader_id,n.type,n.severity,n.title,n.body,n.created_at,r.created_at
		FROM notifications n LEFT JOIN notification_reads r ON r.notification_id=n.id AND r.trader_id=n.trader_id
		WHERE n.trader_id=$1 ORDER BY n.created_at DESC`, traderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Notification
	for rows.Next() {
		var n Notification
		if err := rows.Scan(&n.ID, &n.TraderID, &n.Type, &n.Severity, &n.Title, &n.Body, &n.CreatedAt, &n.ReadAt); err != nil {
			return nil, err
		}
		out = append(out, n)
	}
	return out, rows.Err()
}

// AppendNotification records a durable local notification. Notifications are
// immutable; read state is recorded separately by MarkNotificationRead.
func (s *Service) AppendNotification(ctx context.Context, traderID, typ, title, body string) (*Notification, error) {
	return s.AppendNotificationWithSeverity(ctx, traderID, typ, "info", title, body)
}

func (s *Service) AppendNotificationWithSeverity(ctx context.Context, traderID, typ, severity, title, body string) (*Notification, error) {
	if err := s.guardWrite(); err != nil {
		return nil, err
	}
	if strings.TrimSpace(traderID) == "" || strings.TrimSpace(typ) == "" ||
		strings.TrimSpace(title) == "" || strings.TrimSpace(body) == "" {
		return nil, fmt.Errorf("%w: trader_id, type, title and body are required", ErrInvalid)
	}
	if severity != "info" && severity != "success" && severity != "warning" && severity != "error" {
		return nil, fmt.Errorf("%w: invalid notification severity", ErrInvalid)
	}
	var n Notification
	err := s.pool.QueryRow(ctx, `INSERT INTO notifications(trader_id,type,severity,title,body)
		VALUES($1,$2,$3,$4,$5) RETURNING id,trader_id,type,severity,title,body,created_at`,
		traderID, strings.TrimSpace(typ), severity, strings.TrimSpace(title), strings.TrimSpace(body)).
		Scan(&n.ID, &n.TraderID, &n.Type, &n.Severity, &n.Title, &n.Body, &n.CreatedAt)
	return &n, err
}

func (s *Service) AppendWorkflowNotification(ctx context.Context, traderID, typ, severity, title, body string) error {
	_, err := s.AppendNotificationWithSeverity(ctx, traderID, typ, severity, title, body)
	return err
}

func (s *Service) MarkNotificationRead(ctx context.Context, id, traderID, actor string) error {
	if err := s.guardWrite(); err != nil {
		return err
	}
	tag, err := s.pool.Exec(ctx, `INSERT INTO notification_reads(notification_id,trader_id,actor)
		SELECT id,$2,$3 FROM notifications WHERE id=$1 AND trader_id=$2 ON CONFLICT(notification_id,trader_id) DO NOTHING`, id, traderID, actorOrSystem(actor))
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		var exists bool
		err = s.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM notifications WHERE id=$1 AND trader_id=$2)`, id, traderID).Scan(&exists)
		if err != nil {
			return err
		}
		if !exists {
			return ErrNotFound
		}
	}
	return nil
}

func actorOrSystem(actor string) string {
	if strings.TrimSpace(actor) == "" {
		return "local-system"
	}
	return strings.TrimSpace(actor)
}
func isUnique(err error) bool { var e *pgconn.PgError; return errors.As(err, &e) && e.Code == "23505" }
