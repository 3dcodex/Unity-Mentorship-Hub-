// Run this in browser console while logged in as unitymentorshiphub@gmail.com

import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from './src/firebase';

const fixAdminAccess = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.error('Not logged in!');
    return;
  }

  console.log('Fixing admin access for:', user.email);
  
  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    role: 'super_admin',
    status: 'active',
    displayName: user.displayName || user.email,
    createdAt: new Date()
  }, { merge: true });

  console.log('✅ Firestore updated!');
  console.log('Now navigate to /admin');
};

fixAdminAccess();
