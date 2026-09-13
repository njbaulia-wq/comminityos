import {
  CreateMemberInput,
  UpdateMemberInput,
  CreateTeamInput,
} from '@/lib/validation/people.schema';
import {
  ActionResult,
  successResult,
  handleServiceError,
} from '@/lib/errors/result';
import {
  createMember,
  updateMember,
  archiveMember,
  createTeam,
  assignTeamMember,
  PeopleRepository,
  CallerContext,
} from '@/server/services/people.service';

import { validateUuidParams } from '@/lib/validation/common.schema';

export interface PeopleActionContext extends CallerContext {
  requestId?: string;
  repo?: PeopleRepository;
}

const fallbackRepo: PeopleRepository = {
  findMemberById: async () => null,
  findMemberByPhone: async () => null,
  listMembers: async () => [],
  createMemberWithProfile: async (d) => ({ id: 'mem-' + Date.now(), ...d }),
  updateMemberProfile: async (_orgId, _id, d) => ({ id: _id, ...d }),
  softDeleteMember: async () => true,
  findTeamById: async () => null,
  findTeamByName: async () => null,
  listTeams: async () => [],
  createTeam: async (d) => ({ id: 'team-' + Date.now(), ...d }),
  assignMemberToTeam: async (teamId, memberId) => ({ teamId, memberId }),
  removeMemberFromTeam: async () => {},
};

export async function createMemberAction(
  rawInput: CreateMemberInput,
  context: PeopleActionContext
): Promise<ActionResult<any>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const member = await createMember({
      input: rawInput,
      caller: {
        userId: context.userId,
        roleName: context.roleName,
      },
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult(member);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'people',
      action: 'action.create_member',
      requestId,
      organizationId: rawInput.organizationId,
      userId: context.userId,
    });
  }
}

export async function updateMemberAction(
  params: {
    organizationId: string;
    memberId: string;
    input: UpdateMemberInput;
  },
  context: PeopleActionContext
): Promise<ActionResult<any>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    validateUuidParams({
      organizationId: params.organizationId,
      memberId: params.memberId,
    });

    const updated = await updateMember({
      organizationId: params.organizationId,
      memberId: params.memberId,
      input: params.input,
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
      module: 'people',
      action: 'action.update_member',
      requestId,
      organizationId: params.organizationId,
      userId: context.userId,
    });
  }
}

export async function archiveMemberAction(
  params: {
    organizationId: string;
    memberId: string;
  },
  context: PeopleActionContext
): Promise<ActionResult<{ success: boolean }>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    validateUuidParams({
      organizationId: params.organizationId,
      memberId: params.memberId,
    });

    const result = await archiveMember({
      organizationId: params.organizationId,
      memberId: params.memberId,
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
      module: 'people',
      action: 'action.archive_member',
      requestId,
      organizationId: params.organizationId,
      userId: context.userId,
    });
  }
}

export async function createTeamAction(
  rawInput: CreateTeamInput,
  context: PeopleActionContext
): Promise<ActionResult<any>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const team = await createTeam({
      input: rawInput,
      caller: {
        userId: context.userId,
        roleName: context.roleName,
      },
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult(team);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'people',
      action: 'action.create_team',
      requestId,
      organizationId: rawInput.organizationId,
      userId: context.userId,
    });
  }
}

export async function assignTeamMemberAction(
  params: {
    organizationId: string;
    teamId: string;
    memberId: string;
  },
  context: PeopleActionContext
): Promise<ActionResult<any>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    validateUuidParams({
      organizationId: params.organizationId,
      teamId: params.teamId,
      memberId: params.memberId,
    });

    const assignment = await assignTeamMember({
      organizationId: params.organizationId,
      teamId: params.teamId,
      memberId: params.memberId,
      caller: {
        userId: context.userId,
        roleName: context.roleName,
      },
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult(assignment);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'people',
      action: 'action.assign_team_member',
      requestId,
      organizationId: params.organizationId,
      userId: context.userId,
    });
  }
}
