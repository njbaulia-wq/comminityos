'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';

export default function ErrorBoundaryPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({
      module: 'ui',
      action: 'error_boundary.captured',
      message: error.message || 'Error ditangkap oleh Error Boundary',
      error,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-6 space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
          <span className="text-xl">⚠️</span>
        </div>

        <CardHeader className="p-0">
          <CardTitle className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Terjadi Kesalahan
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 text-sm text-neutral-500 dark:text-neutral-400 space-y-2">
          <p>
            Maaf, terjadi kendala saat memproses permintaan Anda. Sistem telah mencatat kejadian ini secara aman.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-neutral-400">
              Kode Pelaporan: {error.digest}
            </p>
          )}
        </CardContent>

        <div className="pt-4 flex justify-center gap-3">
          <Button onClick={() => reset()}>
            Coba Lagi
          </Button>
        </div>
      </Card>
    </div>
  );
}
