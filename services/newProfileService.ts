import { db, storage } from '../src/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface UserProfile {
  uid: string;
  name: string;
  displayName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: string;
  
  campusInvolvement?: string;
  languagesSpoken?: string;
  notifyCampusEvents?: boolean;
  notifyMentorshipRequests?: boolean;
  notifyCommunityUpdates?: boolean;
  
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
  
  isMentor?: boolean;
  mentorExpertise?: string;
  mentorBio?: string;
  
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

export interface ProfileResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export const getProfile = async (uid: string): Promise<ProfileResult<UserProfile>> => {
  try {
    if (!uid) return { success: false, error: 'User ID required' };
    
    const docSnap = await getDoc(doc(db, 'users', uid));
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Profile not found' };
    }
    
    return { success: true, data: { uid, ...docSnap.data() } as UserProfile };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to load profile' };
  }
};

export const updateProfile = async (uid: string, data: Partial<UserProfile>): Promise<ProfileResult> => {
  try {
    if (!uid) return { success: false, error: 'User ID required' };
    
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update profile' };
  }
};

export const createProfile = async (uid: string, data: Partial<UserProfile>): Promise<ProfileResult> => {
  try {
    if (!uid) return { success: false, error: 'User ID required' };
    
    await setDoc(doc(db, 'users', uid), {
      ...data,
      uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }, { merge: true });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create profile' };
  }
};

export const uploadProfilePhoto = async (uid: string, file: File): Promise<ProfileResult<string>> => {
  try {
    if (!uid) return { success: false, error: 'User ID required' };
    if (!file) return { success: false, error: 'File required' };
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type' };
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File too large (max 5MB)' };
    }
    
    const filename = `${uid}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const fileRef = ref(storage, `profile-photos/${filename}`);
    
    await uploadBytes(fileRef, file);
    const photoURL = await getDownloadURL(fileRef);
    
    await updateDoc(doc(db, 'users', uid), {
      photoURL,
      updatedAt: Timestamp.now()
    });
    
    return { success: true, data: photoURL };
  } catch (error: any) {
    let errorMsg = 'Upload failed';
    
    if (error.code === 'storage/unauthorized') {
      errorMsg = 'Permission denied';
    } else if (error.code === 'storage/unauthenticated') {
      errorMsg = 'Please sign in again';
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    return { success: false, error: errorMsg };
  }
};

export const toggleMentor = async (uid: string, isMentor: boolean, mentorData?: Partial<UserProfile>): Promise<ProfileResult> => {
  try {
    if (!uid) return { success: false, error: 'User ID required' };
    
    await updateDoc(doc(db, 'users', uid), {
      isMentor,
      ...mentorData,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update mentor status' };
  }
};
