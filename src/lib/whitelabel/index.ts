/**
 * White-label module index
 *
 * All exports for white-label functionality.
 * To remove white-label functionality, delete this entire folder.
 */

// Types
export type { TenantConfig, TenantTheme, TenantLocation, TenantConfigApiResponse } from './types';

// Tenant registry
export { getTenantConfig, getAllTenantSlugs, isValidTenant } from './tenants';

// Hooks
export { useWhitelabelEvents, type WhitelabelEvent } from './hooks/useWhitelabelEvents';
