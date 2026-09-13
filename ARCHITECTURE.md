# Community OS — Architectural Specification & Execution Blueprint
**Document Status:** Approved Architecture Blueprint  
**Version:** 1.0.0  
**Date:** 2026-09-13  
**Author:** Senior Software Architect  
**Source PRD:** `community-os-prd.md` (Catatan: file `README.md` pada repositori saat ini berstatus stub/inisial)

---

## 1. Ringkasan Eksekutif Produk

### 1.1 Tujuan Produk
**Community OS** adalah *multi-tenant web application* yang berfungsi sebagai sistem operasi manajemen organisasi lokal di Indonesia (RT, RW, Karang Taruna, paguyuban, perkumpulan pemuda desa, panitia kegiatan, dan kelompok sosial/komunitas).

Sistem ini diciptakan untuk memecahkan problem kronis organisasi lokal: **fragmentasi data dan proses kerja** yang tercecer di WhatsApp, Google Sheets, buku kas fisik, file dokumen manual, dan ingatan personal pengurus. 

**Prinsip Utama Produk:**
> *"Organisasi tidak dipaksa mengikuti struktur aplikasi. Aplikasi mengikuti cara organisasi bekerja."*

Community OS bukan sekadar pencatat kas/iuran RT dan bukan ERP korporat yang rumit. Inti dari produk adalah kombinasi: **Record + Relation + Workflow + Permission + Audit + Reporting**.

Sistem dirancang untuk menjawab 5 pertanyaan operasional fundamental secara instan:
1. **Siapa** yang terlibat dalam organisasi dan kepanitiaan?
2. **Apa** kegiatan dan tugas yang sedang berjalan?
3. **Kapan** target tenggat waktu penyelesaiannya?
4. **Berapa** arus kas masuk, pengeluaran, dan sisa saldo riil?
5. **Apa** keputusan rapat, persetujuan (approval), dan dokumen bukti pendukung yang sah?

---

### 1.2 Target User & Persona

| Persona | Peran Utama | Kebutuhan Utama di Sistem |
| :--- | :--- | :--- |
| **Organization Owner / Admin** | Administrator Sistem | Setup workspace organisasi, pemilihan template, manajemen anggota, aktivasi modul, konfigurasi role & permission. |
| **Ketua (Chairperson)** | Pimpinan Organisasi | Visibilitas *high-level*, persetujuan (*approval*) proposal program & pengeluaran dana, pemantauan kesehatan organisasi via dashboard. |
| **Sekretaris (Secretary)** | Tata Kelola & Administrasi | Pengelolaan direktori anggota/warga, pencatatan notulen rapat & keputusan, penomoran & arsip dokumen/surat. |
| **Bendahara (Treasurer)** | Akuntabilitas Keuangan | Manajemen rencana iuran (*due plans*), pencatatan transaksi masuk/keluar, verifikasi bukti transfer warga, rekonsiliasi kas, pelaporan berkala. |
| **Koordinator / PIC Kegiatan** | Eksekutor Program Kerja | Perencanaan kegiatan/acara (*activities*), pembagian tugas (*tasks*), pemantauan anggaran kegiatan, koordinasi relawan. |
| **Anggota / Warga (Member)** | Partisipan Komunitas | Akses pengumuman, melihat agenda kegiatan, memantau status iuran pribadi, mengunggah bukti bayar, konfirmasi kehadiran (RSVP). |
| **Public Visitor (Publik)** | Pihak Luar / Warga Umum | Akses portal transparansi publik (jika diaktifkan organisasi) untuk melihat ringkasan keuangan atau program terbuka. |

---

### 1.3 Scope MVP (Minimum Viable Product)

Ruang lingkup MVP difokuskan secara ketat pada modul-modul esensial yang menjamin integritas multi-tenant, keamanan data privat warga, serta alur operasional dasar organisasi lokal:

#### A. Must-Have (Komponen Wajib MVP)
1. **Multi-Tenant Foundation & Auth:**
   - Registrasi, login, reset password via Supabase Auth.
   - Pembuatan organisasi baru (*organization onboarding*) dengan slug unik URL.
   - Pilihan template organisasi awal: RT, RW, Karang Taruna, Organisasi Pemuda, Community/Paguyuban, Custom.
   - Mekanisme undangan anggota (*invitations*) via link atau email.
