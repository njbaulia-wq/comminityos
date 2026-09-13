# Community OS — Product Requirements Document (PRD)

**Status:** Draft v1.0
**Date:** 2026-09-13
**Product type:** Multi-tenant web application / Community Management OS
**Primary stack:** Next.js 16.3.x + TypeScript + Supabase + PostgreSQL + Tailwind CSS + shadcn/ui (Base UI)
**Deployment target:** Vercel + Supabase
**Primary market:** Indonesia — RT, RW, Karang Taruna, organisasi pemuda desa, komunitas, paguyuban, panitia kegiatan, kelompok sosial

---

## 0. Executive Summary

Community OS adalah platform manajemen organisasi lokal yang menggabungkan people management, kegiatan, iuran/keuangan, tugas, rapat, dokumen, formulir, approval, inventaris, transparansi, dan pelaporan dalam satu sistem.

Prinsip utama produk:

> **Organisasi tidak dipaksa mengikuti struktur aplikasi. Aplikasi mengikuti cara organisasi bekerja.**

Produk bukan sekadar “aplikasi iuran RT” dan bukan ERP kecil yang penuh menu. Core product adalah **record + relation + workflow + permission + audit + reporting**.

Platform harus dapat dipakai untuk:

- RT/RW
- Karang Taruna
- organisasi pemuda
- komunitas desa
- paguyuban
- PKK atau kelompok warga
- panitia kegiatan
- komunitas olahraga
- organisasi sosial
- kelompok volunteer

Setiap organisasi mendapat workspace sendiri. Admin memilih template organisasi dan modul aktif. Setelah itu organisasi dapat menambah custom fields, forms, statuses, workflow, roles, dan automation tanpa mengubah source code.

---

# 1. Product Vision

## 1.1 Vision

Membuat “operating system” sederhana untuk organisasi lokal Indonesia agar kegiatan, anggota, uang, keputusan, tugas, dan dokumen tidak lagi tersebar di WhatsApp, spreadsheet, kertas, dan folder acak.

## 1.2 Product promise

Community OS harus membuat pengguna dapat menjawab lima pertanyaan dengan cepat:

1. **Siapa** yang terlibat?
2. **Apa** yang sedang dikerjakan?
3. **Kapan** harus selesai?
4. **Berapa** uang yang masuk dan keluar?
5. **Apa keputusan dan bukti** yang sudah dibuat?

## 1.3 North-star outcome

Untuk setiap organisasi aktif, sistem harus mengurangi pekerjaan administratif manual dan meningkatkan visibilitas organisasi tanpa memaksa pengurus belajar software enterprise.

---

# 2. Problem Statement

Organisasi lokal biasanya bekerja dengan kombinasi WhatsApp, Google Sheets, buku kas, file Word/PDF, Google Drive, dan ingatan pengurus.

Masalah utamanya:

### 2.1 Informasi tersebar

Data anggota, kegiatan, uang, dokumen, dan keputusan berada di tempat berbeda.

### 2.2 Tidak ada satu sumber kebenaran

Saldo di buku kas bisa berbeda dengan spreadsheet. Daftar anggota bisa berbeda dengan data panitia. Jadwal bisa berubah di chat tetapi tidak tercatat di dokumen utama.

### 2.3 Approval tidak terdokumentasi

“Sudah disetujui ketua” sering hanya berupa chat.

### 2.4 Tugas hilang setelah rapat

Notulen ada, tetapi task owner dan deadline tidak otomatis ditindaklanjuti.

### 2.5 Transparansi keuangan sulit

Warga/anggota sering hanya mengetahui saldo akhir tanpa konteks transaksi, kegiatan, kategori, atau bukti.

### 2.6 Aplikasi yang terlalu rigid

Aplikasi RT biasanya fokus RT/RW. Aplikasi event fokus event. Accounting software terlalu kompleks. Community OS harus menjadi lapisan fleksibel di tengahnya.

### 2.7 Risiko privasi

Data anggota/warga dapat mengandung nomor telepon, alamat, dokumen identitas, dan data keluarga. Akses harus dibatasi berdasarkan organisasi, role, dan jenis record.

---

# 3. Market / Research Findings

Riset produk komunitas di Indonesia menunjukkan pola fitur yang berulang: pendataan warga/anggota, iuran, surat, kegiatan/RSVP, pengumuman, polling, chat/notifikasi, dan data keluarga. Contoh aplikasi lokal pada 2026 sudah menawarkan pengumuman, surat PDF, data warga/keluarga, kegiatan RSVP, polling, chat, achievements, notifikasi realtime, dan offline cache.

Kesimpulan strategis:

> Jangan bersaing hanya dengan “fitur lebih banyak”. Diferensiasi utama harus berupa **configurability + workflow + auditability + cross-module relationships**.

Karang Taruna juga mempunyai konteks organisasi dan kesejahteraan sosial yang tetap relevan dengan kebutuhan kegiatan, pengurus, administrasi, dan pertanggungjawaban. Permensos No. 9 Tahun 2025 mengubah Permensos No. 25 Tahun 2019 tentang Karang Taruna dan mulai berlaku 11 Agustus 2025.

Sumber resmi:

- Next.js docs/blog — https://nextjs.org/docs dan https://nextjs.org/blog
- Next.js 16.3 / current security release — https://nextjs.org/blog
- Supabase Database — https://supabase.com/docs/guides/database/overview
- Supabase Auth — https://supabase.com/docs/guides/auth
- Supabase RLS — https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Security — https://supabase.com/docs/guides/security/product-security
- Supabase Realtime — https://supabase.com/docs/guides/realtime/getting_started
- shadcn/ui — https://ui.shadcn.com/docs
- shadcn Base UI default — https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default
- Vercel Web Interface Guidelines — https://vercel.com/design/guidelines
- Geist Design System — https://vercel.com/geist/introduction
- Geist Typography — https://vercel.com/geist/typography
- Permensos No. 9 Tahun 2025 — https://peraturan.bpk.go.id/Details/325168/permensos-no-9-tahun-
- contoh fitur aplikasi warga/RT-RW — https://play.google.com/store/apps/details?hl=id&id=com.aura.warga

