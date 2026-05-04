'use client';

/**
 * White-label Events Provider
 *
 * Wraps EventsProvider and initializes it with tenant-specific values.
 * Overrides the default location/radius with tenant configuration.
 * Prevents geolocation from overriding tenant center.
 */

import { useEffect } from 'react';
import { EventsProvider, useEvents } from '@/context/EventsContext';
import { useWhitelabel } from './WhitelabelProvider';

/**
 * Inner component that sets tenant location after EventsProvider mounts
 */
function TenantLocationInitializer({ children }: { children: React.ReactNode }) {
  const { tenant } = useWhitelabel();
  const { setSelectedLocation, setRadius } = useEvents();

  useEffect(() => {
    // Set tenant location and radius on mount
    // This overrides any default or geolocation values
    setSelectedLocation({
      lat: tenant.location.center.lat,
      lng: tenant.location.center.lng,
      name: tenant.name,
    });
    setRadius(tenant.location.radiusMiles);
  }, [tenant, setSelectedLocation, setRadius]);

  return <>{children}</>;
}

/**
 * WhitelabelEventsProvider
 *
 * Provides EventsContext with tenant-specific initialization.
 * Must be used inside WhitelabelProvider.
 */
export function WhitelabelEventsProvider({ children }: { children: React.ReactNode }) {
  return (
    <EventsProvider>
      <TenantLocationInitializer>{children}</TenantLocationInitializer>
    </EventsProvider>
  );
}
