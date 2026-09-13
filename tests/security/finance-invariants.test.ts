import { describe, it, expect, vi } from 'vitest';
import {
  postTransaction,
  approveTransaction,
  FinanceRepository,
} from '@/server/services/finance.service';
import {
  verifyPayment,
  DuesRepository,
} from '@/server/services/dues.service';
import {
  postTransactionAction,
  approveTransactionAction,
} from '@/server/actions/finance.actions';
import { addMoney, subtractMoney, calculateLedgerBalance } from '@/lib/utils/currency';
import { BusinessRuleError } from '@/lib/errors';

describe('Finance Invariant & Anti-Tampering Test Suite', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const txId = 'tx-posted-100';
  const adminCaller = { userId: 'usr-admin', roleName: 'Admin' };
  const treasurerCaller = { userId: 'usr-treasurer', roleName: 'Treasurer' };

  describe('Posted Transaction Immutability & Anti-Tampering', () => {
    const postedTx = {
      id: txId,
      organizationId: orgId,
      accountId: 'acc-1',
      amount: 1500000,
      type: 'expense' as const,
      status: 'posted' as const,
      transactionDate: '2026-09-01',
      approvedBy: 'usr-chair',
    };

    const mockRepo: FinanceRepository = {
      findAccountById: vi.fn().mockResolvedValue({ id: 'acc-1', balance: 5000000 }),
      updateAccountBalance: vi.fn().mockResolvedValue({ id: 'acc-1', balance: 3500000 }),
      findTransactionById: vi.fn().mockImplementation(async (_org, id) => (id === txId ? postedTx : null)),
      createTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      listTransactions: vi.fn().mockResolvedValue([postedTx]),
    };

    it('should reject domain postTransaction call if status is already posted', async () => {
      await expect(
        postTransaction({
          organizationId: orgId,
          transactionId: txId,
          caller: treasurerCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should reject domain approveTransaction call if status is already posted', async () => {
      await expect(
        approveTransaction({
          organizationId: orgId,
          transactionId: txId,
          caller: adminCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should safely return BUSINESS_RULE_VIOLATION in Server Actions without server leak', async () => {
      const res = await postTransactionAction(
        { organizationId: orgId, transactionId: txId },
        { ...treasurerCaller, repo: mockRepo }
      );

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('BUSINESS_RULE_VIOLATION');
        expect(res.error.message).toContain('sudah diposting');
      }
    });
  });

  describe('Dues Payment Verification Race Condition Simulation', () => {
    it('should handle concurrent verifications atomically: 1 succeeds and 1 fails with BusinessRuleError', async () => {
      let paymentStatus = 'pending_verification';

      const mockDuesRepo: DuesRepository = {
        createDuePlan: vi.fn(),
        findDuePlanById: vi.fn().mockResolvedValue({ id: 'plan-1', title: 'Iuran Warga' }),
        createDueItemsBatch: vi.fn(),
        findDueItemById: vi.fn().mockImplementation(async () => ({
          id: 'item-1',
          organizationId: orgId,
          duePlanId: 'plan-1',
          amount: 50000,
          status: paymentStatus === 'paid' ? 'paid' : 'pending_verification',
        })),
        findPaymentById: vi.fn().mockImplementation(async () => ({
          id: 'pay-1',
          dueItemId: 'item-1',
          organizationId: orgId,
          status: paymentStatus,
          amount: 50000,
        })),
        createPayment: vi.fn(),
        verifyPaymentAtomic: vi.fn().mockImplementation(async () => {
          if (paymentStatus === 'paid') {
            throw new BusinessRuleError('Pembayaran untuk tagihan ini sudah diproses sebelumnya');
          }
          paymentStatus = 'paid';
          return {
            payment: { id: 'pay-1', status: 'verified' },
            dueItem: { id: 'item-1', status: 'paid' },
            transaction: { id: 'tx-auto-1', status: 'posted', amount: 50000 },
            newBalance: 1050000,
          };
        }),
      };

      // Concurrent execution: request 1 and request 2 simultaneously
      const req1 = verifyPayment({
        organizationId: orgId,
        paymentId: 'pay-1',
        accountId: 'acc-1',
        caller: treasurerCaller,
        repo: mockDuesRepo,
      });

      const req2 = verifyPayment({
        organizationId: orgId,
        paymentId: 'pay-1',
        accountId: 'acc-1',
        caller: treasurerCaller,
        repo: mockDuesRepo,
      });

      const results = await Promise.allSettled([req1, req2]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      if (rejected[0].status === 'rejected') {
        expect(rejected[0].reason).toBeInstanceOf(BusinessRuleError);
      }
    });
  });

  describe('Ledger Arithmetic & Precision Invariants', () => {
    it('should never accumulate floating-point drift over repeated additions and subtractions', () => {
      let balance = 0;

      // 100 iterations of +10.10 and -10.05
      for (let i = 0; i < 100; i++) {
        balance = addMoney(balance, 10.10);
        balance = subtractMoney(balance, 10.05);
      }

      // 100 * 0.05 = 5.00
      expect(balance).toBe(5.00);
    });

    it('should accurately calculate net balance across mutasi transactions', () => {
      const transactions = [
        { type: 'income' as const, amount: 1500000.50 },
        { type: 'expense' as const, amount: 250000.25 },
        { type: 'income' as const, amount: 50000.75 },
        { type: 'expense' as const, amount: 300000.00 },
      ];

      const net = calculateLedgerBalance(0, transactions);
      // 1500000.50 - 250000.25 + 50000.75 - 300000 = 1000001
      expect(net).toBe(1000001);
    });
  });
});