---

# 4. Product Principles

## P1 — Workflow before feature count

Setiap modul harus menjawab workflow nyata, bukan sekadar CRUD.

## P2 — Flexible by configuration

Sebisa mungkin kebutuhan baru diselesaikan melalui settings/configuration, bukan branching code.

## P3 — Sharp, structured UI

UI harus terasa seperti produk profesional, bukan template dashboard generik.

## P4 — Private by default

Data organisasi bersifat private kecuali ditandai public.

## P5 — Audit everything important

Approval, perubahan keuangan, permission, penghapusan, dan perubahan record penting harus dapat ditelusuri.

## P6 — Mobile-first but not mobile-only

Pengurus banyak bekerja melalui HP, tetapi spreadsheet-like finance/reporting membutuhkan desktop yang nyaman.

## P7 — Progressive disclosure

Pengguna pemula hanya melihat hal yang relevan. Advanced functionality muncul ketika dibutuhkan.

## P8 — AI as assistant, not source of truth

AI tidak boleh menjadi sumber data. AI hanya membaca/menulis melalui permission dan sistem workflow yang sudah ada.

---

# 5. Target Users / Personas

## 5.1 Organization Owner / Admin

Tujuan:
- mengatur organisasi
- membuat role
- mengaktifkan modul
- mengatur branding
- mengatur permission

## 5.2 Ketua

Tujuan:
- melihat apa yang harus diperhatikan
- approve proposal / dana
- melihat kegiatan
- memantau kesehatan organisasi

## 5.3 Sekretaris

Tujuan:
- surat
- rapat
- dokumen
- notulen
- anggota
- administrasi

## 5.4 Bendahara

Tujuan:
- iuran
- transaksi
- bukti pembayaran
- kategori
- laporan keuangan
- approval pembayaran

## 5.5 Koordinator / PIC

Tujuan:
- menjalankan kegiatan
- menyelesaikan task
- memantau tim

## 5.6 Anggota

Tujuan:
- mengetahui kegiatan
- melihat tugas
- membayar iuran
- melakukan RSVP
- membaca pengumuman

## 5.7 Public visitor

Tujuan:
- mengetahui profil organisasi
- melihat agenda publik
- melihat program publik
- melihat transparansi yang dibuka organisasi

---

# 6. Product Scope

## 6.1 Core modules

1. Organization & Workspace
2. People / Members
3. Roles & Permissions
4. Dashboard
5. Finance & Treasury
6. Iuran / Dues
7. Activities / Events
8. Tasks
9. Meetings & Decisions
10. Documents
11. Forms
12. Workflows / Approvals
13. Notifications
14. Inventory / Assets
15. Public Portal
16. Reports
17. Audit Log
18. Settings

## 6.2 Phase 2 modules

- Polling / voting
- Attendance
- Fundraising / sponsorship
- Letter management
- Advanced automation
- QR attendance
- QR payment references
- public finance transparency

## 6.3 Phase 3

- AI assistant
- external payment integrations
- WhatsApp provider integration
- advanced analytics
- multi-organization user switcher
- API / integrations
- template marketplace

---

# 7. Information Architecture

## 7.1 Primary private navigation

```text
Overview
People
Activities
Tasks
Finance
Documents
Meetings
Forms
Workflows
Assets
Reports
Settings
```

Navigation harus berbasis modul aktif.

Jika Finance dimatikan, item Finance tidak muncul.

## 7.2 Top bar

Top bar berisi:

- organization switcher
- global search / command menu
- quick create
- notification center
- help
- user profile

## 7.3 Quick create

Action utama:

- Add member
- New activity
- Add income
- Add expense
- Create task
- New document
- Create form
- Start workflow

---

# 8. Organization Onboarding

## 8.1 Create organization

Fields:

- organization name
- organization type
- village / locality
- city / regency
- logo optional
- description
- timezone default Asia/Jakarta
- currency default IDR

## 8.2 Organization templates

Preset:

### RT

Aktif:
- members
- household
- dues
- finance
- activities
- announcements
- documents
- letters

### RW

Aktif:
- members
- households
- finance
- activities
- documents
- reporting

### Karang Taruna

Aktif:
- members
- teams/divisions
- activities
- finance
- dues
- tasks
- meetings
- documents
- assets
- reports

### Organization Pemuda

Mirip Karang Taruna tetapi lebih netral.

### Community / Paguyuban

Aktif:
- members
- activities
- dues
- tasks
- announcements
- documents

### Custom

Admin memilih modul sendiri.

---

# 9. People Module

## 9.1 Member record

Required:
- name
- status

Optional:
- photo
- phone
- email
- address
- join date
- role
- team
- notes
- custom fields

## 9.2 Member statuses

Default:

```text
Active
Pending
Inactive
Alumni
Archived
```

Organization dapat menambah status.

## 9.3 Teams / divisions

Contoh:

```text
Pengurus
Divisi Acara
Divisi Humas
Divisi Olahraga
Divisi Sosial
Divisi Dokumentasi
```

## 9.4 Member activity history

Setiap member dapat mempunyai timeline:

- joined organization
- attended activity
- payment
- task
- award/badge
- role changes

Sensitif finance harus mengikuti permission.

---

# 10. Finance Module

## 10.1 Design principle

Finance bukan sekadar input saldo.

Gunakan **append-first transaction ledger** dan hindari destructive editing terhadap transaksi posted.

## 10.2 Transaction types

Income:
- dues
- donation
- sponsorship
- grant
- sales
- rental
- other

Expense:
- event
- supplies
- transport
- food
- rental
- operational
- social support
- other

## 10.3 Transaction states

```text
Draft
Pending approval
Approved
Posted
Voided
```

Transaksi `Posted` tidak boleh diedit bebas.
Jika ada koreksi, buat reversal/adjustment transaction.

