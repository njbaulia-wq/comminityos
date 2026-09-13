'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils/currency';

export interface FinanceSnapshotProps {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  duesComplianceRate: number; // e.g. 85 for 85%
  isLoading?: boolean;
}

export const FinanceSnapshot: React.FC<FinanceSnapshotProps> = ({
  balance,
  monthlyIncome,
  monthlyExpense,
  duesComplianceRate,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-1/3 bg-neutral-200 rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 bg-neutral-100 rounded" />
          <div className="h-8 bg-neutral-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Ringkasan Kas & Iuran
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-xs text-neutral-500 uppercase font-medium">
            Saldo Kas Terkini
          </span>
          <p className="mt-1 text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {formatIDR(balance)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <div>
            <span className="text-neutral-500">Pemasukan Bulan Ini</span>
            <p className="font-semibold font-mono text-green-600 dark:text-green-400">
              +{formatIDR(monthlyIncome)}
            </p>
          </div>
          <div>
            <span className="text-neutral-500">Pengeluaran Bulan Ini</span>
            <p className="font-semibold font-mono text-red-600 dark:text-red-400">
              -{formatIDR(monthlyExpense)}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Kepatuhan Iuran Warga:</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              {duesComplianceRate}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${Math.min(Math.max(duesComplianceRate, 0), 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
