import { db } from '../src/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';

export interface ImpersonationSession {
  id: string;
  adminId: string;
  adminName: string;
  targetUserId: string;
  targetUserName: string;
  startedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'ended';
}

const IMPERSONATION_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export const startImpersonation = async (
  adminId: string,
  adminName: string,
  targetUserId: string,
  targetUserName: string
): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
  try {
    // Check if admin is super admin
    const adminDoc = await getDoc(doc(db, 'users', adminId));
    if (!adminDoc.exists() || adminDoc.data().role !== 'super_admin') {
      return { success: false, error: 'Only super admins can impersonate users' };
    }

    // Check if there's already an active impersonation session
    const activeSessionQuery = query(
      collection(db, 'impersonationSessions'),
      where('adminId', '==', adminId),
      where('status', '==', 'active')
    );
    const activeSessions = await getDocs(activeSessionQuery);
    
    if (!activeSessions.empty) {
      return { success: false, error: 'You already have an active impersonation session' };
    }

    const now = Timestamp.now();
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + IMPERSONATION_DURATION));

    // Create impersonation session
    const sessionRef = await addDoc(collection(db, 'impersonationSessions'), {
      adminId,
      adminName,
      targetUserId,
      targetUserName,
      startedAt: now,
      expiresAt,
      status: 'active',
      actions: []
    });

    // Log admin action
    await addDoc(collection(db, 'adminActions'), {
      adminId,
      adminName,
      action: 'start_impersonation',
      targetUserId,
      targetUserName,
      details: JSON.stringify({
        sessionId: sessionRef.id,
        duration: IMPERSONATION_DURATION / 60000 + ' minutes'
      }),
      timestamp: now
    });

    return { success: true, sessionId: sessionRef.id };
  } catch (error) {
    console.error('Error starting impersonation:', error);
    return { success: false, error: 'Failed to start impersonation session' };
  }
};

export const endImpersonation = async (
  sessionId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const sessionDoc = await getDoc(doc(db, 'impersonationSessions', sessionId));
    
    if (!sessionDoc.exists()) {
      return { success: false, error: 'Session not found' };
    }

    const sessionData = sessionDoc.data();
    
    if (sessionData.adminId !== adminId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update session status
    await updateDoc(doc(db, 'impersonationSessions', sessionId), {
      status: 'ended',
      endedAt: Timestamp.now()
    });

    // Log admin action
    await addDoc(collection(db, 'adminActions'), {
      adminId,
      adminName: sessionData.adminName,
      action: 'end_impersonation',
      targetUserId: sessionData.targetUserId,
      targetUserName: sessionData.targetUserName,
      details: JSON.stringify({ sessionId }),
      timestamp: Timestamp.now()
    });

    return { success: true };
  } catch (error) {
    console.error('Error ending impersonation:', error);
    return { success: false, error: 'Failed to end impersonation session' };
  }
};

export const getActiveImpersonationSession = async (
  adminId: string
): Promise<ImpersonationSession | null> => {
  try {
    const activeSessionQuery = query(
      collection(db, 'impersonationSessions'),
      where('adminId', '==', adminId),
      where('status', '==', 'active')
    );
    
    const sessions = await getDocs(activeSessionQuery);
    
    if (sessions.empty) {
      return null;
    }

    const sessionDoc = sessions.docs[0];
    const data = sessionDoc.data();

    // Check if session has expired
    const now = new Date();
    const expiresAt = data.expiresAt.toDate();
    
    if (now > expiresAt) {
      // Auto-expire the session
      await updateDoc(doc(db, 'impersonationSessions', sessionDoc.id), {
        status: 'expired'
      });
      return null;
    }

    return {
      id: sessionDoc.id,
      adminId: data.adminId,
      adminName: data.adminName,
      targetUserId: data.targetUserId,
      targetUserName: data.targetUserName,
      startedAt: data.startedAt.toDate(),
      expiresAt: data.expiresAt.toDate(),
      status: data.status
    };
  } catch (error) {
    console.error('Error getting active impersonation session:', error);
    return null;
  }
};

export const logImpersonationAction = async (
  sessionId: string,
  action: string,
  details: any
): Promise<void> => {
  try {
    const sessionDoc = await getDoc(doc(db, 'impersonationSessions', sessionId));
    
    if (!sessionDoc.exists()) {
      return;
    }

    const currentActions = sessionDoc.data().actions || [];
    
    await updateDoc(doc(db, 'impersonationSessions', sessionId), {
      actions: [
        ...currentActions,
        {
          action,
          details,
          timestamp: Timestamp.now()
        }
      ]
    });
  } catch (error) {
    console.error('Error logging impersonation action:', error);
  }
};

export const checkImpersonationRestrictions = (action: string): boolean => {
  // Actions that are NOT allowed during impersonation
  const restrictedActions = [
    'change_password',
    'delete_account',
    'change_email',
    'change_role',
    'add_payment_method',
    'make_payment'
  ];

  return !restrictedActions.includes(action);
};
