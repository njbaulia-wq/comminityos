import { describe, it, expect, vi } from 'vitest';
import {
  createFolderAction,
  uploadDocumentAction,
  getSignedDownloadUrlAction,
  deleteDocumentAction,
} from '@/server/actions/document.actions';
import { DocumentRepository } from '@/server/services/document.service';

describe('Document Server Actions', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const folderId = '22222222-2222-4222-8222-222222222222';
  const docId = '33333333-3333-4333-8333-333333333333';

  const mockRepo: DocumentRepository = {
    createFolder: vi.fn().mockImplementation(async (d) => ({ id: 'f-1', ...d })),
    findFolderById: vi.fn().mockImplementation(async (org, id) => {
      if (id === folderId) return { id, organizationId: org, name: 'Folder Arsip' } as any;
      return null;
    }),
    listFolders: vi.fn().mockResolvedValue([]),
    createDocument: vi.fn().mockImplementation(async (d) => ({ id: 'doc-1', ...d })),
    findDocumentById: vi.fn().mockImplementation(async (org, id) => {
      if (id === docId) {
        return {
          id,
          organizationId: org,
          name: 'dokumen.pdf',
          filePath: 'org/dokumen.pdf',
          storageBucket: 'org-documents',
          deletedAt: null,
        } as any;
      }
      return null;
    }),
    listDocuments: vi.fn().mockResolvedValue([]),
    softDeleteDocument: vi.fn().mockImplementation(async (org, id) => ({ id, organizationId: org, deletedAt: new Date().toISOString() })),
    generateSignedUrl: vi.fn().mockResolvedValue('https://storage.supabase.co/signed-url'),
  };

  const adminContext = {
    userId: 'usr-admin',
    roleName: 'Admin',
    repo: mockRepo,
    requestId: 'req-act-1',
  };

  const memberContext = {
    userId: 'usr-member',
    roleName: 'Member',
    repo: mockRepo,
    requestId: 'req-act-2',
  };

  describe('createFolderAction', () => {
    it('should create folder and return successful ActionResult', async () => {
      const res = await createFolderAction(
        {
          organizationId: orgId,
          name: 'Dokumen RT 2026',
        },
        adminContext
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.name).toBe('Dokumen RT 2026');
      }
    });

    it('should return error ActionResult on permission denial', async () => {
      const res = await createFolderAction(
        {
          organizationId: orgId,
          name: 'Dokumen Rahasia',
        },
        memberContext
      );

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('FORBIDDEN');
      }
    });

    it('should return VALIDATION_ERROR for invalid folder name', async () => {
      const res = await createFolderAction(
        {
          organizationId: orgId,
          name: '',
        },
        adminContext
      );

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('getSignedDownloadUrlAction', () => {
    it('should return signed URL for authorized member', async () => {
      const res = await getSignedDownloadUrlAction(
        {
          organizationId: orgId,
          documentId: docId,
          expiresIn: 900,
        },
        memberContext
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.signedUrl).toBe('https://storage.supabase.co/signed-url');
      }
    });

    it('should return NOT_FOUND error when document does not exist', async () => {
      const res = await getSignedDownloadUrlAction(
        {
          organizationId: orgId,
          documentId: '99999999-9999-4999-8999-999999999999',
        },
        memberContext
      );

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('deleteDocumentAction', () => {
    it('should soft delete document and return success', async () => {
      const res = await deleteDocumentAction(
        {
          organizationId: orgId,
          documentId: docId,
        },
        adminContext
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.deletedAt).toBeDefined();
      }
    });
  });
});
