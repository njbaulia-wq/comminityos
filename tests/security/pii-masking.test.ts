import { describe, it, expect } from 'vitest';
import { maskSensitiveData } from '@/lib/logger/masking';

describe('Deep PII & Financial Masking for Structured Logger', () => {
  it('should mask Indonesian banking keys (noRekening, nomorRekening, bankAccount)', () => {
    const input = {
      bankAccount: '1234567890',
      noRekening: '9876543210',
      nomorRekening: '5555444433',
      accountNumber: '111222333',
      bankName: 'BCA',
    };

    const masked = maskSensitiveData(input) as Record<string, unknown>;

    expect(masked.bankAccount).toBe('***REDACTED***');
    expect(masked.noRekening).toBe('***REDACTED***');
    expect(masked.nomorRekening).toBe('***REDACTED***');
    expect(masked.accountNumber).toBe('***REDACTED***');
    expect(masked.bankName).toBe('BCA');
  });

  it('should mask security credentials and PIN/CVV', () => {
    const input = {
      pin: '123456',
      cvv: '123',
      passcode: 'secretpass',
      accessToken: 'xyz-access-token',
      refreshToken: 'xyz-refresh-token',
      jwt: 'header.payload.signature',
      privateKey: '-----BEGIN PRIVATE KEY-----',
    };

    const masked = maskSensitiveData(input) as Record<string, unknown>;

    expect(masked.pin).toBe('***REDACTED***');
    expect(masked.cvv).toBe('***REDACTED***');
    expect(masked.passcode).toBe('***REDACTED***');
    expect(masked.accessToken).toBe('***REDACTED***');
    expect(masked.refreshToken).toBe('***REDACTED***');
    expect(masked.jwt).toBe('***REDACTED***');
    expect(masked.privateKey).toBe('***REDACTED***');
  });

  it('should mask identity keys (ktp, nationalId, citizenId)', () => {
    const input = {
      ktp: '3201234567890001',
      nationalId: '3201234567890002',
      citizenId: '3201234567890003',
      identityCard: '3201234567890004',
    };

    const masked = maskSensitiveData(input) as Record<string, unknown>;

    expect(masked.ktp).toBe('***REDACTED***');
    expect(masked.nationalId).toBe('***REDACTED***');
    expect(masked.citizenId).toBe('***REDACTED***');
    expect(masked.identityCard).toBe('***REDACTED***');
  });

  it('should mask 16-digit Indonesian NIK value even under generic key names', () => {
    const input = {
      idNumber: '3201234567890001', // generic key name but contains 16-digit NIK
      serialCode: '3171012345670005',
      normalAmount: 150000,
      normalString: 'Iuran Warga RT 05',
    };

    const masked = maskSensitiveData(input) as Record<string, unknown>;

    expect(masked.idNumber).toBe('***REDACTED***');
    expect(masked.serialCode).toBe('***REDACTED***');
    expect(masked.normalAmount).toBe(150000);
    expect(masked.normalString).toBe('Iuran Warga RT 05');
  });

  it('should mask JWT token values even under generic key names', () => {
    const input = {
      headerToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      label: 'test session',
    };

    const masked = maskSensitiveData(input) as Record<string, unknown>;

    expect(masked.headerToken).toBe('***REDACTED***');
    expect(masked.label).toBe('test session');
  });
});
