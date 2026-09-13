import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Migration: Audit Logs & Notifications Schema', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260913000008_audit_notifications.sql'
  );

  it('should have audit logs and notifications migration file created', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('should be wrapped in an atomic transaction (BEGIN ... COMMIT)', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql.trim().startsWith('BEGIN;')).toBe(true);
    expect(sql.trim().endsWith('COMMIT;')).toBe(true);
  });

  it('should define audit_logs table with actor, action, entity, and jsonb metadata', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS audit_logs');
    expect(sql).toContain('organization_id UUID NOT NULL REFERENCES organizations(id)');
    expect(sql).toContain('actor_id UUID REFERENCES profiles(id)');
    expect(sql).toContain('action TEXT NOT NULL');
    expect(sql).toContain('entity_type TEXT NOT NULL');
    expect(sql).toContain('entity_id TEXT NOT NULL');
    expect(sql).toContain('metadata JSONB');
  });

  it('should create trigger preventing UPDATE or DELETE on audit_logs (append-only)', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION prevent_audit_log_modification()');
    expect(sql).toContain('Audit logs are immutable');
    expect(sql).toContain('CREATE TRIGGER trg_audit_logs_immutable');
    expect(sql).toMatch(/BEFORE\s+UPDATE\s+OR\s+DELETE\s+ON\s+audit_logs/i);
  });

  it('should define notifications table with user, type, and is_read status', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS notifications');
    expect(sql).toContain('organization_id UUID NOT NULL REFERENCES organizations(id)');
    expect(sql).toContain('user_id UUID NOT NULL REFERENCES profiles(id)');
    expect(sql).toContain('title TEXT NOT NULL');
    expect(sql).toContain('is_read BOOLEAN NOT NULL DEFAULT false');
  });

  it('should enable RLS on audit_logs and notifications', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('get_auth_user_org_ids()');
  });
});
