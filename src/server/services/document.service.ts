import {
  CreateFolderInput,
  CreateFolderSchema,
  UploadDocumentInput,
  UploadDocumentSchema,
  GetSignedUrlInput,
  GetSignedUrlSchema,
} from '@/lib/validation/document.schema';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/lib/errors';
import { logger } from '@/lib/logger';
import { assertPermission } from '@/server/services/permission.service';

export interface CallerContext {
  userId: string;
  roleName: string;
}

export interface DocumentFolder {
  id: string;
  organizationId: string;
  name: string;
  parentId?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  organizationId: string;
  folderId?: string | null;
  name: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  storageBucket: string;
  isArchived: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface DocumentRepository {
  createFolder(data: any): Promise<DocumentFolder>;
  findFolderById(organizationId: string, id: string): Promise<DocumentFolder | null>;
  listFolders(organizationId: string, parentId?: string | null): Promise<DocumentFolder[]>;
  createDocument(data: any): Promise<DocumentItem>;
  findDocumentById(organizationId: string, id: string): Promise<DocumentItem | null>;
  listDocuments(organizationId: string, folderId?: string | null): Promise<DocumentItem[]>;
  softDeleteDocument(organizationId: string, id: string): Promise<DocumentItem>;
  generateSignedUrl(bucket: string, filePath: string, expiresInSeconds: number): Promise<string>;
}

function parseValidationErrors(error: any): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'root';
    if (!fieldErrors[field]) fieldErrors[field] = [];
    fieldErrors[field].push(issue.message);
  }
  return fieldErrors;
}

export async function createFolder(params: {
  input: CreateFolderInput;
  caller: CallerContext;
  repo: DocumentRepository;
  requestId?: string;
}): Promise<DocumentFolder> {
  const { input, caller, repo, requestId } = params;

  // 1. Authorize: documents.manage
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'documents.manage',
    organizationId: input.organizationId,
    requestId,
  });

  // 2. Validate input boundary
  const parsed = CreateFolderSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      'Input data folder tidak valid',
      parseValidationErrors(parsed.error)
    );
  }

  const valid = parsed.data;

  // 3. If parentId provided, verify existence
  if (valid.parentId) {
    const parentFolder = await repo.findFolderById(valid.organizationId, valid.parentId);
    if (!parentFolder) {
      throw new NotFoundError(
        `Parent folder dengan ID "${valid.parentId}" tidak ditemukan`
      );
    }
  }

  // 4. Create folder
  const folder = await repo.createFolder({
    organizationId: valid.organizationId,
    name: valid.name,
    parentId: valid.parentId || null,
    createdBy: caller.userId,
  });

  // 5. Structured logging
  logger.info({
    module: 'document',
    action: 'document.folder_created',
    requestId,
    organizationId: valid.organizationId,
    userId: caller.userId,
    message: 'Folder dokumen baru berhasil dibuat',
    context: {
      folderId: folder.id,
      folderName: folder.name,
      parentId: folder.parentId,
    },
  });

  return folder;
}

export async function uploadDocument(params: {
  input: UploadDocumentInput;
  caller: CallerContext;
  repo: DocumentRepository;
  requestId?: string;
}): Promise<DocumentItem> {
  const { input, caller, repo, requestId } = params;

  // 1. Authorize: documents.manage
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'documents.manage',
    organizationId: input.organizationId,
    requestId,
  });

  // 2. Validate input boundary
  const parsed = UploadDocumentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      'Metadata dokumen tidak valid',
      parseValidationErrors(parsed.error)
    );
  }

  const valid = parsed.data;

  // 3. Verify folder if specified
  if (valid.folderId) {
    const folder = await repo.findFolderById(valid.organizationId, valid.folderId);
    if (!folder) {
      throw new NotFoundError(
        `Folder dokumen dengan ID "${valid.folderId}" tidak ditemukan`
      );
    }
  }

  // 4. Create document record
  const document = await repo.createDocument({
    organizationId: valid.organizationId,
    folderId: valid.folderId || null,
    name: valid.name,
    filePath: valid.filePath,
    fileSize: valid.fileSize,
    mimeType: valid.mimeType,
    storageBucket: valid.storageBucket,
    createdBy: caller.userId,
  });

  // 5. Structured logging
  logger.info({
    module: 'document',
    action: 'document.uploaded',
    requestId,
    organizationId: valid.organizationId,
    userId: caller.userId,
    message: 'Dokumen baru berhasil diunggah dan dicatat',
    context: {
      documentId: document.id,
      name: document.name,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      storageBucket: document.storageBucket,
    },
  });

  return document;
}

export async function getSignedDownloadUrl(params: {
  organizationId: string;
  documentId: string;
  expiresIn?: number;
  caller: CallerContext;
  repo: DocumentRepository;
  requestId?: string;
}): Promise<string> {
  const { organizationId, documentId, expiresIn = 900, caller, repo, requestId } = params;

  // 1. Authorize: documents.read
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'documents.read',
    organizationId,
    requestId,
  });

  // 2. Verify document exists
  const doc = await repo.findDocumentById(organizationId, documentId);
  if (!doc || doc.deletedAt) {
    throw new NotFoundError(`Dokumen dengan ID "${documentId}" tidak ditemukan`);
  }

  // 3. Generate signed URL
  const signedUrl = await repo.generateSignedUrl(
    doc.storageBucket,
    doc.filePath,
    expiresIn
  );

  // 4. Structured logging
  logger.info({
    module: 'document',
    action: 'document.download_link_generated',
    requestId,
    organizationId,
    userId: caller.userId,
    message: 'Tautan unduh dokumen sementara (Signed URL) berhasil dibuat',
    context: {
      documentId,
      expiresIn,
    },
  });

  return signedUrl;
}

export async function deleteDocument(params: {
  organizationId: string;
  documentId: string;
  caller: CallerContext;
  repo: DocumentRepository;
  requestId?: string;
}): Promise<DocumentItem> {
  const { organizationId, documentId, caller, repo, requestId } = params;

  // 1. Authorize: documents.manage
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'documents.manage',
    organizationId,
    requestId,
  });

  // 2. Verify existence
  const doc = await repo.findDocumentById(organizationId, documentId);
  if (!doc || doc.deletedAt) {
    throw new NotFoundError(`Dokumen dengan ID "${documentId}" tidak ditemukan`);
  }

  // 3. Soft delete
  const deleted = await repo.softDeleteDocument(organizationId, documentId);

  // 4. Structured logging
  logger.info({
    module: 'document',
    action: 'document.deleted',
    requestId,
    organizationId,
    userId: caller.userId,
    message: 'Dokumen berhasil diarsipkan/dihapus (soft-delete)',
    context: {
      documentId,
    },
  });

  return deleted;
}

export async function listDocumentsAndFolders(params: {
  organizationId: string;
  folderId?: string | null;
  caller: CallerContext;
  repo: DocumentRepository;
  requestId?: string;
}): Promise<{ folders: DocumentFolder[]; documents: DocumentItem[] }> {
  const { organizationId, folderId = null, caller, repo, requestId } = params;

  // 1. Authorize: documents.read
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'documents.read',
    organizationId,
    requestId,
  });

  // 2. Fetch folders & documents
  const [folders, documents] = await Promise.all([
    repo.listFolders(organizationId, folderId),
    repo.listDocuments(organizationId, folderId),
  ]);

  return { folders, documents };
}
