import { rtdb } from '../src/firebase';
import { ref, set, onValue, off, onDisconnect, serverTimestamp } from 'firebase/database';

class PresenceService {
  private listeners: { [userId: string]: () => void } = {};

  // Set user online status
  setUserOnline(userId: string) {
    const userStatusRef = ref(rtdb, `presence/${userId}`);
    const isOnlineForDatabase = {
      state: 'online',
      lastSeen: serverTimestamp(),
    };
    const isOfflineForDatabase = {
      state: 'offline',
      lastSeen: serverTimestamp(),
    };

    set(userStatusRef, isOnlineForDatabase);
    onDisconnect(userStatusRef).set(isOfflineForDatabase);
  }

  // Listen to user's online status
  listenToUserStatus(userId: string, callback: (isOnline: boolean, lastSeen?: number) => void) {
    const userStatusRef = ref(rtdb, `presence/${userId}`);
    
    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const isOnline = data.state === 'online';
        callback(isOnline, data.lastSeen);
      } else {
        callback(false);
      }
    });

    this.listeners[userId] = () => off(userStatusRef, 'value', unsubscribe);
    return this.listeners[userId];
  }

  // Stop listening to user status
  stopListening(userId: string) {
    if (this.listeners[userId]) {
      this.listeners[userId]();
      delete this.listeners[userId];
    }
  }

  // Set user offline
  setUserOffline(userId: string) {
    const userStatusRef = ref(rtdb, `presence/${userId}`);
    set(userStatusRef, {
      state: 'offline',
      lastSeen: serverTimestamp(),
    });
  }

  // Check if user is online
  async isUserOnline(userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const userStatusRef = ref(rtdb, `presence/${userId}`);
      onValue(userStatusRef, (snapshot) => {
        const data = snapshot.val();
        resolve(data?.state === 'online');
      }, { onlyOnce: true });
    });
  }
}

export const presenceService = new PresenceService();