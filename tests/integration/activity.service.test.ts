import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createActivity,
  updateActivity,
  changeActivityStatus,
  assignActivityMember,
  ActivityRepository,
} from '@/server/services/activity.service';
import {
  ForbiddenError,
  NotFoundError,
  BusinessRuleError,
  ValidationError,
} from '@/lib/errors';
import { logger } from '@/lib/logger';

describe('Activity Domain Service', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const memberPicId = '22222222-2222-4222-8222-222222222222';
  const adminCaller = { userId: 'user-admin', roleName: 'Admin' };
  const viewerCaller = { userId: 'user-viewer', roleName: 'Viewer' };

  let mockRepo: ActivityRepository;
  let activitiesDb: any[];
  let activityMembersDb: any[];

  beforeEach(() => {
    activitiesDb = [];
    activityMembersDb = [];

    mockRepo = {
      findById: vi.fn(async (organizationId: string, activityId: string) => {
        return activitiesDb.find(
          (a) => a.organizationId === organizationId && a.id === activityId && !a.deletedAt
        ) || null;
      }),
      list: vi.fn(async (organizationId: string) => {
        return activitiesDb.filter((a) => a.organizationId === organizationId && !a.deletedAt);
      }),
      create: vi.fn(async (data: any) => {
        const record = {
          id: 'act-' + Math.random().toString(36).substring(7),
          ...data,
          createdAt: new Date().toISOString(),
          deletedAt: null,
        };
        activitiesDb.push(record);
        return record;
      }),
      update: vi.fn(async (organizationId: string, activityId: string, data: any) => {
        const record = activitiesDb.find(
          (a) => a.organizationId === organizationId && a.id === activityId && !a.deletedAt
        );
        if (!record) return null;
        Object.assign(record, data, { updatedAt: new Date().toISOString() });
        return record;
      }),
      softDelete: vi.fn(async (organizationId: string, activityId: string, actorUserId: string) => {
        const record = activitiesDb.find(
          (a) => a.organizationId === organizationId && a.id === activityId && !a.deletedAt
        );
        if (!record) return false;
        record.deletedAt = new Date().toISOString();
        record.deletedBy = actorUserId;
        return true;
      }),
      addMember: vi.fn(async (activityId: string, memberId: string, roleInActivity?: string | null) => {
        const entry = { activityId, memberId, roleInActivity, createdAt: new Date().toISOString() };
        activityMembersDb.push(entry);
        return entry;
      }),
      removeMember: vi.fn(async (activityId: string, memberId: string) => {
        const idx = activityMembersDb.findIndex(
          (m) => m.activityId === activityId && m.memberId === memberId
        );
        if (idx >= 0) activityMembersDb.splice(idx, 1);
      }),
      listMembers: vi.fn(async (activityId: string) => {
        return activityMembersDb.filter((m) => m.activityId === activityId);
      }),
    };
  });

  describe('createActivity', () => {
    it('should successfully create activity and emit structured log', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const input = {
        organizationId: orgId,
        title: 'Lomba 17 Agustus RT 05',
        description: 'Perayaan kemerdekaan',
        startDate: '2026-08-17',
        endDate: '2026-08-18',
        budgetEstimate: 3000000,
        picMemberId: memberPicId,
      };

      const result = await createActivity({
        input,
        caller: adminCaller,
        repo: mockRepo,
        requestId: 'req-act-create',
      });

      expect(result).toBeDefined();
      expect(result.title).toBe(input.title);
      expect(result.budgetEstimate).toBe(3000000);
      expect(result.status).toBe('draft');

      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'activity',
          action: 'activity.created',
          requestId: 'req-act-create',
          organizationId: orgId,
        })
      );

      infoSpy.mockRestore();
    });

    it('should throw ForbiddenError if caller lacks activities.manage permission', async () => {
      const input = {
        organizationId: orgId,
        title: 'Rapat Warga',
      };

      await expect(
        createActivity({
          input,
          caller: viewerCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ValidationError if input schema validation fails', async () => {
      const input = {
        organizationId: orgId,
        title: 'AB', // too short
      };

      await expect(
        createActivity({
          input,
          caller: adminCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateActivity', () => {
    it('should successfully update activity details', async () => {
      const created = await createActivity({
        input: {
          organizationId: orgId,
          title: 'Kegiatan Awal',
          budgetEstimate: 1000000,
        },
        caller: adminCaller,
        repo: mockRepo,
      });

      const updated = await updateActivity({
        organizationId: orgId,
        activityId: created.id,
        input: {
          title: 'Kegiatan Revisi',
          budgetEstimate: 1500000,
        },
        caller: adminCaller,
        repo: mockRepo,
      });

      expect(updated.title).toBe('Kegiatan Revisi');
      expect(updated.budgetEstimate).toBe(1500000);
    });

    it('should throw BusinessRuleError when attempting to modify completed activity', async () => {
      const created = await createActivity({
        input: {
          organizationId: orgId,
          title: 'Kegiatan Selesai',
          status: 'completed',
        },
        caller: adminCaller,
        repo: mockRepo,
      });

      await expect(
        updateActivity({
          organizationId: orgId,
          activityId: created.id,
          input: {
            budgetEstimate: 5000000,
          },
          caller: adminCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw NotFoundError if activity does not exist', async () => {
      await expect(
        updateActivity({
          organizationId: orgId,
          activityId: 'non-existent',
          input: { title: 'Baru' },
          caller: adminCaller,
          repo: mockRepo,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('changeActivityStatus', () => {
    it('should transition status and emit status_changed log', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const created = await createActivity({
        input: {
          organizationId: orgId,
          title: 'Turnamen Catur',
        },
        caller: adminCaller,
        repo: mockRepo,
      });

      const updated = await changeActivityStatus({
        organizationId: orgId,
        activityId: created.id,
        newStatus: 'active',
        caller: adminCaller,
        repo: mockRepo,
        requestId: 'req-status-change',
      });

      expect(updated.status).toBe('active');
      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'activity',
          action: 'activity.status_changed',
          requestId: 'req-status-change',
          context: expect.objectContaining({
            oldStatus: 'draft',
            newStatus: 'active',
          }),
        })
      );

      infoSpy.mockRestore();
    });
  });

  describe('assignActivityMember', () => {
    it('should assign member to activity committee', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const created = await createActivity({
        input: {
          organizationId: orgId,
          title: 'Bazar UMKM Warga',
        },
        caller: adminCaller,
        repo: mockRepo,
      });

      const member = await assignActivityMember({
        organizationId: orgId,
        activityId: created.id,
        memberId: memberPicId,
        roleInActivity: 'Ketua Panitia',
        caller: adminCaller,
        repo: mockRepo,
      });

      expect(member.activityId).toBe(created.id);
      expect(member.memberId).toBe(memberPicId);
      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'activity',
          action: 'activity.member_assigned',
        })
      );

      infoSpy.mockRestore();
    });
  });
});
