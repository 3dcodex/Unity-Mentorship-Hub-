# OAuth Setup Guide

## Firebase Console Configuration

### 1. Enable Google Sign-In
1. Go to Firebase Console → Authentication → Sign-in method
2. Click "Google" provider
3. Toggle "Enable"
4. Add your project support email
5. Save

### 2. Enable Microsoft/LinkedIn Sign-In
1. Go to Firebase Console → Authentication → Sign-in method
2. Click "Microsoft" provider
3. Toggle "Enable"
4. Note: LinkedIn OAuth requires custom setup or use Microsoft provider
5. Save

### 3. Add Authorized Domains
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your production domain (e.g., `unity-mentorship-hub-ca76e.web.app`)
3. Add localhost for testing: `localhost`

### 4. OAuth Redirect URIs
Firebase automatically handles these, but verify:
- `https://unity-mentorship-hub-ca76e.firebaseapp.com/__/auth/handler`
- `http://localhost:5173/__/auth/handler` (for local dev)

## Deploy Commands
```bash
# Deploy hosting and rules
firebase deploy --only hosting,firestore:rules

# Or deploy everything
firebase deploy
```

## Testing OAuth
1. Run locally: `npm run dev`
2. Click Google/LinkedIn button on login page
3. Complete OAuth flow
4. Should redirect to `/dashboard`

## Troubleshooting
- If popup blocked: Check browser popup settings
- If redirect fails: Verify authorized domains in Firebase Console
- If user creation fails: Check Firestore rules allow user document creation
