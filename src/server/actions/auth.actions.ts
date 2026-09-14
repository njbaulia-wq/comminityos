'use server';

import { LoginInput, LoginSchema, SignupInput, SignupSchema } from '@/lib/validation/auth.schema';
import { ActionResult, successResult, handleServiceError } from '@/lib/errors/result';
import { ValidationError, UnauthorizedError } from '@/lib/errors';
import { createActionClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export interface AuthActionContext {
  client?: any;
  adminClient?: any;
  requestId?: string;
}

// Known seeded demo accounts that can be auto-claimed on initial login
const SEEDED_DEMO_EMAILS: Record<string, { profileId: string; fullName: string; defaultOrgSlug: string }> = {
  'bambang.rt05@communityos.local': {
    profileId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    fullName: 'Bambang Sudibyo',
    defaultOrgSlug: 'rt05-rw02',
  },
  'siti.rahma@communityos.local': {
    profileId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    fullName: 'Siti Rahma',
    defaultOrgSlug: 'rt05-rw02',
  },
  'agus.santoso@communityos.local': {
    profileId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    fullName: 'Agus Santoso',
    defaultOrgSlug: 'rt05-rw02',
  },
  'budi.kt@communityos.local': {
    profileId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    fullName: 'Budi Santoso',
    defaultOrgSlug: 'kt-muda-berkarya',
  },
};

export async function loginAction(
  rawInput: LoginInput,
  requestId = 'req-' + Math.random().toString(36).substring(7),
  context?: AuthActionContext
): Promise<ActionResult<{ user: { id: string; email: string }; defaultOrgSlug?: string }>> {
  try {
    const validation = LoginSchema.safeParse(rawInput);
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path.join('.') || 'root';
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      throw new ValidationError('Input login tidak valid', fieldErrors);
    }

    const { email, password } = validation.data;
    const supabase = context?.client || (await createActionClient());

    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If login failed, check if this is a seeded demo account that hasn't been claimed in auth.users yet
    if (authError && (SEEDED_DEMO_EMAILS[email.toLowerCase()] || email.endsWith('@communityos.local'))) {
      try {
        const admin = context?.adminClient || createAdminClient();
        const demoInfo = SEEDED_DEMO_EMAILS[email.toLowerCase()];

        // Try creating the demo user in Supabase auth
        const { data: createdUser } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: demoInfo?.fullName || 'Pengurus Demo' },
        });

        if (createdUser?.user) {
          // Link profile user_id
          if (demoInfo?.profileId) {
            await admin
              .from('profiles')
              .update({ user_id: createdUser.user.id })
              .eq('id', demoInfo.profileId);
          }

          // Now retry sign-in
          const retry = await supabase.auth.signInWithPassword({ email, password });
          if (retry.data?.user) {
            authData = retry.data;
            authError = null;
          }
        }
      } catch (claimErr) {
        logger.warn({
          module: 'auth',
          action: 'login.demo_claim_failed',
          requestId,
          message: 'Percobaan auto-claim akun demo tidak berhasil',
          error: claimErr instanceof Error ? claimErr.message : String(claimErr),
        });
      }
    }

    if (authError || !authData?.user) {
      throw new UnauthorizedError(
        authError?.message === 'Invalid login credentials'
          ? 'Email atau kata sandi tidak cocok. Silakan periksa kembali.'
          : authError?.message || 'Gagal masuk. Silakan periksa kredensial Anda.'
      );
    }

    // Determine user's active organization slug
    let defaultOrgSlug = SEEDED_DEMO_EMAILS[email.toLowerCase()]?.defaultOrgSlug || 'rt05-rw02';

    try {
      const admin = context?.adminClient || createAdminClient();
      const { data: memberData } = await admin
        .from('organization_members')
        .select('organizations(slug)')
        .eq('status', 'active')
        .limit(1);

      if (memberData && memberData.length > 0 && (memberData[0] as any).organizations?.slug) {
        defaultOrgSlug = (memberData[0] as any).organizations.slug;
      }
    } catch {
      // Keep defaultOrgSlug fallback
    }

    return successResult({
      user: {
        id: authData.user.id,
        email: authData.user.email || email,
      },
      defaultOrgSlug,
    });
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'auth',
      action: 'action.login',
      requestId,
    });
  }
}

