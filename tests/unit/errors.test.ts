import { describe, it, expect, vi } from 'vitest';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  BusinessRuleError,
  InternalServerError,
} from '@/lib/errors';
import { successResult, errorResult, handleServiceError } from '@/lib/errors/result';
import { logger } from '@/lib/logger';

describe('Centralized Error Hierarchy & Result Envelope', () => {
  describe('AppError hierarchy', () => {
    it('should create NotFoundError with 404 status and operational flag', () => {
      const err = new NotFoundError('Data anggota tidak ditemukan');
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.isOperational).toBe(true);
      expect(err.message).toBe('Data anggota tidak ditemukan');
    });

    it('should create ValidationError with 422 status and fieldErrors', () => {
      const fieldErrors = { email: ['Format email tidak valid'] };
      const err = new ValidationError('Validasi formulir gagal', fieldErrors);
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(422);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.isOperational).toBe(true);
      expect(err.fieldErrors).toEqual(fieldErrors);
    });

    it('should create ForbiddenError with 403 status', () => {
      const err = new ForbiddenError('Akses ditolak');
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    });

    it('should create BusinessRuleError with 400 status', () => {
      const err = new BusinessRuleError('Pengeluaran belum disetujui');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('BUSINESS_RULE_VIOLATION');
    });
  });

  describe('Result Envelope Pattern & Anti-Data Leak', () => {
    it('should return success envelope on successResult', () => {
      const result = successResult({ id: 'org-1', name: 'RT 05' });
      expect(result).toEqual({
        success: true,
        data: { id: 'org-1', name: 'RT 05' },
      });
    });

    it('should return operational error details safely on errorResult', () => {
      const opError = new BusinessRuleError('Saldo kas tidak mencukupi');
      const result = errorResult(opError, 'req-999');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'BUSINESS_RULE_VIOLATION',
          message: 'Saldo kas tidak mencukupi',
          requestId: 'req-999',
        },
      });
    });

    it('should include fieldErrors when error is ValidationError', () => {
      const valError = new ValidationError('Input tidak valid', {
        amount: ['Nominal harus lebih besar dari 0'],
      });
      const result = errorResult(valError, 'req-abc');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input tidak valid',
          fieldErrors: { amount: ['Nominal harus lebih besar dari 0'] },
          requestId: 'req-abc',
        },
      });
    });

    it('should NOT leak raw internal/database errors to client', () => {
      const dbError = new Error('Postgres relation "users" does not exist at table.c:120');
      const result = errorResult(dbError, 'req-safe');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INTERNAL_SERVER_ERROR');
        // Ensure raw database error string is NEVER exposed
        expect(result.error.message).not.toContain('Postgres');
        expect(result.error.message).not.toContain('table.c');
        expect(result.error.message).toBe(
          'Terjadi kesalahan internal pada sistem. Silakan coba beberapa saat lagi.'
        );
        expect(result.error.requestId).toBe('req-safe');
      }
    });

    it('should log structured error via handleServiceError without leaking to returned result', () => {
      const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
      const rawError = new Error('Secret DB connection timeout');

      const result = handleServiceError({
        error: rawError,
        module: 'finance',
        action: 'finance.post',
        requestId: 'req-1234',
        organizationId: 'org-1',
      });

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'finance',
          action: 'finance.post',
          requestId: 'req-1234',
          organizationId: 'org-1',
          error: rawError,
        })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).not.toContain('Secret DB');
      }

      loggerSpy.mockRestore();
    });
  });
});