## 10.4 Transaction fields

- id
- organization_id
- transaction_date
- type
- category
- amount
- account
- activity_id optional
- member_id optional
- description
- attachment
- created_by
- approved_by
- posted_at
- status

## 10.5 Accounts

Default:

- Cash
- Bank
- Other

Kelak dapat ditambah akun lain.

## 10.6 Finance dashboard

Menampilkan:

- current balance
- income this month
- expenses this month
- pending approvals
- overdue dues
- recent transactions
- cashflow chart

## 10.7 Finance UX

Gunakan table dense namun bersih.

Kolom utama:

```text
Tanggal | Deskripsi | Kategori | Kegiatan | Masuk | Keluar | Status
```

Mobile menggunakan stacked rows.

---

# 11. Dues / Iuran Module

## 11.1 Dues plan

Iuran harus configurable.

Fields:

- name
- amount
- frequency
- applicable member rule
- start date
- end date
- grace period
- late behavior
- account
- active

Frequency:

- one time
- weekly
- monthly
- quarterly
- yearly
- custom period

## 11.2 Applicability rules

Contoh:

```text
all active members
members of team X
members over age X
specific member list
custom rule
```

## 11.3 Payment state

```text
Pending
Paid
Partial
Waived
Overdue
Cancelled
```

## 11.4 Member view

```text
Iuran bulan ini
Rp10.000
Status: Belum dibayar
[Bayar / Tandai pembayaran]
```

## 11.5 Admin view

Metrics:

- collection rate
- total expected
- total paid
- total overdue

---

# 12. Activities Module

## 12.1 Activity object

Activity fields:

- title
- description
- cover image optional
- start date/time
- end date/time
- location
- organizer
- status
- budget
- public/private
- RSVP enabled
- attendance enabled
- documents

## 12.2 Status lifecycle

```text
Idea
Draft
Approved
Preparing
Live
Completed
Reporting
Archived
```

## 12.3 Activity relationships

An activity may connect to:

- members
- tasks
- transactions
- documents
- sponsors
- forms
- attendance
- decisions
- assets

## 12.4 Activity detail page

Header:

```text
<Activity title>
status badge
date
location
primary actions
```

Tabs:

```text
Overview
Tasks
Budget
People
Attendance
Documents
Timeline
Report
```

---

# 13. Task Module

## 13.1 Task fields

- title
- description
- assignee
- team
- due date
- priority
- status
- activity
- checklist
- attachment

## 13.2 Default statuses

```text
Todo
In progress
Blocked
Done
Cancelled
```

## 13.3 Task views

- list
- board
- calendar

Default should be list + grouped statuses. Avoid over-engineered project-management UI.

---

# 14. Meetings & Decisions

## 14.1 Meeting fields

- title
- date/time
- location / online link
- participants
- agenda
- notes
- decisions
- documents

## 14.2 Decision object

Fields:

- statement
- decision status
- owner
- deadline
- related activity
- related task

## 14.3 Meeting-to-task workflow

When a decision has an owner and action required:

```text
Decision
  -> create task
  -> assignee
  -> deadline
```

---

# 15. Document Module

## 15.1 Document categories

- proposal
- report
- minutes
- letter
- finance evidence
- policy
- legal
- image
- other

## 15.2 Document metadata

- title
- folder
- tags
- owner
- related activity
- related member
- created by
- visibility
- version

## 15.3 Storage rules

Actual files live in Supabase Storage.
Database stores metadata and object path.

Private documents must not use public buckets.

---

# 16. Forms Module

Users can create forms without code.

## 16.1 Field types

- text
- textarea
- number
- currency
- date
- datetime
- single select
- multi select
- checkbox
- phone
- email
- person selector
- file upload
- photo upload
- URL

## 16.2 Form actions

Submission can:

- create member
- create task
- create activity participant
- create approval request
- create generic record
- notify selected role

## 16.3 Form UX

Builder UI:

```text
Canvas                         Field settings
─────────────────              ───────────────
Name                           Label
Phone                          Required
Divisi                         Placeholder
Keahlian                       Help text
Upload                         Validation
```

Avoid giant visual-builder experiences.
Prioritize keyboard and simple row-based configuration.

---

# 17. Workflow Engine

This is the core differentiator.

## 17.1 Workflow structure

```text
Workflow
 ├── Trigger
 ├── Conditions
 ├── Steps
 ├── Approvals
 ├── Actions
 └── Completion
```

## 17.2 Example — Expense approval

```text
Expense created
     ↓
IF amount >= 1,000,000
     ↓
Bendahara review
     ↓
Ketua approval
     ↓
Approved
     ↓
Notify requester
```

## 17.3 Example — Activity approval

```text
Activity draft
     ↓
Proposal attached?
     ↓
Budget <= configured limit?
     ↓
Chair approval
     ↓
Approved
```

## 17.4 Workflow action types

- assign role
- assign user
- set status
- create task
- create notification
- create transaction
- request approval
- send email
- create document
- webhook

Webhook and external integrations must be phase 3 unless required.

---

# 18. Notifications

Channels:

- in-app
- email
- optional WhatsApp integration later

Notification categories:

- assignment
- approval
- payment
- overdue
- activity reminder
- task deadline
- meeting reminder

Users can set preferences.

Critical finance/security notifications cannot be fully disabled by regular members.

---

# 19. Inventory / Assets

## 19.1 Asset fields

- name
- category
- quantity
- condition
- location
- owner
- status
- serial number optional
- photo

## 19.2 Loan flow

```text
Request
 ↓
Approval
 ↓
Checked out
 ↓
Returned
 ↓
Condition check
 ↓
Closed
```

---

# 20. Public Portal

Each organization can enable a public website.

## Public sections

- homepage
- about
- activities
- news/announcements
- public documents
- gallery
- public transparency
- contact

## Privacy boundary

Never expose:

- phone numbers
- personal addresses
- personal payment status
- identity documents
- private notes
- internal approvals

