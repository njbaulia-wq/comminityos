import { z } from 'zod';
import {
  safeTextSchema,
  optionalSafeTextSchema,
  uuidSchema,
  optionalUuidSchema,
} from './common.schema';

export const TransactionTypeEnum = z.enum(['income', 'expense', 'transfer']);
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

export const TransactionStatusEnum = z.enum([
  'draft',
  'pending_approval',
  'posted',
  'void',
]);
export type TransactionStatus = z.infer<typeof TransactionStatusEnum>;

export const AccountTypeEnum = z.enum(['cash', 'bank']);
export type AccountType = z.infer<typeof AccountTypeEnum>;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const CreateTransactionSchema = z.object({
  organizationId: uuidSchema('Organization ID'),
  accountId: uuidSchema('Akun kas/bank'),
  categoryId: optionalUuidSchema('Category ID'),
  amount: z
    .number({ invalid_type_error: 'Nominal transaksi harus berupa angka' })
    .positive('Nominal transaksi harus lebih besar dari 0'),
  type: TransactionTypeEnum,
  status: TransactionStatusEnum.default('draft'),
  description: optionalSafeTextSchema(500, 'Deskripsi transaksi'),
  transactionDate: z
    .string({ required_error: 'Tanggal transaksi wajib diisi' })
    .regex(DATE_REGEX, 'Format tanggal transaksi harus YYYY-MM-DD'),
});

export type CreateTransactionInput = z.input<typeof CreateTransactionSchema>;
export type CreateTransactionOutput = z.output<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = CreateTransactionSchema.partial();
export type UpdateTransactionInput = z.input<typeof UpdateTransactionSchema>;
export type UpdateTransactionOutput = z.output<typeof UpdateTransactionSchema>;

export const CreateAccountSchema = z.object({
  organizationId: uuidSchema('Organization ID'),
  name: safeTextSchema({ min: 2, max: 100, fieldName: 'Nama akun' }),
  type: AccountTypeEnum,
  balance: z
    .number({ invalid_type_error: 'Saldo harus berupa angka' })
    .min(0, 'Saldo awal tidak boleh bernilai negatif')
    .default(0),
  accountNumber: optionalSafeTextSchema(50, 'Nomor rekening/akun'),
});

export type CreateAccountInput = z.input<typeof CreateAccountSchema>;
export type CreateAccountOutput = z.output<typeof CreateAccountSchema>;

export const UpdateAccountSchema = CreateAccountSchema.partial();
export type UpdateAccountInput = z.input<typeof UpdateAccountSchema>;
export type UpdateAccountOutput = z.output<typeof UpdateAccountSchema>;
