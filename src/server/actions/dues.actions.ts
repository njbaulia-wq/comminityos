'use server';

import {
  CreateDuePlanInput,
  CreatePaymentInput,
} from '@/lib/validation/dues.schema';
import {
  ActionResult,
  successResult,
  handleServiceError,
} from '@/lib/errors/result';
import {
  createDuePlan,
  submitPayment,
  verifyPayment,
  DuesRepository,
  CallerContext,
} from '@/server/services/dues.service';
import { createSupabaseDuesRepo } from '@/server/repositories/supabase-dues.repo';
import { resolveCallerContext } from './context-helper';
import { validateUuidParams } from '@/lib/validation/common.schema';

export interface DuesActionContext extends Partial<CallerContext> {
  requestId?: string;
  repo?: DuesRepository;
}

const fallbackRepo: DuesRepository = {
  findDuePlanById: async () => null,
  createDuePlan: async (d) => ({ id: 'plan-' + Date.now(), ...d }),
  findDueItemById: async () => null,
  createDueItems: async (items) => items,
  createPayment: async (d) => ({ id: 'pay-' + Date.now(), ...d }),
  findPaymentById: async () => null,
  verifyPaymentAtomic: async (p) => ({
    payment: { id: p.paymentId },
    transaction: { id: 'tx-' + Date.now(), status: 'posted', amount: p.amount },
    newBalance: p.amount,
  }),
};

function getRepo(explicit?: DuesRepository): DuesRepository {
  if (explicit) return explicit;
  try {
    return createSupabaseDuesRepo();
  } catch {
    return fallbackRepo;
  }
}

export async function createDuePlanAction(
  rawInput: CreateDuePlanInput,
  context?: DuesActionContext
): Promise<ActionResult<any>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const caller = await resolveCallerContext(rawInput.organizationId, context);
    const repo = getRepo(context?.repo);

    const plan = await createDuePlan({
      input: rawInput,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult(plan);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'dues',
      action: 'action.create_due_plan',
      requestId,
      organizationId: rawInput.organizationId,
      userId: context?.userId,
    });
  }
}

export async function submitPaymentAction(
  rawInput: CreatePaymentInput,
  context?: DuesActionContext
): Promise<ActionResult<any>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const caller = await resolveCallerContext(rawInput.organizationId, context);
    const repo = getRepo(context?.repo);

    const payment = await submitPayment({
      input: rawInput,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult(payment);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'dues',
      action: 'action.submit_payment',
      requestId,
      organizationId: rawInput.organizationId,
      userId: context?.userId,
    });
  }
}

export async function verifyPaymentAction(
  params: {
    organizationId: string;
    paymentId: string;
    accountId: string;
    categoryId?: string;
  },
  context?: DuesActionContext
): Promise<ActionResult<any>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    validateUuidParams({
      organizationId: params.organizationId,
      paymentId: params.paymentId,
      accountId: params.accountId,
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    });

    const caller = await resolveCallerContext(params.organizationId, context);
    const repo = getRepo(context?.repo);

    const result = await verifyPayment({
      organizationId: params.organizationId,
      paymentId: params.paymentId,
      accountId: params.accountId,
      categoryId: params.categoryId,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult(result);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'dues',
      action: 'action.verify_payment',
      requestId,
      organizationId: params.organizationId,
      userId: context?.userId,
    });
  }
}
