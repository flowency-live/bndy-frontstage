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
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <WizardHeader
        currentStep={currentStep}
        totalSteps={4}
        title={getStepTitle(currentStep)}
        onBack={currentStep > 0 ? previousStep : undefined}
      />

      <main className="flex-1 overflow-hidden relative">
        {renderStep()}
      </main>

      {/* Cancel button - bottom of screen */}
      {onCancel && (
        <div className="border-t border-border bg-card p-2 sm:p-4">
          <div className="mx-auto max-w-4xl">
            <button
              onClick={onCancel}
              className="w-full rounded-lg border-2 border-border px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-card-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
