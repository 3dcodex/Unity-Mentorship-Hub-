import React, { useState } from 'react';

const AdminSetup: React.FC = () => {
  const [email, setEmail] = useState('unitymentorshiphub@gmail.com');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const response = await fetch('https://us-central1-unity-mentorship-hub-ca76e.cloudfunctions.net/initializeSuperAdmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, secretKey })
      });
      
      const text = await response.text();
      setResult(text);
    } catch (error: any) {
      setResult('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-black text-gray-900 mb-6">Super Admin Setup</h1>
        
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
            <label className="block text-sm font-bold text-gray-700 mb-2">Secret Key</label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="unity_admin_secret_2024"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
            />
          </div>
          
          <button
            onClick={handleSetup}
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Initialize Super Admin'}
          </button>
          
          {result && (
            <div className={`p-4 rounded-xl ${result.includes('Error') || result.includes('Unauthorized') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <p className="text-sm font-bold">{result}</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <p className="text-xs text-blue-700 font-bold">
            Note: This page should only be used once to set up the initial super admin. 
            After setup, you can promote other users to admin from the admin panel.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
