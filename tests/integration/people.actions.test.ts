import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMemberAction,
  updateMemberAction,
  archiveMemberAction,
  createTeamAction,
  assignTeamMemberAction,
} from '@/server/actions/people.actions';
import { PeopleRepository } from '@/server/services/people.service';

describe('People Server Actions', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const roleId = '22222222-2222-4222-8222-222222222222';
  const adminContext = {
    userId: 'admin-user-id',
    roleName: 'Admin',
    requestId: 'req-action-test',
  };
  const viewerContext = {
    userId: 'viewer-user-id',
    roleName: 'Viewer',
    requestId: 'req-action-test',
  };

  let mockRepo: PeopleRepository;
  let membersDb: any[];
  let teamsDb: any[];

  beforeEach(() => {
    vi.clearAllMocks();
    membersDb = [];
    teamsDb = [];

    mockRepo = {
      findMemberById: vi.fn(async (organizationId: string, memberId: string) => {
        return membersDb.find((m) => m.organizationId === organizationId && m.id === memberId && !m.deletedAt) || null;
      }),
      findMemberByPhone: vi.fn(async (organizationId: string, phone: string) => {
        return membersDb.find((m) => m.organizationId === organizationId && m.phone === phone && !m.deletedAt) || null;
      }),
      listMembers: vi.fn(async (organizationId: string) => membersDb),
      createMemberWithProfile: vi.fn(async (data: any) => {
        const record = { id: 'mem-101', ...data, createdAt: new Date().toISOString() };
        membersDb.push(record);
        return record;
      }),
      updateMemberProfile: vi.fn(async (orgId: string, memberId: string, data: any) => {
        const mem = membersDb.find((m) => m.id === memberId);
        if (!mem) return null;
        Object.assign(mem, data);
        return mem;
      }),
      softDeleteMember: vi.fn(async (orgId: string, memberId: string) => true),
      findTeamById: vi.fn(async (orgId: string, teamId: string) => {
        return teamsDb.find((t) => t.id === teamId) || null;
      }),
      findTeamByName: vi.fn(async (orgId: string, name: string) => {
        return teamsDb.find((t) => t.name.toLowerCase() === name.toLowerCase()) || null;
      }),
      listTeams: vi.fn(async () => teamsDb),
      createTeam: vi.fn(async (data: any) => {
        const team = { id: 'team-101', ...data };
        teamsDb.push(team);
        return team;
      }),
      assignMemberToTeam: vi.fn(async (teamId: string, memberId: string) => ({ teamId, memberId })),
      removeMemberFromTeam: vi.fn(async () => {}),
    };
  });

  describe('createMemberAction', () => {
    it('should return success envelope with created member on valid payload', async () => {
      const result = await createMemberAction(
        {
          organizationId: orgId,
          roleId: roleId,
          fullName: 'Budi Darmawan',
          phone: '081234567890',
        },
        { ...adminContext, repo: mockRepo }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('mem-101');
        expect(result.data.fullName).toBe('Budi Darmawan');
      }
    });

    it('should return validation error envelope on invalid payload', async () => {
      const result = await createMemberAction(
        {
          organizationId: orgId,
          roleId: roleId,
          fullName: 'B', // too short
        },
        { ...adminContext, repo: mockRepo }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.fieldErrors).toHaveProperty('fullName');
      }
    });

    it('should return forbidden error envelope when caller lacks permission', async () => {
      const result = await createMemberAction(
        {
          organizationId: orgId,
          roleId: roleId,
          fullName: 'Budi Darmawan',
        },
        { ...viewerContext, repo: mockRepo }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('updateMemberAction', () => {
    it('should return success envelope when member updated successfully', async () => {
      // Pre-create member
      membersDb.push({ id: 'mem-101', organizationId: orgId, fullName: 'Old Name' });

      const result = await updateMemberAction(
        {
          organizationId: orgId,
          memberId: 'mem-101',
          input: { fullName: 'Updated Name' },
        },
        { ...adminContext, repo: mockRepo }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe('Updated Name');
      }
    });

    it('should return not found envelope if member does not exist', async () => {
      const result = await updateMemberAction(
        {
          organizationId: orgId,
          memberId: 'non-existent',
          input: { fullName: 'Updated Name' },
        },
        { ...adminContext, repo: mockRepo }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('archiveMemberAction', () => {
    it('should return success envelope when member is archived', async () => {
      membersDb.push({ id: 'mem-101', organizationId: orgId, fullName: 'To Archive' });

      const result = await archiveMemberAction(
        {
          organizationId: orgId,
          memberId: 'mem-101',
        },
        { ...adminContext, repo: mockRepo }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
      }
    });
  });

  describe('createTeamAction & assignTeamMemberAction', () => {
    it('should create team and return success envelope', async () => {
      const result = await createTeamAction(
        {
          organizationId: orgId,
          name: 'Tim Ronda',
          description: 'Keamanan RT',
        },
        { ...adminContext, repo: mockRepo }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Tim Ronda');
      }
    });

    it('should assign member to team and return success envelope', async () => {
      teamsDb.push({ id: 'team-101', organizationId: orgId, name: 'Tim Ronda' });
      membersDb.push({ id: 'mem-101', organizationId: orgId, fullName: 'Anggota Ronda' });

      const result = await assignTeamMemberAction(
        {
          organizationId: orgId,
          teamId: 'team-101',
          memberId: 'mem-101',
        },
        { ...adminContext, repo: mockRepo }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.teamId).toBe('team-101');
        expect(result.data.memberId).toBe('mem-101');
      }
    });
  });
});
