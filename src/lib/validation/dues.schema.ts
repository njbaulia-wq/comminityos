import { z } from 'zod';

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
  organizationId: z
    .string({ required_error: 'Organization ID wajib diisi' })
    .uuid('Organization ID tidak valid'),
  title: z
    .string({ required_error: 'Nama rencana iuran wajib diisi' })
    .min(3, 'Nama rencana iuran minimal 3 karakter')
    .max(100, 'Nama rencana iuran maksimal 100 karakter'),
  amount: z
    .number({ invalid_type_error: 'Nominal iuran harus berupa angka' })
    .positive('Nominal iuran harus lebih besar dari 0'),
  frequency: DueFrequencyEnum,
  dueDate: z.string().optional().nullable(),
});

export type CreateDuePlanInput = z.input<typeof CreateDuePlanSchema>;
export type CreateDuePlanOutput = z.output<typeof CreateDuePlanSchema>;

export const CreatePaymentSchema = z.object({
  organizationId: z
    .string({ required_error: 'Organization ID wajib diisi' })
    .uuid('Organization ID tidak valid'),
  dueItemId: z
    .string({ required_error: 'Due Item ID wajib diisi' })
    .uuid('Due Item ID tidak valid'),
  amount: z
    .number({ invalid_type_error: 'Nominal pembayaran harus berupa angka' })
    .positive('Nominal pembayaran harus lebih besar dari 0'),
  paymentMethod: PaymentMethodEnum,
  proofFileUrl: z.string().optional().nullable(),
});

export type CreatePaymentInput = z.input<typeof CreatePaymentSchema>;
export type CreatePaymentOutput = z.output<typeof CreatePaymentSchema>;
