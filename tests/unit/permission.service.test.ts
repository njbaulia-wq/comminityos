import { describe, it, expect, vi } from 'vitest';
import {
  hasPermission,
  assertPermission,
  DEFAULT_ROLE_PERMISSIONS,
} from '@/server/services/permission.service';
import { ForbiddenError } from '@/lib/errors';
import { logger } from '@/lib/logger';

describe('RBAC Permission Resolver Service', () => {
  describe('DEFAULT_ROLE_PERMISSIONS matrix', () => {
    it('should grant finance.approve to Chair and Admin, but not to Member', () => {
      expect(DEFAULT_ROLE_PERMISSIONS['Admin']).toContain('finance.approve');
      expect(DEFAULT_ROLE_PERMISSIONS['Chair']).toContain('finance.approve');
      expect(DEFAULT_ROLE_PERMISSIONS['Member']).not.toContain('finance.approve');
    });

    it('should grant finance.post to Treasurer, Admin, and Owner', () => {
      expect(DEFAULT_ROLE_PERMISSIONS['Treasurer']).toContain('finance.post');
      expect(DEFAULT_ROLE_PERMISSIONS['Admin']).toContain('finance.post');
      expect(DEFAULT_ROLE_PERMISSIONS['Owner']).toContain('finance.post');
    });
  });

  describe('hasPermission & assertPermission evaluation', () => {
    it('should return true for authorized permission check', async () => {
      const allowed = await hasPermission({
        roleName: 'Chair',
        permission: 'finance.approve',
      });
      expect(allowed).toBe(true);
    });

    it('should return false for unauthorized permission check', async () => {
      const allowed = await hasPermission({
        roleName: 'Viewer',
        permission: 'finance.create',
      });
      expect(allowed).toBe(false);
    });

    it('should succeed assertPermission when authorized', async () => {
      await expect(
        assertPermission({
          userId: 'usr-1',
          organizationId: 'org-1',
          roleName: 'Treasurer',
          permission: 'finance.post',
        })
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenError and log warn on assertPermission denial', async () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

      await expect(
        assertPermission({
          userId: 'usr-unauthorized',
          organizationId: 'org-123',
          roleName: 'Member',
          permission: 'finance.post',
          requestId: 'req-auth-fail',
        })
      ).rejects.toThrow(ForbiddenError);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'auth',
          action: 'permission.denied',
          userId: 'usr-unauthorized',
          organizationId: 'org-123',
          context: expect.objectContaining({
            requiredPermission: 'finance.post',
          }),
        })
      );

      warnSpy.mockRestore();
    });
  });
});
