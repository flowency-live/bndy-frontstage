'use client';

/**
 * White-label homepage component
 *
 * Self-contained view that doesn't rely on main BNDY contexts.
 * Has its own map/list toggle state.
 */

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWhitelabel } from './WhitelabelProvider';
import { WhitelabelHeader } from './WhitelabelHeader';
import { WhitelabelFooter } from './WhitelabelFooter';
import { WhitelabelList } from './WhitelabelList';

// Dynamically import map with SSR disabled
const WhitelabelMapNoSSR = dynamic(() => import('./WhitelabelMap').then(m => m.WhitelabelMap), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-pulse">Loading map...</div>
    </div>
  ),
});

type ViewMode = 'map' | 'list';

export function WhitelabelHome() {
  const { tenant } = useWhitelabel();
  const [activeView, setActiveView] = useState<ViewMode>('map');

  return (
    <div className="flex flex-col min-h-screen">
      <WhitelabelHeader
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <main className="flex-1 mt-20">
        {activeView === 'map' ? (
          <WhitelabelMapNoSSR />
        ) : (
          <WhitelabelList />
        )}
      </main>

      <WhitelabelFooter />
    </div>
  );
}
