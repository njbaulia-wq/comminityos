import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware, SECURITY_HEADERS, applySecurityHeaders } from '@/middleware';

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn().mockImplementation(async (_request) => {
    return {
      response: NextResponse.next(),
      user: null,
    };
  }),
}));

describe('OWASP Security Headers Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should define mandatory OWASP security headers', () => {
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
    expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    expect(SECURITY_HEADERS['Strict-Transport-Security']).toContain('max-age=31536000');
    expect(SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(SECURITY_HEADERS['Content-Security-Policy']).toContain("default-src 'self'");
    expect(SECURITY_HEADERS['Permissions-Policy']).toContain('camera=()');
    expect(SECURITY_HEADERS['Permissions-Policy']).toContain('microphone=()');
    expect(SECURITY_HEADERS['Permissions-Policy']).toContain('geolocation=()');
  });

  it('should apply all security headers to a NextResponse', () => {
    const res = NextResponse.next();
    const secured = applySecurityHeaders(res);

    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      expect(secured.headers.get(key)).toBe(value);
    }
  });

  it('should inject security headers into middleware responses for public routes', async () => {
    const req = new NextRequest('http://localhost:3000/login');
    const res = await middleware(req);

    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
  });

  it('should inject security headers when redirecting unauthenticated requests', async () => {
    const req = new NextRequest('http://localhost:3000/rt01/overview');
    const res = await middleware(req);

    expect(res.status).toBe(307); // Redirect status
    expect(res.headers.get('location')).toContain('/login');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
  });
});
