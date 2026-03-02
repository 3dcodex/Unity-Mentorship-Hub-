# Deploy Firestore & Storage Rules

## Quick Deploy

Run these commands in order:

```bash
# 1. Re-authenticate with Firebase
firebase login --reauth

# 2. Deploy all rules
firebase deploy --only firestore:rules,storage:rules
```

## What's Being Deployed

### Firestore Rules (firestore.rules)
✅ Users can read all authenticated user profiles
✅ Users can create/update their own profile with all new fields:
   - mentorStatus (none/pending/approved)
   - isMentor, mentorExpertise, mentorBio, availability
   - campusInvolvement, languagesSpoken
   - notifyCampusEvents, notifyMentorshipRequests, notifyCommunityUpdates
   - resumeAutoSave, darkMode
   - skills, certifications, achievements
✅ Admins can update any profile
✅ Only super admins can delete users

### Storage Rules (storage.rules)
✅ Users can upload profile photos to their own folder
✅ Max file size: 5MB
✅ Only image files allowed
✅ Users can only delete their own photos

## Verify Deployment

After deployment, test:
1. Sign in to your app
2. Go to Profile Settings
3. Try updating each new section:
   - Mentor tab (apply/update)
   - Preferences tab (notifications, toggles)
   - Complete Profile tab (skills, certifications)
4. Check Firebase Console > Firestore to verify data is saved
5. Upload a profile photo to test storage rules

## Troubleshooting

If deployment fails:
```bash
# Check Firebase project
firebase projects:list

# Switch project if needed
firebase use unity-mentorship-hub-ca76e

# Try deploying again
firebase deploy --only firestore:rules,storage:rules
```

## Manual Deployment (Firebase Console)

If CLI doesn't work, deploy manually:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: unity-mentorship-hub-ca76e
3. **For Firestore Rules:**
   - Go to Firestore Database > Rules
   - Copy content from `firestore.rules`
   - Paste and click "Publish"
4. **For Storage Rules:**
   - Go to Storage > Rules
   - Copy content from `storage.rules`
   - Paste and click "Publish"

## Current Rules Status

✅ All new ProfileSettings fields are covered
✅ Security: Users can only modify their own data
✅ Photo uploads: Restricted to user's own folder
✅ Admin privileges: Properly configured
✅ Mentor applications: Secure workflow
