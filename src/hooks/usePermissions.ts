import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Role, getPermissions, Permission } from '../types/roles';

export const usePermissions = (userId: string | undefined) => {
  const [role, setRole] = useState<Role>(Role.GUEST);
  const [permissions, setPermissions] = useState<Permission>(getPermissions(Role.GUEST));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserRole = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userRole = (userDoc.data()?.role || 'guest') as Role;
        setRole(userRole);
        setPermissions(getPermissions(userRole));
      } catch (error) {
        console.error('Error loading user role:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [userId]);

  return { role, permissions, loading };
};
