const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /nik/i,
  /secret/i,
  /authorization/i,
  /auth/i,
  /credit_?card/i,
  /api_?key/i,
];

const REDACTED = '***REDACTED***';

/**
 * Deeply masks sensitive keys in an object or array.
 * Safe against circular references.
 */
export function maskSensitiveData(input: unknown, seen = new WeakSet()): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input !== 'object') {
    return input;
  }

  if (seen.has(input as object)) {
    return '[Circular]';
  }

  seen.add(input as object);

  if (Array.isArray(input)) {
    return input.map((item) => maskSensitiveData(item, seen));
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      result[key] = REDACTED;
    } else {
      result[key] = maskSensitiveData(value, seen);
    }
  }

  return result;
}
