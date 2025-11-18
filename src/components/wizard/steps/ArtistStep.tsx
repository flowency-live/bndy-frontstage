// src/components/wizard/steps/ArtistStep.tsx
// Placeholder artist step for testing wizard flow

'use client';

import type { EventWizardFormData, Artist } from '@/lib/types';

interface ArtistStepProps {
  formData: EventWizardFormData;
  onUpdate: (data: Partial<EventWizardFormData>) => void;
  onNext: () => void;
}

export function ArtistStep({ formData, onUpdate, onNext }: ArtistStepProps) {
  const handleSelectArtist = () => {
    const mockArtist: Artist = {
      id: 'test-artist-1',
      name: 'Test Artist',
      bio: 'A test artist',
      location: 'London',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onUpdate({ artists: [mockArtist] });
  };

  const handleOpenMic = () => {
    onUpdate({ isOpenMic: true, artists: [] });
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Select Artists</h2>
        <p className="text-gray-600">
          {formData.artists.length > 0
            ? `Selected: ${formData.artists.map((a) => a.name).join(', ')}`
            : formData.isOpenMic
            ? 'Open Mic Event'
            : 'Choose artists for your event'}
        </p>

        {formData.artists.length === 0 && !formData.isOpenMic ? (
          <div className="space-y-3">
            <button
              onClick={handleSelectArtist}
              className="w-full rounded-lg bg-orange-500 px-6 py-4 text-white transition-colors hover:bg-orange-600"
            >
              Select Test Artist
            </button>
            <button
              onClick={handleOpenMic}
              className="w-full rounded-lg border-2 border-orange-500 px-6 py-4 text-orange-500 transition-colors hover:bg-orange-50"
            >
              Open Mic Night
            </button>
          </div>
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