2. **Tenant Isolation & RBAC (Role-Based Access Control):**
   - PostgreSQL Row-Level Security (RLS) di setiap tabel ber-tenant (`organization_id`).
   - Role default: *Owner, Admin, Chair, Vice Chair, Secretary, Treasurer, Coordinator, Member, Viewer*.
   - Evaluasi permission ketat di layer server dan database (bukan sekadar menyembunyikan tombol di UI).
3. **People Module (Anggota / Warga):**
   - Direktori anggota dengan filter status, penugasan peran (*roles*), dan pengelompokan (*teams* / divisi / seksi).
   - Profil anggota dengan dukungan data kontak dan alamat.
4. **Activities Module (Program Kerja & Kegiatan):**
   - Pembuatan dan manajemen status kegiatan (*draft, planned, active, completed, cancelled*).
   - Penunjukan penanggung jawab (PIC) dan alokasi plafon anggaran kegiatan.
5. **Tasks Module (Tugas Operasional):**
   - Manajemen tugas berelasi ke kegiatan maupun tugas umum organisasi.
   - Status tracking (*todo, in-progress, done*), prioritas, *assignee*, dan batas waktu (*due date*). Tampilan daftar (*list*) dan papan (*board*).
6. **Finance & Ledger Module:**
   - Pencatatan transaksi pemasukan dan pengeluaran berbasis akun kas/bank.
   - Aturan integritas buku kas (*ledger-first*): Transaksi berstatus `posted` bersifat *immutable* (tidak dapat diedit/dihapus langsung, perbaikan melalui transaksi penyesuaian/reversal).
   - Upload dan lampiran bukti transaksi (struk/nota/bukti transfer).
7. **Dues / Iuran Module:**
   - Definisi paket iuran (*due plans*): nominal, periode (bulanan/insidental).
   - Tracking tagihan iuran per anggota (*due items*: pending, paid, overdue).
   - Pencatatan manual oleh bendahara dan verifikasi bukti transfer yang diunggah warga.
8. **Documents Module:**
   - Manajemen file organisasi dalam struktur folder terorganisir.
   - Upload dokumen pendukung (PDF, gambar) dengan kontrol hak akses berbasis role.
9. **Overview Dashboard & Notifications:**
   - Dasbor ringkas: *Action Queue* (persetujuan tertunda), agenda kegiatan terdekat, dan *Finance Snapshot* (saldo kas riil).
   - Notifikasi internal sistem untuk tugas baru, tagihan iuran, dan permintaan approval.
10. **Audit Trail (Log Audit):**
    - Pencatatan peristiwa penting (*immutable audit log*): perubahan role, approval pengeluaran, posting keuangan, dan penghapusan record.

#### B. Should-Have (Fitur Sekunder bila Kapasitas MVP Memungkinkan)
- Modul Rapat & Keputusan (*Meetings & Decisions*): Notulen rapat terstruktur yang dapat mengonversi butir notulen menjadi task.
- Modul Formulir Sederhana (*Forms*): Pendataan warga/survei internal.
- Modul Inventaris Sederhana (*Assets*): Pencatatan barang milik bersama dan riwayat pinjam-kembali.
- Ekspor Laporan Finansial: Unduh rekap kas berkala dalam format CSV/PDF.

#### C. Later Phases (Di Luar MVP)
- Portal publik (*Public Transparency Portal*).
- Mesin alur kerja otomatis lanjutan (*Advanced Workflow Builder*).
- Integrasi WhatsApp Notification Gateway via API.
- Payment Gateway otomatis (QRIS/VA Midtrans/Xendit).
- AI Assistant / Document Summarizer.

---

## 2. Explicit Non-Goals (Batasan Tegas — Dilarang Ditambahkan)

Untuk menjaga fokus, performa, ketepatan waktu rilis, dan integritas arsitektural, hal-hal berikut **SECARA EKSPLISIT DILARANG** dibangun pada fase MVP:

