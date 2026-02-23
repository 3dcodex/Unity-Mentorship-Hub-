# UnityMentor Hub - Vercel Deployment

## Quick Deploy to Vercel

### Option 1: One-Click Deploy (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your repository: `3dcodex/Unity-Mentorship-Hub-`
5. Vercel will auto-detect Vite framework
6. Click "Deploy"

### Option 2: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

## Environment Variables (Add in Vercel Dashboard)
After deployment, add these in Vercel Project Settings → Environment Variables:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=unity-mentorship-hub-ca76e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=unity-mentorship-hub-ca76e
VITE_FIREBASE_STORAGE_BUCKET=unity-mentorship-hub-ca76e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Post-Deployment
1. Your site will be live at: `https://your-project.vercel.app`
2. Add this domain to Firebase Console → Authentication → Authorized domains
3. Test admin login with: unitymentorshiphub@gmail.com

## Features Included
✅ Admin Dashboard with 13 management pages
✅ Role-based access control (10 user roles)
✅ Support ticket system
✅ QuickChat messaging
✅ Dark mode
✅ Responsive design

## Deployment Time: ~2 minutes
