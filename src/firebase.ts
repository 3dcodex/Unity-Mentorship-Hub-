import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import type { FirebaseOptions } from "firebase/app";
// Connectivity check
console.log("Navigator online?", typeof navigator !== "undefined" ? navigator.onLine : "N/A");

// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDC3ZItYS0WU-n5cIOUwlyeQzDxcM5j-uA",
  authDomain: "unity-mentorship-hub-ca76e.firebaseapp.com",
  projectId: "unity-mentorship-hub-ca76e",
  storageBucket: "unity-mentorship-hub-ca76e.appspot.com",
  messagingSenderId: "538275309573",
  appId: "1:538275309573:web:41c34922ec7004e1ec946c",
  measurementId: "G-W277069DZ0",
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
// Force Firestore online
import { enableNetwork } from "firebase/firestore";
enableNetwork(db)
  .then(() => console.log("Firestore is online"))
  .catch((err) => console.error("Failed to enable network:", err));
export const storage = getStorage(app);

export default firebaseConfig;
