'use server';

import {
  CreateFolderInput,
  UploadDocumentInput,
} from '@/lib/validation/document.schema';
import {
  ActionResult,
  successResult,
  handleServiceError,
} from '@/lib/errors/result';
import {
  createFolder,
  uploadDocument,
  getSignedDownloadUrl,
  deleteDocument,
  listDocumentsAndFolders,
  DocumentRepository,
  CallerContext,
} from '@/server/services/document.service';
import { createSupabaseDocumentRepo } from '@/server/repositories/supabase-document.repo';
import { resolveCallerContext } from './context-helper';
import { validateUuidParams } from '@/lib/validation/common.schema';

export interface DocumentActionContext extends Partial<CallerContext> {
  requestId?: string;
  repo?: DocumentRepository;
}

const fallbackRepo: DocumentRepository = {
  createFolder: async (d) => ({
    id: 'folder-' + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...d,
  }),
  findFolderById: async () => null,
  listFolders: async () => [],
  createDocument: async (d) => ({
    id: 'doc-' + Date.now(),
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...d,
  }),
  findDocumentById: async () => null,
  listDocuments: async () => [],
  softDeleteDocument: async (org, id) => ({
    id,
    organizationId: org,
    name: 'Deleted',
    filePath: '',
    fileSize: 0,
    mimeType: '',
    storageBucket: 'org-documents',
    isArchived: true,
    createdAt: '',
    updatedAt: '',
    deletedAt: new Date().toISOString(),
  }),
  generateSignedUrl: async () => 'https://storage.supabase.co/signed-placeholder',
};

function getRepo(explicit?: DocumentRepository): DocumentRepository {
  if (explicit) return explicit;
  try {
    return createSupabaseDocumentRepo();
  } catch {
    return fallbackRepo;
  }
}

export async function createFolderAction(
  rawInput: CreateFolderInput,
  context?: DocumentActionContext
): Promise<ActionResult<any>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const caller = await resolveCallerContext(rawInput.organizationId, context);
    const repo = getRepo(context?.repo);

    const folder = await createFolder({
      input: rawInput,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult(folder);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'document',
      action: 'action.create_folder',
      requestId,
      organizationId: rawInput.organizationId,
      userId: context?.userId,
    });
  }
}

export async function uploadDocumentAction(
  rawInput: UploadDocumentInput,
  context?: DocumentActionContext
): Promise<ActionResult<any>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const caller = await resolveCallerContext(rawInput.organizationId, context);
    const repo = getRepo(context?.repo);

    const doc = await uploadDocument({
      input: rawInput,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult(doc);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'document',
      action: 'action.upload_document',
      requestId,
      organizationId: rawInput.organizationId,
      userId: context?.userId,
    });
  }
}

export async function getSignedDownloadUrlAction(
  params: {
    organizationId: string;
    documentId: string;
    expiresIn?: number;
  },
  context?: DocumentActionContext
): Promise<ActionResult<{ signedUrl: string }>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    validateUuidParams({
      organizationId: params.organizationId,
      documentId: params.documentId,
    });

    const caller = await resolveCallerContext(params.organizationId, context);
    const repo = getRepo(context?.repo);

    const signedUrl = await getSignedDownloadUrl({
      organizationId: params.organizationId,
      documentId: params.documentId,
      expiresIn: params.expiresIn,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult({ signedUrl });
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'document',
      action: 'action.get_signed_download_url',
      requestId,
      organizationId: params.organizationId,
      userId: context?.userId,
    });
  }
}

export async function deleteDocumentAction(
  params: {
    organizationId: string;
    documentId: string;
  },
  context?: DocumentActionContext
): Promise<ActionResult<any>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    validateUuidParams({
      organizationId: params.organizationId,
      documentId: params.documentId,
    });

    const caller = await resolveCallerContext(params.organizationId, context);
    const repo = getRepo(context?.repo);

    const deleted = await deleteDocument({
      organizationId: params.organizationId,
      documentId: params.documentId,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult(deleted);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'document',
      action: 'action.delete_document',
      requestId,
      organizationId: params.organizationId,
      userId: context?.userId,
    });
  }
}

export async function listDocumentsAndFoldersAction(
  params: {
    organizationId: string;
    folderId?: string | null;
  },
  context?: DocumentActionContext
): Promise<ActionResult<{ folders: any[]; documents: any[] }>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    validateUuidParams({
      organizationId: params.organizationId,
      ...(params.folderId ? { folderId: params.folderId } : {}),
    });

    const caller = await resolveCallerContext(params.organizationId, context);
    const repo = getRepo(context?.repo);

    const result = await listDocumentsAndFolders({
      organizationId: params.organizationId,
      folderId: params.folderId,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult(result);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'document',
      action: 'action.list_documents_folders',
      requestId,
      organizationId: params.organizationId,
      userId: context?.userId,
    });
  }
}
