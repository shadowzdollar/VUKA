CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trader_id UUID NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
    status VARCHAR(16) NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','closed')),
    idempotency_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(trader_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS support_tickets_trader_idx ON support_tickets(trader_id, created_at DESC);
CREATE TABLE IF NOT EXISTS support_ticket_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    actor VARCHAR(255) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    from_status VARCHAR(16),
    to_status VARCHAR(16),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_ticket_events_ticket_idx ON support_ticket_events(ticket_id, created_at DESC);
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trader_id UUID NOT NULL,
    type VARCHAR(80) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'info',
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS severity VARCHAR(16) NOT NULL DEFAULT 'info';
CREATE INDEX IF NOT EXISTS notifications_trader_idx ON notifications(trader_id, created_at DESC);
CREATE TABLE IF NOT EXISTS notification_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    trader_id UUID NOT NULL,
    actor VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(notification_id, trader_id)
);
CREATE INDEX IF NOT EXISTS notification_reads_trader_idx ON notification_reads(trader_id, created_at DESC);
CREATE OR REPLACE FUNCTION prevent_support_history_mutation()
RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'support history is append-only'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS notifications_append_only ON notifications;
CREATE TRIGGER notifications_append_only BEFORE UPDATE OR DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION prevent_support_history_mutation();
DROP TRIGGER IF EXISTS support_ticket_events_append_only ON support_ticket_events;
CREATE TRIGGER support_ticket_events_append_only BEFORE UPDATE OR DELETE ON support_ticket_events
FOR EACH ROW EXECUTE FUNCTION prevent_support_history_mutation();
DROP TRIGGER IF EXISTS notification_reads_append_only ON notification_reads;
CREATE TRIGGER notification_reads_append_only BEFORE UPDATE OR DELETE ON notification_reads
FOR EACH ROW EXECUTE FUNCTION prevent_support_history_mutation();
