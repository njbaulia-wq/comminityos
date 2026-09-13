import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createFolder,
  uploadDocument,
  getSignedDownloadUrl,
  deleteDocument,
  listDocumentsAndFolders,
  DocumentRepository,
} from '@/server/services/document.service';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

describe('Document & Storage Domain Service', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const folderId = '22222222-2222-4222-8222-222222222222';
  const docId = '33333333-3333-4333-8333-333333333333';

  let mockRepo: DocumentRepository;
  const adminCaller = { userId: 'usr-admin', roleName: 'Admin' };
  const memberCaller = { userId: 'usr-member', roleName: 'Member' };
  const outsiderCaller = { userId: 'usr-outsider', roleName: 'Stranger' };

  beforeEach(() => {
    mockRepo = {
      createFolder: vi.fn().mockImplementation(async (data) => ({
        id: 'new-folder-id',
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      findFolderById: vi.fn().mockImplementation(async (org, id) => {
        if (id === folderId) {
          return {
            id: folderId,
            organizationId: org,
            name: 'Surat Keputusan',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return null;
      }),
      listFolders: vi.fn().mockResolvedValue([]),
      createDocument: vi.fn().mockImplementation(async (data) => ({
        id: 'new-doc-id',
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      findDocumentById: vi.fn().mockImplementation(async (org, id) => {
        if (id === docId) {
          return {
            id: docId,
            organizationId: org,
            folderId,
            name: 'SK_RT_2026.pdf',
            filePath: 'org-1111/docs/sk.pdf',
            fileSize: 1024 * 500,
            mimeType: 'application/pdf',
            storageBucket: 'org-documents',
            isArchived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          };
        }
        return null;
      }),
      listDocuments: vi.fn().mockResolvedValue([]),
      softDeleteDocument: vi.fn().mockImplementation(async (org, id) => ({
        id,
        organizationId: org,
        deletedAt: new Date().toISOString(),
      })),
      generateSignedUrl: vi.fn().mockResolvedValue('https://supabase.co/storage/v1/object/sign/org-documents/sk.pdf?token=xyz'),
    };
  });

  describe('createFolder', () => {
    it('should create folder when caller has documents.manage permission', async () => {
      const folder = await createFolder({
        input: {
          organizationId: orgId,
          name: 'Laporan Keuangan',
        },
        caller: adminCaller,
        repo: mockRepo,
      });

      expect(folder).toBeDefined();
      expect(folder.name).toBe('Laporan Keuangan');
      expect(mockRepo.createFolder).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: orgId,
          name: 'Laporan Keuangan',
          createdBy: adminCaller.userId,
        })
      );
    });

    it('should reject when caller lacks documents.manage permission', async () => {
      await expect(
        createFolder({
          input: {
            organizationId: orgId,
            name: 'Laporan Rahasia',
          },
          caller: memberCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('uploadDocument', () => {
    it('should upload document metadata when validation and permissions pass', async () => {
      const doc = await uploadDocument({
        input: {
          organizationId: orgId,
          folderId,
          name: 'Peraturan_Warga.pdf',
          filePath: 'org-1111/docs/peraturan.pdf',
          fileSize: 1024 * 200,
          mimeType: 'application/pdf',
          storageBucket: 'org-documents',
        },
        caller: adminCaller,
        repo: mockRepo,
      });

      expect(doc).toBeDefined();
      expect(doc.name).toBe('Peraturan_Warga.pdf');
      expect(mockRepo.createDocument).toHaveBeenCalled();
    });

    it('should throw NotFoundError if referenced folderId does not exist', async () => {
      await expect(
        uploadDocument({
          input: {
            organizationId: orgId,
            folderId: '99999999-9999-4999-8999-999999999999',
            name: 'Peraturan_Warga.pdf',
            filePath: 'org-1111/docs/peraturan.pdf',
            fileSize: 1024 * 200,
            mimeType: 'application/pdf',
            storageBucket: 'org-documents',
          },
          caller: adminCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getSignedDownloadUrl', () => {
    it('should generate a 15-minute signed URL for authenticated member with documents.read', async () => {
      const url = await getSignedDownloadUrl({
        organizationId: orgId,
        documentId: docId,
        expiresIn: 900,
        caller: memberCaller,
        repo: mockRepo,
      });

      expect(url).toContain('https://supabase.co/storage');
      expect(mockRepo.generateSignedUrl).toHaveBeenCalledWith(
        'org-documents',
        'org-1111/docs/sk.pdf',
        900
      );
    });

    it('should reject unauthorized user without documents.read', async () => {
      await expect(
        getSignedDownloadUrl({
          organizationId: orgId,
          documentId: docId,
          caller: outsiderCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if document does not exist', async () => {
      await expect(
        getSignedDownloadUrl({
          organizationId: orgId,
          documentId: '99999999-9999-4999-8999-999999999999',
          caller: memberCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteDocument', () => {
    it('should perform soft delete when caller has documents.manage', async () => {
      const result = await deleteDocument({
        organizationId: orgId,
        documentId: docId,
        caller: adminCaller,
        repo: mockRepo,
      });

      expect(result.deletedAt).toBeDefined();
      expect(mockRepo.softDeleteDocument).toHaveBeenCalledWith(orgId, docId);
    });
  });
});
