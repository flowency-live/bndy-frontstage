'use client';

/**
 * White-label homepage component
 *
 * Reuses the main BNDY MapView and ListView with tenant theming.
 * Uses ViewToggleContext for view state (provided by layout).
 */

import dynamic from 'next/dynamic';
import { useViewToggle } from '@/context/ViewToggleContext';
import { WhitelabelHeader } from './WhitelabelHeader';
import { WhitelabelFooter } from './WhitelabelFooter';
import ListView from '@/components/ListView';

// Dynamically import MapView with SSR disabled (same as main app)
const MapViewNoSSR = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-pulse">Loading map...</div>
    </div>
  ),
});

export function WhitelabelHome() {
  const { activeView } = useViewToggle();

  return (
    <div className="flex flex-col min-h-screen">
      <WhitelabelHeader />

      <main className="flex-1 mt-20">
        {/* Key forces remount when view changes (same as main app) */}
        <div key={`view-${activeView}`}>
          {activeView === 'map' ? <MapViewNoSSR /> : <ListView />}
        </div>
      </main>

      <WhitelabelFooter />
    </div>
  );
}
