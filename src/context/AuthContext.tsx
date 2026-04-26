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
import { ensureAuthPersistence, getFirebaseAuth } from "@/lib/firebase";
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

/* ── Error helpers ── */

/** Convert a Firebase auth error into a user-facing string. Firebase's raw
 *  `Error.message` looks like "Firebase: Error (auth/code-expired)." which is
 *  hostile to users — surface a short readable hint instead. */
function friendlyAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const raw = (e as Error)?.message ?? "Sign-in failed. Please try again.";
  switch (code) {
    case "auth/invalid-phone-number":
      return "That doesn't look like a valid phone number.";
    case "auth/missing-phone-number":
      return "Please enter your phone number.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a few minutes.";
    case "auth/code-expired":
      return "That code expired. Please request a new one.";
    case "auth/invalid-verification-code":
    case "auth/invalid-otp":
      return "That code is incorrect. Double-check and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and retry.";
    case "auth/popup-blocked":
      return "Pop-up was blocked. Allow pop-ups for this site and retry.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email under a different sign-in method.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/user-not-found":
      return "No account found with that email.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    default:
      // Strip the "Firebase: " prefix Firebase loves to add.
      return raw.replace(/^Firebase:\s*/i, "").replace(/\s*\(auth\/[^)]+\)\.?$/i, "");
  }
}

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

  /** Sync user to our backend after any login (creates DB row if needed).
   *  Uses forceRefresh so the token always reflects the most recent sign-in
   *  (otherwise we can send a token from a previous session). Returns the
   *  HTTP status so callers can decide whether to surface a backend error. */
  const syncSession = useCallback(async (): Promise<{ ok: boolean; status: number }> => {
    try {
      const auth = getFirebaseAuth();
      const current = auth.currentUser;
      if (!current) return { ok: false, status: 0 };
      const token = await current.getIdToken(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/api/auth/session`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return { ok: res.ok, status: res.status };
    } catch {
      // Network blip — user row will be lazily created on next API call.
      return { ok: false, status: 0 };
    }
  }, []);

  /* ── Auth methods ── */

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      await ensureAuthPersistence();
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      await syncSession();
      return { error: null };
    } catch (e: unknown) {
      return { error: friendlyAuthError(e) };
    }
  }, [syncSession]);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    try {
      await ensureAuthPersistence();
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      await syncSession();
      return { error: null };
    } catch (e: unknown) {
      return { error: friendlyAuthError(e) };
    }
  }, [syncSession]);

  const signInWithGoogle = useCallback(async () => {
    try {
      await ensureAuthPersistence();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(getFirebaseAuth(), provider);
      await syncSession();
      return { error: null };
    } catch (e: unknown) {
      return { error: friendlyAuthError(e) };
    }
  }, [syncSession]);

  const sendPhoneOtp = useCallback(async (phone: string, containerId: string) => {
    try {
      await ensureAuthPersistence();
      const auth = getFirebaseAuth();

      // Always tear down any previous verifier *first*. clear() can throw if
      // the underlying widget was already detached (e.g. parent component
      // unmounted between attempts) — swallow that, it's expected. Failing to
      // null the ref here is the classic "phone OTP works once, breaks on
      // retry" bug.
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          /* widget already gone */
        }
        recaptchaRef.current = null;
      }

      // The container must exist in the DOM at the moment we construct the
      // verifier. If a caller passes a button id that's only mounted
      // conditionally (e.g. behind an "otpSent" flag), Firebase will inject
      // its iframe at construction time and detach it as soon as the parent
      // re-renders — leaving us with a verifier that silently fails on the
      // next call. Surface that as a real error instead.
      if (typeof document !== "undefined" && !document.getElementById(containerId)) {
        return {
          error:
            "Verification widget container not found. Please refresh the page and try again.",
        };
      }

      const verifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
      recaptchaRef.current = verifier;
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      confirmationRef.current = result;
      return { error: null };
    } catch (e: unknown) {
      // On failure, drop the verifier so the next attempt builds a fresh one.
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          /* ignore */
        }
        recaptchaRef.current = null;
      }
      return { error: friendlyAuthError(e) };
    }
  }, []);

  const verifyPhoneOtp = useCallback(async (code: string) => {
    if (!confirmationRef.current) {
      return { error: "No OTP was sent. Please request a new code." };
    }
    try {
      await confirmationRef.current.confirm(code);
      confirmationRef.current = null;
      // Tear down the reCAPTCHA verifier so a future sign-out / sign-in
      // attempt within the same page session starts from a clean slate.
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          /* ignore */
        }
        recaptchaRef.current = null;
      }
      await syncSession();
      return { error: null };
    } catch (e: unknown) {
      return { error: friendlyAuthError(e) };
    }
  }, [syncSession]);

  const handleSignOut = useCallback(async () => {
    try {
      await firebaseSignOut(getFirebaseAuth());
    } catch {
      // ignore
    }
    // Clear any stale verifier/confirmation so the next login starts fresh.
    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.clear();
      } catch {
        /* ignore */
      }
      recaptchaRef.current = null;
    }
    confirmationRef.current = null;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      return { error: null };
    } catch (e: unknown) {
      return { error: friendlyAuthError(e) };
    }
  }, []);

  const handleUpdatePassword = useCallback(async (newPassword: string) => {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) return { error: "Not signed in" };
    try {
      await firebaseUpdatePassword(auth.currentUser, newPassword);
      return { error: null };
    } catch (e: unknown) {
      return { error: friendlyAuthError(e) };
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
