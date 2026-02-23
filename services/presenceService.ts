import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { getDatabase } from 'firebase/database';
import { app } from '../src/firebase';

const rtdb = getDatabase(app);

export const setUserOnline = (userId: string) => {
  const userStatusRef = ref(rtdb, `status/${userId}`);
  
  set(userStatusRef, {
    online: true,
    lastSeen: serverTimestamp()
  });
  
  onDisconnect(userStatusRef).set({
    online: false,
    lastSeen: serverTimestamp()
  });
};

export const setUserOffline = (userId: string) => {
  const userStatusRef = ref(rtdb, `status/${userId}`);
  set(userStatusRef, {
    online: false,
    lastSeen: serverTimestamp()
  });
};

export const subscribeToUserStatus = (userId: string, callback: (isOnline: boolean, lastSeen?: number) => void) => {
  const userStatusRef = ref(rtdb, `status/${userId}`);
  return onValue(userStatusRef, (snapshot) => {
    const data = snapshot.val();
    callback(data?.online || false, data?.lastSeen);
  });
};
