import { z } from 'zod';

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
    organizationId: z
      .string({ required_error: 'Organization ID wajib diisi' })
      .uuid('Organization ID tidak valid'),
    title: z
      .string({ required_error: 'Judul kegiatan wajib diisi' })
      .min(3, 'Judul kegiatan minimal 3 karakter')
      .max(150, 'Judul kegiatan maksimal 150 karakter'),
    description: z
      .string()
      .max(1000, 'Deskripsi maksimal 1000 karakter')
      .optional()
      .nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    status: ActivityStatusEnum.default('draft'),
    budgetEstimate: z
      .number({ invalid_type_error: 'Estimasi anggaran harus berupa angka' })
      .min(0, 'Estimasi anggaran tidak boleh bernilai negatif')
      .default(0),
    picMemberId: z.string().uuid('PIC Member ID tidak valid').optional().nullable(),
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
    organizationId: z.string().uuid('Organization ID tidak valid').optional(),
    title: z.string().min(3, 'Judul kegiatan minimal 3 karakter').max(150).optional(),
    description: z.string().max(1000).optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    status: ActivityStatusEnum.optional(),
    budgetEstimate: z.number().min(0, 'Estimasi anggaran tidak boleh bernilai negatif').optional(),
    picMemberId: z.string().uuid('PIC Member ID tidak valid').optional().nullable(),
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
