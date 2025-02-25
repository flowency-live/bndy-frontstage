//src\lib\services\firestore.ts
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { collection, addDoc, getDocs, query, where, getDoc, doc, updateDoc } from 'firebase/firestore';
import type { Venue, EventFormData } from '@/lib/types';  // Import from central types file


// Existing gig operations
export const addGig = async (data: EventFormData) => {
  return addDoc(collection(db, COLLECTIONS.EVENTS), {
    ...data,
    type: 'gig',
    status: 'pending',
    createdAt: new Date().toISOString()
  });
};

export const getGigs = async () => {
  const q = query(
    collection(db, COLLECTIONS.EVENTS),
    where('type', '==', 'gig')
  );
  return getDocs(q);
};

// New venue operations
export const addVenue = async (data: Omit<Venue, 'id'>) => {
  // Ensure we have all required fields for the security rules
  if (!data.googlePlaceId || !data.location) {
    throw new Error('Missing required fields for venue creation');
  }

  return addDoc(collection(db, COLLECTIONS.VENUES), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
};

export const updateVenue = async (id: string, data: Partial<Venue>) => {
  const venueRef = doc(db, COLLECTIONS.VENUES, id);
  return updateDoc(venueRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

export const getVenue = async (id: string) => {
  return getDoc(doc(db, COLLECTIONS.VENUES, id));
};

export const getVenues = async (validated?: boolean) => {
  let q = query(collection(db, COLLECTIONS.VENUES)); // Ensure it's a query

  if (typeof validated !== 'undefined') {
    q = query(q, where('validated', '==', validated)); // Append conditions
  }

  return getDocs(q);
};

export const findVenueByName = async (name: string) => {
  const q = query(
    collection(db, COLLECTIONS.VENUES),
    where('nameVariants', 'array-contains', name)
  );
  return getDocs(q);
};

export const findVenueByGooglePlaceId = async (googlePlaceId: string) => {
  const q = query(
    collection(db, COLLECTIONS.VENUES),
    where('googlePlaceId', '==', googlePlaceId)
  );
  return getDocs(q);
};