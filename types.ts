
export type Role = 'International Student' | 'Domestic Student' | 'Alumni' | 'Professional';

export interface Mentor {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  bio: string;
  imageUrl: string;
  online: boolean;
}

export interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  imageUrl: string;
}

export interface UserProfile {
  name: string;
  role: Role;
  interests: string[];
  onboardingComplete: boolean;
}
