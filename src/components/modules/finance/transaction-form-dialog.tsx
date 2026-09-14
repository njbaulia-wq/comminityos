'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface TransactionFormData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  accountId: string;
  transactionDate: string;
}

export interface TransactionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  accounts: Array<{ id: string; name: string }>;
  errorMessage?: string | null;
}

export function TransactionFormDialog({
  isOpen,
  onClose,
  onSubmit,
  accounts,
  errorMessage,
}: TransactionFormDialogProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        description,
        amount: Number(amount),
        type,
        accountId: accountId || accounts[0]?.id || '',
        transactionDate,
      });
      setDescription('');
      setAmount('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Catat Transaksi Kas Baru
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Masukkan mutasi pemasukan atau pengeluaran kas resmi organisasi
        </p>

        {errorMessage && (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Jenis Transaksi
            </label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border ${
                  type === 'income'
                    ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                    : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400'
                }`}
              >
                + Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border ${
                  type === 'expense'
                    ? 'border-red-600 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                    : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400'
                }`}
              >
                - Pengeluaran
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Uraian Transaksi
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Iuran Sampah Warga RT 05"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Nominal (Rp)
            </label>
            <input
              type="number"
              required
              min="1000"
              placeholder="Contoh: 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Pilihan Akun Kas / Bank
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
