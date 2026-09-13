const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /nik/i,
  /secret/i,
  /authorization/i,
  /auth/i,
  /credit_?card/i,
  /api_?key/i,
  /bank_?account/i,
  /account_?number/i,
  /no_?rekening/i,
  /nomor_?rekening/i,
  /rekening/i,
  /pin/i,
  /cvv/i,
  /cvc/i,
  /passcode/i,
  /private_?key/i,
  /access_?token/i,
  /refresh_?token/i,
  /bearer/i,
  /jwt/i,
  /ktp/i,
  /national_?id/i,
  /citizen_?id/i,
  /identity_?card/i,
];

const REDACTED = '***REDACTED***';

/**
 * Checks if a string value represents a sensitive pattern (e.g. 16-digit NIK, credit card, JWT).
 */
function isSensitiveValue(val: string): boolean {
  // Indonesian 16-digit NIK (KTP)
  if (/^\d{16}$/.test(val)) return true;

  // JWT token format
  if (/^eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(val)) return true;

  // Credit card format (13 to 19 digits, optional dashes/spaces)
  if (/^(?:\d{4}[- ]?){3}\d{1,7}$/.test(val)) return true;

  return false;
}

/**
 * Deeply masks sensitive keys and sensitive values in an object or array.
 * Safe against circular references.
 */
export function maskSensitiveData(input: unknown, seen = new WeakSet()): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input !== 'object') {
    if (typeof input === 'string' && isSensitiveValue(input)) {
      return REDACTED;
    }
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
