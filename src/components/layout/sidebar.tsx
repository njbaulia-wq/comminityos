import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SidebarProps {
  orgSlug: string;
  className?: string;
  currentPath?: string;
}

export function Sidebar({ orgSlug, className, currentPath }: SidebarProps) {
  const navItems = [
    { label: 'Overview', path: `/${orgSlug}/overview` },
    { label: 'People', path: `/${orgSlug}/people` },
    { label: 'Activities', path: `/${orgSlug}/activities` },
    { label: 'Tasks', path: `/${orgSlug}/tasks` },
    { label: 'Finance', path: `/${orgSlug}/finance` },
    { label: 'Documents', path: `/${orgSlug}/documents` },
    { label: 'Settings', path: `/${orgSlug}/settings` },
  ];

  return (
    <aside
      className={cn(
        'w-64 border-r border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col justify-between h-screen',
        className
      )}
    >
      <div className="space-y-6">
        <div className="px-3 py-2">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Community OS
          </h2>
          <p className="text-xs text-zinc-500">{orgSlug}</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <a
                key={item.label}
                href={item.path}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200/50 dark:hover:bg-zinc-800',
                  isActive
                    ? 'bg-zinc-200 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 dark:text-zinc-400'
                )}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800 px-3">
        <p className="text-xs text-zinc-400">v1.0.0 • Local Community</p>
      </div>
    </aside>
  );
}
