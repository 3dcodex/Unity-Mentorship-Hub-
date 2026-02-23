# Firebase Rules Deployment Guide

## Updated Firestore Rules

The `firestore.rules` file has been updated to include:

### ✅ Secure Messaging System
- **Connections subcollection**: Users can manage their connections
- **Conversations**: Only participants can read/write
- **Messages**: Strict validation - only participants can read, only sender can create

### ✅ Admin Dashboard Collections
- mentorApplications
- transactions
- payouts
- reports
- reviews
- categories
- notifications
- securityLogs
- settings

### ✅ Session & Booking Collections
- bookings
- sessions
- sessionBookings
- mentorshipRequests

## Deploy Updated Rules

### Option 1: Firebase Console (Recommended for Testing)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `unity-mentorship-hub-ca76e`
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules`
5. Paste into the rules editor
6. Click **Publish**

### Option 2: Firebase CLI (Recommended for Production)
```bash
# Make sure you're in the project directory
cd e:\unitymentor-hub

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Or deploy everything
firebase deploy
```

## Verify Deployment

### Test Messaging Security:
1. Try to access a conversation you're not part of (should fail)
2. Try to send a message without a connection (should fail)
3. Book a session and verify messaging works

### Test Admin Access:
1. Navigate to `/admin`
2. Verify all admin pages load correctly
3. Test CRUD operations on admin collections

## Security Features

### Messaging Rules:
```javascript
// Only participants can read conversations
allow read: if request.auth.uid in resource.data.participants;

// Only participants can send messages
allow create: if request.auth.uid in get(...).data.participants 
  && request.auth.uid == request.resource.data.senderId;
```

### Connection Rules:
```javascript
// Users can only manage their own connections
allow read, write: if request.auth.uid == userId;
```

## Troubleshooting

### If rules deployment fails:
1. Check Firebase CLI is installed: `firebase --version`
2. Login to Firebase: `firebase login`
3. Verify project: `firebase projects:list`
4. Check syntax: Rules must be valid JavaScript

### If messaging doesn't work:
1. Verify rules are deployed
2. Check browser console for permission errors
3. Verify connection exists in Firestore
4. Check conversation participants array

## Important Notes

⚠️ **Current rules allow all authenticated users to read/write most collections**
- This is suitable for development
- For production, add role-based access control
- Example: Only admins should access admin collections

### Production-Ready Rules (Future Enhancement):
```javascript
function isAdmin() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

match /mentorApplications/{applicationId} {
  allow read: if request.auth != null;
  allow write: if isAdmin();
}
```

## Next Steps

1. ✅ Deploy rules to Firebase
2. ✅ Test messaging system
3. ✅ Test admin dashboard
4. ⏭️ Add role-based access control (optional)
5. ⏭️ Add rate limiting (optional)
6. ⏭️ Add data validation (optional)

## Support

If you encounter issues deploying rules, check:
- Firebase project permissions
- Firebase CLI authentication
- Rules syntax validation
