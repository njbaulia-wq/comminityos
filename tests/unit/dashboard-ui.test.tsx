// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ActionQueue, ActionQueueItem } from '@/components/modules/dashboard/action-queue';
import { FinanceSnapshot } from '@/components/modules/dashboard/finance-snapshot';
import { UpcomingAgenda, AgendaActivity, UrgentTask } from '@/components/modules/dashboard/upcoming-agenda';
import OverviewPage from '@/app/(dashboard)/[orgSlug]/overview/page';

describe('Overview Dashboard UI Components', () => {
  const mockQueue: ActionQueueItem[] = [
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
  ];

  describe('ActionQueue', () => {
    it('should display pending approval items and action buttons', () => {
      const handleAction = vi.fn();
      render(<ActionQueue items={mockQueue} onActionClick={handleAction} />);

      expect(screen.getByText('Persetujuan Pengeluaran: Lampu Gang')).toBeDefined();
      expect(screen.getByText('Verifikasi Iuran: Siti Rahma')).toBeDefined();

      const actionButtons = screen.getAllByRole('button', { name: /proses|setujui/i });
      fireEvent.click(actionButtons[0]);
      expect(handleAction).toHaveBeenCalledWith(mockQueue[0]);
    });

    it('should display empty state when there are no pending actions', () => {
      render(<ActionQueue items={[]} />);
      expect(screen.getByText('Tidak ada tugas persetujuan tertunda')).toBeDefined();
    });
  });

  describe('FinanceSnapshot', () => {
    it('should display current balance and compliance percentage', () => {
      render(
        <FinanceSnapshot
          balance={12500000}
          monthlyIncome={4500000}
          monthlyExpense={1200000}
          duesComplianceRate={85}
        />
      );

      expect(screen.getByText('Ringkasan Kas & Iuran')).toBeDefined();
      expect(screen.getByText(/12\.500\.000/)).toBeDefined();
      expect(screen.getByText('85%')).toBeDefined();
    });
  });

  describe('UpcomingAgenda', () => {
    const mockActivities: AgendaActivity[] = [
      {
        id: 'act-1',
        title: 'Kerja Bakti Lingkungan RT 05',
        startDate: '2026-09-20',
        status: 'active',
      },
    ];

    const mockTasks: UrgentTask[] = [
      {
        id: 't-1',
        title: 'Beli Cat Pos Ronda',
        dueDate: '2026-09-18',
        priority: 'urgent',
      },
    ];

    it('should render upcoming activities and urgent tasks', () => {
      render(<UpcomingAgenda activities={mockActivities} tasks={mockTasks} />);

      expect(screen.getByText('Kerja Bakti Lingkungan RT 05')).toBeDefined();
      expect(screen.getByText('Beli Cat Pos Ronda')).toBeDefined();
      expect(screen.getByText('urgent')).toBeDefined();
    });
  });

  describe('OverviewPage', () => {
    it('should render command center overview and main widgets', async () => {
      await React.act(async () => {
        render(<OverviewPage params={Promise.resolve({ orgSlug: 'rt05-rw02' })} />);
      });

      expect(screen.getByText('Pusat Kendali Organisasi')).toBeDefined();
      expect(screen.getByText('Antrean Tindakan & Persetujuan')).toBeDefined();
      expect(screen.getByText('Agenda & Tenggat Waktu')).toBeDefined();
    });
  });
});
