'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ALLOWED_DOCUMENT_MIMES,
  MAX_DOCUMENT_SIZE,
} from '@/lib/validation/document.schema';

export interface FileUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, folderId?: string | null) => Promise<void> | void;
  currentFolderId?: string | null;
  isLoading?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  isOpen,
  onClose,
  onUpload,
  currentFolderId = null,
  isLoading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size: 25MB max
    if (file.size > MAX_DOCUMENT_SIZE) {
      setErrorMessage('Ukuran berkas melebihi batas 25MB');
      setSelectedFile(null);
      return;
    }

    // Validate MIME type
    const isAllowedMime = (ALLOWED_DOCUMENT_MIMES as readonly string[]).includes(file.type);
    if (file.type && !isAllowedMime) {
      setErrorMessage('Tipe berkas tidak didukung (hanya PDF, Word, Excel, Gambar)');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile, currentFolderId);
    setSelectedFile(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Unggah Dokumen Baru
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Pilih berkas dari perangkat Anda. Format didukung: PDF, Word, Excel, Gambar (Maks 25MB).
        </p>

        <div className="mt-4">
          <input
            data-testid="file-input"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 dark:file:bg-neutral-800 dark:file:text-neutral-200"
          />
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        {selectedFile && !errorMessage && (
          <div className="mt-3 text-xs text-green-600 dark:text-green-400">
            Berkas siap diunggah: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(0)} KB)
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button
            onClick={handleConfirmUpload}
            disabled={!selectedFile || !!errorMessage || isLoading}
            isLoading={isLoading}
          >
            Unggah Berkas
          </Button>
        </div>
      </div>
    </div>
  );
};