export async function signupAction(
  rawInput: SignupInput,
  requestId = 'req-' + Math.random().toString(36).substring(7),
  context?: AuthActionContext
): Promise<ActionResult<{ user: { id: string; email: string; fullName: string }; defaultOrgSlug?: string }>> {
  try {
    const validation = SignupSchema.safeParse(rawInput);
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path.join('.') || 'root';
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      throw new ValidationError('Input pendaftaran tidak valid', fieldErrors);
    }

    const { fullName, email, password } = validation.data;
    const supabase = context?.client || (await createActionClient());
    let userId: string | null = null;

    // Prefer creating user via admin client if available (auto-confirms email so user is never blocked by unconfigured SMTP)
    try {
      const admin = context?.adminClient || createAdminClient();
      const { data: adminCreated, error: adminErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (adminCreated?.user) {
        userId = adminCreated.user.id;
      } else if (adminErr) {
        if (adminErr.message.toLowerCase().includes('already') || adminErr.message.toLowerCase().includes('registered')) {
          throw new ValidationError('Email sudah terdaftar. Silakan gunakan email lain atau masuk.');
        }
      }
    } catch (adminTryErr) {
      if (adminTryErr instanceof ValidationError) throw adminTryErr;
    }

    // If not created via admin, use regular signUp
    if (!userId) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (authError) {
        throw new ValidationError(
          authError.message === 'User already registered'
            ? 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.'
            : authError.message
        );
      }

      userId = authData?.user?.id || null;
    }

    if (!userId) {
      throw new ValidationError('Gagal mendaftarkan pengguna baru.');
    }

    // Auto sign-in if possible so session cookies are written to the browser
    try {
      await supabase.auth.signInWithPassword({ email, password });
    } catch {
      // Non-fatal if confirmation required
    }

    // Provision profile and attach to default demo organization (RT 05 RW 02)
    try {
      const admin = context?.adminClient || createAdminClient();

      const { data: profile } = await admin
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: fullName,
          is_unclaimed: false,
        })
        .select('id')
        .single();

      const profileId = profile?.id;

      if (profileId) {
        const { data: defaultOrg } = await admin
          .from('organizations')
          .select('id, slug')
          .eq('slug', 'rt05-rw02')
          .maybeSingle();

        if (defaultOrg) {
          const { data: memberRole } = await admin
            .from('roles')
            .select('id')
            .eq('name', 'Member')
            .maybeSingle();

          if (memberRole) {
            await admin
              .from('organization_members')
              .insert({
                organization_id: defaultOrg.id,
                profile_id: profileId,
                role_id: memberRole.id,
                status: 'active',
              })
              .onConflict('organization_id,profile_id')
              .ignore();
          }
        }
      }
    } catch (provisionErr) {
      logger.warn({
        module: 'auth',
        action: 'signup.profile_provision_failed',
        requestId,
        message: 'Gagal membuat relasi profil awal',
        error: provisionErr instanceof Error ? provisionErr.message : String(provisionErr),
      });
    }

    return successResult({
      user: {
        id: userId,
        email,
        fullName,
      },
      defaultOrgSlug: 'rt05-rw02',
    });
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'auth',
      action: 'action.signup',
      requestId,
    });
  }
}

export async function logoutAction(
  requestId = 'req-' + Math.random().toString(36).substring(7),
  context?: AuthActionContext
): Promise<ActionResult<{ loggedOut: boolean }>> {
  try {
    const supabase = context?.client || (await createActionClient());
    await supabase.auth.signOut();
    return successResult({ loggedOut: true });
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'auth',
      action: 'action.logout',
      requestId,
    });
  }
}
