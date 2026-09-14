BEGIN;

-- ==============================================================================
-- Seed Data: Realistic Indonesian Community Organizations
-- Organisasi 1: RT 05 RW 02 Kelurahan Sukamaju (Template RT)
-- Organisasi 2: Karang Taruna Muda Berkarya (Template Karang Taruna)
-- ==============================================================================

-- 1. Organizations
-- Sesuai schema 20260913000001_core_identity: id, name, slug, template, settings
INSERT INTO organizations (id, name, slug, template, settings)
VALUES
    ('11111111-1111-4111-8111-111111111111', 'RT 05 RW 02 Kelurahan Sukamaju', 'rt05-rw02', 'rt', '{"description": "Rukun Tetangga 05 RW 02 Kelurahan Sukamaju, Kecamatan Sukadamai"}'::jsonb),
    ('22222222-2222-4222-8222-222222222222', 'Karang Taruna Muda Berkarya', 'kt-muda-berkarya', 'karang_taruna', '{"description": "Wadah kepemudaan aktif dan kreatif tingkat RW"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, settings = EXCLUDED.settings;

-- 2. Profiles (Warga & Pengurus)
-- Sesuai schema 20260913000001_core_identity & 20260913000003_people_schema:
-- id, full_name, phone, address, house_number, rt_number, rw_number, resident_status, is_unclaimed
INSERT INTO profiles (id, full_name, phone, address, house_number, rt_number, rw_number, resident_status, is_unclaimed)
VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Bambang Sudibyo', '081234567890', 'Jl. Merdeka No. 12', '12', '05', '02', 'tetap', false),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Siti Rahma', '081398765432', 'Jl. Merdeka No. 14', '14', '05', '02', 'tetap', false),
    ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Agus Santoso', '081512345678', 'Jl. Merdeka No. 15B', '15B', '05', '02', 'tetap', false),
    ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Budi Santoso', '081787654321', 'Jl. Pemuda No. 03', '03', '05', '02', 'tetap', false)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, address = EXCLUDED.address;

-- 3. Organization Members (Warga & Pengurus Terdaftar di Organisasi)
-- Sesuai schema 20260913000001_core_identity: id, organization_id, profile_id, role_id, status
INSERT INTO organization_members (id, organization_id, profile_id, role_id, status)
VALUES
    ('e1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', (SELECT id FROM roles WHERE name = 'Chair' LIMIT 1), 'active'),
    ('e2222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', (SELECT id FROM roles WHERE name = 'Treasurer' LIMIT 1), 'active'),
    ('e3333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', (SELECT id FROM roles WHERE name = 'Member' LIMIT 1), 'active'),
    ('e4444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', (SELECT id FROM roles WHERE name = 'Chair' LIMIT 1), 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. Accounts (Kas & Bank)
-- Sesuai schema 20260913000005_finance_ledger: id, organization_id, name, type, balance, account_number
INSERT INTO accounts (id, organization_id, name, type, balance, account_number)
VALUES
    ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'Kas Operasional Tunai', 'cash', 2500000.00, NULL),
    ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'Rekening BCA RT 05', 'bank', 10000000.00, '5432109876')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 5. Transaction Categories (Kategori Kas)
-- Sesuai schema 20260913000005_finance_ledger: id, organization_id, name, type
INSERT INTO transaction_categories (id, organization_id, name, type)
VALUES
    ('c1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Iuran Warga & Donasi', 'income'),
    ('c2222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Operasional & Perbaikan Fasilitas', 'expense')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 6. Transactions
-- Sesuai schema 20260913000005_finance_ledger:
-- id, organization_id, account_id, category_id, amount, type, status, description, transaction_date
INSERT INTO transactions (id, organization_id, account_id, category_id, amount, type, status, description, transaction_date)
VALUES
    ('55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'c1111111-1111-4111-8111-111111111111', 450000.00, 'income', 'posted', 'Iuran Sampah Warga RT 05', '2026-09-01'),
    ('66666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'c2222222-2222-4222-8222-222222222222', 75000.00, 'expense', 'posted', 'Beli Lampu Gang', '2026-09-05'),
    ('77777777-1111-4777-8777-111111111111', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'c2222222-2222-4222-8222-222222222222', 750000.00, 'expense', 'pending_approval', 'Pengajuan Belanja Lampu Gang Seksi Sarpras', '2026-09-12')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, description = EXCLUDED.description, amount = EXCLUDED.amount;

-- 7. Due Plans & Items
-- Sesuai schema 20260913000005_finance_ledger:
-- due_plans: id, organization_id, title, amount, frequency, due_date
INSERT INTO due_plans (id, organization_id, title, amount, frequency, due_date)
VALUES
    ('77777777-7777-4777-8777-777777777777', '11111111-1111-4111-8111-111111111111', 'Iuran Bulanan September 2026', 50000.00, 'monthly', '2026-09-30')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, amount = EXCLUDED.amount;

-- due_items: id, organization_id, due_plan_id, member_id, amount, status
INSERT INTO due_items (id, organization_id, due_plan_id, member_id, amount, status)
VALUES
    ('88888888-8888-4888-8888-888888888888', '11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-777777777777', 'e1111111-1111-4111-8111-111111111111', 50000.00, 'paid'),
    ('99999999-9999-4999-8999-999999999999', '11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-777777777777', 'e2222222-2222-4222-8222-222222222222', 50000.00, 'pending_verification'),
    ('00000000-0000-4000-8000-000000000000', '11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-777777777777', 'e3333333-3333-4333-8333-333333333333', 50000.00, 'unpaid')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- payments: id, organization_id, due_item_id, amount, payment_method, proof_file_url
INSERT INTO payments (id, organization_id, due_item_id, amount, payment_method, proof_file_url)
VALUES
    ('baaaaaaa-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '99999999-9999-4999-8999-999999999999', 50000.00, 'transfer', 'https://placehold.co/600x400/png?text=Bukti+Transfer+Iuran')
ON CONFLICT (id) DO UPDATE SET amount = EXCLUDED.amount, proof_file_url = EXCLUDED.proof_file_url;

-- 8. Activities & Tasks
-- Sesuai schema 20260913000004_activities_tasks:
-- activities: id, organization_id, title, description, status, start_date, budget_estimate
INSERT INTO activities (id, organization_id, title, description, status, start_date, budget_estimate)
VALUES
    ('aaaaaaaa-1111-4aaa-8aaa-111111111111', '11111111-1111-4111-8111-111111111111', 'Peringatan Hari Kemerdekaan RI Ke-81', 'Perlombaan tradisional dan panggung gembira warga', 'active', '2026-08-17', 5000000.00)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- tasks: id, organization_id, activity_id, title, priority, status, due_date
INSERT INTO tasks (id, organization_id, activity_id, title, priority, status, due_date)
VALUES
    ('bbbbbbbb-1111-4bbb-8bbb-111111111111', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-1111-4aaa-8aaa-111111111111', 'Beli Lampu Gang dan Kabel', 'urgent', 'done', '2026-08-10'),
    ('cccccccc-1111-4ccc-8ccc-111111111111', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-1111-4aaa-8aaa-111111111111', 'Pasang Umbul-umbul dan Panggung', 'medium', 'in_progress', '2026-08-15')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- 9. Document Folders
-- Sesuai schema 20260913000007_documents_storage:
-- document_folders: id, organization_id, name, parent_id
INSERT INTO document_folders (id, organization_id, name, parent_id)
VALUES
    ('f1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Surat Masuk & Keluar', NULL),
    ('f2222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Laporan Keuangan & Iuran', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

COMMIT;
