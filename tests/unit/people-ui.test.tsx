// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PeopleTable, MemberItem } from '@/components/modules/people/people-table';
import { MemberFormDialog } from '@/components/modules/people/member-form-dialog';
import PeoplePage from '@/app/(dashboard)/[orgSlug]/people/page';

describe('People UI Components', () => {
  const mockMembers: MemberItem[] = [
    {
      id: 'mem-1',
      fullName: 'Ahmad Dahlan',
      phone: '081234567890',
      houseNumber: '12A',
      residentStatus: 'tetap',
      roleName: 'Admin',
      isUnclaimed: false,
      teamNames: ['Keamanan'],
    },
    {
      id: 'mem-2',
      fullName: 'Siti Rahma',
      phone: null,
      houseNumber: '14',
      residentStatus: 'kontrak',
      roleName: 'Member',
      isUnclaimed: true,
      teamNames: [],
    },
  ];

  describe('PeopleTable', () => {
    it('should render loading skeleton when isLoading is true', () => {
      render(<PeopleTable members={[]} isLoading={true} />);
      expect(screen.getByTestId('people-table-skeleton')).toBeDefined();
    });

    it('should render empty state when members list is empty', () => {
      render(<PeopleTable members={[]} isLoading={false} />);
      expect(screen.getByText('Belum ada data anggota')).toBeDefined();
    });

    it('should render members with badges for role and resident status', () => {
      render(<PeopleTable members={mockMembers} isLoading={false} />);

      expect(screen.getByText('Ahmad Dahlan')).toBeDefined();
      expect(screen.getByText('Siti Rahma')).toBeDefined();
      expect(screen.getByText('12A')).toBeDefined();

      // Badges
      expect(screen.getByText('Admin')).toBeDefined();
      expect(screen.getByText('tetap')).toBeDefined();
      expect(screen.getByText('Belum Terklaim')).toBeDefined();
      expect(screen.getByText('Keamanan')).toBeDefined();
    });

    it('should trigger onSelectMember callback when detail button clicked', () => {
      const handleSelect = vi.fn();
      render(<PeopleTable members={mockMembers} isLoading={false} onSelectMember={handleSelect} />);

      const detailButtons = screen.getAllByRole('button', { name: /detail/i });
      fireEvent.click(detailButtons[0]);
      expect(handleSelect).toHaveBeenCalledWith(mockMembers[0]);
    });
  });

  describe('MemberFormDialog', () => {
    it('should render input fields when open', () => {
      render(
        <MemberFormDialog
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/nama lengkap/i)).toBeDefined();
      expect(screen.getByLabelText(/nomor telepon/i)).toBeDefined();
      expect(screen.getByLabelText(/nomor rumah/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /simpan/i })).toBeDefined();
    });

    it('should display visual error message if submission fails', () => {
      render(
        <MemberFormDialog
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          errorMessage="Nomor telepon sudah digunakan"
        />
      );

      expect(screen.getByText('Nomor telepon sudah digunakan')).toBeDefined();
    });
  });

  describe('PeoplePage', () => {
    it('should render the directory header and add citizen button', async () => {
      await React.act(async () => {
        render(<PeoplePage params={Promise.resolve({ orgSlug: 'rt05-rw02' })} />);
      });
      expect(screen.getByText('Daftar Anggota & Warga')).toBeDefined();
      expect(screen.getByRole('button', { name: /\+ Tambah Warga/i })).toBeDefined();
    });
  });
});
