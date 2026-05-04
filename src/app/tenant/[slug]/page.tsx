/**
 * White-label tenant homepage
 *
 * Displays events map/list for the tenant's configured location.
 */

import { notFound } from 'next/navigation';
import { getTenantConfig } from '@/lib/whitelabel/tenants';
import { WhitelabelHome } from '@/components/whitelabel/WhitelabelHome';

interface TenantPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { slug } = await params;
  const tenant = getTenantConfig(slug);

  if (!tenant) {
    notFound();
  }

  return <WhitelabelHome />;
}
