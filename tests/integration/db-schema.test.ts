import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Migration: Core Identity & Multi-Tenancy Schema', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260913000001_core_identity.sql'
  );

  it('should have migration file created', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('should be wrapped in an atomic transaction (BEGIN ... COMMIT)', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql.trim().startsWith('BEGIN;')).toBe(true);
    expect(sql.trim().endsWith('COMMIT;')).toBe(true);
  });

  it('should define organizations table with slug regex check constraint', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS organizations');
    expect(sql).toMatch(/slug\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i);
    expect(sql).toContain("CHECK (slug ~ '^[a-z0-9-]+$')");
  });

  it('should define profiles table supporting nullable user_id for shadow/unclaimed residents', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS profiles');
    expect(sql).toContain('is_unclaimed BOOLEAN');
    // Ensure user_id is NOT marked as NOT NULL (it must support NULL)
    expect(sql).not.toMatch(/user_id\s+UUID\s+NOT\s+NULL/i);
  });

  it('should define organization_members with foreign keys and unique constraint', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS organization_members');
    expect(sql).toContain('organization_id UUID');
    expect(sql).toContain('profile_id UUID');
    expect(sql).toContain('role_id UUID');
    expect(sql).toContain('UNIQUE (organization_id, profile_id)');
  });

  it('should define default roles and seed initial system permissions', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS roles');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS permissions');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS role_permissions');

    const defaultRoles = [
      'Owner',
      'Admin',
      'Chair',
      'Secretary',
      'Treasurer',
      'Coordinator',
      'Member',
      'Viewer',
    ];
    for (const role of defaultRoles) {
      expect(sql).toContain(role);
    }
  });
});
