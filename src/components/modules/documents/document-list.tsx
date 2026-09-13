'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface DocumentViewItem {
  id: string;
  name: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  folderId?: string | null;
}

export interface DocumentListProps {
  documents: DocumentViewItem[];
  isLoading?: boolean;
  onDownload?: (doc: DocumentViewItem) => void;
  onDelete?: (doc: DocumentViewItem) => void;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading = false,
  onDownload,
  onDelete,
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

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-neutral-300 rounded-lg text-center text-sm text-neutral-500">
        Belum ada dokumen yang diunggah
      </div>
    );
  }

  const getMimeBadge = (mime: string) => {
    if (mime.includes('pdf')) return <Badge variant="destructive">PDF</Badge>;
    if (mime.includes('image')) return <Badge variant="secondary">Gambar</Badge>;
    if (mime.includes('word') || mime.includes('document')) return <Badge variant="outline">Word</Badge>;
    if (mime.includes('excel') || mime.includes('sheet')) return <Badge variant="success">Excel</Badge>;
    return <Badge variant="outline">Berkas</Badge>;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50">
          <tr>
            <th className="px-4 py-3">Nama Berkas</th>
            <th className="px-4 py-3">Tipe</th>
            <th className="px-4 py-3">Ukuran</th>
            <th className="px-4 py-3">Tanggal Unggah</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className="transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30"
            >
              <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                <span className="mr-2">📄</span>
                <span>{doc.name}</span>
              </td>
              <td className="px-4 py-3">{getMimeBadge(doc.mimeType)}</td>
              <td className="px-4 py-3 font-mono text-xs">{formatBytes(doc.fileSize)}</td>
              <td className="px-4 py-3 text-xs text-neutral-500">{doc.createdAt}</td>
              <td className="px-4 py-3 text-right space-x-2">
                {onDownload && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2"
                    onClick={() => onDownload(doc)}
                  >
                    Unduh
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2 text-red-600 hover:text-red-700"
                    onClick={() => onDelete(doc)}
                  >
                    Hapus
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
