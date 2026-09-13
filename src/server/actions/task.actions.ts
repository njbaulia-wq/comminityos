import {
  CreateTaskInput,
  TaskStatus,
} from '@/lib/validation/task.schema';
import {
  ActionResult,
  successResult,
  handleServiceError,
} from '@/lib/errors/result';
import {
  createTask,
  updateTaskStatus,
  toggleChecklistItem,
  TaskRepository,
  CallerContext,
} from '@/server/services/task.service';
import { validateUuidParams } from '@/lib/validation/common.schema';

export interface TaskActionContext extends CallerContext {
  requestId?: string;
  repo?: TaskRepository;
}

const fallbackRepo: TaskRepository = {
  findTaskById: async () => null,
  listTasks: async () => [],
  createTask: async (d) => ({ id: 'task-' + Date.now(), ...d }),
  updateTask: async (_orgId, id, d) => ({ id, ...d }),
  softDeleteTask: async () => true,
  findMember: async () => null,
  addChecklist: async (taskId, title) => ({ id: 'chk-' + Date.now(), taskId, title, isDone: false }),
  updateChecklist: async (id, d) => ({ id, ...d }),
  listChecklists: async () => [],
};

export async function createTaskAction(
  rawInput: CreateTaskInput,
  context: TaskActionContext
): Promise<ActionResult<any>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const task = await createTask({
      input: rawInput,
      caller: {
        userId: context.userId,
        roleName: context.roleName,
      },
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult(task);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'task',
      action: 'action.create_task',
      requestId,
      organizationId: rawInput.organizationId,
      userId: context.userId,
    });
  }
}

export async function updateTaskStatusAction(
  params: {
    organizationId: string;
    taskId: string;
    status: TaskStatus;
  },
  context: TaskActionContext
): Promise<ActionResult<any>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    validateUuidParams({
      organizationId: params.organizationId,
      taskId: params.taskId,
    });

    const updated = await updateTaskStatus({
      organizationId: params.organizationId,
      taskId: params.taskId,
      status: params.status,
      caller: {
        userId: context.userId,
        roleName: context.roleName,
      },
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult(updated);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'task',
      action: 'action.update_task_status',
      requestId,
      organizationId: params.organizationId,
      userId: context.userId,
    });
  }
}

export async function toggleChecklistItemAction(
  params: {
    organizationId: string;
    taskId: string;
    checklistItemId: string;
    isDone: boolean;
  },
  context: TaskActionContext
): Promise<ActionResult<any>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    validateUuidParams({
      organizationId: params.organizationId,
      taskId: params.taskId,
      checklistItemId: params.checklistItemId,
    });

    const result = await toggleChecklistItem({
      organizationId: params.organizationId,
      taskId: params.taskId,
      checklistItemId: params.checklistItemId,
      isDone: params.isDone,
      caller: {
        userId: context.userId,
        roleName: context.roleName,
      },
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult(result);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'task',
      action: 'action.toggle_checklist_item',
      requestId,
      organizationId: params.organizationId,
      userId: context.userId,
    });
  }
}
