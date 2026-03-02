import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Role, getPermissions, Permission } from '../types/roles';

export const usePermissions = (userId: string | undefined) => {
  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [permissions, setPermissions] = useState<Permission>(getPermissions(Role.STUDENT));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserRole = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          console.warn('User document not found:', userId);
          setLoading(false);
          return;
        }
        
        const userRoleString = (userDoc.data()?.role || 'student') as string;
        
        // Map role string to Role enum
        let userRole: Role;
        switch (userRoleString.toLowerCase()) {
          case 'super_admin':
          case 'superadmin':
            userRole = Role.SUPER_ADMIN;
            break;
          case 'admin':
            userRole = Role.ADMIN;
            break;
          case 'moderator':
            userRole = Role.MODERATOR;
            break;
          case 'professional':
          case 'mentor':
            userRole = Role.PROFESSIONAL;
            break;
          case 'student':
          default:
            userRole = Role.STUDENT;
        }
        
        console.log('Loaded user role:', userRoleString, '→', userRole);
        setRole(userRole);
        setPermissions(getPermissions(userRole));
      } catch (error) {
        console.error('Error loading user role:', error);
        // Set default role on error
        setRole(Role.STUDENT);
        setPermissions(getPermissions(Role.STUDENT));
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [userId]);

  return { role, permissions, loading };
};
