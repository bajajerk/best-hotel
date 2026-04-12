import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

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
  return _auth;
}
