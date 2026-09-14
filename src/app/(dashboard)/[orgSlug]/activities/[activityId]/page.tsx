'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getActivityDetailData } from '@/server/actions/data-fetchers.actions';
import { changeActivityStatusAction } from '@/server/actions/activity.actions';

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

  const [activity, setActivity] = useState<{
    id: string;
    title: string;
    description?: string;
    status: string;
    budgetEstimate: number;
    startDate?: string;
    endDate?: string;
    picName: string;
    picRole: string;
  }>({
    id: 'act-123',
    title: 'Kerja Bakti Akbar',
    description: 'Pembersihan saluran air dan fasilitas umum warga',
    status: 'active',
    budgetEstimate: 1500000,
    startDate: '2026-10-01',
    endDate: '2026-10-02',
    picName: 'Budi Santoso',
    picRole: 'Ketua Seksi Kebersihan',
  });

  const loadDetail = useCallback(async (slug: string, id: string) => {
    try {
      const data = await getActivityDetailData(slug, id);
      if (data) {
        setActivity({
          id: data.id,
          title: data.title,
          description: data.description || '',
          status: data.status,
          budgetEstimate: data.budgetEstimate,
          startDate: data.startDate || '2026-10-01',
          endDate: data.endDate || '2026-10-02',
          picName: data.picName,
          picRole: data.picRole,
        });
      }
    } catch {
      // Offline fallback
    }
  }, []);

  useEffect(() => {
    params.then((p) => {
      setResolvedParams(p);
      loadDetail(p.orgSlug, p.activityId);
    });
  }, [params, loadDetail]);

  const handleComplete = async () => {
    if (!resolvedParams) return;
    try {
      await changeActivityStatusAction({
        organizationId: '11111111-1111-4111-8111-111111111111',
        activityId: resolvedParams.activityId,
        newStatus: 'completed',
      });
      setActivity((prev) => ({ ...prev, status: 'completed' }));
    } catch (err: any) {
      alert(err?.message || 'Gagal menyelesaikan kegiatan');
    }
  };

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
              Detail Kegiatan: {activity.title}
            </h1>
            <Badge variant={activity.status === 'completed' ? 'secondary' : 'success'}>
              {activity.status}
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            ID: {resolvedParams?.activityId || 'loading...'}
          </p>
        </div>

        <div className="flex gap-2">
          {activity.status !== 'completed' && (
            <Button onClick={handleComplete}>Selesaikan Kegiatan</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-500">Total Anggaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Rp {activity.budgetEstimate.toLocaleString('id-ID')}
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
              {activity.startDate} {activity.endDate ? `- ${activity.endDate}` : ''}
            </div>
            <p className="text-xs text-neutral-400 mt-1">Agenda resmi organisasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-500">Penanggung Jawab (PIC)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {activity.picName}
            </div>
            <p className="text-xs text-neutral-400 mt-1">{activity.picRole}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
