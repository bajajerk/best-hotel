import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAoxR-B3Gf8K8O3bymF0W2_xkmO-YZ2SzU",
  authDomain: "voyagrclub.firebaseapp.com",
  projectId: "voyagrclub",
  storageBucket: "voyagrclub.firebasestorage.app",
  messagingSenderId: "793652670519",
  appId: "1:793652670519:web:54c7236ca327c45fc3cfb2",
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _persistencePromise: Promise<void> | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase env vars not set");
  }
  _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());
  // Persist sessions across tabs/reloads. Without this, Safari/iOS and some
  // privacy-mode browsers default to in-memory persistence and silently drop
  // the session on refresh — which manifests as flaky "sometimes works,
  // sometimes redirects back to login" behavior.
  if (typeof window !== "undefined" && !_persistencePromise) {
    _persistencePromise = setPersistence(_auth, browserLocalPersistence).catch(
      (e) => {
        // eslint-disable-next-line no-console
        console.warn("[firebase] setPersistence failed:", e);
      }
    );
  }
  return _auth;
}

/** Awaits the one-shot setPersistence call. Safe to call repeatedly. */
export async function ensureAuthPersistence(): Promise<void> {
  // Calling getFirebaseAuth() kicks off the persistence promise on first run.
  getFirebaseAuth();
  if (_persistencePromise) await _persistencePromise;
}
