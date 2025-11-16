// src/lib/services/event-service.ts
// All data is in DynamoDB - API endpoints at api.bndy.co.uk
// Event fetching is done via hooks/usePublicEvents.ts which calls DynamoDB API
import { Event, Venue, Artist } from '@/lib/types';

/**
 * Create a new event - Calls DynamoDB API
 */
export async function createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
  try {
    // Extract first artist ID (required for community events)
    const artistId = Array.isArray(event.artistIds) && event.artistIds.length > 0
      ? event.artistIds[0]
      : null;

    if (!artistId) {
      throw new Error('Artist ID is required to create event');
    }

    // Calculate hasCustomTitle by checking if title differs from default format
    // Default format: {artistName} @ {venueName}
    const artist = (event as any).artists?.[0];
    const venue = (event as any).venue;
    const artistName = artist?.name || '';
    const venueName = venue?.name || (event as any).venueName || '';
    const defaultTitle = artistName && venueName ? `${artistName} @ ${venueName}` : '';
    const hasCustomTitle = defaultTitle ? event.name !== defaultTitle : false;

    const response = await fetch('https://api.bndy.co.uk/api/events/community', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artistId: artistId,
        venueId: event.venueId,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime || '00:00',
        title: event.name,
        hasCustomTitle: hasCustomTitle,
        price: event.price || null,
        ticketUrl: event.ticketUrl || null,
        notes: event.notes || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create event');
    }

    const data = await response.json();

    // Return event in format expected by frontstage
    return {
      id: data.event.id,
      name: data.event.title,
      date: data.event.date,
      startTime: data.event.startTime,
      endTime: data.event.endTime,
      venueId: data.event.venueId,
      artistIds: [data.event.artistId],
      price: event.price || null,
      ticketUrl: event.ticketUrl || null,
      notes: event.notes || null,
      location: event.location || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verifiedByArtist: false, // Community events start unverified
    } as Event;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

/**
 * Check for event conflicts - Stub implementation
 * TODO: Implement this with DynamoDB API when backend endpoint is ready
 * For now, returns no conflicts to allow event creation to proceed
 */
export async function checkEventConflicts(params: {
  venue: Venue | null;
  artists?: Artist[];
  date: Date;
  isOpenMic: boolean;
}): Promise<{ conflicts: any[]; fullMatchConflict: boolean }> {
  // Stub: Return no conflicts
  // When backend implements conflict checking endpoint, call it here
  console.log('Event conflict checking disabled (Firebase removed, DynamoDB endpoint not yet implemented)');
  return {
    conflicts: [],
    fullMatchConflict: false
  };
}
