import { db } from '../src/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { errorService } from './errorService';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

export interface EmailLog {
  id: string;
  to: string[];
  subject: string;
  body: string;
  sentBy: string;
  sentAt: Date;
  status: 'sent' | 'failed';
  error?: string;
}

export const sendEmailToUser = async (
  userId: string,
  subject: string,
  body: string,
  adminId: string,
  adminName: string
): Promise<boolean> => {
  try {
    // Log the email
    await addDoc(collection(db, 'emailLogs'), {
      to: [userId],
      subject,
      body,
      sentBy: adminId,
      sentByName: adminName,
      sentAt: Timestamp.now(),
      status: 'sent',
      type: 'individual'
    });

    // Create notification for user
    await addDoc(collection(db, 'notifications'), {
      userId,
      title: subject,
      message: body,
      type: 'email',
      read: false,
      createdAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    errorService.handleError(error, 'sendEmailToUser');
    return false;
  }
};

export const sendBulkEmail = async (
  userIds: string[],
  subject: string,
  body: string,
  adminId: string,
  adminName: string
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await sendEmailToUser(userId, subject, body, adminId, adminName);
    if (result) success++;
    else failed++;
  }

  return { success, failed };
};

export const sendNotificationToUser = async (
  userId: string,
  title: string,
  message: string,
  type: string = 'info'
): Promise<boolean> => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    errorService.handleError(error, 'sendNotificationToUser');
    return false;
  }
};

export const broadcastNotification = async (
  title: string,
  message: string,
  type: string = 'info',
  userFilter?: { role?: string; status?: string }
): Promise<number> => {
  try {
    const usersCollection = collection(db, 'users');
    let usersQuery;
    
    if (userFilter?.role) {
      usersQuery = query(usersCollection, where('role', '==', userFilter.role));
    } else {
      usersQuery = usersCollection;
    }
    
    const usersSnap = await getDocs(usersQuery);
    let sentCount = 0;

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      
      // Apply status filter if provided
      if (userFilter?.status && userData.status !== userFilter.status) {
        continue;
      }

      await addDoc(collection(db, 'notifications'), {
        userId: userDoc.id,
        title,
        message,
        type,
        read: false,
        createdAt: Timestamp.now()
      });
      
      sentCount++;
    }

    return sentCount;
  } catch (error) {
    errorService.handleError(error, 'Error broadcasting notification');
    return 0;
  }
};

export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  try {
    const templatesSnap = await getDocs(collection(db, 'emailTemplates'));
    return templatesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailTemplate));
  } catch (error) {
    errorService.handleError(error, 'Error getting email templates');
    return [];
  }
};

export const createEmailTemplate = async (
  name: string,
  subject: string,
  body: string,
  category: string
): Promise<boolean> => {
  try {
    await addDoc(collection(db, 'emailTemplates'), {
      name,
      subject,
      body,
      category,
      createdAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    errorService.handleError(error, 'Error creating email template');
    return false;
  }
};

export const getEmailLogs = async (limit: number = 100): Promise<EmailLog[]> => {
  try {
    const logsSnap = await getDocs(collection(db, 'emailLogs'));
    return logsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as EmailLog))
      .slice(0, limit);
  } catch (error) {
    errorService.handleError(error, 'Error getting email logs');
    return [];
  }
};
