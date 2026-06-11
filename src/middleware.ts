import { NextRequest, NextResponse } from 'next/server';

/**
 * Extract subdomain from host for *.bndy.live white-label sites
 *
 * Valid subdomains: congleton.bndy.live, klmastoke.bndy.live, etc.
 * Returns null for: localhost, IP addresses, bndy.live root, other domains
 */
export function extractSubdomain(host: string | undefined | null): string | null {
  if (!host) return null;

  // Normalize to lowercase and remove port
  const hostname = host.toLowerCase().split(':')[0];

  // Skip localhost and IP addresses
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  ) {
    return null;
  }

  // Only process *.bndy.live domains
  if (!hostname.endsWith('.bndy.live')) {
    return null;
  }

  // Extract subdomain: "congleton.bndy.live" -> "congleton"
  const parts = hostname.split('.');

  // Must be exactly 3 parts: [subdomain, "bndy", "live"]
  if (parts.length !== 3) {
    return null;
  }

  const subdomain = parts[0];

  // Empty subdomain means it's the root domain
  if (!subdomain) {
    return null;
  }

  return subdomain;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  const subdomain = extractSubdomain(host);

  const response = NextResponse.next();

  // Set header for downstream consumption (layout, TenantContext)
  if (subdomain) {
    response.headers.set('x-tenant-subdomain', subdomain);
  }

  return response;
}

// Only run middleware on page routes, skip static assets and API
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - API routes (handled by their own logic)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
};
