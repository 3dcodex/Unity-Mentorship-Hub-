import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { errorService } from '../services/errorService';
import { checkAdminAccess } from '../services/authService';

const DebugRole: React.FC = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [customClaims, setCustomClaims] = useState<any>(null);
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDebugInfo = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get Firestore data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setUserData(userDoc.data());

        // Get custom claims
        const tokenResult = await user.getIdTokenResult();
        setCustomClaims(tokenResult.claims);

        // Check admin access
        const access = await checkAdminAccess(user);
        setHasAdminAccess(access);
      } catch (error) {
        errorService.handleError(error, 'Error loading debug info');
      } finally {
        setLoading(false);
      }
    };

    loadDebugInfo();
  }, [user]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return <div className="p-8">Not logged in</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Role Debug Information</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">User Info</h2>
          <div className="space-y-2">
            <p><strong>UID:</strong> {user.uid}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Firestore Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Custom Claims</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(customClaims, null, 2)}
          </pre>
        </div>

        <div className={`rounded-lg shadow p-6 mb-6 ${hasAdminAccess ? 'bg-green-100' : 'bg-red-100'}`}>
          <h2 className="text-xl font-bold mb-4">Admin Access Check</h2>
          <p className="text-2xl font-bold">
            {hasAdminAccess ? '✅ HAS ACCESS' : '❌ NO ACCESS'}
          </p>
        </div>

        <div className="bg-blue-100 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Expected Values for Admin Access</h2>
          <div className="space-y-2">
            <p><strong>Firestore role should be one of:</strong></p>
            <ul className="list-disc ml-6">
              <li>'admin'</li>
              <li>'super_admin'</li>
              <li>'moderator'</li>
            </ul>
            <p className="mt-4"><strong>OR Custom claims should have:</strong></p>
            <ul className="list-disc ml-6">
              <li>admin: true</li>
              <li>super_admin: true</li>
              <li>moderator: true</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugRole;
