# Fix Storage Upload Error - QUICK SOLUTION

## The Problem
`Firebase Storage: An unknown error occurred` - Storage rules not deployed

## IMMEDIATE FIX (2 minutes)

### Option 1: Deploy via Firebase Console (Recommended)

1. Go to: https://console.firebase.google.com/project/unity-mentorship-hub-ca76e/storage/rules

2. Replace ALL rules with this:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

4. Test photo upload immediately

### Option 2: Deploy via CLI

```bash
cd e:\unitymentor-hub
firebase login --reauth
firebase deploy --only storage:rules
```

## Verify It Works

1. Go to your app
2. Profile Settings
3. Click camera icon to upload photo
4. Should work now!

## After It Works

Once uploads work, you can tighten security later by updating rules to:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Still Not Working?

Check Firebase Console:
1. Storage tab - Is it enabled?
2. Authentication tab - Is user signed in?
3. Browser console - Any other errors?
