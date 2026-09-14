import { createAdminClient } from '@/lib/supabase/admin';
import { FinanceRepository } from '@/server/services/finance.service';

export function createSupabaseFinanceRepo(): FinanceRepository {
  const supabase = createAdminClient();

  return {
    async findAccountById(organizationId: string, id: string) {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        organizationId: data.organization_id,
        name: data.name,
        type: data.type,
        balance: Number(data.balance),
        accountNumber: data.account_number,
      };
    },

    async updateAccountBalance(organizationId: string, id: string, newBalance: number) {
      const { data, error } = await supabase
        .from('accounts')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('organization_id', organizationId)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return {
        id: data.id,
        organizationId: data.organization_id,
        balance: Number(data.balance),
      };
    },

    async findTransactionById(organizationId: string, id: string) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        organizationId: data.organization_id,
        accountId: data.account_id,
        categoryId: data.category_id,
        amount: Number(data.amount),
        type: data.type,
        status: data.status,
        description: data.description,
        transactionDate: data.transaction_date,
        createdBy: data.created_by,
        approvedBy: data.approved_by,
        postedAt: data.posted_at,
      };
    },

    async createTransaction(data: any) {
      const { data: created, error } = await supabase
        .from('transactions')
        .insert({
          organization_id: data.organizationId,
          account_id: data.accountId,
          category_id: data.categoryId || null,
          amount: data.amount,
          type: data.type,
          status: data.status || 'draft',
          description: data.description,
          transaction_date: data.transactionDate || new Date().toISOString().split('T')[0],
          created_by: data.createdBy || null,
        })
        .select('*')
        .single();

      if (error) throw error;
      return {
        id: created.id,
        organizationId: created.organization_id,
        accountId: created.account_id,
        categoryId: created.category_id,
        amount: Number(created.amount),
        type: created.type,
        status: created.status,
        description: created.description,
        transactionDate: created.transaction_date,
      };
    },

    async updateTransaction(organizationId: string, id: string, data: Record<string, any>) {
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (data.status !== undefined) updatePayload.status = data.status;
      if (data.approvedBy !== undefined) updatePayload.approved_by = data.approvedBy;
      if (data.postedAt !== undefined) updatePayload.posted_at = data.postedAt;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.amount !== undefined) updatePayload.amount = data.amount;

      const { data: updated, error } = await supabase
        .from('transactions')
        .update(updatePayload)
        .eq('organization_id', organizationId)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return {
        id: updated.id,
        organizationId: updated.organization_id,
        accountId: updated.account_id,
        amount: Number(updated.amount),
        type: updated.type,
        status: updated.status,
        approvedBy: updated.approved_by,
        postedAt: updated.posted_at,
      };
    },

    async listTransactions(organizationId: string, filters?: any) {
      let query = supabase
        .from('transactions')
        .select(`
          id,
          organization_id,
          account_id,
          category_id,
          amount,
          type,
          status,
          description,
          transaction_date,
          created_at,
          account:accounts(name),
          category:transaction_categories(name)
        `)
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('transaction_date', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((t) => {
        const account = Array.isArray(t.account) ? t.account[0] : t.account;
        const category = Array.isArray(t.category) ? t.category[0] : t.category;
        return {
          id: t.id,
          organizationId: t.organization_id,
          accountId: t.account_id,
          accountName: account?.name || 'Kas Utama',
          categoryId: t.category_id,
          categoryName: category?.name,
          amount: Number(t.amount),
          type: t.type,
          status: t.status,
          description: t.description,
          transactionDate: t.transaction_date,
        };
      });
    },
  };
}
