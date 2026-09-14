'use server';

import {
  CreateTransactionInput,
  UpdateTransactionInput,
} from '@/lib/validation/finance.schema';
import {
  ActionResult,
  successResult,
  handleServiceError,
} from '@/lib/errors/result';
import {
  createTransaction,
  approveTransaction,
  postTransaction,
  FinanceRepository,
  CallerContext,
} from '@/server/services/finance.service';
import { createSupabaseFinanceRepo } from '@/server/repositories/supabase-finance.repo';
import { resolveCallerContext } from './context-helper';
import { validateUuidParams } from '@/lib/validation/common.schema';

export interface FinanceActionContext extends Partial<CallerContext> {
  requestId?: string;
  repo?: FinanceRepository;
}

const fallbackRepo: FinanceRepository = {
  findAccountById: async () => null,
  updateAccountBalance: async (_orgId, id, b) => ({ id, balance: b }),
  findTransactionById: async () => null,
  createTransaction: async (d) => ({ id: 'tx-' + Date.now(), ...d }),
  updateTransaction: async (_orgId, id, d) => ({ id, ...d }),
  listTransactions: async () => [],
};

function getRepo(explicit?: FinanceRepository): FinanceRepository {
  if (explicit) return explicit;
  try {
    return createSupabaseFinanceRepo();
  } catch {
    return fallbackRepo;
  }
}

export async function createTransactionAction(
  rawInput: CreateTransactionInput,
  context?: FinanceActionContext
): Promise<ActionResult<any>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const caller = await resolveCallerContext(rawInput.organizationId, context);
    const repo = getRepo(context?.repo);

    const tx = await createTransaction({
      input: rawInput,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult(tx);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'finance',
      action: 'action.create_transaction',
      requestId,
      organizationId: rawInput.organizationId,
      userId: context?.userId,
    });
  }
}

export async function approveTransactionAction(
  params: {
    organizationId: string;
    transactionId: string;
  },
  context?: FinanceActionContext
): Promise<ActionResult<any>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    validateUuidParams({
      organizationId: params.organizationId,
      transactionId: params.transactionId,
    });

    const caller = await resolveCallerContext(params.organizationId, context);
    const repo = getRepo(context?.repo);

    const approved = await approveTransaction({
      organizationId: params.organizationId,
      transactionId: params.transactionId,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult(approved);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'finance',
      action: 'action.approve_transaction',
      requestId,
      organizationId: params.organizationId,
      userId: context?.userId,
    });
  }
}

export async function postTransactionAction(
  params: {
    organizationId: string;
    transactionId: string;
  },
  context?: FinanceActionContext
): Promise<ActionResult<any>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    validateUuidParams({
      organizationId: params.organizationId,
      transactionId: params.transactionId,
    });

    const caller = await resolveCallerContext(params.organizationId, context);
    const repo = getRepo(context?.repo);

    const posted = await postTransaction({
      organizationId: params.organizationId,
      transactionId: params.transactionId,
      caller: {
        userId: caller.userId,
        roleName: caller.roleName,
      },
      repo,
      requestId: caller.requestId,
    });

    return successResult(posted);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'finance',
      action: 'action.post_transaction',
      requestId,
      organizationId: params.organizationId,
      userId: context?.userId,
    });
  }
}
