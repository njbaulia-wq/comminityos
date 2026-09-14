// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';
import SignupPage from '@/app/(auth)/signup/page';
import ForbiddenPage from '@/app/forbidden/page';
import HomePage from '@/app/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Public Authentication & Landing Pages', () => {
  it('should render HomePage with Community OS branding and CTAs', () => {
    render(<HomePage />);

    const headings = screen.getAllByText(/Community OS/i);
    expect(headings.length).toBeGreaterThanOrEqual(1);

    expect(screen.getAllByText(/Masuk/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Daftar/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should render LoginPage with email and password fields', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/Email/i)).toBeDefined();
    expect(screen.getByLabelText(/Kata Sandi/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Masuk/i })).toBeDefined();
  });

  it('should render SignupPage with registration inputs', () => {
    render(<SignupPage />);

    expect(screen.getByLabelText(/Nama Lengkap/i)).toBeDefined();
    expect(screen.getByLabelText(/Email/i)).toBeDefined();
    expect(screen.getByLabelText(/^Kata Sandi/i)).toBeDefined();
    expect(screen.getByLabelText(/Konfirmasi Kata Sandi/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Daftar Sekarang/i })).toBeDefined();
  });

  it('should render ForbiddenPage with 403 explanation in Indonesian', () => {
    render(<ForbiddenPage />);

    expect(screen.getByText(/Akses Ditolak/i)).toBeDefined();
    expect(screen.getByText(/Anda tidak memiliki izin/i)).toBeDefined();
  });
});
