import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-6 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-2xl dark:bg-neutral-800">
          🔍
        </div>

        <CardHeader className="p-0">
          <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Halaman Tidak Ditemukan
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 text-sm text-neutral-500 dark:text-neutral-400">
          <p>
            Halaman yang Anda tuju tidak ditemukan atau URL yang dimasukkan salah.
          </p>
        </CardContent>

        <div className="pt-4 flex justify-center">
          <Link href="/">
            <Button>
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
