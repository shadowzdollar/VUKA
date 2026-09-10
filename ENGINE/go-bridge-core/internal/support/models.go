package support

import (
	"fmt"
	"strings"
	"time"
)

type TicketStatus string

const (
	StatusOpen    TicketStatus = "open"
	StatusPending TicketStatus = "pending"
	StatusClosed  TicketStatus = "closed"
)

type Ticket struct {
	ID             string       `json:"id"`
	TraderID       string       `json:"trader_id"`
	Subject        string       `json:"subject"`
	Description    string       `json:"description"`
	Priority       string       `json:"priority"`
	Status         TicketStatus `json:"status"`
	IdempotencyKey string       `json:"-"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
}

type CreateTicketRequest struct {
	TraderID    string `json:"trader_id"`
	Subject     string `json:"subject"`
	Description string `json:"description"`
	Priority    string `json:"priority"`
}

type UpdateTicketRequest struct {
	Status *TicketStatus `json:"status"`
}

type Notification struct {
	ID        string     `json:"id"`
	TraderID  string     `json:"trader_id"`
	Type      string     `json:"type"`
	Severity  string     `json:"severity"`
	Title     string     `json:"title"`
	Body      string     `json:"body"`
	CreatedAt time.Time  `json:"created_at"`
	ReadAt    *time.Time `json:"read_at,omitempty"`
}

var (
	ErrInvalid     = fmt.Errorf("support: invalid request")
	ErrNotFound    = fmt.Errorf("support: record not found")
	ErrConflict    = fmt.Errorf("support: conflict")
	ErrReadOnly    = fmt.Errorf("support: read-only mode blocks state changes")
	ErrIdempotency = fmt.Errorf("support: idempotency conflict")
)

func (r CreateTicketRequest) Validate() error {
	if strings.TrimSpace(r.TraderID) == "" || strings.TrimSpace(r.Subject) == "" ||
		strings.TrimSpace(r.Description) == "" {
		return fmt.Errorf("%w: trader_id, subject and description are required", ErrInvalid)
	}
	if len(r.Subject) > 200 || len(r.Description) > 10000 {
		return fmt.Errorf("%w: subject or description is too long", ErrInvalid)
	}
	if r.Priority == "" {
		r.Priority = "normal"
	}
	if r.Priority != "low" && r.Priority != "normal" && r.Priority != "high" {
		return fmt.Errorf("%w: priority must be low, normal, or high", ErrInvalid)
	}
	return nil
}

func (r UpdateTicketRequest) Validate() error {
	if r.Status == nil || (*r.Status != StatusOpen && *r.Status != StatusPending && *r.Status != StatusClosed) {
		return fmt.Errorf("%w: status must be open, pending, or closed", ErrInvalid)
	}
	return nil
}
