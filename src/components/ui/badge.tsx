import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80 dark:bg-zinc-50 dark:text-zinc-900',
    secondary: 'border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50',
    destructive: 'border-transparent bg-red-500 text-zinc-50 hover:bg-red-500/80',
    outline: 'text-zinc-950 dark:text-zinc-50 border-zinc-200 dark:border-zinc-800',
    success: 'border-transparent bg-emerald-600 text-white dark:bg-emerald-700',
    warning: 'border-transparent bg-amber-500 text-white dark:bg-amber-600',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
