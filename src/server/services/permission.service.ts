import { ForbiddenError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  Owner: [
    'members.read',
    'members.manage',
    'finance.read',
    'finance.create',
    'finance.approve',
    'finance.post',
    'dues.manage',
    'activities.manage',
    'tasks.manage',
    'documents.read',
    'documents.manage',
    'settings.manage',
  ],
  Admin: [
    'members.read',
    'members.manage',
    'finance.read',
    'finance.create',
    'finance.approve',
    'finance.post',
    'dues.manage',
    'activities.manage',
    'tasks.manage',
    'documents.read',
    'documents.manage',
    'settings.manage',
  ],
  Chair: [
    'members.read',
    'finance.read',
    'finance.approve',
    'activities.manage',
    'tasks.manage',
    'documents.read',
    'documents.manage',
  ],
  'Vice Chair': [
    'members.read',
    'finance.read',
    'finance.approve',
    'activities.manage',
    'tasks.manage',
    'documents.read',
    'documents.manage',
  ],
  Secretary: [
    'members.read',
    'members.manage',
    'activities.manage',
    'tasks.manage',
    'documents.read',
    'documents.manage',
  ],
  Treasurer: [
    'members.read',
    'finance.read',
    'finance.create',
    'finance.post',
    'dues.manage',
    'documents.read',
    'documents.manage',
  ],
  Coordinator: [
    'members.read',
    'activities.manage',
    'tasks.manage',
    'documents.read',
    'documents.manage',
  ],
  Member: ['members.read', 'finance.read', 'documents.read'],
  Viewer: ['members.read', 'documents.read'],
};

export interface CheckPermissionParams {
  roleName?: string;
  permission: string;
  userId?: string;
  organizationId?: string;
}

export async function hasPermission(params: CheckPermissionParams): Promise<boolean> {
  const { roleName, permission } = params;

  if (!roleName) {
    return false;
  }

  const permissions = DEFAULT_ROLE_PERMISSIONS[roleName] || [];
  return permissions.includes(permission);
}

export interface AssertPermissionParams extends CheckPermissionParams {
  userId: string;
  organizationId: string;
  requestId?: string;
}

export async function assertPermission(params: AssertPermissionParams): Promise<void> {
  const allowed = await hasPermission(params);

  if (!allowed) {
    logger.warn({
      module: 'auth',
      action: 'permission.denied',
      userId: params.userId,
      organizationId: params.organizationId,
      requestId: params.requestId,
      message: 'Akses ditolak: pengguna tidak memiliki izin yang dipersyaratkan',
      context: {
        requiredPermission: params.permission,
        roleName: params.roleName,
      },
    });

    throw new ForbiddenError(
      'Anda tidak memiliki hak akses untuk melakukan tindakan ini'
    );
  }
}
