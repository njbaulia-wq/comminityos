// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

describe('Base UI Primitives (Geist Inspired)', () => {
  describe('Button', () => {
    it('should render button with default text and classes', () => {
      render(<Button>Simpan</Button>);
      const btn = screen.getByRole('button', { name: 'Simpan' });
      expect(btn).toBeDefined();
      expect(btn.textContent).toBe('Simpan');
    });

    it('should handle disabled and loading states', () => {
      render(<Button disabled isLoading>Memproses...</Button>);
      const btn = screen.getByRole('button');
      expect(btn.hasAttribute('disabled')).toBe(true);
      expect(btn.getAttribute('aria-disabled')).toBe('true');
    });

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Hapus</Button>);
      const btn = screen.getByRole('button', { name: 'Hapus' });
      expect(btn.className).toContain('bg-red');
    });
  });

  describe('Input', () => {
    it('should render standard input with placeholder', () => {
      render(<Input placeholder="Masukkan nama warga" />);
      const input = screen.getByPlaceholderText('Masukkan nama warga');
      expect(input).toBeDefined();
    });

    it('should show error state and aria-invalid when error is present', () => {
      render(<Input placeholder="Email" error="Email wajib diisi" />);
      const input = screen.getByPlaceholderText('Email');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByText('Email wajib diisi')).toBeDefined();
    });
  });

  describe('Badge', () => {
    it('should render badge with text', () => {
      render(<Badge variant="success">LUNAS</Badge>);
      expect(screen.getByText('LUNAS')).toBeDefined();
    });
  });

  describe('Card', () => {
    it('should render structured card hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Kas RT 05</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Saldo: Rp 1.500.000</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Kas RT 05')).toBeDefined();
      expect(screen.getByText('Saldo: Rp 1.500.000')).toBeDefined();
    });
  });
});
