const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.adminResetPassword = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid, newPassword } = data;

  // Verify admin role
  const adminDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  const adminRole = adminDoc.data()?.role;

  if (!['admin', 'super_admin'].includes(adminRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can reset passwords');
  }

  // Validate password
  if (!newPassword || newPassword.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters');
  }

  try {
    // Update user password
    await admin.auth().updateUser(uid, {
      password: newPassword
    });

    // Log admin action
    await admin.firestore().collection('adminActions').add({
      adminId: context.auth.uid,
      adminEmail: context.auth.token.email,
      action: 'reset_password',
      targetUserId: uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.adminChangeEmail = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid, newEmail } = data;

  // Verify admin role
  const adminDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  const adminRole = adminDoc.data()?.role;

  if (!['admin', 'super_admin'].includes(adminRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can change user emails');
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!newEmail || !emailRegex.test(newEmail)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email address');
  }

  try {
    // Get old email for logging
    const userRecord = await admin.auth().getUser(uid);
    const oldEmail = userRecord.email;

    // Update user email in Firebase Auth
    await admin.auth().updateUser(uid, {
      email: newEmail,
      emailVerified: false // Require re-verification
    });

    // Update email in Firestore
    await admin.firestore().collection('users').doc(uid).update({
      email: newEmail,
      emailChangedBy: context.auth.uid,
      emailChangedAt: admin.firestore.FieldValue.serverTimestamp(),
      oldEmail: oldEmail
    });

    // Log admin action
    await admin.firestore().collection('adminActions').add({
      adminId: context.auth.uid,
      adminEmail: context.auth.token.email,
      action: 'change_email',
      targetUserId: uid,
      details: JSON.stringify({ oldEmail, newEmail }),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send notification to user
    await admin.firestore().collection('notifications').add({
      userId: uid,
      title: 'Email Address Changed',
      message: `Your email has been changed from ${oldEmail} to ${newEmail} by an administrator. Please verify your new email.`,
      type: 'warning',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Email changed successfully', oldEmail, newEmail };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
