import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';

const AdminDebug: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<any>(null);
  const [firestoreRole, setFirestoreRole] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkClaims();
      checkFirestore();
    }
  }, [user]);

  const checkClaims = async () => {
    if (!user) return;
    const tokenResult = await user.getIdTokenResult();
    setClaims(tokenResult.claims);
  };

  const checkFirestore = async () => {
    if (!user) return;
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../src/firebase');
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    setFirestoreRole(userDoc.data());
  };

  const refreshToken = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await user.getIdToken(true);
      await checkClaims();
      alert('Token refreshed! Check claims below.');
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fixAdminAccess = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../src/firebase');
      
      await setDoc(doc(db, 'users', user.uid), {
        role: 'super_admin',
        status: 'active',
        email: user.email
      }, { merge: true });

      alert('Firestore updated! Now refresh token and try /admin');
      await checkFirestore();
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Admin Access Debug</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-black mb-4">User Info</h2>
            <p className="text-gray-600">Email: {user?.email}</p>
            <p className="text-gray-600">UID: {user?.uid}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-black mb-4">Custom Claims (Token)</h2>
            {claims ? (
              <pre className="bg-gray-50 p-4 rounded-xl overflow-auto text-sm">
                {JSON.stringify(claims, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">Loading...</p>
            )}
            <div className="mt-4">
              <p className="text-sm font-bold mb-2">Admin Access:</p>
              <p className={`text-lg font-black ${claims?.admin ? 'text-green-600' : 'text-red-600'}`}>
                {claims?.admin ? '✅ HAS ADMIN CLAIM' : '❌ NO ADMIN CLAIM'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-black mb-4">Firestore Role</h2>
            {firestoreRole ? (
              <pre className="bg-gray-50 p-4 rounded-xl overflow-auto text-sm">
                {JSON.stringify(firestoreRole, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">Loading...</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-black mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={refreshToken}
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh Token (Force Update)'}
              </button>
              
              <button
                onClick={fixAdminAccess}
                disabled={loading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Fixing...' : 'Fix Firestore Role'}
              </button>

              <button
                onClick={() => navigate('/admin')}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700"
              >
                Try Admin Access
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
            <h3 className="text-xl font-black text-yellow-900 mb-2">Troubleshooting Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-yellow-900">
              <li>Check if custom claims show admin: true</li>
              <li>If NO admin claim, logout and login again</li>
              <li>Click "Refresh Token" button above</li>
              <li>If still no access, check Firebase Console</li>
              <li>Click "Fix Firestore Role" to update database</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDebug;
