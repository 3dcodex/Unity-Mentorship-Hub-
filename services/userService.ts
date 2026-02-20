import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../src/firebase';
import { Role } from '../types';

export interface UserProfile {
  uid: string;
  email: string;
  role: Role;
  offerTags: string[];
  seekingTags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  displayName?: string;
  photoURL?: string;
}

/**
 * Create a new user profile in Firestore
 */
export const createUserProfile = async (
  uid: string,
  email: string,
  role: Role,
  offerTags: string[],
  seekingTags: string[]
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const existingUser = await getDoc(userRef);

  if (existingUser.exists()) {
    return; // prevent overwrite
  }

  const now = Timestamp.now();

  const userProfile: UserProfile = {
    uid,
    email,
    role,
    offerTags,
    seekingTags,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(userRef, userProfile);
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};
