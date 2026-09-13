import { describe, it, expect } from 'vitest';
import {
  CreateMemberSchema,
  UpdateMemberSchema,
  CreateTeamSchema,
} from '@/lib/validation/people.schema';

describe('Zod Schemas for People Management', () => {
  const validOrgId = 'a11e8a93-b0c3-4a11-822e-13c5ec821901';
  const validRoleId = 'b22e8a93-b0c3-4a11-822e-13c5ec821902';

  describe('CreateMemberSchema', () => {
    it('should validate complete resident profile', () => {
      const valid = {
        organizationId: validOrgId,
        roleId: validRoleId,
        fullName: 'Budi Santoso',
        phone: '081234567890',
        address: 'Jl. Mawar No. 12',
        houseNumber: '12',
        rtNumber: '05',
        rwNumber: '02',
        residentStatus: 'tetap',
      };

      const parsed = CreateMemberSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should accept shadow profile without phone or email', () => {
      const shadowProfile = {
        organizationId: validOrgId,
        roleId: validRoleId,
        fullName: 'Warga Lansia',
        houseNumber: '14',
      };

      const parsed = CreateMemberSchema.safeParse(shadowProfile);
      expect(parsed.success).toBe(true);
    });

    it('should reject invalid Indonesian phone number format', () => {
      const invalid = {
        organizationId: validOrgId,
        roleId: validRoleId,
        fullName: 'Budi',
        phone: '123456', // invalid phone
      };

      const parsed = CreateMemberSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.phone).toBeDefined();
      }
    });

    it('should reject invalid resident status enum', () => {
      const invalid = {
        organizationId: validOrgId,
        roleId: validRoleId,
        fullName: 'Budi',
        residentStatus: 'turis', // not allowed
      };

      const parsed = CreateMemberSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.residentStatus).toBeDefined();
      }
    });
  });

  describe('CreateTeamSchema', () => {
    it('should validate valid team payload', () => {
      const valid = {
        organizationId: validOrgId,
        name: 'Seksi Keamanan & Ketertiban',
        description: 'Pengelolaan pos ronda malam dan keamanan lingkungan RT',
      };

      const parsed = CreateTeamSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject team with short name', () => {
      const invalid = {
        organizationId: validOrgId,
        name: 'A',
      };

      const parsed = CreateTeamSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.name).toBeDefined();
      }
    });
  });
});
