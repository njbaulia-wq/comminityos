'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatIDR } from '@/lib/utils/currency';

export interface TransactionItem {
  id: string;
  description?: string | null;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  status: 'draft' | 'pending_approval' | 'posted' | 'void';
  transactionDate: string;
  accountName?: string;
}

export interface TransactionTableProps {
  transactions: TransactionItem[];
  isLoading?: boolean;
  onEdit?: (tx: TransactionItem) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  isLoading = false,
  onEdit,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4 border border-neutral-200 rounded-lg animate-pulse">
        <div className="h-6 w-1/4 bg-neutral-200 rounded" />
        <div className="h-10 bg-neutral-100 rounded" />
        <div className="h-10 bg-neutral-100 rounded" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-neutral-300 rounded-lg text-center text-sm text-neutral-500">
        Belum ada transaksi kas
      </div>
    );
  }

  const getStatusBadge = (status: TransactionItem['status']) => {
    switch (status) {
      case 'posted':
        return <Badge variant="success">posted</Badge>;
      case 'pending_approval':
        return <Badge variant="warning">pending_approval</Badge>;
      case 'void':
        return <Badge variant="destructive">void</Badge>;
      default:
        return <Badge variant="secondary">draft</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50">
          <tr>
            <th className="px-4 py-3">Tanggal</th>
            <th className="px-4 py-3">Deskripsi</th>
            <th className="px-4 py-3">Akun</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Nominal</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {transactions.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <tr
                key={tx.id}
                className="transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30"
              >
                <td className="px-4 py-3 font-mono text-xs">{tx.transactionDate}</td>
                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                  {tx.description || '-'}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500">
                  {tx.accountName || 'Kas Operasional'}
                </td>
                <td className="px-4 py-3">{getStatusBadge(tx.status)}</td>
                <td
                  className={`px-4 py-3 text-right font-mono font-semibold ${
                    isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {isIncome ? '+' : '-'} {formatIDR(tx.amount)}
                </td>
                <td className="px-4 py-3 text-right">
                  {tx.status !== 'posted' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2"
                      onClick={() => onEdit && onEdit(tx)}
                    >
                      Ubah
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
