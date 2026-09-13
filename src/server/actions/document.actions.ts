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

export interface DocumentActionContext extends CallerContext {
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

export async function createFolderAction(
  rawInput: CreateFolderInput,
  context: DocumentActionContext
): Promise<ActionResult<any>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const folder = await createFolder({
      input: rawInput,
      caller: {
        userId: context.userId,
        roleName: context.roleName,
      },
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult(folder);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'document',
      action: 'action.create_folder',
      requestId,
      organizationId: rawInput.organizationId,
      userId: context.userId,
    });
  }
}

export async function uploadDocumentAction(
  rawInput: UploadDocumentInput,
  context: DocumentActionContext
): Promise<ActionResult<any>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const doc = await uploadDocument({
      input: rawInput,
      caller: {
        userId: context.userId,
        roleName: context.roleName,
      },
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult(doc);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'document',
      action: 'action.upload_document',
      requestId,
      organizationId: rawInput.organizationId,
      userId: context.userId,
    });
  }
}

export async function getSignedDownloadUrlAction(
  params: {
    organizationId: string;
    documentId: string;
    expiresIn?: number;
  },
  context: DocumentActionContext
): Promise<ActionResult<{ signedUrl: string }>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const signedUrl = await getSignedDownloadUrl({
      organizationId: params.organizationId,
      documentId: params.documentId,
      expiresIn: params.expiresIn,
      caller: {
        userId: context.userId,
        roleName: context.roleName,
      },
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult({ signedUrl });
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'document',
      action: 'action.get_signed_download_url',
      requestId,
      organizationId: params.organizationId,
      userId: context.userId,
    });
  }
}

export async function deleteDocumentAction(
  params: {
    organizationId: string;
    documentId: string;
  },
  context: DocumentActionContext
): Promise<ActionResult<any>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const deleted = await deleteDocument({
      organizationId: params.organizationId,
      documentId: params.documentId,
      caller: {
        userId: context.userId,
        roleName: context.roleName,
      },
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult(deleted);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'document',
      action: 'action.delete_document',
      requestId,
      organizationId: params.organizationId,
      userId: context.userId,
    });
  }
}

export async function listDocumentsAndFoldersAction(
  params: {
    organizationId: string;
    folderId?: string | null;
  },
  context: DocumentActionContext
): Promise<ActionResult<{ folders: any[]; documents: any[] }>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const data = await listDocumentsAndFolders({
      organizationId: params.organizationId,
      folderId: params.folderId,
      caller: {
        userId: context.userId,
        roleName: context.roleName,
      },
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult(data);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'document',
      action: 'action.list_documents',
      requestId,
      organizationId: params.organizationId,
      userId: context.userId,
    });
  }
}
