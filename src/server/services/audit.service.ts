import { logger } from '@/lib/logger';
import { assertPermission } from '@/server/services/permission.service';

export interface CallerContext {
  userId: string;
  roleName: string;
}

export interface AuditLogItem {
  id: string;
  organizationId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  createdAt: string;
}

export interface RecordAuditParams {
  organizationId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  requestId?: string;
}

export interface AuditRepository {
  insertLog(data: any): Promise<AuditLogItem>;
  listLogs(organizationId: string, limit?: number): Promise<AuditLogItem[]>;
}

/**
 * Dispatches an audit log event asynchronously and resiliently.
 * In line with safety requirements, audit logging MUST NEVER crash or rollback
 * the primary business transaction. Failures are captured and logged as errors.
 */
export async function dispatchAuditLog(
  params: RecordAuditParams,
  repo: AuditRepository
): Promise<void> {
  const { organizationId, actorId, action, entityType, entityId, metadata = {}, ipAddress, requestId } = params;

  try {
    const log = await repo.insertLog({
      organizationId,
      actorId: actorId || null,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: ipAddress || null,
    });

    logger.info({
      module: 'audit',
      action: 'audit.dispatched',
      requestId,
      organizationId,
      userId: actorId || undefined,
      message: `Audit log tercatat: ${action} pada ${entityType}:${entityId}`,
      context: {
        auditLogId: log.id,
        action,
        entityType,
        entityId,
      },
    });
  } catch (err: any) {
    logger.error({
      module: 'audit',
      action: 'audit.dispatch_failed',
      requestId,
      organizationId,
      userId: actorId || undefined,
      message: 'Gagal mencatat audit log ke penyimpanan (non-fatal resilient execution)',
      error: err,
    });
  }
}

export async function listAuditLogs(params: {
  organizationId: string;
  limit?: number;
  caller: CallerContext;
  repo: AuditRepository;
  requestId?: string;
}): Promise<AuditLogItem[]> {
  const { organizationId, limit = 50, caller, repo, requestId } = params;

  // 1. Authorize: audit.read
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'audit.read',
    organizationId,
    requestId,
  });

  // 2. Fetch logs
  const logs = await repo.listLogs(organizationId, limit);

  return logs;
}
