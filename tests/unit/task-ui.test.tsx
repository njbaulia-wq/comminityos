// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TaskCard, TaskItem } from '@/components/modules/tasks/task-card';
import { TaskBoard } from '@/components/modules/tasks/task-board';
import ActivitiesPage from '@/app/(dashboard)/[orgSlug]/activities/page';
import ActivityDetailPage from '@/app/(dashboard)/[orgSlug]/activities/[activityId]/page';

describe('Activities & Tasks UI Components', () => {
  const mockTasks: TaskItem[] = [
    {
      id: 'task-1',
      title: 'Sewa Tenda & Panggung',
      description: 'Hubungi vendor tenda',
      status: 'todo',
      priority: 'urgent',
      dueDate: '2026-08-15',
      completedChecklists: 1,
      totalChecklists: 3,
    },
    {
      id: 'task-2',
      title: 'Beli Hadiah Lomba',
      description: 'Belanja di pasar grosir',
      status: 'in_progress',
      priority: 'medium',
      completedChecklists: 2,
      totalChecklists: 2,
    },
    {
      id: 'task-3',
      title: 'Koordinasi Keamanan',
      status: 'done',
      priority: 'low',
    },
  ];

  describe('TaskCard', () => {
    it('should render title, description, priority badge, and checklist counter', () => {
      render(<TaskCard task={mockTasks[0]} />);

      expect(screen.getByText('Sewa Tenda & Panggung')).toBeDefined();
      expect(screen.getByText('Hubungi vendor tenda')).toBeDefined();
      expect(screen.getByText('urgent')).toBeDefined();
      expect(screen.getByText('1/3 checklist')).toBeDefined();
    });

    it('should trigger onStatusChange when status selector or button is clicked', () => {
      const handleStatusChange = vi.fn();
      render(<TaskCard task={mockTasks[0]} onStatusChange={handleStatusChange} />);

      const moveBtn = screen.getByRole('button', { name: /kerjakan/i });
      fireEvent.click(moveBtn);
      expect(handleStatusChange).toHaveBeenCalledWith('task-1', 'in_progress');
    });
  });

  describe('TaskBoard', () => {
    it('should render 3 columns: To Do, In Progress, Done', () => {
      render(<TaskBoard tasks={mockTasks} />);

      expect(screen.getByText('To Do')).toBeDefined();
      expect(screen.getByText('In Progress')).toBeDefined();
      expect(screen.getByText('Done')).toBeDefined();
    });

    it('should correctly sort tasks into their respective columns', () => {
      render(<TaskBoard tasks={mockTasks} />);

      expect(screen.getByText('Sewa Tenda & Panggung')).toBeDefined();
      expect(screen.getByText('Beli Hadiah Lomba')).toBeDefined();
      expect(screen.getByText('Koordinasi Keamanan')).toBeDefined();
    });

    it('should display empty message when a column has no tasks', () => {
      render(<TaskBoard tasks={[]} />);
      const emptyMessages = screen.getAllByText('Tidak ada tugas');
      expect(emptyMessages.length).toBe(3);
    });
  });

  describe('Activities Pages', () => {
    it('should render Activities list page header and button', async () => {
      await React.act(async () => {
        render(<ActivitiesPage params={Promise.resolve({ orgSlug: 'rt05-rw02' })} />);
      });

      expect(screen.getByText('Daftar Kegiatan & Agenda')).toBeDefined();
      expect(screen.getByRole('button', { name: /\+ Buat Kegiatan/i })).toBeDefined();
    });

    it('should render Activity detail page with status and budget', async () => {
      await React.act(async () => {
        render(
          <ActivityDetailPage
            params={Promise.resolve({ orgSlug: 'rt05-rw02', activityId: 'act-123' })}
          />
        );
      });

      expect(screen.getByText(/Detail Kegiatan/i)).toBeDefined();
      expect(screen.getByText(/Anggaran/i)).toBeDefined();
    });
  });
});
