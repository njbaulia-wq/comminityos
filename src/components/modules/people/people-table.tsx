'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface MemberItem {
  id: string;
  fullName: string;
  phone?: string | null;
  houseNumber?: string | null;
  residentStatus?: string;
  roleName?: string;
  isUnclaimed?: boolean;
  teamNames?: string[];
}

export interface PeopleTableProps {
  members: MemberItem[];
  isLoading?: boolean;
  emptyMessage?: string;
  onSelectMember?: (member: MemberItem) => void;
}

export const PeopleTable: React.FC<PeopleTableProps> = ({
  members,
  isLoading = false,
  emptyMessage = 'Belum ada data anggota',
  onSelectMember,
}) => {
  if (isLoading) {
    return (
      <div
        data-testid="people-table-skeleton"
        className="w-full space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <div className="h-6 w-1/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 w-full animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 py-12 text-center dark:border-neutral-800">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
          <tr>
            <th className="px-4 py-3">Nama Warga</th>
            <th className="px-4 py-3">No. Rumah</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Tim / Seksi</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {members.map((member) => (
            <tr
              key={member.id}
              className="transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30"
            >
              <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                <div>{member.fullName}</div>
                {member.phone && (
                  <div className="text-xs text-neutral-400">{member.phone}</div>
                )}
              </td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                {member.houseNumber || '-'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Badge variant="outline">{member.residentStatus || 'tetap'}</Badge>
                  {member.isUnclaimed && (
                    <Badge variant="warning">Belum Terklaim</Badge>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant="secondary">{member.roleName || 'Member'}</Badge>
              </td>
              <td className="px-4 py-3">
                {member.teamNames && member.teamNames.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {member.teamNames.map((team, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        {team}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-neutral-400">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectMember && onSelectMember(member)}
                >
                  Detail
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
