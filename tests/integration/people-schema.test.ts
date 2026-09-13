import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Migration: People & Teams Schema', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260913000003_people_schema.sql'
  );

  it('should have people migration file created', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('should be wrapped in an atomic transaction (BEGIN ... COMMIT)', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql.trim().startsWith('BEGIN;')).toBe(true);
    expect(sql.trim().endsWith('COMMIT;')).toBe(true);
  });

  it('should define teams table with organization foreign key', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS teams');
    expect(sql).toContain('organization_id UUID NOT NULL REFERENCES organizations(id)');
  });

  it('should define team_members junction table', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS team_members');
    expect(sql).toContain('team_id UUID NOT NULL REFERENCES teams(id)');
    expect(sql).toContain('member_id UUID NOT NULL REFERENCES organization_members(id)');
  });

  it('should add demographic fields to profiles for resident tracking', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toMatch(/house_number|rt_number|rw_number|resident_status/);
  });

  it('should enable RLS and define tenant isolation policies on teams and team_members', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('ALTER TABLE teams ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('get_auth_user_org_ids()');
  });
});
