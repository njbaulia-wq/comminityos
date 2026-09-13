import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Row-Level Security (RLS) Multi-Tenant Policies', () => {
  const rlsMigrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260913000002_core_rls.sql'
  );

  it('should have RLS migration file created', () => {
    expect(fs.existsSync(rlsMigrationPath)).toBe(true);
  });

  it('should enable row level security on all tenant-facing tables', () => {
    const sql = fs.readFileSync(rlsMigrationPath, 'utf-8');
    expect(sql).toContain('ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;');
  });

  it('should define helper functions to resolve auth user organization memberships', () => {
    const sql = fs.readFileSync(rlsMigrationPath, 'utf-8');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION get_auth_user_org_ids');
    expect(sql).toContain('auth.uid()');
  });

  it('should enforce tenant isolation on organizations select policy', () => {
    const sql = fs.readFileSync(rlsMigrationPath, 'utf-8');
    expect(sql).toContain('CREATE POLICY "org_member_read_org"');
    expect(sql).toContain('deleted_at IS NULL');
  });

  it('should enforce strict update policy on organizations for Admin and Owner only', () => {
    const sql = fs.readFileSync(rlsMigrationPath, 'utf-8');
    expect(sql).toContain('CREATE POLICY "org_admin_update_org"');
    expect(sql).toMatch(/Owner|Admin/);
  });

  it('should isolate profiles so users only view members in their shared organizations', () => {
    const sql = fs.readFileSync(rlsMigrationPath, 'utf-8');
    expect(sql).toContain('CREATE POLICY "shared_org_members_read_profile"');
  });
});
