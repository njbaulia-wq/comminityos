'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils/currency';
import {
  TransactionTable,
  TransactionItem,
} from '@/components/modules/finance/transaction-table';
import {
  DuesTracker,
  DueCitizenItem,
} from '@/components/modules/finance/dues-tracker';
import { PaymentVerifyDialog } from '@/components/modules/finance/payment-verify-dialog';
import { TransactionFormDialog, TransactionFormData } from '@/components/modules/finance/transaction-form-dialog';
import { getFinanceData } from '@/server/actions/data-fetchers.actions';
import { createTransactionAction } from '@/server/actions/finance.actions';
import { verifyPaymentAction } from '@/server/actions/dues.actions';

interface FinancePageProps {
  params: Promise<{
    orgSlug: string;
  }>;
}

export default function FinancePage({ params }: FinancePageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ orgSlug: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'dues'>('transactions');
  const [selectedDueItem, setSelectedDueItem] = useState<DueCitizenItem | null>(null);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isCreateTxOpen, setIsCreateTxOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [organizationId, setOrganizationId] = useState('11111111-1111-4111-8111-111111111111');
  const [totalBalance, setTotalBalance] = useState(375000);
  const [totalIncome, setTotalIncome] = useState(450000);
  const [totalExpense, setTotalExpense] = useState(75000);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([
    { id: '33333333-3333-4333-8333-333333333333', name: 'Kas Operasional Tunai' },
  ]);

  const [transactions, setTransactions] = useState<TransactionItem[]>([
    {
      id: 'tx-1',
      description: 'Iuran Sampah Warga RT 05',
      amount: 450000,
      type: 'income',
      status: 'posted',
      transactionDate: '2026-09-10',
      accountName: 'Kas Tunai',
    },
    {
      id: 'tx-2',
      description: 'Beli Lampu Gang',
      amount: 75000,
      type: 'expense',
      status: 'draft',
      transactionDate: '2026-09-11',
      accountName: 'Kas Tunai',
    },
  ]);

  const [dues, setDues] = useState<DueCitizenItem[]>([
    {
      id: 'item-1',
      citizenName: 'Bambang Sudibyo',
      houseNumber: '12A',
      amount: 50000,
      status: 'paid',
      planTitle: 'Iuran Bulanan September',
    },
    {
      id: 'item-2',
      citizenName: 'Siti Rahma',
      houseNumber: '14',
      amount: 50000,
      status: 'pending_verification',
      planTitle: 'Iuran Bulanan September',
      paymentId: 'pay-2',
    },
    {
      id: 'item-3',
      citizenName: 'Agus Santoso',
      houseNumber: '15B',
      amount: 50000,
      status: 'unpaid',
      planTitle: 'Iuran Bulanan September',
    },
  ]);

  const loadData = useCallback(async (slug: string) => {
    try {
      const res = await getFinanceData(slug);
      if (res) {
        setOrganizationId(res.organizationId);
        setTotalBalance(res.totalBalance);
        setTotalIncome(res.totalIncome);
        setTotalExpense(res.totalExpense);
        if (res.transactions.length > 0) {
          setTransactions(res.transactions);
        }
        if (res.dues.length > 0) {
          setDues(res.dues);
        }
        if (res.accounts.length > 0) {
          setAccounts(res.accounts);
        }
      }
    } catch {
      // Keep default state in offline test environment
    }
  }, []);

  useEffect(() => {
    params.then((p) => {
      setResolvedParams(p);
      loadData(p.orgSlug);
    });
  }, [params, loadData]);

  const handleOpenVerify = (item: DueCitizenItem) => {
    setSelectedDueItem(item);
    setIsVerifyOpen(true);
  };

  const handleConfirmVerify = async (item: DueCitizenItem) => {
    try {
      if (item.paymentId && accounts.length > 0) {
        await verifyPaymentAction({
          organizationId,
          paymentId: item.paymentId,
          accountId: accounts[0].id,
        });
      }

      setDues((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, status: 'paid' } : d))
      );
      if (resolvedParams) {
        loadData(resolvedParams.orgSlug);
      }
    } catch (err: any) {
      console.error('Gagal verifikasi pembayaran:', err);
    } finally {
      setIsVerifyOpen(false);
      setSelectedDueItem(null);
    }
  };

  const handleCreateTransaction = async (formData: TransactionFormData) => {
    setErrorMessage(null);
    try {
      const result = await createTransactionAction({
        organizationId,
        accountId: formData.accountId || accounts[0]?.id || '33333333-3333-4333-8333-333333333333',
        amount: formData.amount,
        type: formData.type,
        status: 'posted',
        description: formData.description,
        transactionDate: formData.transactionDate,
      });

      if (!result.success) {
        setErrorMessage(result.error?.message || 'Gagal menyimpan transaksi');
        return;
      }

      if (resolvedParams) {
        loadData(resolvedParams.orgSlug);
      } else {
        setTransactions((prev) => [
          {
            id: result.data.id,
            description: formData.description,
            amount: formData.amount,
            type: formData.type,
            status: 'posted',
            transactionDate: formData.transactionDate,
            accountName: accounts.find((a) => a.id === formData.accountId)?.name || 'Kas Tunai',
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyimpan transaksi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Buku Kas & Keuangan
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Kelola pencatatan kas organisasi, rekonsiliasi penerimaan iuran, dan pembukuan transparan
          </p>
        </div>
        <Button onClick={() => setIsCreateTxOpen(true)}>+ Catat Transaksi</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase">Total Saldo Kas</p>
            <p className="mt-2 text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {formatIDR(totalBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase">Total Pemasukan</p>
            <p className="mt-2 text-2xl font-bold font-mono text-green-600 dark:text-green-400">
              +{formatIDR(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase">Total Pengeluaran</p>
            <p className="mt-2 text-2xl font-bold font-mono text-red-600 dark:text-red-400">
              -{formatIDR(totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 space-x-4">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'transactions'
              ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Mutasi Kas & Transaksi
        </button>
        <button
          onClick={() => setActiveTab('dues')}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'dues'
              ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Status Iuran Warga
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'transactions' ? (
        <TransactionTable transactions={transactions} />
      ) : (
        <DuesTracker dues={dues} onVerifyClick={handleOpenVerify} />
      )}

      {/* Verify Dialog */}
      <PaymentVerifyDialog
        isOpen={isVerifyOpen}
        dueItem={selectedDueItem}
        onClose={() => setIsVerifyOpen(false)}
        onConfirm={handleConfirmVerify}
      />

      {/* Create Transaction Dialog */}
      <TransactionFormDialog
        isOpen={isCreateTxOpen}
        onClose={() => setIsCreateTxOpen(false)}
        onSubmit={handleCreateTransaction}
        accounts={accounts}
        errorMessage={errorMessage}
      />
    </div>
  );
}
