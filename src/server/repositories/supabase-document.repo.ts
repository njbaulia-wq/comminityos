import { createAdminClient } from '@/lib/supabase/admin';
import { DocumentRepository, DocumentFolder, DocumentItem } from '@/server/services/document.service';

export function createSupabaseDocumentRepo(): DocumentRepository {
  const supabase = createAdminClient();

  return {
    async createFolder(data: any): Promise<DocumentFolder> {
      const { data: created, error } = await supabase
        .from('document_folders')
        .insert({
          organization_id: data.organizationId,
          name: data.name,
          parent_id: data.parentId || null,
          created_by: data.createdBy || null,
        })
        .select('*')
        .single();

      if (error) throw error;
      return {
        id: created.id,
        organizationId: created.organization_id,
        name: created.name,
        parentId: created.parent_id,
        createdBy: created.created_by,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      };
    },

    async findFolderById(organizationId: string, id: string): Promise<DocumentFolder | null> {
      const { data, error } = await supabase
        .from('document_folders')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        organizationId: data.organization_id,
        name: data.name,
        parentId: data.parent_id,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },

    async listFolders(organizationId: string, parentId?: string | null): Promise<DocumentFolder[]> {
      let query = supabase
        .from('document_folders')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (parentId !== undefined) {
        if (parentId === null) {
          query = query.is('parent_id', null);
        } else {
          query = query.eq('parent_id', parentId);
        }
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((d) => ({
        id: d.id,
        organizationId: d.organization_id,
        name: d.name,
        parentId: d.parent_id,
        createdBy: d.created_by,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    },

    async createDocument(data: any): Promise<DocumentItem> {
      const { data: created, error } = await supabase
        .from('documents')
        .insert({
          organization_id: data.organizationId,
          folder_id: data.folderId || null,
          name: data.name,
          file_path: data.filePath,
          file_size: data.fileSize,
          mime_type: data.mimeType,
          storage_bucket: data.storageBucket || 'org-documents',
          created_by: data.createdBy || null,
        })
        .select('*')
        .single();

      if (error) throw error;
      return {
        id: created.id,
        organizationId: created.organization_id,
        folderId: created.folder_id,
        name: created.name,
        filePath: created.file_path,
        fileSize: created.file_size,
        mimeType: created.mime_type,
        storageBucket: created.storage_bucket,
        isArchived: created.is_archived,
        createdBy: created.created_by,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
        deletedAt: created.deleted_at,
      };
    },

    async findDocumentById(organizationId: string, id: string): Promise<DocumentItem | null> {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        organizationId: data.organization_id,
        folderId: data.folder_id,
        name: data.name,
        filePath: data.file_path,
        fileSize: data.file_size,
        mimeType: data.mime_type,
        storageBucket: data.storage_bucket,
        isArchived: data.is_archived,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        deletedAt: data.deleted_at,
      };
    },

    async listDocuments(organizationId: string, folderId?: string | null): Promise<DocumentItem[]> {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (folderId !== undefined) {
        if (folderId === null) {
          query = query.is('folder_id', null);
        } else {
          query = query.eq('folder_id', folderId);
        }
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((d) => ({
        id: d.id,
        organizationId: d.organization_id,
        folderId: d.folder_id,
        name: d.name,
        filePath: d.file_path,
        fileSize: d.file_size,
        mimeType: d.mime_type,
        storageBucket: d.storage_bucket,
        isArchived: d.is_archived,
        createdBy: d.created_by,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        deletedAt: d.deleted_at,
      }));
    },

    async softDeleteDocument(organizationId: string, id: string): Promise<DocumentItem> {
      const { data: updated, error } = await supabase
        .from('documents')
        .update({
          deleted_at: new Date().toISOString(),
          is_archived: true,
        })
        .eq('organization_id', organizationId)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return {
        id: updated.id,
        organizationId: updated.organization_id,
        folderId: updated.folder_id,
        name: updated.name,
        filePath: updated.file_path,
        fileSize: updated.file_size,
        mimeType: updated.mime_type,
        storageBucket: updated.storage_bucket,
        isArchived: updated.is_archived,
        createdBy: updated.created_by,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
        deletedAt: updated.deleted_at,
      };
    },

    async generateSignedUrl(bucket: string, filePath: string, expiresInSeconds: number): Promise<string> {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresInSeconds);

      if (error || !data?.signedUrl) {
        throw error || new Error('Gagal membuat signed URL');
      }
      return data.signedUrl;
    },
  };
}
