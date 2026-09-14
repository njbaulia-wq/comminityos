import { createAdminClient } from '@/lib/supabase/admin';
import { ActivityRepository } from '@/server/services/activity.service';

export function createSupabaseActivityRepo(): ActivityRepository {
  const supabase = createAdminClient();

  return {
    async findById(organizationId: string, activityId: string) {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          id,
          organization_id,
          title,
          description,
          start_date,
          end_date,
          status,
          budget_estimate,
          pic_member_id,
          pic:organization_members!pic_member_id (
            id,
            profile:profiles (
              full_name
            )
          )
        `)
        .eq('organization_id', organizationId)
        .eq('id', activityId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error || !data) return null;

      const picMember = Array.isArray(data.pic) ? data.pic[0] : data.pic;
      const picProfile = picMember?.profile ? (Array.isArray(picMember.profile) ? picMember.profile[0] : picMember.profile) : null;

      return {
        id: data.id,
        organizationId: data.organization_id,
        title: data.title,
        description: data.description,
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status,
        budgetEstimate: Number(data.budget_estimate),
        picMemberId: data.pic_member_id,
        picName: picProfile?.full_name || null,
      };
    },

    async findMember(organizationId: string, memberId: string) {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, status, deleted_at')
        .eq('organization_id', organizationId)
        .eq('id', memberId)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        status: data.status,
        deletedAt: data.deleted_at,
        isArchived: data.status === 'archived' || !!data.deleted_at,
      };
    },

    async list(organizationId: string, filters?: any) {
      let query = supabase
        .from('activities')
        .select(`
          id,
          organization_id,
          title,
          description,
          start_date,
          end_date,
          status,
          budget_estimate,
          pic_member_id,
          created_at
        `)
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('start_date', { ascending: true, nullsFirst: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((d) => ({
        id: d.id,
        organizationId: d.organization_id,
        title: d.title,
        description: d.description,
        startDate: d.start_date,
        endDate: d.end_date,
        status: d.status,
        budgetEstimate: Number(d.budget_estimate),
        picMemberId: d.pic_member_id,
      }));
    },

    async create(data: any) {
      const { data: created, error } = await supabase
        .from('activities')
        .insert({
          organization_id: data.organizationId,
          title: data.title,
          description: data.description || null,
          start_date: data.startDate || null,
          end_date: data.endDate || null,
          status: data.status || 'draft',
          budget_estimate: data.budgetEstimate || 0,
          pic_member_id: data.picMemberId || null,
        })
        .select('*')
        .single();

      if (error) throw error;
      return {
        id: created.id,
        organizationId: created.organization_id,
        title: created.title,
        description: created.description,
        startDate: created.start_date,
        endDate: created.end_date,
        status: created.status,
        budgetEstimate: Number(created.budget_estimate),
      };
    },

    async update(organizationId: string, activityId: string, data: Record<string, any>) {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.startDate !== undefined) updateData.start_date = data.startDate;
      if (data.endDate !== undefined) updateData.end_date = data.endDate;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.budgetEstimate !== undefined) updateData.budget_estimate = data.budgetEstimate;
      if (data.picMemberId !== undefined) updateData.pic_member_id = data.picMemberId;

      const { data: updated, error } = await supabase
        .from('activities')
        .update(updateData)
        .eq('organization_id', organizationId)
        .eq('id', activityId)
        .select('*')
        .single();

      if (error) throw error;
      return {
        id: updated.id,
        organizationId: updated.organization_id,
        title: updated.title,
        status: updated.status,
        budgetEstimate: Number(updated.budget_estimate),
      };
    },

    async softDelete(organizationId: string, activityId: string, actorUserId: string) {
      const { error } = await supabase
        .from('activities')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: actorUserId,
        })
        .eq('organization_id', organizationId)
        .eq('id', activityId);

      if (error) throw error;
      return true;
    },

    async addMember(activityId: string, memberId: string, roleInActivity?: string | null) {
      const { data, error } = await supabase
        .from('activity_members')
        .insert({
          activity_id: activityId,
          member_id: memberId,
          role_in_activity: roleInActivity || null,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },

    async removeMember(activityId: string, memberId: string) {
      const { error } = await supabase
        .from('activity_members')
        .delete()
        .eq('activity_id', activityId)
        .eq('member_id', memberId);

      if (error) throw error;
    },

    async listMembers(activityId: string) {
      const { data, error } = await supabase
        .from('activity_members')
        .select(`
          activity_id,
          member_id,
          role_in_activity,
          member:organization_members (
            profile:profiles (
              full_name,
              phone
            )
          )
        `)
        .eq('activity_id', activityId);

      if (error || !data) return [];
      return data.map((d) => {
        const member = Array.isArray(d.member) ? d.member[0] : d.member;
        const profile = member?.profile ? (Array.isArray(member.profile) ? member.profile[0] : member.profile) : null;
        return {
          memberId: d.member_id,
          roleInActivity: d.role_in_activity,
          fullName: profile?.full_name || '',
          phone: profile?.phone || '',
        };
      });
    },
  };
}
