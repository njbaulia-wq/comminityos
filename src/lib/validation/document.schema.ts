import { z } from 'zod';

export const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export const ALLOWED_PROOF_MIMES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
] as const;

export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25MB
export const MAX_PROOF_SIZE = 5 * 1024 * 1024; // 5MB

export const CreateFolderSchema = z.object({
  organizationId: z.string().uuid({ message: 'ID organisasi harus format UUID valid' }),
  name: z
    .string()
    .trim()
    .min(1, { message: 'Nama folder tidak boleh kosong' })
    .max(100, { message: 'Nama folder maksimal 100 karakter' })
    .refine((val) => !/[/\\..]/.test(val), {
      message: 'Nama folder mengandung karakter tidak valid',
    }),
  parentId: z.string().uuid({ message: 'ID parent folder harus format UUID valid' }).optional().nullable(),
});

export const UploadDocumentSchema = z.object({
  organizationId: z.string().uuid({ message: 'ID organisasi harus format UUID valid' }),
  folderId: z.string().uuid({ message: 'ID folder harus format UUID valid' }).optional().nullable(),
  name: z.string().trim().min(1, { message: 'Nama file tidak boleh kosong' }).max(255),
  filePath: z.string().min(1, { message: 'Path file storage tidak boleh kosong' }),
  fileSize: z
    .number()
    .int()
    .positive({ message: 'Ukuran berkas harus lebih besar dari 0' })
    .max(MAX_DOCUMENT_SIZE, { message: 'Ukuran berkas melebihi batas 25MB' }),
  mimeType: z
    .string()
    .refine((val) => (ALLOWED_DOCUMENT_MIMES as readonly string[]).includes(val), {
      message: 'Tipe berkas tidak didukung (hanya PDF, Word, Excel, dan Gambar)',
    }),
  storageBucket: z.enum(['org-documents', 'payment-proofs']).default('org-documents'),
});

export const GetSignedUrlSchema = z.object({
  organizationId: z.string().uuid({ message: 'ID organisasi harus format UUID valid' }),
  documentId: z.string().uuid({ message: 'ID dokumen harus format UUID valid' }),
  expiresIn: z
    .number()
    .int()
    .min(60, { message: 'Waktu kadaluarsa minimal 60 detik' })
    .max(3600, { message: 'Waktu kadaluarsa maksimal 3600 detik (1 jam)' })
    .default(900), // 15 minutes
});

export type CreateFolderInput = z.infer<typeof CreateFolderSchema>;
export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>;
export type GetSignedUrlInput = z.infer<typeof GetSignedUrlSchema>;
