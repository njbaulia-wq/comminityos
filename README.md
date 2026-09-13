# Community OS

<div align="center">

![Community OS Banner](https://raw.githubusercontent.com/njbaulia-wq/comminityos/main/public/banner.png)

**Sistem Operasi Manajemen Organisasi Lokal & Komunitas Indonesia**  
*Platform multi-tenant yang rapi, transparan, aman, dan akuntabel untuk RT, RW, Karang Taruna, paguyuban, dan perkumpulan pemuda.*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-336791?style=flat-square&logo=postgresql)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-322_Passed_(100%25)-success?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Security](https://img.shields.io/badge/OWASP-Hardened_Top_10-blue?style=flat-square&logo=shield)](https://owasp.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 1. Tentang Produk

**Community OS** diciptakan untuk menyelesaikan problem kronis organisasi lokal di Indonesia: **fragmentasi data dan alur kerja** yang tercecer di grup WhatsApp, spreadsheet terpisah, buku kas fisik, dokumen kertas, dan ingatan personal pengurus.

> *"Organisasi tidak dipaksa mengikuti struktur aplikasi. Aplikasi mengikuti cara organisasi bekerja."*

Community OS bukan sekadar aplikasi pencatat kas RT dan bukan ERP korporat yang rumit. Inti dari platform ini adalah kombinasi: **Record + Relation + Workflow + Permission + Audit + Reporting**.

Sistem ini dirancang untuk menjawab 5 pertanyaan operasional fundamental secara instan:
1. **Siapa** yang terlibat dalam organisasi, kepengurusan, dan kepanitiaan?
2. **Apa** kegiatan dan tugas operasional yang sedang berjalan?
3. **Kapan** target tenggat waktu penyelesaiannya?
4. **Berapa** arus kas masuk, pengeluaran riil, dan saldo kas saat ini?
5. **Apa** keputusan rapat, persetujuan (*approval*), dan dokumen bukti sah pendukungnya?

---

## 2. Modul Utama (Core Features)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              COMMUNITY OS                               │
├───────────────┬───────────────┬────────────────┬────────────────────────┤
│   PEOPLE      │   FINANCE     │   ACTIVITIES   │   DOCUMENTS            │
│   DIRECTORY   │   & DUES      │   & TASKS      │   & STORAGE            │
├───────────────┼───────────────┼────────────────┼────────────────────────┤
│ • Warga RT/RW │ • Buku Kas    │ • Agenda Acara │ • Folder Privat        │
│ • Karang      │ • Mutasi Riil │ • PIC & Plafon │ • Bukti Transfer       │
│   Taruna      │ • Iuran Rutin │ • Papan Kanban │ • Signed URL           │
│ • Seksi/Divisi│ • Approval Rx │ • Checklist    │ • Role Access          │
└───────────────┴───────────────┴────────────────┴────────────────────────┘
```

### 1. Multi-Tenant Foundation & RBAC
- **Isolasi Penuh Antar-Organisasi:** Menggunakan PostgreSQL Row-Level Security (RLS) dengan kunci `organization_id` di setiap tabel.
- **Onboarding Cepat:** Pembuatan workspace organisasi baru dengan slug URL unik (`/[orgSlug]/...`) dan template bawaan (RT, RW, Karang Taruna, Organisasi Pemuda, Komunitas/Paguyuban, Custom).
- **Matriks Peran:** *Owner, Admin, Chair, Vice Chair, Secretary, Treasurer, Coordinator, Member, Viewer*.

### 2. Direktori Warga & Anggota (People Module)
- Profil data warga lengkap: Nama, Nomor Telepon Indonesia, Alamat, Nomor Rumah, RT/RW, dan Status Kependudukan (`tetap`, `kontrak`, `kost`, `pindah`, `meninggal`).
- Pengelompokan anggota ke dalam Tim / Seksi / Divisi kerja.
- Arsip riwayat anggota (*soft-delete*) yang menjaga integritas data historis.

### 3. Keuangan & Buku Kas Riil (Finance Ledger Module)
- **Prinsip Akuntabilitas Mutasi Kas:** Transaksi kas/bank berstatus `posted` bersifat **immutable** (tidak dapat diedit/dihapus langsung, diproteksi database trigger level PostgreSQL).
- **Alur Persetujuan Bertingkat (*Approval Workflow*):** Pengeluaran di atas batas plafon (`> Rp 1.000.000`) wajib disetujui Ketua sebelum dapat dibukukan oleh Bendahara.
- Multi-akun kas & bank dengan kalkulasi saldo mutasi otomatis.

### 4. Pelacak Iuran Warga (Dues Module)
- Pembuatan rencana iuran (*due plans*): nominal, periode (bulanan/tahunan/insidental), dan tenggat.
- Pelacakan status tagihan anggota (*unpaid, pending_verification, paid, waived*).
- Mekanisme unggah bukti transfer warga dan tombol verifikasi satu-klik oleh Bendahara yang otomatis menerbitkan mutasi kas masuk ke buku kas.

### 5. Program Kerja & Kegiatan (Activities Module)
- Perencanaan kegiatan terstruktur dengan status alur hidup: `draft`, `planned`, `active`, `completed`, `cancelled`.
- Penunjukan Penanggung Jawab (PIC) dan alokasi pagu estimasi anggaran.
- Relasi terpadu ke transaksi keuangan dan pengeluaran kegiatan.

### 6. Manajemen Tugas Operasional (Tasks Module)
- Pelacakan tugas harian maupun kepanitiaan dengan tampilan Papan Kanban dan Daftar.
- Status progres: `todo`, `in_progress`, `done`.
- Prioritas (`low`, `medium`, `high`, `urgent`), *assignee*, tenggat waktu, dan checklist butir pekerjaan interaktif.

### 7. Arsip Dokumen Privat (Documents Module)
- Struktur folder pohon tak terbatas untuk pengarsipan surat, notulen rapat, SK kepengurusan, dan LPJ.
- Integrasi Supabase Storage dengan bucket privat.
- Akses berkas berbasis *Time-limited Signed URL* yang kedaluwarsa secara otomatis untuk melindungi data sensitif warga.

### 8. Dasbor Ringkas & Notifikasi (Overview Module)
- **Action Queue:** Daftar persetujuan pengeluaran tertunda untuk Ketua dan verifikasi iuran untuk Bendahara.
- **Finance Snapshot:** Visibilitas saldo kas riil dan perbandingan penerimaan vs pengeluaran bulan berjalan.
- **Agenda Terdekat:** Jadwal kegiatan dan tenggat tugas operasional dalam waktu dekat.
- Notifikasi internal sistem untuk tugas baru, tagihan iuran, dan permintaan persetujuan.

### 9. Log Audit Tak Berubah (Audit Trail Module)
- Pencatatan seluruh mutasi kritis secara terpusat (*immutable audit log*): perubahan role anggota, persetujuan pengeluaran, posting mutasi kas, dan pembatalan transaksi.

---

## 3. Standar Keamanan & Perlindungan Data (OWASP Hardened)

Sistem telah diaudit dan diperkuat terhadap standar keamanan **OWASP Top 10**:

- **Injeksi HTTP Security Headers:**
  - `Content-Security-Policy`: Pembatasan eksekusi skrip inline berbahaya, frame ancestors, dan white-listing koneksi Supabase.
  - `X-Frame-Options: DENY`: Perlindungan penuh terhadap serangan *Clickjacking*.
  - `X-Content-Type-Options: nosniff`: Mencegah sniffing tipe MIME file.
  - `Strict-Transport-Security`: HSTS preload aktif untuk memastikan seluruh lalu lintas berjalan di atas HTTPS.
  - `Permissions-Policy`: Menonaktifkan API perangkat keras sensitif (kamera, mikrofon, geolokasi) yang tidak digunakan.
- **Penyembunyian Data Pribadi Sensitif (Deep PII Masking):**
  - Seluruh output log terstruktur JSON secara otomatis menyamarkan data sensitif seperti nomor rekening bank lokal Indonesia (`noRekening`, `nomorRekening`, `bankAccount`), kredensial otentikasi (`password`, `pin`, `cvv`, `jwt`, `token`), serta deteksi nilai string NIK 16 digit (`^\d{16}$`).
- **Pencegahan Cross-Site Scripting (XSS):**
  - Validasi ketat di layer boundary menggunakan Zod [`safeTextSchema`](file:///workspaces/comminityos/src/lib/validation/common.schema.ts#L14-L31) yang menolak tag `<script>`, payload `<svg/onload>`, dan protokol berbahaya `javascript:`.
- **Validasi Boundary Parameter:**
  - Seluruh argumen Server Actions divalidasi format ID-nya (`validateActionParams`), mencegah injeksi *Path Traversal* (`../`) dan parameter malformed.
- **Isolasi Error Sistem (Anti-Data Leak):**
  - Error database internal atau *stack trace* teknis tidak pernah dibocorkan ke pengguna. Klien hanya menerima respons terstandar `ActionResult<T>` dengan pesan ramah berbahasa Indonesia.

---

## 4. Batasan Tegas (Explicit Non-Goals)

Untuk menjaga fokus, performa, kecepatan rilis, dan kemudahan penggunaan bagi pengurus lokal, hal-hal berikut **SECARA EKSPLISIT DILARANG** dibangun pada fase MVP:

1. **Dilarang Full Accounting ERP & Payroll:** Tidak ada akuntansi debet-kredit akrual korporat yang rumit, depresiasi aset tetap, neraca saldo korporat, perpajakan PPh/PPN, dan slip gaji karyawan.
2. **Dilarang In-App Chatting / WhatsApp Replacement:** Tidak ada ruang chat grup, pesan instan real-time, atau panggilan WebRTC di dalam aplikasi. Komunikasi percakapan warga tetap menggunakan WhatsApp.
3. **Dilarang Complex CRM & Marketing Automation:** Tidak ada sales pipeline, lead scoring, atau email blast marketing.
4. **Dilarang Native Mobile App (iOS / Android):** Akses mobile dipenuhi 100% via *Responsive Web Application* yang ringan di browser ponsel.
5. **Dilarang Media Sosial Publik:** Tidak ada feed beranda gaya media sosial, tombol like, algoritma rekomendasi, atau follower.
6. **Dilarang E-Commerce / Marketplace:** Tidak ada etalase belanja, keranjang (*cart*), atau katalog UMKM online.
7. **Dilarang Payment Gateway Otomatis di MVP:** Pembayaran dilakukan melalui transfer bank manual / tunai + unggah bukti transfer yang diverifikasi oleh Bendahara.
8. **Dilarang Autonomous AI Agents:** Tidak ada AI otonom yang dapat memutasi database, menyetujui anggaran, atau memposting transaksi kas secara sepihak tanpa kontrol manusia.
9. **Dilarang Web3 / Crypto / Blockchain:** Tidak ada dompet kripto, token komunitas, atau smart contract.
10. **Anti-Bloat Engineering:** Bebas dari dependensi npm yang tidak perlu (hanya 8 pustaka produksi esensial).

---

## 5. Arsitektur Teknis & Tech Stack

```
                        ┌────────────────────────┐
                        │      WEB CLIENT        │
                        │ (Browser / Mobile Web) │
                        └───────────┬────────────┘
                                    │ HTTPS + OWASP Headers
                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 16 (APP ROUTER)                      │
│                                                                  │
│  [LAYER 1: PRESENTATION & ROUTES]                                │
│  ├── Server Components (RSC: data fetching, layout shell)        │
│  ├── Client Components (interaktif: forms, modal, boards)        │
│  ├── Server Actions (mutasi data terisolasi & terstandar)        │
│  └── Public Auth Pages (/login, /signup, /forbidden, /)          │
│                                   │                              │
│                                   ▼                              │
│  [LAYER 2: SERVICE & DOMAIN LOGIC]                               │
│  ├── Boundary Validation (Zod safeTextSchema & ActionParams)     │
│  ├── Authentication & Session Guard                              │
│  ├── Authorization & RBAC Guard (`assertPermission`)             │
│  ├── Domain Invariant & Business Rules Execution                 │
│  ├── Audit Log Dispatcher                                        │
│  └── Centralized Structured JSON Logger                          │
└───────────────────────────────────┬──────────────────────────────┘
                                    │ Scoped Authenticated JWT
                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  [LAYER 3: DATA ACCESS & STORAGE]                                │
│  ├── Supabase PostgREST Client                                   │
│  ├── PostgreSQL 16 (Row-Level Security Policies per Tenant)      │
│  │   ├── Immutable Ledger Triggers                               │
│  │   └── Relational Constraints & Cascades                       │
│  └── Supabase Storage (Private Buckets: Dokumen & Bukti Bayar)   │
└──────────────────────────────────────────────────────────────────┘
```

### Rincian Teknologi:
- **Frontend Framework:** [Next.js 16.3.5](https://nextjs.org/) (App Router, Turbopack)
- **UI Engine:** [React 19](https://react.dev/)
- **Bahasa:** [TypeScript 5.7.3](https://www.typescriptlang.org/) (Strict Mode)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + prinsip desain Geist (bersih, kontras tinggi, densitas data efisien)
- **Ikonografi:** [Lucide React](https://lucide.dev/)
- **Validasi Boundary:** [Zod 3.24](https://zod.dev/)
- **Database & Backend:** [Supabase](https://supabase.com/) (PostgreSQL 16, Supabase Auth, Supabase Storage)
- **Testing Runner:** [Vitest 3.0](https://vitest.dev/) + `@testing-library/react` + JSDOM

---

## 6. Struktur Direktori

```text
comminityos/
├── ARCHITECTURE.md          # Dokumen spesifikasi arsitektur & standar rekayasa
├── FIXES.md                 # Matriks audit, status remediasi, dan verifikasi CI
├── TASKS.md                 # Rencana kerja atomik 8 fase implementasi
├── next.config.ts           # Konfigurasi Next.js & OWASP Security Response Headers
├── package.json             # Dependensi minimal dan script eksekusi
├── tsconfig.json            # Konfigurasi TypeScript strict mode
├── vitest.config.ts         # Konfigurasi testing environment Vitest & path aliases
├── src/
│   ├── app/                 # LAYER 1: App Router (Pages & Layouts)
│   │   ├── layout.tsx       # Root layout HTML5 & metadata global
│   │   ├── page.tsx         # Landing page portal komunitas
│   │   ├── error.tsx        # Error boundary halaman aplikasi
│   │   ├── global-error.tsx # Root fallback error handling
│   │   ├── not-found.tsx    # Halaman 404 ramah pengguna
│   │   ├── forbidden/       # Halaman 403 penolakan hak akses
│   │   ├── (auth)/          # Rute otentikasi publik (/login, /signup)
│   │   └── (dashboard)/     # Rute multi-tenant workspace (/[orgSlug]/*)
│   │       └── [orgSlug]/
│   │           ├── layout.tsx     # Shell layout (Sidebar + TopBar)
│   │           ├── overview/      # Dasbor ringkas & action queue
│   │           ├── people/        # Direktori warga & tim
│   │           ├── activities/    # Agenda program kerja
│   │           ├── tasks/         # Papan Kanban & checklist
│   │           ├── finance/       # Buku kas & tagihan iuran
│   │           └── documents/     # Manajemen arsip dokumen
│   ├── components/          # LAYER 1: Komponen UI Presentasional
│   │   ├── ui/              # Primitif UI (Button, Input, Card, Badge)
│   │   ├── layout/          # Navigasi shell (Sidebar, TopBar)
│   │   └── modules/         # Komponen domain per fitur
│   ├── server/              # LAYER 2: Application Services & Business Logic
│   │   ├── actions/         # Next.js Server Actions (boundary entry-point)
│   │   ├── services/        # Domain business logic & aturan transaksi
│   │   └── db/              # Seed data generator komunitas Indonesia
│   ├── lib/                 # Shared Infrastructure & Utilities
│   │   ├── env.ts           # Validasi variabel lingkungan saat startup
│   │   ├── errors/          # AppError hierarchy & envelope ActionResult<T>
│   │   ├── logger/          # Structured JSON Logger & PII Masking
│   │   ├── permissions/     # Definisi matriks RBAC & role resolver
│   │   ├── supabase/        # PostgREST scoped client (server, client, middleware)
│   │   ├── utils/           # Helper format Rupiah (IDR), format tanggal, cn
│   │   └── validation/      # Skema Zod per domain & pencegahan XSS
│   ├── middleware.ts        # Tenant routing guard & OWASP HTTP headers injector
│   └── types/               # TypeScript definitions global & database
├── supabase/
│   ├── migrations/          # 8 Berkas SQL Migration terurut (DDL, RLS, Triggers)
│   └── seed.sql             # SQL seed realistis komunitas lokal
└── tests/                   # 53 Berkas Test Suite Otomatis (322 Tests)
    ├── unit/                # Unit test logika bisnis, formatting, validation
    ├── integration/         # Integration test skema database, RLS, actions
    └── security/            # OWASP headers, PII masking, XSS, Non-goals audit
```

---

## 7. Panduan Menjalankan Aplikasi Secara Lokal

### Prasyarat:
- [Node.js](https://nodejs.org/) v20.x atau v22.x LTS
- npm v10.x+
- Git

### Langkah Instalasi:

1. **Clone Repositori:**
   ```bash
   git clone https://github.com/njbaulia-wq/comminityos.git
   cd comminityos
   ```

2. **Salin Variabel Lingkungan:**
   ```bash
   cp .env.example .env.local
   ```
   Isi konfigurasi kredensial Supabase Anda pada berkas `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   LOG_LEVEL=debug
   ```

3. **Instal Dependensi:**
   ```bash
   npm install
   ```

4. **Jalankan Database Migration & Seed:**
   Jika menggunakan Supabase CLI lokal:
   ```bash
   npx supabase start
   npx supabase db reset
   ```
   Atau jalankan skrip migrasi SQL terurut pada antarmuka SQL Editor Supabase:
   - `supabase/migrations/20260913000001_core_identity.sql`
   - `supabase/migrations/20260913000002_core_rls.sql`
   - `supabase/migrations/20260913000003_people_schema.sql`
   - `supabase/migrations/20260913000004_activities_tasks.sql`
   - `supabase/migrations/20260913000005_finance_ledger.sql`
   - `supabase/migrations/20260913000006_finance_immutability.sql`
   - `supabase/migrations/20260913000007_documents_storage.sql`
   - `supabase/migrations/20260913000008_audit_notifications.sql`

5. **Jalankan Server Development:**
   ```bash
   npm run dev
   ```
   Buka browser pada `http://localhost:3000`.

---

## 8. Verifikasi Kualitas & Perintah Pengujian

Proyek ini menerapkan standar **100% Automated Testing** dan verifikasi tipe yang ketat:

| Perintah | Deskripsi | Status Hasil |
| :--- | :--- | :--- |
| `npm test` | Menjalankan seluruh test suite otomatis (53 berkas test) via Vitest | **322 passed (100%)** |
| `npm run typecheck` | Menjalankan verifikasi tipe TypeScript tanpa kompilasi (`tsc --noEmit`) | **0 errors** |
| `npm run build` | Menjalankan kompilasi Next.js App Router Turbopack untuk produksi | **Sukses (12 rute optimal)** |
| `npm start` | Menjalankan server Next.js production build secara lokal | Siap melayani traffic |

---

## 9. Matriks Hak Akses & Peran (Role-Based Access Control)

| Modul / Izin | Owner | Admin | Ketua (Chair) | Sekretaris | Bendahara | Koordinator | Anggota |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Workspace Settings** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Members Directory** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manage Members** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **View Cash Ledger** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Record Transaction** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Approve Expense** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Post to Ledger** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Manage Dues Plans** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Verify Payment** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Manage Activities** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Manage Tasks** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | Task sendiri |
| **Upload Documents** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Bukti bayar |
| **Audit Logs** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 10. Lisensi & Kontribusi

Proyek ini didistribusikan di bawah lisensi **MIT License**. Silakan gunakan, pelajari, dan kembangkan untuk mendukung kemandirian dan transparansi organisasi lokal di seluruh Indonesia.

Dibangun dengan standar rekayasa perangkat lunak modern untuk memajukan tata kelola komunitas Indonesia.