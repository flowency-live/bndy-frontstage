// src/lib/services/event-service.ts
// ⚠️ NEVER USE FIREBASE AGAIN - ALL DATA IS IN DYNAMODB
// This file contains LEGACY admin tool functions only - DO NOT USE for new features
// Public event data uses DynamoDB API (see hooks/usePublicEvents.ts)
// createEvent() already migrated to DynamoDB (api.bndy.co.uk/api/events/community)
// All other functions are deprecated admin tools - DO NOT FIX, DO NOT EXTEND
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { calculateDistance } from '@/lib/utils/geo';
import { Event } from '@/lib/types';

/**
 * Fetches events from Firestore with efficient loading and accurate radius filtering
 */
export async function getEvents(
  userLocation: google.maps.LatLngLiteral | null,
  radius: number = 5,
  dateStart: Date = new Date(),
  maxEvents: number = 100
): Promise<Event[]> {
  if (!db) return [];

  const firestore = db;
  try {

    if (!userLocation) {
      return [];
    }

    const eventsRef = collection(firestore, COLLECTIONS.EVENTS);
    const dateFilter = dateStart.toISOString().split('T')[0];

    const eventsQuery = query(
      eventsRef,
      where('date', '>=', dateFilter),
      orderBy('date', 'asc'),
      limit(maxEvents)
    );

    const snapshot = await getDocs(eventsQuery);

    let events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Event;
    });


    if (userLocation) {

      const eventsWithDistance = events.map(event => {
        if (!event.location || !event.location.lat || !event.location.lng) {
          return { ...event, distance: null };
        }

        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          event.location.lat,
          event.location.lng
        );

        return { ...event, distance };
      });


      events = eventsWithDistance.filter(event => {
        if (!event.location) return false;
        if (!event.distance) return false;
        return event.distance <= radius;
      });

    }

    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

/**
 * Get all events without distance filtering
 */
export async function getAllEvents(dateStart: Date = new Date()): Promise<Event[]> {
  if (!db) return [];

  const firestore = db;
  try {
    const eventsRef = collection(firestore, COLLECTIONS.EVENTS);
    const dateFilter = dateStart.toISOString().split('T')[0];

    const eventsQuery = query(
      eventsRef,
      where('date', '>=', dateFilter),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(eventsQuery);

    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Event;
    });

    return events;
  } catch (error) {
    console.error("Error fetching all events:", error);
    throw error;
  }
}

/**
 * Get events for a specific artist
 */
export async function getEventsForArtist(
  artistId: string,
  includeWhereNotMainArtist: boolean = false,
  dateStart: Date = new Date()
): Promise<Event[]> {
  if (!db) return [];

  const firestore = db;
  try {
    const eventsRef = collection(firestore, COLLECTIONS.EVENTS);
    const dateFilter = dateStart.toISOString().split('T')[0];

    let eventsQuery;

    if (includeWhereNotMainArtist) {
      eventsQuery = query(
        eventsRef,
        where('artistIds', 'array-contains', artistId),
        where('date', '>=', dateFilter),
        orderBy('date', 'asc')
      );
    } else {
      eventsQuery = query(
        eventsRef,
        where('date', '>=', dateFilter),
        orderBy('date', 'asc')
      );
    }

    const snapshot = await getDocs(eventsQuery);

    let events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Event));

    if (!includeWhereNotMainArtist) {
      events = events.filter(event =>
        event.artistIds &&
        event.artistIds.length > 0 &&
        event.artistIds[0] === artistId
      );
    }

    return events;
  } catch (error) {
    console.error(`Error fetching events for artist ${artistId}:`, error);
    throw error;
  }
}

/**
 * Get events for a specific venue
 */
export async function getEventsForVenue(
  venueId: string,
  dateStart?: Date
): Promise<Event[]> {
  if (!db) return [];

  const firestore = db;
  try {
    const eventsRef = collection(firestore, COLLECTIONS.EVENTS);

    let eventsQuery;
    if (dateStart) {
      const dateFilter = dateStart.toISOString().split('T')[0];
      eventsQuery = query(
        eventsRef,
        where('venueId', '==', venueId),
        where('date', '>=', dateFilter),
        orderBy('date', 'asc')
      );
    } else {
      // Get ALL events for this venue (past and future)
      eventsQuery = query(
        eventsRef,
        where('venueId', '==', venueId),
        orderBy('date', 'desc')
      );
    }

    const snapshot = await getDocs(eventsQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Event));
  } catch (error) {
    console.error(`Error fetching events for venue ${venueId}:`, error);
    throw error;
  }
}

