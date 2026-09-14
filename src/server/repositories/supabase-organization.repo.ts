import { createAdminClient } from '@/lib/supabase/admin';
import { OrganizationRepository } from '@/server/services/organization.service';

export function createSupabaseOrganizationRepo(): OrganizationRepository {
  const supabase = createAdminClient();

  return {
    async findBySlug(slug: string) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async create(data: { name: string; slug: string; template: string; settings?: Record<string, any> }) {
      const { data: created, error } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: data.slug,
          template: data.template,
          settings: data.settings || {},
        })
        .select('*')
        .single();

      if (error) throw error;
      return created;
    },

    async createMembership(data: { organizationId: string; userId: string; roleName: string }) {
      // Find role by name
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', data.roleName)
        .single();

      if (roleError || !role) {
        throw new Error(`Role "${data.roleName}" tidak ditemukan`);
      }

      // Find or create profile for userId
      let profileId: string;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', data.userId)
        .maybeSingle();

      if (profile) {
        profileId = profile.id;
      } else {
        const { data: newProfile, error: pErr } = await supabase
          .from('profiles')
          .insert({
            user_id: data.userId,
            full_name: 'Pengurus Baru',
            is_unclaimed: false,
          })
          .select('id')
          .single();

        if (pErr || !newProfile) throw pErr || new Error('Gagal membuat profil pengurus');
        profileId = newProfile.id;
      }

      const { data: member, error: mErr } = await supabase
        .from('organization_members')
        .insert({
          organization_id: data.organizationId,
          profile_id: profileId,
          role_id: role.id,
          status: 'active',
        })
        .select('*')
        .single();

      if (mErr) throw mErr;
      return member;
    },
  };
}
