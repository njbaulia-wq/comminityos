import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export interface TenantRoutingParams {
  pathname: string;
  user: { id: string } | null;
  userOrgSlugs?: string[];
}

export function handleTenantRouting(params: TenantRoutingParams): {
  action: 'next' | 'redirect';
  destination?: string;
} {
  const { pathname, user, userOrgSlugs = [] } = params;

  // 1. Check if public path
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forbidden') ||
    pathname.startsWith('/api') ||
    pathname === '/'
  ) {
    return { action: 'next' };
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return { action: 'next' };
  }

  const orgSlug = segments[0];

  // 2. Require authentication
  if (!user) {
    return {
      action: 'redirect',
      destination: `/login?redirect=${encodeURIComponent(pathname)}`,
    };
  }

  // 3. Require tenant membership if org slugs are known
  if (userOrgSlugs.length > 0 && !userOrgSlugs.includes(orgSlug)) {
    return {
      action: 'redirect',
      destination: '/forbidden',
    };
  }

  return { action: 'next' };
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const routing = handleTenantRouting({
    pathname: request.nextUrl.pathname,
    user,
  });

  if (routing.action === 'redirect' && routing.destination) {
    return NextResponse.redirect(new URL(routing.destination, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