1. **Dilarang Membangun Full Accounting ERP & Payroll:**
   - Tidak boleh ada sistem akuntansi korporat kompleks (*double-entry bookkeeping debet-kredit akrual*, perhitungan depresiasi aset tetap, neraca saldo korporat, perpajakan PPh/PPN).
   - Tidak boleh ada modul payroll, slip gaji karyawan, atau kalkulasi tunjangan/BPJS.
2. **Dilarang Membangun In-App Chatting / WhatsApp Replacement:**
   - Tidak boleh membuat ruang obrolan real-time (*instant messaging*), room chat grup, atau panggilan audio/video WebRTC di dalam aplikasi. Komunikasi percakapan warga tetap diarahkan menggunakan WhatsApp.
3. **Dilarang Membangun Complex CRM & Marketing Automation:**
   - Tidak boleh menambahkan pipeline sales, lead scoring, deal stages, atau email blast marketing.
4. **Dilarang Membuat Native Mobile App (iOS / Android):**
   - Tidak boleh menulis codebase React Native, Flutter, Swift, atau Kotlin pada fase ini. Seluruh kebutuhan akses *mobile* dipenuhi melalui Web Application yang responsif (*mobile-first via browser*).
5. **Dilarang Membangun Fitur Media Sosial Publik:**
   - Tidak boleh ada feed linimasa publik bergaya Facebook/Twitter, tombol *like*, algoritma rekomendasi konten, atau sistem *following/followers*.
6. **Dilarang Membangun E-Commerce / Marketplace Warga:**
   - Tidak boleh membuat etalase belanja, keranjang belanja (*cart*), katalog produk UMKM, atau sistem checkout toko online.
7. **Dilarang Mengintegrasikan Payment Gateway Otomatis di MVP:**
   - Tidak ada integrasi langsung dengan Midtrans, Xendit, DOKU, atau dompet digital (OVO/GoPay). Pembayaran iuran pada MVP murni manual transfer bank/kas tunai + verifikasi bukti transfer oleh bendahara.
8. **Dilarang Mengimplementasikan Autonomous AI Agents:**
   - Tidak boleh menambahkan AI yang dapat memutasi database secara otomatis, melakukan approval sepihak, atau memposting transaksi finansial tanpa intervensi manusia.
9. **Dilarang Memasukkan Teknologi Web3 / Blockchain / Crypto:**
   - Tidak ada integrasi dompet kripto, smart contract, token komunitas, atau NFT.
10. **Anti-Bloat & Anti-Slop Engineering Rules:**
    - Dilarang membuat komponen duplikat untuk halaman berbeda jika perbedaannya minor (wajib *reusable*).
    - Dilarang menambahkan efek visual arbitrer (*decorative gradients, neon glows, excessive border radii*) yang merusak estetika desain ala Geist/Vercel.
    - Dilarang membuat state loading palsu (*fake setTimeout skeletons*) yang tidak merepresentasikan proses asynchronous nyata.
    - Dilarang membypass RLS atau mengekspos Supabase Service Role Key ke kode sisi klien (*client-side*).
    - Dilarang menambah library pihak ketiga (*npm packages*) tanpa izin dan analisis kebutuhan yang sah.

---

## 3. Definisi Arsitektur Sistem & Standar Wajib

### 3.1 Tech Stack & Foundational Architecture
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript (Strict Mode).
- **Styling & Design System:** Tailwind CSS v4 + shadcn/ui (Base UI engine) mengacu pada prinsip desain Geist (bersih, densitas data tinggi, tipografi tajam, kontras jelas).
- **Backend & Database:** Supabase Platform (PostgreSQL 16+, Supabase Auth, Supabase Storage, Supabase Realtime).
- **Multi-tenancy Model:** Single database, shared schema, multi-tenant berisolasi ketat menggunakan `organization_id` di setiap tabel aplikasi dengan proteksi Postgres Row-Level Security (RLS).

