import type { TenantConfig } from '../types';
import { klmasotConfig } from './klmasot';

/**
 * Registry of all white-label tenants
 *
 * To add a new tenant:
 * 1. Create a new config file (e.g., newtenant.ts)
 * 2. Import and add to tenantRegistry below
 * 3. Add subdomain to middleware.ts TENANT_SUBDOMAINS
 * 4. Add CORS entry in bndy-serverless-api/template.yaml
 */
const tenantRegistry: Record<string, TenantConfig> = {
  klmasot: klmasotConfig,
};

/**
 * Get tenant config by slug
 * @returns TenantConfig or null if not found
 */
export function getTenantConfig(slug: string): TenantConfig | null {
  return tenantRegistry[slug.toLowerCase()] ?? null;
}

/**
 * Get all registered tenant slugs
 * Used for static generation and middleware
 */
export function getAllTenantSlugs(): string[] {
  return Object.keys(tenantRegistry);
}

/**
 * Check if a slug is a valid tenant
 */
export function isValidTenant(slug: string): boolean {
  return slug.toLowerCase() in tenantRegistry;
}
