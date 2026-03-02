# Deploy to Firebase Hosting - INSTRUCTIONS

## ✅ Build Complete!
Your app has been built successfully in the `dist/` folder.

## Deploy Now (3 Steps)

### Step 1: Authenticate Firebase
Open a **new terminal** (not in IDE) and run:
```bash
cd e:\unitymentor-hub
firebase login
```
Follow the browser prompts to sign in.

### Step 2: Deploy Everything
```bash
firebase deploy
```

This will deploy:
- ✅ Firestore rules
- ✅ Storage rules  
- ✅ Hosting (your built app)

### Step 3: Access Your Live Site
After deployment completes, you'll see:
```
Hosting URL: https://unity-mentorship-hub-ca76e.web.app
```

## Quick Deploy (Hosting Only)

If you only want to deploy the app (not rules):
```bash
firebase deploy --only hosting
```

## Deploy Rules Only

To deploy just the security rules:
```bash
firebase deploy --only firestore:rules,storage:rules
```

## Verify Deployment

1. Visit: https://unity-mentorship-hub-ca76e.web.app
2. Sign in to your account
3. Go to Profile Settings
4. Test all new features:
   - ✅ Mentor tab (apply/update)
   - ✅ Preferences tab
   - ✅ Complete Profile tab
   - ✅ Photo upload
   - ✅ AI photo generation

## Troubleshooting

### If deployment fails:
```bash
# Check you're on the right project
firebase projects:list

# Switch if needed
firebase use unity-mentorship-hub-ca76e

# Try again
firebase deploy
```

### If photo upload still fails:
1. Go to Firebase Console: https://console.firebase.google.com
2. Navigate to Storage > Rules
3. Ensure rules are published (see FIX_STORAGE_ERROR.md)

## Current Build Stats
- Total size: ~1.1 MB (gzipped: 279 KB)
- ProfileSettings: 30.31 KB (gzipped: 5.91 KB)
- Build time: 7.47s
- ✅ All new features included

## What's Deployed

### New ProfileSettings Features:
1. Mentor application system (Apply → Pending → Approved)
2. Preferences tab (campus, languages, notifications)
3. Resume auto-save toggle
4. Dark mode toggle
5. Complete profile (skills, certifications, achievements)
6. AI photo generation
7. 6 navigation tabs

### Security:
- Firestore rules for all new fields
- Storage rules for photo uploads
- User data isolation
- Admin privileges

---

**Ready to deploy? Open a new terminal and run the commands above!**
