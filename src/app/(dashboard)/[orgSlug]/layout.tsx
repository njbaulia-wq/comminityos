import * as React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { orgSlug } = await params;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Sidebar orgSlug={orgSlug} />
      <div className="flex flex-1 flex-col">
        <TopBar orgName={orgSlug} userName="Pengurus Komunitas" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
