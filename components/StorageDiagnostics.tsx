import React, { useEffect, useState } from 'react';
import { storage } from '../src/firebase';

export const StorageDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<{
    storageInitialized: boolean;
    bucketName: string | null;
    envVarSet: boolean;
    issues: string[];
  }>({
    storageInitialized: false,
    bucketName: null,
    envVarSet: false,
    issues: []
  });

  useEffect(() => {
    const issues: string[] = [];
    
    // Check storage initialization
    const storageInitialized = !!storage;
    if (!storageInitialized) {
      issues.push('Firebase Storage not initialized');
    }

    // Check bucket name
    const bucketName = storage?.app?.options?.storageBucket || null;
    if (!bucketName) {
      issues.push('Storage bucket not configured in Firebase config');
    }

    // Check environment variable
    const envVarSet = !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
    if (!envVarSet) {
      issues.push('VITE_FIREBASE_STORAGE_BUCKET environment variable not set');
    }

    setDiagnostics({
      storageInitialized,
      bucketName,
      envVarSet,
      issues
    });
  }, []);

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-4">
      <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">Storage Diagnostics</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className={diagnostics.storageInitialized ? 'text-green-600' : 'text-red-600'}>
            {diagnostics.storageInitialized ? '✓' : '✗'}
          </span>
          <span>Storage Initialized: {diagnostics.storageInitialized ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={diagnostics.bucketName ? 'text-green-600' : 'text-red-600'}>
            {diagnostics.bucketName ? '✓' : '✗'}
          </span>
          <span>Bucket: {diagnostics.bucketName || 'Not configured'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={diagnostics.envVarSet ? 'text-green-600' : 'text-red-600'}>
            {diagnostics.envVarSet ? '✓' : '✗'}
          </span>
          <span>Environment Variable: {diagnostics.envVarSet ? 'Set' : 'Not set'}</span>
        </div>
        {diagnostics.issues.length > 0 && (
          <div className="mt-3 pt-3 border-t border-yellow-300 dark:border-yellow-700">
            <p className="font-bold text-red-600 dark:text-red-400 mb-1">Issues Found:</p>
            <ul className="list-disc ml-5 space-y-1">
              {diagnostics.issues.map((issue, idx) => (
                <li key={idx} className="text-red-600 dark:text-red-400">{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
