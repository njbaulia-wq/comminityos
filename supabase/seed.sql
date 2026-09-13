BEGIN;

-- ==============================================================================
-- Seed Data: Realistic Indonesian Community Organizations
-- Organisasi 1: RT 05 RW 02 Kelurahan Sukamaju (Template RT)
-- Organisasi 2: Karang Taruna Muda Berkarya (Template Karang Taruna)
-- ==============================================================================

-- 1. Organizations
INSERT INTO organizations (id, name, slug, template, description)
VALUES
    ('11111111-1111-4111-8111-111111111111', 'RT 05 RW 02 Kelurahan Sukamaju', 'rt05-rw02', 'rt', 'Rukun Tetangga 05 RW 02 Kelurahan Sukamaju, Kecamatan Sukadamai'),
    ('22222222-2222-4222-8222-222222222222', 'Karang Taruna Muda Berkarya', 'kt-muda-berkarya', 'karang_taruna', 'Wadah kepemudaan aktif dan kreatif tingkat RW')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- 2. Profiles (Warga & Pengurus)
INSERT INTO profiles (id, full_name, email, phone, address, house_number, rt, rw, is_unclaimed)
VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Bambang Sudibyo', 'bambang.rt05@communityos.local', '081234567890', 'Jl. Merdeka No. 12', '12', '05', '02', false),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Siti Rahma', 'siti.rahma@communityos.local', '081398765432', 'Jl. Merdeka No. 14', '14', '05', '02', false),
    ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Agus Santoso', 'agus.santoso@communityos.local', '081512345678', 'Jl. Merdeka No. 15B', '15B', '05', '02', false),
    ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Budi Santoso', 'budi.kt@communityos.local', '081787654321', 'Jl. Pemuda No. 03', '03', '05', '02', false)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 3. Accounts (Kas & Bank)
INSERT INTO accounts (id, organization_id, name, type, balance, account_number)
VALUES
    ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'Kas Operasional Tunai', 'cash', 2500000.00, NULL),
    ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'Rekening BCA RT 05', 'bank', 10000000.00, '5432109876')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 4. Transactions
INSERT INTO transactions (id, organization_id, account_id, amount, type, status, description, transaction_date)
VALUES
    ('55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 450000.00, 'income', 'posted', 'Iuran Sampah Warga RT 05', '2026-09-01'),
    ('66666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 75000.00, 'expense', 'posted', 'Beli Lampu Gang', '2026-09-05')
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;

-- 5. Due Plans & Items
INSERT INTO due_plans (id, organization_id, title, description, amount, frequency, due_date)
VALUES
    ('77777777-7777-4777-8777-777777777777', '11111111-1111-4111-8111-111111111111', 'Iuran Bulanan September 2026', 'Iuran kebersihan dan keamanan warga', 50000.00, 'monthly', '2026-09-30')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO due_items (id, organization_id, due_plan_id, citizen_id, amount, status)
VALUES
    ('88888888-8888-4888-8888-888888888888', '11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-777777777777', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 50000.00, 'paid'),
    ('99999999-9999-4999-8999-999999999999', '11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-777777777777', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 50000.00, 'pending_verification'),
    ('00000000-0000-4000-8000-000000000000', '11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-777777777777', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 50000.00, 'unpaid')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 6. Activities & Tasks
INSERT INTO activities (id, organization_id, title, description, status, start_date, budget_estimate)
VALUES
    ('aaaaaaaa-1111-4aaa-8aaa-111111111111', '11111111-1111-4111-8111-111111111111', 'Peringatan Hari Kemerdekaan RI Ke-81', 'Perlombaan tradisional dan panggung gembira warga', 'active', '2026-08-17', 5000000.00)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO tasks (id, organization_id, activity_id, title, priority, status, due_date)
VALUES
    ('bbbbbbbb-1111-4bbb-8bbb-111111111111', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-1111-4aaa-8aaa-111111111111', 'Beli Lampu Gang dan Kabel', 'urgent', 'done', '2026-08-10'),
    ('cccccccc-1111-4ccc-8ccc-111111111111', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-1111-4aaa-8aaa-111111111111', 'Pasang Umbul-umbul dan Panggung', 'medium', 'in_progress', '2026-08-15')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

COMMIT;
