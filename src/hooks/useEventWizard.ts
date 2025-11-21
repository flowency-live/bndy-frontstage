// src/hooks/useEventWizard.ts
// Event wizard hook for step navigation and form state (<100 LOC)

import { useState, useCallback } from 'react';
import type { EventWizardFormData, Venue, Artist } from '@/lib/types';

interface UseEventWizardProps {
  initialVenue?: Venue;
  initialArtist?: Artist;
}

const TOTAL_STEPS = 5;

const getInitialFormData = (
  initialVenue?: Venue,
  initialArtist?: Artist
): EventWizardFormData => ({
  venue: initialVenue || null,
  venueName: '',
  venueLocation: null,
  eventType: 'single',
  artists: initialArtist ? [initialArtist] : [],
  isOpenMic: false,
  date: '',
  startTime: '',
  endTime: '',
  name: '',
  description: '',
  ticketed: false,
  ticketinformation: '',
  ticketUrl: '',
  eventUrl: '',
  isPublic: true,
});

const getInitialStep = (initialVenue?: Venue, initialArtist?: Artist): number => {
  if (initialVenue && initialArtist) return 2; // Date/Time step
  if (initialVenue) return 1; // Artist step
  return 0; // Venue step
};

export function useEventWizard(props?: UseEventWizardProps) {
  const { initialVenue, initialArtist } = props || {};

  const [currentStep, setCurrentStep] = useState(
    getInitialStep(initialVenue, initialArtist)
  );
  const [formData, setFormData] = useState<EventWizardFormData>(
    getInitialFormData(initialVenue, initialArtist)
  );

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, TOTAL_STEPS - 1)));
  }, []);

  const updateFormData = useCallback((updates: Partial<EventWizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const getStepTitle = useCallback((step: number): string => {
    const titles = ['Choose Venue', 'Select Artists', 'Date & Time', 'More Details', 'Review & Publish'];
    return titles[step] || '';
  }, []);

  const isStepComplete = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 0: // Venue
          return formData.venue !== null;
        case 1: // Artists
          return formData.artists.length > 0 || formData.isOpenMic;
        case 2: // Date/Time
          return formData.date !== '';
        case 3: // More Details
          return true; // Optional step, always accessible
        case 4: // Review
          return true; // Always accessible
        default:
          return false;
      }
    },
    [formData]
  );

  const reset = useCallback(() => {
    setCurrentStep(getInitialStep(initialVenue, initialArtist));
    setFormData(getInitialFormData(initialVenue, initialArtist));
  }, [initialVenue, initialArtist]);

  return {
    currentStep,
    formData,
    nextStep,
    previousStep,
    goToStep,
    updateFormData,
    getStepTitle,
    isStepComplete,
    reset,
    totalSteps: TOTAL_STEPS,
  };
}
