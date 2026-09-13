import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createActivityAction,
  changeActivityStatusAction,
} from '@/server/actions/activity.actions';
import {
  createTaskAction,
  updateTaskStatusAction,
  toggleChecklistItemAction,
} from '@/server/actions/task.actions';
import { ActivityRepository } from '@/server/services/activity.service';
import { TaskRepository } from '@/server/services/task.service';

describe('Activities & Tasks Server Actions', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const memberId = '22222222-2222-4222-8222-222222222222';
  const adminContext = {
    userId: 'admin-user-id',
    roleName: 'Admin',
    requestId: 'req-test-act-task',
  };
  const viewerContext = {
    userId: 'viewer-user-id',
    roleName: 'Viewer',
    requestId: 'req-test-act-task',
  };

  let mockActivityRepo: ActivityRepository;
  let mockTaskRepo: TaskRepository;
  let activitiesDb: any[];
  let tasksDb: any[];
  let checklistsDb: any[];

  beforeEach(() => {
    vi.clearAllMocks();
    activitiesDb = [];
    tasksDb = [];
    checklistsDb = [];

    mockActivityRepo = {
      findById: vi.fn(async (orgId, id) => activitiesDb.find((a) => a.id === id) || null),
      list: vi.fn(async () => activitiesDb),
      create: vi.fn(async (data) => {
        const item = { id: 'act-1', ...data };
        activitiesDb.push(item);
        return item;
      }),
      update: vi.fn(async (orgId, id, data) => {
        const item = activitiesDb.find((a) => a.id === id);
        if (!item) return null;
        Object.assign(item, data);
        return item;
      }),
      softDelete: vi.fn(async () => true),
      addMember: vi.fn(async (actId, memId) => ({ actId, memId })),
      removeMember: vi.fn(async () => {}),
      listMembers: vi.fn(async () => []),
    };

    mockTaskRepo = {
      findTaskById: vi.fn(async (orgId, id) => tasksDb.find((t) => t.id === id) || null),
      listTasks: vi.fn(async () => tasksDb),
      createTask: vi.fn(async (data) => {
        const item = { id: 'task-1', ...data };
        tasksDb.push(item);
        return item;
      }),
      updateTask: vi.fn(async (orgId, id, data) => {
        const item = tasksDb.find((t) => t.id === id);
        if (!item) return null;
        Object.assign(item, data);
        return item;
      }),
      softDeleteTask: vi.fn(async () => true),
      findMember: vi.fn(async (orgId, memId) => (memId === memberId ? { id: memId } : null)),
      addChecklist: vi.fn(async (taskId, title) => {
        const item = { id: 'chk-1', taskId, title, isDone: false };
        checklistsDb.push(item);
        return item;
      }),
      updateChecklist: vi.fn(async (id, data) => {
        const item = checklistsDb.find((c) => c.id === id);
        if (!item) return null;
        Object.assign(item, data);
        return item;
      }),
      listChecklists: vi.fn(async (taskId) => checklistsDb.filter((c) => c.taskId === taskId)),
    };
  });

  describe('createActivityAction', () => {
    it('should return success envelope when payload is valid', async () => {
      const result = await createActivityAction(
        {
          organizationId: orgId,
          title: 'Kerja Bakti Warga',
          budgetEstimate: 500000,
        },
        { ...adminContext, repo: mockActivityRepo }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('act-1');
        expect(result.data.title).toBe('Kerja Bakti Warga');
      }
    });

    it('should return validation error envelope on invalid title', async () => {
      const result = await createActivityAction(
        {
          organizationId: orgId,
          title: 'K', // too short
        },
        { ...adminContext, repo: mockActivityRepo }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return forbidden error envelope if caller lacks permission', async () => {
      const result = await createActivityAction(
        {
          organizationId: orgId,
          title: 'Kerja Bakti Warga',
        },
        { ...viewerContext, repo: mockActivityRepo }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('changeActivityStatusAction', () => {
    it('should update status and return success envelope', async () => {
      activitiesDb.push({ id: 'act-1', organizationId: orgId, status: 'draft' });

      const result = await changeActivityStatusAction(
        {
          organizationId: orgId,
          activityId: 'act-1',
          newStatus: 'planned',
        },
        { ...adminContext, repo: mockActivityRepo }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('planned');
      }
    });
  });

  describe('createTaskAction', () => {
    it('should return success envelope when task is created', async () => {
      const result = await createTaskAction(
        {
          organizationId: orgId,
          title: 'Beli Cat Pagar',
          assigneeId: memberId,
        },
        { ...adminContext, repo: mockTaskRepo }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('task-1');
        expect(result.data.title).toBe('Beli Cat Pagar');
      }
    });

    it('should return business rule violation envelope if assignee is not found', async () => {
      const result = await createTaskAction(
        {
          organizationId: orgId,
          title: 'Beli Cat Pagar',
          assigneeId: '99999999-9999-4999-8999-999999999999',
        },
        { ...adminContext, repo: mockTaskRepo }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('BUSINESS_RULE_VIOLATION');
      }
    });
  });

  describe('updateTaskStatusAction', () => {
    it('should update task status to done and return success envelope', async () => {
      tasksDb.push({ id: 'task-1', organizationId: orgId, status: 'in_progress' });

      const result = await updateTaskStatusAction(
        {
          organizationId: orgId,
          taskId: 'task-1',
          status: 'done',
        },
        { ...adminContext, repo: mockTaskRepo }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('done');
      }
    });
  });

  describe('toggleChecklistItemAction', () => {
    it('should toggle checklist and report status', async () => {
      tasksDb.push({ id: 'task-1', organizationId: orgId });
      checklistsDb.push({ id: 'chk-1', taskId: 'task-1', isDone: false });

      const result = await toggleChecklistItemAction(
        {
          organizationId: orgId,
          taskId: 'task-1',
          checklistItemId: 'chk-1',
          isDone: true,
        },
        { ...adminContext, repo: mockTaskRepo }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allChecklistsDone).toBe(true);
      }
    });
  });
});
