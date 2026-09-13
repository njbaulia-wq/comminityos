'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { DueCitizenItem } from '@/components/modules/finance/dues-tracker';
import { formatIDR } from '@/lib/utils/currency';

export interface PaymentVerifyDialogProps {
  isOpen: boolean;
  dueItem?: DueCitizenItem | null;
  onClose: () => void;
  onConfirm: (dueItem: DueCitizenItem) => Promise<void> | void;
  isLoading?: boolean;
}

export const PaymentVerifyDialog: React.FC<PaymentVerifyDialogProps> = ({
  isOpen,
  dueItem,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen || !dueItem) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Verifikasi Pembayaran Iuran
        </h2>

        <div className="mt-4 space-y-3 rounded-lg bg-neutral-50 p-4 text-sm dark:bg-neutral-800/50">
          <div className="flex justify-between">
            <span className="text-neutral-500">Nama Warga:</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {dueItem.citizenName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">No. Rumah:</span>
            <span>{dueItem.houseNumber || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Tagihan:</span>
            <span>{dueItem.planTitle}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 dark:border-neutral-700">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              Jumlah Dibayar:
            </span>
            <span className="font-mono font-bold text-green-600 dark:text-green-400">
              {formatIDR(dueItem.amount)}
            </span>
          </div>
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          Memverifikasi pembayaran ini akan secara otomatis memperbarui status tagihan warga menjadi Lunas dan membukukan mutasi pemasukan kas ke akun kas operasional.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button
            onClick={() => onConfirm(dueItem)}
            isLoading={isLoading}
          >
            Konfirmasi Lunas & Bukukan
          </Button>
        </div>
      </div>
    </div>
  );
};
