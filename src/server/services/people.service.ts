import {
  CreateMemberInput,
  CreateMemberSchema,
  UpdateMemberInput,
  UpdateMemberSchema,
  CreateTeamInput,
  CreateTeamSchema,
} from '@/lib/validation/people.schema';
import {
  ForbiddenError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/lib/errors';
import { logger } from '@/lib/logger';
import { assertPermission } from '@/server/services/permission.service';

export interface CallerContext {
  userId: string;
  roleName: string;
}

export interface PeopleRepository {
  findMemberById(organizationId: string, memberId: string): Promise<any | null>;
  findMemberByPhone(organizationId: string, phone: string): Promise<any | null>;
  listMembers(
    organizationId: string,
    filters?: { search?: string; status?: string; teamId?: string }
  ): Promise<any[]>;
  createMemberWithProfile(data: {
    organizationId: string;
    roleId: string;
    fullName: string;
    phone?: string | null;
    address?: string | null;
    houseNumber?: string | null;
    rtNumber?: string | null;
    rwNumber?: string | null;
    residentStatus?: string;
    userId?: string | null;
  }): Promise<any>;
  updateMemberProfile(
    organizationId: string,
    memberId: string,
    data: Record<string, any>
  ): Promise<any>;
  softDeleteMember(
    organizationId: string,
    memberId: string,
    actorUserId: string
  ): Promise<boolean>;

  findTeamById(organizationId: string, teamId: string): Promise<any | null>;
  findTeamByName(organizationId: string, name: string): Promise<any | null>;
  listTeams(organizationId: string): Promise<any[]>;
  createTeam(data: {
    organizationId: string;
    name: string;
    description?: string | null;
  }): Promise<any>;
  assignMemberToTeam(teamId: string, memberId: string): Promise<any>;
  removeMemberFromTeam(teamId: string, memberId: string): Promise<void>;
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

export async function createMember(params: {
  input: CreateMemberInput;
  caller: CallerContext;
  repo: PeopleRepository;
  requestId?: string;
}): Promise<any> {
  const { input, caller, repo, requestId } = params;

  // 1. Authorize: must have members.manage
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'members.manage',
    organizationId: input.organizationId,
    requestId,
  });

  // 2. Validate input boundary
  const parsed = CreateMemberSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      'Input data anggota tidak valid',
      parseValidationErrors(parsed.error)
    );
  }

  const valid = parsed.data;

  // 3. Check duplicate phone within the organization
  if (valid.phone) {
    const existing = await repo.findMemberByPhone(valid.organizationId, valid.phone);
    if (existing) {
      throw new ConflictError(
        'Nomor telepon sudah terdaftar pada anggota lain dalam organisasi ini'
      );
    }
  }

  // 4. Create member with profile
  const member = await repo.createMemberWithProfile({
    organizationId: valid.organizationId,
    roleId: valid.roleId,
    fullName: valid.fullName,
    phone: valid.phone,
    address: valid.address,
    houseNumber: valid.houseNumber,
    rtNumber: valid.rtNumber,
    rwNumber: valid.rwNumber,
    residentStatus: valid.residentStatus,
  });

  // 5. Emit structured log
  logger.info({
    module: 'people',
    action: 'people.member_created',
    requestId,
    organizationId: valid.organizationId,
    userId: caller.userId,
    message: 'Anggota baru berhasil ditambahkan',
    context: {
      targetMemberId: member.id,
      fullName: member.fullName,
    },
  });

  return member;
}

