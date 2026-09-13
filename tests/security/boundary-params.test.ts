import { describe, it, expect } from 'vitest';
import { updateMemberAction, archiveMemberAction } from '@/server/actions/people.actions';
import { approveTransactionAction, postTransactionAction } from '@/server/actions/finance.actions';
import { verifyPaymentAction } from '@/server/actions/dues.actions';
import { updateActivityAction } from '@/server/actions/activity.actions';
import { updateTaskStatusAction } from '@/server/actions/task.actions';
import { deleteDocumentAction } from '@/server/actions/document.actions';

describe('Server Action Boundary Parameter Validation', () => {
  const caller = {
    userId: 'a11e8a93-b0c3-4a11-822e-13c5ec821901',
    roleName: 'admin',
  };

  it('should reject malformed organizationId or memberId in people actions', async () => {
    const res1 = await updateMemberAction(
      {
        organizationId: 'not-a-valid-uuid',
        memberId: 'also-invalid',
        input: { fullName: 'Budi Santoso' },
      },
      caller
    );

    expect(res1.success).toBe(false);
    if (!res1.success) {
      expect(res1.error.code).toBe('VALIDATION_ERROR');
      expect(res1.error.fieldErrors).toBeDefined();
    }

    const res2 = await archiveMemberAction(
      {
        organizationId: 'bad-org-id',
        memberId: 'bad-member-id',
      },
      caller
    );

    expect(res2.success).toBe(false);
    if (!res2.success) {
      expect(res2.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should reject malformed IDs in finance actions (approveTransactionAction, postTransactionAction)', async () => {
    const res1 = await approveTransactionAction(
      {
        organizationId: 'invalid-org',
        transactionId: 'invalid-tx',
      },
      caller
    );

    expect(res1.success).toBe(false);
    if (!res1.success) {
      expect(res1.error.code).toBe('VALIDATION_ERROR');
    }

    const res2 = await postTransactionAction(
      {
        organizationId: 'invalid-org',
        transactionId: 'invalid-tx',
      },
      caller
    );

    expect(res2.success).toBe(false);
    if (!res2.success) {
      expect(res2.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should reject malformed IDs in dues verifyPaymentAction', async () => {
    const res = await verifyPaymentAction(
      {
        organizationId: 'invalid-org',
        paymentId: 'invalid-pay',
        accountId: 'invalid-acc',
      },
      caller
    );

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should reject malformed IDs in activity and task actions', async () => {
    const resAct = await updateActivityAction(
      {
        organizationId: 'bad-uuid',
        activityId: 'bad-uuid',
        input: { title: 'Kegiatan Baru' },
      },
      caller
    );

    expect(resAct.success).toBe(false);
    if (!resAct.success) {
      expect(resAct.error.code).toBe('VALIDATION_ERROR');
    }

    const resTask = await updateTaskStatusAction(
      {
        organizationId: 'bad-uuid',
        taskId: 'bad-uuid',
        status: 'done',
      },
      caller
    );

    expect(resTask.success).toBe(false);
    if (!resTask.success) {
      expect(resTask.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should reject malformed IDs in deleteDocumentAction', async () => {
    const res = await deleteDocumentAction(
      {
        organizationId: 'bad-uuid',
        documentId: 'bad-uuid',
      },
      caller
    );

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe('VALIDATION_ERROR');
    }
  });
});
