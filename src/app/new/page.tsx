// src/app/new/page.tsx
// Event creation wizard page

'use client';

import { useRouter } from 'next/navigation';
import { EventWizard } from '@/components/wizard/EventWizard';

export default function NewEventPage() {
  const router = useRouter();

  const handleSuccess = (eventId: string) => {
    console.log('Event created:', eventId);
    // TODO: Navigate to event page
    alert(`Event created successfully! ID: ${eventId}`);
    router.push('/');
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <EventWizard
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
