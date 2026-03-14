import '@testing-library/jest-dom';

// ─── localStorage mock ────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// ─── Firebase mocks ───────────────────────────────────────────────────────────

vi.mock('../src/firebase', () => ({
  auth: { currentUser: null },
  db: {},
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApp: vi.fn(),
  FirebaseError: class FirebaseError extends Error {
    constructor(public code: string, message: string) { super(message); }
  },
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((_auth, cb) => { cb(null); return () => {}; }),
}));

vi.mock('firebase/firestore', () => {
  class MockTimestamp {
    seconds: number;
    nanoseconds: number;
    constructor(seconds = 0, nanoseconds = 0) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    toDate() { return new Date(this.seconds * 1000); }
    static now() { return new MockTimestamp(Math.floor(Date.now() / 1000)); }
    static fromDate(d: Date) { return new MockTimestamp(Math.floor(d.getTime() / 1000)); }
  }
  return {
    getFirestore: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
    setDoc: vi.fn(() => Promise.resolve()),
    addDoc: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    collection: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({ docs: [], size: 0 })),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn(() => () => {}),
    writeBatch: vi.fn(() => ({ set: vi.fn(), update: vi.fn(), delete: vi.fn(), commit: vi.fn(() => Promise.resolve()) })),
    Timestamp: MockTimestamp,
    serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
    FieldValue: { serverTimestamp: vi.fn(), increment: vi.fn(), arrayUnion: vi.fn(), arrayRemove: vi.fn() },
  };
});

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => vi.fn(() => Promise.resolve({ data: {} }))),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(() => Promise.resolve('https://mock.url/photo.jpg')),
}));
