import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { getEnv } from '../env';

export interface CookieStoreAdapter {
  getAll(): Array<{ name: string; value: string }>;
  setAll?(cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>): void;
}

export function createServerClient(cookieStore?: CookieStoreAdapter) {
  const env = getEnv();

  return createSupabaseServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore?.getAll() ?? [];
        },
        setAll(cookiesToSet) {
          try {
            cookieStore?.setAll?.(cookiesToSet);
          } catch {
            // Ignored when called from Server Component (read-only cookie context)
          }
        },
      },
    }
  );
}
