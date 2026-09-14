import * as React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { getDashboardLayoutData } from '@/server/actions/data-fetchers.actions';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { orgSlug } = await params;
  const layoutData = await getDashboardLayoutData(orgSlug);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Sidebar orgSlug={orgSlug} />
      <div className="flex flex-1 flex-col">
        <TopBar
          orgName={layoutData.orgName}
          userName={`${layoutData.userName} (${layoutData.userRole})`}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
