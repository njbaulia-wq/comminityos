import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { runSeed, SeedDataReport } from '@/server/db/seed';

describe('Realistic Indonesian Community Seed Data Script', () => {
  const seedSqlPath = path.resolve(process.cwd(), 'supabase/seed.sql');

  it('should have seed.sql file wrapped in an atomic transaction', () => {
    expect(fs.existsSync(seedSqlPath)).toBe(true);
    const sql = fs.readFileSync(seedSqlPath, 'utf-8');
    expect(sql.trim().startsWith('BEGIN;')).toBe(true);
    expect(sql.trim().endsWith('COMMIT;')).toBe(true);
  });

  it('should seed RT 05 RW 02 and Karang Taruna Muda Berkarya organizations', () => {
    const sql = fs.readFileSync(seedSqlPath, 'utf-8');
    expect(sql).toContain('RT 05 RW 02');
    expect(sql).toContain('rt05-rw02');
    expect(sql).toContain('Karang Taruna Muda Berkarya');
    expect(sql).toContain('kt-muda-berkarya');
  });

  it('should seed realistic Indonesian residents, activities, and tasks', () => {
    const sql = fs.readFileSync(seedSqlPath, 'utf-8');
    expect(sql).toContain('Bambang Sudibyo');
    expect(sql).toContain('Siti Rahma');
    expect(sql).toContain('Peringatan Hari Kemerdekaan');
    expect(sql).toContain('Beli Lampu Gang');
  });

  it('should seed financial accounts, ledger transactions, and dues plans', () => {
    const sql = fs.readFileSync(seedSqlPath, 'utf-8');
    expect(sql).toContain('Kas Operasional Tunai');
    expect(sql).toContain('Iuran Bulanan');
    expect(sql).toContain('due_plans');
    expect(sql).toContain('due_items');
  });

  it('should run programmatic seed function without errors and report seeded counts', async () => {
    const report: SeedDataReport = await runSeed();

    expect(report.organizations).toBeGreaterThanOrEqual(2);
    expect(report.profiles).toBeGreaterThanOrEqual(4);
    expect(report.transactions).toBeGreaterThanOrEqual(2);
    expect(report.activities).toBeGreaterThanOrEqual(1);
    expect(report.tasks).toBeGreaterThanOrEqual(2);
  });
});
