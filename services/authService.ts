import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { errorService } from './errorService';

export interface UserRole {
  role: 'student' | 'mentor' | 'admin' | 'super_admin' | 'moderator';
  status: 'active' | 'suspended' | 'pending';
}

export const checkUserRole = async (user: User): Promise<UserRole | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return null;
    
    const data = userDoc.data();
    return {
      role: data.role || 'student',
      status: data.status || 'active'
    };
  } catch (error) {
    errorService.handleError(error, 'checkUserRole');
    return null;
  }
};

export const checkAdminAccess = async (user: User): Promise<boolean> => {
  try {
    // Check Firestore first (immediate access)
    const userRole = await checkUserRole(user);
    
    // Check if role has admin panel access
    if (userRole?.role === 'admin' || 
        userRole?.role === 'super_admin' || 
        userRole?.role === 'moderator') {
      return true;
    }
    
    // Then check custom claims
    const tokenResult = await user.getIdTokenResult();
    
    if (tokenResult.claims.admin || 
        tokenResult.claims.super_admin || 
        tokenResult.claims.moderator) {
      return true;
    }
    
    return false;
  } catch (error) {
    errorService.handleError(error, 'checkAdminAccess');
    return false;
  }
};

export const checkModeratorAccess = async (user: User): Promise<boolean> => {
  try {
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims.moderator || tokenResult.claims.admin || tokenResult.claims.super_admin) {
      return true;
    }
    
    const userRole = await checkUserRole(user);
    return ['moderator', 'admin', 'super_admin'].includes(userRole?.role || '');
  } catch (error) {
    errorService.handleError(error, 'checkModeratorAccess');
    return false;
  }
};
