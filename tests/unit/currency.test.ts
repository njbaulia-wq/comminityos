import { describe, it, expect } from 'vitest';
import {
  formatIDR,
  parseIDR,
  addMoney,
  subtractMoney,
  calculateLedgerBalance,
} from '@/lib/utils/currency';
import { ValidationError } from '@/lib/errors';

describe('Currency & Financial Calculator Utilities', () => {
  describe('formatIDR', () => {
    it('should format numbers into Indonesian Rupiah representation', () => {
      expect(formatIDR(1500000)).toMatch(/Rp\s?1\.500\.000/);
      expect(formatIDR(0)).toMatch(/Rp\s?0/);
      expect(formatIDR(250500)).toMatch(/Rp\s?250\.500/);
    });

    it('should throw ValidationError if input is NaN', () => {
      expect(() => formatIDR(NaN)).toThrow(ValidationError);
    });
  });

  describe('parseIDR', () => {
    it('should parse Rupiah strings into exact numeric values', () => {
      expect(parseIDR('Rp 1.500.000')).toBe(1500000);
      expect(parseIDR('1.500.000')).toBe(1500000);
      expect(parseIDR('50000')).toBe(50000);
    });

    it('should throw ValidationError on non-numeric strings', () => {
      expect(() => parseIDR('bukan-angka')).toThrow(ValidationError);
    });
  });

  describe('High-Precision Decimal Arithmetic', () => {
    it('should accurately add decimals without floating point inaccuracy', () => {
      // Classic JS: 0.1 + 0.2 = 0.30000000000000004
      expect(addMoney(0.1, 0.2)).toBe(0.3);
      expect(addMoney(100.05, 50.15)).toBe(150.2);
    });

    it('should accurately subtract decimals without floating point inaccuracy', () => {
      // Classic JS: 1.0 - 0.9 = 0.09999999999999998
      expect(subtractMoney(1.0, 0.9)).toBe(0.1);
      expect(subtractMoney(500000, 125000.5)).toBe(374999.5);
    });

    it('should compute cash register ledger balance accurately', () => {
      const initialBalance = 1000000;
      const transactions = [
        { type: 'income' as const, amount: 500000 },
        { type: 'expense' as const, amount: 250000.5 },
        { type: 'income' as const, amount: 150000.25 },
        { type: 'expense' as const, amount: 49999.75 },
      ];

      const balance = calculateLedgerBalance(initialBalance, transactions);
      // 1000000 + 500000 - 250000.50 + 150000.25 - 49999.75 = 1350000
      expect(balance).toBe(1350000);
    });
  });
});
