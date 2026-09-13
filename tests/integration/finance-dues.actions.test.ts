import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTransactionAction,
  approveTransactionAction,
  postTransactionAction,
} from '@/server/actions/finance.actions';
import {
  createDuePlanAction,
  submitPaymentAction,
  verifyPaymentAction,
} from '@/server/actions/dues.actions';
import { FinanceRepository } from '@/server/services/finance.service';
import { DuesRepository } from '@/server/services/dues.service';

describe('Finance & Dues Server Actions', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const accountId = '22222222-2222-4222-8222-222222222222';
  const memberId = '33333333-3333-4333-8333-333333333333';
  const dueItemId = '44444444-4444-4444-8444-444444444444';

  const treasurerContext = {
    userId: 'treasurer-id',
    roleName: 'Treasurer',
    requestId: 'req-finance-action',
  };
  const chairContext = {
    userId: 'chair-id',
    roleName: 'Chair',
    requestId: 'req-finance-action',
  };
  const memberContext = {
    userId: 'member-id',
    roleName: 'Member',
    requestId: 'req-finance-action',
  };

  let mockFinanceRepo: FinanceRepository;
  let mockDuesRepo: DuesRepository;
  let txDb: any[];
  let paymentsDb: any[];

  beforeEach(() => {
    vi.clearAllMocks();
    txDb = [];
    paymentsDb = [];

    mockFinanceRepo = {
      findAccountById: vi.fn(async (orgId, id) => ({ id, organizationId: orgId, balance: 1000000 })),
      updateAccountBalance: vi.fn(async (orgId, id, bal) => ({ id, balance: bal })),
      findTransactionById: vi.fn(async (orgId, id) => txDb.find((t) => t.id === id) || null),
      createTransaction: vi.fn(async (data) => {
        const item = { id: 'tx-1', ...data };
        txDb.push(item);
        return item;
      }),
      updateTransaction: vi.fn(async (orgId, id, data) => {
        const item = txDb.find((t) => t.id === id);
        if (!item) return null;
        Object.assign(item, data);
        return item;
      }),
      listTransactions: vi.fn(async () => txDb),
    };

    mockDuesRepo = {
      findDuePlanById: vi.fn(async (orgId, id) => ({ id, title: 'Iuran Warga' })),
      createDuePlan: vi.fn(async (data) => ({ id: 'plan-1', ...data })),
      findDueItemById: vi.fn(async (orgId, id) => ({ id, duePlanId: 'plan-1', status: 'unpaid' })),
      createDueItems: vi.fn(async (items) => items),
      createPayment: vi.fn(async (data) => {
        const item = { id: 'pay-1', ...data };
        paymentsDb.push(item);
        return item;
      }),
      findPaymentById: vi.fn(async (orgId, id) => paymentsDb.find((p) => p.id === id) || null),
      verifyPaymentAtomic: vi.fn(async (params) => ({
        payment: { id: params.paymentId, verifiedBy: params.verifierUserId },
        transaction: { id: 'tx-100', status: 'posted', amount: params.amount },
        newBalance: 1050000,
      })),
    };
  });

  describe('createTransactionAction', () => {
    it('should return success envelope on valid payload', async () => {
      const result = await createTransactionAction(
        {
          organizationId: orgId,
          accountId,
          amount: 150000,
          type: 'income',
          transactionDate: '2026-09-13',
          description: 'Penjualan barang rongsokan',
        },
        { ...treasurerContext, repo: mockFinanceRepo }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('tx-1');
      }
    });

    it('should return validation error envelope on zero amount', async () => {
      const result = await createTransactionAction(
        {
          organizationId: orgId,
          accountId,
          amount: 0,
          type: 'income',
          transactionDate: '2026-09-13',
        },
        { ...treasurerContext, repo: mockFinanceRepo }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return forbidden error envelope for unauthorized role', async () => {
      const result = await createTransactionAction(
        {
          organizationId: orgId,
          accountId,
          amount: 150000,
          type: 'income',
          transactionDate: '2026-09-13',
        },
        { ...memberContext, repo: mockFinanceRepo }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('approveTransactionAction & postTransactionAction', () => {
    it('should approve pending expense and allow posting', async () => {
      txDb.push({
        id: 'tx-pending',
        organizationId: orgId,
        accountId,
        amount: 800000,
        type: 'expense',
        status: 'pending_approval',
      });

      // 1. Chair approves
      const approveRes = await approveTransactionAction(
        { organizationId: orgId, transactionId: 'tx-pending' },
        { ...chairContext, repo: mockFinanceRepo }
      );
      expect(approveRes.success).toBe(true);

      // 2. Treasurer posts
      const postRes = await postTransactionAction(
        { organizationId: orgId, transactionId: 'tx-pending' },
        { ...treasurerContext, repo: mockFinanceRepo }
      );
      expect(postRes.success).toBe(true);
      if (postRes.success) {
        expect(postRes.data.status).toBe('posted');
      }
    });
  });

  describe('Dues Server Actions', () => {
    it('should create due plan and return success envelope', async () => {
      const result = await createDuePlanAction(
        {
          organizationId: orgId,
          title: 'Iuran Kebersihan',
          amount: 25000,
          frequency: 'monthly',
        },
        { ...treasurerContext, repo: mockDuesRepo }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Iuran Kebersihan');
      }
    });

    it('should submit payment and verify payment atomically', async () => {
      // 1. Member submits payment
      const submitRes = await submitPaymentAction(
        {
          organizationId: orgId,
          dueItemId,
          amount: 25000,
          paymentMethod: 'cash',
        },
        { ...memberContext, repo: mockDuesRepo }
      );
      expect(submitRes.success).toBe(true);

      // 2. Treasurer verifies
      const verifyRes = await verifyPaymentAction(
        {
          organizationId: orgId,
          paymentId: 'pay-1',
          accountId,
        },
        { ...treasurerContext, repo: mockDuesRepo }
      );
      expect(verifyRes.success).toBe(true);
      if (verifyRes.success) {
        expect(verifyRes.data.transaction.status).toBe('posted');
        expect(verifyRes.data.newBalance).toBe(1050000);
      }
    });
  });
});
