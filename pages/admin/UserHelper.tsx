import React, { useState } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../App';

const UserHelper: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [searchName, setSearchName] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const searchUser = async () => {
    if (!searchName.trim()) {
      setError('Please enter a user name');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setUserData(null);

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('name', '==', searchName.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const data = { id: userDoc.id, ...userDoc.data() };
        setUserData(data);
        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setMessage('User found!');
      } else {
        setError('User not found');
      }
    } catch (err: any) {
      setError('Error fetching user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    if (!userData) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const updates: any = {
        name,
        phone,
        updatedAt: new Date(),
        updatedBy: currentAdmin?.uid
      };

      if (email !== userData.email) {
        updates.email = email;
      }

      await updateDoc(doc(db, 'users', userData.id), updates);

      setMessage('User details updated successfully!');
      setUserData({ ...userData, ...updates });
    } catch (err: any) {
      setError('Error updating user: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const functions = getFunctions();
      const adminResetPassword = httpsCallable(functions, 'adminResetPassword');
      const result = await adminResetPassword({ uid: userData.id, newPassword });
      setMessage('Password reset successfully!');
      setNewPassword('');
    } catch (err: any) {
      setError('Error resetting password: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">User Helper</h1>

        {/* Search Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-black mb-4">Search User by Name</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter User Name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
            />
            <button
              onClick={searchUser}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-100 border-2 border-green-500 text-green-700 px-4 py-3 rounded-xl mb-6">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* User Details Section */}
        {userData && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-2xl font-black mb-4">User Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">UID</label>
                <input
                  type="text"
                  value={userData.id}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                <input
                  type="text"
                  value={userData.role || 'N/A'}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                <input
                  type="text"
                  value={userData.status || 'N/A'}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Created At</label>
                <input
                  type="text"
                  value={userData.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100"
                />
              </div>

              {userData.school && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">School</label>
                  <input
                    type="text"
                    value={userData.school}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100"
                  />
                </div>
              )}

              {userData.programName && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Program</label>
                  <input
                    type="text"
                    value={userData.programName}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100"
                  />
                </div>
              )}

              <button
                onClick={saveChanges}
                disabled={saving}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Password Reset Section */}
        {userData && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-black mb-4">Reset Password</h2>
            <div className="flex gap-3">
              <input
                type="password"
                placeholder="New Password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 outline-none"
              />
              <button
                onClick={resetPassword}
                disabled={saving}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50"
              >
                Reset Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHelper;
