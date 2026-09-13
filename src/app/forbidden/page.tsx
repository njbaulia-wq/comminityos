import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-6 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl dark:bg-red-950/50">
          🚫
        </div>

        <CardHeader className="p-0">
          <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Akses Ditolak
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 text-sm text-neutral-500 dark:text-neutral-400 space-y-2">
          <p>
            Anda tidak memiliki izin atau keanggotaan aktif untuk mengakses ruang kerja organisasi ini.
          </p>
          <p className="text-xs text-neutral-400">
            Jika Anda adalah anggota sah komunitas ini, silakan hubungi Administrator atau Ketua organisasi Anda untuk mendapatkan tautan undangan.
          </p>
        </CardContent>

        <div className="pt-4 flex justify-center gap-3">
          <Link href="/">
            <Button variant="outline">
              Kembali ke Beranda
            </Button>
          </Link>
          <Link href="/login">
            <Button>
              Ganti Akun
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
