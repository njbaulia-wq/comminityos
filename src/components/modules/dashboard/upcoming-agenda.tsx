'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface AgendaActivity {
  id: string;
  title: string;
  startDate?: string;
  status: string;
}

export interface UrgentTask {
  id: string;
  title: string;
  dueDate?: string;
  priority: string;
}

export interface UpcomingAgendaProps {
  activities: AgendaActivity[];
  tasks: UrgentTask[];
  isLoading?: boolean;
}

export const UpcomingAgenda: React.FC<UpcomingAgendaProps> = ({
  activities,
  tasks,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-1/3 bg-neutral-200 rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-8 bg-neutral-100 rounded" />
          <div className="h-8 bg-neutral-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Agenda & Tenggat Waktu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activities */}
        <div>
          <span className="text-xs font-semibold uppercase text-neutral-500">
            Kegiatan Terdekat
          </span>
          {activities.length === 0 ? (
            <p className="mt-1 text-xs text-neutral-400">Tidak ada agenda aktif terdekat</p>
          ) : (
            <div className="mt-2 space-y-2">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-2 rounded-md border border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/30 text-xs"
                >
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    <span className="mr-1.5">📅</span>
                    <span>{act.title}</span>
                  </span>
                  {act.startDate && (
                    <span className="text-neutral-500 font-mono">{act.startDate}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <span className="text-xs font-semibold uppercase text-neutral-500">
            Tugas Mendesak
          </span>
          {tasks.length === 0 ? (
            <p className="mt-1 text-xs text-neutral-400">Tidak ada tugas mendesak</p>
          ) : (
            <div className="mt-2 space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-md border border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/30 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      <span className="mr-1.5">✓</span>
                      <span>{task.title}</span>
                    </span>
                    <Badge variant="destructive" className="text-[10px] px-1 py-0">
                      {task.priority}
                    </Badge>
                  </div>
                  {task.dueDate && (
                    <span className="text-neutral-500 font-mono">{task.dueDate}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
