import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrganizationAction } from '@/server/actions/organization.actions';
import { loginAction } from '@/server/actions/auth.actions';

describe('Auth & Organization Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrganizationAction', () => {
    it('should return success envelope when input is valid', async () => {
      const result = await createOrganizationAction(
        {
          name: 'RT 05 RW 02',
          slug: 'rt05-rw02',
          template: 'rt',
        },
        {
          userId: 'test-user-id',
          repo: {
            findBySlug: vi.fn(async () => null),
            create: vi.fn(async (data) => ({ id: 'org-123', ...data })),
            createMembership: vi.fn(async () => ({ id: 'mem-123' })),
          },
        }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('org-123');
        expect(result.data.slug).toBe('rt05-rw02');
      }
    });

    it('should return validation error envelope without crashing when input is invalid', async () => {
      const result = await createOrganizationAction(
        {
          name: 'A', // too short
          slug: 'Invalid Slug!',
          template: 'rt',
        },
        { userId: 'test-user-id' }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.fieldErrors).toHaveProperty('name');
        expect(result.error.fieldErrors).toHaveProperty('slug');
        expect(result.error.requestId).toBeDefined();
      }
    });

    it('should return conflict error envelope when slug already exists', async () => {
      const result = await createOrganizationAction(
        {
          name: 'RT 05 RW 02',
          slug: 'rt05-rw02',
          template: 'rt',
        },
        {
          userId: 'test-user-id',
          repo: {
            findBySlug: vi.fn(async () => ({ id: 'existing-org', slug: 'rt05-rw02' })),
            create: vi.fn(),
            createMembership: vi.fn(),
          },
        }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFLICT');
        expect(result.error.message).toContain('sudah digunakan');
      }
    });
  });

  describe('loginAction', () => {
    it('should return validation error envelope for invalid email', async () => {
      const result = await loginAction({
        email: 'invalid-email',
        password: '123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.fieldErrors).toHaveProperty('email');
      }
    });
  });
});
