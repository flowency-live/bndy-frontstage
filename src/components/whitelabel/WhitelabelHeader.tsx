'use client';

/**
 * White-label header component
 *
 * Shows tenant branding and map/list/venue toggles.
 * Uses ViewToggleContext for view state.
 * Does NOT show BNDY branding.
 */

import { Map, List, Building, Calendar } from 'lucide-react';
import { useWhitelabel } from './WhitelabelProvider';
import { useViewToggle } from '@/context/ViewToggleContext';

export function WhitelabelHeader() {
  const { tenant } = useWhitelabel();
  const { activeView, setActiveView, mapMode, setMapMode } = useViewToggle();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
      style={{
        backgroundColor: tenant.theme.background,
        borderBottom: `1px solid ${tenant.theme.primary}33`,
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Tenant branding */}
        <div className="flex flex-col">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: tenant.theme.primary }}
          >
            {tenant.name}
          </h1>
          {tenant.tagline && (
            <p
              className="text-xs opacity-80"
              style={{ color: tenant.theme.secondary }}
            >
              {tenant.tagline}
            </p>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1">
          {/* Events Map */}
          <button
            onClick={() => {
              setActiveView('map');
              setMapMode('events');
            }}
            className={`p-2 rounded-lg transition-colors ${
              activeView === 'map' && mapMode === 'events' ? 'opacity-100' : 'opacity-50'
            }`}
            style={{
              backgroundColor: activeView === 'map' && mapMode === 'events' ? `${tenant.theme.primary}22` : 'transparent',
              color: tenant.theme.primary,
            }}
            aria-label="Events map view"
            title="Events Map"
          >
            <Calendar className="w-5 h-5" />
          </button>

          {/* Venues Map */}
          <button
            onClick={() => {
              setActiveView('map');
              setMapMode('venues');
            }}
            className={`p-2 rounded-lg transition-colors ${
              activeView === 'map' && mapMode === 'venues' ? 'opacity-100' : 'opacity-50'
            }`}
            style={{
              backgroundColor: activeView === 'map' && mapMode === 'venues' ? `${tenant.theme.primary}22` : 'transparent',
              color: tenant.theme.primary,
            }}
            aria-label="Venues map view"
            title="Venues Map"
          >
            <Building className="w-5 h-5" />
          </button>

          {/* List View */}
          <button
            onClick={() => setActiveView('list')}
            className={`p-2 rounded-lg transition-colors ${
              activeView === 'list' ? 'opacity-100' : 'opacity-50'
            }`}
            style={{
              backgroundColor: activeView === 'list' ? `${tenant.theme.primary}22` : 'transparent',
              color: tenant.theme.primary,
            }}
            aria-label="List view"
            title="List View"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
