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
  name?: string;
  displayName?: string;
  phone?: string;
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
  seekingTags: string[],
  name?: string,
  phone?: string,
  university?: string,
  isMentor?: boolean,
  professionalData?: { companyName: string; jobTitle: string; industry?: string; yearsExperience?: number }
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const existingUser = await getDoc(userRef);

  if (existingUser.exists()) {
    return;
  }

  const now = Timestamp.now();
  const nameParts = name?.split(' ') || [];

  const userProfile: any = {
    uid,
    email,
    role,
    offerTags,
    seekingTags,
    createdAt: now,
    updatedAt: now,
    accountStatus: 'active',
    status: 'active',
  };

  if (name) {
    userProfile.name = name;
    userProfile.displayName = name;
    userProfile.firstName = nameParts[0] || '';
    userProfile.lastName = nameParts.slice(1).join(' ') || '';
  }

  if (phone) userProfile.phone = phone;
  if (university) userProfile.university = university;
  if (isMentor !== undefined) userProfile.isMentor = isMentor;

  if (professionalData) {
    userProfile.companyName = professionalData.companyName;
    userProfile.company = professionalData.companyName;
    userProfile.jobTitle = professionalData.jobTitle;
    if (professionalData.industry) userProfile.industry = professionalData.industry;
    if (professionalData.yearsExperience !== undefined) userProfile.yearsExperience = professionalData.yearsExperience;
  }

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