/**
 * Get a single event by ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  if (!db) return null;

  const firestore = db;
  try {
    const eventDoc = await getDoc(doc(firestore, COLLECTIONS.EVENTS, eventId));

    if (!eventDoc.exists()) {
      return null;
    }

    return {
      id: eventDoc.id,
      ...eventDoc.data(),
    } as Event;
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    throw error;
  }
}

/**
 * Create a new event - Now calls DynamoDB API instead of Firebase
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
 * Update an event
 */
export async function updateEvent(event: Event): Promise<void> {
  if (!db) throw new Error("Firestore not configured");

  const firestore = db;
  try {
    const { id, ...eventData } = event;

    await updateDoc(doc(firestore, COLLECTIONS.EVENTS, id), {
      ...eventData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error updating event ${event.id}:`, error);
    throw error;
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  if (!db) throw new Error("Firestore not configured");

  const firestore = db;
  try {
    await deleteDoc(doc(firestore, COLLECTIONS.EVENTS, eventId));
  } catch (error) {
    console.error(`Error deleting event ${eventId}:`, error);
    throw error;
  }
}

/**
 * Get events for a date range
 */
export async function getEventsForDateRange(
  startDate: Date,
  endDate: Date
): Promise<Event[]> {
  if (!db) return [];

  const firestore = db;
  try {
    const eventsRef = collection(firestore, COLLECTIONS.EVENTS);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const eventsQuery = query(
      eventsRef,
      where('date', '>=', startDateStr),
      where('date', '<=', endDateStr),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(eventsQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Event));
  } catch (error) {
    console.error('Error fetching events for date range:', error);
    throw error;
  }
}

/**
 * Get events for a specific date
 */
export async function getEventsForDate(date: Date): Promise<Event[]> {
  if (!db) return [];

  const firestore = db;
  try {
    const dateStr = date.toISOString().split('T')[0];

    const eventsRef = collection(firestore, COLLECTIONS.EVENTS);
    const eventsQuery = query(
      eventsRef,
      where('date', '==', dateStr),
      orderBy('startTime', 'asc')
    );

    const snapshot = await getDocs(eventsQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Event));
  } catch (error) {
    console.error('Error fetching events for date:', error);
    throw error;
  }
}

/**
 * Checks for event conflicts based on venue, artist, and date.
 */
export async function checkEventConflicts({
  venue,
  artists,
  date,
  isOpenMic
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  venue: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  artists: any[],
  date: Date,
  isOpenMic: boolean
}) {
  if (!db) return { conflicts: [], fullMatchConflict: false };

  const firestore = db;
  const dateStr = date.toISOString().split('T')[0];

  try {
    const eventsRef = collection(firestore, COLLECTIONS.EVENTS);
    const q = query(
      eventsRef,
      where('date', '==', dateStr)
    );
    const snapshot = await getDocs(q);
    const existingEvents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];

   // eslint-disable-next-line prefer-const
    let conflicts: { type: string; name: string; existingEvent: Event }[] = [];
    let fullMatchConflict = false;

    existingEvents.forEach(existingEvent => {
      const venueMatch = existingEvent.venueId === venue?.id;
      const artistMatch = !isOpenMic && existingEvent.artistIds?.some(
        id => artists.some(a => a.id === id)
      );


      if (venueMatch) {

        conflicts.push({
          type: "venue",
          name: venue.name,
          existingEvent
        });
      }

      if (!isOpenMic && artistMatch) {
        const conflictingArtist = artists.find(
          a => existingEvent.artistIds.includes(a.id)
        );

        conflicts.push({
          type: "artist",
          name: conflictingArtist?.name || "Unknown Artist",
          existingEvent
        });
      }

      if ((isOpenMic && venueMatch && existingEvent.isOpenMic) ||
          (!isOpenMic && venueMatch && artistMatch)) {
        fullMatchConflict = true;

        conflicts.push({
          type: "exact_duplicate",
          name: "This event already exists!",
          existingEvent
        });
      }
    });


    return { conflicts, fullMatchConflict };
  } catch (error) {
    console.error("Error checking for conflicts:", error);
    return { conflicts: [], fullMatchConflict: false };
  }
}