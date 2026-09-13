import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Migration: Activities & Tasks Schema', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260913000004_activities_tasks.sql'
  );

  it('should have activities and tasks migration file created', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('should be wrapped in an atomic transaction (BEGIN ... COMMIT)', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql.trim().startsWith('BEGIN;')).toBe(true);
    expect(sql.trim().endsWith('COMMIT;')).toBe(true);
  });

  it('should define activities table with status and non-negative budget constraints', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS activities');
    expect(sql).toContain('organization_id UUID NOT NULL REFERENCES organizations(id)');
    expect(sql).toMatch(/CHECK\s*\(\s*status\s+IN\s*\('draft',\s*'planned',\s*'active',\s*'completed',\s*'cancelled'\)\s*\)/i);
    expect(sql).toMatch(/budget_estimate.*CHECK\s*\(\s*budget_estimate\s*>=\s*0\s*\)/i);
  });

  it('should define activity_members junction table with cascade deletion', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS activity_members');
    expect(sql).toContain('activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE');
    expect(sql).toContain('member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE');
  });

  it('should define tasks table with status, priority, and relations', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS tasks');
    expect(sql).toContain('organization_id UUID NOT NULL REFERENCES organizations(id)');
    expect(sql).toMatch(/CHECK\s*\(\s*status\s+IN\s*\('todo',\s*'in_progress',\s*'done'\)\s*\)/i);
    expect(sql).toMatch(/CHECK\s*\(\s*priority\s+IN\s*\('low',\s*'medium',\s*'high',\s*'urgent'\)\s*\)/i);
    expect(sql).toContain('activity_id UUID REFERENCES activities(id)');
    expect(sql).toContain('assignee_id UUID REFERENCES organization_members(id)');
  });

  it('should define task_checklists table with foreign key to tasks', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS task_checklists');
    expect(sql).toContain('task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE');
    expect(sql).toContain('is_done BOOLEAN NOT NULL DEFAULT false');
  });

  it('should enable RLS and apply tenant isolation policies to all tables', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('ALTER TABLE activities ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE activity_members ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE task_checklists ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('get_auth_user_org_ids()');
  });
});
