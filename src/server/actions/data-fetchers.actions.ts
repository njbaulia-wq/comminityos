'use server';

import { createActionClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface DashboardLayoutData {
  organizationId: string;
  orgName: string;
  orgSlug: string;
  userName: string;
  userRole: string;
}

/**
 * Resolves current user and organization details for layout headers.
 */
export async function getDashboardLayoutData(orgSlug: string): Promise<DashboardLayoutData> {
  const admin = createAdminClient();

  // 1. Fetch organization
  const { data: org } = await admin
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .is('deleted_at', null)
    .maybeSingle();

  const organizationId = org?.id || '11111111-1111-4111-8111-111111111111';
  const orgName = org?.name || orgSlug;

  // 2. Fetch authenticated user from cookies
  let userName = 'Pengurus Komunitas';
  let userRole = 'Pengurus';

  try {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Find profile
      const { data: profile } = await admin
        .from('profiles')
        .select(`
          id,
          full_name,
          members:organization_members (
            organization_id,
            role:roles (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        userName = profile.full_name;
        const members = Array.isArray(profile.members) ? profile.members : [];
        const currentMember = members.find((m: any) => m.organization_id === organizationId);
        const roleObj = Array.isArray(currentMember?.role) ? currentMember.role[0] : currentMember?.role;
        if (roleObj?.name) {
          userRole = roleObj.name;
        }
      }
    }
  } catch {
    // Fallback gracefully if cookieStore is unavailable in certain test environments
  }

  return {
    organizationId,
    orgName,
    orgSlug,
    userName,
    userRole,
  };
}

/**
 * Overview command center data loader
 */
export async function getOverviewData(orgSlug: string) {
  const admin = createAdminClient();

  const { data: org } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .is('deleted_at', null)
    .maybeSingle();

  const orgId = org?.id || '11111111-1111-4111-8111-111111111111';

  // 1. Accounts & Balances
  const { data: accounts } = await admin
    .from('accounts')
    .select('balance')
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  const totalBalance = (accounts || []).reduce((acc, a) => acc + Number(a.balance), 0);

  // 2. Monthly Income & Expense
  const { data: transactions } = await admin
    .from('transactions')
    .select('amount, type, status, description, created_at, id')
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  const allTx = transactions || [];
  const monthlyIncome = allTx
    .filter((t) => t.type === 'income' && t.status === 'posted')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const monthlyExpense = allTx
    .filter((t) => t.type === 'expense' && t.status === 'posted')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  // 3. Dues Compliance
  const { data: duesItems } = await admin
    .from('due_items')
    .select(`
      id,
      amount,
      status,
      created_at,
      plan:due_plans(title),
      member:organization_members (
        profile:profiles (
          full_name
        )
      )
    `)
    .eq('organization_id', orgId);

  const allDues = duesItems || [];
  const totalDues = allDues.length;
  const paidDues = allDues.filter((d) => d.status === 'paid').length;
  const duesComplianceRate = totalDues > 0 ? Math.round((paidDues / totalDues) * 100) : 100;

  // 4. Action Queue items: pending expenses + pending dues verifications
  const queue: Array<{
    id: string;
    title: string;
    description: string;
    type: 'expense_approval' | 'dues_verification';
    priority: 'high' | 'medium';
    createdAt: string;
  }> = [];

  // Pending expenses
  allTx
    .filter((t) => t.status === 'pending_approval' || (t.type === 'expense' && t.status === 'draft' && Number(t.amount) >= 500000))
    .forEach((t) => {
      queue.push({
        id: t.id,
        title: `Persetujuan Pengeluaran: ${t.description || 'Pengeluaran Kas'}`,
        description: `Pengajuan belanja Rp ${Number(t.amount).toLocaleString('id-ID')}`,
        type: 'expense_approval',
        priority: 'high',
        createdAt: t.created_at ? t.created_at.split('T')[0] : '2026-09-12',
      });
    });

  // Pending dues verifications
  allDues
    .filter((d) => d.status === 'pending_verification')
    .forEach((d) => {
      const member = Array.isArray(d.member) ? d.member[0] : d.member;
      const profile = member?.profile ? (Array.isArray(member.profile) ? member.profile[0] : member.profile) : null;
      const plan = Array.isArray(d.plan) ? d.plan[0] : d.plan;
      queue.push({
        id: d.id,
        title: `Verifikasi Iuran: ${profile?.full_name || 'Warga'}`,
        description: `Bukti transfer Rp ${Number(d.amount).toLocaleString('id-ID')} untuk ${plan?.title || 'Iuran Bulanan'}`,
        type: 'dues_verification',
        priority: 'medium',
        createdAt: d.created_at ? d.created_at.split('T')[0] : '2026-09-13',
      });
    });

  // 5. Activities & Urgent Tasks
  const { data: activitiesData } = await admin
    .from('activities')
    .select('id, title, start_date, status')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('start_date', { ascending: true });

  const activities = (activitiesData || []).map((a) => ({
    id: a.id,
    title: a.title,
    startDate: a.start_date || undefined,
    status: (a.status as 'planned' | 'active' | 'completed' | 'cancelled') || 'active',
  }));

  const { data: tasksData } = await admin
    .from('tasks')
    .select('id, title, due_date, priority')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .neq('status', 'done')
    .order('due_date', { ascending: true });

  const tasks = (tasksData || []).map((t) => ({
    id: t.id,
    title: t.title,
    dueDate: t.due_date ? t.due_date.split('T')[0] : '2026-09-20',
    priority: (t.priority as 'urgent' | 'high' | 'medium' | 'low') || 'medium',
  }));

  return {
    organizationId: orgId,
    financeSnapshot: {
      balance: totalBalance,
      monthlyIncome,
      monthlyExpense,
      duesComplianceRate,
    },
    actionQueue: queue,
    activities,
    tasks,
  };
}

/**
 * Finance Page data loader
 */
export async function getFinanceData(orgSlug: string) {
  const admin = createAdminClient();

  const { data: org } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .is('deleted_at', null)
    .maybeSingle();

  const orgId = org?.id || '11111111-1111-4111-8111-111111111111';

  // 1. Accounts
  const { data: accounts } = await admin
    .from('accounts')
    .select('id, name, balance, type')
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  const totalBalance = (accounts || []).reduce((acc, a) => acc + Number(a.balance), 0);

  // 2. Transactions
  const { data: txList } = await admin
    .from('transactions')
    .select(`
      id,
      description,
      amount,
      type,
      status,
      transaction_date,
      account:accounts (name)
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false });

  const transactions = (txList || []).map((t) => {
    const account = Array.isArray(t.account) ? t.account[0] : t.account;
    return {
      id: t.id,
      description: t.description || 'Transaksi Kas',
      amount: Number(t.amount),
      type: t.type as 'income' | 'expense' | 'transfer',
      status: t.status as 'draft' | 'pending_approval' | 'posted' | 'void',
      transactionDate: t.transaction_date,
      accountName: account?.name || 'Kas Tunai',
    };
  });

  const totalIncome = transactions
    .filter((t) => t.type === 'income' && t.status === 'posted')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense' && t.status === 'posted')
    .reduce((acc, t) => acc + t.amount, 0);

  // 3. Dues
  const { data: dueItems } = await admin
    .from('due_items')
    .select(`
      id,
      amount,
      status,
      plan:due_plans (title),
      member:organization_members (
        profile:profiles (
          full_name,
          house_number
        )
      ),
      payments (
        id
      )
    `)
    .eq('organization_id', orgId);

  const dues = (dueItems || []).map((d) => {
    const member = Array.isArray(d.member) ? d.member[0] : d.member;
    const profile = member?.profile ? (Array.isArray(member.profile) ? member.profile[0] : member.profile) : null;
    const plan = Array.isArray(d.plan) ? d.plan[0] : d.plan;
    const payments = Array.isArray(d.payments) ? d.payments : [];

    return {
      id: d.id,
      citizenName: profile?.full_name || 'Warga',
      houseNumber: profile?.house_number || '-',
      amount: Number(d.amount),
      status: d.status as 'paid' | 'pending_verification' | 'unpaid' | 'waived',
      planTitle: plan?.title || 'Iuran Bulanan',
      paymentId: payments[0]?.id,
    };
  });

  return {
    organizationId: orgId,
    totalBalance,
    totalIncome,
    totalExpense,
    transactions,
    dues,
    accounts: (accounts || []).map((a) => ({ id: a.id, name: a.name })),
  };
}

/**
 * People Page data loader
 */
export async function getPeopleData(orgSlug: string) {
  const admin = createAdminClient();

  const { data: org } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .is('deleted_at', null)
    .maybeSingle();

  const orgId = org?.id || '11111111-1111-4111-8111-111111111111';

  const { data, error } = await admin
    .from('organization_members')
    .select(`
      id,
      organization_id,
      profile_id,
      role_id,
      status,
      profile:profiles (
        id,
        full_name,
        phone,
        address,
        house_number,
        rt_number,
        rw_number,
        resident_status,
        is_unclaimed
      ),
      role:roles (
        id,
        name
      )
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error || !data) return { organizationId: orgId, members: [], roles: [] };

  // Fetch team associations
  const memberIds = data.map((d) => d.id);
  const teamMap: Record<string, string[]> = {};
  if (memberIds.length > 0) {
    const { data: teamData } = await admin
      .from('team_members')
      .select(`
        member_id,
        team:teams(name)
      `)
      .in('member_id', memberIds);

    if (teamData) {
      for (const tm of teamData) {
        const teamObj = Array.isArray(tm.team) ? tm.team[0] : tm.team;
        if (teamObj?.name) {
          if (!teamMap[tm.member_id]) teamMap[tm.member_id] = [];
          teamMap[tm.member_id].push(teamObj.name);
        }
      }
    }
  }

  // Fetch available roles
  const { data: roles } = await admin
    .from('roles')
    .select('id, name')
    .order('name');

  const members = data.map((d) => {
    const profile = Array.isArray(d.profile) ? d.profile[0] : d.profile;
    const role = Array.isArray(d.role) ? d.role[0] : d.role;
    return {
      id: d.id,
      fullName: profile?.full_name || 'Warga',
      phone: profile?.phone || null,
      houseNumber: profile?.house_number || profile?.address || '-',
      residentStatus: profile?.resident_status || 'tetap',
      roleName: role?.name || 'Member',
      isUnclaimed: profile?.is_unclaimed ?? true,
      teamNames: teamMap[d.id] || [],
    };
  });

  return {
    organizationId: orgId,
    members,
    roles: roles || [],
  };
}

/**
 * Activities Page data loader
 */
export async function getActivitiesData(orgSlug: string) {
  const admin = createAdminClient();

  const { data: org } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .is('deleted_at', null)
    .maybeSingle();

  const orgId = org?.id || '11111111-1111-4111-8111-111111111111';

  const { data: activities } = await admin
    .from('activities')
    .select(`
      id,
      title,
      description,
      status,
      start_date,
      end_date,
      budget_estimate
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('start_date', { ascending: true, nullsFirst: false });

  return {
    organizationId: orgId,
    activities: (activities || []).map((act) => ({
      id: act.id,
      title: act.title,
      description: act.description || undefined,
      status: act.status as 'draft' | 'planned' | 'active' | 'completed' | 'cancelled',
      startDate: act.start_date || undefined,
      budgetEstimate: Number(act.budget_estimate),
    })),
  };
}

/**
 * Activity Detail Page data loader
 */
export async function getActivityDetailData(orgSlug: string, activityId: string) {
  const admin = createAdminClient();

  const { data: org } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .is('deleted_at', null)
    .maybeSingle();

  const orgId = org?.id || '11111111-1111-4111-8111-111111111111';

  const { data: act } = await admin
    .from('activities')
    .select(`
      id,
      title,
      description,
      status,
      start_date,
      end_date,
      budget_estimate,
      pic_member_id,
      pic:organization_members!pic_member_id (
        profile:profiles (
          full_name,
          phone
        ),
        role:roles (
          name
        )
      )
    `)
    .eq('organization_id', orgId)
    .eq('id', activityId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!act) return null;

  const picMember = Array.isArray(act.pic) ? act.pic[0] : act.pic;
  const profile = picMember?.profile ? (Array.isArray(picMember.profile) ? picMember.profile[0] : picMember.profile) : null;
  const role = picMember?.role ? (Array.isArray(picMember.role) ? picMember.role[0] : picMember.role) : null;

  return {
    id: act.id,
    title: act.title,
    description: act.description,
    status: act.status,
    budgetEstimate: Number(act.budget_estimate),
    startDate: act.start_date,
    endDate: act.end_date,
    picName: profile?.full_name || 'Belum Ditugaskan',
    picRole: role?.name || 'Panitia',
  };
}

/**
 * Tasks Page data loader
 */
export async function getTasksData(orgSlug: string) {
  const admin = createAdminClient();

  const { data: org } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .is('deleted_at', null)
    .maybeSingle();

  const orgId = org?.id || '11111111-1111-4111-8111-111111111111';

  const { data: tasks } = await admin
    .from('tasks')
    .select(`
      id,
      title,
      description,
      status,
      priority,
      due_date,
      assignee:organization_members!assignee_id (
        profile:profiles (
          full_name
        )
      ),
      checklists:task_checklists (
        id,
        is_done
      )
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const formattedTasks = (tasks || []).map((t) => {
    const checklists = t.checklists || [];
    const assigneeMember = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee;
    const profile = assigneeMember?.profile ? (Array.isArray(assigneeMember.profile) ? assigneeMember.profile[0] : assigneeMember.profile) : null;

    return {
      id: t.id,
      title: t.title,
      description: t.description || undefined,
      status: t.status as 'todo' | 'in_progress' | 'done',
      priority: t.priority as 'low' | 'medium' | 'high' | 'urgent',
      dueDate: t.due_date ? t.due_date.split('T')[0] : undefined,
      totalChecklists: checklists.length > 0 ? checklists.length : undefined,
      completedChecklists: checklists.length > 0 ? checklists.filter((c: any) => c.is_done).length : undefined,
      assigneeName: profile?.full_name || undefined,
    };
  });

  return {
    organizationId: orgId,
    tasks: formattedTasks,
  };
}

/**
 * Documents Page data loader
 */
export async function getDocumentsData(orgSlug: string) {
  const admin = createAdminClient();

  const { data: org } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .is('deleted_at', null)
    .maybeSingle();

  const orgId = org?.id || '11111111-1111-4111-8111-111111111111';

  const { data: folders } = await admin
    .from('document_folders')
    .select('id, name')
    .eq('organization_id', orgId)
    .order('name');

  const { data: documents } = await admin
    .from('documents')
    .select('id, name, file_size, mime_type, created_at, folder_id')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return {
    organizationId: orgId,
    folders: (folders || []).map((f) => ({ id: f.id, name: f.name })),
    documents: (documents || []).map((d) => ({
      id: d.id,
      name: d.name,
      fileSize: d.file_size,
      mimeType: d.mime_type,
      createdAt: d.created_at ? d.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      folderId: d.folder_id || null,
    })),
  };
}
