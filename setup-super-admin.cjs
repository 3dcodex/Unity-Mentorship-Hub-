const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupSuperAdmin() {
  const email = 'unitymentorshiphub@gmail.com';
  
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log('User found:', user.uid);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
      super_admin: true
    });
    console.log('Custom claims set');
    
    // Update Firestore document
    await db.collection('users').doc(user.uid).set({
      email: email,
      role: 'super_admin',
      status: 'active',
      displayName: 'Super Admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('Firestore document updated');
    
    // Verify
    const userDoc = await db.collection('users').doc(user.uid).get();
    console.log('User document:', userDoc.data());
    
    console.log('\n✅ Super admin setup complete!');
    console.log('Email:', email);
    console.log('UID:', user.uid);
    console.log('Role:', userDoc.data()?.role);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

setupSuperAdmin();
