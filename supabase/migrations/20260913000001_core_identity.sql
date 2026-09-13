BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  template TEXT NOT NULL DEFAULT 'custom' CHECK (template IN ('rt', 'rw', 'karang_taruna', 'pemuda', 'komunitas', 'custom')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- 2. Profiles table (supports both claimed users and unclaimed shadow resident records)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Nullable to allow unclaimed resident profiles before signup
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  is_unclaimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- 3. Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Role-Permission junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 6. Organization Members table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  UNIQUE (organization_id, profile_id)
);

-- Seed System Roles
INSERT INTO roles (name, description, is_system) VALUES
  ('Owner', 'Pemilik organisasi dengan akses penuh', true),
  ('Admin', 'Administrator teknis dan pengelola modul organisasi', true),
  ('Chair', 'Ketua organisasi dengan wewenang persetujuan anggaran dan kebijakan', true),
  ('Vice Chair', 'Wakil ketua organisasi', true),
  ('Secretary', 'Sekretaris pengelola data anggota, surat, dan notulen rapat', true),
  ('Treasurer', 'Bendahara pengelola kas, iuran, dan pembukuan keuangan', true),
  ('Coordinator', 'Koordinator program kerja atau seksi kegiatan', true),
  ('Member', 'Anggota/warga komunitas aktif', true),
  ('Viewer', 'Hanya melihat informasi publik/terbatas', true)
ON CONFLICT (name) DO NOTHING;

-- Seed Standard Permissions
INSERT INTO permissions (key, module, description) VALUES
  ('members.read', 'people', 'Melihat direktori anggota/warga'),
  ('members.manage', 'people', 'Menambah, mengedit, dan mengarsipkan data anggota'),
  ('finance.read', 'finance', 'Melihat laporan dan transaksi kas'),
  ('finance.create', 'finance', 'Mencatat pengajuan transaksi/pengeluaran kas'),
  ('finance.approve', 'finance', 'Menyetujui pengeluaran kas (Ketua)'),
  ('finance.post', 'finance', 'Memposting transaksi kas resmi ke buku kas (Bendahara)'),
  ('dues.manage', 'dues', 'Mengelola rencana iuran dan verifikasi pembayaran iuran'),
  ('activities.manage', 'activities', 'Membuat dan mengelola kegiatan/acara'),
  ('tasks.manage', 'tasks', 'Membuat, menugaskan, dan memperbarui status task'),
  ('documents.manage', 'documents', 'Mengunggah dan mengelola berkas organisasi'),
  ('settings.manage', 'settings', 'Mengubah konfigurasi dan template organisasi')
ON CONFLICT (key) DO NOTHING;

-- Map Full Permissions to Owner and Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Owner', 'Admin')
ON CONFLICT DO NOTHING;

-- Map Chair Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'Chair' AND p.key IN (
  'members.read', 'finance.read', 'finance.approve', 'activities.manage', 'tasks.manage', 'documents.manage'
)
ON CONFLICT DO NOTHING;

-- Map Treasurer Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'Treasurer' AND p.key IN (
  'members.read', 'finance.read', 'finance.create', 'finance.post', 'dues.manage', 'documents.manage'
)
ON CONFLICT DO NOTHING;

-- Map Secretary Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'Secretary' AND p.key IN (
  'members.read', 'members.manage', 'activities.manage', 'tasks.manage', 'documents.manage'
)
ON CONFLICT DO NOTHING;

-- Map Member Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'Member' AND p.key IN (
  'members.read', 'finance.read'
)
ON CONFLICT DO NOTHING;

COMMIT;
