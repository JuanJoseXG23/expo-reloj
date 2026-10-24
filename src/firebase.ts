import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, onAuthStateChanged, signInAnonymously, type Auth, type User } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const SESSION_ID: string = env.VITE_SESSION_ID || 'expo-reloj';

/** false si falta la configuración (la app sigue funcionando en modo local). */
export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseConfigured) {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  if (env.VITE_USE_EMULATOR === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
}

export function getDb(): Firestore {
  if (!db) throw new Error('Firebase no está configurado');
  return db;
}

// ── Sesión anónima invisible ────────────────────────────────────────────────
// El estudiante nunca ve esto: solo sirve para tener un uid y que funcionen las reglas.
let authPromise: Promise<User> | null = null;

export function ensureAuth(): Promise<User> {
  if (!auth) return Promise.reject(new Error('Firebase no está configurado'));
  if (!authPromise) {
    const a = auth;
    authPromise = new Promise<User>((resolve, reject) => {
      const unsub = onAuthStateChanged(a, (user) => {
        if (user) {
          unsub();
          resolve(user);
        }
      });
      signInAnonymously(a).catch((err) => {
        unsub();
        authPromise = null; // permite reintentar
        reject(err);
      });
    });
  }
  return authPromise;
}

/** Inicia una suscripción solo cuando ya hay sesión anónima (las reglas la exigen). Devuelve cómo cancelarla. */
export function whenAuthed(start: () => () => void): () => void {
  let unsub: (() => void) | null = null;
  let cancelled = false;
  ensureAuth()
    .then(() => {
      if (!cancelled) unsub = start();
    })
    .catch((e) => console.warn('Sin sesión anónima', e));
  return () => {
    cancelled = true;
    unsub?.();
  };
}
