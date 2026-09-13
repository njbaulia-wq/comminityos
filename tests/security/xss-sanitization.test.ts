import { describe, it, expect } from 'vitest';
import { safeTextSchema } from '@/lib/validation/common.schema';
import { CreateMemberSchema } from '@/lib/validation/people.schema';
import { CreateActivitySchema } from '@/lib/validation/activity.schema';
import { CreateTaskSchema } from '@/lib/validation/task.schema';
import { CreateTransactionSchema } from '@/lib/validation/finance.schema';

describe('OWASP XSS & Script Injection Prevention on Input Boundary', () => {
  const validOrgId = 'a11e8a93-b0c3-4a11-822e-13c5ec821901';
  const validRoleId = 'b22e8a93-b0c3-4a11-822e-13c5ec821902';
  const validAccountId = 'c33e8a93-b0c3-4a11-822e-13c5ec821903';

  describe('safeTextSchema validator', () => {
    const textSchema = safeTextSchema({ min: 2, max: 100, fieldName: 'Judul' });

    it('should allow clean plain text with punctuation and numbers', () => {
      const result = textSchema.safeParse('Rapat Kerja Pengurus RT 05 / RW 02 - Tahun 2026!');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Rapat Kerja Pengurus RT 05 / RW 02 - Tahun 2026!');
      }
    });

    it('should reject text containing <script> tags', () => {
      const result = textSchema.safeParse('<script>alert("xss")</script>');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('tag HTML atau skrip');
      }
    });

    it('should reject text containing <svg onload=...>', () => {
      const result = textSchema.safeParse('<svg/onload=alert(1)>');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('tag HTML atau skrip');
      }
    });

    it('should reject javascript: pseudo-protocol', () => {
      const result = textSchema.safeParse('javascript:stealData()');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('tag HTML atau skrip');
      }
    });
  });

  describe('Domain Schemas XSS Guarding', () => {
    it('should reject malicious XSS payload in CreateMemberSchema fullName', () => {
      const result = CreateMemberSchema.safeParse({
        organizationId: validOrgId,
        roleId: validRoleId,
        fullName: '<img src=x onerror=alert(document.cookie)>',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('fullName'))).toBe(true);
      }
    });

    it('should reject malicious script in CreateActivitySchema title', () => {
      const result = CreateActivitySchema.safeParse({
        organizationId: validOrgId,
        title: '<script src="https://evil.com/payload.js"></script>',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('title'))).toBe(true);
      }
    });

    it('should reject malicious script in CreateTaskSchema title', () => {
      const result = CreateTaskSchema.safeParse({
        organizationId: validOrgId,
        title: '<iframe src="evil.com"></iframe>',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('title'))).toBe(true);
      }
    });

    it('should reject malicious script in CreateTransactionSchema description', () => {
      const result = CreateTransactionSchema.safeParse({
        organizationId: validOrgId,
        accountId: validAccountId,
        amount: 50000,
        type: 'income',
        transactionDate: '2026-09-13',
        description: '<script>alert(1)</script>',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('description'))).toBe(true);
      }
    });
  });
});
