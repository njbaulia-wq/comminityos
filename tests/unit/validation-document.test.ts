import { describe, it, expect } from 'vitest';
import {
  CreateFolderSchema,
  UploadDocumentSchema,
  GetSignedUrlSchema,
  ALLOWED_DOCUMENT_MIMES,
  ALLOWED_PROOF_MIMES,
  MAX_DOCUMENT_SIZE,
  MAX_PROOF_SIZE,
} from '@/lib/validation/document.schema';

describe('Zod Schemas for Documents & Uploads', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const folderId = '22222222-2222-4222-8222-222222222222';
  const docId = '33333333-3333-4333-8333-333333333333';

  describe('CreateFolderSchema', () => {
    it('should validate a valid folder creation', () => {
      const valid = {
        organizationId: orgId,
        name: 'Laporan Keuangan 2026',
        parentId: folderId,
      };

      const parsed = CreateFolderSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject empty folder name or path traversal characters', () => {
      const emptyName = {
        organizationId: orgId,
        name: '',
      };
      const parsedEmpty = CreateFolderSchema.safeParse(emptyName);
      expect(parsedEmpty.success).toBe(false);

      const pathTraversal = {
        organizationId: orgId,
        name: '../secret/folder',
      };
      const parsedTraversal = CreateFolderSchema.safeParse(pathTraversal);
      expect(parsedTraversal.success).toBe(false);
      if (!parsedTraversal.success) {
        expect(parsedTraversal.error.flatten().fieldErrors.name?.[0]).toContain('karakter tidak valid');
      }
    });
  });

  describe('UploadDocumentSchema', () => {
    it('should validate valid document metadata with allowed mime type and size', () => {
      const valid = {
        organizationId: orgId,
        folderId,
        name: 'SK_Pengurus_RT_2026.pdf',
        filePath: 'org-1111/docs/sk-pengurus.pdf',
        fileSize: 1024 * 1024 * 2, // 2MB
        mimeType: 'application/pdf',
        storageBucket: 'org-documents' as const,
      };

      const parsed = UploadDocumentSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject unsupported or dangerous mime types', () => {
      const dangerous = {
        organizationId: orgId,
        name: 'script.sh',
        filePath: 'org-1111/docs/script.sh',
        fileSize: 1024,
        mimeType: 'application/x-sh',
      };

      const parsed = UploadDocumentSchema.safeParse(dangerous);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.mimeType?.[0]).toContain('Tipe berkas tidak didukung');
      }
    });

    it('should reject file sizes larger than 25MB', () => {
      const oversize = {
        organizationId: orgId,
        name: 'video_arsip.pdf',
        filePath: 'org-1111/docs/big.pdf',
        fileSize: 30 * 1024 * 1024, // 30MB
        mimeType: 'application/pdf',
      };

      const parsed = UploadDocumentSchema.safeParse(oversize);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.fileSize?.[0]).toContain('25MB');
      }
    });

    it('should reject non-positive file size', () => {
      const zeroSize = {
        organizationId: orgId,
        name: 'empty.pdf',
        filePath: 'org-1111/docs/empty.pdf',
        fileSize: 0,
        mimeType: 'application/pdf',
      };

      const parsed = UploadDocumentSchema.safeParse(zeroSize);
      expect(parsed.success).toBe(false);
    });
  });

  describe('GetSignedUrlSchema', () => {
    it('should validate valid signed url request', () => {
      const valid = {
        organizationId: orgId,
        documentId: docId,
        expiresIn: 900,
      };

      const parsed = GetSignedUrlSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject expiration exceeding maximum 3600 seconds', () => {
      const invalid = {
        organizationId: orgId,
        documentId: docId,
        expiresIn: 7200,
      };

      const parsed = GetSignedUrlSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });
});
