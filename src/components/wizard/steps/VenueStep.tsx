// src/components/wizard/steps/VenueStep.tsx
// Placeholder venue step for testing wizard flow

'use client';

import type { EventWizardFormData, Venue } from '@/lib/types';

interface VenueStepProps {
  formData: EventWizardFormData;
  onUpdate: (data: Partial<EventWizardFormData>) => void;
  onNext: () => void;
}

export function VenueStep({ formData, onUpdate, onNext }: VenueStepProps) {
  const handleSelectVenue = () => {
    // Mock venue for testing
    const mockVenue: Venue = {
      id: 'test-venue-1',
      name: 'Test Venue',
      address: '123 Test St',
      location: { lat: 51.5074, lng: -0.1278 },
      validated: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onUpdate({ venue: mockVenue });
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Choose a Venue</h2>
        <p className="text-gray-600">
          {formData.venue
            ? `Selected: ${formData.venue.name}`
            : 'Select a venue for your event'}
        </p>

        {!formData.venue ? (
          <button
            onClick={handleSelectVenue}
            className="w-full rounded-lg bg-orange-500 px-6 py-4 text-white transition-colors hover:bg-orange-600"
          >
            Select Test Venue
          </button>
        ) : (
          <button
            onClick={onNext}
            className="w-full rounded-lg bg-orange-500 px-6 py-4 text-white transition-colors hover:bg-orange-600"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
