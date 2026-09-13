import {
  CreateTransactionInput,
  CreateTransactionSchema,
  UpdateTransactionInput,
  UpdateTransactionSchema,
  TransactionStatus,
  TransactionType,
} from '@/lib/validation/finance.schema';
import {
  ForbiddenError,
  NotFoundError,
  BusinessRuleError,
  ValidationError,
} from '@/lib/errors';
import { addMoney, subtractMoney } from '@/lib/utils/currency';
import { logger } from '@/lib/logger';
import { assertPermission } from '@/server/services/permission.service';

export interface CallerContext {
  userId: string;
  roleName: string;
}

export interface FinanceRepository {
  findAccountById(organizationId: string, id: string): Promise<any | null>;
  updateAccountBalance(
    organizationId: string,
    id: string,
    newBalance: number
  ): Promise<any>;
  findTransactionById(organizationId: string, id: string): Promise<any | null>;
  createTransaction(data: any): Promise<any>;
  updateTransaction(
    organizationId: string,
    id: string,
    data: Record<string, any>
  ): Promise<any>;
  listTransactions(organizationId: string, filters?: any): Promise<any[]>;
}

export const EXPENSE_APPROVAL_THRESHOLD = 500000; // Rp 500.000

function parseValidationErrors(error: any): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'root';
    if (!fieldErrors[field]) fieldErrors[field] = [];
    fieldErrors[field].push(issue.message);
  }
  return fieldErrors;
}

export async function createTransaction(params: {
  input: CreateTransactionInput;
  caller: CallerContext;
  repo: FinanceRepository;
  requestId?: string;
}): Promise<any> {
  const { input, caller, repo, requestId } = params;

  // 1. Authorize: finance.create
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'finance.create',
    organizationId: input.organizationId,
    requestId,
  });

  // 2. Validate boundary
  const parsed = CreateTransactionSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      'Input data transaksi tidak valid',
      parseValidationErrors(parsed.error)
    );
  }

  const valid = parsed.data;

  // 3. Verify account exists
  const account = await repo.findAccountById(valid.organizationId, valid.accountId);
  if (!account) {
    throw new NotFoundError(
      `Akun kas/bank dengan ID "${valid.accountId}" tidak ditemukan`
    );
  }

  // 4. Determine status: large expenses require approval
  let status: TransactionStatus = valid.status;
  if (valid.type === 'expense' && valid.amount > EXPENSE_APPROVAL_THRESHOLD) {
    status = 'pending_approval';
  }

  // 5. Create transaction
  const transaction = await repo.createTransaction({
    organizationId: valid.organizationId,
    accountId: valid.accountId,
    categoryId: valid.categoryId,
    amount: valid.amount,
    type: valid.type,
    status,
    description: valid.description,
    transactionDate: valid.transactionDate,
    createdBy: caller.userId,
  });

  // 6. Log
  logger.info({
    module: 'finance',
    action: 'finance.transaction_created',
    requestId,
    organizationId: valid.organizationId,
    userId: caller.userId,
    message: 'Transaksi keuangan baru berhasil dicatat',
    context: {
      transactionId: transaction.id,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
    },
  });

  return transaction;
}

export async function approveTransaction(params: {
  organizationId: string;
  transactionId: string;
  caller: CallerContext;
  repo: FinanceRepository;
  requestId?: string;
}): Promise<any> {
  const { organizationId, transactionId, caller, repo, requestId } = params;

  // 1. Authorize: finance.approve (Chair / Admin / Owner)
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'finance.approve',
    organizationId,
    requestId,
  });

  // 2. Find transaction
  const tx = await repo.findTransactionById(organizationId, transactionId);
  if (!tx) {
    throw new NotFoundError(`Transaksi dengan ID "${transactionId}" tidak ditemukan`);
  }

  if (tx.status === 'posted') {
    throw new BusinessRuleError('Transaksi yang sudah diposting tidak dapat disetujui ulang');
  }

  if (tx.status === 'void') {
    throw new BusinessRuleError('Transaksi yang telah dibatalkan (void) tidak dapat disetujui');
  }

  // 3. Update approvedBy
  const updated = await repo.updateTransaction(organizationId, transactionId, {
    approvedBy: caller.userId,
  });

  // 4. Log
  logger.info({
    module: 'finance',
    action: 'finance.transaction_approved',
    requestId,
    organizationId,
    userId: caller.userId,
    message: 'Pengeluaran kas telah disetujui oleh pejabat berwenang',
    context: {
      transactionId,
      approvedBy: caller.userId,
    },
  });

  return updated;
}

export async function postTransaction(params: {
  organizationId: string;
  transactionId: string;
  caller: CallerContext;
  repo: FinanceRepository;
  requestId?: string;
}): Promise<any> {
  const { organizationId, transactionId, caller, repo, requestId } = params;

  // 1. Authorize: finance.post (Treasurer / Admin / Owner)
  await assertPermission({
    userId: caller.userId,
    roleName: caller.roleName,
    permission: 'finance.post',
    organizationId,
    requestId,
  });

  // 2. Find transaction
  const tx = await repo.findTransactionById(organizationId, transactionId);
  if (!tx) {
    throw new NotFoundError(`Transaksi dengan ID "${transactionId}" tidak ditemukan`);
  }

  if (tx.status === 'posted') {
    throw new BusinessRuleError('Transaksi sudah diposting sebelumnya');
  }

  if (tx.status === 'void') {
    throw new BusinessRuleError('Transaksi yang telah dibatalkan (void) tidak dapat dibukukan');
  }

  // 3. Check approval requirement
  if (
    tx.type === 'expense' &&
    tx.amount > EXPENSE_APPROVAL_THRESHOLD &&
    !tx.approvedBy
  ) {
    throw new BusinessRuleError(
      'Pengeluaran memerlukan persetujuan Ketua sebelum diposting'
    );
  }

  // 4. Update account balance accurately
  const account = await repo.findAccountById(organizationId, tx.accountId);
  if (!account) {
    throw new NotFoundError(`Akun kas tidak ditemukan`);
  }

  let newBalance = account.balance;
  if (tx.type === 'income') {
    newBalance = addMoney(account.balance, tx.amount);
  } else if (tx.type === 'expense') {
    newBalance = subtractMoney(account.balance, tx.amount);
  }

  await repo.updateAccountBalance(organizationId, tx.accountId, newBalance);

  // 5. Update transaction to posted
  const postedAt = new Date().toISOString();
  const updated = await repo.updateTransaction(organizationId, transactionId, {
    status: 'posted',
    postedAt,
  });

  // 6. Structured log
  logger.info({
    module: 'finance',
    action: 'finance.transaction_posted',
    requestId,
    organizationId,
    userId: caller.userId,
    message: 'Transaksi kas berhasil dibukukan ke buku besar resmi',
    context: {
      transactionId,
      amount: tx.amount,
      type: tx.type,
      newBalance,
    },
  });

  return updated;
}
