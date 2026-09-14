import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getEnv } from '../env';

export interface CookieStoreAdapter {
  getAll(): Array<{ name: string; value: string }>;
  setAll?(cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>): void;
  set?(name: string, value: string, options?: Record<string, unknown>): void;
}

export function createServerClient(cookieStore?: CookieStoreAdapter) {
  const env = getEnv();

  return createSupabaseServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          if (!cookieStore) return [];
          if (typeof cookieStore.getAll === 'function') {
            return cookieStore.getAll();
          }
          return [];
        },
        setAll(cookiesToSet) {
          if (!cookieStore) return;
          try {
            if (typeof cookieStore.setAll === 'function') {
              cookieStore.setAll(cookiesToSet);
            } else if (typeof cookieStore.set === 'function') {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set!(name, value, options);
              });
            }
          } catch {
            // Ignored when called from Server Component (read-only cookie context)
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client configured for Next.js Server Actions and Route Handlers.
 * Automatically extracts cookies from `next/headers`.
 */
export async function createActionClient() {
  const cookieStore = await cookies();
  return createServerClient(cookieStore as unknown as CookieStoreAdapter);
}
