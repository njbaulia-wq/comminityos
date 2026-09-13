// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  TransactionTable,
  TransactionItem,
} from '@/components/modules/finance/transaction-table';
import {
  DuesTracker,
  DueCitizenItem,
} from '@/components/modules/finance/dues-tracker';
import { PaymentVerifyDialog } from '@/components/modules/finance/payment-verify-dialog';
import FinancePage from '@/app/(dashboard)/[orgSlug]/finance/page';

describe('Finance & Dues UI Components', () => {
  const mockTransactions: TransactionItem[] = [
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
  ];

  const mockDues: DueCitizenItem[] = [
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
  ];

  describe('TransactionTable', () => {
    it('should format numbers into Rupiah and display transaction rows', () => {
      render(<TransactionTable transactions={mockTransactions} />);

      expect(screen.getByText('Iuran Sampah Warga RT 05')).toBeDefined();
      expect(screen.getByText(/450\.000/)).toBeDefined();
      expect(screen.getByText('Beli Lampu Gang')).toBeDefined();
      expect(screen.getByText(/75\.000/)).toBeDefined();
    });

    it('should show posted badge and disable editing for posted transactions', () => {
      render(<TransactionTable transactions={mockTransactions} />);

      expect(screen.getByText('posted')).toBeDefined();
      expect(screen.getByText('draft')).toBeDefined();

      // Row 1 (posted) should have disabled edit/delete button or indicate locked
      const editButtons = screen.queryAllByRole('button', { name: /ubah/i });
      expect(editButtons.length).toBe(1); // Only for draft (row 2)
    });

    it('should render empty state when transaction list is empty', () => {
      render(<TransactionTable transactions={[]} />);
      expect(screen.getByText('Belum ada transaksi kas')).toBeDefined();
    });
  });

  describe('DuesTracker', () => {
    it('should display dues matrix with badges for paid, pending, and unpaid', () => {
      render(<DuesTracker dues={mockDues} onVerifyClick={vi.fn()} />);

      expect(screen.getByText('Bambang Sudibyo')).toBeDefined();
      expect(screen.getByText('Siti Rahma')).toBeDefined();
      expect(screen.getByText('Agus Santoso')).toBeDefined();

      expect(screen.getByText('Lunas')).toBeDefined();
      expect(screen.getByText('Perlu Verifikasi')).toBeDefined();
      expect(screen.getByText('Belum Bayar')).toBeDefined();
    });

    it('should trigger onVerifyClick when verifikasi button is clicked', () => {
      const handleVerify = vi.fn();
      render(<DuesTracker dues={mockDues} onVerifyClick={handleVerify} />);

      const verifyBtn = screen.getByRole('button', { name: /verifikasi/i });
      fireEvent.click(verifyBtn);
      expect(handleVerify).toHaveBeenCalledWith(mockDues[1]);
    });
  });

  describe('PaymentVerifyDialog', () => {
    it('should display payment details and confirm button', () => {
      const handleConfirm = vi.fn();
      render(
        <PaymentVerifyDialog
          isOpen={true}
          dueItem={mockDues[1]}
          onClose={vi.fn()}
          onConfirm={handleConfirm}
        />
      );

      expect(screen.getByText(/Verifikasi Pembayaran Iuran/i)).toBeDefined();
      expect(screen.getByText(/50\.000/)).toBeDefined();

      const confirmBtn = screen.getByRole('button', { name: /Konfirmasi Lunas & Bukukan/i });
      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalled();
    });
  });

  describe('FinancePage', () => {
    it('should render page title and balance overview cards', async () => {
      await React.act(async () => {
        render(<FinancePage params={Promise.resolve({ orgSlug: 'rt05-rw02' })} />);
      });

      expect(screen.getByText('Buku Kas & Keuangan')).toBeDefined();
      expect(screen.getByText(/Total Saldo Kas/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /\+ Catat Transaksi/i })).toBeDefined();
    });
  });
});
