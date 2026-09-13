import {
  CreateActivityInput,
  CreateActivitySchema,
  UpdateActivityInput,
  UpdateActivitySchema,
  ActivityStatus,
} from '@/lib/validation/activity.schema';
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

export interface ActivityRepository {
  findById(organizationId: string, activityId: string): Promise<any | null>;
  list(organizationId: string, filters?: any): Promise<any[]>;
  create(data: any): Promise<any>;
  update(
    organizationId: string,
    activityId: string,
    data: Record<string, any>
  ): Promise<any>;
  softDelete(
    organizationId: string,
    activityId: string,
    actorUserId: string
  ): Promise<boolean>;
  addMember(
    activityId: string,
    memberId: string,
    roleInActivity?: string | null
  ): Promise<any>;
  removeMember(activityId: string, memberId: string): Promise<void>;
  listMembers(activityId: string): Promise<any[]>;
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

export async function createActivity(params: {
  input: CreateActivityInput;
  caller: CallerContext;
  repo: ActivityRepository;
  requestId?: string;
}): Promise<any> {
  const { input, caller, repo, requestId } = params;

  // 1. Authorize
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'activities.manage',
    organizationId: input.organizationId,
    requestId,
  });

  // 2. Validate input
  const parsed = CreateActivitySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      'Input data kegiatan tidak valid',
      parseValidationErrors(parsed.error)
    );
  }

  const valid = parsed.data;

  // 3. Create activity
  const activity = await repo.create({
    organizationId: valid.organizationId,
    title: valid.title,
    description: valid.description,
    startDate: valid.startDate,
    endDate: valid.endDate,
    status: valid.status,
    budgetEstimate: valid.budgetEstimate,
    picMemberId: valid.picMemberId,
  });

  // 4. Structured log
  logger.info({
    module: 'activity',
    action: 'activity.created',
    requestId,
    organizationId: valid.organizationId,
    userId: caller.userId,
    message: 'Kegiatan baru berhasil dibuat',
    context: {
      activityId: activity.id,
      title: activity.title,
    },
  });

  return activity;
}

export async function updateActivity(params: {
  organizationId: string;
  activityId: string;
  input: UpdateActivityInput;
  caller: CallerContext;
  repo: ActivityRepository;
  requestId?: string;
}): Promise<any> {
  const { organizationId, activityId, input, caller, repo, requestId } = params;

  // 1. Authorize
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'activities.manage',
    organizationId,
    requestId,
  });

  // 2. Validate
  const parsed = UpdateActivitySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      'Input pembaruan kegiatan tidak valid',
      parseValidationErrors(parsed.error)
    );
  }

  // 3. Find existing
  const existing = await repo.findById(organizationId, activityId);
  if (!existing) {
    throw new NotFoundError(`Kegiatan dengan ID "${activityId}" tidak ditemukan`);
  }

  // 4. Business rule: Completed/cancelled activities cannot have details/budget updated
  if (existing.status === 'completed' || existing.status === 'cancelled') {
    throw new BusinessRuleError(
      'Kegiatan yang telah selesai atau dibatalkan tidak dapat diubah lagi.'
    );
  }

  // 5. Update
  const updated = await repo.update(organizationId, activityId, parsed.data);

  // 6. Log
  logger.info({
    module: 'activity',
    action: 'activity.updated',
    requestId,
    organizationId,
    userId: caller.userId,
    message: 'Data kegiatan berhasil diperbarui',
    context: {
      activityId,
    },
  });

  return updated;
}

export async function changeActivityStatus(params: {
  organizationId: string;
  activityId: string;
  newStatus: ActivityStatus;
  caller: CallerContext;
  repo: ActivityRepository;
  requestId?: string;
}): Promise<any> {
  const { organizationId, activityId, newStatus, caller, repo, requestId } = params;

  // 1. Authorize
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'activities.manage',
    organizationId,
    requestId,
  });

  // 2. Find existing
  const existing = await repo.findById(organizationId, activityId);
  if (!existing) {
    throw new NotFoundError(`Kegiatan dengan ID "${activityId}" tidak ditemukan`);
  }

  const oldStatus = existing.status;

  // 3. Update status
  const updated = await repo.update(organizationId, activityId, {
    status: newStatus,
  });

  // 4. Structured log
  logger.info({
    module: 'activity',
    action: 'activity.status_changed',
    requestId,
    organizationId,
    userId: caller.userId,
    message: `Status kegiatan diubah dari "${oldStatus}" menjadi "${newStatus}"`,
    context: {
      activityId,
      oldStatus,
      newStatus,
    },
  });

  return updated;
}

export async function assignActivityMember(params: {
  organizationId: string;
  activityId: string;
  memberId: string;
  roleInActivity?: string;
  caller: CallerContext;
  repo: ActivityRepository;
  requestId?: string;
}): Promise<any> {
  const { organizationId, activityId, memberId, roleInActivity, caller, repo, requestId } =
    params;

  // 1. Authorize
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'activities.manage',
    organizationId,
    requestId,
  });

  // 2. Find existing activity
  const existing = await repo.findById(organizationId, activityId);
  if (!existing) {
    throw new NotFoundError(`Kegiatan dengan ID "${activityId}" tidak ditemukan`);
  }

  // 3. Assign member
  const assignment = await repo.addMember(activityId, memberId, roleInActivity);

  // 4. Log
  logger.info({
    module: 'activity',
    action: 'activity.member_assigned',
    requestId,
    organizationId,
    userId: caller.userId,
    message: 'Anggota panitia kegiatan berhasil ditugaskan',
    context: {
      activityId,
      memberId,
      roleInActivity,
    },
  });

  return assignment;
}

export async function getActivity(params: {
  organizationId: string;
  activityId: string;
  caller: CallerContext;
  repo: ActivityRepository;
}): Promise<any> {
  const { organizationId, activityId, caller, repo } = params;

  // Read permission
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'activities.manage', // or read
    organizationId,
  });

  const activity = await repo.findById(organizationId, activityId);
  if (!activity) {
    throw new NotFoundError(`Kegiatan dengan ID "${activityId}" tidak ditemukan`);
  }

  return activity;
}

export async function listActivities(params: {
  organizationId: string;
  caller: CallerContext;
  repo: ActivityRepository;
  filters?: any;
}): Promise<any[]> {
  const { organizationId, repo } = params;
  return repo.list(organizationId, params.filters);
}
