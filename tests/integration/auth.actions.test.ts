import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginAction, signupAction, logoutAction } from '@/server/actions/auth.actions';

describe('Authentication Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loginAction', () => {
    it('should return validation error envelope for invalid input', async () => {
      const result = await loginAction({
        email: 'bukan-email',
        password: '123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.fieldErrors).toHaveProperty('email');
        expect(result.error.fieldErrors).toHaveProperty('password');
      }
    });

    it('should authenticate user and return defaultOrgSlug on valid credentials', async () => {
      const mockClient = {
        auth: {
          signInWithPassword: vi.fn(async () => ({
            data: {
              user: { id: 'usr-123', email: 'warga@rt05.id' },
              session: { access_token: 'mock-token' },
            },
            error: null,
          })),
        },
      };

      const result = await loginAction(
        {
          email: 'warga@rt05.id',
          password: 'password123',
        },
        'req-login-1',
        { client: mockClient as any }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.id).toBe('usr-123');
        expect(result.data.user.email).toBe('warga@rt05.id');
        expect(result.data.defaultOrgSlug).toBeDefined();
      }
    });

    it('should return authentication error envelope when credentials are invalid', async () => {
      const mockClient = {
        auth: {
          signInWithPassword: vi.fn(async () => ({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' },
          })),
        },
      };

      const result = await loginAction(
        {
          email: 'warga@rt05.id',
          password: 'wrong-password',
        },
        'req-login-2',
        { client: mockClient as any }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNAUTHORIZED');
        expect(result.error.message).toContain('tidak cocok');
      }
    });
  });

  describe('signupAction', () => {
    it('should return validation error envelope for mismatched confirmation password', async () => {
      const result = await signupAction({
        fullName: 'Budi Santoso',
        email: 'budi@rt05.id',
        password: 'password123',
        confirmPassword: 'different123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.fieldErrors).toHaveProperty('confirmPassword');
      }
    });

    it('should register user, provision profile, and return default organization on valid signup', async () => {
      const mockClient = {
        auth: {
          signUp: vi.fn(async () => ({
            data: {
              user: { id: 'usr-new-456', email: 'budi@rt05.id' },
              session: { access_token: 'mock-session' },
            },
            error: null,
          })),
        },
      };

      const mockAdminClient = {
        auth: {
          admin: {
            createUser: vi.fn(async () => ({
              data: { user: { id: 'usr-new-456', email: 'budi@rt05.id' } },
              error: null,
            })),
          },
        },
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn(async () => ({ data: { id: 'org-default', slug: 'rt05-rw02' } })),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn(async () => ({ data: { id: 'prof-new' } })),
          onConflict: vi.fn().mockReturnThis(),
          ignore: vi.fn(async () => ({})),
        })),
      };

      const result = await signupAction(
        {
          fullName: 'Budi Santoso',
          email: 'budi@rt05.id',
          password: 'password123',
          confirmPassword: 'password123',
        },
        'req-signup-1',
        { client: mockClient as any, adminClient: mockAdminClient as any }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.email).toBe('budi@rt05.id');
        expect(result.data.defaultOrgSlug).toBe('rt05-rw02');
      }
    });
  });

  describe('logoutAction', () => {
    it('should sign out user and return success envelope', async () => {
      const mockClient = {
        auth: {
          signOut: vi.fn(async () => ({ error: null })),
        },
      };

      const result = await logoutAction('req-logout-1', { client: mockClient as any });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.loggedOut).toBe(true);
      }
    });
  });
});
