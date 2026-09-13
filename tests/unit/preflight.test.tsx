// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ErrorBoundaryPage from '@/app/error';
import GlobalErrorPage from '@/app/global-error';
import NotFoundPage from '@/app/not-found';

describe('Pre-Flight & Global Error Boundaries', () => {
  describe('error.tsx', () => {
    it('should render friendly error UI and trigger reset callback', () => {
      const resetMock = vi.fn();
      const testError = new Error('Database connection failed');

      render(<ErrorBoundaryPage error={testError} reset={resetMock} />);

      expect(screen.getByText('Terjadi Kesalahan')).toBeDefined();
      expect(screen.getByText(/Maaf, terjadi kendala saat memproses permintaan Anda/i)).toBeDefined();

      const retryBtn = screen.getByRole('button', { name: /Coba Lagi/i });
      fireEvent.click(retryBtn);
      expect(resetMock).toHaveBeenCalled();
    });
  });

  describe('global-error.tsx', () => {
    it('should render critical system error fallback', () => {
      const resetMock = vi.fn();
      const testError = new Error('Fatal root crash');

      render(<GlobalErrorPage error={testError} reset={resetMock} />);

      expect(screen.getByText('Kesalahan Sistem Kritis')).toBeDefined();
      const retryBtn = screen.getByRole('button', { name: /Muat Ulang Aplikasi/i });
      fireEvent.click(retryBtn);
      expect(resetMock).toHaveBeenCalled();
    });
  });

  describe('not-found.tsx', () => {
    it('should render 404 page with return link', () => {
      render(<NotFoundPage />);

      expect(screen.getByText('Halaman Tidak Ditemukan')).toBeDefined();
      expect(screen.getByRole('link', { name: /Kembali ke Beranda/i })).toBeDefined();
    });
  });
});
