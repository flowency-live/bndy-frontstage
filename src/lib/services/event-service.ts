// src/lib/services/event-service.ts - Updated for current use

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { calculateDistance } from '@/lib/utils/geo';
import type { Event } from '@/lib/types';

/**
 * Fetches events from Firestore with efficient loading
 */
export async function getEvents(
  userLocation: google.maps.LatLngLiteral | null,
  radius: number = 25,
  dateStart: Date = new Date(),
  maxEvents: number = 100
): Promise<Event[]> {
  try {
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
      events = events.filter(event => {
        // Skip filtering if event has no location
        if (!event.location) return true;
        
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          event.location.lat,
          event.location.lng
        );
        
        return distance <= radius;
      });
    }

    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

// Add a new function to get all events without distance filtering
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

// =========================================
// FUTURE IMPLEMENTATION - NOT CURRENTLY USED
// =========================================

// TODO: These functions will be implemented in future iterations

// const RECURRING_EVENT_LIMITS = {
//     weekly: 12,   // 12 weeks maximum
//     monthly: 3    // 3 months maximum
// };

// src/lib/services/event-service.ts
// export async function createEvent(data: EventFormData) {
//     // Ensure venue exists in database
//     let venueId = data.venue.id;
//     if (!venueId) {
//         const newVenue = await createVenue(data.venue);
//         venueId = newVenue.id;
//     }

//     // Only ensure artists exist if not an Open Mic event
//     const artistIds = !data.isOpenMic ? await Promise.all(
//         data.artists.map(async artist => {
//             if (artist.id) return artist.id;
//             const newArtist = await createArtist(artist);
//             return newArtist.id;
//         })
//     ) : [];

//     // Generate event name based on type
//     const eventName = data.isOpenMic 
//         ? `Open Mic Night @ ${data.venue.name}`
//         : data.name || `${data.artists[0].name} @ ${data.venue.name}`;

//     // Create event data with optional fields
//     const eventData: Omit<Event, 'id'> = {
//         venueId,
//         venueName: data.venue.name,
//         artistIds,
//         name: eventName,
//         date: data.date,
//         startTime: data.startTime,
//         location: data.venue.location,
//         status: 'pending',
//         source: 'bndy.live',
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//         isOpenMic: data.isOpenMic || false
//     };

//     // Add optional fields if they have values
//     if (data.endTime?.trim()) eventData.endTime = data.endTime;
//     if (data.ticketPrice?.trim()) eventData.ticketPrice = data.ticketPrice;
//     if (data.ticketUrl?.trim()) eventData.ticketUrl = data.ticketUrl;
//     if (data.eventUrl?.trim()) eventData.eventUrl = data.eventUrl;
//     if (data.description?.trim()) eventData.description = data.description;

//     // Handle recurring events
//     if (data.recurring) {
//         const dates = generateRecurringDates(
//             data.date,
//             data.recurring.endDate,
//             data.recurring.frequency
//         );

//         const batch = writeBatch(db);
//         dates.forEach(date => {
//             const docRef = doc(collection(db, COLLECTIONS.EVENTS));
//             batch.set(docRef, { ...eventData, date });
//         });

//         return batch.commit();
//     }

//     return addDoc(collection(db, COLLECTIONS.EVENTS), eventData);
// }


/**
 * Fetches events from Firestore for a given date.
 * @param {string} date - The date in "YYYY-MM-DD" format.
 * @returns {Promise<Array>} - A list of events on the given date.
 */
// export const getEventsForDate = async (date) => {
//     try {
//         console.log(`📅 Fetching events for date: ${date}`);

//         const eventsRef = collection(db, "bf_events");
//         const q = query(eventsRef, where("date", "==", date));
//         const snapshot = await getDocs(q);

//         const events = snapshot.docs.map(doc => {
//             const data = doc.data();

//             return {
//                 id: doc.id,
//                 ...data,
//                 venueId: data.venueId || null,
//                 artistIds: Array.isArray(data.artistIds) ? data.artistIds : [],
//                 isOpenMic: data.isOpenMic || false  // Add this line
//             };
//         });

//         console.log(`✅ Found ${events.length} events on ${date}`);
//         return events;
//     } catch (error) {
//         console.error("❌ Error fetching events:", error);
//         return [];
//     }
// };


/**
 * Checks for event conflicts based on venue, artist, and date.
 * @param {Object} params - Object containing venue, artists, and date.
 * @returns {Promise<{ conflicts: Array, fullMatchConflict: boolean }>} - The detected conflicts and a boolean indicating a full conflict.
 */
// export async function checkEventConflicts({ venue, artists, date, isOpenMic }) {
//     console.log("🔍 Running checkEventConflicts with parameters:", { venue, artists, date, isOpenMic });

//     const existingEvents = await getEventsForDate(date);
//     console.log(`📊 Found ${existingEvents.length} existing events on ${date}`);

//     let conflicts = [];
//     let fullMatchConflict = false;

//     existingEvents.forEach(existingEvent => {
       

//         const venueMatch = existingEvent.venueId === venue?.id;
//         const artistMatch = !isOpenMic && existingEvent.artistIds?.some(id => artists.some(a => a.id === id));

//        if (!isOpenMic) {
//             console.log(`🔹 Comparing Artist IDs: Selected ${artists.map(a => a.id).join(", ")} | Event ${existingEvent.artistIds?.join(", ")}`);
//         }

//         if (venueMatch) {
//             const message = isOpenMic 
//                 ? `⚠️ Venue Conflict Detected: Open Mic event at ${venue.name}`
//                 : `⚠️ Venue Conflict Detected: ${artists.map(a => a.name).join(", ")} has an event at ${venue.name}`;
//             console.warn(message);
            
//             conflicts.push({
//                 type: "venue",
//                 name: venue.name,
//                 existingEvent
//             });
//         }

//         if (!isOpenMic && artistMatch) {
//             console.warn(`⚠️ Artist Conflict Detected: ${artists.map(a => a.name).join(", ")} has an event at ${venue.name}`);
//             conflicts.push({
//                 type: "artist",
//                 name: artists.find(a => existingEvent.artistIds.includes(a.id))?.name || "Unknown Artist",
//                 existingEvent
//             });
//         }

//         // For Open Mic, exact duplicate is just venue match on same date
//         // For regular events, need both venue and artist match
//         if ((isOpenMic && venueMatch && existingEvent.isOpenMic) || 
//             (!isOpenMic && venueMatch && artistMatch)) {
//             console.error(`🚨 FULL BLOCK: Exact duplicate event detected.`);
//             fullMatchConflict = true;

//             conflicts.push({
//                 type: "exact_duplicate",
//                 name: "This event already exists!",
//                 existingEvent
//             });
//         }
//     });

//     console.log("🔎 Final Conflict Array:", conflicts);
//     return { conflicts, fullMatchConflict };
// }




