import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMember,
  updateMember,
  archiveMember,
  createTeam,
  assignTeamMember,
  PeopleRepository,
} from '@/server/services/people.service';
import { ForbiddenError, ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

describe('Member & Team Domain Service', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const roleId = '22222222-2222-4222-8222-222222222222';
  const callerAdmin = { userId: 'user-admin', roleName: 'Admin' };
  const callerViewer = { userId: 'user-viewer', roleName: 'Viewer' };

  let mockRepo: PeopleRepository;
  let membersDb: any[];
  let teamsDb: any[];
  let teamMembersDb: any[];

  beforeEach(() => {
    membersDb = [];
    teamsDb = [];
    teamMembersDb = [];

    mockRepo = {
      findMemberById: vi.fn(async (organizationId: string, memberId: string) => {
        return membersDb.find((m) => m.organizationId === organizationId && m.id === memberId && !m.deletedAt) || null;
      }),
      findMemberByPhone: vi.fn(async (organizationId: string, phone: string) => {
        return membersDb.find((m) => m.organizationId === organizationId && m.phone === phone && !m.deletedAt) || null;
      }),
      listMembers: vi.fn(async (organizationId: string) => {
        return membersDb.filter((m) => m.organizationId === organizationId && !m.deletedAt);
      }),
      createMemberWithProfile: vi.fn(async (data: any) => {
        const record = {
          id: 'mem-' + Math.random().toString(36).substring(7),
          ...data,
          createdAt: new Date().toISOString(),
          deletedAt: null,
        };
        membersDb.push(record);
        return record;
      }),
      updateMemberProfile: vi.fn(async (organizationId: string, memberId: string, data: any) => {
        const mem = membersDb.find((m) => m.organizationId === organizationId && m.id === memberId && !m.deletedAt);
        if (!mem) return null;
        Object.assign(mem, data, { updatedAt: new Date().toISOString() });
        return mem;
      }),
      softDeleteMember: vi.fn(async (organizationId: string, memberId: string, actorUserId: string) => {
        const mem = membersDb.find((m) => m.organizationId === organizationId && m.id === memberId && !m.deletedAt);
        if (!mem) return false;
        mem.deletedAt = new Date().toISOString();
        mem.deletedBy = actorUserId;
        return true;
      }),
      findTeamById: vi.fn(async (organizationId: string, teamId: string) => {
        return teamsDb.find((t) => t.organizationId === organizationId && t.id === teamId && !t.deletedAt) || null;
      }),
      findTeamByName: vi.fn(async (organizationId: string, name: string) => {
        return teamsDb.find((t) => t.organizationId === organizationId && t.name.toLowerCase() === name.toLowerCase() && !t.deletedAt) || null;
      }),
      listTeams: vi.fn(async (organizationId: string) => {
        return teamsDb.filter((t) => t.organizationId === organizationId && !t.deletedAt);
      }),
      createTeam: vi.fn(async (data: any) => {
        const team = {
          id: 'team-' + Math.random().toString(36).substring(7),
          ...data,
          createdAt: new Date().toISOString(),
          deletedAt: null,
        };
        teamsDb.push(team);
        return team;
      }),
      assignMemberToTeam: vi.fn(async (teamId: string, memberId: string) => {
        const entry = { teamId, memberId, createdAt: new Date().toISOString() };
        teamMembersDb.push(entry);
        return entry;
      }),
      removeMemberFromTeam: vi.fn(async (teamId: string, memberId: string) => {
        const idx = teamMembersDb.findIndex((tm) => tm.teamId === teamId && tm.memberId === memberId);
        if (idx >= 0) teamMembersDb.splice(idx, 1);
      }),
    };
  });

  describe('createMember', () => {
    it('should successfully create a member when caller has members.manage permission', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const input = {
        organizationId: orgId,
        roleId: roleId,
        fullName: 'Bambang Sudibyo',
        phone: '081234567890',
        houseNumber: '10A',
        rtNumber: '05',
        rwNumber: '02',
        residentStatus: 'tetap' as const,
      };

      const result = await createMember({
        input,
        caller: callerAdmin,
        repo: mockRepo,
        requestId: 'req-add-member',
      });

      expect(result).toBeDefined();
      expect(result.fullName).toBe('Bambang Sudibyo');
      expect(result.organizationId).toBe(orgId);
      expect(mockRepo.createMemberWithProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Bambang Sudibyo',
          phone: '081234567890',
        })
      );

      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'people',
          action: 'people.member_created',
          requestId: 'req-add-member',
          organizationId: orgId,
        })
      );

      infoSpy.mockRestore();
    });

    it('should throw ForbiddenError when caller lacks members.manage permission', async () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

      const input = {
        organizationId: orgId,
        roleId: roleId,
        fullName: 'Agus Santoso',
      };

      await expect(
        createMember({
          input,
          caller: callerViewer,
          repo: mockRepo,
        })
      ).rejects.toThrow(ForbiddenError);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'auth',
          action: 'permission.denied',
        })
      );

      warnSpy.mockRestore();
    });

    it('should throw ConflictError if phone number already exists in organization', async () => {
      const input = {
        organizationId: orgId,
        roleId: roleId,
        fullName: 'Budi Satu',
        phone: '081298765432',
      };

      // Pre-populate with existing member
      await createMember({
        input,
        caller: callerAdmin,
        repo: mockRepo,
      });

      // Attempt to register another person with same phone
      await expect(
        createMember({
          input: {
            ...input,
            fullName: 'Budi Dua',
          },
          caller: callerAdmin,
          repo: mockRepo,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError if input fails schema validation', async () => {
      const invalidInput = {
        organizationId: orgId,
        roleId: roleId,
        fullName: 'B', // too short (< 2 chars)
      };

      await expect(
        createMember({
          input: invalidInput,
          caller: callerAdmin,
          repo: mockRepo,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateMember', () => {
    it('should successfully update member profile', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const member = await createMember({
        input: {
          organizationId: orgId,
          roleId: roleId,
          fullName: 'Joko Anwar',
          houseNumber: '15',
        },
        caller: callerAdmin,
        repo: mockRepo,
      });

      const updated = await updateMember({
        organizationId: orgId,
        memberId: member.id,
        input: {
          houseNumber: '15B',
        },
        caller: callerAdmin,
        repo: mockRepo,
      });

      expect(updated.houseNumber).toBe('15B');
      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'people',
          action: 'people.member_updated',
          organizationId: orgId,
        })
      );

      infoSpy.mockRestore();
    });

    it('should throw NotFoundError if member does not exist', async () => {
      await expect(
        updateMember({
          organizationId: orgId,
          memberId: 'non-existent-id',
          input: { fullName: 'Nama Baru' },
          caller: callerAdmin,
          repo: mockRepo,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('archiveMember (soft delete)', () => {
    it('should soft delete member and log archive event', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const member = await createMember({
        input: {
          organizationId: orgId,
          roleId: roleId,
          fullName: 'Siti Aminah',
        },
        caller: callerAdmin,
        repo: mockRepo,
      });

      const result = await archiveMember({
        organizationId: orgId,
        memberId: member.id,
        caller: callerAdmin,
        repo: mockRepo,
        requestId: 'req-archive',
      });

      expect(result.success).toBe(true);
      expect(mockRepo.softDeleteMember).toHaveBeenCalledWith(orgId, member.id, callerAdmin.userId);

      // Verify member is not found after soft delete
      const deletedMember = await mockRepo.findMemberById(orgId, member.id);
      expect(deletedMember).toBeNull();

      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'people',
          action: 'people.member_archived',
          requestId: 'req-archive',
          organizationId: orgId,
          context: expect.objectContaining({ targetMemberId: member.id }),
        })
      );

      infoSpy.mockRestore();
    });

    it('should throw ForbiddenError if caller lacks permission', async () => {
      await expect(
        archiveMember({
          organizationId: orgId,
          memberId: 'some-member-id',
          caller: callerViewer,
          repo: mockRepo,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('team management', () => {
    it('should create team and prevent duplicates in same org', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const team = await createTeam({
        input: {
          organizationId: orgId,
          name: 'Seksi Keamanan',
          description: 'Ronda malam',
        },
        caller: callerAdmin,
        repo: mockRepo,
      });

      expect(team.name).toBe('Seksi Keamanan');
      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'people',
          action: 'people.team_created',
        })
      );

      // Attempt duplicate team name in same org
      await expect(
        createTeam({
          input: {
            organizationId: orgId,
            name: 'Seksi Keamanan',
          },
          caller: callerAdmin,
          repo: mockRepo,
        })
      ).rejects.toThrow(ConflictError);

      infoSpy.mockRestore();
    });

    it('should assign member to team', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const member = await createMember({
        input: {
          organizationId: orgId,
          roleId: roleId,
          fullName: 'Petugas Ronda',
        },
        caller: callerAdmin,
        repo: mockRepo,
      });

      const team = await createTeam({
        input: {
          organizationId: orgId,
          name: 'Seksi Ronda',
        },
        caller: callerAdmin,
        repo: mockRepo,
      });

      const assignment = await assignTeamMember({
        organizationId: orgId,
        teamId: team.id,
        memberId: member.id,
        caller: callerAdmin,
        repo: mockRepo,
      });

      expect(assignment.teamId).toBe(team.id);
      expect(assignment.memberId).toBe(member.id);
      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'people',
          action: 'people.team_member_assigned',
        })
      );

      infoSpy.mockRestore();
    });
  });
});
