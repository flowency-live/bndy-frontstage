// src/hooks/useEventWizard.test.ts
// TDD: Write tests FIRST for wizard hook

import { renderHook, act } from '@testing-library/react';
import { useEventWizard } from './useEventWizard';
import type { Venue, Artist } from '@/lib/types';

const mockVenue: Venue = {
  id: 'venue-1',
  name: 'The Garage',
  address: '123 Main St',
  location: { lat: 51.5074, lng: -0.1278 },
  validated: true,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
};

const mockArtist: Artist = {
  id: 'artist-1',
  name: 'John Smith',
  bio: 'A musician',
  location: 'London',
  profileImageUrl: null,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
};

describe('useEventWizard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('starts at step 0 (venue) by default', () => {
      const { result } = renderHook(() => useEventWizard());
      expect(result.current.currentStep).toBe(0);
    });

    it('initializes with provided venue', () => {
      const { result } = renderHook(() => useEventWizard({ initialVenue: mockVenue }));
      expect(result.current.formData.venue).toEqual(mockVenue);
    });

    it('initializes with provided artist', () => {
      const { result } = renderHook(() => useEventWizard({ initialArtist: mockArtist }));
      expect(result.current.formData.artists).toEqual([mockArtist]);
    });

    it('skips to artist step when venue is pre-filled', () => {
      const { result } = renderHook(() => useEventWizard({ initialVenue: mockVenue }));
      expect(result.current.currentStep).toBe(1); // Artist step
    });

    it('skips to date/time step when both venue and artist are pre-filled', () => {
      const { result } = renderHook(() =>
        useEventWizard({ initialVenue: mockVenue, initialArtist: mockArtist })
      );
      expect(result.current.currentStep).toBe(2); // Date/Time step
    });
  });

  describe('Step Navigation', () => {
    it('moves to next step', () => {
      const { result } = renderHook(() => useEventWizard());

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('moves to previous step', () => {
      const { result } = renderHook(() => useEventWizard({ initialVenue: mockVenue }));

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStep).toBe(0);
    });

    it('does not go below step 0', () => {
      const { result } = renderHook(() => useEventWizard());

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStep).toBe(0);
    });

    it('does not go beyond total steps', () => {
      const { result } = renderHook(() => useEventWizard());

      act(() => {
        result.current.goToStep(10);
      });

      expect(result.current.currentStep).toBe(3); // Max step (Details/Review)
    });

    it('allows jumping to specific step', () => {
      const { result } = renderHook(() => useEventWizard());

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.currentStep).toBe(2);
    });
  });

  describe('Form Data Management', () => {
    it('updates venue data', () => {
      const { result } = renderHook(() => useEventWizard());

      act(() => {
        result.current.updateFormData({ venue: mockVenue });
      });

      expect(result.current.formData.venue).toEqual(mockVenue);
    });

    it('updates artist data', () => {
      const { result } = renderHook(() => useEventWizard());

      act(() => {
        result.current.updateFormData({ artists: [mockArtist] });
      });

      expect(result.current.formData.artists).toEqual([mockArtist]);
    });

    it('merges form data correctly', () => {
      const { result } = renderHook(() => useEventWizard());

      act(() => {
        result.current.updateFormData({ venue: mockVenue });
      });

      act(() => {
        result.current.updateFormData({ date: '2025-11-21' });
      });

      expect(result.current.formData.venue).toEqual(mockVenue);
      expect(result.current.formData.date).toBe('2025-11-21');
    });
  });

  describe('Step Titles', () => {
    it('returns correct title for each step', () => {
      const { result } = renderHook(() => useEventWizard());

      expect(result.current.getStepTitle(0)).toBe('Choose Venue');
      expect(result.current.getStepTitle(1)).toBe('Select Artists');
      expect(result.current.getStepTitle(2)).toBe('Date & Time');
      expect(result.current.getStepTitle(3)).toBe('Review & Publish');
    });
  });

  describe('Step Completion Status', () => {
    it('marks venue step as complete when venue is set', () => {
      const { result } = renderHook(() => useEventWizard());

      act(() => {
        result.current.updateFormData({ venue: mockVenue });
      });

      expect(result.current.isStepComplete(0)).toBe(true);
    });

    it('marks artist step as complete when artist is set', () => {
      const { result } = renderHook(() => useEventWizard());

      act(() => {
        result.current.updateFormData({ artists: [mockArtist] });
      });

      expect(result.current.isStepComplete(1)).toBe(true);
    });

    it('marks artist step as complete for open mic', () => {
      const { result } = renderHook(() => useEventWizard());

      act(() => {
        result.current.updateFormData({ isOpenMic: true });
      });

      expect(result.current.isStepComplete(1)).toBe(true);
    });

    it('marks date/time step as complete when date is set', () => {
      const { result } = renderHook(() => useEventWizard());

      act(() => {
        result.current.updateFormData({ date: '2025-11-21' });
      });

      expect(result.current.isStepComplete(2)).toBe(true);
    });
  });

  describe('Reset', () => {
    it('resets to initial state', () => {
      const { result } = renderHook(() => useEventWizard());

      act(() => {
        result.current.updateFormData({ venue: mockVenue, date: '2025-11-21' });
        result.current.nextStep();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.currentStep).toBe(0);
      expect(result.current.formData.venue).toBeNull();
      expect(result.current.formData.date).toBe('');
    });
  });
});
