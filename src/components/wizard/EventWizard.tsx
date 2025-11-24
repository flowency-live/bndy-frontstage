// src/components/wizard/EventWizard.tsx
// Main event wizard container (<200 LOC)

'use client';

import { useEventWizard } from '@/hooks/useEventWizard';
import { WizardHeader } from './WizardHeader';
import { VenueMapStep } from './steps/VenueMapStep';
import { ArtistStep } from './steps/ArtistStep';
import { DateTimeStep } from './steps/DateTimeStep';
import { MoreDetailsStep } from './steps/MoreDetailsStep';
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
    goToStep,
    updateFormData,
    getStepTitle,
  } = useEventWizard({ initialVenue, initialArtist });

  const handleSubmit = async () => {
    try {
      console.log('Creating event:', formData);

      // Call community event creation endpoint
      const response = await fetch('https://api.bndy.co.uk/api/events/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venueId: formData.venue?.id,
          artistIds: formData.artists.map(a => a.id),
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          title: formData.title,
          description: formData.description,
          ticketPrice: formData.ticketPrice,
          ticketUrl: formData.ticketUrl,
          isOpenMic: formData.isOpenMic,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create event');
      }

      const data = await response.json();
      onSuccess?.(data.id);
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
            onQuickCreate={handleSubmit}
          />
        );
      case 3:
        return (
          <MoreDetailsStep
            formData={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        );
      case 4:
        return (
          <ReviewStep
            formData={formData}
            onUpdate={updateFormData}
            onSubmit={handleSubmit}
            onNavigateToStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden m-0 p-0">
      <WizardHeader
        currentStep={currentStep}
        totalSteps={5}
        title={getStepTitle(currentStep)}
        onBack={currentStep > 0 ? previousStep : undefined}
      />

      <main className="flex-1 overflow-hidden relative m-0 p-0">
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