unless explicitly configured and legally/operationally appropriate.

---

# 21. Reports

## 21.1 Finance reports

- income/expense
- cashflow
- dues collection
- category breakdown
- activity budget vs actual

## 21.2 Activity report

- summary
- attendance
- finances
- tasks
- documents
- outcomes

## 21.3 Organization report

- active members
- activities
- participation
- contribution
- financial summary

Reports should support:

- screen view
- print-friendly
- PDF export later
- CSV export for authorized users

---

# 22. Audit Log

Audit events:

- create
- update
- archive
- delete request
- approve
- reject
- role change
- permission change
- posted transaction
- document access for sensitive documents
- workflow transition

Each event:

```text
id
organization_id
actor_user_id
entity_type
entity_id
action
metadata
timestamp
ip_hash / safe security metadata if required
```

Do not store unnecessary personal data.

---

# 23. Roles & Authorization

## 23.1 Default roles

```text
Owner
Admin
Chair
Vice Chair
Secretary
Treasurer
Coordinator
Member
Viewer
```

## 23.2 Permission examples

```text
members.read
members.create
members.update
members.archive
finance.read
finance.create
finance.approve
finance.post
finance.export
activities.read
activities.create
activities.approve
tasks.read
tasks.assign
documents.read
documents.manage
settings.manage
roles.manage
audit.read
```

## 23.3 Rule

UI hiding is not authorization.
Every sensitive operation must be authorized server-side and by database policy where applicable.

---

# 24. Multi-tenancy Architecture

The product is multi-tenant from day one.

## 24.1 Model

```text
User
  │
  ├── Organization A membership
  ├── Organization B membership
  └── Organization C membership
```

Every organization-owned table includes `organization_id` unless the row is purely system-owned.

## 24.2 Tenant isolation

Primary mechanism:

- Supabase Auth identity
- organization membership table
- PostgreSQL RLS
- server-side authorization
- least privilege

RLS should be enabled on exposed tables. Policies and database grants must both be configured and tested.

Never rely only on frontend route guards.

---

# 25. Database Architecture

## 25.1 Core tables

```text
organizations
organization_settings
organization_members
profiles
roles
permissions
role_permissions
teams

custom_fields
custom_field_values

activities
activity_members
activity_documents
activity_sponsors

transactions
accounts
transaction_categories
due_plans
due_items
payments

 tasks
 task_comments
 task_checklists

meetings
meeting_attendees
meeting_decisions

documents
document_folders
document_versions

forms
form_fields
form_submissions
form_submission_values

workflows
workflow_steps
workflow_conditions
workflow_runs
workflow_tasks
workflow_approvals

assets
asset_loans

announcements
notifications
notification_preferences

audit_logs
```

## 25.2 Naming conventions

- `snake_case` in Postgres
- singular semantic entity name for conceptual docs, plural physical table names
- UUID primary keys by default
- timestamptz for timestamps
- numeric/decimal for currency amounts
- explicit foreign keys

## 25.3 Currency

Use `numeric(14,2)` or an appropriate high-precision decimal type rather than floating point.

Store currency code on organization or transaction where needed.
Default `IDR`.

## 25.4 Soft deletion

For entities where history matters:

```text
deleted_at
deleted_by
```

Prefer archive/state transitions over hard delete.

Hard delete only when explicitly safe and allowed.

---

# 26. Recommended Next.js Architecture

Use **Next.js App Router**.

Suggested structure:

```text
src/
  app/
    (marketing)/
      page.tsx
      pricing/page.tsx
    (auth)/
      login/page.tsx
      signup/page.tsx
    (app)/
      [orgSlug]/
        layout.tsx
        page.tsx
        people/page.tsx
        activities/page.tsx
        tasks/page.tsx
        finance/page.tsx
        documents/page.tsx
        meetings/page.tsx
        forms/page.tsx
        workflows/page.tsx
        assets/page.tsx
        reports/page.tsx
        settings/page.tsx
    api/
  components/
    ui/
    layout/
    data-table/
    forms/
    finance/
    activities/
    workflows/
  lib/
    supabase/
    auth/
    permissions/
    validation/
    formatting/
    audit/
  server/
    actions/
    queries/
    services/
  types/
  hooks/
```

Do not put all business logic inside page components.

---

# 27. Server / Client Boundaries

Default to Server Components.

Use Client Components only when interactivity requires them:

- drag/drop
- form state
- dialogs
- charts
- realtime subscriptions
- optimistic UI where beneficial

Keep privileged secrets and service-role access server-side only.

---

# 28. Supabase Architecture

Use Supabase for:

- Postgres
- Auth
- Storage
- Realtime
- Edge Functions when necessary

## 28.1 Browser client

Use Supabase browser client for authenticated user-scoped operations that are safe to expose through the Data API with RLS.

## 28.2 Server client

Use the server-side Supabase client for server rendering/actions.

## 28.3 Service role

The service-role key bypasses RLS and must never be exposed to the browser.

Use it only for tightly controlled server-side jobs where justified.

## 28.4 RLS testing

Every protected table should have automated allow/deny tests covering:

- anonymous
- member
- role with permission
- role without permission
- different organization
- archived membership

---

# 29. Storage Architecture

Buckets:

```text
avatars
organization-assets
activity-media
private-documents
payment-proofs
reports
```

Rules:

- public assets only when intended
- private buckets for sensitive documents
- path starts with organization identifier
- enforce access through storage policies
- never use guessable public URLs for sensitive files

Example path:

```text
private-documents/{organization_id}/{entity_type}/{entity_id}/{file}
```

---

# 30. Realtime Strategy

Realtime should be selective.

Use for:

- notifications
- approval status changes
- shared activity state where needed
- collaborative updates with clear value

Do not subscribe every page to every table.

Prefer private channels for production realtime use and authorize access.

---

# 31. Design System — Vercel/Geist Inspired, Not a Clone

The visual direction should take inspiration from high-quality developer products such as Vercel/Geist, but must have its own brand identity and must not copy proprietary layouts/branding.

