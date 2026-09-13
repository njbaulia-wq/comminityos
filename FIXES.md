# Community OS — Codebase Audit & Remediation Plan (FIXES.md)

**Document Status:** Active Audit & Remediation Plan  
**Audit Date:** 2026-09-13  
**Auditor:** Senior Software Architect  
**Acuan Standar:** `community-os-prd.md` (PRD) & `ARCHITECTURE.md`

---

## 1. Ringkasan Eksekutif Hasil Audit

Audit menyeluruh telah dilakukan terhadap seluruh codebase Community OS dengan membandingkan implementasi aktual terhadap spesifikasi PRD (`community-os-prd.md`), prinsip arsitektur (`ARCHITECTURE.md`), dan batasan tegas `NON-GOALS`.

### Status Kepatuhan:
1. **MVP Scope:** Seluruh 10 modul utama telah terimplementasi di service & action layer. Namun terdapat gap pada presentation layer untuk rute publik otentikasi (`/login`, `/signup`, `/forbidden`, `/`) dan root layout Next.js.
2. **NON-GOALS:** 100% patuh. Tidak ada dependensi kripto/web3, tidak ada AI agent otonom, tidak ada payment gateway eksternal, tidak ada in-app chat WebRTC, dan tidak ada ERP akuntansi korporat.
3. **Error Handling & Logging:** Standar `ActionResult<T>` dan `AppError` telah dipatuhi di level service, namun parameter boundary pada action wrappers masih menerima UUID tanpa validasi skema Zod.
4. **Keamanan (OWASP):** Security headers belum terkonfigurasi di middleware/proxy; PII masking di logger perlu diperluas untuk data perbankan lokal & nilai NIK 16 digit; input string belum diproteksi dari script injection / XSS di layer validasi boundary.

---

## 2. Matriks Temuan & Prioritas Perbaikan

| ID | Prioritas | Kategori | Deskripsi Temuan | Target Solusi | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FIX-1** | **P0 (Critical/Security)** | OWASP Headers | `src/middleware.ts` belum menginjeksi HTTP Security Headers (CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, HSTS, Referrer-Policy, Permissions-Policy). | Tambahkan helper injeksi security headers di middleware & `next.config.ts`. | [ ] Pending |
| **FIX-2** | **P0 (Critical/Security)** | PII Protection | `src/lib/logger/masking.ts` belum mendeteksi terminologi rekening bank lokal (`noRekening`, `bankAccount`, `pin`) dan value string NIK 16 digit (`^\d{16}$`). | Perluas regex pola key sensitif dan tambahkan value-level detector untuk NIK & kartu. | [ ] Pending |
| **FIX-3** | **P0 (Critical/Security)** | OWASP / XSS | Skema Zod input teks (`fullName`, `title`, `description`, `address`) belum mensterilkan atau menolak script tag berbahaya. | Buat reusable Zod string validator di `common.schema.ts` yang menolak tag `<script>` & script payload berbahaya. | [ ] Pending |
| **FIX-4** | **P1 (Error Handling)** | Boundary Validation | Server Actions menerima route parameter `{ organizationId, memberId, ... }` sebagai raw string tanpa parsing skema UUID Zod. | Terapkan validasi skema UUID boundary di seluruh action wrappers sebelum invoke service. | [ ] Pending |
| **FIX-5** | **P1 (Presentation/UX)** | Missing Routes | Rute publik auth (`/login`, `/signup`, `/forbidden`, `/`) dan root `src/app/layout.tsx` belum tersedia, mengakibatkan 404 saat redirect middleware. | Buat root layout dan halaman auth & forbidden yang clean, accessible, bergaya Geist. | [ ] Pending |
| **FIX-6** | **P1 (Edge Cases)** | Domain Invariants | Edge cases: anggota berstatus non-aktif (arsip) tidak boleh diangkat menjadi PIC kegiatan / assignee tugas; mencegah nested folder cycle. | Tambahkan guard pengecekan status aktif anggota & deteksi self-parent folder di domain service. | [ ] Pending |
| **FIX-7** | **P2 (Integrity)** | NON-GOALS Audit | Verifikasi menyeluruh `package.json` dan source tree untuk memastikan nol dependensi ilegal. | Lakukan static audit dependensi dan log laporan kepatuhan non-goals. | [ ] Pending |
| **FIX-8** | **P2 (Production Ready)** | Final Verification | Seluruh test suite Vitest lolos, typecheck TypeScript lolos, dan production build Next.js 16 sukses. | Eksekusi CI check lokal: `test`, `typecheck`, `build`. | [ ] Pending |

---

## 3. Rencana Eksekusi Bertahap (TDD: Red-Green-Refactor)

Setiap perbaikan wajib dieksekusi dengan:
1. **Branch terpisah**: `agent/<nama-fix>`
2. **RED**: Tulis test terlebih dahulu, konfirmasi FAILED.
3. **GREEN**: Tulis implementasi minimal, konfirmasi PASSED.
4. **REFACTOR**: Rapikan kode, verifikasi regression testing.
5. **Commit Git**: Pesan conventional commit deskriptif.
6. **Update FIXES.md**: Update checklist & progress notes.
