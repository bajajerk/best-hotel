"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  updateProfile,
  type User,
  type Auth,
  type ConfirmationResult,
} from "firebase/auth";

/* ── Types ── */

interface AuthState {
  user: User | null;
  loading: boolean;
  /** Get a fresh Firebase ID token for API calls */
  getIdToken: () => Promise<string | null>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  /** Step 1: send OTP to phone number (E.164 format, e.g. "+919876543210") */
  sendPhoneOtp: (phone: string, buttonId: string) => Promise<{ error: string | null }>;
  /** Step 2: verify OTP code */
  verifyPhoneOtp: (code: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  getIdToken: async () => null,
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  sendPhoneOtp: async () => ({ error: null }),
  verifyPhoneOtp: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
});

/* ── Provider ── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    let auth: Auth;
    try {
      auth = getFirebaseAuth();
    } catch {
      // Env vars missing (SSG build) — skip auth init
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ── Helpers ── */

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  }, [user]);

  /** Sync user to our backend after any login (creates DB row if needed) */
  const syncSession = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      await fetch(`${apiBase}/api/auth/session`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch {
      // Non-critical — user row will be created on next API call anyway
    }
  }, []);

  /* ── Auth methods ── */

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      await syncSession();
      return { error: null };
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  }, [syncSession]);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      await syncSession();
      return { error: null };
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  }, [syncSession]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(getFirebaseAuth(), provider);
      await syncSession();
      return { error: null };
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  }, [syncSession]);

  const sendPhoneOtp = useCallback(async (phone: string, buttonId: string) => {
    try {
      const auth = getFirebaseAuth();
      // Clean up previous reCAPTCHA if any
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
      const verifier = new RecaptchaVerifier(auth, buttonId, { size: "invisible" });
      recaptchaRef.current = verifier;
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      confirmationRef.current = result;
      return { error: null };
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  }, []);

  const verifyPhoneOtp = useCallback(async (code: string) => {
    if (!confirmationRef.current) {
      return { error: "No OTP was sent. Please request a new code." };
    }
    try {
      await confirmationRef.current.confirm(code);
      confirmationRef.current = null;
      await syncSession();
      return { error: null };
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  }, [syncSession]);

  const handleSignOut = useCallback(async () => {
    try {
      await firebaseSignOut(getFirebaseAuth());
    } catch {
      // ignore
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      return { error: null };
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  }, []);

  const handleUpdatePassword = useCallback(async (newPassword: string) => {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) return { error: "Not signed in" };
    try {
      await firebaseUpdatePassword(auth.currentUser, newPassword);
      return { error: null };
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        getIdToken,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPhoneOtp,
        verifyPhoneOtp,
        signOut: handleSignOut,
        resetPassword,
        updatePassword: handleUpdatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
