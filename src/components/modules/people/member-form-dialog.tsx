'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface MemberFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    fullName: string;
    phone?: string;
    houseNumber?: string;
    residentStatus?: string;
  }) => Promise<void> | void;
  initialData?: {
    fullName?: string;
    phone?: string;
    houseNumber?: string;
    residentStatus?: string;
  };
  errorMessage?: string | null;
  isLoading?: boolean;
}

export const MemberFormDialog: React.FC<MemberFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  errorMessage,
  isLoading = false,
}) => {
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [houseNumber, setHouseNumber] = useState(initialData?.houseNumber || '');
  const [residentStatus, setResidentStatus] = useState(
    initialData?.residentStatus || 'tetap'
  );

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName || '');
      setPhone(initialData.phone || '');
      setHouseNumber(initialData.houseNumber || '');
      setResidentStatus(initialData.residentStatus || 'tetap');
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      fullName,
      phone: phone || undefined,
      houseNumber: houseNumber || undefined,
      residentStatus,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Formulir Data Warga
        </h2>

        {errorMessage && (
          <div
            role="alert"
            className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
            >
              Nama Lengkap
            </label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Bambang Sudibyo"
              required
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
            >
              Nomor Telepon
            </label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890 (Opsional)"
            />
          </div>

          <div>
            <label
              htmlFor="houseNumber"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
            >
              Nomor Rumah
            </label>
            <Input
              id="houseNumber"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              placeholder="Contoh: Blok B No. 12"
            />
          </div>

          <div>
            <label
              htmlFor="residentStatus"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
            >
              Status Kependudukan
            </label>
            <select
              id="residentStatus"
              value={residentStatus}
              onChange={(e) => setResidentStatus(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option value="tetap">Tetap</option>
              <option value="kontrak">Kontrak</option>
              <option value="kost">Kost</option>
              <option value="pindah">Pindah</option>
              <option value="meninggal">Meninggal</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
