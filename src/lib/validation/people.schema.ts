import { z } from 'zod';

export const ResidentStatusEnum = z.enum([
  'tetap',
  'kontrak',
  'kost',
  'pindah',
  'meninggal',
]);

export type ResidentStatus = z.infer<typeof ResidentStatusEnum>;

const ID_PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;

export const CreateMemberSchema = z.object({
  organizationId: z.string({ required_error: 'Organization ID wajib diisi' }).uuid('Organization ID tidak valid'),
  roleId: z.string({ required_error: 'Role ID wajib dipilih' }).uuid('Role ID tidak valid'),
  fullName: z
    .string({ required_error: 'Nama lengkap wajib diisi' })
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  phone: z
    .string()
    .regex(ID_PHONE_REGEX, 'Format nomor telepon seluler Indonesia tidak valid (contoh: 08123456789)')
    .optional()
    .nullable(),
  address: z.string().max(200, 'Alamat maksimal 200 karakter').optional().nullable(),
  houseNumber: z.string().max(20, 'Nomor rumah maksimal 20 karakter').optional().nullable(),
  rtNumber: z.string().max(10).optional().nullable(),
  rwNumber: z.string().max(10).optional().nullable(),
  residentStatus: ResidentStatusEnum.default('tetap'),
});

export type CreateMemberInput = z.input<typeof CreateMemberSchema>;
export type CreateMemberOutput = z.output<typeof CreateMemberSchema>;

export const UpdateMemberSchema = CreateMemberSchema.partial();
export type UpdateMemberInput = z.input<typeof UpdateMemberSchema>;
export type UpdateMemberOutput = z.output<typeof UpdateMemberSchema>;

export const CreateTeamSchema = z.object({
  organizationId: z.string({ required_error: 'Organization ID wajib diisi' }).uuid('Organization ID tidak valid'),
  name: z
    .string({ required_error: 'Nama tim/seksi wajib diisi' })
    .min(2, 'Nama tim/seksi minimal 2 karakter')
    .max(100, 'Nama tim/seksi maksimal 100 karakter'),
  description: z.string().max(300, 'Deskripsi maksimal 300 karakter').optional().nullable(),
});

export type CreateTeamInput = z.input<typeof CreateTeamSchema>;
export type CreateTeamOutput = z.output<typeof CreateTeamSchema>;