export async function updateMember(params: {
  organizationId: string;
  memberId: string;
  input: UpdateMemberInput;
  caller: CallerContext;
  repo: PeopleRepository;
  requestId?: string;
}): Promise<any> {
  const { organizationId, memberId, input, caller, repo, requestId } = params;

  // 1. Authorize
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'members.manage',
    organizationId,
    requestId,
  });

  // 2. Validate input
  const parsed = UpdateMemberSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      'Input pembaruan data anggota tidak valid',
      parseValidationErrors(parsed.error)
    );
  }

  // 3. Verify member exists
  const existing = await repo.findMemberById(organizationId, memberId);
  if (!existing) {
    throw new NotFoundError(`Anggota dengan ID "${memberId}" tidak ditemukan`);
  }

  // 4. Check duplicate phone if being updated
  if (parsed.data.phone && parsed.data.phone !== existing.phone) {
    const phoneConflict = await repo.findMemberByPhone(
      organizationId,
      parsed.data.phone
    );
    if (phoneConflict && phoneConflict.id !== memberId) {
      throw new ConflictError(
        'Nomor telepon sudah terdaftar pada anggota lain dalam organisasi ini'
      );
    }
  }

  // 5. Update
  const updated = await repo.updateMemberProfile(
    organizationId,
    memberId,
    parsed.data
  );

  // 6. Log
  logger.info({
    module: 'people',
    action: 'people.member_updated',
    requestId,
    organizationId,
    userId: caller.userId,
    message: 'Data anggota berhasil diperbarui',
    context: {
      targetMemberId: memberId,
    },
  });

  return updated;
}

export async function archiveMember(params: {
  organizationId: string;
  memberId: string;
  caller: CallerContext;
  repo: PeopleRepository;
  requestId?: string;
}): Promise<{ success: boolean }> {
  const { organizationId, memberId, caller, repo, requestId } = params;

  // 1. Authorize
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'members.manage',
    organizationId,
    requestId,
  });

  // 2. Verify exists
  const existing = await repo.findMemberById(organizationId, memberId);
  if (!existing) {
    throw new NotFoundError(`Anggota dengan ID "${memberId}" tidak ditemukan`);
  }

  // 3. Soft delete
  await repo.softDeleteMember(organizationId, memberId, caller.userId);

  // 4. Log
  logger.info({
    module: 'people',
    action: 'people.member_archived',
    requestId,
    organizationId,
    userId: caller.userId,
    message: 'Anggota berhasil diarsipkan (soft-deleted)',
    context: {
      targetMemberId: memberId,
    },
  });

  return { success: true };
}

export async function createTeam(params: {
  input: CreateTeamInput;
  caller: CallerContext;
  repo: PeopleRepository;
  requestId?: string;
}): Promise<any> {
  const { input, caller, repo, requestId } = params;

  // 1. Authorize
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'members.manage',
    organizationId: input.organizationId,
    requestId,
  });

  // 2. Validate
  const parsed = CreateTeamSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      'Input data tim tidak valid',
      parseValidationErrors(parsed.error)
    );
  }

  // 3. Check name conflict
  const existing = await repo.findTeamByName(
    parsed.data.organizationId,
    parsed.data.name
  );
  if (existing) {
    throw new ConflictError(
      `Tim dengan nama "${parsed.data.name}" sudah ada dalam organisasi ini`
    );
  }

  // 4. Create
  const team = await repo.createTeam({
    organizationId: parsed.data.organizationId,
    name: parsed.data.name,
    description: parsed.data.description,
  });

  // 5. Log
  logger.info({
    module: 'people',
    action: 'people.team_created',
    requestId,
    organizationId: parsed.data.organizationId,
    userId: caller.userId,
    message: 'Tim/seksi baru berhasil dibuat',
    context: {
      teamId: team.id,
      name: team.name,
    },
  });

  return team;
}

export async function assignTeamMember(params: {
  organizationId: string;
  teamId: string;
  memberId: string;
  caller: CallerContext;
  repo: PeopleRepository;
  requestId?: string;
}): Promise<any> {
  const { organizationId, teamId, memberId, caller, repo, requestId } = params;

  // 1. Authorize
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'members.manage',
    organizationId,
    requestId,
  });

  // 2. Verify team exists
  const team = await repo.findTeamById(organizationId, teamId);
  if (!team) {
    throw new NotFoundError(`Tim dengan ID "${teamId}" tidak ditemukan`);
  }

  // 3. Verify member exists
  const member = await repo.findMemberById(organizationId, memberId);
  if (!member) {
    throw new NotFoundError(`Anggota dengan ID "${memberId}" tidak ditemukan`);
  }

  // 4. Assign
  const assignment = await repo.assignMemberToTeam(teamId, memberId);

  // 5. Log
  logger.info({
    module: 'people',
    action: 'people.team_member_assigned',
    requestId,
    organizationId,
    userId: caller.userId,
    message: 'Anggota berhasil ditugaskan ke dalam tim/seksi',
    context: {
      teamId,
      memberId,
    },
  });

  return assignment;
}
