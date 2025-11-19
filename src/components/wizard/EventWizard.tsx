// src/components/wizard/EventWizard.tsx
// Main event wizard container (<200 LOC)

'use client';

import { useEventWizard } from '@/hooks/useEventWizard';
import { WizardHeader } from './WizardHeader';
import { VenueMapStep } from './steps/VenueMapStep';
import { ArtistStep } from './steps/ArtistStep';
import { DateTimeStep } from './steps/DateTimeStep';
import { ReviewStep } from './steps/ReviewStep';
import type { Venue, Artist } from '@/lib/types';

interface EventWizardProps {
  initialVenue?: Venue;
  initialArtist?: Artist;
  onSuccess?: (eventId: string) => void;
  onCancel?: () => void;
}

export function EventWizard({
  initialVenue,
  initialArtist,
  onSuccess,
  onCancel,
}: EventWizardProps) {
  const {
    currentStep,
    formData,
    nextStep,
    previousStep,
    updateFormData,
    getStepTitle,
  } = useEventWizard({ initialVenue, initialArtist });

  const handleSubmit = async () => {
    try {
      // TODO: Implement API call to create event
      console.log('Creating event:', formData);

      // Mock success
      const mockEventId = 'event-' + Date.now();
      onSuccess?.(mockEventId);
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <VenueMapStep
            formData={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        );
      case 1:
        return (
          <ArtistStep
            formData={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <DateTimeStep
            formData={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        );
      case 3:
        return (
          <ReviewStep
            formData={formData}
            onSubmit={handleSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <WizardHeader
        currentStep={currentStep}
        totalSteps={4}
        title={getStepTitle(currentStep)}
        onBack={currentStep > 0 ? previousStep : undefined}
      />

      <main className="mx-auto max-w-4xl">
        {renderStep()}
      </main>

      {/* Cancel button - bottom of screen */}
      {onCancel && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4">
          <div className="mx-auto max-w-4xl">
            <button
              onClick={onCancel}
              className="w-full rounded-lg border-2 border-border px-6 py-3 text-card-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
