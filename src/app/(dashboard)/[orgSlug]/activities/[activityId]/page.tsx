'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ActivityDetailPageProps {
  params: Promise<{
    orgSlug: string;
    activityId: string;
  }>;
}

export default function ActivityDetailPage({ params }: ActivityDetailPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{
    orgSlug: string;
    activityId: string;
  } | null>(null);

  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        {resolvedParams && (
          <Link
            href={`/${resolvedParams.orgSlug}/activities`}
            className="hover:underline"
          >
            &larr; Kembali ke Daftar Kegiatan
          </Link>
        )}
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Detail Kegiatan: Kerja Bakti Akbar
            </h1>
            <Badge variant="success">Active</Badge>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            ID: {resolvedParams?.activityId || 'loading...'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">Ubah Data</Button>
          <Button>Selesaikan Kegiatan</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-500">Total Anggaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Rp 1.500.000
            </div>
            <p className="text-xs text-neutral-400 mt-1">Estimasi awal perencanaan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-500">Jadwal Pelaksanaan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              01 Okt 2026 - 02 Okt 2026
            </div>
            <p className="text-xs text-neutral-400 mt-1">Durasi 2 hari</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-500">Penanggung Jawab (PIC)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Budi Santoso
            </div>
            <p className="text-xs text-neutral-400 mt-1">Ketua Seksi Kebersihan</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
