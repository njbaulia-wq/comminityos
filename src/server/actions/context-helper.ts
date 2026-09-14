import { createActionClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ResolvedContext {
  userId: string;
  roleName: string;
  requestId: string;
}

export async function resolveCallerContext(
  organizationId: string,
  explicitContext?: {
    userId?: string;
    roleName?: string;
    requestId?: string;
  }
): Promise<ResolvedContext> {
  const requestId =
    explicitContext?.requestId || 'req-' + Math.random().toString(36).substring(7);

  if (explicitContext?.userId && explicitContext?.roleName) {
    return {
      userId: explicitContext.userId,
      roleName: explicitContext.roleName,
      requestId,
    };
  }

  // Fallback to active session
  try {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from('profiles')
        .select(`
          id,
          members:organization_members (
            organization_id,
            role:roles (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      const members = Array.isArray(profile?.members) ? profile.members : [];
      const currentMember = members.find((m: any) => m.organization_id === organizationId);
      const roleObj = Array.isArray(currentMember?.role) ? currentMember.role[0] : currentMember?.role;
      const roleName = roleObj?.name || explicitContext?.roleName || 'Admin';

      return {
        userId: user.id,
        roleName,
        requestId,
      };
    }
  } catch {
    // In test or non-cookie environment
  }

  return {
    userId: explicitContext?.userId || 'usr-system',
    roleName: explicitContext?.roleName || 'Admin',
    requestId,
  };
}
