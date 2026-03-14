import { db } from '../src/firebase';
import { collection, doc, setDoc, updateDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { errorService } from './errorService';

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'technical' | 'account' | 'billing' | 'mentorship' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  description: string;
  attachments?: string[];
  assignedTo?: string;
  assignedToName?: string;
  responses: TicketResponse[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface TicketResponse {
  id: string;
  userId: string;
  userName: string;
  isAdmin: boolean;
  message: string;
  timestamp: Timestamp | Date;
}

export const createTicket = async (ticketData: Omit<Ticket, 'id' | 'responses' | 'createdAt' | 'updatedAt'>) => {
  try {
    const ticketRef = doc(collection(db, 'tickets'));
    await setDoc(ticketRef, {
      ...ticketData,
      responses: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return ticketRef.id;
  } catch (error) {
    errorService.handleError(error, 'Error creating ticket');
    return null;
  }
};

export const getUserTickets = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ticket[];
  } catch (error) {
    errorService.handleError(error, 'Error getting user tickets');
    return [];
  }
};

export const getAllTickets = async () => {
  try {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ticket[];
  } catch (error) {
    errorService.handleError(error, 'Error getting all tickets');
    return [];
  }
};

export const addTicketResponse = async (ticketId: string, response: Omit<TicketResponse, 'id' | 'timestamp'>) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketDoc = await getDocs(query(collection(db, 'tickets'), where('__name__', '==', ticketId)));
    
    if (!ticketDoc.empty) {
      const ticket = ticketDoc.docs[0].data() as Ticket;
      const newResponse: TicketResponse = {
        ...response,
        id: Date.now().toString(),
        timestamp: Timestamp.now()
      };
      
      await updateDoc(ticketRef, {
        responses: [...ticket.responses, newResponse],
        updatedAt: Timestamp.now()
      });
      return true;
    }
    return false;
  } catch (error) {
    errorService.handleError(error, 'Error adding ticket response');
    return false;
  }
};

export const updateTicketStatus = async (ticketId: string, status: Ticket['status'], assignedTo?: string, assignedToName?: string) => {
  try {
    await updateDoc(doc(db, 'tickets', ticketId), {
      status,
      assignedTo,
      assignedToName,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    errorService.handleError(error, 'Error updating ticket status');
    return false;
  }
};
