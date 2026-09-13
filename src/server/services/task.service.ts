import {
  CreateTaskInput,
  CreateTaskSchema,
  UpdateTaskInput,
  UpdateTaskSchema,
  TaskStatus,
} from '@/lib/validation/task.schema';
import {
  ForbiddenError,
  NotFoundError,
  BusinessRuleError,
  ValidationError,
} from '@/lib/errors';
import { logger } from '@/lib/logger';
import { assertPermission } from '@/server/services/permission.service';

export interface CallerContext {
  userId: string;
  roleName: string;
}

export interface TaskRepository {
  findTaskById(organizationId: string, taskId: string): Promise<any | null>;
  listTasks(organizationId: string, filters?: any): Promise<any[]>;
  createTask(data: any): Promise<any>;
  updateTask(
    organizationId: string,
    taskId: string,
    data: Record<string, any>
  ): Promise<any>;
  softDeleteTask(
    organizationId: string,
    taskId: string,
    actorUserId: string
  ): Promise<boolean>;
  findMember(organizationId: string, memberId: string): Promise<any | null>;
  addChecklist(taskId: string, title: string): Promise<any>;
  updateChecklist(
    checklistItemId: string,
    data: Record<string, any>
  ): Promise<any>;
  listChecklists(taskId: string): Promise<any[]>;
}

function parseValidationErrors(error: any): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'root';
    if (!fieldErrors[field]) fieldErrors[field] = [];
    fieldErrors[field].push(issue.message);
  }
  return fieldErrors;
}

export async function createTask(params: {
  input: CreateTaskInput;
  caller: CallerContext;
  repo: TaskRepository;
  requestId?: string;
}): Promise<any> {
  const { input, caller, repo, requestId } = params;

  // 1. Authorize
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'tasks.manage',
    organizationId: input.organizationId,
    requestId,
  });

  // 2. Validate input
  const parsed = CreateTaskSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      'Input data tugas tidak valid',
      parseValidationErrors(parsed.error)
    );
  }

  const valid = parsed.data;

  // 3. If assignee specified, verify active member of the org
  if (valid.assigneeId) {
    const member = await repo.findMember(valid.organizationId, valid.assigneeId);
    if (!member) {
      throw new BusinessRuleError(
        'Penugasan gagal: Anggota yang ditugaskan tidak terdaftar dalam organisasi'
      );
    }
  }

  // 4. Create task
  const task = await repo.createTask({
    organizationId: valid.organizationId,
    activityId: valid.activityId,
    assigneeId: valid.assigneeId,
    title: valid.title,
    description: valid.description,
    status: valid.status,
    priority: valid.priority,
    dueDate: valid.dueDate,
  });

  // 5. Structured log
  logger.info({
    module: 'task',
    action: 'task.created',
    requestId,
    organizationId: valid.organizationId,
    userId: caller.userId,
    message: 'Tugas baru berhasil dibuat',
    context: {
      taskId: task.id,
      title: task.title,
    },
  });

  if (valid.assigneeId) {
    logger.info({
      module: 'task',
      action: 'task.assigned',
      requestId,
      organizationId: valid.organizationId,
      userId: caller.userId,
      message: 'Tugas berhasil ditugaskan ke anggota',
      context: {
        taskId: task.id,
        assigneeId: valid.assigneeId,
      },
    });
  }

  return task;
}

export async function updateTask(params: {
  organizationId: string;
  taskId: string;
  input: UpdateTaskInput;
  caller: CallerContext;
  repo: TaskRepository;
  requestId?: string;
}): Promise<any> {
  const { organizationId, taskId, input, caller, repo, requestId } = params;

  // 1. Authorize
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'tasks.manage',
    organizationId,
    requestId,
  });

  // 2. Validate
  const parsed = UpdateTaskSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      'Input pembaruan tugas tidak valid',
      parseValidationErrors(parsed.error)
    );
  }

  // 3. Verify exists
  const existing = await repo.findTaskById(organizationId, taskId);
  if (!existing) {
    throw new NotFoundError(`Tugas dengan ID "${taskId}" tidak ditemukan`);
  }

  // 4. If assignee updated, verify
  if (parsed.data.assigneeId && parsed.data.assigneeId !== existing.assigneeId) {
    const member = await repo.findMember(organizationId, parsed.data.assigneeId);
    if (!member) {
      throw new BusinessRuleError(
        'Penugasan gagal: Anggota yang ditugaskan tidak terdaftar dalam organisasi'
      );
    }
  }

  // 5. Update
  const updated = await repo.updateTask(organizationId, taskId, parsed.data);

  // 6. Log
  logger.info({
    module: 'task',
    action: 'task.updated',
    requestId,
    organizationId,
    userId: caller.userId,
    message: 'Data tugas berhasil diperbarui',
    context: { taskId },
  });

  return updated;
}