```
                        ┌────────────────────────┐
                        │      WEB CLIENT        │
                        │ (Browser / Mobile Web) │
                        └───────────┬────────────┘
                                    │ HTTPS
                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 16 (APP ROUTER)                      │
│                                                                  │
│  [LAYER 1: PRESENTATION & ROUTES]                                │
│  ├── Server Components (default: data fetching, layout, static)   │
│  ├── Client Components (interaktif: forms, modal, charts)        │
│  ├── Server Actions (mutasi data dari UI)                        │
│  └── Route Handlers (khusus external webhooks / system API)      │
│                                   │                              │
│                                   ▼                              │
│  [LAYER 2: SERVICE & DOMAIN LOGIC]                               │
│  ├── Input Validation (Zod Schemas)                              │
│  ├── Tenant Context & Authentication Enforcement                 │
│  ├── Authorization & RBAC Guard (`hasPermission`)                │
│  ├── Domain Invariant & Business Rules Execution                 │
│  ├── Transaction Orchestrator                                    │
│  ├── Audit Log Dispatcher                                        │
│  └── Centralized Structured Logging                              │
└───────────────────────────────────┬──────────────────────────────┘
                                    │ Authenticated Context (JWT)
                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  [LAYER 3: DATA ACCESS & STORAGE]                                │
│  ├── Supabase PostgREST Client (Scoped by User Token)            │
│  ├── PostgreSQL Database Engine                                  │
│  │   ├── Row Level Security (RLS Policies: Tenant + Role)        │
│  │   ├── Foreign Keys, Constraints, High-Precision Numerics      │
│  │   └── Audit Logs & Financial Ledgers (Immutable Rows)         │
│  └── Supabase Storage (Private Buckets: Bukti Kas, Dokumen)       │
└──────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Pemisahan Layer (Layering Architecture)

Struktur kode diatur dengan pemisahan tanggung jawab (*Separation of Concerns*) yang tegas dalam direktori `src/`:

```text
src/
├── app/                          # LAYER 1: Routes & Pages
│   ├── (auth)/                   # Public auth routes (login, signup, reset)
│   ├── (dashboard)/              # Protected multi-tenant application routes
│   │   └── [orgSlug]/            # Multi-tenant workspace layout & pages
│   │       ├── overview/
│   │       ├── people/
│   │       ├── activities/
│   │       ├── tasks/
│   │       ├── finance/
│   │       ├── documents/
│   │       └── settings/
│   └── api/                      # Route Handlers (Webhooks saja)
├── components/                   # LAYER 1: UI Primitives & Domain Presenters
│   ├── ui/                       # Base UI components (Button, Input, Dialog, etc.)
│   ├── layout/                   # Sidebar, Navbar, PageHeader, Shell
│   └── modules/                  # Modular feature components (finance, people, etc.)
├── server/                       # LAYER 2: Application Services & Business Logic
│   ├── actions/                  # Next.js Server Actions (entry point dari UI)
│   └── services/                 # Domain Services (Orchestrator, rules, audit)
├── lib/                          # Shared Infrastructure & Utilities
│   ├── supabase/                 # Supabase clients (server, client, middleware)
│   ├── errors/                   # LAYER 2: Centralized Error Definition & Helpers
│   ├── logger/                   # LAYER 2: Structured JSON Logger
│   ├── validation/               # LAYER 2: Zod Schemas per domain
│   ├── permissions/              # RBAC definitions & resolver
│   └── utils/                    # Formatting (currency IDR, dates, etc.)
└── types/                        # Global & Database TypeScript definitions
```

#### Aturan Pemisahan Layer:
1. **Layer 1: Presentation & Routes (`src/app/`, `src/components/`)**
   - **Tanggung Jawab:** Menerima input user, me-render tampilan UI, menampilkan state *loading*, *empty*, dan *error*.
   - **Batasan:** Dilarang mengeksekusi kueri SQL/Supabase langsung di komponen React. Dilarang menempatkan logika kalkulasi finansial atau aturan otorisasi di dalam komponen UI. Seluruh aksi mutasi wajib memanggil Server Action.
2. **Layer 2: Service & Domain Logic (`src/server/services/`, `src/server/actions/`)**
   - **Tanggung Jawab:** Jantung operasional aplikasi. Menjalankan validasi skema input (Zod), mengecek otentikasi user dan konteks tenant, memverifikasi izin (*RBAC permission*), menerapkan aturan bisnis (misal: "transaksi posted tidak dapat diubah"), mencatat event audit, dan memicu logging terstruktur.
   - **Batasan:** Bebas dari elemen UI/JSX. Menghasilkan objek *typed result* standar (`Result<T, AppError>`).
3. **Layer 3: Data Access & Persistence (`src/lib/supabase/`, PostgreSQL)**
   - **Tanggung Jawab:** Persistensi data, integritas relasional (*foreign keys*, *check constraints*), dan penegakan isolasi tenant melalui PostgreSQL Row-Level Security (RLS).
   - **Batasan:** Tidak boleh menerima parameter yang belum divalidasi oleh Layer 2.

---

### 3.3 Kunci Standar Wajib (Mandatory Standards)

#### A. Error Handling: Satu Pattern Terpusat & Terisolasi
1. **Dilarang Keras `try-catch` Liar:** Dilarang menggunakan `try-catch` kosong yang menelan error (`catch (e) {}`) atau melemparkan raw database error langsung ke klien.
2. **Custom Error Hierarchy:** Seluruh error aplikasi wajib diturunkan dari kelas `AppError`:
   ```typescript
   export abstract class AppError extends Error {
     abstract readonly statusCode: number;
     abstract readonly code: string;
     readonly isOperational = true;

     constructor(message: string, public readonly details?: Record<string, unknown>) {
       super(message);
       Object.setPrototypeOf(this, new.target.prototype);
     }
   }

   export class NotFoundError extends AppError {
     readonly statusCode = 404;
     readonly code = 'NOT_FOUND';
   }

   export class UnauthorizedError extends AppError {
     readonly statusCode = 401;
     readonly code = 'UNAUTHORIZED';
   }

   export class ForbiddenError extends AppError {
     readonly statusCode = 403;
     readonly code = 'FORBIDDEN';
   }

   export class ValidationError extends AppError {
     readonly statusCode = 422;
     readonly code = 'VALIDATION_ERROR';
     constructor(message: string, public readonly fieldErrors: Record<string, string[]>) {
       super(message);
     }
   }

   export class BusinessRuleError extends AppError {
     readonly statusCode = 400;
     readonly code = 'BUSINESS_RULE_VIOLATION';
   }
   ```
3. **Format Respons Standar (Result Envelope Pattern):**
   Seluruh Server Actions mengembalikan struktur seragam:
   ```typescript
   export type ActionResult<T> =
     | { success: true; data: T }
     | { 
         success: false; 
         error: { 
           code: string; 
           message: string; 
           fieldErrors?: Record<string, string[]>; 
           requestId: string;
         } 
       };
   ```
4. **Isolasi Error Internal (Anti-Data Leak):**
   Pesan error teknis (misal: *`PostgresError: relation "transactions" violates foreign key constraint`*, kredensial database, atau *stack trace*) HANYA dicatat ke internal logger. Pesan yang dikembalikan ke user WAJIB berupa pesan ramah pengguna dalam Bahasa Indonesia, contoh:
   - *Buruk:* `Error 500: Database lock failed at pg_query()`
   - *Benar:* `"Pencatatan transaksi gagal diproses karena sistem sedang sibuk. Silakan coba beberapa saat lagi."`
   - *Benar:* `"Pengeluaran tidak dapat diposting karena belum mendapatkan persetujuan dari Ketua."`

---

#### B. Logging: Structured JSON Standar
1. **Format Standar Wajib:**
   Semua output log sistem harus berupa string JSON satu baris (*single-line structured JSON*) yang ditulis ke `stdout` atau `stderr`:
   ```json
   {
     "timestamp": "2026-09-13T06:37:43.123Z",
     "level": "info",
     "module": "finance",
     "action": "finance.post_transaction",
     "requestId": "c4b12f20-83ef-4b21-8267-9c9451ba99aa",
     "organizationId": "a11e8a93-b0c3-4a11-822e-13c5ec821901",
     "userId": "u77a9b01-1200-4b11-9a21-998877665544",
     "message": "Transaction posted successfully to cash ledger",
     "context": {
       "transactionId": "tx_99812",
       "amount": 1500000.00,
       "account": "KAS_UTAMA"
     }
   }
   ```
2. **Kriteria Level Log:**
   - `debug`: Informasi alur internal (hanya aktif pada development/staging).
   - `info`: Peristiwa operasional normal (login berhasil, pembuatan kegiatan, posting transaksi).
   - `warn`: Kondisi janggal tetapi sistem tetap berjalan (akses ditolak, input tidak valid berulang).
   - `error`: Kegagalan operasional yang membutuhkan penanganan (kueri database gagal, timeout external service).
3. **Larangan `console.log` Liar:** Seluruh logging wajib melalui modul terpusat `src/lib/logger/index.ts`.
4. **Perlindungan Privasi (Masking PII):** Data sensitif seperti kata sandi, token otentikasi, NIK lengkap, atau nomor kartu perbankan DILARANG KERAS dicatat ke dalam log context.

---

#### C. Validasi Input di Tiap Boundary Menggunakan Skema (Zod)
1. **Validasi Tanpa Pengecualian:**
   Setiap data yang melintasi batas (*boundary*) sistem WAJIB divalidasi menggunakan Zod schema sebelum diproses oleh layer service:
   - Argumen Server Action (`FormData` atau Objek JS).
   - Request body & query parameters pada Route Handlers.
   - Environment variables pada saat startup aplikasi (`env.ts`).
2. **Prinsip Type-Inference:**
   Tipe TypeScript domain tidak boleh dibuat duplikat secara manual jika skema Zod-nya sudah ada. Gunakan `z.infer<typeof Schema>` sebagai *single source of truth*.
3. **Contoh Skema Boundary Finansial (`src/lib/validation/finance.schema.ts`):**
   ```typescript
   import { z } from 'zod';

   export const CreateTransactionSchema = z.object({
     organizationId: z.string().uuid({ message: "Organization ID tidak valid" }),
     accountId: z.string().uuid({ message: "Akun kas wajib dipilih" }),
     categoryId: z.string().uuid({ message: "Kategori transaksi wajib dipilih" }),
     activityId: z.string().uuid().optional().nullable(),
     type: z.enum(['INCOME', 'EXPENSE'], { message: "Tipe transaksi harus INCOME atau EXPENSE" }),
     amount: z.number().positive({ message: "Nominal harus lebih besar dari 0" }),
     transactionDate: z.string().datetime({ message: "Format tanggal tidak valid" }),
     description: z.string().min(3, { message: "Keterangan minimal 3 karakter" }).max(500),
     attachmentUrl: z.string().url({ message: "Tautan bukti tidak valid" }).optional().nullable(),
   });

   export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
   ```

---

## 4. Safety Rules Wajib Dipatuhi di Eksekusi Berikutnya

Instruksi ini adalah aturan keselamatan (*engineering guardrails*) yang bersifat mengikat dan wajib ditaati oleh seluruh agen pengembang (*AI coding agents*) maupun insinyur pada tahap implementasi kode berikutnya:

### 4.1 Test-First (Red-Green-Refactor)
1. **Dilarang Menulis Kode Sebelum Test:** Tidak boleh menulis baris implementasi bisnis/fitur sebelum test terkait dibuat dan dipastikan GAGAL terlebih dahulu.
2. **Siklus 3 Tahap Wajib:**
   - **Tahap RED:** Buat berkas unit test / integration test yang mendefinisikan ekspektasi perilaku fungsi/fitur. Jalankan test runner (`npm run test`), pastikan test berstatus **FAILED** dengan alasan kegagalan yang valid (bukan syntax error).
   - **Tahap GREEN:** Tulis kode implementasi seminimal mungkin hanya agar test tersebut lolos (**PASSED**). Jangan menambahkan over-engineering di luar spesifikasi test.
   - **Tahap REFACTOR:** Bersihkan struktur kode, hilangkan duplikasi, pastikan tipe TypeScript ketat, dengan jaminan seluruh test tetap **PASSED**.

### 4.2 Git Workflow: Branch Per Task & Pesan Deskriptif
1. **Branch Terpisah:** Setiap unit pekerjaan/fitur wajib dikerjakan di branch tersendiri yang dibuat dari `main` dengan konvensi penamaan:
   ```text
   agent/<nama-task>
   Contoh: agent/setup-auth, agent/finance-ledger, agent/rls-policies
   ```
2. **Commit Per Task Selesai:** Lakukan commit setelah satu task selesai diverifikasi oleh test. Dilarang menumpuk banyak task dalam satu commit.
3. **Pesan Commit Mengikuti Conventional Commits:**
   - `feat(finance): implement transaction posting service and audit emission`
   - `test(people): add negative cases for unauthorized member deletion`
   - `fix(auth): handle expired refresh token in middleware`

### 4.3 Pembatasan Ukuran Perubahan (Small & Atomic Diffs)
1. **Anti Mega-Diff:** Dilarang menggabungkan beberapa domain atau modul besar dalam satu task/PR.
2. Batasi perubahan maksimal mencakup 1 modul/fitur logis atau perbaikan terisolasi. Jika sebuah fitur besar (misal: Modul Finansial), pecah menjadi beberapa task kecil:
   - Task 1: Migrasi skema database & policy RLS.
   - Task 2: Service layer, validasi Zod, dan unit test logika ledger.
   - Task 3: Komponen UI tabel transaksi dan form input.

### 4.4 Disiplin Dependensi (No Silent Installs)
1. **Larangan Install Diam-Diam:** Agen DILARANG mengeksekusi `npm install <package>` atau `pnpm add <package>` secara diam-diam tanpa persetujuan eksplisit.
2. **Prosedur Pengajuan Dependensi Baru:**
   Sebelum menambahkan package baru, buat laporan justifikasi berisi:
   - Nama package dan link repositori/npm.
   - Ukuran bundle (*bundle size impact*).
   - Alasan mengapa kebutuhan tersebut tidak dapat diselesaikan menggunakan utilitas bawaan / paket yang sudah ada.
   - Menunggu persetujuan user sebelum melakukan instalasi.

### 4.5 Analisis Ketergantungan Sebelum Delete / Rewrite (Grep First)
1. **Wajib `grep_search`:** Sebelum menghapus file, merombak signature fungsi, atau mengubah skema database yang sudah ada, agen WAJIB melakukan penelusuran (*grep*) ke seluruh repositori untuk memetakan seluruh file pemanggil (*callers/importers*).
2. Dilarang membiarkan ada *broken imports*, tipe *dangling*, atau *runtime error* akibat perubahan sepihak.

### 4.6 Circuit Breaker: Batas Maksimal 3x Gagal Perbaikan
1. **Aturan STOP 3x Gagal:** Jika agen menghadapi error yang sama atau gagal memperbaiki sebuah kegagalan test/build sebanyak **3 kali berturut-turut**, agen **WAJIB SEGERA BERHENTI (STOP)**.
2. **Dilarang Melanjutkan:** Dilarang menebak-nebak kode tanpa arah (*blind patching*) dan dilarang melompat ke task lain.
3. **Laporan Diagnosa:** Buat laporan resmi berisi:
   - Ringkasan task yang sedang dikerjakan.
   - Pesan error teknis terakhir dan log kegagalan test.
   - Tiga percobaan yang telah dilakukan dan alasan kegagalannya.
   - Analisis akar masalah (*root cause*) dan opsi alternatif solusi untuk didiskusikan dengan pengguna.

---

## 5. Pertanyaan Klarifikasi Teknis & Produk

Berdasarkan telaah mendalam terhadap PRD `community-os-prd.md`, terdapat sejumlah ambiguitas operasional dan arsitektural yang memerlukan keputusan resmi sebelum fase coding dimulai:

### 1. Metode Otentikasi Primer untuk Warga Indonesia
- **Konteks:** PRD mereferensikan Supabase Email/Password Auth sebagai standar default. Namun, pada konteks operasional RT/RW dan komunitas lokal di Indonesia, sebagian besar warga dan pengurus senior tidak aktif menggunakan email atau sering lupa kata sandi, melainkan mengandalkan WhatsApp/Nomor Ponsel.
- **Pertanyaan:** Apakah untuk MVP kita tetap membatasi autentikasi pada **Email + Password** (demi kecepatan deliverable awal), ataukah fitur **WhatsApp OTP / SMS OTP / Phone Auth** harus disediakan sejak hari pertama?

### 2. Strategi Multi-Tenant Routing (Subdomain vs Path-Based)
- **Konteks:** PRD menampilkan pola URL `/[orgSlug]/...`.
- **Pertanyaan:** Apakah disepakati bahwa implementasi routing menggunakan **Path-based routing** (contoh: `app.communityos.id/rt05-rw02/overview`)? Opsi ini jauh lebih mudah dikonfigurasi pada DNS Vercel, Supabase Auth Cookie Handling, dan SSL certificate dibandingkan Subdomain-based routing (`rt05-rw02.communityos.id`). Mohon konfirmasi apakah path-based routing disetujui.

### 3. Entitas Anggota Tanpa Akun Pengguna (*Shadow/Unclaimed Profiles*)
- **Konteks:** Dalam pendataan warga RT atau Karang Taruna, sekretaris sering mengimpor atau mencatat puluhan warga yang belum mendaftar akun di aplikasi (misalnya warga lansia atau anak-anak).
- **Pertanyaan:** Apakah tabel `profiles` / `organization_members` mengizinkan data warga berstatus *"Unclaimed"* (kolom `user_id` bernilai `NULL`), yang nantinya dapat di-*claim* saat warga tersebut melakukan pendaftaran akun dengan nomor HP/email yang cocok?

### 4. Relasi Otomatis antara Pembayaran Iuran (*Dues*) dan Buku Kas (*Ledger*)
- **Konteks:** Saat bendahara menyetujui pembayaran iuran warga sebesar Rp 50.000 di modul *Dues*, status tagihan berubah menjadi `PAID`.
- **Pertanyaan:** Apakah sistem harus **secara otomatis** membuat satu baris transaksi pemasukan di modul *Finance* (tabel `transactions` ke akun kas default), ataukah pencatatan mutasi kas dan status iuran dilakukan terpisah secara manual oleh bendahara? (Rekomendasi Arsitek: Dibuat otomatis melalui *Database Transaction* untuk menjamin konsistensi neraca saldo kas).

### 5. Kebijakan Retensi & Visibilitas Bukti Pembayaran (*Storage Privacy*)
- **Konteks:** Anggota akan mengunggah foto struk/tangkapan layar m-banking sebagai bukti transfer iuran. Gambar ini memuat data pribadi sensitif (nomor rekening bank, nama pemilik rekening, saldo).
- **Pertanyaan:** Apakah disepakati bahwa bucket Supabase Storage untuk bukti pembayaran diset sebagai **Private Bucket**, di mana URL file di-generate sebagai *Time-limited Signed URL* yang hanya dapat diakses oleh user yang memiliki izin `finance.read` di organisasi terkait?

### 6. Mekanisme Soft Deletion vs Hard Deletion pada RLS
- **Konteks:** PRD menentukan bahwa data penting (transaksi, anggota, dokumen) menggunakan *soft delete* (`deleted_at`, `deleted_by`).
- **Pertanyaan:** Apakah penyaringan `deleted_at IS NULL` akan dipusatkan langsung di dalam PostgreSQL RLS policy (sehingga record yang dihapus otomatis tak terlihat di seluruh query aplikasi), ataukah ditangani secara eksplisit pada query di Service Layer? (Catatan: Memasukkannya ke RLS lebih aman, namun kueri untuk fitur "Restore/Trash Bin" bagi Admin memerlukan bypass policy khusus).

---
*Dokumen arsitektur ini menjadi acuan mutlak bagi eksekusi pengembangan Community OS. Dilarang menyimpang dari standar di atas tanpa revisi dokumen arsitektur.*
