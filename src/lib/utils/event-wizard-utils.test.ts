// src/lib/utils/event-wizard-utils.test.ts
// TDD: Write tests FIRST, implement SECOND

import {
  getDefaultStartTime,
  calculateEndTime,
  generateEventName,
  checkQuickAddEligibility,
} from './event-wizard-utils';
import type { EventWizardFormData, Venue, Artist } from '../types';

describe('getDefaultStartTime', () => {
  it('returns 21:00 for Friday', () => {
    const friday = new Date('2025-11-21'); // Friday
    expect(getDefaultStartTime(friday)).toBe('21:00');
  });

  it('returns 21:00 for Saturday', () => {
    const saturday = new Date('2025-11-22'); // Saturday
    expect(getDefaultStartTime(saturday)).toBe('21:00');
  });

  it('returns empty string for Monday', () => {
    const monday = new Date('2025-11-24'); // Monday
    expect(getDefaultStartTime(monday)).toBe('');
  });

  it('returns empty string for Wednesday', () => {
    const wednesday = new Date('2025-11-26'); // Wednesday
    expect(getDefaultStartTime(wednesday)).toBe('');
  });

  it('returns empty string for Sunday', () => {
    const sunday = new Date('2025-11-23'); // Sunday
    expect(getDefaultStartTime(sunday)).toBe('');
  });
});

describe('calculateEndTime', () => {
  it('adds 3 hours to start time', () => {
    expect(calculateEndTime('18:00')).toBe('21:00');
  });

  it('handles midnight rollover correctly', () => {
    expect(calculateEndTime('21:00')).toBe('00:00');
  });

  it('handles late night rollover', () => {
    expect(calculateEndTime('23:00')).toBe('02:00');
  });

  it('handles early morning times', () => {
    expect(calculateEndTime('09:00')).toBe('12:00');
  });

  it('handles noon correctly', () => {
    expect(calculateEndTime('12:00')).toBe('15:00');
  });
});

describe('generateEventName', () => {
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
    bio: 'A great musician',
    location: 'London',
    profileImageUrl: null,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  };

  it('generates "Artist @ Venue" for single artist', () => {
    const formData: Partial<EventWizardFormData> = {
      venue: mockVenue,
      artists: [mockArtist],
      isOpenMic: false,
      eventType: 'single',
    };
    expect(generateEventName(formData as EventWizardFormData)).toBe('John Smith @ The Garage');
  });

  it('generates "Open Mic @ Venue" for open mic', () => {
    const formData: Partial<EventWizardFormData> = {
      venue: mockVenue,
      artists: [],
      isOpenMic: true,
      eventType: 'openMic',
    };
    expect(generateEventName(formData as EventWizardFormData)).toBe('Open Mic @ The Garage');
  });

  it('generates "Artist1 & Artist2 @ Venue" for 2 artists', () => {
    const artist2 = { ...mockArtist, id: 'artist-2', name: 'Jane Doe' };
    const formData: Partial<EventWizardFormData> = {
      venue: mockVenue,
      artists: [mockArtist, artist2],
      isOpenMic: false,
      eventType: 'multiple',
    };
    expect(generateEventName(formData as EventWizardFormData)).toBe('John Smith & Jane Doe @ The Garage');
  });

  it('generates "Artist & others @ Venue" for 3+ artists', () => {
    const artist2 = { ...mockArtist, id: 'artist-2', name: 'Jane Doe' };
    const artist3 = { ...mockArtist, id: 'artist-3', name: 'Bob Wilson' };
    const formData: Partial<EventWizardFormData> = {
      venue: mockVenue,
      artists: [mockArtist, artist2, artist3],
      isOpenMic: false,
      eventType: 'multiple',
    };
    expect(generateEventName(formData as EventWizardFormData)).toBe('John Smith & others @ The Garage');
  });

  it('returns empty string when no venue', () => {
    const formData: Partial<EventWizardFormData> = {
      venue: null,
      artists: [mockArtist],
      isOpenMic: false,
      eventType: 'single',
    };
    expect(generateEventName(formData as EventWizardFormData)).toBe('');
  });

  it('returns "Event @ Venue" when no artists and not open mic', () => {
    const formData: Partial<EventWizardFormData> = {
      venue: mockVenue,
      artists: [],
      isOpenMic: false,
      eventType: 'single',
    };
    expect(generateEventName(formData as EventWizardFormData)).toBe('Event @ The Garage');
  });
});

describe('checkQuickAddEligibility', () => {
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
    bio: 'A great musician',
    location: 'London',
    profileImageUrl: null,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  };

  it('is eligible with venue + artist + Friday + no time', () => {
    const formData: Partial<EventWizardFormData> = {
      venue: mockVenue,
      artists: [mockArtist],
      date: '2025-11-21', // Friday
      startTime: '',
      isOpenMic: false,
    };
    expect(checkQuickAddEligibility(formData as EventWizardFormData)).toBe(true);
  });

  it('is eligible with venue + artist + Saturday + no time', () => {
    const formData: Partial<EventWizardFormData> = {
      venue: mockVenue,
      artists: [mockArtist],
      date: '2025-11-22', // Saturday
      startTime: '',
      isOpenMic: false,
    };
    expect(checkQuickAddEligibility(formData as EventWizardFormData)).toBe(true);
  });

  it('is eligible with venue + artist + Monday + manual time', () => {
    const formData: Partial<EventWizardFormData> = {
      venue: mockVenue,
      artists: [mockArtist],
      date: '2025-11-24', // Monday
      startTime: '19:00',
      isOpenMic: false,
    };
    expect(checkQuickAddEligibility(formData as EventWizardFormData)).toBe(true);
  });

  it('is NOT eligible without venue', () => {
    const formData: Partial<EventWizardFormData> = {
      venue: null,
      artists: [mockArtist],
      date: '2025-11-21',
      startTime: '21:00',
      isOpenMic: false,
    };
    expect(checkQuickAddEligibility(formData as EventWizardFormData)).toBe(false);
  });

  it('is NOT eligible without artist (when not open mic)', () => {
    const formData: Partial<EventWizardFormData> = {
      venue: mockVenue,
      artists: [],
      date: '2025-11-21',
      startTime: '21:00',
      isOpenMic: false,
    };
    expect(checkQuickAddEligibility(formData as EventWizardFormData)).toBe(false);
  });

  it('is eligible for open mic without artist', () => {
    const formData: Partial<EventWizardFormData> = {
      venue: mockVenue,
      artists: [],
      date: '2025-11-21',
      startTime: '',
      isOpenMic: true,
    };
    expect(checkQuickAddEligibility(formData as EventWizardFormData)).toBe(true);
  });

  it('is NOT eligible without date', () => {
    const formData: Partial<EventWizardFormData> = {
      venue: mockVenue,
      artists: [mockArtist],
      date: '',
      startTime: '21:00',
      isOpenMic: false,
    };
    expect(checkQuickAddEligibility(formData as EventWizardFormData)).toBe(false);
  });

  it('is NOT eligible for Monday without manual time', () => {
    const formData: Partial<EventWizardFormData> = {
      venue: mockVenue,
      artists: [mockArtist],
      date: '2025-11-24', // Monday
      startTime: '',
      isOpenMic: false,
    };
    expect(checkQuickAddEligibility(formData as EventWizardFormData)).toBe(false);
  });
});
