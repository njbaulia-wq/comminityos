import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBrowserClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';

describe('Supabase Client Infrastructure', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key-12345';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key-99999';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  it('should create browser client using anon key and public url', () => {
    const client = createBrowserClient();
    expect(client).toBeDefined();
    expect(typeof client.auth.getSession).toBe('function');
  });

  it('should create admin client with service role key', () => {
    const adminClient = createAdminClient();
    expect(adminClient).toBeDefined();
    expect(typeof adminClient.auth.admin.getUserById).toBe('function');
  });
});
