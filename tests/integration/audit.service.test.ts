import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  dispatchAuditLog,
  listAuditLogs,
  AuditRepository,
} from '@/server/services/audit.service';
import { ForbiddenError } from '@/lib/errors';
import { logger } from '@/lib/logger';

describe('Immutable Audit Log Dispatcher Service', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  let mockRepo: AuditRepository;

  const adminCaller = { userId: 'usr-admin', roleName: 'Admin' };
  const memberCaller = { userId: 'usr-member', roleName: 'Member' };

  beforeEach(() => {
    mockRepo = {
      insertLog: vi.fn().mockImplementation(async (d) => ({
        id: 'audit-1',
        createdAt: new Date().toISOString(),
        ...d,
      })),
      listLogs: vi.fn().mockResolvedValue([
        {
          id: 'audit-1',
          organizationId: orgId,
          actorId: 'usr-admin',
          action: 'finance.transaction_posted',
          entityType: 'transaction',
          entityId: 'tx-123',
          metadata: { amount: 500000 },
          createdAt: new Date().toISOString(),
        },
      ]),
    };
  });

  describe('dispatchAuditLog', () => {
    it('should successfully dispatch audit log and log info', async () => {
      const infoSpy = vi.spyOn(logger, 'info');

      await dispatchAuditLog(
        {
          organizationId: orgId,
          actorId: 'usr-admin',
          action: 'member.role_assigned',
          entityType: 'member',
          entityId: 'mbr-456',
          metadata: { oldRole: 'Member', newRole: 'Treasurer' },
          requestId: 'req-audit-1',
        },
        mockRepo
      );

      expect(mockRepo.insertLog).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: orgId,
          actorId: 'usr-admin',
          action: 'member.role_assigned',
          entityType: 'member',
          entityId: 'mbr-456',
        })
      );
      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'audit',
          action: 'audit.dispatched',
        })
      );
    });

    it('should be resilient: never throw exception when audit logging fails, but log error', async () => {
      const failingRepo: AuditRepository = {
        insertLog: vi.fn().mockRejectedValue(new Error('DB Connection Timeout')),
        listLogs: vi.fn().mockResolvedValue([]),
      };

      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

      // Must not throw!
      await expect(
        dispatchAuditLog(
          {
            organizationId: orgId,
            actorId: 'usr-admin',
            action: 'finance.posted',
            entityType: 'transaction',
            entityId: 'tx-999',
            metadata: {},
            requestId: 'req-resilient',
          },
          failingRepo
        )
      ).resolves.not.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'audit',
          message: expect.stringContaining('Gagal mencatat audit log'),
        })
      );

      errorSpy.mockRestore();
    });
  });

  describe('listAuditLogs', () => {
    it('should return audit logs when caller has audit.read permission', async () => {
      const logs = await listAuditLogs({
        organizationId: orgId,
        caller: adminCaller,
        repo: mockRepo,
      });

      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('finance.transaction_posted');
    });

    it('should throw ForbiddenError when caller lacks audit.read permission', async () => {
      await expect(
        listAuditLogs({
          organizationId: orgId,
          caller: memberCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
