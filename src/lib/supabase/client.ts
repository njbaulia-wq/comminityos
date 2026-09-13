import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import { getEnv } from '../env';

export function createBrowserClient() {
  const env = getEnv();
  return createSupabaseBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
