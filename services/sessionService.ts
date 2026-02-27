import { db } from '../src/firebase';
import { collection, doc, setDoc, updateDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

export interface Session {
  id: string;
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  date: any;
  duration: number;
  topic: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  meetingLink?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  mentorId: string;
  mentorName: string;
  requestedDate: any;
  topic: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export const createSession = async (sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const sessionRef = doc(collection(db, 'sessions'));
    await setDoc(sessionRef, {
      ...sessionData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return sessionRef.id;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
  try {
    const bookingRef = doc(collection(db, 'bookings'));
    await setDoc(bookingRef, {
      ...bookingData,
      createdAt: Timestamp.now()
    });
    return bookingRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    return null;
  }
};

export const getUserSessions = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('menteeId', '==', userId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }
};

export const getMentorSessions = async (mentorId: string) => {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('mentorId', '==', mentorId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting mentor sessions:', error);
    return [];
  }
};

export const updateSessionStatus = async (sessionId: string, status: Session['status'], notes?: string) => {
  try {
    await updateDoc(doc(db, 'sessions', sessionId), {
      status,
      notes,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating session status:', error);
    return false;
  }
};

export const rateSession = async (sessionId: string, rating: number, feedback: string) => {
  try {
    await updateDoc(doc(db, 'sessions', sessionId), {
      rating,
      feedback,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error rating session:', error);
    return false;
  }
};
