// src/context/AuthContext.tsx
// ⚠️ NEVER USE FIREBASE AGAIN - ALL DATA IS IN DYNAMODB
// This auth context is for LEGACY ADMIN TOOLS ONLY - DO NOT USE for new features
// Firebase Auth is intentionally unconfigured and will NEVER be used again
// DO NOT FIX, DO NOT EXTEND - This exists only for legacy admin tool compatibility
'use client';

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  User,
  setPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  browserLocalPersistence,
} from "firebase/auth";

import { auth, db } from "@/lib/config/firebase";
import { 
  doc, 
  getDoc,
  setDoc,
  collection,
  query,
  getDocs
} from "firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";


export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
  godMode?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  isGodMode: boolean;
  canEditArtist: (artistId: string) => Promise<boolean>;
  canEditVenue: (venueId: string) => Promise<boolean>;
  claimArtist: (artistId: string) => Promise<void>;
  claimVenue: (venueId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGodMode, setIsGodMode] = useState(false);

  // If Firebase is not configured, mark as not loading and return early
  if (!auth || !db) {
    if (isLoading) {
      setTimeout(() => setIsLoading(false), 0);
    }
  }

  // Sign in a user with email and password
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    if (!auth || !db) {
      throw new Error("Authentication is not available - Firebase not configured");
    }

    const firestore = db;
    try {
      // Set persistence based on rememberMe preference
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      // Perform the sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;
      setUser(loggedInUser);

      // Load user profile
      const userDoc = await getDoc(doc(firestore, COLLECTIONS.USERS, loggedInUser.uid));
      if (userDoc.exists()) {
        const userProfile = userDoc.data() as UserProfile;
        setProfile(userProfile);
        setIsGodMode(!!userProfile.godMode);
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Sign out the current user
  const logout = async (): Promise<void> => {
    if (!auth) {
      throw new Error("Authentication is not available - Firebase not configured");
    }

    try {
      await auth.signOut();
      setUser(null);
      setProfile(null);
      setIsGodMode(false);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Check if user can edit an artist
  const canEditArtist = async (artistId: string): Promise<boolean> => {
    if (!user || !db) return false;

    // God mode users can edit all artists
    if (isGodMode) return true;

    const firestore = db;
    // Check if user is a member of this artist
    try {
      const memberDoc = await getDoc(doc(firestore, `${COLLECTIONS.ARTISTS}/${artistId}/members`, user.uid));
      return memberDoc.exists();
    } catch (error) {
      console.error("Error checking artist membership:", error);
      return false;
    }
  };

  // Check if user can edit a venue
  const canEditVenue = async (venueId: string): Promise<boolean> => {
    if (!user || !db) return false;

    // God mode users can edit all venues
    if (isGodMode) return true;

    const firestore = db;
    // Check if user is a member of this venue
    try {
      const memberDoc = await getDoc(doc(firestore, `${COLLECTIONS.VENUES}/${venueId}/members`, user.uid));
      return memberDoc.exists();
    } catch (error) {
      console.error("Error checking venue membership:", error);
      return false;
    }
  };

  // Claim an artist page (become a member)
  const claimArtist = async (artistId: string): Promise<void> => {
    if (!user) throw new Error("You must be logged in to claim an artist");
    if (!db) throw new Error("Authentication is not available - Firebase not configured");

    const firestore = db;
    try {
      // Check if the artist already has members
      const membersQuery = query(
        collection(firestore, `${COLLECTIONS.ARTISTS}/${artistId}/members`)
      );
      const membersSnapshot = await getDocs(membersQuery);

      // If artist already has members, throw an error or handle accordingly
      if (!membersSnapshot.empty) {
        throw new Error("This artist has already been claimed");
      }

      // Add the user as an admin member of the artist
      await setDoc(doc(firestore, `${COLLECTIONS.ARTISTS}/${artistId}/members`, user.uid), {
        userId: user.uid,
        email: user.email,
        role: "admin",
        joinedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error claiming artist:", error);
      throw error;
    }
  };

  // Claim a venue page (become a member)
  const claimVenue = async (venueId: string): Promise<void> => {
    if (!user) throw new Error("You must be logged in to claim a venue");
    if (!db) throw new Error("Authentication is not available - Firebase not configured");

    const firestore = db;
    try {
      // Check if the venue already has members
      const membersQuery = query(
        collection(firestore, `${COLLECTIONS.VENUES}/${venueId}/members`)
      );
      const membersSnapshot = await getDocs(membersQuery);

      // If venue already has members, throw an error or handle accordingly
      if (!membersSnapshot.empty) {
        throw new Error("This venue has already been claimed");
      }

      // Add the user as an admin member of the venue
      await setDoc(doc(firestore, `${COLLECTIONS.VENUES}/${venueId}/members`, user.uid), {
        userId: user.uid,
        email: user.email,
        role: "admin",
        joinedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error claiming venue:", error);
      throw error;
    }
  };

  // Effect to handle auth state changes
  useEffect(() => {
    if (!auth || !db) {
      setIsLoading(false);
      return;
    }

    const firestore = db;
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setIsLoading(true);

      try {
        if (authUser) {
          setUser(authUser);

          // Load user profile
          const userDoc = await getDoc(doc(firestore, COLLECTIONS.USERS, authUser.uid));
          if (userDoc.exists()) {
            const userProfile = userDoc.data() as UserProfile;
            setProfile(userProfile);
            setIsGodMode(!!userProfile.godMode);
          } else {
            // Create minimal profile if needed
            const newProfile: UserProfile = {
              uid: authUser.uid,
              email: authUser.email || '',
              displayName: authUser.displayName || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await setDoc(doc(firestore, COLLECTIONS.USERS, authUser.uid), newProfile);
            setProfile(newProfile);
            setIsGodMode(false);
          }
        } else {
          setUser(null);
          setProfile(null);
          setIsGodMode(false);
        }
      } catch (error) {
        console.error("Auth state observer error:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        login,
        logout,
        isGodMode,
        canEditArtist,
        canEditVenue,
        claimArtist,
        claimVenue
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};