## 31.1 Visual keywords

```text
sharp
quiet
technical
structured
precise
high contrast
fast
professional
calm
```

## 31.2 No AI slop

Absolutely avoid:

- giant generic gradients
- excessive glassmorphism
- floating rainbow blobs
- unnecessary 3D icons
- huge meaningless hero cards
- excessive rounded cards
- purple/blue “AI SaaS” default aesthetic
- dashboard cards everywhere
- decorative icons replacing clear labels
- fake metric charts with no decision value
- excessive animations

## 31.3 Geometry

Use:

- mostly 4–10px radius
- larger radius only for major containers or sheets
- 1px borders
- aligned grid
- consistent gutters
- clear section boundaries

Cards should be used only when a visual grouping has semantic purpose.

## 31.4 Borders

Use crisp neutral borders with subtle contrast.

Avoid heavy shadows.

Use layered shadows only where depth is required.

## 31.5 Typography

Use Geist Sans where feasible, with system fallbacks.
Use Geist Mono selectively for:

- currency numbers
- identifiers
- technical metadata
- timestamps when tabular alignment matters

Headings should use strong hierarchy and compact line-height.

Do not overuse bold.

## 31.6 Color

Base palette:

- neutral background
- high-contrast text
- neutral border
- one brand accent
- semantic success/warning/error colors

Accent should be configurable per organization, but must not destroy contrast.

Never rely on color alone to communicate state.

## 31.7 Density

Product UI should feel dense enough for administration but never cramped.

Desktop:
- 12-column grid where useful
- sidebar 240–272px
- content max width around 1280–1440px depending on page

Mobile:
- compact top bar
- bottom action or sheet patterns when useful
- horizontal scroll only for tables that truly require it

---

# 32. Core UI Patterns

## 32.1 App shell

```text
┌─────────────────────────────────────────────────┐
│ Org switcher   Search     + Create   Bell  User │
├───────────────┬─────────────────────────────────┤
│ Overview      │                                 │
│ People        │             CONTENT             │
│ Activities    │                                 │
│ Finance       │                                 │
│ Tasks         │                                 │
│ Documents     │                                 │
│ ...           │                                 │
│               │                                 │
│ Settings      │                                 │
└───────────────┴─────────────────────────────────┘
```

## 32.2 Page header

Always:

- breadcrumb where needed
- title
- description
- primary action
- contextual actions

Example:

```text
Kegiatan
Kelola kegiatan, peserta, anggaran, dan tugas.

[ + Kegiatan ]
```

## 32.3 Empty states

No generic illustration.

Use:

```text
Belum ada kegiatan
Buat kegiatan pertama untuk mulai mengatur panitia, tugas, dan anggaran.
[ Buat kegiatan ]
```

## 32.4 Tables

Tables must support:

- sorting
- search
- filter
- pagination
- column visibility where useful
- row actions

Do not show 15 irrelevant columns by default.

---

# 33. Dashboard UX

Dashboard is not a collection of cards.

It is an **action surface**.

Order:

1. critical actions
2. today / upcoming
3. activity progress
4. finance snapshot
5. recent activity

Example:

```text
Selamat pagi, Andi

3 hal perlu perhatian

[ 2 Approval ] [ 4 Task ] [ 1 Overdue ]

AGENDA
19:30  Rapat Pengurus
Sabtu  Kerja Bakti

KEGIATAN AKTIF
Festival Desa                          78%
██████████████████░░░

KEUANGAN
Saldo kas                              Rp8,45 jt
Bulan ini masuk                        Rp3,20 jt
Bulan ini keluar                       Rp1,75 jt
```

Numbers must always have context and date range.

---

# 34. Accessibility

Target:

- semantic HTML
- keyboard navigable
- focus visible
- form labels
- error messages tied to inputs
- accessible dialogs
- minimum usable contrast
- reduced motion support
- do not use color as the only status signal

Follow current accessibility guidance and use tested components from shadcn/Base UI rather than hand-rolling complex primitives unnecessarily.

---

# 35. Responsive Strategy

## Mobile

Priority:

- notification
- quick create
- activities
- tasks
- dues
- approvals
- documents

## Tablet

Use two-column layouts where appropriate.

## Desktop

Full sidebar and dense data tables.

Critical workflows must work on mobile without requiring desktop-only interaction.

---

# 36. Search / Command Menu

Global command menu should support:

```text
Search members
Search activities
Search documents
Search tasks
Search transactions
Create activity
Create expense
Open settings
```

Use keyboard shortcut where appropriate, e.g. Cmd/Ctrl+K.

Search results must be permission-aware.

---

# 37. Notifications / Activity Feed

In-app notification center:

```text
Approval menunggu Anda
Budi mengirim proposal kegiatan
Iuran Siti belum dibayar
Task “Cari Sound System” jatuh tempo besok
```

Activity feed is organization-scoped and permission-aware.

---

# 38. AI Assistant — Phase 3

AI may support:

### Natural language reporting

> “Berapa pengeluaran Festival Desa bulan ini?”

### Draft generation

> “Buat draft LPJ dari kegiatan ini.”

### Admin help

> “Siapa yang belum bayar iuran September?”

### Workflow generation

> “Buat workflow pengajuan dana di atas Rp1 juta harus diapprove ketua.”

Rules:

- never bypass permission
- never invent financial numbers
- cite/identify source records internally
- destructive actions require confirmation
- AI writes through existing service/actions, not direct database access

---

# 39. Public Transparency

Optional transparency page:

```text
Keuangan Publik

Saldo awal
+ pemasukan
- pengeluaran
= saldo akhir

Top kegiatan
Kategori pengeluaran
Laporan per periode
```

Organization controls whether this is enabled.

Individual payment records remain private by default.

---

# 40. Non-functional Requirements

## Performance

Target:

- fast initial shell rendering
- responsive interaction under typical 4G/mobile usage
- avoid unnecessary client JS
- server-render wherever possible
- paginated data tables
- lazy load heavy charts and media

