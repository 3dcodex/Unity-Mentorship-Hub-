const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.super_admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only super admins can set admin claims');
  }

  const { uid, role } = data;
  
  try {
    await admin.auth().setCustomUserClaims(uid, { 
      admin: role === 'admin' || role === 'super_admin',
      super_admin: role === 'super_admin',
      moderator: role === 'moderator'
    });

    await admin.firestore().collection('users').doc(uid).update({ role });

    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.initializeSuperAdmin = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const email = req.body?.email || req.query.email;
  const secret = req.body?.secretKey || req.query.secret;

  if (secret !== 'unity_admin_secret_2024') {
    res.status(403).send('Unauthorized');
    return;
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true, super_admin: true });
    await admin.firestore().collection('users').doc(user.uid).set({ role: 'super_admin', status: 'active' }, { merge: true });
    res.send(`Super admin initialized for ${email}`);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
