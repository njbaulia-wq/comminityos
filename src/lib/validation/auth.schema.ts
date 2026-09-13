import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string({ required_error: 'Email wajib diisi' }).email('Format email tidak valid'),
  password: z
    .string({ required_error: 'Kata sandi wajib diisi' })
    .min(6, 'Kata sandi minimal 6 karakter'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const SignupSchema = z
  .object({
    fullName: z
      .string({ required_error: 'Nama lengkap wajib diisi' })
      .min(2, 'Nama lengkap minimal 2 karakter')
      .max(100, 'Nama lengkap maksimal 100 karakter'),
    email: z.string({ required_error: 'Email wajib diisi' }).email('Format email tidak valid'),
    password: z
      .string({ required_error: 'Kata sandi wajib diisi' })
      .min(8, 'Kata sandi minimal 8 karakter'),
    confirmPassword: z.string({ required_error: 'Konfirmasi kata sandi wajib diisi' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof SignupSchema>;