## Reliability

- graceful loading states
- error boundaries
- retry for safe operations
- idempotency for critical actions

## Security

- RLS
- least privilege
- server-side permission checks
- secret isolation
- secure cookies/auth flow
- upload validation
- size/type restrictions
- audit logs
- rate limiting for auth/public forms

## Maintainability

- typed APIs
- schema validation
- migrations
- service boundaries
- no giant route files
- no duplicated permission logic

---

# 41. Security Threat Model

Threats:

1. cross-tenant data leakage
2. broken access control
3. service-role key exposure
4. public document leakage
5. insecure file upload
6. duplicate transaction submission
7. privilege escalation
8. malicious public form submission
9. webhook spoofing
10. IDOR/BOLA

Mitigations:

- RLS policies
- authorization tests
- UUIDs
- ownership checks
- signed/private storage URLs where appropriate
- file content/extension validation
- rate limiting
- CSRF-safe architecture
- audit trail
- idempotency keys for critical financial operations

---

# 42. Finance Integrity Rules

Finance requires stricter rules than normal CRUD.

1. `Posted` transactions are immutable.
2. Corrections use reversal/adjustment transactions.
3. Every finance action records actor and time.
4. Amounts use decimal types.
5. No client-side calculation is trusted as the final source of truth.
6. Approval and posting are separate capabilities.
7. Reports calculate from ledger records.

---

# 43. API / Service Layer

Use typed server functions/actions rather than scattering raw database logic through components.

Example domains:

```text
memberService
activityService
financeService
duesService
taskService
documentService
workflowService
notificationService
reportService
```

Services should:

1. validate input
2. verify organization context
3. verify permission
4. execute transaction/query
5. write audit event when required
6. return typed result

---

# 44. Validation

Use Zod for:

- form inputs
- server actions
- API payloads
- environment config
- workflow definitions

Never trust `FormData` or client-side validation alone.

---

# 45. Error Handling

Errors must be human-readable.

Good:

> Pengeluaran tidak dapat diposting karena approval ketua belum selesai.

Bad:

> Error 409.

Internal logs may include technical details; user-facing errors should be concise.

---

# 46. Observability

Track:

- server errors
- failed actions
- slow queries
- auth failures
- webhook errors
- finance anomalies

Use a production error tracking provider later if required.

Do not log sensitive personal/financial data unnecessarily.

---

# 47. Testing Strategy

## Unit tests

- currency utilities
- permission resolver
- workflow conditions
- due calculations
- report calculations

## Integration tests

- auth
- RLS
- finance posting
- workflow approval
- file access

## E2E tests

Critical flows:

1. organization onboarding
2. invite member
3. create activity
4. create task
5. create dues plan
6. record payment
7. submit expense
8. approve expense
9. upload document
10. generate report

## RLS security suite

For every protected table, test allow/deny cases across organizations and roles.

---

# 48. Seed Data

Development environment should include seed organization:

**Karang Taruna Desa Sukamaju**

Seed:

- 20 members
- 5 roles
- 4 divisions
- 3 activities
- 2 dues plans
- sample transactions
- 10 tasks
- 3 meetings
- sample documents
- one approval workflow

This makes UI testing realistic and prevents empty-dashboard development.

---

# 49. Demo Scenario

The product must be demonstrable through one complete workflow:

> Karang Taruna menyelenggarakan Festival Desa.

Flow:

```text
Create activity
   ↓
Create committee/team
   ↓
Create budget
   ↓
Create proposal
   ↓
Submit approval
   ↓
Approved
   ↓
Create tasks
   ↓
Collect dues/sponsorship
   ↓
Record expenses
   ↓
Run event
   ↓
Attendance
   ↓
Upload documentation
   ↓
Close activity
   ↓
Generate report
```

This scenario is the main product acceptance demonstration.

---

# 50. MVP Definition

## Must have

- authentication
- organization creation
- organization membership
- roles/permissions
- people
- activities
- tasks
- finance
- dues
- documents
- notifications
- dashboard
- audit log
- RLS

## Should have

- meetings
- forms
- simple approvals
- inventory
- reports

## Later

- public portal
- advanced workflows
- payment gateway
- WhatsApp
- voting
- AI

---

# 51. MVP Navigation

```text
Overview
People
Activities
Tasks
Finance
Documents

More
  Meetings
  Forms
  Assets
  Reports

Settings
```

Do not expose every advanced module on day one.

---

# 52. MVP Screens

## Auth

- login
- signup
- forgot password
- invitation accept

## Onboarding

- create organization
- choose template
- configure organization
- invite members

## Overview

- action queue
- agenda
- active activities
- finance snapshot

## People

- list
- detail
- create/edit
- roles
- teams

## Activities

- list
- create
- detail
- tasks
- people
- budget
- docs

## Tasks

- list
- board
- detail

## Finance

- dashboard
- transactions
- dues
- reports

## Documents

- folders
- list
- upload
- preview

## Settings

- organization
- roles
- modules
- notifications

---

# 53. Acceptance Criteria — MVP

## Organization

- user can create organization
- organization has slug
- organization isolation works
- user can invite members

## People

- create/update/archive member
- assign role/team
- custom fields supported

## Activity

- create/update activity
- status transitions
- assign members
- create tasks
- associate finance records

## Finance

- create income/expense
- approval
- post transaction
- immutable posted transaction
- accurate balance calculation

## Dues

- create plan
- generate due items
- mark paid
- calculate overdue

## Documents

- upload
- list
- preview/download according to permission
- delete/archive according to permission

## Security

- organization A cannot read organization B
- unauthorized role cannot approve finance
- service key absent from client bundle
- sensitive storage protected

## UX

- responsive
- keyboard usable
- no blocking full-screen spinners for normal actions
- clear loading/empty/error states

---

# 54. Performance Budget

Initial goals, to be validated with real measurements:

