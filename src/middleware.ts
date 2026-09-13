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

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  'X-DNS-Prefetch-Control': 'on',
};

export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const routing = handleTenantRouting({
    pathname: request.nextUrl.pathname,
    user,
  });

  if (routing.action === 'redirect' && routing.destination) {
    const redirectResponse = NextResponse.redirect(new URL(routing.destination, request.url));
    return applySecurityHeaders(redirectResponse);
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
