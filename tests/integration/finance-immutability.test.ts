import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('PostgreSQL Invariants: Posted Transaction Immutability', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260913000006_finance_immutability.sql'
  );

  it('should have finance immutability migration file created', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('should be wrapped in an atomic transaction (BEGIN ... COMMIT)', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql.trim().startsWith('BEGIN;')).toBe(true);
    expect(sql.trim().endsWith('COMMIT;')).toBe(true);
  });

  it('should define a PostgreSQL trigger function to block modification of posted transactions', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION prevent_posted_transaction_modification');
    expect(sql).toContain('RAISE EXCEPTION');
    expect(sql).toContain('Cannot modify a posted transaction');
  });

  it('should attach trigger BEFORE UPDATE OR DELETE on transactions table', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TRIGGER trg_posted_transaction_immutable');
    expect(sql).toContain('BEFORE UPDATE OR DELETE ON transactions');
    expect(sql).toContain('FOR EACH ROW');
    expect(sql).toContain('EXECUTE FUNCTION prevent_posted_transaction_modification()');
  });
});