- minimize client JS for server-rendered pages
- avoid large chart libraries on every route
- lazy load heavy modules
- use image optimization
- paginate lists over a sensible threshold
- debounce global search
- keep dashboard queries aggregated and bounded

Do not optimize based on guesses; measure real production behavior.

---

# 55. SEO

SEO is mainly relevant to public pages, not private dashboard pages.

Public site:

- unique title/description
- canonical URLs
- Open Graph
- sitemap
- robots
- structured data only where useful
- fast server rendering
- semantic headings

Private app should not be indexed.

---

# 56. Localization

Primary:

```text
id-ID
```

Defaults:

- currency: IDR
- timezone: Asia/Jakarta
- date: DD/MM/YYYY in user-facing UI
- number formatting according to locale

Architecture should allow future locale support without rebuilding the UI.

---

# 57. Data Retention

Define retention settings for:

- audit logs
- notifications
- deleted documents
- archived members

Never delete important financial/audit history simply because an account is archived.

---

# 58. Export / Portability

Authorized organization admins should be able to export:

- members CSV
- transactions CSV
- dues CSV
- activities CSV
- tasks CSV
- reports

Future: full organization data export.

---

# 59. Billing / SaaS Model — Future

Not required for MVP.

Potential plans:

### Free

- one organization
- basic people
- activities
- tasks
- basic finance

### Community

- more members
- advanced finance
- documents
- forms
- workflows

### Organization Pro

- advanced workflows
- public portal
- audit/export
- automation
- AI

Pricing must be validated through real usage before implementation.

---

# 60. Anti-Bloat Rules

1. Every feature must have a workflow.
2. Every metric must support a decision.
3. Every card must justify its existence.
4. Every setting must have a real operational use.
5. Do not introduce configuration before the simpler behavior is proven.
6. Advanced functionality goes behind progressive disclosure.
7. Prefer one flexible primitive over five duplicated modules.

---

# 61. Anti-AI-Slop Engineering Rules

AI coding agents must not be allowed to:

- invent architecture ad hoc
- create duplicate components for every page
- copy-paste business logic
- use different UI patterns for equivalent actions
- create fake loading states without actual async work
- create arbitrary gradients
- add excessive rounded cards
- hide permission logic only in components
- bypass RLS
- use service-role keys in client code
- silently mutate posted transactions
- introduce dependencies without justification

Before implementing a feature, the agent must identify:

```text
Domain
Database
Permission
Server action/query
UI state
Audit event
Tests
```

---

# 62. Design QA Checklist

Every page must be reviewed for:

### Layout

- aligned to grid
- consistent margins
- no random spacing
- content hierarchy clear

### Typography

- heading hierarchy correct
- body text readable
- numbers aligned where meaningful

### Components

- same button style everywhere
- same table controls everywhere
- same modal behavior everywhere
- same form field conventions

### Interaction

- hover
- focus
- active
- disabled
- loading
- error
- empty

### Responsive

- 360px width minimum support
- tablet behavior
- desktop density

### Accessibility

- labels
- keyboard
- focus
- semantic controls

---

# 63. Development Conventions

## TypeScript

- strict mode
- no `any` unless justified
- prefer typed domain objects
- shared types generated/inferred where possible

## React

- server-first
- client components only when necessary
- avoid giant components

## Database

- migrations only
- no manual production schema drift
- explicit foreign keys
- indexes based on actual query paths

## Git

Branch examples:

```text
feat/people
feat/finance-ledger
feat/workflow-engine
fix/rls-members
chore/supabase-migration
```

Commit messages should describe intent.

---

# 64. Suggested Dependency Set

Core:

```text
next
react
react-dom
typescript
@supabase/supabase-js
@supabase/ssr
```

UI:

```text
shadcn/ui CLI
Base UI components where appropriate
lucide-react
```

Forms/data:

```text
zod
react-hook-form
```

Optional:

```text
recharts
date-fns
```

Exact package versions should be pinned at implementation time after checking current stable releases. Do not blindly copy stale version numbers from this PRD.

---

# 65. Environment Variables

Expected categories:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY  # server only, if required
```

Exact naming should follow the current Supabase/Next.js setup used during implementation.

Never commit secrets.

---

# 66. Suggested Supabase Folder

```text
supabase/
  migrations/
  seed.sql
  tests/
  functions/
    notifications/
    reports/
    webhooks/
