// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { handleTenantRouting } from '@/middleware';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';

describe('Multi-Tenant Middleware & App Layout Shell', () => {
  describe('handleTenantRouting middleware logic', () => {
    it('should allow public auth routes without redirect', () => {
      const result = handleTenantRouting({
        pathname: '/login',
        user: null,
      });

      expect(result.action).toBe('next');
    });

    it('should redirect unauthenticated users accessing tenant route to /login', () => {
      const result = handleTenantRouting({
        pathname: '/rt05-rw02/overview',
        user: null,
      });

      expect(result.action).toBe('redirect');
      expect(result.destination).toBe('/login?redirect=%2Frt05-rw02%2Foverview');
    });

    it('should redirect authenticated users accessing non-member tenant to /forbidden', () => {
      const result = handleTenantRouting({
        pathname: '/rt05-rw02/overview',
        user: { id: 'usr-1' },
        userOrgSlugs: ['other-org'],
      });

      expect(result.action).toBe('redirect');
      expect(result.destination).toBe('/forbidden');
    });

    it('should allow authenticated member access to their tenant', () => {
      const result = handleTenantRouting({
        pathname: '/rt05-rw02/overview',
        user: { id: 'usr-1' },
        userOrgSlugs: ['rt05-rw02', 'karang-taruna'],
      });

      expect(result.action).toBe('next');
    });
  });

  describe('Shell Layout components', () => {
    it('should render core navigation links in Sidebar', () => {
      render(<Sidebar orgSlug="rt05-rw02" />);

      expect(screen.getByText('Overview')).toBeDefined();
      expect(screen.getByText('People')).toBeDefined();
      expect(screen.getByText('Activities')).toBeDefined();
      expect(screen.getByText('Tasks')).toBeDefined();
      expect(screen.getByText('Finance')).toBeDefined();
      expect(screen.getByText('Documents')).toBeDefined();
      expect(screen.getByText('Settings')).toBeDefined();
    });

    it('should render organization title and user info in TopBar', () => {
      render(
        <TopBar
          orgName="RT 05 RW 02"
          userName="Budi Santoso"
        />
      );

      expect(screen.getByText('RT 05 RW 02')).toBeDefined();
      expect(screen.getByText('Budi Santoso')).toBeDefined();
    });
  });
});
