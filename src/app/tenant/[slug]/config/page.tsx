/**
 * White-label configuration page
 *
 * Hidden URL: klmasot.bndy.co.uk/config
 * Allows configuring center point and radius for event filtering.
 */

import { notFound } from 'next/navigation';
import { getTenantConfig } from '@/lib/whitelabel/tenants';
import { ConfigPanel } from '@/components/whitelabel/ConfigPanel';

interface ConfigPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ConfigPage({ params }: ConfigPageProps) {
  const { slug } = await params;
  const tenant = getTenantConfig(slug);

  if (!tenant) {
    notFound();
  }

  return <ConfigPanel />;
}
