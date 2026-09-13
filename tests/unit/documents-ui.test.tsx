// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FolderTree } from '@/components/modules/documents/folder-tree';
import { DocumentList, DocumentViewItem } from '@/components/modules/documents/document-list';
import { FileUploader } from '@/components/modules/documents/file-uploader';
import DocumentsPage from '@/app/(dashboard)/[orgSlug]/documents/page';

describe('Documents UI Components', () => {
  const mockFolders = [
    { id: 'f-1', name: 'Surat Keputusan RT' },
    { id: 'f-2', name: 'Laporan Pertanggungjawaban' },
  ];

  const mockDocuments: DocumentViewItem[] = [
    {
      id: 'd-1',
      name: 'SK_Kepengurusan_2026.pdf',
      fileSize: 1024 * 1024 * 2, // 2MB
      mimeType: 'application/pdf',
      createdAt: '2026-09-10',
      folderId: 'f-1',
    },
    {
      id: 'd-2',
      name: 'Denah_Pos_Ronda.png',
      fileSize: 1024 * 500, // 500KB
      mimeType: 'image/png',
      createdAt: '2026-09-11',
      folderId: null,
    },
  ];

  describe('FolderTree', () => {
    it('should render folder list and allow selection', () => {
      const handleSelect = vi.fn();
      render(
        <FolderTree
          folders={mockFolders}
          selectedFolderId="f-1"
          onSelectFolder={handleSelect}
        />
      );

      expect(screen.getByText('Surat Keputusan RT')).toBeDefined();
      expect(screen.getByText('Laporan Pertanggungjawaban')).toBeDefined();

      fireEvent.click(screen.getByText('Laporan Pertanggungjawaban'));
      expect(handleSelect).toHaveBeenCalledWith('f-2');
    });
  });

  describe('DocumentList', () => {
    it('should render documents with formatted size and download button', () => {
      const handleDownload = vi.fn();
      render(
        <DocumentList
          documents={mockDocuments}
          onDownload={handleDownload}
        />
      );

      expect(screen.getByText('SK_Kepengurusan_2026.pdf')).toBeDefined();
      expect(screen.getByText(/2\.0 MB|2 MB/)).toBeDefined();
      expect(screen.getByText('Denah_Pos_Ronda.png')).toBeDefined();

      const downloadButtons = screen.getAllByRole('button', { name: /unduh/i });
      fireEvent.click(downloadButtons[0]);
      expect(handleDownload).toHaveBeenCalledWith(mockDocuments[0]);
    });

    it('should render empty state when document list is empty', () => {
      render(<DocumentList documents={[]} />);
      expect(screen.getByText('Belum ada dokumen yang diunggah')).toBeDefined();
    });
  });

  describe('FileUploader', () => {
    it('should show error when client selects file exceeding 25MB', async () => {
      const handleUpload = vi.fn();
      render(
        <FileUploader
          isOpen={true}
          onClose={vi.fn()}
          onUpload={handleUpload}
        />
      );

      // Create dummy file > 25MB
      const bigFile = new File(['a'.repeat(100)], 'huge.pdf', { type: 'application/pdf' });
      Object.defineProperty(bigFile, 'size', { value: 30 * 1024 * 1024 });

      const input = screen.getByTestId('file-input');
      fireEvent.change(input, { target: { files: [bigFile] } });

      expect(await screen.findByText(/melebihi batas 25MB/i)).toBeDefined();
      expect(handleUpload).not.toHaveBeenCalled();
    });
  });

  describe('DocumentsPage', () => {
    it('should render header and upload button', async () => {
      await React.act(async () => {
        render(<DocumentsPage params={Promise.resolve({ orgSlug: 'rt05-rw02' })} />);
      });

      expect(screen.getByText('Penyimpanan Dokumen Organisasi')).toBeDefined();
      expect(screen.getByRole('button', { name: /\+ Unggah Dokumen/i })).toBeDefined();
    });
  });
});
