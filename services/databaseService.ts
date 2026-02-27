import { db } from '../src/firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';

export const initializeDatabase = async () => {
  try {
    // Initialize collections with sample documents
    const collections = [
      'users',
      'sessions',
      'bookings',
      'tickets',
      'notifications',
      'adminActions',
      'groups',
      'messages',
      'resources',
      'events',
      'opportunities',
      'reviews',
      'payments'
    ];

    for (const collectionName of collections) {
      const sampleDoc = doc(collection(db, collectionName), '_init');
      await setDoc(sampleDoc, {
        _initialized: true,
        createdAt: Timestamp.now()
      }, { merge: true });
    }

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
};

export const createDefaultAdminSettings = async () => {
  try {
    await setDoc(doc(db, 'settings', 'platform'), {
      maintenanceMode: false,
      registrationEnabled: true,
      mentorApplicationsEnabled: true,
      maxSessionsPerUser: 10,
      sessionDuration: 60,
      platformName: 'Unity Mentorship Hub',
      supportEmail: 'support@unitymentorship.com',
      updatedAt: Timestamp.now()
    }, { merge: true });

    await setDoc(doc(db, 'settings', 'notifications'), {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      updatedAt: Timestamp.now()
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error creating default settings:', error);
    return false;
  }
};
