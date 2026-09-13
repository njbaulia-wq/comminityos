'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PeopleTable, MemberItem } from '@/components/modules/people/people-table';
import { MemberFormDialog } from '@/components/modules/people/member-form-dialog';

interface PeoplePageProps {
  params: Promise<{
    orgSlug: string;
  }>;
}

export default function PeoplePage({ params }: PeoplePageProps) {
  // Unwrap promise for Next.js 15 app router params
  const [resolvedParams, setResolvedParams] = React.useState<{ orgSlug: string } | null>(null);

  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddMember = async (data: any) => {
    try {
      const newMember: MemberItem = {
        id: 'mem-' + Date.now(),
        fullName: data.fullName,
        phone: data.phone,
        houseNumber: data.houseNumber,
        residentStatus: data.residentStatus,
        roleName: 'Member',
        isUnclaimed: true,
      };
      setMembers((prev) => [...prev, newMember]);
      setIsDialogOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data anggota');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Daftar Anggota & Warga
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Kelola data kependudukan, kepengurusan, dan penugasan tim
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          + Tambah Warga
        </Button>
      </div>

      <PeopleTable
        members={members}
        isLoading={isLoading}
        onSelectMember={(mem) => console.log('Selected:', mem)}
      />

      <MemberFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleAddMember}
        errorMessage={errorMessage}
      />
    </div>
  );
}
