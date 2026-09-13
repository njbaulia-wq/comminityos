import { z } from 'zod';

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
  name: z
    .string({ required_error: 'Nama organisasi wajib diisi' })
    .min(3, 'Nama organisasi minimal 3 karakter')
    .max(100, 'Nama organisasi maksimal 100 karakter'),
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
  roleId: z.string({ required_error: 'Role wajib dipilih' }).uuid('Role ID tidak valid'),
});

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
