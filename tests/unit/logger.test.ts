import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, LogLevel } from '@/lib/logger';
import { maskSensitiveData } from '@/lib/logger/masking';

describe('Structured JSON Logger & PII Masking', () => {
  describe('maskSensitiveData', () => {
    it('should mask sensitive keys in a flat object', () => {
      const input = {
        name: 'Budi Santoso',
        password: 'supersecretpassword',
        nik: '3201010101900001',
        email: 'budi@example.com',
      };

      const masked = maskSensitiveData(input) as Record<string, unknown>;
      expect(masked.name).toBe('Budi Santoso');
      expect(masked.email).toBe('budi@example.com');
      expect(masked.password).toBe('***REDACTED***');
      expect(masked.nik).toBe('***REDACTED***');
    });

    it('should mask sensitive keys deeply in nested objects and arrays', () => {
      const input = {
        user: {
          profile: {
            fullName: 'Ahmad',
            secretToken: 'jwt-token-value',
          },
          tokens: ['token1', 'token2'],
          authHeader: 'Bearer xyz123',
        },
      };

      const masked = maskSensitiveData(input) as any;
      expect(masked.user.profile.fullName).toBe('Ahmad');
      expect(masked.user.profile.secretToken).toBe('***REDACTED***');
      expect(masked.user.authHeader).toBe('***REDACTED***');
    });

    it('should handle primitives and null values safely', () => {
      expect(maskSensitiveData(null)).toBeNull();
      expect(maskSensitiveData(undefined)).toBeUndefined();
      expect(maskSensitiveData('plain text')).toBe('plain text');
      expect(maskSensitiveData(12345)).toBe(12345);
    });
  });

  describe('logger output format', () => {
    let stdoutSpy: any;
    let stderrSpy: any;

    beforeEach(() => {
      stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    });

    it('should output structured JSON on logger.info', () => {
      logger.info({
        module: 'finance',
        action: 'finance.test',
        requestId: 'req-123',
        organizationId: 'org-456',
        userId: 'user-789',
        message: 'Testing info log',
        context: { amount: 50000, password: 'hidden' },
      });

      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);

      expect(parsed.level).toBe('info');
      expect(parsed.module).toBe('finance');
      expect(parsed.action).toBe('finance.test');
      expect(parsed.requestId).toBe('req-123');
      expect(parsed.organizationId).toBe('org-456');
      expect(parsed.userId).toBe('user-789');
      expect(parsed.message).toBe('Testing info log');
      expect(parsed.context.amount).toBe(50000);
      expect(parsed.context.password).toBe('***REDACTED***');
      expect(new Date(parsed.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should output to stderr on logger.error', () => {
      const testError = new Error('Database connection failed');

      logger.error({
        module: 'database',
        action: 'db.connect',
        message: 'Failed to connect to database',
        error: testError,
      });

      expect(stderrSpy).toHaveBeenCalled();
      const output = stderrSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);

      expect(parsed.level).toBe('error');
      expect(parsed.module).toBe('database');
      expect(parsed.message).toBe('Failed to connect to database');
      expect(parsed.error.message).toBe('Database connection failed');
      expect(parsed.error.stack).toBeDefined();
    });

    it('should be fail-safe and not throw even if context contains circular references', () => {
      const circular: Record<string, unknown> = { name: 'circular' };
      circular.self = circular;

      expect(() => {
        logger.info({
          module: 'test',
          message: 'Circular test',
          context: circular,
        });
      }).not.toThrow();

      expect(stdoutSpy).toHaveBeenCalled();
    });
  });
});
