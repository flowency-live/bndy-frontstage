import type { TenantConfig } from '../types';

/**
 * KLMAStoke (Keep Live Music Alive - Stoke-on-Trent)
 *
 * Theme: Black background with red/yellow accents
 * Location: 15 mile radius from Stoke-on-Trent city center
 */
export const klmasotConfig: TenantConfig = {
  id: 'klmasot',
  name: 'KLMA Stoke',
  tagline: 'Keep Live Music Alive in Stoke-on-Trent',

  theme: {
    primary: '#E53935',      // Red
    secondary: '#FFD700',    // Yellow/Gold
    background: '#000000',   // Black
    foreground: '#FFFFFF',   // White
  },

  location: {
    center: { lat: 53.0027, lng: -2.1794 },  // Stoke-on-Trent
    radiusMiles: 15,
    initialZoom: 10,
  },
};
