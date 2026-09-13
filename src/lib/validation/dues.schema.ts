import { z } from 'zod';
import { safeTextSchema, uuidSchema } from './common.schema';

export const DueFrequencyEnum = z.enum(['monthly', 'one_time', 'yearly']);
export type DueFrequency = z.infer<typeof DueFrequencyEnum>;

export const DueStatusEnum = z.enum([
  'unpaid',
  'pending_verification',
  'paid',
  'waived',
]);
export type DueStatus = z.infer<typeof DueStatusEnum>;

export const PaymentMethodEnum = z.enum(['cash', 'transfer']);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const CreateDuePlanSchema = z.object({
  organizationId: uuidSchema('Organization ID'),
  title: safeTextSchema({ min: 3, max: 100, fieldName: 'Nama rencana iuran' }),
  amount: z
    .number({ invalid_type_error: 'Nominal iuran harus berupa angka' })
    .positive('Nominal iuran harus lebih besar dari 0'),
  frequency: DueFrequencyEnum,
  dueDate: z.string().optional().nullable(),
});

export type CreateDuePlanInput = z.input<typeof CreateDuePlanSchema>;
export type CreateDuePlanOutput = z.output<typeof CreateDuePlanSchema>;

export const CreatePaymentSchema = z.object({
  organizationId: uuidSchema('Organization ID'),
  dueItemId: uuidSchema('Due Item ID'),
  amount: z
    .number({ invalid_type_error: 'Nominal pembayaran harus berupa angka' })
    .positive('Nominal pembayaran harus lebih besar dari 0'),
  paymentMethod: PaymentMethodEnum,
  proofFileUrl: z.string().optional().nullable(),
});

export type CreatePaymentInput = z.input<typeof CreatePaymentSchema>;
export type CreatePaymentOutput = z.output<typeof CreatePaymentSchema>;
