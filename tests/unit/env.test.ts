import { describe, it, expect } from 'vitest';
import { validateEnv, envSchema } from '@/lib/env';
import { ValidationError } from '@/lib/errors';

describe('Environment Configuration Schema', () => {
  const validEnv = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role',
    NODE_ENV: 'test',
  };

  it('should parse and return validated env when all required variables are present and valid', () => {
    const parsed = validateEnv(validEnv);
    expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test-project.supabase.co');
    expect(parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon'
    );
    expect(parsed.SUPABASE_SERVICE_ROLE_KEY).toBe(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role'
    );
    expect(parsed.NODE_ENV).toBe('test');
  });

  it('should throw ValidationError with fieldErrors when required variables are missing', () => {
    const invalid = {
      ...validEnv,
      NEXT_PUBLIC_SUPABASE_URL: undefined,
    };

    expect(() => validateEnv(invalid)).toThrow(ValidationError);

    try {
      validateEnv(invalid);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const valErr = err as ValidationError;
      expect(valErr.fieldErrors).toHaveProperty('NEXT_PUBLIC_SUPABASE_URL');
      expect(valErr.statusCode).toBe(422);
    }
  });

  it('should throw ValidationError when URL is not a valid URL', () => {
    const invalidUrl = {
      ...validEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'invalid-url-string',
    };

    expect(() => validateEnv(invalidUrl)).toThrow(ValidationError);
  });

  it('should default NODE_ENV to development if not provided', () => {
    const envWithoutNodeEnv = {
      ...validEnv,
      NODE_ENV: undefined,
    };

    const parsed = validateEnv(envWithoutNodeEnv);
    expect(parsed.NODE_ENV).toBe('development');
  });
});
