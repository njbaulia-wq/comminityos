import { ValidationError } from '@/lib/errors';

/**
 * Format a number to Indonesian Rupiah representation (e.g. Rp 1.500.000)
 */
export function formatIDR(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new ValidationError('Nominal uang tidak valid');
  }

  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

/**
 * Parse a Rupiah formatted string back to a numeric value
 */
export function parseIDR(str: string): number {
  if (!str || typeof str !== 'string') {
    throw new ValidationError('Format nominal Rupiah tidak valid');
  }

  const cleaned = str.replace(/Rp|\s/gi, '').replace(/\./g, '').replace(',', '.');
  const num = Number(cleaned);

  if (isNaN(num)) {
    throw new ValidationError('Format nominal Rupiah tidak valid');
  }

  return num;
}

/**
 * High-precision currency addition avoiding JS floating point inaccuracies
 */
export function addMoney(a: number, b: number): number {
  if (isNaN(a) || isNaN(b)) {
    throw new ValidationError('Nilai nominal tidak valid');
  }
  return Math.round((a + b) * 100) / 100;
}

/**
 * High-precision currency subtraction avoiding JS floating point inaccuracies
 */
export function subtractMoney(a: number, b: number): number {
  if (isNaN(a) || isNaN(b)) {
    throw new ValidationError('Nilai nominal tidak valid');
  }
  return Math.round((a - b) * 100) / 100;
}

/**
 * Calculate ledger balance from initial balance and list of transactions
 */
export function calculateLedgerBalance(
  initialBalance: number,
  transactions: Array<{ type: 'income' | 'expense' | 'transfer'; amount: number }>
): number {
  let cents = Math.round(initialBalance * 100);

  for (const tx of transactions) {
    const txCents = Math.round(tx.amount * 100);
    if (tx.type === 'income') {
      cents += txCents;
    } else if (tx.type === 'expense') {
      cents -= txCents;
    }
  }

  return cents / 100;
}
