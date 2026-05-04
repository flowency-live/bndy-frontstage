/**
 * White-label tenant configuration types
 *
 * This module is completely isolated from the main BNDY app.
 * To remove white-label functionality, delete the entire whitelabel/ folder.
 */

export interface TenantTheme {
  /** Main accent color (e.g., '#E53935' for red) */
  primary: string;
  /** Secondary accent color (e.g., '#FFD700' for gold) */
  secondary: string;
  /** Page background color */
  background: string;
  /** Primary text color */
  foreground: string;
}

export interface TenantLocation {
  /** Center point for radius filtering */
  center: { lat: number; lng: number };
  /** Radius in miles from center */
  radiusMiles: number;
  /** Initial map zoom level */
  initialZoom: number;
}

export interface TenantConfig {
  /** URL slug (e.g., 'klmasot') */
  id: string;
  /** Display name (e.g., 'KLMA Stoke') */
  name: string;
  /** Optional tagline */
  tagline?: string;
  /** Theme colors */
  theme: TenantTheme;
  /** Location filtering config */
  location: TenantLocation;
}

/**
 * API response shape for tenant config
 * Stored in DynamoDB with PK: TENANT#{slug}, SK: CONFIG
 */
export interface TenantConfigApiResponse {
  slug: string;
  location: TenantLocation;
  theme: TenantTheme;
  updatedAt: string;
}
