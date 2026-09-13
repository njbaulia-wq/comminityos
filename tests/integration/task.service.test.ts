import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTask,
  updateTask,
  updateTaskStatus,
  addChecklistItem,
  toggleChecklistItem,
  TaskRepository,
} from '@/server/services/task.service';
import {
  ForbiddenError,
  NotFoundError,
  BusinessRuleError,
} from '@/lib/errors';
import { logger } from '@/lib/logger';

describe('Task Domain Service with State Transitions', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const validMemberId = '22222222-2222-4222-8222-222222222222';
  const adminCaller = { userId: 'user-admin', roleName: 'Admin' };
  const viewerCaller = { userId: 'user-viewer', roleName: 'Viewer' };

  let mockRepo: TaskRepository;
  let tasksDb: any[];
  let membersDb: any[];
  let checklistsDb: any[];

  beforeEach(() => {
    tasksDb = [];
    membersDb = [{ id: validMemberId, organizationId: orgId, fullName: 'Budi Santoso' }];
    checklistsDb = [];

    mockRepo = {
      findTaskById: vi.fn(async (organizationId: string, taskId: string) => {
        return tasksDb.find(
          (t) => t.organizationId === organizationId && t.id === taskId && !t.deletedAt
        ) || null;
      }),
      listTasks: vi.fn(async (organizationId: string) => {
        return tasksDb.filter((t) => t.organizationId === organizationId && !t.deletedAt);
      }),
      createTask: vi.fn(async (data: any) => {
        const record = {
          id: 'task-' + Math.random().toString(36).substring(7),
          ...data,
          createdAt: new Date().toISOString(),
          deletedAt: null,
        };
        tasksDb.push(record);
        return record;
      }),
      updateTask: vi.fn(async (organizationId: string, taskId: string, data: any) => {
        const record = tasksDb.find(
          (t) => t.organizationId === organizationId && t.id === taskId && !t.deletedAt
        );
        if (!record) return null;
        Object.assign(record, data, { updatedAt: new Date().toISOString() });
        return record;
      }),
      softDeleteTask: vi.fn(async (organizationId: string, taskId: string, actorUserId: string) => {
        const record = tasksDb.find(
          (t) => t.organizationId === organizationId && t.id === taskId && !t.deletedAt
        );
        if (!record) return false;
        record.deletedAt = new Date().toISOString();
        record.deletedBy = actorUserId;
        return true;
      }),
      findMember: vi.fn(async (organizationId: string, memberId: string) => {
        return membersDb.find((m) => m.organizationId === organizationId && m.id === memberId) || null;
      }),
      addChecklist: vi.fn(async (taskId: string, title: string) => {
        const item = {
          id: 'chk-' + Math.random().toString(36).substring(7),
          taskId,
          title,
          isDone: false,
          createdAt: new Date().toISOString(),
        };
        checklistsDb.push(item);
        return item;
      }),
      updateChecklist: vi.fn(async (checklistItemId: string, data: any) => {
        const item = checklistsDb.find((c) => c.id === checklistItemId);
        if (!item) return null;
        Object.assign(item, data);
        return item;
      }),
      listChecklists: vi.fn(async (taskId: string) => {
        return checklistsDb.filter((c) => c.taskId === taskId);
      }),
    };
  });

  describe('createTask', () => {
    it('should create task and log task.created and task.assigned when assignee is specified', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const input = {
        organizationId: orgId,
        title: 'Pasang Panggung Acara',
        description: 'Di lapangan RT 05',
        assigneeId: validMemberId,
        priority: 'high' as const,
      };

      const task = await createTask({
        input,
        caller: adminCaller,
        repo: mockRepo,
        requestId: 'req-task-1',
      });

      expect(task).toBeDefined();
      expect(task.title).toBe(input.title);
      expect(task.priority).toBe('high');
      expect(task.status).toBe('todo');

      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'task',
          action: 'task.created',
          requestId: 'req-task-1',
          organizationId: orgId,
        })
      );

      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'task',
          action: 'task.assigned',
          context: expect.objectContaining({
            assigneeId: validMemberId,
          }),
        })
      );

      infoSpy.mockRestore();
    });

    it('should throw BusinessRuleError if assignee is not a member of the organization', async () => {
      const input = {
        organizationId: orgId,
        title: 'Beli Perlengkapan',
        assigneeId: '99999999-9999-4999-8999-999999999999',
      };

      await expect(
        createTask({
          input,
          caller: adminCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw ForbiddenError if caller lacks tasks.manage permission', async () => {
      const input = {
        organizationId: orgId,
        title: 'Beli Perlengkapan',
      };

      await expect(
        createTask({
          input,
          caller: viewerCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateTaskStatus', () => {
    it('should transition status and log task.completed when marked as done', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const task = await createTask({
        input: {
          organizationId: orgId,
          title: 'Bersihkan Selokan',
        },
        caller: adminCaller,
        repo: mockRepo,
      });

      const updated = await updateTaskStatus({
        organizationId: orgId,
        taskId: task.id,
        status: 'done',
        caller: adminCaller,
        repo: mockRepo,
        requestId: 'req-complete-task',
      });

      expect(updated.status).toBe('done');
      expect(updated.completedAt).toBeDefined();

      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'task',
          action: 'task.completed',
          requestId: 'req-complete-task',
        })
      );

      infoSpy.mockRestore();
    });

    it('should throw NotFoundError if task does not exist', async () => {
      await expect(
        updateTaskStatus({
          organizationId: orgId,
          taskId: 'non-existent',
          status: 'in_progress',
          caller: adminCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('checklist management', () => {
    it('should add checklist item and detect when all items are done', async () => {
      const task = await createTask({
        input: {
          organizationId: orgId,
          title: 'Persiapan Bazar',
        },
        caller: adminCaller,
        repo: mockRepo,
      });

      const item1 = await addChecklistItem({
        organizationId: orgId,
        taskId: task.id,
        title: 'Sewa meja',
        caller: adminCaller,
        repo: mockRepo,
      });

      const item2 = await addChecklistItem({
        organizationId: orgId,
        taskId: task.id,
        title: 'Sewa kursi',
        caller: adminCaller,
        repo: mockRepo,
      });

      // Toggle first item
      const res1 = await toggleChecklistItem({
        organizationId: orgId,
        taskId: task.id,
        checklistItemId: item1.id,
        isDone: true,
        caller: adminCaller,
        repo: mockRepo,
      });
      expect(res1.allChecklistsDone).toBe(false);

      // Toggle second item
      const res2 = await toggleChecklistItem({
        organizationId: orgId,
        taskId: task.id,
        checklistItemId: item2.id,
        isDone: true,
        caller: adminCaller,
        repo: mockRepo,
      });
      expect(res2.allChecklistsDone).toBe(true);
    });
  });
});
