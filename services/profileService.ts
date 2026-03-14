import { db } from '../src/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { errorService } from './errorService';

export interface UserProfile {
  uid: string;
  name: string;
  displayName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: string;
  
  // General preferences
  campusInvolvement?: string;
  languagesSpoken?: string;
  notifyCampusEvents?: boolean;
  notifyMentorshipRequests?: boolean;
  notifyCommunityUpdates?: boolean;
  
  // Complete profile fields
  bio?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  skills?: string;
  interests?: string;
  achievements?: string;
  workExperience?: string;
  education?: string;
  certifications?: string;
  availability?: string;
  
  // Mentor fields
  isMentor?: boolean;
  mentorExpertise?: string;
  mentorBio?: string;
  mentorYearsExperience?: number;
  mentorAvailability?: string;
  mentorMaxMentees?: number;
  mentorPreferredTopics?: string;
  mentorLinkedIn?: string;
  mentorMotivation?: string;
  mentorApplicationDate?: any;
  mentorStatus?: 'pending' | 'approved' | 'rejected';
  
  // Domestic Student fields
  university?: string;
  major?: string;
  yearOfStudy?: number;
  clubsSocieties?: string;
  offerPeerMentorship?: boolean;
  campusBuddy?: boolean;
  maxMentees?: number;
  expertise?: string;
  willingMentorIntl?: boolean;
  culturalFamiliarity?: string;
  eventHost?: boolean;
  eventApproval?: string;
  eventModeration?: boolean;
  financialAidStatus?: string;
  
  // International Student fields
  homeCountry?: string;
  visaStatus?: string;
  arrivalDate?: string;
  needsHousing?: boolean;
  culturalAdjustmentHelp?: boolean;
  
  // Alumni fields
  graduationYear?: string;
  currentEmployer?: string;
  jobTitle?: string;
  industry?: string;
  yearsExperience?: number;
  availableForMentoring?: boolean;
  canPostJobs?: boolean;
  
  // Professional fields
  companyName?: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companySize?: string;
  professionalBio?: string;
  offerInternships?: boolean;
  hostWebinars?: boolean;
  
  createdAt?: any;
  updatedAt?: any;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { uid, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    errorService.handleError(error, 'Error getting user profile');
    return null;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    errorService.handleError(error, 'Error updating user profile');
    return false;
  }
};

export const createUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      ...data,
      uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }, { merge: true });
    return true;
  } catch (error) {
    errorService.handleError(error, 'Error creating user profile');
    return false;
  }
};

export const updateProfilePhoto = async (uid: string, photoURL: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      photoURL,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    errorService.handleError(error, 'Error updating profile photo');
    return false;
  }
};

export const toggleMentorStatus = async (uid: string, isMentor: boolean, mentorData?: Partial<UserProfile>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      isMentor,
      ...mentorData,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    errorService.handleError(error, 'Error toggling mentor status');
    return false;
  }
};
