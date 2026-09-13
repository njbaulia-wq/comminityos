import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, DollarSign, CheckSquare, ShieldCheck, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/80 px-6 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white font-bold text-sm dark:bg-white dark:text-neutral-900">
            CO
          </div>
          <span className="font-semibold text-lg tracking-tight">Community OS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Masuk
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">
              Daftar Sekarang
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
          <Badge variant="outline" className="mb-4 px-3 py-1 text-xs uppercase tracking-wider">
            Sistem Operasi Komunitas Indonesia
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-neutral-900 dark:text-neutral-50">
            Tata Kelola Komunitas Lokal <br className="hidden sm:inline" />
            <span className="text-neutral-500 dark:text-neutral-400">Rapi, Transparan & Akuntabel</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
            Menggabungkan manajemen warga, agenda kegiatan, pencatatan kas riil, pelacakan iuran,
            serta arsip dokumen penting dalam satu ruang kerja terpadu untuk RT, RW, dan Karang Taruna.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Daftarkan Komunitas <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Masuk Ruang Kerja
              </Button>
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="border-t border-neutral-200 bg-neutral-100/50 py-16 dark:border-neutral-800 dark:bg-neutral-900/30">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight mb-12">
              Modul Esensial Sesuai Kebutuhan Lapangan
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-neutral-800 dark:text-neutral-200 mb-2" />
                  <CardTitle className="text-lg">Direktori Warga & Anggota</CardTitle>
                  <CardDescription>
                    Pendataan warga, status kependudukan (tetap, kontrak, kost), penugasan seksi/tim.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <DollarSign className="h-8 w-8 text-neutral-800 dark:text-neutral-200 mb-2" />
                  <CardTitle className="text-lg">Kas & Iuran Warga</CardTitle>
                  <CardDescription>
                    Buku kas mutasi riil (immutable ledger), paket iuran bulanan, verifikasi transfer.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Calendar className="h-8 w-8 text-neutral-800 dark:text-neutral-200 mb-2" />
                  <CardTitle className="text-lg">Kegiatan & Program Kerja</CardTitle>
                  <CardDescription>
                    Perencanaan agenda, penunjukan PIC kegiatan, dan estimasi pagu anggaran.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CheckSquare className="h-8 w-8 text-neutral-800 dark:text-neutral-200 mb-2" />
                  <CardTitle className="text-lg">Pelacakan Tugas (Kanban)</CardTitle>
                  <CardDescription>
                    Papan tugas operasional, status todo/in-progress/done, checklist dan tenggat waktu.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <ShieldCheck className="h-8 w-8 text-neutral-800 dark:text-neutral-200 mb-2" />
                  <CardTitle className="text-lg">Isolasi Multi-Tenant & RBAC</CardTitle>
                  <CardDescription>
                    Data setiap organisasi terisolasi secara ketat dengan proteksi Row-Level Security.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-neutral-200 text-sm font-bold dark:bg-neutral-800 mb-2">
                    📑
                  </div>
                  <CardTitle className="text-lg">Arsip Dokumen Terstruktur</CardTitle>
                  <CardDescription>
                    Penyimpanan file bukti pembayaran dan dokumen organisasi dalam direktori privat.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
        <p>© 2026 Community OS. Dibangun untuk kemandirian organisasi lokal Indonesia.</p>
      </footer>
    </div>
  );
}
