/**
 * Next.js Middleware for white-label subdomain routing
 *
 * Detects tenant subdomains and rewrites to internal tenant routes.
 *
 * Example:
 *   klmasot.bndy.co.uk/       → /tenant/klmasot
 *   klmasot.bndy.co.uk/config → /tenant/klmasot/config
 *   live.bndy.co.uk/          → / (no rewrite, main BNDY app)
 *
 * To add a new tenant:
 * 1. Add subdomain to TENANT_SUBDOMAINS below
 * 2. Create tenant config in src/lib/whitelabel/tenants/
 * 3. Add CORS entry in bndy-serverless-api/template.yaml
 *
 * To remove white-label functionality:
 * 1. Delete this file
 * 2. Delete src/app/(whitelabel)/ folder
 * 3. Delete src/lib/whitelabel/ folder
 * 4. Delete src/components/whitelabel/ folder
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * List of valid tenant subdomains
 * Must match tenant IDs in src/lib/whitelabel/tenants/
 */
const TENANT_SUBDOMAINS = ['klmasot'];

/**
 * Subdomains that should NOT be treated as tenants
 * These are part of the main BNDY app
 */
const IGNORED_SUBDOMAINS = [
  'live',
  'www',
  'frontstage',
  'backstage',
  'localhost',
  '127',
];

export function middleware(request: NextRequest) {
  // Check x-forwarded-host first (used by AWS CloudFront/Amplify), then fall back to host
  const hostname = request.headers.get('x-forwarded-host')
    || request.headers.get('host')
    || '';

  // Extract subdomain (first part before first dot)
  const subdomain = hostname.split('.')[0].toLowerCase();

  // Skip if it's an ignored subdomain (main BNDY domains)
  if (IGNORED_SUBDOMAINS.some((ignored) => subdomain.startsWith(ignored))) {
    return NextResponse.next();
  }

  // Only handle known tenant subdomains
  if (TENANT_SUBDOMAINS.includes(subdomain)) {
    // Rewrite to internal tenant route
    const url = request.nextUrl.clone();
    url.pathname = `/tenant/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Unknown subdomain - let it pass through (will 404 if no matching route)
  return NextResponse.next();
}

/**
 * Matcher config - which paths the middleware runs on
 * Excludes static files, API routes, and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
