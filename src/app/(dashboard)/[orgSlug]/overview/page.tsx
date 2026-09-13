'use client';

import React, { useState } from 'react';
import { ActionQueue, ActionQueueItem } from '@/components/modules/dashboard/action-queue';
import { FinanceSnapshot } from '@/components/modules/dashboard/finance-snapshot';
import { UpcomingAgenda, AgendaActivity, UrgentTask } from '@/components/modules/dashboard/upcoming-agenda';

interface OverviewPageProps {
  params: Promise<{
    orgSlug: string;
  }>;
}

export default function OverviewPage({ params }: OverviewPageProps) {
  const [, setResolvedParams] = useState<{ orgSlug: string } | null>(null);

  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const [queue, setQueue] = useState<ActionQueueItem[]>([
    {
      id: 'q-1',
      title: 'Persetujuan Pengeluaran: Lampu Gang',
      description: 'Pengajuan belanja Rp 750.000 oleh Seksi Sarpras',
      type: 'expense_approval',
      priority: 'high',
      createdAt: '2026-09-12',
    },
    {
      id: 'q-2',
      title: 'Verifikasi Iuran: Siti Rahma',
      description: 'Bukti transfer Rp 50.000 untuk Iuran September',
      type: 'dues_verification',
      priority: 'medium',
      createdAt: '2026-09-13',
    },
  ]);

  const [activities] = useState<AgendaActivity[]>([
    {
      id: 'act-1',
      title: 'Kerja Bakti Lingkungan RT 05',
      startDate: '2026-09-20',
      status: 'active',
    },
  ]);

  const [tasks] = useState<UrgentTask[]>([
    {
      id: 't-1',
      title: 'Beli Cat Pos Ronda',
      dueDate: '2026-09-18',
      priority: 'urgent',
    },
  ]);

  const handleAction = (item: ActionQueueItem) => {
    alert(`Memproses tindakan: ${item.title}`);
    setQueue((prev) => prev.filter((q) => q.id !== item.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Pusat Kendali Organisasi
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Pantau antrean persetujuan, kesehatan kas, serta jadwal agenda komunitas secara seketika
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Action Queue & Agenda */}
        <div className="space-y-6 lg:col-span-2">
          <ActionQueue items={queue} onActionClick={handleAction} />
          <UpcomingAgenda activities={activities} tasks={tasks} />
        </div>

        {/* Right 1 Col: Financial Health Snapshot */}
        <div className="space-y-6 lg:col-span-1">
          <FinanceSnapshot
            balance={12500000}
            monthlyIncome={4500000}
            monthlyExpense={1200000}
            duesComplianceRate={85}
          />
        </div>
      </div>
    </div>
  );
}
