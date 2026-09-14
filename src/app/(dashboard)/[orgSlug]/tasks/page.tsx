'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { TaskBoard } from '@/components/modules/tasks/task-board';
import { TaskItem } from '@/components/modules/tasks/task-card';
import { TaskFormDialog, TaskFormData } from '@/components/modules/tasks/task-form-dialog';
import { getTasksData } from '@/server/actions/data-fetchers.actions';
import { createTaskAction, updateTaskStatusAction } from '@/server/actions/task.actions';

interface TasksPageProps {
  params: Promise<{
    orgSlug: string;
  }>;
}

export default function TasksPage({ params }: TasksPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ orgSlug: string } | null>(null);
  const [organizationId, setOrganizationId] = useState('11111111-1111-4111-8111-111111111111');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const loadTasks = useCallback(async (slug: string) => {
    try {
      const res = await getTasksData(slug);
      if (res) {
        setOrganizationId(res.organizationId);
        if (res.tasks.length > 0) {
          setTasks(res.tasks);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    params.then((p) => {
      setResolvedParams(p);
      loadTasks(p.orgSlug);
    });
  }, [params, loadTasks]);

  const handleStatusChange = async (taskId: string, newStatus: TaskItem['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTaskStatusAction({
        organizationId,
        taskId,
        status: newStatus,
      });
    } catch (err: any) {
      console.error('Gagal memperbarui status tugas:', err);
    }
  };

  const handleCreateTask = async (formData: TaskFormData) => {
    setErrorMessage(null);
    try {
      const result = await createTaskAction({
        organizationId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'todo',
        dueDate: formData.dueDate,
      });

      if (!result.success) {
        setErrorMessage(result.error?.message || 'Gagal membuat tugas');
        return;
      }

      if (resolvedParams) {
        await loadTasks(resolvedParams.orgSlug);
      } else {
        setTasks((prev) => [
          {
            id: result.data.id,
            title: formData.title,
            description: formData.description,
            status: 'todo',
            priority: formData.priority,
            dueDate: formData.dueDate,
          },
          ...prev,
        ]);
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal membuat tugas');
    }
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
        <Button onClick={() => setIsDialogOpen(true)}>+ Tambah Tugas</Button>
      </div>

      <TaskBoard tasks={tasks} onStatusChange={handleStatusChange} />

      <TaskFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreateTask}
        errorMessage={errorMessage}
      />
    </div>
  );
}
