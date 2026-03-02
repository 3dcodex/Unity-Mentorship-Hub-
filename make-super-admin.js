// Quick script to make a user super admin
// Usage: node make-super-admin.js YOUR_EMAIL@example.com

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // You need this file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email: node make-super-admin.js your@email.com');
  process.exit(1);
}

async function makeSuperAdmin() {
  try {
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      console.error('User not found with email:', email);
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    await userDoc.ref.update({
      role: 'super_admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Successfully promoted', email, 'to Super Admin!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeSuperAdmin();
