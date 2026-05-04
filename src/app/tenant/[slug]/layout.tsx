/**
 * White-label tenant layout
 *
 * Reuses main BNDY components (MapView, ListView) with tenant theming.
 * Does NOT use main Header/Footer - has its own branded versions.
 *
 * Provider hierarchy:
 * - Providers (React Query)
 * - ViewToggleProvider (view state)
 * - MapboxProvider (map instance)
 * - WhitelabelProvider (tenant context + CSS variables)
 * - WhitelabelEventsProvider (EventsContext with tenant location)
 */

import { notFound } from 'next/navigation';
import { getTenantConfig, getAllTenantSlugs } from '@/lib/whitelabel/tenants';
import { WhitelabelProvider } from '@/components/whitelabel/WhitelabelProvider';
import { WhitelabelEventsProvider } from '@/components/whitelabel/WhitelabelEventsProvider';
import { Providers } from '@/app/providers';
import { MapboxProvider } from '@/context/MapboxContext';
import { ViewToggleProvider } from '@/context/ViewToggleContext';
import type { Metadata } from 'next';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Generate static params for known tenants
 * Enables static generation for tenant routes
 */
export async function generateStaticParams() {
  return getAllTenantSlugs().map((slug) => ({ slug }));
}

/**
 * Generate metadata for tenant page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = getTenantConfig(slug);

  if (!tenant) {
    return { title: 'Not Found' };
  }

  return {
    title: tenant.name,
    description: tenant.tagline || `Live music events - ${tenant.name}`,
    themeColor: tenant.theme.background,
  };
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { slug } = await params;
  const tenant = getTenantConfig(slug);

  // 404 for unknown tenants
  if (!tenant) {
    notFound();
  }

  return (
    <Providers>
      <ViewToggleProvider>
        <MapboxProvider>
          <WhitelabelProvider tenant={tenant}>
            <WhitelabelEventsProvider>
              <div
                className="min-h-screen flex flex-col"
                style={{
                  backgroundColor: tenant.theme.background,
                  color: tenant.theme.foreground,
                }}
              >
                {children}
              </div>
            </WhitelabelEventsProvider>
          </WhitelabelProvider>
        </MapboxProvider>
      </ViewToggleProvider>
    </Providers>
  );
}
