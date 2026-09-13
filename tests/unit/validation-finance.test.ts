import { describe, it, expect } from 'vitest';
import {
  CreateTransactionSchema,
  CreateAccountSchema,
} from '@/lib/validation/finance.schema';
import {
  CreateDuePlanSchema,
  CreatePaymentSchema,
} from '@/lib/validation/dues.schema';

describe('Zod Schemas for Finance & Dues', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const accountId = '22222222-2222-4222-8222-222222222222';
  const categoryId = '33333333-3333-4333-8333-333333333333';
  const duePlanId = '44444444-4444-4444-8444-444444444444';
  const dueItemId = '55555555-5555-4555-8555-555555555555';

  describe('CreateTransactionSchema', () => {
    it('should validate valid income transaction', () => {
      const valid = {
        organizationId: orgId,
        accountId,
        categoryId,
        amount: 250000,
        type: 'income' as const,
        description: 'Pemasukan sumbangan warga',
        transactionDate: '2026-09-13',
      };

      const parsed = CreateTransactionSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject amount less than or equal to 0', () => {
      const zeroAmount = {
        organizationId: orgId,
        accountId,
        categoryId,
        amount: 0,
        type: 'expense' as const,
        description: 'Beli ATK',
        transactionDate: '2026-09-13',
      };

      const parsedZero = CreateTransactionSchema.safeParse(zeroAmount);
      expect(parsedZero.success).toBe(false);
      if (!parsedZero.success) {
        expect(parsedZero.error.flatten().fieldErrors.amount).toBeDefined();
        expect(parsedZero.error.flatten().fieldErrors.amount?.[0]).toContain('lebih besar dari 0');
      }

      const negativeAmount = {
        ...zeroAmount,
        amount: -50000,
      };
      const parsedNegative = CreateTransactionSchema.safeParse(negativeAmount);
      expect(parsedNegative.success).toBe(false);
    });

    it('should reject invalid transaction type', () => {
      const invalid = {
        organizationId: orgId,
        accountId,
        categoryId,
        amount: 100000,
        type: 'debt', // not allowed
        transactionDate: '2026-09-13',
      };

      const parsed = CreateTransactionSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.type).toBeDefined();
      }
    });

    it('should reject invalid transaction date format', () => {
      const invalid = {
        organizationId: orgId,
        accountId,
        categoryId,
        amount: 100000,
        type: 'income' as const,
        transactionDate: 'invalid-date',
      };

      const parsed = CreateTransactionSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.transactionDate).toBeDefined();
      }
    });
  });

  describe('CreateAccountSchema', () => {
    it('should validate valid bank or cash account', () => {
      const valid = {
        organizationId: orgId,
        name: 'Rekening Operasional BCA RT 05',
        type: 'bank' as const,
        balance: 5000000,
        accountNumber: '1234567890',
      };

      const parsed = CreateAccountSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject negative initial balance', () => {
      const invalid = {
        organizationId: orgId,
        name: 'Kas Tunai Bendahara',
        type: 'cash' as const,
        balance: -10000,
      };

      const parsed = CreateAccountSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.balance).toBeDefined();
      }
    });
  });

  describe('CreateDuePlanSchema', () => {
    it('should validate valid monthly dues plan', () => {
      const valid = {
        organizationId: orgId,
        title: 'Iuran Kebersihan & Keamanan Bulanan',
        amount: 50000,
        frequency: 'monthly' as const,
        dueDate: '2026-09-30',
      };

      const parsed = CreateDuePlanSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject due plan with zero or negative amount', () => {
      const invalid = {
        organizationId: orgId,
        title: 'Iuran Warga',
        amount: 0,
        frequency: 'monthly' as const,
      };

      const parsed = CreateDuePlanSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.amount).toBeDefined();
      }
    });
  });

  describe('CreatePaymentSchema', () => {
    it('should validate valid transfer payment with proof file', () => {
      const valid = {
        organizationId: orgId,
        dueItemId,
        amount: 50000,
        paymentMethod: 'transfer' as const,
        proofFileUrl: 'https://storage.supabase.co/proofs/receipt-01.jpg',
      };

      const parsed = CreatePaymentSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should validate cash payment without proof file', () => {
      const valid = {
        organizationId: orgId,
        dueItemId,
        amount: 50000,
        paymentMethod: 'cash' as const,
      };

      const parsed = CreatePaymentSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });
  });
});
