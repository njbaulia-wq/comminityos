'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { logoutAction } from '@/server/actions/auth.actions';
import { LogOut } from 'lucide-react';

export interface TopBarProps {
  orgName: string;
  userName: string;
  userRole?: string;
  className?: string;
}

export function TopBar({ orgName, userName, userRole, className }: TopBarProps) {
  const handleLogout = async () => {
    try {
      await logoutAction();
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {orgName}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {userRole && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            {userRole}
          </span>
        )}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {userName}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Keluar dari sesi"
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-600 transition-colors dark:text-neutral-400 dark:hover:text-red-400 cursor-pointer pl-2 border-l border-neutral-200 dark:border-neutral-800"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
