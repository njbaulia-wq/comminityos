import { describe, it, expect } from 'vitest';
import {
  LoginSchema,
  SignupSchema,
} from '@/lib/validation/auth.schema';
import {
  CreateOrganizationSchema,
  InviteMemberSchema,
} from '@/lib/validation/organization.schema';

describe('Zod Schemas for Auth & Onboarding', () => {
  describe('LoginSchema', () => {
    it('should validate correct login payload', () => {
      const valid = { email: 'ketua@rt05.id', password: 'secretpassword123' };
      const parsed = LoginSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject invalid email and short password', () => {
      const invalid = { email: 'not-an-email', password: '123' };
      const parsed = LoginSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        expect(fieldErrors.email).toBeDefined();
        expect(fieldErrors.password).toBeDefined();
      }
    });
  });

  describe('SignupSchema', () => {
    it('should validate valid signup with matching passwords', () => {
      const valid = {
        fullName: 'Budi Santoso',
        email: 'budi@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };
      const parsed = SignupSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject when confirmPassword does not match', () => {
      const mismatch = {
        fullName: 'Budi Santoso',
        email: 'budi@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
      };
      const parsed = SignupSchema.safeParse(mismatch);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        expect(fieldErrors.confirmPassword).toBeDefined();
      }
    });
  });

  describe('CreateOrganizationSchema', () => {
    it('should accept valid organization payload with supported template', () => {
      const valid = {
        name: 'RT 05 RW 02 Sukamaju',
        slug: 'rt05-rw02-sukamaju',
        template: 'rt',
      };
      const parsed = CreateOrganizationSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject uppercase and special symbols in slug', () => {
      const invalid = {
        name: 'RT 05 RW 02',
        slug: 'RT05_RW02 Invalid!',
        template: 'rt',
      };
      const parsed = CreateOrganizationSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.slug).toBeDefined();
      }
    });

    it('should reject unsupported template type', () => {
      const invalid = {
        name: 'Enterprise Inc',
        slug: 'enterprise-inc',
        template: 'corporate_holding',
      };
      const parsed = CreateOrganizationSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.template).toBeDefined();
      }
    });
  });

  describe('InviteMemberSchema', () => {
    it('should accept valid invitation payload', () => {
      const valid = {
        email: 'warga@rt05.id',
        roleId: 'a11e8a93-b0c3-4a11-822e-13c5ec821901',
      };
      const parsed = InviteMemberSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject non-uuid roleId', () => {
      const invalid = {
        email: 'warga@rt05.id',
        roleId: 'not-a-uuid',
      };
      const parsed = InviteMemberSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });
});
