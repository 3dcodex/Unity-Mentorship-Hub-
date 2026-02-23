import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../src/firebase';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

const AdminPromotion: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    setUsers(usersData);
  };

  const promoteUser = async (uid: string, role: string) => {
    if (!confirm(`Promote user to ${role}?`)) return;
    
    setLoading(true);
    try {
      const functions = getFunctions();
      const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
      await setAdminClaim({ uid, role });
      alert('User promoted successfully!');
      loadUsers();
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Admin Promotion</h1>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">User</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Current Role</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-100">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{user.name || user.email}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                      {user.role || 'student'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => promoteUser(user.id, 'admin')}
                        disabled={loading}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200 disabled:opacity-50"
                      >
                        Make Admin
                      </button>
                      <button
                        onClick={() => promoteUser(user.id, 'moderator')}
                        disabled={loading}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-200 disabled:opacity-50"
                      >
                        Make Moderator
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPromotion;
