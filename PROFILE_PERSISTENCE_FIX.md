# Profile Settings Persistence & Photo Update Fix

## Issues Fixed

### 1. **Profile Changes Not Persisting**
- **Problem**: User name changes in ProfileSettings weren't being saved to Firestore properly
- **Solution**: Updated `handleSaveProfile` to save both `name` and `displayName` fields to Firestore
- **Impact**: All profile changes now persist across sessions and pages

### 2. **Profile Photo Not Updating Everywhere**
- **Problem**: When user uploaded a new photo, it didn't update in header, dashboard, and other pages until page refresh
- **Solution**: 
  - Added periodic refresh (every 5 seconds) in Layout component to check for photo updates
  - Added periodic refresh in Dashboard to update both photo and name
  - Photo is stored in Firestore at `users/{uid}/photoURL`
- **Impact**: Profile photo now updates automatically across all pages within 5 seconds

### 3. **Dashboard Not Showing Current Data**
- **Problem**: Dashboard showed cached localStorage data instead of current Firestore data
- **Solution**: Changed Dashboard to load user data from Firestore on mount and refresh periodically
- **Impact**: Dashboard always shows current user name and photo from database

## Implementation Details

### ProfileSettings.tsx Changes

```typescript
const handleSaveProfile = async () => {
  if (!user) return;
  setIsSaving(true);
  setError(null);
  try {
    await setDoc(doc(db, 'users', user.uid), {
      name: userName,              // Added name field
      displayName: userName,       // Keep displayName for compatibility
      isMentor,
      mentorExpertise,
      mentorBio,
      updatedAt: Timestamp.now(),
    }, { merge: true });
    
    localStorage.setItem('unity_user_name', userName);
    setSuccess('Profile saved successfully!');
    setTimeout(() => setSuccess(null), 3000);
  } catch (err: any) {
    console.error('Save profile error:', err);
    setError(err?.message || 'Failed to save profile');
  } finally {
    setIsSaving(false);
  }
};
```

### Dashboard.tsx Changes

```typescript
// Load user data from Firestore and refresh periodically
useEffect(() => {
  const loadUserData = () => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserPhoto(data.photoURL || null);
          if (data.name || data.displayName) {
            const name = data.name || data.displayName;
            setUserName(name);
            localStorage.setItem('unity_user_name', name);
          }
        }
      });
    }
  };
  
  loadUserData();
  
  // Refresh every 5 seconds to catch profile updates
  const interval = setInterval(loadUserData, 5000);
  
  return () => clearInterval(interval);
}, [user]);
```

### Layout.tsx Changes

```typescript
// Load user photo from Firestore and refresh periodically
useEffect(() => {
  const loadUserPhoto = () => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then(docSnap => {
        if (docSnap.exists()) {
          setUserPhoto(docSnap.data().photoURL || null);
        }
      }).catch(err => console.error('Error loading user photo:', err));
    }
  };
  
  loadUserPhoto();
  
  // Refresh photo every 5 seconds to catch updates
  const interval = setInterval(loadUserPhoto, 5000);
  
  return () => clearInterval(interval);
}, [user]);
```

## Data Flow

1. **User Updates Profile**:
   - User changes name or uploads photo in ProfileSettings
   - Data saved to Firestore at `users/{user.uid}`
   - Success message shown to user

2. **Automatic Propagation**:
   - Layout component checks Firestore every 5 seconds for photo updates
   - Dashboard checks Firestore every 5 seconds for name and photo updates
   - CommunityFeed loads user data from Firestore when creating posts/comments
   - All components use `user.uid` to fetch current data

3. **Consistency**:
   - All user data stored in single Firestore document: `users/{uid}`
   - Fields: `name`, `displayName`, `photoURL`, `role`, etc.
   - localStorage used only as cache, Firestore is source of truth

## Benefits

1. **Real-time Updates**: Profile changes appear across all pages within 5 seconds
2. **Data Consistency**: All pages load from same Firestore source
3. **User Experience**: No manual refresh needed to see profile updates
4. **Scalability**: Periodic polling can be replaced with Firestore real-time listeners if needed

## Future Improvements

- Replace polling with Firestore real-time listeners for instant updates
- Add optimistic UI updates for immediate feedback
- Implement profile photo caching with cache invalidation
- Add profile change notifications to other users
