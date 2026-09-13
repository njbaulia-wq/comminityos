import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTransaction,
  approveTransaction,
  postTransaction,
  FinanceRepository,
} from '@/server/services/finance.service';
import {
  ForbiddenError,
  NotFoundError,
  BusinessRuleError,
} from '@/lib/errors';
import { logger } from '@/lib/logger';

describe('Finance Ledger Domain Service', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const accountId = '22222222-2222-4222-8222-222222222222';
  const categoryId = '33333333-3333-4333-8333-333333333333';

  const treasurerCaller = { userId: 'user-treasurer', roleName: 'Treasurer' };
  const chairCaller = { userId: 'user-chair', roleName: 'Chair' };
  const memberCaller = { userId: 'user-member', roleName: 'Member' };
  const adminCaller = { userId: 'user-admin', roleName: 'Admin' };

  let mockRepo: FinanceRepository;
  let accountsDb: any[];
  let transactionsDb: any[];

  beforeEach(() => {
    accountsDb = [
      {
        id: accountId,
        organizationId: orgId,
        name: 'Kas Operasional RT',
        type: 'cash',
        balance: 1000000, // Rp 1.000.000
      },
    ];
    transactionsDb = [];

    mockRepo = {
      findAccountById: vi.fn(async (organizationId: string, id: string) => {
        return accountsDb.find((a) => a.organizationId === organizationId && a.id === id) || null;
      }),
      updateAccountBalance: vi.fn(async (organizationId: string, id: string, newBalance: number) => {
        const acc = accountsDb.find((a) => a.organizationId === organizationId && a.id === id);
        if (!acc) return null;
        acc.balance = newBalance;
        return acc;
      }),
      findTransactionById: vi.fn(async (organizationId: string, id: string) => {
        return transactionsDb.find((t) => t.organizationId === organizationId && t.id === id) || null;
      }),
      createTransaction: vi.fn(async (data: any) => {
        const tx = {
          id: 'tx-' + Math.random().toString(36).substring(7),
          ...data,
          createdAt: new Date().toISOString(),
        };
        transactionsDb.push(tx);
        return tx;
      }),
      updateTransaction: vi.fn(async (organizationId: string, id: string, data: any) => {
        const tx = transactionsDb.find((t) => t.organizationId === organizationId && t.id === id);
        if (!tx) return null;
        Object.assign(tx, data, { updatedAt: new Date().toISOString() });
        return tx;
      }),
      listTransactions: vi.fn(async (organizationId: string) => transactionsDb),
    };
  });

  describe('createTransaction', () => {
    it('should create expense transaction with pending_approval if amount exceeds threshold', async () => {
      const input = {
        organizationId: orgId,
        accountId,
        categoryId,
        amount: 750000, // > 500.000 threshold
        type: 'expense' as const,
        description: 'Beli Sound System Pengajian',
        transactionDate: '2026-09-13',
      };

      const tx = await createTransaction({
        input,
        caller: treasurerCaller,
        repo: mockRepo,
      });

      expect(tx).toBeDefined();
      expect(tx.status).toBe('pending_approval');
    });

    it('should throw ForbiddenError if caller lacks finance.create permission', async () => {
      const input = {
        organizationId: orgId,
        accountId,
        amount: 100000,
        type: 'income' as const,
        transactionDate: '2026-09-13',
      };

      await expect(
        createTransaction({
          input,
          caller: memberCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('approveTransaction', () => {
    it('should allow Chair to approve pending expense', async () => {
      const tx = await createTransaction({
        input: {
          organizationId: orgId,
          accountId,
          categoryId,
          amount: 800000,
          type: 'expense',
          description: 'Konsumsi Rapat Warga Akbar',
          transactionDate: '2026-09-13',
        },
        caller: treasurerCaller,
        repo: mockRepo,
      });

      const approved = await approveTransaction({
        organizationId: orgId,
        transactionId: tx.id,
        caller: chairCaller,
        repo: mockRepo,
      });

      expect(approved.approvedBy).toBe(chairCaller.userId);
    });

    it('should throw ForbiddenError if caller lacks finance.approve permission', async () => {
      const tx = await createTransaction({
        input: {
          organizationId: orgId,
          accountId,
          amount: 800000,
          type: 'expense',
          transactionDate: '2026-09-13',
        },
        caller: treasurerCaller,
        repo: mockRepo,
      });

      await expect(
        approveTransaction({
          organizationId: orgId,
          transactionId: tx.id,
          caller: memberCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('postTransaction', () => {
    it('should post income transaction and increment account balance', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const tx = await createTransaction({
        input: {
          organizationId: orgId,
          accountId,
          amount: 500000,
          type: 'income',
          description: 'Donasi warga untuk pos ronda',
          transactionDate: '2026-09-13',
        },
        caller: treasurerCaller,
        repo: mockRepo,
      });

      const posted = await postTransaction({
        organizationId: orgId,
        transactionId: tx.id,
        caller: treasurerCaller,
        repo: mockRepo,
      });

      expect(posted.status).toBe('posted');
      expect(posted.postedAt).toBeDefined();

      // Initial balance 1.000.000 + 500.000 = 1.500.000
      const acc = await mockRepo.findAccountById(orgId, accountId);
      expect(acc?.balance).toBe(1500000);

      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'finance',
          action: 'finance.transaction_posted',
          context: expect.objectContaining({
            amount: 500000,
            type: 'income',
          }),
        })
      );

      infoSpy.mockRestore();
    });

    it('should throw BusinessRuleError when posting unapproved large expense', async () => {
      const tx = await createTransaction({
        input: {
          organizationId: orgId,
          accountId,
          amount: 1000000, // exceeds threshold
          type: 'expense',
          transactionDate: '2026-09-13',
        },
        caller: treasurerCaller,
        repo: mockRepo,
      });

      // Attempt to post without approval
      await expect(
        postTransaction({
          organizationId: orgId,
          transactionId: tx.id,
          caller: treasurerCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw BusinessRuleError when posting already posted transaction', async () => {
      const tx = await createTransaction({
        input: {
          organizationId: orgId,
          accountId,
          amount: 50000,
          type: 'income',
          transactionDate: '2026-09-13',
        },
        caller: treasurerCaller,
        repo: mockRepo,
      });

      await postTransaction({
        organizationId: orgId,
        transactionId: tx.id,
        caller: treasurerCaller,
        repo: mockRepo,
      });

      // Second attempt
      await expect(
        postTransaction({
          organizationId: orgId,
          transactionId: tx.id,
          caller: treasurerCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(BusinessRuleError);
    });
  });
});
