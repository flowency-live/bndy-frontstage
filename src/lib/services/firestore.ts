//src\lib\services\firestore.ts
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { collection, addDoc, getDocs, query, where, getDoc, doc, updateDoc } from 'firebase/firestore';
import type { Venue, EventFormData } from '@/lib/types';  // Import from central types file


// Existing gig operations
export const addGig = async (data: EventFormData) => {
  if (!db) throw new Error("Firestore not configured");
  const firestore = db;
  return addDoc(collection(firestore, COLLECTIONS.EVENTS), {
    ...data,
    type: 'gig',
    status: 'pending',
    createdAt: new Date().toISOString()
  });
};

export const getGigs = async () => {
  if (!db) throw new Error("Firestore not configured");
  const firestore = db;
  const q = query(
    collection(firestore, COLLECTIONS.EVENTS),
    where('type', '==', 'gig')
  );
  return getDocs(q);
};

// New venue operations
export const addVenue = async (data: Omit<Venue, 'id'>) => {
  if (!db) throw new Error("Firestore not configured");
  if (!data.googlePlaceId || !data.location) {
    throw new Error('Missing required fields for venue creation');
  }

  const firestore = db;
  return addDoc(collection(firestore, COLLECTIONS.VENUES), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
};

export const updateVenue = async (id: string, data: Partial<Venue>) => {
  if (!db) throw new Error("Firestore not configured");
  const firestore = db;
  const venueRef = doc(firestore, COLLECTIONS.VENUES, id);
  return updateDoc(venueRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

export const getVenue = async (id: string) => {
  if (!db) throw new Error("Firestore not configured");
  const firestore = db;
  return getDoc(doc(firestore, COLLECTIONS.VENUES, id));
};

export const getVenues = async (validated?: boolean) => {
  if (!db) throw new Error("Firestore not configured");
  const firestore = db;
  let q = query(collection(firestore, COLLECTIONS.VENUES)); // Ensure it's a query

  if (typeof validated !== 'undefined') {
    q = query(q, where('validated', '==', validated)); // Append conditions
  }

  return getDocs(q);
};

export const findVenueByName = async (name: string) => {
  if (!db) throw new Error("Firestore not configured");
  const firestore = db;
  const q = query(
    collection(firestore, COLLECTIONS.VENUES),
    where('nameVariants', 'array-contains', name)
  );
  return getDocs(q);
};

export const findVenueByGooglePlaceId = async (googlePlaceId: string) => {
  if (!db) throw new Error("Firestore not configured");
  const firestore = db;
  const q = query(
    collection(firestore, COLLECTIONS.VENUES),
    where('googlePlaceId', '==', googlePlaceId)
  );
  return getDocs(q);
};