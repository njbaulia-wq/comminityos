import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Migration: Document Hierarchy & Supabase Storage', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260913000007_documents_storage.sql'
  );

  it('should have documents & storage migration file created', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('should be wrapped in an atomic transaction (BEGIN ... COMMIT)', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql.trim().startsWith('BEGIN;')).toBe(true);
    expect(sql.trim().endsWith('COMMIT;')).toBe(true);
  });

  it('should define document_folders table with self-referencing parent_id and organization isolation', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS document_folders');
    expect(sql).toContain('organization_id UUID NOT NULL REFERENCES organizations(id)');
    expect(sql).toContain('parent_id UUID REFERENCES document_folders(id) ON DELETE CASCADE');
  });

  it('should define documents table with metadata and storage attributes', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS documents');
    expect(sql).toContain('organization_id UUID NOT NULL REFERENCES organizations(id)');
    expect(sql).toContain('folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL');
    expect(sql).toContain('file_path TEXT NOT NULL');
    expect(sql).toContain('file_size INTEGER NOT NULL');
    expect(sql).toContain('mime_type TEXT NOT NULL');
    expect(sql).toContain('storage_bucket TEXT NOT NULL DEFAULT \'org-documents\'');
    expect(sql).toContain('is_archived BOOLEAN NOT NULL DEFAULT false');
  });

  it('should initialize private storage buckets org-documents and payment-proofs', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('INSERT INTO storage.buckets');
    expect(sql).toContain('org-documents');
    expect(sql).toContain('payment-proofs');
    expect(sql).toContain('public');
  });

  it('should enable RLS on document tables with tenant isolation policies', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE documents ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('get_auth_user_org_ids()');
  });
});