```

Every schema change must be reproducible from migrations.

---

# 67. Implementation Order

## Step 1 — Foundation

- Next.js app
- TypeScript strict
- Tailwind
- shadcn/Base UI
- Supabase
- environment config
- app shell

## Step 2 — Identity

- auth
- profiles
- organization
- membership
- roles
- RLS

## Step 3 — People

- members
- teams
- custom fields

## Step 4 — Activities + Tasks

- activity CRUD
- relations
- task CRUD

## Step 5 — Finance

- accounts
- ledger
- dues
- approvals
- reports

## Step 6 — Documents

- folders
- upload
- private access

## Step 7 — Workflow

- definitions
- approval runs
- notifications

## Step 8 — UX hardening

- responsive
- accessibility
- loading/error states
- performance

## Step 9 — Security hardening

- RLS test suite
- authorization test suite
- upload hardening
- audit verification

## Step 10 — Demo / production readiness

- seed data
- demo organization
- deployment
- monitoring
- backup/recovery validation

---

# 68. Example End-to-End Scenario

## Festival Desa

### 1. Create activity

```text
Festival Desa 2026
20 Oct 2026
Budget: Rp15.000.000
```

### 2. Create team

```text
Committee
- Chair
- Secretary
- Treasurer
- Events
- Sponsorship
- Documentation
```

### 3. Create workflow

```text
Proposal submitted
→ Treasurer review
→ Chair approve
→ Activity approved
```

### 4. Generate tasks

```text
Cari sponsor
Buat poster
Sewa sound
Cari MC
Siapkan konsumsi
```

### 5. Finance

```text
Sponsor +5.000.000
Dues +2.000.000
Sound -2.000.000
Konsumsi -1.500.000
```

### 6. Event

- attendance
- checklist
- live task status
- documentation

### 7. Close

- reconcile finance
- final attendance
- report
- archive

This is the canonical demo workflow.

---

# 69. Future Integrations

Potential integrations:

- WhatsApp Business provider
- email provider
- payment/QRIS provider
- Google Calendar
- Google Drive import
- Maps
- e-sign provider
- analytics

Integrations should be modular and organization-scoped.

---

# 70. What NOT to Build in MVP

Do not build:

- full accounting ERP
- payroll
- complete chat replacement for WhatsApp
- complex CRM
- native mobile app
- public social network
- marketplace
- advanced AI agent
- blockchain
- custom video call system

These distract from the core organization workflow.

---

# 71. Product Differentiation

Community OS wins if it provides:

### 1. One flexible workspace

Not many disconnected micro-apps.

### 2. Workflow-native architecture

Approval and state changes are first-class.

### 3. Real finance integrity

Ledger-first and auditable.

### 4. Customization without code

Fields, forms, statuses, roles, workflows.

### 5. Strong UX

Professional enough to feel like a modern SaaS product.

### 6. Local context

IDR, Bahasa Indonesia, RT/RW, Karang Taruna, community workflows.

---

# 72. Final Architecture Diagram

```text
                         ┌─────────────────────┐
                         │       USERS         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      NEXT.JS        │
                         │   APP ROUTER 16.x   │
                         ├─────────────────────┤
                         │ Server Components   │
                         │ Server Actions      │
                         │ Route Handlers      │
                         │ Client Components   │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    ▼               ▼                ▼
             ┌────────────┐  ┌────────────┐  ┌────────────┐
             │    AUTH    │  │   DATA     │  │  STORAGE   │
             │ Supabase  │  │ PostgreSQL │  │ Supabase   │
             └────────────┘  └─────┬──────┘  └────────────┘
                                   │
                             ┌─────▼─────┐
                             │    RLS    │
                             │ Tenant +  │
                             │   RBAC    │
                             └─────┬─────┘
                                   │
                 ┌─────────────────┼──────────────────┐
                 ▼                 ▼                  ▼
           ┌───────────┐    ┌────────────┐      ┌───────────┐
           │ WORKFLOW  │    │  FINANCE   │      │ REALTIME  │
           │  ENGINE   │    │   LEDGER   │      │ NOTIFY    │
           └───────────┘    └────────────┘      └───────────┘
                                   │
                                   ▼
                            ┌───────────────┐
                            │   REPORTING   │
                            └───────────────┘
                                   │
                                   ▼
                            ┌───────────────┐
                            │ PUBLIC PORTAL │
                            └───────────────┘
```

---

# 73. Definition of Done

A feature is not “done” until all applicable items are true:

- database migration exists
- RLS is defined
- permission behavior is tested
- server validation exists
- loading state exists
- empty state exists
- error state exists
- mobile layout works
- keyboard accessibility works
- audit event exists where required
- no duplicate business logic
- no sensitive secret reaches client
- E2E test exists for critical workflow

---

# 74. Final Product Direction

Community OS harus terasa seperti perpaduan:

```text
Vercel-like product discipline
        +
Notion-like flexibility
        +
Linear-like task clarity
        +
Modern finance ledger discipline
        +
Local Indonesian community workflow
```

Bukan berarti meniru UI atau brand produk tersebut. Yang diambil adalah prinsip:

- clarity
- speed
- density yang terkontrol
- strong typography
- restrained visual language
- keyboard-friendly interaction
- structured data
- excellent empty/loading/error states

Produk final harus terlihat **tajam, sederhana, serius, dan dapat dipercaya**, bukan seperti template AI-generated dashboard.

---

# 75. Research Notes / Source Basis

This PRD incorporates current research as of 13 September 2026. Key verified facts:

1. Next.js 16.3 is available, and the August 2026 security release lists Next.js 16.3.3 as Active LTS. See Next.js official blog: https://nextjs.org/blog
2. Next.js describes the App Router as the newer router supporting newer React features and Server Components: https://nextjs.org/docs
3. Supabase provides full PostgreSQL plus Auth, Storage, Realtime, and Edge Functions: https://supabase.com/docs
4. Supabase recommends RLS and notes that grants and policies both matter for Data API security: https://supabase.com/docs/guides/database/postgres/row-level-security
5. Supabase Auth integrates JWT authentication with PostgreSQL/RLS authorization: https://supabase.com/docs/guides/auth
6. shadcn/ui is an open-code component system and its July 2026 update made Base UI the default for new projects while retaining Radix support: https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default
7. Vercel's official interface guidelines emphasize crisp borders, layered shadows, nested radii, accessibility, and interaction states: https://vercel.com/design/guidelines
8. Geist provides Vercel's design system foundations, grid, typography, colors, materials, and components: https://vercel.com/geist/introduction
9. Permensos No. 9 Tahun 2025 changes the rules governing Karang Taruna and became effective 11 August 2025: https://peraturan.bpk.go.id/Details/325168/permensos-no-9-tahun-
10. Current Indonesian community app examples show demand around announcements, letters, residents/families, events, polls, chat, realtime notifications, and related community workflows: https://play.google.com/store/apps/details?hl=id&id=com.aura.warga

---

# 76. Implementation Guardrail for AI Coding Agents

When this PRD is given to an AI coding agent, the agent must follow this sequence:

```text
READ PRD
  ↓
READ repository structure
  ↓
READ existing schema/migrations
  ↓
READ existing design system
  ↓
DO NOT code immediately
  ↓
Identify affected domain + tables + permissions
  ↓
Create migration/schema plan
  ↓
Implement backend/service boundary
  ↓
Implement UI using existing primitives
  ↓
Implement loading/empty/error/accessibility states
  ↓
Implement RLS/authorization tests
  ↓
Implement E2E test for critical workflow
  ↓
Run lint/typecheck/test/build
  ↓
Review against this PRD
```

The AI must not invent a second architecture when one already exists.

