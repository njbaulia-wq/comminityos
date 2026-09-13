import { z } from 'zod';
import {
  safeTextSchema,
  optionalSafeTextSchema,
  uuidSchema,
  optionalUuidSchema,
} from './common.schema';

export const ActivityStatusEnum = z.enum([
  'draft',
  'planned',
  'active',
  'completed',
  'cancelled',
]);

export type ActivityStatus = z.infer<typeof ActivityStatusEnum>;

export const CreateActivitySchema = z
  .object({
    organizationId: uuidSchema('Organization ID'),
    title: safeTextSchema({ min: 3, max: 150, fieldName: 'Judul kegiatan' }),
    description: optionalSafeTextSchema(1000, 'Deskripsi'),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    status: ActivityStatusEnum.default('draft'),
    budgetEstimate: z
      .number({ invalid_type_error: 'Estimasi anggaran harus berupa angka' })
      .min(0, 'Estimasi anggaran tidak boleh bernilai negatif')
      .default(0),
    picMemberId: optionalUuidSchema('PIC Member ID'),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai kegiatan',
        path: ['endDate'],
      });
    }
  });

export type CreateActivityInput = z.input<typeof CreateActivitySchema>;
export type CreateActivityOutput = z.output<typeof CreateActivitySchema>;

export const UpdateActivitySchema = z
  .object({
    organizationId: optionalUuidSchema('Organization ID'),
    title: safeTextSchema({ min: 3, max: 150, fieldName: 'Judul kegiatan', required: false }).optional(),
    description: optionalSafeTextSchema(1000, 'Deskripsi'),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    status: ActivityStatusEnum.optional(),
    budgetEstimate: z.number().min(0, 'Estimasi anggaran tidak boleh bernilai negatif').optional(),
    picMemberId: optionalUuidSchema('PIC Member ID'),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai kegiatan',
        path: ['endDate'],
      });
    }
  });

export type UpdateActivityInput = z.input<typeof UpdateActivitySchema>;
export type UpdateActivityOutput = z.output<typeof UpdateActivitySchema>;
