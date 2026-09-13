BEGIN;

-- ==============================================================================
-- Migration: Immutable Audit Logs & Notifications Schema
-- Version: 20260913000008
-- Description:
--   1. Append-only immutable audit_logs table for compliance and history tracking.
--   2. PostgreSQL trigger invariant: prevent UPDATE and DELETE on audit_logs.
--   3. In-app notifications table for user alerts and action items.
--   4. Strict Row-Level Security (RLS) policies for multi-tenant data isolation.
-- ==============================================================================

-- 1. Audit Logs Table (Append-Only)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created
    ON audit_logs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit_logs (organization_id, entity_type, entity_id);

-- 2. PostgreSQL Invariant Trigger: Immutable Audit Logs
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'urgent')),
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_org_read
    ON notifications (user_id, organization_id, is_read, created_at DESC);

-- 4. Row Level Security Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for audit_logs
DROP POLICY IF EXISTS "Members can view org audit logs" ON audit_logs;
CREATE POLICY "Members can view org audit logs"
    ON audit_logs
    FOR SELECT
    USING (organization_id IN (SELECT get_auth_user_org_ids()));

DROP POLICY IF EXISTS "Members can insert org audit logs" ON audit_logs;
CREATE POLICY "Members can insert org audit logs"
    ON audit_logs
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT get_auth_user_org_ids()));

-- Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
    ON notifications
    FOR SELECT
    USING (
        organization_id IN (SELECT get_auth_user_org_ids())
        AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Members can insert notifications" ON notifications;
CREATE POLICY "Members can insert notifications"
    ON notifications
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT get_auth_user_org_ids()));

DROP POLICY IF EXISTS "Users can update their own notification read status" ON notifications;
CREATE POLICY "Users can update their own notification read status"
    ON notifications
    FOR UPDATE
    USING (
        organization_id IN (SELECT get_auth_user_org_ids())
        AND user_id = auth.uid()
    );

COMMIT;
