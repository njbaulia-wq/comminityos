import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Migration: Finance Ledger & Dues Schema', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260913000005_finance_ledger.sql'
  );

  it('should have finance ledger migration file created', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('should be wrapped in an atomic transaction (BEGIN ... COMMIT)', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql.trim().startsWith('BEGIN;')).toBe(true);
    expect(sql.trim().endsWith('COMMIT;')).toBe(true);
  });

  it('should enforce numeric(14,2) or numeric(15,2) for currency, strictly banning float', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).not.toMatch(/float|double precision|real/i);
    expect(sql).toMatch(/NUMERIC\(\s*1[45]\s*,\s*2\s*\)/i);
  });

  it('should define transactions table with positive amount and strict status constraints', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS transactions');
    expect(sql).toMatch(/CHECK\s*\(\s*amount\s*>\s*0\s*\)/i);
    expect(sql).toMatch(
      /CHECK\s*\(\s*status\s+IN\s*\('draft',\s*'pending_approval',\s*'posted',\s*'void'\)\s*\)/i
    );
  });

  it('should define due_plans and due_items with valid foreign keys and status check', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS due_plans');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS due_items');
    expect(sql).toContain('due_plan_id UUID NOT NULL REFERENCES due_plans(id)');
    expect(sql).toContain('member_id UUID NOT NULL REFERENCES organization_members(id)');
    expect(sql).toMatch(
      /CHECK\s*\(\s*status\s+IN\s*\('unpaid',\s*'pending_verification',\s*'paid',\s*'waived'\)\s*\)/i
    );
  });

  it('should define payments table linking due_items and cash transactions', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS payments');
    expect(sql).toContain('due_item_id UUID NOT NULL REFERENCES due_items(id)');
    expect(sql).toContain('transaction_id UUID REFERENCES transactions(id)');
  });

  it('should enable RLS and apply tenant isolation policies on all 6 finance tables', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE due_plans ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE due_items ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE payments ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('get_auth_user_org_ids()');
  });
});
