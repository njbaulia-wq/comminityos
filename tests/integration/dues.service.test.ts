import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createDuePlan,
  submitPayment,
  verifyPayment,
  DuesRepository,
} from '@/server/services/dues.service';
import {
  ForbiddenError,
  NotFoundError,
  BusinessRuleError,
} from '@/lib/errors';
import { logger } from '@/lib/logger';

describe('Dues Domain Service with Automated Cash Ledger Posting', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const accountId = '22222222-2222-4222-8222-222222222222';
  const memberId = '33333333-3333-4333-8333-333333333333';
  const planId = '44444444-4444-4444-8444-444444444444';
  const dueItemId = '55555555-5555-4555-8555-555555555555';

  const treasurerCaller = { userId: 'user-treasurer', roleName: 'Treasurer' };
  const memberCaller = { userId: 'user-resident', roleName: 'Member' };

  let mockRepo: DuesRepository;
  let duePlansDb: any[];
  let dueItemsDb: any[];
  let paymentsDb: any[];
  let transactionsDb: any[];
  let accountBalance: number;

  beforeEach(() => {
    accountBalance = 500000;
    duePlansDb = [
      {
        id: planId,
        organizationId: orgId,
        title: 'Iuran Warga September 2026',
        amount: 50000,
        frequency: 'monthly',
      },
    ];
    dueItemsDb = [
      {
        id: dueItemId,
        organizationId: orgId,
        duePlanId: planId,
        memberId,
        amount: 50000,
        status: 'unpaid',
      },
    ];
    paymentsDb = [];
    transactionsDb = [];

    mockRepo = {
      findDuePlanById: vi.fn(async (organizationId: string, id: string) => {
        return duePlansDb.find((p) => p.organizationId === organizationId && p.id === id) || null;
      }),
      createDuePlan: vi.fn(async (data: any) => {
        const item = { id: 'plan-' + Math.random().toString(36).substring(7), ...data };
        duePlansDb.push(item);
        return item;
      }),
      findDueItemById: vi.fn(async (organizationId: string, id: string) => {
        return dueItemsDb.find((i) => i.organizationId === organizationId && i.id === id) || null;
      }),
      createDueItems: vi.fn(async (items: any[]) => {
        dueItemsDb.push(...items);
        return items;
      }),
      createPayment: vi.fn(async (data: any) => {
        const p = { id: 'pay-' + Math.random().toString(36).substring(7), ...data };
        paymentsDb.push(p);
        const item = dueItemsDb.find((i) => i.id === data.dueItemId);
        if (item) item.status = 'pending_verification';
        return p;
      }),
      findPaymentById: vi.fn(async (organizationId: string, id: string) => {
        return paymentsDb.find((p) => p.organizationId === organizationId && p.id === id) || null;
      }),
      verifyPaymentAtomic: vi.fn(async (params: any) => {
        const p = paymentsDb.find((pay) => pay.id === params.paymentId);
        const item = dueItemsDb.find((i) => i.id === params.dueItemId);

        p.verifiedBy = params.verifierUserId;
        p.verifiedAt = new Date().toISOString();
        item.status = 'paid';

        const tx = {
          id: 'tx-auto-' + Math.random().toString(36).substring(7),
          organizationId: params.organizationId,
          accountId: params.accountId,
          amount: params.amount,
          type: 'income',
          status: 'posted',
          description: params.description,
          postedAt: new Date().toISOString(),
        };
        transactionsDb.push(tx);
        accountBalance += params.amount;

        return { payment: p, transaction: tx, newBalance: accountBalance };
      }),
    };
  });

  describe('createDuePlan', () => {
    it('should create due plan when caller has dues.manage permission', async () => {
      const plan = await createDuePlan({
        input: {
          organizationId: orgId,
          title: 'Iuran Sampah',
          amount: 30000,
          frequency: 'monthly',
        },
        caller: treasurerCaller,
        repo: mockRepo,
      });

      expect(plan.title).toBe('Iuran Sampah');
      expect(plan.amount).toBe(30000);
    });

    it('should throw ForbiddenError if caller lacks permission', async () => {
      await expect(
        createDuePlan({
          input: {
            organizationId: orgId,
            title: 'Iuran Sampah',
            amount: 30000,
            frequency: 'monthly',
          },
          caller: memberCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('submitPayment', () => {
    it('should create payment and transition due_item to pending_verification', async () => {
      const payment = await submitPayment({
        input: {
          organizationId: orgId,
          dueItemId,
          amount: 50000,
          paymentMethod: 'transfer',
          proofFileUrl: 'https://example.com/receipt.jpg',
        },
        caller: memberCaller,
        repo: mockRepo,
      });

      expect(payment).toBeDefined();
      const item = await mockRepo.findDueItemById(orgId, dueItemId);
      expect(item?.status).toBe('pending_verification');
    });

    it('should throw BusinessRuleError if due item is already paid', async () => {
      dueItemsDb[0].status = 'paid';

      await expect(
        submitPayment({
          input: {
            organizationId: orgId,
            dueItemId,
            amount: 50000,
            paymentMethod: 'cash',
          },
          caller: memberCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('verifyPayment with automated ledger posting', () => {
    it('should atomicaly mark paid, create posted transaction, update cash balance, and emit structured log', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const payment = await submitPayment({
        input: {
          organizationId: orgId,
          dueItemId,
          amount: 50000,
          paymentMethod: 'cash',
        },
        caller: memberCaller,
        repo: mockRepo,
      });

      const result = await verifyPayment({
        organizationId: orgId,
        paymentId: payment.id,
        accountId,
        caller: treasurerCaller,
        repo: mockRepo,
        requestId: 'req-verify-dues',
      });

      expect(result.payment.verifiedBy).toBe(treasurerCaller.userId);
      expect(result.dueItemStatus).toBe('paid');
      expect(result.transaction.status).toBe('posted');
      expect(result.newBalance).toBe(550000); // 500.000 + 50.000

      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'dues',
          action: 'dues.payment_verified',
          requestId: 'req-verify-dues',
          context: expect.objectContaining({
            paymentId: payment.id,
            dueItemId,
            transactionId: result.transaction.id,
          }),
        })
      );

      infoSpy.mockRestore();
    });

    it('should throw ForbiddenError if non-treasurer tries to verify', async () => {
      const payment = await submitPayment({
        input: {
          organizationId: orgId,
          dueItemId,
          amount: 50000,
          paymentMethod: 'cash',
        },
        caller: memberCaller,
        repo: mockRepo,
      });

      await expect(
        verifyPayment({
          organizationId: orgId,
          paymentId: payment.id,
          accountId,
          caller: memberCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
