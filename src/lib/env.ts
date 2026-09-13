import { z } from 'zod';
import { ValidationError } from './errors';

export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string({
    required_error: 'NEXT_PUBLIC_SUPABASE_URL wajib diisi',
  }).url('NEXT_PUBLIC_SUPABASE_URL harus berupa URL yang valid'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string({
    required_error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi',
  }).min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY tidak boleh kosong'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  SUPABASE_SERVICE_ROLE_KEY: z.string({
    required_error: 'SUPABASE_SERVICE_ROLE_KEY wajib diisi',
  }).min(1, 'SUPABASE_SERVICE_ROLE_KEY tidak boleh kosong'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, unknown> = process.env): Env {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.') || 'root';
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    }

    throw new ValidationError(
      'Konfigurasi variabel lingkungan tidak valid',
      fieldErrors
    );
  }

  return result.data;
}

/**
 * Lazy getter for validated environment.
 */
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv(process.env);
  }
  return cachedEnv;
}
