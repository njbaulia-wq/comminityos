import { z } from 'zod';
import { safeTextSchema, uuidSchema } from './common.schema';

export const OrganizationTemplateEnum = z.enum([
  'rt',
  'rw',
  'karang_taruna',
  'pemuda',
  'komunitas',
  'custom',
]);

export type OrganizationTemplate = z.infer<typeof OrganizationTemplateEnum>;

export const CreateOrganizationSchema = z.object({
  name: safeTextSchema({ min: 3, max: 100, fieldName: 'Nama organisasi' }),
  slug: z
    .string({ required_error: 'Slug organisasi wajib diisi' })
    .min(3, 'Slug minimal 3 karakter')
    .max(50, 'Slug maksimal 50 karakter')
    .regex(/^[a-z0-9-]+$/, {
      message: 'Slug hanya boleh memuat huruf kecil, angka, dan strip (-)',
    }),
  template: OrganizationTemplateEnum,
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

export const InviteMemberSchema = z.object({
  email: z.string({ required_error: 'Email undangan wajib diisi' }).email('Format email tidak valid'),
  roleId: uuidSchema('Role ID'),
});

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
