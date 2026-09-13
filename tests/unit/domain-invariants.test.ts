import { describe, it, expect } from 'vitest';
import { createActivity } from '@/server/services/activity.service';
import { createTask } from '@/server/services/task.service';
import { approveTransaction, postTransaction } from '@/server/services/finance.service';
import { BusinessRuleError, NotFoundError } from '@/lib/errors';

describe('Domain Invariants & Edge Cases Hardening', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const archivedMemberId = '22222222-2222-4222-8222-222222222222';
  const nonExistentMemberId = '33333333-3333-4333-8333-333333333333';
  const callerAdmin = {
    userId: 'usr-admin',
    roleName: 'Admin',
  };

  describe('Activity PIC Active Status Invariant', () => {
    it('should reject assigning an archived/inactive member as activity PIC', async () => {
      const mockRepo: any = {
        findMember: async (_orgId: string, memberId: string) => {
          if (memberId === archivedMemberId) {
            return { id: archivedMemberId, fullName: 'Almarhum Budi', isArchived: true, deletedAt: new Date().toISOString() };
          }
          return null;
        },
        create: async (d: any) => ({ id: 'act-1', ...d }),
      };

      await expect(
        createActivity({
          input: {
            organizationId: orgId,
            title: 'Kerja Bakti Akbar',
            picMemberId: archivedMemberId,
          },
          caller: callerAdmin,
          repo: mockRepo,
        })
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw NotFoundError if PIC member does not exist', async () => {
      const mockRepo: any = {
        findMember: async () => null,
        create: async (d: any) => ({ id: 'act-1', ...d }),
      };

      await expect(
        createActivity({
          input: {
            organizationId: orgId,
            title: 'Kerja Bakti Akbar',
            picMemberId: nonExistentMemberId,
          },
          caller: callerAdmin,
          repo: mockRepo,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Task Assignee Active Status Invariant', () => {
    it('should reject assigning an archived member to a task', async () => {
      const mockRepo: any = {
        findMember: async (_orgId: string, memberId: string) => {
          if (memberId === archivedMemberId) {
            return { id: archivedMemberId, isArchived: true, deletedAt: '2026-01-01' };
          }
          return null;
        },
        createTask: async (d: any) => ({ id: 'task-1', ...d }),
      };

      await expect(
        createTask({
          input: {
            organizationId: orgId,
            title: 'Beli Sound System',
            assigneeId: archivedMemberId,
          },
          caller: callerAdmin,
          repo: mockRepo,
        })
      ).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('Finance Void Immutability Invariant', () => {
    it('should reject approving an already void transaction', async () => {
      const mockRepo: any = {
        findTransactionById: async () => ({
          id: 'tx-1',
          organizationId: orgId,
          type: 'expense',
          amount: 500000,
          status: 'void',
        }),
        updateTransaction: async () => ({}),
      };

      await expect(
        approveTransaction({
          organizationId: orgId,
          transactionId: 'tx-1',
          caller: { userId: 'usr-chair', roleName: 'Chair' },
          repo: mockRepo,
        })
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should reject posting an already void transaction', async () => {
      const mockRepo: any = {
        findTransactionById: async () => ({
          id: 'tx-1',
          organizationId: orgId,
          accountId: 'acc-1',
          type: 'expense',
          amount: 500000,
          status: 'void',
        }),
        findAccountById: async () => ({
          id: 'acc-1',
          balance: 1000000,
        }),
        updateAccountBalance: async () => ({}),
        updateTransaction: async () => ({}),
      };

      await expect(
        postTransaction({
          organizationId: orgId,
          transactionId: 'tx-1',
          caller: { userId: 'usr-treasurer', roleName: 'Treasurer' },
          repo: mockRepo,
        })
      ).rejects.toThrow(BusinessRuleError);
    });
  });
});
