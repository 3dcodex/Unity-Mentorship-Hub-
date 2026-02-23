import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/firebase';

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
    console.error('Error checking user role:', error);
    return null;
  }
};

export const checkAdminAccess = async (user: User): Promise<boolean> => {
  try {
    console.log('Checking admin access for user:', user.uid);
    
    // Check Firestore first (immediate access)
    const userRole = await checkUserRole(user);
    console.log('User role from Firestore:', userRole);
    
    if (userRole?.role === 'admin' || userRole?.role === 'super_admin') {
      console.log('Admin access granted via Firestore role');
      return true;
    }
    
    // Then check custom claims
    const tokenResult = await user.getIdTokenResult();
    console.log('Custom claims:', tokenResult.claims);
    
    if (tokenResult.claims.admin || tokenResult.claims.super_admin) {
      console.log('Admin access granted via custom claims');
      return true;
    }
    
    console.log('Admin access denied');
    return false;
  } catch (error) {
    console.error('Error checking admin access:', error);
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
    console.error('Error checking moderator access:', error);
    return false;
  }
};
