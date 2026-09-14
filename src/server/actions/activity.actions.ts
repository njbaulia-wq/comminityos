'use server';

import {
  CreateActivityInput,
  UpdateActivityInput,
  ActivityStatus,
} from '@/lib/validation/activity.schema';
import {
  ActionResult,
  successResult,
  handleServiceError,
} from '@/lib/errors/result';
import {
  createActivity,
  updateActivity,
  changeActivityStatus,
  ActivityRepository,
  CallerContext,
} from '@/server/services/activity.service';
import { createSupabaseActivityRepo } from '@/server/repositories/supabase-activity.repo';
import { resolveCallerContext } from './context-helper';
import { validateUuidParams } from '@/lib/validation/common.schema';

export interface ActivityActionContext extends Partial<CallerContext> {
  requestId?: string;
  repo?: ActivityRepository;
}

const fallbackRepo: ActivityRepository = {
  findById: async () => null,
  list: async () => [],
  create: async (d) => ({ id: 'act-' + Date.now(), ...d }),
  update: async (_orgId, id, d) => ({ id, ...d }),
  softDelete: async () => true,
  addMember: async (actId, memId) => ({ actId, memId }),
  removeMember: async () => {},
  listMembers: async () => [],
};

function getRepo(explicit?: ActivityRepository): ActivityRepository {
  if (explicit) return explicit;
  try {
    return createSupabaseActivityRepo();
  } catch {
    return fallbackRepo;
  }
}

export async function createActivityAction(
  rawInput: CreateActivityInput,
  context?: ActivityActionContext
): Promise<ActionResult<any>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const caller = await resolveCallerContext(rawInput.organizationId, context);
    const repo = getRepo(context?.repo);

    const activity = await createActivity({
      input: rawInput,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult(activity);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'activity',
      action: 'action.create_activity',
      requestId,
      organizationId: rawInput.organizationId,
      userId: context?.userId,
    });
  }
}

export async function updateActivityAction(
  params: {
    organizationId: string;
    activityId: string;
    input: UpdateActivityInput;
  },
  context?: ActivityActionContext
): Promise<ActionResult<any>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    validateUuidParams({
      organizationId: params.organizationId,
      activityId: params.activityId,
    });

    const caller = await resolveCallerContext(params.organizationId, context);
    const repo = getRepo(context?.repo);

    const updated = await updateActivity({
      organizationId: params.organizationId,
      activityId: params.activityId,
      input: params.input,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult(updated);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'activity',
      action: 'action.update_activity',
      requestId,
      organizationId: params.organizationId,
      userId: context?.userId,
    });
  }
}

export async function changeActivityStatusAction(
  params: {
    organizationId: string;
    activityId: string;
    newStatus: ActivityStatus;
  },
  context?: ActivityActionContext
): Promise<ActionResult<any>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    validateUuidParams({
      organizationId: params.organizationId,
      activityId: params.activityId,
    });

    const caller = await resolveCallerContext(params.organizationId, context);
    const repo = getRepo(context?.repo);

    const updated = await changeActivityStatus({
      organizationId: params.organizationId,
      activityId: params.activityId,
      newStatus: params.newStatus,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult(updated);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'activity',
      action: 'action.change_activity_status',
      requestId,
      organizationId: params.organizationId,
      userId: context?.userId,
    });
  }
}
