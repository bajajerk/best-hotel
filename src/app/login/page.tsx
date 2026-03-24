"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } =
    useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // After Google OAuth, Supabase redirects here with tokens in the URL hash.
  // The Supabase client picks them up automatically via onAuthStateChange.
  // Once user is set, redirect to home.
  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (mode === "login") {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setError(error);
        setSubmitting(false);
      } else {
        router.push("/");
      }
    } else {
      if (!name.trim()) {
        setError("Name is required");
        setSubmitting(false);
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        setSubmitting(false);
        return;
      }
      const { error } = await signUpWithEmail(email, password, name);
      if (error) {
        setError(error);
        setSubmitting(false);
      } else {
        setSignupSuccess(true);
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.spinner} />
        </div>
      </div>
    );
  }

  if (signupSuccess) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logoSection}>
            <Link href="/" style={styles.logo}>
              VOYAGR
            </Link>
          </div>
          <div style={styles.successBox}>
            <span style={{ fontSize: 32 }}>&#10003;</span>
            <h2 style={styles.successTitle}>Account Created</h2>
            <p style={styles.successText}>
              Check your email to confirm your account, then come back and log
              in.
            </p>
            <button
              onClick={() => {
                setSignupSuccess(false);
                setMode("login");
                setPassword("");
              }}
              style={styles.primaryBtn}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <Link href="/" style={styles.logo}>
            VOYAGR
          </Link>
          <p style={styles.tagline}>Preferred Hotel Rates</p>
        </div>

        {/* Mode tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => {
              setMode("login");
              setError("");
            }}
            style={mode === "login" ? styles.tabActive : styles.tab}
          >
            Log In
          </button>
          <button
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            style={mode === "signup" ? styles.tabActive : styles.tab}
          >
            Sign Up
          </button>
        </div>

        {/* Google OAuth */}
        <button onClick={signInWithGoogle} style={styles.googleBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === "signup" && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mayank Bajaj"
                style={styles.input}
                autoComplete="name"
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              style={styles.input}
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Min 8 characters" : "Your password"}
              required
              minLength={mode === "signup" ? 8 : undefined}
              style={styles.input}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.primaryBtn,
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting
              ? "Please wait..."
              : mode === "login"
              ? "Log In"
              : "Create Account"}
          </button>
        </form>

        {mode === "login" && (
          <p style={styles.footerText}>
            Forgot password?{" "}
            <span style={styles.footerLink}>Reset it</span>
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Inline styles matching Voyagr cream/ink/gold theme ── */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--cream)",
    padding: "24px 16px",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "var(--white)",
    borderRadius: 16,
    border: "1px solid var(--cream-border)",
    padding: "40px 32px",
    boxShadow: "0 8px 40px rgba(26, 23, 16, 0.06)",
  },
  logoSection: {
    textAlign: "center" as const,
    marginBottom: 28,
  },
  logo: {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontSize: 32,
    fontWeight: 400,
    letterSpacing: "0.12em",
    color: "var(--ink)",
    textDecoration: "none",
  },
  tagline: {
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--ink-light)",
    marginTop: 4,
    letterSpacing: "0.04em",
  },
  tabs: {
    display: "flex",
    gap: 0,
    marginBottom: 24,
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid var(--cream-border)",
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    background: "var(--cream)",
    color: "var(--ink-light)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabActive: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    background: "var(--ink)",
    color: "var(--white)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "12px 16px",
    border: "1px solid var(--cream-border)",
    borderRadius: 10,
    background: "var(--white)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--ink)",
    cursor: "pointer",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "20px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "var(--cream-border)",
  },
  dividerText: {
    fontFamily: "var(--font-body)",
    fontSize: 12,
    color: "var(--ink-light)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    fontFamily: "var(--font-body)",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--ink-mid)",
    letterSpacing: "0.03em",
  },
  input: {
    padding: "12px 14px",
    border: "1px solid var(--cream-border)",
    borderRadius: 10,
    background: "var(--white)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    color: "var(--ink)",
    outline: "none",
    transition: "border-color 0.2s",
  },
  error: {
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--error)",
    background: "var(--danger-soft)",
    padding: "10px 14px",
    borderRadius: 8,
    margin: 0,
  },
  primaryBtn: {
    width: "100%",
    padding: "13px 16px",
    border: "none",
    borderRadius: 10,
    background: "var(--gold)",
    color: "var(--white)",
    fontFamily: "var(--font-body)",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.2s",
    letterSpacing: "0.02em",
    marginTop: 4,
  },
  footerText: {
    textAlign: "center" as const,
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--ink-light)",
    marginTop: 20,
  },
  footerLink: {
    color: "var(--gold)",
    cursor: "pointer",
    fontWeight: 500,
  },
  successBox: {
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 12,
    color: "var(--success)",
  },
  successTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 24,
    fontWeight: 400,
    color: "var(--ink)",
    margin: 0,
  },
  successText: {
    fontFamily: "var(--font-body)",
    fontSize: 14,
    color: "var(--ink-light)",
    lineHeight: 1.5,
    margin: 0,
    marginBottom: 8,
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid var(--cream-border)",
    borderTopColor: "var(--gold)",
    borderRadius: "50%",
    margin: "40px auto",
    animation: "spin 0.8s linear infinite",
  },
};
