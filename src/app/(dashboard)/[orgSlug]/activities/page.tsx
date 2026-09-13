'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ActivitiesPageProps {
  params: Promise<{
    orgSlug: string;
  }>;
}

export interface ActivityListItem {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'planned' | 'active' | 'completed' | 'cancelled';
  startDate?: string;
  budgetEstimate: number;
}

export default function ActivitiesPage({ params }: ActivitiesPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ orgSlug: string } | null>(null);

  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const [activities] = useState<ActivityListItem[]>([
    {
      id: 'act-1',
      title: 'Peringatan Hari Kemerdekaan RI Ke-81',
      description: 'Perlombaan tradisional warga RT 05 dan malam pentas seni',
      status: 'planned',
      startDate: '2026-08-17',
      budgetEstimate: 4500000,
    },
  ]);

  const getStatusVariant = (status: ActivityListItem['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'planned':
        return 'warning';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Daftar Kegiatan & Agenda
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Rencanakan kepanitiaan, alokasi anggaran, dan jadwal program
          </p>
        </div>
        <Button>+ Buat Kegiatan</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((act) => (
          <Card key={act.id} className="hover:border-neutral-400 transition-colors">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <Badge variant={getStatusVariant(act.status)}>{act.status}</Badge>
              {act.startDate && (
                <span className="text-xs text-neutral-500">{act.startDate}</span>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <CardTitle className="text-base font-semibold">{act.title}</CardTitle>
                {act.description && (
                  <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
                    {act.description}
                  </p>
                )}
              </div>
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-xs">
                <span className="text-neutral-500">Estimasi Anggaran:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Rp {act.budgetEstimate.toLocaleString('id-ID')}
                </span>
              </div>
              {resolvedParams && (
                <Link
                  href={`/${resolvedParams.orgSlug}/activities/${act.id}`}
                  className="inline-block w-full"
                >
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Lihat Detail
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
