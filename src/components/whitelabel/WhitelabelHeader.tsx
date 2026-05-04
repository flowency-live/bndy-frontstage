'use client';

/**
 * White-label header component
 *
 * Shows tenant branding and map/list toggle.
 * Does NOT show BNDY branding.
 */

import { Map, List } from 'lucide-react';
import { useWhitelabel } from './WhitelabelProvider';

interface WhitelabelHeaderProps {
  activeView: 'map' | 'list';
  onViewChange: (view: 'map' | 'list') => void;
}

export function WhitelabelHeader({ activeView, onViewChange }: WhitelabelHeaderProps) {
  const { tenant } = useWhitelabel();

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewChange('map')}
            className={`p-2 rounded-lg transition-colors ${
              activeView === 'map' ? 'opacity-100' : 'opacity-50'
            }`}
            style={{
              backgroundColor: activeView === 'map' ? `${tenant.theme.primary}22` : 'transparent',
              color: tenant.theme.primary,
            }}
            aria-label="Map view"
          >
            <Map className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewChange('list')}
            className={`p-2 rounded-lg transition-colors ${
              activeView === 'list' ? 'opacity-100' : 'opacity-50'
            }`}
            style={{
              backgroundColor: activeView === 'list' ? `${tenant.theme.primary}22` : 'transparent',
              color: tenant.theme.primary,
            }}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
