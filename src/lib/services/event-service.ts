// src/lib/services/event-service.ts - Combined implementation
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
  try {
    
    if (!userLocation) {
      console.warn("No location provided for radius filtering, using default");
      return [];
    }
    
    // Create query - order by date, filter to future events
    const eventsRef = collection(db, COLLECTIONS.EVENTS);
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
    

    // Apply distance filter if we have user location
    if (userLocation) {
     
      // First, calculate distances for all events
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
      
       
      // Apply radius filter
      events = eventsWithDistance.filter(event => {
        // Skip events with no location
        if (!event.location) return false;
        
        // Skip events with invalid location
        if (!event.distance) return false;
        
        // Include only events within radius
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
  try {
    // Create query - order by date, filter to future events
    const eventsRef = collection(db, COLLECTIONS.EVENTS);
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
  try {
    const eventsRef = collection(db, COLLECTIONS.EVENTS);
    const dateFilter = dateStart.toISOString().split('T')[0];
    
    let eventsQuery;

    if (includeWhereNotMainArtist) {
      // Get events where artist is anywhere in the artistIds array
      eventsQuery = query(
        eventsRef,
        where('artistIds', 'array-contains', artistId),
        where('date', '>=', dateFilter),
        orderBy('date', 'asc')
      );
    } else {
      // Get events where this is the main artist (first in the array or single artist)
      // For this simplified version, we'll just get all events and filter in JS
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

    // If not including where not main artist, filter for events where this is the first artist
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
  dateStart: Date = new Date()
): Promise<Event[]> {
  try {
    const eventsRef = collection(db, COLLECTIONS.EVENTS);
    const dateFilter = dateStart.toISOString().split('T')[0];
    
    const eventsQuery = query(
      eventsRef,
      where('venueId', '==', venueId),
      where('date', '>=', dateFilter),
      orderBy('date', 'asc')
    );

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
  try {
    const eventDoc = await getDoc(doc(db, COLLECTIONS.EVENTS, eventId));
    
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
 * Create a new event
 */
export async function createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
  try {
    const now = new Date().toISOString();
    
    const newEvent = {
      ...event,
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.EVENTS), newEvent);
    
    return {
      id: docRef.id,
      ...newEvent,
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
  try {
    const { id, ...eventData } = event;
    
    await updateDoc(doc(db, COLLECTIONS.EVENTS, id), {
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
  try {
    await deleteDoc(doc(db, COLLECTIONS.EVENTS, eventId));
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
  try {
    const eventsRef = collection(db, COLLECTIONS.EVENTS);
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
  try {
    const dateStr = date.toISOString().split('T')[0];
    
    const eventsRef = collection(db, COLLECTIONS.EVENTS);
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
 * @param {Object} params - Object containing venue, artists, and date.
 * @returns {Promise<{ conflicts: Array, fullMatchConflict: boolean }>} - The detected conflicts and a boolean indicating a full conflict.
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
  const dateStr = date.toISOString().split('T')[0];
  
  try {
    const eventsRef = collection(db, COLLECTIONS.EVENTS);
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
