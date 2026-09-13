import { z } from 'zod';
import {
  safeTextSchema,
  optionalSafeTextSchema,
  uuidSchema,
} from './common.schema';

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
  organizationId: uuidSchema('Organization ID'),
  roleId: uuidSchema('Role ID'),
  fullName: safeTextSchema({ min: 2, max: 100, fieldName: 'Nama lengkap' }),
  phone: z
    .string()
    .regex(ID_PHONE_REGEX, 'Format nomor telepon seluler Indonesia tidak valid (contoh: 08123456789)')
    .optional()
    .nullable(),
  address: optionalSafeTextSchema(200, 'Alamat'),
  houseNumber: optionalSafeTextSchema(20, 'Nomor rumah'),
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
  organizationId: uuidSchema('Organization ID'),
  name: safeTextSchema({ min: 2, max: 100, fieldName: 'Nama tim/seksi' }),
  description: optionalSafeTextSchema(300, 'Deskripsi'),
});

export type CreateTeamInput = z.input<typeof CreateTeamSchema>;
export type CreateTeamOutput = z.output<typeof CreateTeamSchema>;
