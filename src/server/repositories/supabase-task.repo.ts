import { createAdminClient } from '@/lib/supabase/admin';
import { TaskRepository } from '@/server/services/task.service';

export function createSupabaseTaskRepo(): TaskRepository {
  const supabase = createAdminClient();

  return {
    async findTaskById(organizationId: string, taskId: string) {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          organization_id,
          activity_id,
          assignee_id,
          title,
          description,
          status,
          priority,
          due_date,
          completed_at,
          assignee:organization_members!assignee_id (
            profile:profiles (
              full_name
            )
          )
        `)
        .eq('organization_id', organizationId)
        .eq('id', taskId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error || !data) return null;

      const assigneeMember = Array.isArray(data.assignee) ? data.assignee[0] : data.assignee;
      const profile = assigneeMember?.profile ? (Array.isArray(assigneeMember.profile) ? assigneeMember.profile[0] : assigneeMember.profile) : null;

      return {
        id: data.id,
        organizationId: data.organization_id,
        activityId: data.activity_id,
        assigneeId: data.assignee_id,
        assigneeName: profile?.full_name || null,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.due_date,
        completedAt: data.completed_at,
      };
    },

    async listTasks(organizationId: string, filters?: any) {
      let query = supabase
        .from('tasks')
        .select(`
          id,
          organization_id,
          activity_id,
          assignee_id,
          title,
          description,
          status,
          priority,
          due_date,
          completed_at,
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
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.activityId) {
        query = query.eq('activity_id', filters.activityId);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((t) => {
        const checklists = t.checklists || [];
        const totalChecklists = checklists.length;
        const completedChecklists = checklists.filter((c: any) => c.is_done).length;
        const assigneeMember = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee;
        const profile = assigneeMember?.profile ? (Array.isArray(assigneeMember.profile) ? assigneeMember.profile[0] : assigneeMember.profile) : null;

        return {
          id: t.id,
          organizationId: t.organization_id,
          activityId: t.activity_id,
          assigneeId: t.assignee_id,
          assigneeName: profile?.full_name || null,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.due_date ? t.due_date.split('T')[0] : undefined,
          totalChecklists,
          completedChecklists,
        };
      });
    },

    async createTask(data: any) {
      const { data: created, error } = await supabase
        .from('tasks')
        .insert({
          organization_id: data.organizationId,
          activity_id: data.activityId || null,
          assignee_id: data.assigneeId || null,
          title: data.title,
          description: data.description || null,
          status: data.status || 'todo',
          priority: data.priority || 'medium',
          due_date: data.dueDate || null,
        })
        .select('*')
        .single();

      if (error) throw error;
      return {
        id: created.id,
        organizationId: created.organization_id,
        title: created.title,
        status: created.status,
        priority: created.priority,
      };
    },

    async updateTask(organizationId: string, taskId: string, data: Record<string, any>) {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.assigneeId !== undefined) updateData.assignee_id = data.assigneeId;
      if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
      if (data.completedAt !== undefined) updateData.completed_at = data.completedAt;

      const { data: updated, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('organization_id', organizationId)
        .eq('id', taskId)
        .select('*')
        .single();

      if (error) throw error;
      return {
        id: updated.id,
        organizationId: updated.organization_id,
        title: updated.title,
        status: updated.status,
        priority: updated.priority,
      };
    },

    async softDeleteTask(organizationId: string, taskId: string, actorUserId: string) {
      const { error } = await supabase
        .from('tasks')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: actorUserId,
        })
        .eq('organization_id', organizationId)
        .eq('id', taskId);

      if (error) throw error;
      return true;
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

    async addChecklist(taskId: string, title: string) {
      const { data, error } = await supabase
        .from('task_checklists')
        .insert({
          task_id: taskId,
          title,
          is_done: false,
        })
        .select('*')
        .single();

      if (error) throw error;
      return {
        id: data.id,
        taskId: data.task_id,
        title: data.title,
        isDone: data.is_done,
      };
    },

    async updateChecklist(checklistItemId: string, data: Record<string, any>) {
      const updateData: Record<string, any> = {};
      if (data.isDone !== undefined) updateData.is_done = data.isDone;
      if (data.title !== undefined) updateData.title = data.title;

      const { data: updated, error } = await supabase
        .from('task_checklists')
        .update(updateData)
        .eq('id', checklistItemId)
        .select('*')
        .single();

      if (error) throw error;
      return {
        id: updated.id,
        taskId: updated.task_id,
        title: updated.title,
        isDone: updated.is_done,
      };
    },

    async listChecklists(taskId: string) {
      const { data, error } = await supabase
        .from('task_checklists')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error || !data) return [];
      return data.map((d) => ({
        id: d.id,
        taskId: d.task_id,
        title: d.title,
        isDone: d.is_done,
      }));
    },
  };
}
