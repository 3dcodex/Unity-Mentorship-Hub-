# Super Admin Production Setup - COMPLETE ✅

## Status: READY TO USE

### Super Admin Credentials
- **Email**: unitymentorshiphub@gmail.com
- **Status**: ✅ Initialized in Production
- **Role**: super_admin
- **Custom Claims**: admin: true, super_admin: true

## What Was Done

1. ✅ Cloud Function deployed with CORS support
2. ✅ Super admin initialized via Cloud Function
3. ✅ Custom claims set (admin: true, super_admin: true)
4. ✅ Firestore document created with role: 'super_admin'
5. ✅ Login flow checks Firestore role and redirects to /admin

## How to Login as Super Admin

1. Go to: https://unity-mentorship-hub-ca76e.web.app
2. Click "Login" or navigate to `/login`
3. Enter credentials:
   - Email: unitymentorshiphub@gmail.com
   - Password: [your password]
4. You will be automatically redirected to `/admin` dashboard

## Verification Steps

### If Login Doesn't Work:

1. **Check if user exists in Firebase Auth**
   - Go to Firebase Console > Authentication
   - Look for unitymentorshiphub@gmail.com
   - If not exists, create account via `/signup` first

2. **Verify Firestore document**
   - Go to Firebase Console > Firestore Database
   - Navigate to `users` collection
   - Find document with your user UID
   - Should have: `role: "super_admin"`, `status: "active"`

3. **Check custom claims**
   - Custom claims are set automatically by Cloud Function
   - They persist across sessions

4. **Clear browser cache**
   - Sometimes old tokens cause issues
   - Clear cache and cookies for the site
   - Try logging in again

## Making Other Users Admin

Once logged in as super admin:

1. Navigate to `/admin/users`
2. Find the user you want to promote
3. Click their role dropdown
4. Select "Admin" or "Super Admin"
5. User will receive notification
6. They can now access `/admin` dashboard

## Role Hierarchy

```
Super Admin (100) → Can assign ANY role including other super admins
Admin (80)        → Can assign up to moderator
Moderator (60)    → Can manage content only
All Others        → No admin privileges
```

## Troubleshooting

### "Access Denied" when accessing /admin
- Make sure you're logged in with super admin email
- Check Firestore: users/{uid} should have role: "super_admin"
- Try logging out and back in to refresh token

### Login redirects to /dashboard instead of /admin
- Firestore document might not have correct role
- Run this command to fix:
```bash
curl -X GET "https://us-central1-unity-mentorship-hub-ca76e.cloudfunctions.net/initializeSuperAdmin?email=unitymentorshiphub@gmail.com&secret=unity_admin_secret_2024"
```

### Can't change other users' roles
- Only super admin can assign admin roles
- Regular admins can only assign up to moderator
- Check your own role in Firestore

## Cloud Function Endpoints

### Initialize Super Admin
```
GET: https://us-central1-unity-mentorship-hub-ca76e.cloudfunctions.net/initializeSuperAdmin
Parameters:
  - email: unitymentorshiphub@gmail.com
  - secret: unity_admin_secret_2024
```

### Set Admin Claim (Callable Function)
```javascript
// Called from admin panel when changing roles
firebase.functions().httpsCallable('setAdminClaim')({
  uid: 'user_uid',
  role: 'admin'
})
```

## Security Notes

1. **Secret Key**: `unity_admin_secret_2024` is required for initialization
2. **One-Time Setup**: Super admin initialization should only be done once
3. **Role Changes**: All role changes are logged with admin UID
4. **Firestore Rules**: Enforce role hierarchy at database level

## Next Steps

1. ✅ Login as super admin
2. ✅ Test admin dashboard access
3. ✅ Create test users with different roles
4. ✅ Test role assignment functionality
5. ✅ Test support ticket system
6. ✅ Test broadcast messaging

## Support

If you still can't login:
1. Check Firebase Console > Authentication for the user
2. Check Firebase Console > Firestore > users collection
3. Verify the email and password are correct
4. Try creating a new account and promoting it to admin

---

**Last Updated**: Just now
**Status**: Production Ready ✅
**Deployment**: https://unity-mentorship-hub-ca76e.web.app
