'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ActionQueue, ActionQueueItem } from '@/components/modules/dashboard/action-queue';
import { FinanceSnapshot } from '@/components/modules/dashboard/finance-snapshot';
import { UpcomingAgenda, AgendaActivity, UrgentTask } from '@/components/modules/dashboard/upcoming-agenda';
import { getOverviewData } from '@/server/actions/data-fetchers.actions';
import { approveTransactionAction } from '@/server/actions/finance.actions';

interface OverviewPageProps {
  params: Promise<{
    orgSlug: string;
  }>;
}

export default function OverviewPage({ params }: OverviewPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ orgSlug: string } | null>(null);
  const [organizationId, setOrganizationId] = useState('11111111-1111-4111-8111-111111111111');
  const [balance, setBalance] = useState(12500000);
  const [monthlyIncome, setMonthlyIncome] = useState(4500000);
  const [monthlyExpense, setMonthlyExpense] = useState(1200000);
  const [duesComplianceRate, setDuesComplianceRate] = useState(85);

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

  const [activities, setActivities] = useState<AgendaActivity[]>([
    {
      id: 'act-1',
      title: 'Kerja Bakti Lingkungan RT 05',
      startDate: '2026-09-20',
      status: 'active',
    },
  ]);

  const [tasks, setTasks] = useState<UrgentTask[]>([
    {
      id: 't-1',
      title: 'Beli Cat Pos Ronda',
      dueDate: '2026-09-18',
      priority: 'urgent',
    },
  ]);

  const loadOverview = useCallback(async (slug: string) => {
    try {
      const data = await getOverviewData(slug);
      if (data) {
        setOrganizationId(data.organizationId);
        setBalance(data.financeSnapshot.balance);
        setMonthlyIncome(data.financeSnapshot.monthlyIncome);
        setMonthlyExpense(data.financeSnapshot.monthlyExpense);
        setDuesComplianceRate(data.financeSnapshot.duesComplianceRate);
        if (data.actionQueue.length > 0) {
          setQueue(data.actionQueue);
        }
        if (data.activities.length > 0) {
          setActivities(data.activities);
        }
        if (data.tasks.length > 0) {
          setTasks(data.tasks);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    params.then((p) => {
      setResolvedParams(p);
      loadOverview(p.orgSlug);
    });
  }, [params, loadOverview]);

  const handleAction = async (item: ActionQueueItem) => {
    if (item.type === 'expense_approval') {
      try {
        await approveTransactionAction({
          organizationId,
          transactionId: item.id,
        });
        setQueue((prev) => prev.filter((q) => q.id !== item.id));
        if (resolvedParams) {
          await loadOverview(resolvedParams.orgSlug);
        }
      } catch (err: any) {
        alert(err?.message || 'Gagal memproses persetujuan');
      }
    } else if (item.type === 'dues_verification') {
      if (resolvedParams && typeof window !== 'undefined') {
        window.location.href = `/${resolvedParams.orgSlug}/finance`;
      }
    } else {
      setQueue((prev) => prev.filter((q) => q.id !== item.id));
    }
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
            balance={balance}
            monthlyIncome={monthlyIncome}
            monthlyExpense={monthlyExpense}
            duesComplianceRate={duesComplianceRate}
          />
        </div>
      </div>
    </div>
  );
}
