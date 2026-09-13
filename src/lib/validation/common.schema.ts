import { z } from 'zod';
import { ValidationError } from '../errors';

export const DANGEROUS_HTML_REGEX = /<[a-z/!][\s\S]*>|javascript:|onerror\s*=|onload\s*=/i;

export const SAFE_ENTITY_ID_REGEX = /^[a-zA-Z0-9_.-]{1,100}$/;

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

export function validateActionParams(params: {
  organizationId?: string;
  [key: string]: unknown;
}): void {
  const fieldErrors: Record<string, string[]> = {};

  if (params.organizationId !== undefined) {
    const orgResult = uuidSchema('Organization ID').safeParse(params.organizationId);
    if (!orgResult.success) {
      fieldErrors['organizationId'] = ['Organization ID tidak valid (harus format UUID)'];
    }
  }

  for (const [key, value] of Object.entries(params)) {
    if (key === 'organizationId' || value === undefined || value === null) continue;

    if (
      typeof value !== 'string' ||
      !SAFE_ENTITY_ID_REGEX.test(value) ||
      value.includes('..') ||
      value.includes('/') ||
      value.includes('\\')
    ) {
      fieldErrors[key] = [`Parameter ${key} tidak valid`];
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError('Parameter permintaan tidak valid', fieldErrors);
  }
}

export function validateUuidParam(val: unknown, fieldName: string): string {
  const result = uuidSchema(fieldName).safeParse(val);
  if (!result.success) {
    throw new ValidationError(`Parameter ${fieldName} tidak valid`, {
      [fieldName]: [result.error.issues[0].message],
    });
  }
  return result.data;
}

export function validateUuidParams(params: Record<string, unknown>): void {
  validateActionParams(params as { organizationId?: string });
}
