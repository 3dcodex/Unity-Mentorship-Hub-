// Script to fix admin and super_admin roles in Firestore to lowercase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDC3ZItYS0WU-n5cIOUwlyeQzDxcM5j-uA",
  authDomain: "unity-mentorship-hub-ca76e.firebaseapp.com",
  projectId: "unity-mentorship-hub-ca76e",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixAdminRoles() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    let newRole = null;
    if (data.role === 'Admin' || data.role === 'ADMIN') newRole = 'admin';
    if (data.role === 'Super Admin' || data.role === 'SUPER_ADMIN' || data.role === 'super admin') newRole = 'super_admin';
    if (newRole) {
      await updateDoc(doc(db, 'users', userDoc.id), { role: newRole });
      console.log(`Updated user ${userDoc.id} role to ${newRole}`);
    }
  }
  console.log('Role update complete.');
}

fixAdminRoles().catch(console.error);