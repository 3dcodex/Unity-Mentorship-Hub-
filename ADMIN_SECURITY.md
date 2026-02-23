# Admin Security & Role-Based Access Control (RBAC)

## Overview
Secure admin system using Firebase Authentication with custom claims and role-based access control.

## Security Architecture

### 1. Firebase Authentication
- Email/password login
- Google OAuth (optional)
- Multi-factor authentication (recommended for admins)

### 2. Custom Claims (Primary Security)
```typescript
{
  admin: true,
  super_admin: true,
  moderator: false
}
```

### 3. Firestore Role Storage (Backup)
```
users/{userId}
  ├─ role: "super_admin" | "admin" | "moderator" | "mentor" | "student"
  └─ status: "active" | "suspended"
```

## Role Hierarchy

### Super Admin
- Full platform access
- Can promote/demote other admins
- Access to all admin functions
- Cannot be demoted by regular admins

### Admin
- Manage users, sessions, payments
- Approve mentors
- View analytics
- Cannot promote other admins

### Moderator
- Review reports
- Moderate content
- Limited admin access

### Mentor
- Manage own sessions
- View own analytics

### Student
- Book sessions
- Access resources

## Implementation

### 1. Auth Service (`services/authService.ts`)

#### Check Admin Access:
```typescript
const isAdmin = await checkAdminAccess(user);
```

#### Check Role:
```typescript
const userRole = await checkUserRole(user);
```

### 2. Protected Routes (`components/AdminRoute.tsx`)

#### Usage:
```tsx
<Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
```

#### Features:
- Verifies custom claims
- Fallback to Firestore check
- Shows access denied page
- Redirects unauthorized users

### 3. Firestore Security Rules

#### Admin Collections:
```javascript
match /settings/{settingId} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.admin == true;
}
```

#### User-Specific:
```javascript
match /notifications/{notificationId} {
  allow read: if request.auth.uid == resource.data.userId;
}
```

## Cloud Functions

### Set Admin Claim:
```javascript
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Only super admins can promote
  if (!context.auth.token.super_admin) throw error;
  
  await admin.auth().setCustomUserClaims(uid, { admin: true });
});
```

### Initialize First Super Admin:
```bash
# One-time setup
https://YOUR_PROJECT.cloudfunctions.net/initializeSuperAdmin?email=admin@example.com&secret=YOUR_SECRET
```

## Setup Instructions

### Step 1: Deploy Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

### Step 2: Create First Super Admin
```bash
# Replace with your email and secret
curl "https://YOUR_PROJECT.cloudfunctions.net/initializeSuperAdmin?email=your@email.com&secret=CHANGE_THIS_SECRET"
```

### Step 3: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Step 4: Test Admin Access
1. Login with super admin account
2. Navigate to `/admin`
3. Verify access granted

## Promoting Users to Admin

### Option A: Cloud Function (Recommended)
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const setAdminClaim = httpsCallable(functions, 'setAdminClaim');

await setAdminClaim({ uid: 'user123', role: 'admin' });
```

### Option B: Firebase Console
1. Go to Authentication
2. Select user
3. Set custom claims manually

### Option C: Admin SDK (Backend)
```javascript
await admin.auth().setCustomUserClaims(uid, { admin: true });
```

## Security Best Practices

### 1. Custom Claims (Primary)
✅ Stored in secure token
✅ Cannot be modified by client
✅ Verified by Firestore rules
✅ Expires with token (1 hour)

### 2. Firestore Role (Backup)
✅ Persistent storage
✅ Easy to query
✅ Can be updated without re-login
⚠️ Can be modified if rules are weak

### 3. Multi-Factor Authentication
```typescript
// Enable MFA for admin accounts
import { multiFactor } from 'firebase/auth';
```

### 4. Session Timeout
```typescript
// Auto logout after 30 minutes inactivity
let timeout;
const resetTimeout = () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => auth.signOut(), 30 * 60 * 1000);
};
```

### 5. IP Tracking
```typescript
// Log admin actions with IP
await logAdminAction({
  action: 'user_suspended',
  ip: request.ip,
  timestamp: new Date()
});
```

## Firestore Rules Explained

### Admin-Only Write:
```javascript
allow write: if request.auth.token.admin == true;
```

### User-Specific Read:
```javascript
allow read: if request.auth.uid == resource.data.userId;
```

### Public Read, Admin Write:
```javascript
allow read: if request.auth != null;
allow write: if request.auth.token.admin == true;
```

## Testing

### Test Admin Access:
1. Create test user
2. Promote to admin via Cloud Function
3. Login and access `/admin`
4. Verify all admin pages load

### Test Access Denial:
1. Login as regular user
2. Try to access `/admin`
3. Should see "Access Denied" page

### Test Firestore Rules:
1. Try to write to admin collection as regular user
2. Should fail with permission error
3. Try as admin - should succeed

## Monitoring

### Security Logs:
```typescript
// All admin actions logged
securityLogs/
  └─ {logId}
       ├─ userId
       ├─ action
       ├─ timestamp
       └─ ipAddress
```

### View Logs:
```bash
firebase firestore:get securityLogs --limit 100
```

## Troubleshooting

### Admin access not working:
1. Check custom claims: `user.getIdTokenResult()`
2. Verify Firestore role
3. Check Firestore rules deployed
4. Force token refresh: `user.getIdToken(true)`

### Custom claims not updating:
1. User must re-login or refresh token
2. Claims expire after 1 hour
3. Force refresh: `await user.getIdToken(true)`

### Firestore rules blocking:
1. Check rules in Firebase Console
2. Test rules with Rules Playground
3. Verify token has admin claim

## Production Checklist

- [ ] Deploy Cloud Functions
- [ ] Initialize super admin
- [ ] Deploy Firestore rules
- [ ] Enable MFA for admins
- [ ] Set up session timeout
- [ ] Configure IP logging
- [ ] Test all admin routes
- [ ] Test access denial
- [ ] Monitor security logs
- [ ] Document admin procedures

## Support

For admin access issues:
1. Check Firebase Console → Authentication
2. Verify custom claims
3. Check Firestore rules
4. Review security logs
