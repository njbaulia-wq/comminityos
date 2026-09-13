BEGIN;

-- 1. Accounts (Kas Tunai & Rekening Bank)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank')),
  balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  account_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- 2. Transaction Categories (Kategori Pemasukan / Pengeluaran)
CREATE TABLE IF NOT EXISTS transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Transactions (Buku Kas Umum)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'posted', 'void')),
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- 4. Due Plans (Rencana Iuran Warga)
CREATE TABLE IF NOT EXISTS due_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'one_time', 'yearly')),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- 5. Due Items (Tagihan per Anggota / Warga)
CREATE TABLE IF NOT EXISTS due_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  due_plan_id UUID NOT NULL REFERENCES due_plans(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'pending_verification', 'paid', 'waived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Payments (Pencatatan Pembayaran Iuran & Bukti Transfer)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  due_item_id UUID NOT NULL REFERENCES due_items(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer')),
  proof_file_url TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_by UUID REFERENCES organization_members(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Enable Row-Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE due_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE due_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
CREATE POLICY "org_members_read_accounts" ON accounts
  FOR SELECT USING (
    organization_id IN (SELECT org_id FROM get_auth_user_org_ids()) AND deleted_at IS NULL
  );

CREATE POLICY "org_admin_manage_accounts" ON accounts
  FOR ALL USING (is_org_admin(organization_id));

CREATE POLICY "org_members_read_categories" ON transaction_categories
  FOR SELECT USING (
    organization_id IN (SELECT org_id FROM get_auth_user_org_ids())
  );

CREATE POLICY "org_admin_manage_categories" ON transaction_categories
  FOR ALL USING (is_org_admin(organization_id));

CREATE POLICY "org_members_read_transactions" ON transactions
  FOR SELECT USING (
    organization_id IN (SELECT org_id FROM get_auth_user_org_ids()) AND deleted_at IS NULL
  );

CREATE POLICY "org_admin_manage_transactions" ON transactions
  FOR ALL USING (is_org_admin(organization_id));

CREATE POLICY "org_members_read_due_plans" ON due_plans
  FOR SELECT USING (
    organization_id IN (SELECT org_id FROM get_auth_user_org_ids()) AND deleted_at IS NULL
  );

CREATE POLICY "org_admin_manage_due_plans" ON due_plans
  FOR ALL USING (is_org_admin(organization_id));

CREATE POLICY "org_members_read_due_items" ON due_items
  FOR SELECT USING (
    organization_id IN (SELECT org_id FROM get_auth_user_org_ids())
  );

CREATE POLICY "org_admin_manage_due_items" ON due_items
  FOR ALL USING (is_org_admin(organization_id));

CREATE POLICY "org_members_read_payments" ON payments
  FOR SELECT USING (
    organization_id IN (SELECT org_id FROM get_auth_user_org_ids())
  );

CREATE POLICY "org_admin_manage_payments" ON payments
  FOR ALL USING (is_org_admin(organization_id));

COMMIT;
