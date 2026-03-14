import { db } from '../src/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { errorService } from './errorService';

export interface AdminAction {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetUserId?: string;
  targetUserName?: string;
  details: string;
  timestamp: Timestamp;
}

export const logAdminAction = async (adminId: string, adminName: string, action: string, details: string, targetUserId?: string, targetUserName?: string) => {
  try {
    const actionRef = doc(collection(db, 'adminActions'));
    await setDoc(actionRef, {
      adminId,
      adminName,
      action,
      targetUserId,
      targetUserName,
      details,
      timestamp: Timestamp.now()
    });
    return true;
  } catch (error) {
    errorService.handleError(error, 'logAdminAction');
    return false;
  }
};

export const updateUserRole = async (userId: string, newRole: string, adminId: string, adminName: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: Timestamp.now()
    });
    await logAdminAction(adminId, adminName, 'UPDATE_ROLE', `Changed user role to ${newRole}`, userId);
    return true;
  } catch (error) {
    errorService.handleError(error, 'updateUserRole');
    return false;
  }
};

export const suspendUser = async (userId: string, reason: string, adminId: string, adminName: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      suspended: true,
      suspensionReason: reason,
      suspendedAt: Timestamp.now(),
      suspendedBy: adminId,
      updatedAt: Timestamp.now()
    });
    await logAdminAction(adminId, adminName, 'SUSPEND_USER', `Suspended user: ${reason}`, userId);
    return true;
  } catch (error) {
    errorService.handleError(error, 'suspendUser');
    return false;
  }
};

export const unsuspendUser = async (userId: string, adminId: string, adminName: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      suspended: false,
      suspensionReason: null,
      suspendedAt: null,
      suspendedBy: null,
      updatedAt: Timestamp.now()
    });
    await logAdminAction(adminId, adminName, 'UNSUSPEND_USER', 'Unsuspended user', userId);
    return true;
  } catch (error) {
    errorService.handleError(error, 'unsuspendUser');
    return false;
  }
};

export const approveMentor = async (userId: string, adminId: string, adminName: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      mentorStatus: 'approved',
      isMentor: true,
      mentorApprovedAt: Timestamp.now(),
      mentorApprovedBy: adminId,
      updatedAt: Timestamp.now()
    });
    await logAdminAction(adminId, adminName, 'APPROVE_MENTOR', 'Approved mentor application', userId);
    return true;
  } catch (error) {
    errorService.handleError(error, 'Error approving mentor');
    return false;
  }
};

export const rejectMentor = async (userId: string, reason: string, adminId: string, adminName: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      mentorStatus: 'rejected',
      isMentor: false,
      mentorRejectionReason: reason,
      mentorRejectedAt: Timestamp.now(),
      mentorRejectedBy: adminId,
      updatedAt: Timestamp.now()
    });
    await logAdminAction(adminId, adminName, 'REJECT_MENTOR', `Rejected mentor application: ${reason}`, userId);
    return true;
  } catch (error) {
    errorService.handleError(error, 'Error rejecting mentor');
    return false;
  }
};

export const getAdminActions = async (limit: number = 50) => {
  try {
    const q = query(collection(db, 'adminActions'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    errorService.handleError(error, 'Error getting admin actions');
    return [];
  }
};

export const sendSystemNotification = async (userId: string, title: string, message: string, type: string = 'info') => {
  try {
    const notifRef = doc(collection(db, 'notifications'));
    await setDoc(notifRef, {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    errorService.handleError(error, 'Error sending notification');
    return false;
  }
};

export const broadcastNotification = async (title: string, message: string, type: string = 'info') => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const promises = usersSnapshot.docs.map(userDoc => 
      sendSystemNotification(userDoc.id, title, message, type)
    );
    await Promise.all(promises);
    return true;
  } catch (error) {
    errorService.handleError(error, 'Error broadcasting notification');
    return false;
  }
};

export const deleteUser = async (userId: string, adminId: string, adminName: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    await logAdminAction(adminId, adminName, 'DELETE_USER', 'Permanently deleted user account', userId);
    return true;
  } catch (error) {
    errorService.handleError(error, 'Error deleting user');
    return false;
  }
};
