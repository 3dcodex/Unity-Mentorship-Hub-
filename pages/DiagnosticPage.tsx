import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/firebase';

const DiagnosticPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            setError('User document not found');
          }
        } catch (err: any) {
          setError(err.message);
        }
      }
    };
    loadUserData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">System Diagnostic</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">Firebase Configuration</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>API Key: {import.meta.env.VITE_FIREBASE_API_KEY ? '✓ Configured' : '✗ Missing'}</div>
            <div>Auth Domain: {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✓ Configured' : '✗ Missing'}</div>
            <div>Project ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✓ Configured' : '✗ Missing'}</div>
            <div>Storage Bucket: {import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✓ Configured' : '✗ Missing'}</div>
          </div>
          <p className="text-xs text-gray-500 mt-4">⚠️ Actual values hidden for security</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            <div>User: {user ? '✓ Authenticated' : '✗ Not authenticated'}</div>
            {user && (
              <>
                <div>UID: {user.uid}</div>
                <div>Email: {user.email}</div>
              </>
            )}
          </div>
        </div>

        {user && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">User Data</h2>
            {error ? (
              <div className="text-red-600">Error: {error}</div>
            ) : userData ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(userData, null, 2)}
              </pre>
            ) : (
              <div>Loading user data...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticPage;
