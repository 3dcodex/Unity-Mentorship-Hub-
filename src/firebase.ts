import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import type { FirebaseOptions } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://unity-mentorship-hub-ca76e-default-rtdb.firebaseio.com/",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app
export const app = initializeApp(firebaseConfig);

// Initialize Analytics (browser-only)
export const analytics = ((): ReturnType<typeof getAnalytics> | null => {
  try {
    if (typeof window === "undefined") return null;
    return getAnalytics(app);
  } catch (e) {
    return null;
  }
})();

// Export other services
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

// Force Firestore online
import { enableNetwork } from "firebase/firestore";
enableNetwork(db)
  .catch((err) => {
    // Failed to enable network - this is acceptable, service will work offline
  });

export default firebaseConfig;
