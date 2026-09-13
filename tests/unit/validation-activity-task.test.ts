import { describe, it, expect } from 'vitest';
import {
  CreateActivitySchema,
  UpdateActivitySchema,
} from '@/lib/validation/activity.schema';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  CreateChecklistItemSchema,
} from '@/lib/validation/task.schema';

describe('Zod Schemas for Activities & Tasks', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const memberId = '22222222-2222-4222-8222-222222222222';
  const activityId = '33333333-3333-4333-8333-333333333333';
  const taskId = '44444444-4444-4444-8444-444444444444';

  describe('CreateActivitySchema', () => {
    it('should validate valid activity payload', () => {
      const valid = {
        organizationId: orgId,
        title: 'Kerja Bakti Akbar Bersih Lingkungan',
        description: 'Membersihkan selokan dan fasilitas umum RT',
        startDate: '2026-10-01',
        endDate: '2026-10-02',
        status: 'planned' as const,
        budgetEstimate: 1500000,
        picMemberId: memberId,
      };

      const parsed = CreateActivitySchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject when endDate is earlier than startDate', () => {
      const invalid = {
        organizationId: orgId,
        title: 'Bakti Sosial',
        startDate: '2026-10-10',
        endDate: '2026-10-05', // earlier than startDate!
      };

      const parsed = CreateActivitySchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.endDate).toBeDefined();
        expect(parsed.error.flatten().fieldErrors.endDate?.[0]).toContain('Tanggal selesai');
      }
    });

    it('should reject negative budgetEstimate', () => {
      const invalid = {
        organizationId: orgId,
        title: 'Pentas Seni HUT RI',
        budgetEstimate: -50000,
      };

      const parsed = CreateActivitySchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.budgetEstimate).toBeDefined();
      }
    });

    it('should reject title shorter than 3 characters', () => {
      const invalid = {
        organizationId: orgId,
        title: 'KB',
      };

      const parsed = CreateActivitySchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.title).toBeDefined();
      }
    });
  });

  describe('CreateTaskSchema', () => {
    it('should validate valid task payload', () => {
      const valid = {
        organizationId: orgId,
        activityId,
        assigneeId: memberId,
        title: 'Sewa Tenda & Sound System',
        description: 'Koordinasi dengan vendor tenda terdekat',
        priority: 'high' as const,
        status: 'todo' as const,
      };

      const parsed = CreateTaskSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject invalid task priority', () => {
      const invalid = {
        organizationId: orgId,
        title: 'Beli Cat Lapangan',
        priority: 'critical', // not in low, medium, high, urgent
      };

      const parsed = CreateTaskSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.priority).toBeDefined();
      }
    });

    it('should reject invalid task status', () => {
      const invalid = {
        organizationId: orgId,
        title: 'Pasang Umbul-umbul',
        status: 'pending', // not in todo, in_progress, done
      };

      const parsed = CreateTaskSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.status).toBeDefined();
      }
    });
  });

  describe('CreateChecklistItemSchema', () => {
    it('should validate valid checklist item', () => {
      const valid = {
        taskId,
        title: 'Hubungi Pak RT untuk konfirmasi izin',
      };

      const parsed = CreateChecklistItemSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject empty checklist title', () => {
      const invalid = {
        taskId,
        title: '',
      };

      const parsed = CreateChecklistItemSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.title).toBeDefined();
      }
    });
  });
});
