'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string | null;
  assigneeName?: string | null;
  completedChecklists?: number;
  totalChecklists?: number;
}

export interface TaskCardProps {
  task: TaskItem;
  onStatusChange?: (taskId: string, newStatus: TaskItem['status']) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange }) => {
  const getPriorityVariant = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="p-3 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {task.title}
        </h4>
        <Badge variant={getPriorityVariant(task.priority)} className="shrink-0">
          {task.priority}
        </Badge>
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
        <div>
          {task.totalChecklists !== undefined && task.totalChecklists > 0 ? (
            <span className="font-mono">
              {task.completedChecklists ?? 0}/{task.totalChecklists} checklist
            </span>
          ) : (
            task.dueDate && <span>{task.dueDate}</span>
          )}
        </div>

        {onStatusChange && (
          <div>
            {task.status === 'todo' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2"
                onClick={() => onStatusChange(task.id, 'in_progress')}
              >
                Kerjakan
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2"
                onClick={() => onStatusChange(task.id, 'done')}
              >
                Selesai
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
