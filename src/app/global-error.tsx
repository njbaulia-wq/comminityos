'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 font-sans text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <div className="max-w-md w-full rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-lg dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl dark:bg-red-950/40">
            🚨
          </div>
          <h1 className="text-xl font-bold">Kesalahan Sistem Kritis</h1>
          <p className="text-sm text-neutral-500">
            Terjadi masalah tak terduga pada sistem root. Silakan muat ulang halaman.
          </p>
          <div className="pt-2">
            <Button onClick={() => reset()}>
              Muat Ulang Aplikasi
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
