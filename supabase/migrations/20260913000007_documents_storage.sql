BEGIN;

-- ==============================================================================
-- Migration: Document Hierarchy & Supabase Private Storage Configuration
-- Version: 20260913000007
-- Description:
--   1. Document Folders table with self-referencing tree hierarchy.
--   2. Documents metadata table linked to storage bucket and tenant.
--   3. Supabase storage bucket registration (org-documents, payment-proofs).
--   4. Strict Row-Level Security (RLS) policies for tenant data isolation.
-- ==============================================================================

-- 1. Document Folders Table
CREATE TABLE IF NOT EXISTS document_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_folders_org_parent
    ON document_folders (organization_id, parent_id);

-- 2. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    storage_bucket TEXT NOT NULL DEFAULT 'org-documents',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_documents_org_folder
    ON documents (organization_id, folder_id);

CREATE INDEX IF NOT EXISTS idx_documents_deleted_at
    ON documents (deleted_at)
    WHERE deleted_at IS NULL;

-- 3. Register Storage Buckets (Private by Default)
-- Insert private buckets into Supabase storage schema if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'storage' AND table_name = 'buckets'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES 
            ('org-documents', 'org-documents', false),
            ('payment-proofs', 'payment-proofs', false)
        ON CONFLICT (id) DO UPDATE SET public = false;
    END IF;
END $$;

-- 4. Row Level Security Policies
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policies for document_folders
DROP POLICY IF EXISTS "Members can view org folders" ON document_folders;
CREATE POLICY "Members can view org folders"
    ON document_folders
    FOR SELECT
    USING (organization_id IN (SELECT get_auth_user_org_ids()));

DROP POLICY IF EXISTS "Members can insert org folders" ON document_folders;
CREATE POLICY "Members can insert org folders"
    ON document_folders
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT get_auth_user_org_ids()));

DROP POLICY IF EXISTS "Members can update org folders" ON document_folders;
CREATE POLICY "Members can update org folders"
    ON document_folders
    FOR UPDATE
    USING (organization_id IN (SELECT get_auth_user_org_ids()));

DROP POLICY IF EXISTS "Members can delete org folders" ON document_folders;
CREATE POLICY "Members can delete org folders"
    ON document_folders
    FOR DELETE
    USING (organization_id IN (SELECT get_auth_user_org_ids()));

-- Policies for documents
DROP POLICY IF EXISTS "Members can view org documents" ON documents;
CREATE POLICY "Members can view org documents"
    ON documents
    FOR SELECT
    USING (
        organization_id IN (SELECT get_auth_user_org_ids())
        AND deleted_at IS NULL
    );

DROP POLICY IF EXISTS "Members can insert org documents" ON documents;
CREATE POLICY "Members can insert org documents"
    ON documents
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT get_auth_user_org_ids()));

DROP POLICY IF EXISTS "Members can update org documents" ON documents;
CREATE POLICY "Members can update org documents"
    ON documents
    FOR UPDATE
    USING (organization_id IN (SELECT get_auth_user_org_ids()));

DROP POLICY IF EXISTS "Members can delete org documents" ON documents;
CREATE POLICY "Members can delete org documents"
    ON documents
    FOR DELETE
    USING (organization_id IN (SELECT get_auth_user_org_ids()));

COMMIT;
