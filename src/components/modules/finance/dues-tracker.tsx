'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatIDR } from '@/lib/utils/currency';

export interface DueCitizenItem {
  id: string;
  citizenName: string;
  houseNumber?: string | null;
  amount: number;
  status: 'unpaid' | 'pending_verification' | 'paid' | 'waived';
  planTitle: string;
  paymentId?: string;
}

export interface DuesTrackerProps {
  dues: DueCitizenItem[];
  onVerifyClick?: (item: DueCitizenItem) => void;
}

export const DuesTracker: React.FC<DuesTrackerProps> = ({ dues, onVerifyClick }) => {
  const getStatusBadge = (status: DueCitizenItem['status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Lunas</Badge>;
      case 'pending_verification':
        return <Badge variant="warning">Perlu Verifikasi</Badge>;
      case 'waived':
        return <Badge variant="secondary">Dibebaskan</Badge>;
      default:
        return <Badge variant="outline">Belum Bayar</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50">
          <tr>
            <th className="px-4 py-3">Nama Warga</th>
            <th className="px-4 py-3">No. Rumah</th>
            <th className="px-4 py-3">Tagihan Iuran</th>
            <th className="px-4 py-3">Nominal</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {dues.map((item) => (
            <tr
              key={item.id}
              className="transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30"
            >
              <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                {item.citizenName}
              </td>
              <td className="px-4 py-3 text-neutral-500">{item.houseNumber || '-'}</td>
              <td className="px-4 py-3 text-xs">{item.planTitle}</td>
              <td className="px-4 py-3 font-mono font-medium">{formatIDR(item.amount)}</td>
              <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
              <td className="px-4 py-3 text-right">
                {item.status === 'pending_verification' && (
                  <Button
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => onVerifyClick && onVerifyClick(item)}
                  >
                    Verifikasi
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
