'use client';

import React from 'react';
import { TaskCard, TaskItem } from '@/components/modules/tasks/task-card';

export interface TaskBoardProps {
  tasks: TaskItem[];
  onStatusChange?: (taskId: string, newStatus: TaskItem['status']) => void;
}

interface ColumnDef {
  id: TaskItem['status'];
  title: string;
}

const COLUMNS: ColumnDef[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onStatusChange }) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);

        return (
          <div
            key={column.id}
            className="flex flex-col rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {column.title}
              </h3>
              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-3">
              {columnTasks.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-neutral-300 dark:border-neutral-800">
                  <p className="text-xs text-neutral-400">Tidak ada tugas</p>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
