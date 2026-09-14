'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  FolderTree,
  FolderItem,
} from '@/components/modules/documents/folder-tree';
import {
  DocumentList,
  DocumentViewItem,
} from '@/components/modules/documents/document-list';
import { FileUploader } from '@/components/modules/documents/file-uploader';
import { getDocumentsData } from '@/server/actions/data-fetchers.actions';
import {
  uploadDocumentAction,
  deleteDocumentAction,
  getSignedDownloadUrlAction,
} from '@/server/actions/document.actions';

interface DocumentsPageProps {
  params: Promise<{
    orgSlug: string;
  }>;
}

export default function DocumentsPage({ params }: DocumentsPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ orgSlug: string } | null>(null);
  const [organizationId, setOrganizationId] = useState('11111111-1111-4111-8111-111111111111');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  const [folders, setFolders] = useState<FolderItem[]>([
    { id: 'f-1', name: 'Surat Keputusan RT' },
    { id: 'f-2', name: 'Laporan Pertanggungjawaban' },
  ]);

  const [documents, setDocuments] = useState<DocumentViewItem[]>([
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
  ]);

  const loadDocuments = useCallback(async (slug: string) => {
    try {
      const res = await getDocumentsData(slug);
      if (res) {
        setOrganizationId(res.organizationId);
        if (res.folders.length > 0) {
          setFolders(res.folders);
        }
        if (res.documents.length > 0) {
          setDocuments(res.documents);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    params.then((p) => {
      setResolvedParams(p);
      loadDocuments(p.orgSlug);
    });
  }, [params, loadDocuments]);

  const filteredDocuments = selectedFolderId
    ? documents.filter((doc) => doc.folderId === selectedFolderId)
    : documents;

  const handleUpload = async (file: File, folderId?: string | null) => {
    const filePath = `${organizationId}/${Date.now()}_${file.name}`;
    const newDoc: DocumentViewItem = {
      id: 'd-' + Date.now(),
      name: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      createdAt: new Date().toISOString().split('T')[0],
      folderId: folderId || null,
    };
    setDocuments((prev) => [newDoc, ...prev]);

    try {
      await uploadDocumentAction({
        organizationId,
        folderId: folderId || undefined,
        name: file.name,
        filePath,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        storageBucket: 'org-documents',
      });
      if (resolvedParams) {
        await loadDocuments(resolvedParams.orgSlug);
      }
    } catch (err: any) {
      console.error('Gagal mengunggah dokumen:', err);
    }
  };

  const handleDownload = async (doc: DocumentViewItem) => {
    try {
      const res = await getSignedDownloadUrlAction({
        organizationId,
        documentId: doc.id,
      });
      if (res.success && res.data.signedUrl) {
        window.open(res.data.signedUrl, '_blank');
      } else {
        alert(`Mengunduh dokumen: ${doc.name}`);
      }
    } catch {
      alert(`Mengunduh dokumen: ${doc.name}`);
    }
  };

  const handleDelete = async (doc: DocumentViewItem) => {
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));

    try {
      await deleteDocumentAction({
        organizationId,
        documentId: doc.id,
      });
      if (resolvedParams) {
        await loadDocuments(resolvedParams.orgSlug);
      }
    } catch (err: any) {
      console.error('Gagal menghapus dokumen:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Penyimpanan Dokumen Organisasi
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Arsip dokumen resmi, surat edaran, notula rapat, dan berkas privat warga
          </p>
        </div>
        <Button onClick={() => setIsUploaderOpen(true)}>+ Unggah Dokumen</Button>
      </div>

      {/* Explorer Layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
          />
        </div>

        <div className="md:col-span-3">
          <DocumentList
            documents={filteredDocuments}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Uploader Dialog */}
      <FileUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onUpload={handleUpload}
        currentFolderId={selectedFolderId}
      />
    </div>
  );
}