export async function updateTaskStatus(params: {
  organizationId: string;
  taskId: string;
  status: TaskStatus;
  caller: CallerContext;
  repo: TaskRepository;
  requestId?: string;
}): Promise<any> {
  const { organizationId, taskId, status, caller, repo, requestId } = params;

  // 1. Authorize
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'tasks.manage',
    organizationId,
    requestId,
  });

  // 2. Verify exists
  const existing = await repo.findTaskById(organizationId, taskId);
  if (!existing) {
    throw new NotFoundError(`Tugas dengan ID "${taskId}" tidak ditemukan`);
  }

  const updateData: Record<string, any> = { status };
  if (status === 'done') {
    updateData.completedAt = new Date().toISOString();
  }

  // 3. Update
  const updated = await repo.updateTask(organizationId, taskId, updateData);

  // 4. Log
  if (status === 'done') {
    logger.info({
      module: 'task',
      action: 'task.completed',
      requestId,
      organizationId,
      userId: caller.userId,
      message: 'Tugas telah selesai dikerjakan',
      context: { taskId },
    });
  } else {
    logger.info({
      module: 'task',
      action: 'task.status_changed',
      requestId,
      organizationId,
      userId: caller.userId,
      message: `Status tugas diubah menjadi "${status}"`,
      context: { taskId, status },
    });
  }

  return updated;
}

export async function addChecklistItem(params: {
  organizationId: string;
  taskId: string;
  title: string;
  caller: CallerContext;
  repo: TaskRepository;
  requestId?: string;
}): Promise<any> {
  const { organizationId, taskId, title, caller, repo, requestId } = params;

  // 1. Authorize
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'tasks.manage',
    organizationId,
    requestId,
  });

  // 2. Verify task
  const task = await repo.findTaskById(organizationId, taskId);
  if (!task) {
    throw new NotFoundError(`Tugas dengan ID "${taskId}" tidak ditemukan`);
  }

  // 3. Add checklist
  const item = await repo.addChecklist(taskId, title);

  logger.info({
    module: 'task',
    action: 'task.checklist_added',
    requestId,
    organizationId,
    userId: caller.userId,
    message: 'Item checklist tugas ditambahkan',
    context: { taskId, checklistItemId: item.id },
  });

  return item;
}

export async function toggleChecklistItem(params: {
  organizationId: string;
  taskId: string;
  checklistItemId: string;
  isDone: boolean;
  caller: CallerContext;
  repo: TaskRepository;
  requestId?: string;
}): Promise<{ item: any; allChecklistsDone: boolean }> {
  const { organizationId, taskId, checklistItemId, isDone, caller, repo, requestId } = params;

  // 1. Authorize
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'tasks.manage',
    organizationId,
    requestId,
  });

  // 2. Verify task
  const task = await repo.findTaskById(organizationId, taskId);
  if (!task) {
    throw new NotFoundError(`Tugas dengan ID "${taskId}" tidak ditemukan`);
  }

  // 3. Update checklist
  const updatedItem = await repo.updateChecklist(checklistItemId, { isDone });

  // 4. Check if all items are done
  const allItems = await repo.listChecklists(taskId);
  const allChecklistsDone = allItems.length > 0 && allItems.every((item) => item.isDone);

  logger.info({
    module: 'task',
    action: 'task.checklist_toggled',
    requestId,
    organizationId,
    userId: caller.userId,
    message: `Checklist tugas diubah menjadi ${isDone ? 'selesai' : 'belum selesai'}`,
    context: {
      taskId,
      checklistItemId,
      allChecklistsDone,
    },
  });

  return {
    item: updatedItem,
    allChecklistsDone,
  };
}

export async function listTasks(params: {
  organizationId: string;
  caller: CallerContext;
  repo: TaskRepository;
  filters?: any;
}): Promise<any[]> {
  const { organizationId, repo } = params;
  return repo.listTasks(organizationId, params.filters);
}
