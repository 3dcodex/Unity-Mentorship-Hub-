import React, { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../src/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const FixAdmin: React.FC = () => {
  const [email, setEmail] = useState('unitymentorshiphub@gmail.com');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFix = async () => {
    setLoading(true);
    setResult('');
    
    try {
      // Login first
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
      
      // Set Firestore document
      await setDoc(doc(db, 'users', uid), {
        email: email,
        role: 'super_admin',
        status: 'active',
        displayName: 'Super Admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
      
      // Verify
      const userDoc = await getDoc(doc(db, 'users', uid));
      const data = userDoc.data();
      
      setResult(`✅ Success! Role set to: ${data?.role}\nUID: ${uid}\nNow logout and login again.`);
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-black text-gray-900 mb-6">Fix Admin Access</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
            />
          </div>
          
          <button
            onClick={handleFix}
            disabled={loading || !password}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? 'Fixing...' : 'Fix Admin Role'}
          </button>
          
          {result && (
            <div className={`p-4 rounded-xl whitespace-pre-line ${result.includes('❌') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <p className="text-sm font-bold">{result}</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <p className="text-xs text-blue-700 font-bold">
            This will set your Firestore role to super_admin. After clicking "Fix Admin Role", 
            logout and login again to see admin dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FixAdmin;
