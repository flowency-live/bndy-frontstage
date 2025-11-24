// src/components/wizard/EventWizard.tsx
// Main event wizard container (<200 LOC)

'use client';

import { useEventWizard } from '@/hooks/useEventWizard';
import { useToast } from '@/components/ui/use-toast';
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

  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      console.log('Creating event:', formData);

      if (!formData.venue) {
        throw new Error('Venue is required');
      }

      // Step 1: Find or create venue in bndy-venues
      const venueResponse = await fetch('https://api.bndy.co.uk/api/venues/find-or-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.venue.name,
          address: formData.venue.address,
          googlePlaceId: formData.venue.googlePlaceId,
          latitude: formData.venue.location?.lat,
          longitude: formData.venue.location?.lng,
        }),
      });

      if (!venueResponse.ok) {
        throw new Error('Failed to find or create venue');
      }

      const venue = await venueResponse.json();
      const venueId = venue.id;

      // Step 2: Create event with bndy-venues ID
      const eventResponse = await fetch('https://api.bndy.co.uk/api/events/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venueId: venueId,
          artistIds: formData.artists.map(a => a.id),
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          title: formData.name,
          isPublic: true,
          source: 'community',
          isOpenMic: formData.isOpenMic,
        }),
      });

      if (!eventResponse.ok) {
        const error = await eventResponse.json();
        throw new Error(error.error || 'Failed to create event');
      }

      const data = await eventResponse.json();

      toast({
        title: 'Event created!',
        description: `${formData.artists[0]?.name} at ${formData.venue.name}`,
      });

      onSuccess?.(data.id);
    } catch (error) {
      console.error('Failed to create event:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create event',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
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
