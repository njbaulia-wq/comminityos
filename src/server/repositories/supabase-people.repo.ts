import { createAdminClient } from '@/lib/supabase/admin';
import { PeopleRepository } from '@/server/services/people.service';

export function createSupabasePeopleRepo(): PeopleRepository {
  const supabase = createAdminClient();

  return {
    async findMemberById(organizationId: string, memberId: string) {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          profile_id,
          role_id,
          status,
          created_at,
          profile:profiles (
            id,
            user_id,
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
        .eq('organization_id', organizationId)
        .eq('id', memberId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error || !data) return null;

      const profile = Array.isArray(data.profile) ? data.profile[0] : data.profile;
      const role = Array.isArray(data.role) ? data.role[0] : data.role;

      return {
        id: data.id,
        organizationId: data.organization_id,
        profileId: data.profile_id,
        roleId: data.role_id,
        roleName: role?.name || 'Member',
        fullName: profile?.full_name || '',
        phone: profile?.phone || null,
        address: profile?.address || null,
        houseNumber: profile?.house_number || null,
        rtNumber: profile?.rt_number || null,
        rwNumber: profile?.rw_number || null,
        residentStatus: profile?.resident_status || 'tetap',
        isUnclaimed: profile?.is_unclaimed || false,
        status: data.status,
      };
    },

    async findMemberByPhone(organizationId: string, phone: string) {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          profile:profiles!inner (
            id,
            phone
          )
        `)
        .eq('organization_id', organizationId)
        .eq('profile.phone', phone)
        .is('deleted_at', null)
        .maybeSingle();

      if (error || !data) return null;
      return { id: data.id, organizationId: data.organization_id };
    },

    async listMembers(organizationId: string, filters?: { search?: string; status?: string; teamId?: string }) {
      let query = supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          profile_id,
          role_id,
          status,
          created_at,
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
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      // Also get team assignments for these members
      const memberIds = data.map((d) => d.id);
      let teamMap: Record<string, string[]> = {};
      if (memberIds.length > 0) {
        const { data: teamData } = await supabase
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

      return data.map((d) => {
        const profile = Array.isArray(d.profile) ? d.profile[0] : d.profile;
        const role = Array.isArray(d.role) ? d.role[0] : d.role;
        return {
          id: d.id,
          organizationId: d.organization_id,
          profileId: d.profile_id,
          roleId: d.role_id,
          roleName: role?.name || 'Member',
          fullName: profile?.full_name || '',
          phone: profile?.phone || null,
          address: profile?.address || null,
          houseNumber: profile?.house_number || null,
          rtNumber: profile?.rt_number || null,
          rwNumber: profile?.rw_number || null,
          residentStatus: profile?.resident_status || 'tetap',
          isUnclaimed: profile?.is_unclaimed ?? true,
          teamNames: teamMap[d.id] || [],
          status: d.status,
        };
      });
    },

    async createMemberWithProfile(data) {
      // 1. Insert Profile
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .insert({
          user_id: data.userId || null,
          full_name: data.fullName,
          phone: data.phone || null,
          address: data.address || null,
          house_number: data.houseNumber || null,
          rt_number: data.rtNumber || null,
          rw_number: data.rwNumber || null,
          resident_status: data.residentStatus || 'tetap',
          is_unclaimed: !data.userId,
        })
        .select('*')
        .single();

      if (pErr || !profile) throw pErr || new Error('Gagal menyimpan profil warga');

      // 2. Insert Organization Member
      const { data: member, error: mErr } = await supabase
        .from('organization_members')
        .insert({
          organization_id: data.organizationId,
          profile_id: profile.id,
          role_id: data.roleId,
          status: 'active',
        })
        .select('*')
        .single();

      if (mErr || !member) throw mErr || new Error('Gagal menambahkan anggota ke organisasi');

      return {
        id: member.id,
        organizationId: member.organization_id,
        profileId: profile.id,
        roleId: data.roleId,
        fullName: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        houseNumber: profile.house_number,
        residentStatus: profile.resident_status,
        isUnclaimed: profile.is_unclaimed,
        status: member.status,
      };
    },

    async updateMemberProfile(organizationId, memberId, data) {
      const { data: mem, error: mErr } = await supabase
        .from('organization_members')
        .select('profile_id')
        .eq('organization_id', organizationId)
        .eq('id', memberId)
        .single();

      if (mErr || !mem) throw mErr || new Error('Anggota tidak ditemukan');

      const updateData: Record<string, any> = {};
      if (data.fullName !== undefined) updateData.full_name = data.fullName;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.houseNumber !== undefined) updateData.house_number = data.houseNumber;
      if (data.rtNumber !== undefined) updateData.rt_number = data.rtNumber;
      if (data.rwNumber !== undefined) updateData.rw_number = data.rwNumber;
      if (data.residentStatus !== undefined) updateData.resident_status = data.residentStatus;

      const { data: updated, error: uErr } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', mem.profile_id)
        .select('*')
        .single();

      if (uErr) throw uErr;
      return { id: memberId, ...updated };
    },

    async softDeleteMember(organizationId, memberId, actorUserId) {
      const { error } = await supabase
        .from('organization_members')
        .update({
          status: 'archived',
          deleted_at: new Date().toISOString(),
          deleted_by: actorUserId,
        })
        .eq('organization_id', organizationId)
        .eq('id', memberId);

      if (error) throw error;
      return true;
    },

    async findTeamById(organizationId, teamId) {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', teamId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) return null;
      return data;
    },

    async findTeamByName(organizationId, name) {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', organizationId)
        .ilike('name', name)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) return null;
      return data;
    },

    async listTeams(organizationId) {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', organizationId)
        .is('deleted_at', null);

      if (error) return [];
      return data;
    },

    async createTeam(data) {
      const { data: team, error } = await supabase
        .from('teams')
        .insert({
          organization_id: data.organizationId,
          name: data.name,
          description: data.description || null,
        })
        .select('*')
        .single();

      if (error) throw error;
      return team;
    },

    async assignMemberToTeam(teamId, memberId) {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          member_id: memberId,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },

    async removeMemberFromTeam(teamId, memberId) {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('member_id', memberId);

      if (error) throw error;
    },
  };
}
