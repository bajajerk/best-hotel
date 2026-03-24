"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getSupabase } from "@/lib/supabase";
import type { User, Session, SupabaseClient } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let supabase: SupabaseClient;
    try {
      supabase = getSupabase();
    } catch {
      // Env vars missing (SSG build) — skip auth init
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const { error } = await getSupabase().auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/login`;
    await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  const signOut = async () => {
    await getSupabase().auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profile?tab=security`,
    });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await getSupabase().auth.updateUser({
      password: newPassword,
    });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
