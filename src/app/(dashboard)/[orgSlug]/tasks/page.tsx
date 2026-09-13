'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TaskBoard } from '@/components/modules/tasks/task-board';
import { TaskItem } from '@/components/modules/tasks/task-card';

interface TasksPageProps {
  params: Promise<{
    orgSlug: string;
  }>;
}

export default function TasksPage({ params }: TasksPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ orgSlug: string } | null>(null);

  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'task-1',
      title: 'Koordinasi Keamanan Pos Ronda',
      description: 'Jadwal giliran ronda malam minggu',
      status: 'todo',
      priority: 'high',
      totalChecklists: 3,
      completedChecklists: 1,
    },
    {
      id: 'task-2',
      title: 'Perbaikan Lampu Penerangan Jalan',
      description: 'Gang Mawar RT 05 mati total',
      status: 'in_progress',
      priority: 'urgent',
    },
    {
      id: 'task-3',
      title: 'Pendataan Warga Baru Kost',
      description: 'Rumah no. 14B',
      status: 'done',
      priority: 'low',
    },
  ]);

  const handleStatusChange = (taskId: string, newStatus: TaskItem['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Papan Tugas & Kegiatan
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Kelola pembagian tugas pengurus dan pantau progres kerja
          </p>
        </div>
        <Button>+ Tambah Tugas</Button>
      </div>

      <TaskBoard tasks={tasks} onStatusChange={handleStatusChange} />
    </div>
  );
}
