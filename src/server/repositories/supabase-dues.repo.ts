import { createAdminClient } from '@/lib/supabase/admin';
import { DuesRepository } from '@/server/services/dues.service';
import { addMoney } from '@/lib/utils/currency';

export function createSupabaseDuesRepo(): DuesRepository {
  const supabase = createAdminClient();

  return {
    async findDuePlanById(organizationId: string, id: string) {
      const { data, error } = await supabase
        .from('due_plans')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        organizationId: data.organization_id,
        title: data.title,
        amount: Number(data.amount),
        frequency: data.frequency,
        dueDate: data.due_date,
      };
    },

    async createDuePlan(data: any) {
      const { data: created, error } = await supabase
        .from('due_plans')
        .insert({
          organization_id: data.organizationId,
          title: data.title,
          amount: data.amount,
          frequency: data.frequency,
          due_date: data.dueDate,
        })
        .select('*')
        .single();

      if (error) throw error;
      return {
        id: created.id,
        organizationId: created.organization_id,
        title: created.title,
        amount: Number(created.amount),
        frequency: created.frequency,
        dueDate: created.due_date,
      };
    },

    async findDueItemById(organizationId: string, id: string) {
      const { data, error } = await supabase
        .from('due_items')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        organizationId: data.organization_id,
        duePlanId: data.due_plan_id,
        memberId: data.member_id,
        amount: Number(data.amount),
        status: data.status,
      };
    },

    async createDueItems(items: any[]) {
      const rows = items.map((it) => ({
        organization_id: it.organizationId,
        due_plan_id: it.duePlanId,
        member_id: it.memberId,
        amount: it.amount,
        status: it.status || 'unpaid',
      }));

      const { data, error } = await supabase
        .from('due_items')
        .insert(rows)
        .select('*');

      if (error) throw error;
      return data.map((d) => ({
        id: d.id,
        organizationId: d.organization_id,
        duePlanId: d.due_plan_id,
        memberId: d.member_id,
        amount: Number(d.amount),
        status: d.status,
      }));
    },

    async createPayment(data: any) {
      const { data: created, error } = await supabase
        .from('payments')
        .insert({
          organization_id: data.organizationId,
          due_item_id: data.dueItemId,
          amount: data.amount,
          payment_method: data.paymentMethod,
          proof_file_url: data.proofFileUrl || null,
        })
        .select('*')
        .single();

      if (error) throw error;

      // Update due item status to pending_verification
      await supabase
        .from('due_items')
        .update({ status: 'pending_verification' })
        .eq('id', data.dueItemId);

      return {
        id: created.id,
        organizationId: created.organization_id,
        dueItemId: created.due_item_id,
        amount: Number(created.amount),
        paymentMethod: created.payment_method,
      };
    },

    async findPaymentById(organizationId: string, id: string) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        organizationId: data.organization_id,
        dueItemId: data.due_item_id,
        amount: Number(data.amount),
        paymentMethod: data.payment_method,
      };
    },

    async verifyPaymentAtomic(params) {
      const { organizationId, paymentId, dueItemId, accountId, categoryId, amount, description, verifierUserId } = params;

      // 1. Get current account balance
      const { data: account, error: accErr } = await supabase
        .from('accounts')
        .select('balance')
        .eq('organization_id', organizationId)
        .eq('id', accountId)
        .single();

      if (accErr || !account) throw accErr || new Error('Akun kas tidak ditemukan');
      const newBalance = addMoney(Number(account.balance), amount);

      // 2. Update account balance
      await supabase
        .from('accounts')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', accountId);

      // 3. Create posted income transaction
      const { data: transaction, error: txErr } = await supabase
        .from('transactions')
        .insert({
          organization_id: organizationId,
          account_id: accountId,
          category_id: categoryId || null,
          amount,
          type: 'income',
          status: 'posted',
          description,
          transaction_date: new Date().toISOString().split('T')[0],
          posted_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (txErr || !transaction) throw txErr || new Error('Gagal mencatat transaksi kas');

      // 4. Update payment verified
      const { data: payment, error: pErr } = await supabase
        .from('payments')
        .update({
          transaction_id: transaction.id,
          verified_by: verifierUserId,
          verified_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select('*')
        .single();

      if (pErr || !payment) throw pErr || new Error('Gagal memverifikasi pembayaran');

      // 5. Update due item to paid
      await supabase
        .from('due_items')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', dueItemId);

      return {
        payment,
        transaction,
        newBalance,
      };
    },
  };
}
