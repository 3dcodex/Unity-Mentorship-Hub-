import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/firebase';

export interface Connection {
  id: string;
  connectedUserId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: any;
  sessionId?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastUpdated: any;
  sessionId?: string;
  isActive: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  isRead: boolean;
  type: 'text' | 'file' | 'system';
}

export const createConnection = async (userId: string, connectedUserId: string, sessionId?: string) => {
  const connectionId = [userId, connectedUserId].sort().join('_');
  await setDoc(doc(db, `users/${userId}/connections`, connectionId), {
    connectedUserId,
    status: 'accepted',
    createdAt: serverTimestamp(),
    sessionId
  });
  await setDoc(doc(db, `users/${connectedUserId}/connections`, connectionId), {
    connectedUserId: userId,
    status: 'accepted',
    createdAt: serverTimestamp(),
    sessionId
  });
};

export const checkConnection = async (userId: string, otherUserId: string): Promise<boolean> => {
  const connectionId = [userId, otherUserId].sort().join('_');
  const connectionDoc = await getDoc(doc(db, `users/${userId}/connections`, connectionId));
  return connectionDoc.exists() && connectionDoc.data()?.status === 'accepted';
};

export const createConversation = async (userId: string, otherUserId: string, sessionId?: string): Promise<string> => {
  const hasConnection = await checkConnection(userId, otherUserId);
  if (!hasConnection) throw new Error('Users are not connected');
  
  const conversationId = [userId, otherUserId].sort().join('_');
  const conversationRef = doc(db, 'conversations', conversationId);
  const conversationDoc = await getDoc(conversationRef);
  
  if (!conversationDoc.exists()) {
    await setDoc(conversationRef, {
      participants: [userId, otherUserId],
      lastMessage: '',
      lastUpdated: serverTimestamp(),
      sessionId,
      isActive: true
    });
  }
  
  return conversationId;
};

export const sendMessage = async (conversationId: string, senderId: string, text: string) => {
  const conversationRef = doc(db, 'conversations', conversationId);
  const conversationDoc = await getDoc(conversationRef);
  
  if (!conversationDoc.exists()) throw new Error('Conversation not found');
  if (!conversationDoc.data()?.participants.includes(senderId)) throw new Error('Unauthorized');
  
  await addDoc(collection(db, `conversations/${conversationId}/messages`), {
    senderId,
    text,
    createdAt: serverTimestamp(),
    isRead: false,
    type: 'text'
  });
  
  await updateDoc(conversationRef, {
    lastMessage: text,
    lastUpdated: serverTimestamp()
  });
};

export const getConversations = async (userId: string) => {
  const conversationsSnap = await getDocs(
    query(collection(db, 'conversations'), where('participants', 'array-contains', userId))
  );
  return conversationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
};

export const getMessages = async (conversationId: string) => {
  const messagesSnap = await getDocs(
    query(collection(db, `conversations/${conversationId}/messages`), orderBy('createdAt', 'asc'))
  );
  return messagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
};
