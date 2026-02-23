# Real-Time Presence System

## Overview
Tracks user online/offline status in real-time using Firebase Realtime Database.

## Features
- ✅ Real-time online/offline status
- ✅ Automatic offline detection on disconnect
- ✅ Last seen timestamp
- ✅ Green dot indicator for online users
- ✅ "Active Now" / "Offline" status text

## Implementation

### 1. Presence Service (`services/presenceService.ts`)

#### Functions:
```typescript
setUserOnline(userId: string)
// Sets user as online and configures auto-offline on disconnect

setUserOffline(userId: string)
// Manually sets user as offline

subscribeToUserStatus(userId: string, callback)
// Real-time subscription to user's online status
```

### 2. Database Structure
```
status/
  └─ {userId}
       ├─ online: boolean
       └─ lastSeen: timestamp
```

### 3. QuickChat Integration

#### Auto-presence tracking:
```typescript
useEffect(() => {
  if (!user) return;
  setUserOnline(user.uid);
  return () => setUserOffline(user.uid);
}, [user]);
```

#### Status subscription:
```typescript
subscribeToUserStatus(contact.id, (isOnline) => {
  setUserStatuses(prev => ({ ...prev, [contact.id]: isOnline }));
});
```

## Visual Indicators

### Green Dot:
- Shows on avatar when user is online
- 3px circle with green background
- White border for contrast

### Status Text:
- "Active Now" - User is online
- "Offline" - User is not online

## Firebase Setup

### 1. Enable Realtime Database:
1. Go to Firebase Console
2. Navigate to Realtime Database
3. Click "Create Database"
4. Choose location
5. Start in test mode (or use provided rules)

### 2. Deploy Database Rules:
```bash
firebase deploy --only database
```

### 3. Database Rules (`database.rules.json`):
```json
{
  "rules": {
    "status": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## Security
- Users can only write their own status
- All users can read any status (for presence indicators)
- Automatic cleanup on disconnect

## How It Works

### 1. User Opens App:
```
User logs in → setUserOnline() → status/{userId}/online = true
```

### 2. User Closes App:
```
Connection lost → onDisconnect() triggers → status/{userId}/online = false
```

### 3. Other Users See Status:
```
subscribeToUserStatus() → Real-time updates → UI updates automatically
```

## Benefits

### Real-Time Updates:
- No polling required
- Instant status changes
- Efficient bandwidth usage

### Automatic Cleanup:
- onDisconnect() handles crashes
- No manual cleanup needed
- Always accurate status

### Scalable:
- Firebase handles millions of connections
- Minimal database reads/writes
- Optimized for real-time data

## Testing

### Test Online Status:
1. Open app in two browsers
2. Login as different users
3. Check green dot appears
4. Verify "Active Now" text

### Test Offline Status:
1. Close one browser tab
2. Wait 2-3 seconds
3. Green dot should disappear
4. Text should change to "Offline"

### Test Reconnection:
1. Disable network
2. Re-enable network
3. Status should update automatically

## Troubleshooting

### Status not updating:
- Check Realtime Database is enabled
- Verify database rules are deployed
- Check browser console for errors

### Green dot not showing:
- Verify userStatuses state is updating
- Check subscribeToUserStatus is called
- Ensure userId is correct

### Offline not detected:
- onDisconnect() requires active connection
- May take 30-60 seconds to detect
- Check Firebase connection status

## Future Enhancements

1. **Typing Indicators**: Show when user is typing
2. **Last Seen**: Display "Last seen 5 minutes ago"
3. **Custom Status**: "Away", "Busy", "Do Not Disturb"
4. **Activity Status**: "Viewing profile", "In a call"
5. **Presence Analytics**: Track active users count

## Performance

### Optimizations:
- Single subscription per user
- Automatic unsubscribe on unmount
- Minimal data transfer
- Indexed queries

### Costs:
- Realtime Database: Pay per GB stored + GB downloaded
- Presence data is minimal (~50 bytes per user)
- Very cost-effective for presence tracking

## Best Practices

1. **Always cleanup**: Use return in useEffect
2. **Batch subscriptions**: Subscribe to multiple users at once
3. **Cache status**: Store in state to avoid re-renders
4. **Handle errors**: Wrap in try-catch blocks
5. **Test offline**: Simulate network issues

## Support

For issues with presence system:
1. Check Firebase Console → Realtime Database
2. Verify rules are correct
3. Check browser network tab
4. Review console logs
