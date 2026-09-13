import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../env';
import { ForbiddenError } from '../errors';

export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new ForbiddenError('Admin client (service role) dilarang dijalankan pada client-side');
  }

  const env = getEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
