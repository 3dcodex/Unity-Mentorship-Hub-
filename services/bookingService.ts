import { db } from '../src/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, Timestamp, getDoc } from 'firebase/firestore';

export interface SessionType {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  description: string;
}

export interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

export interface Booking {
  id?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  mentorId: string;
  mentorName: string;
  sessionType: string;
  sessionDuration: number;
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  studentNotes: string;
  price: number;
  platformFee: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  paymentIntentId?: string;
  meetingLink?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  cancelledAt?: Timestamp;
  completedAt?: Timestamp;
  cancellationReason?: string;
  reminderSent24h?: boolean;
  reminderSent1h?: boolean;
}

export interface BookingReview {
  bookingId: string;
  studentId: string;
  mentorId: string;
  rating: number;
  feedback: string;
  createdAt: Timestamp;
}

export const SESSION_TYPES: SessionType[] = [
  { id: '30min-chat', name: '30 Min Chat', duration: 30, price: 0, description: 'Quick intro or Q&A session' },
  { id: '60min-video', name: '60 Min Video Call', duration: 60, price: 0, description: 'In-depth discussion or mentorship' },
  { id: 'resume-review', name: 'Resume Review', duration: 45, price: 0, description: 'Professional resume feedback' },
  { id: 'mock-interview', name: 'Mock Interview', duration: 60, price: 0, description: 'Practice interview with feedback' },
  { id: 'career-consult', name: 'Career Consultation', duration: 90, price: 0, description: 'Comprehensive career planning' },
];

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, 'bookings'), {
    ...bookingData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getBookingsByStudent = async (studentId: string): Promise<Booking[]> => {
  const q = query(collection(db, 'bookings'), where('studentId', '==', studentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
};

export const getBookingsByMentor = async (mentorId: string): Promise<Booking[]> => {
  const q = query(collection(db, 'bookings'), where('mentorId', '==', mentorId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
};

export const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
  await updateDoc(doc(db, 'bookings', bookingId), {
    status,
    updatedAt: Timestamp.now(),
    ...(status === 'completed' && { completedAt: Timestamp.now() }),
    ...(status === 'cancelled' && { cancelledAt: Timestamp.now() }),
  });
};

export const cancelBooking = async (bookingId: string, reason: string) => {
  await updateDoc(doc(db, 'bookings', bookingId), {
    status: 'cancelled',
    cancellationReason: reason,
    cancelledAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

export const addBookingReview = async (reviewData: Omit<BookingReview, 'createdAt'>) => {
  await addDoc(collection(db, 'bookingReviews'), {
    ...reviewData,
    createdAt: Timestamp.now(),
  });
  
  // Update booking with review flag
  await updateDoc(doc(db, 'bookings', reviewData.bookingId), {
    hasReview: true,
    updatedAt: Timestamp.now(),
  });
};

export const getMentorAvailability = async (mentorId: string): Promise<TimeSlot[]> => {
  // For now, return mock availability
  // Later: fetch from mentor's availability settings
  const slots: TimeSlot[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    ['09:00', '10:30', '13:00', '14:30', '16:00'].forEach(time => {
      slots.push({ date: dateStr, time, available: true });
    });
  }
  
  return slots;
};

export const getBooking = async (bookingId: string): Promise<Booking | null> => {
  const docSnap = await getDoc(doc(db, 'bookings', bookingId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Booking;
  }
  return null;
};
