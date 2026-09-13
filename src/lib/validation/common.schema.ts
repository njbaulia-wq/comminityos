import { z } from 'zod';

export const DANGEROUS_HTML_REGEX = /<[a-z/!][\s\S]*>|javascript:|onerror\s*=|onload\s*=/i;

export interface SafeTextOptions {
  min?: number;
  max?: number;
  fieldName?: string;
  required?: boolean;
}

export function safeTextSchema(options: SafeTextOptions = {}) {
  const { min = 1, max = 500, fieldName = 'Teks', required = true } = options;

  let schema = z.string({
    required_error: required ? `${fieldName} wajib diisi` : undefined,
  }).trim();

  if (min > 0 && required) {
    schema = schema.min(min, `${fieldName} minimal ${min} karakter`);
  }

  if (max > 0) {
    schema = schema.max(max, `${fieldName} maksimal ${max} karakter`);
  }

  return schema.refine((val) => !DANGEROUS_HTML_REGEX.test(val), {
    message: `${fieldName} tidak boleh memuat tag HTML atau skrip berbahaya`,
  });
}

export function optionalSafeTextSchema(max = 500, fieldName = 'Teks') {
  return z
    .string()
    .trim()
    .max(max, `${fieldName} maksimal ${max} karakter`)
    .refine((val) => !val || !DANGEROUS_HTML_REGEX.test(val), {
      message: `${fieldName} tidak boleh memuat tag HTML atau skrip berbahaya`,
    })
    .optional()
    .nullable();
}

export function uuidSchema(fieldName = 'ID') {
  return z
    .string({ required_error: `${fieldName} wajib diisi` })
    .uuid(`${fieldName} tidak valid`);
}

export function optionalUuidSchema(fieldName = 'ID') {
  return z.string().uuid(`${fieldName} tidak valid`).optional().nullable();
}
