import {
  CreateDuePlanInput,
  CreateDuePlanSchema,
  CreatePaymentInput,
  CreatePaymentSchema,
} from '@/lib/validation/dues.schema';
import {
  ForbiddenError,
  NotFoundError,
  BusinessRuleError,
  ValidationError,
} from '@/lib/errors';
import { logger } from '@/lib/logger';
import { assertPermission } from '@/server/services/permission.service';

export interface CallerContext {
  userId: string;
  roleName: string;
}

export interface DuesRepository {
  findDuePlanById(organizationId: string, id: string): Promise<any | null>;
  createDuePlan(data: any): Promise<any>;
  findDueItemById(organizationId: string, id: string): Promise<any | null>;
  createDueItems(items: any[]): Promise<any[]>;
  createPayment(data: any): Promise<any>;
  findPaymentById(organizationId: string, id: string): Promise<any | null>;
  verifyPaymentAtomic(params: {
    organizationId: string;
    paymentId: string;
    dueItemId: string;
    accountId: string;
    categoryId?: string;
    amount: number;
    description: string;
    verifierUserId: string;
  }): Promise<{ payment: any; transaction: any; newBalance: number }>;
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

export async function createDuePlan(params: {
  input: CreateDuePlanInput;
  caller: CallerContext;
  repo: DuesRepository;
  requestId?: string;
}): Promise<any> {
  const { input, caller, repo, requestId } = params;

  // 1. Authorize: dues.manage
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'dues.manage',
    organizationId: input.organizationId,
    requestId,
  });

  // 2. Validate
  const parsed = CreateDuePlanSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      'Input rencana iuran tidak valid',
      parseValidationErrors(parsed.error)
    );
  }

  const valid = parsed.data;

  // 3. Create plan
  const plan = await repo.createDuePlan({
    organizationId: valid.organizationId,
    title: valid.title,
    amount: valid.amount,
    frequency: valid.frequency,
    dueDate: valid.dueDate,
  });

  // 4. Log
  logger.info({
    module: 'dues',
    action: 'dues.plan_created',
    requestId,
    organizationId: valid.organizationId,
    userId: caller.userId,
    message: 'Rencana iuran baru berhasil dibuat',
    context: {
      planId: plan.id,
      title: plan.title,
      amount: plan.amount,
    },
  });

  return plan;
}

export async function submitPayment(params: {
  input: CreatePaymentInput;
  caller: CallerContext;
  repo: DuesRepository;
  requestId?: string;
}): Promise<any> {
  const { input, caller, repo, requestId } = params;

  // 1. Validate
  const parsed = CreatePaymentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      'Input pembayaran iuran tidak valid',
      parseValidationErrors(parsed.error)
    );
  }

  const valid = parsed.data;

  // 2. Verify due item exists
  const item = await repo.findDueItemById(valid.organizationId, valid.dueItemId);
  if (!item) {
    throw new NotFoundError(`Tagihan iuran dengan ID "${valid.dueItemId}" tidak ditemukan`);
  }

  // 3. Business rule: Cannot pay if already paid
  if (item.status === 'paid') {
    throw new BusinessRuleError('Tagihan iuran sudah lunas');
  }

  // 4. Create payment record
  const payment = await repo.createPayment({
    organizationId: valid.organizationId,
    dueItemId: valid.dueItemId,
    amount: valid.amount,
    paymentMethod: valid.paymentMethod,
    proofFileUrl: valid.proofFileUrl,
  });

  // 5. Log
  logger.info({
    module: 'dues',
    action: 'dues.payment_submitted',
    requestId,
    organizationId: valid.organizationId,
    userId: caller.userId,
    message: 'Pembayaran iuran diserahkan dan menunggu verifikasi',
    context: {
      paymentId: payment.id,
      dueItemId: valid.dueItemId,
      amount: valid.amount,
    },
  });

  return payment;
}

export async function verifyPayment(params: {
  organizationId: string;
  paymentId: string;
  accountId: string;
  categoryId?: string;
  caller: CallerContext;
  repo: DuesRepository;
  requestId?: string;
}): Promise<{
  payment: any;
  dueItemStatus: string;
  transaction: any;
  newBalance: number;
}> {
  const { organizationId, paymentId, accountId, categoryId, caller, repo, requestId } =
    params;

  // 1. Authorize: dues.manage
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'dues.manage',
    organizationId,
    requestId,
  });

  // 2. Find payment
  const payment = await repo.findPaymentById(organizationId, paymentId);
  if (!payment) {
    throw new NotFoundError(`Pembayaran dengan ID "${paymentId}" tidak ditemukan`);
  }

  // 3. Find due item
  const dueItem = await repo.findDueItemById(organizationId, payment.dueItemId);
  if (!dueItem) {
    throw new NotFoundError(`Tagihan iuran tidak ditemukan`);
  }

  if (dueItem.status === 'paid') {
    throw new BusinessRuleError('Tagihan sudah berstatus lunas');
  }

  // 4. Determine description
  const plan = await repo.findDuePlanById(organizationId, dueItem.duePlanId);
  const planTitle = plan?.title || 'Iuran Warga';
  const description = `Pembayaran ${planTitle} (Ref: ${payment.id})`;

  // 5. Execute atomic transaction in repo
  const result = await repo.verifyPaymentAtomic({
    organizationId,
    paymentId,
    dueItemId: dueItem.id,
    accountId,
    categoryId,
    amount: payment.amount,
    description,
    verifierUserId: caller.userId,
  });

  // 6. Log
  logger.info({
    module: 'dues',
    action: 'dues.payment_verified',
    requestId,
    organizationId,
    userId: caller.userId,
    message: 'Pembayaran iuran berhasil diverifikasi dan dibukukan ke buku kas',
    context: {
      paymentId,
      dueItemId: dueItem.id,
      transactionId: result.transaction.id,
      amount: payment.amount,
      newBalance: result.newBalance,
    },
  });

  return {
    payment: result.payment,
    dueItemStatus: 'paid',
    transaction: result.transaction,
    newBalance: result.newBalance,
  };
}
