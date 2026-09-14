'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { loginAction } from '@/server/actions/auth.actions';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const isRegistered = searchParams.get('registered') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const result = await loginAction({ email, password });
      if (result.success) {
        const destination =
          redirectParam ||
          (result.data?.defaultOrgSlug
            ? `/${result.data.defaultOrgSlug}/overview`
            : '/rt05-rw02/overview');

        // Full page redirection ensures session cookies apply across all Server Components
        window.location.href = destination;
      } else {
        setErrorMsg(result.error.message || 'Gagal masuk. Silakan periksa kredensial Anda.');
      }
    } catch {
      setErrorMsg('Terjadi kendala saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMsg(null);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white font-bold text-sm dark:bg-white dark:text-neutral-900">
          CO
        </div>
        <CardTitle className="text-2xl font-bold">Masuk ke Community OS</CardTitle>
        <CardDescription>
          Masukkan email dan kata sandi untuk mengakses ruang kerja organisasi Anda
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {isRegistered && (
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
              Pendaftaran berhasil! Silakan masuk dengan email dan kata sandi Anda.
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium leading-none">
                Kata Sandi
              </label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Quick Demo Selector */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900">
            <p className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Akun Demo Terdaftar:
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleFillDemo('bambang.rt05@communityos.local')}
                className="rounded bg-white px-2 py-1 font-mono text-[11px] text-neutral-800 shadow-sm hover:bg-neutral-100 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700"
              >
                Ketua RT 05 (Bambang)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('siti.rahma@communityos.local')}
                className="rounded bg-white px-2 py-1 font-mono text-[11px] text-neutral-800 shadow-sm hover:bg-neutral-100 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700"
              >
                Bendahara (Siti)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('budi.kt@communityos.local')}
                className="rounded bg-white px-2 py-1 font-mono text-[11px] text-neutral-800 shadow-sm hover:bg-neutral-100 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700"
              >
                Karang Taruna (Budi)
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>

          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Belum memiliki akun?{' '}
            <Link href="/signup" className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100">
              Daftar sekarang
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950">
      <Suspense fallback={<div className="text-sm text-neutral-500">Memuat formulir masuk...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
