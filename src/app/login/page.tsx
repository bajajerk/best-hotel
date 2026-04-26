"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// Stable container for invisible reCAPTCHA. Rendering this once at the top
// of the page (instead of attaching to a button that mounts/unmounts when
// the form swaps between phone-entry and OTP-entry states) eliminates the
// detach-on-rerender flakiness that broke the second send-OTP attempt.
const RECAPTCHA_CONTAINER_ID = "voyagr-recaptcha-container";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signInWithGoogle, sendPhoneOtp, verifyPhoneOtp } = useAuth();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Phone OTP state
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  // Redirect if already logged in. This is the SINGLE source of post-login
  // navigation for this page — individual handlers must NOT also call
  // router.push, otherwise the two navigations race and the user can briefly
  // bounce back to /login before onAuthStateChanged hydrates.
  useEffect(() => {
    if (!loading && user) {
      const next = searchParams?.get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
    }
  }, [loading, user, router, searchParams]);

  /* ── Phone OTP handlers ── */

  const handleSendOtp = async () => {
    setError("");
    const cleaned = phone.replace(/[\s\-()]/g, "");
    // Auto-prepend +91 if user entered 10 digits without country code
    const formatted = cleaned.startsWith("+")
      ? cleaned
      : cleaned.length === 10
      ? `+91${cleaned}`
      : `+${cleaned}`;

    if (formatted.length < 12) {
      setError("Enter a valid phone number (e.g. 98765 43210)");
      return;
    }

    setSubmitting(true);
    const { error } = await sendPhoneOtp(formatted, RECAPTCHA_CONTAINER_ID);
    if (error) {
      setError(error);
    } else {
      setOtpSent(true);
    }
    setSubmitting(false);
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    const { error } = await verifyPhoneOtp(otp);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    // Don't navigate here — the useEffect above handles it once
    // onAuthStateChanged fires. Two navigations racing was the silent
    // "click verify, land back on /login" flake.
  };

  /* ── Google ── */

  const handleGoogle = async () => {
    setError("");
    setSubmitting(true);
    const { error } = await signInWithGoogle();
    setSubmitting(false);
    if (error) setError(error);
    // Same here — the auth-state effect handles the redirect on success.
  };

  /* ── Render ── */

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Invisible reCAPTCHA target — always mounted so Firebase's iframe
            survives form-state changes (phone <-> OTP <-> change number). */}
        <div id={RECAPTCHA_CONTAINER_ID} style={{ display: "none" }} aria-hidden="true" />

        {/* Logo */}
        <div style={styles.logoSection}>
          <Link href="/" style={styles.logo}>VOYAGR</Link>
          <p style={styles.tagline}>Preferred Hotel Rates</p>
        </div>

        {/* ── Phone OTP form ── */}
        {!otpSent ? (
          <div style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Mobile Number</label>
              <div style={styles.phoneRow}>
                <span style={styles.countryCode}>+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d\s\-()]/g, ""))}
                  placeholder="98765 43210"
                  style={styles.phoneInput}
                  autoComplete="tel"
                  maxLength={15}
                  autoFocus
                />
              </div>
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button
              id="send-otp-btn"
              onClick={handleSendOtp}
              disabled={submitting}
              style={{
                ...styles.primaryBtn,
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Sending..." : "Send OTP"}
            </button>
          </div>
        ) : (
          <div style={styles.form}>
            <p style={styles.otpHint}>
              Code sent to <strong>+91 {phone.replace(/^\+?91/, "")}</strong>
            </p>
            <div style={styles.field}>
              <label style={styles.label}>Enter 6-digit OTP</label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                style={{ ...styles.input, textAlign: "center" as const, letterSpacing: "0.3em", fontSize: 20 }}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button
              onClick={handleVerifyOtp}
              disabled={submitting}
              style={{
                ...styles.primaryBtn,
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Verifying..." : "Verify & Log In"}
            </button>
            <button
              onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
              style={styles.linkBtn}
            >
              Change number
            </button>
          </div>
        )}

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Google — for existing users who signed up via Google */}
        <button onClick={handleGoogle} style={styles.googleBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>Continue with Google</span>
        </button>
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
  phoneRow: {
    display: "flex",
    alignItems: "center",
    border: "1px solid var(--cream-border)",
    borderRadius: 10,
    overflow: "hidden",
    background: "var(--white)",
  },
  countryCode: {
    padding: "12px 12px 12px 14px",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--ink)",
    background: "var(--cream)",
    borderRight: "1px solid var(--cream-border)",
    userSelect: "none" as const,
  },
  phoneInput: {
    flex: 1,
    padding: "12px 14px",
    border: "none",
    background: "transparent",
    fontFamily: "var(--font-body)",
    fontSize: 16,
    color: "var(--ink)",
    outline: "none",
    letterSpacing: "0.04em",
  },
  otpHint: {
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--ink-light)",
    textAlign: "center" as const,
    margin: 0,
    lineHeight: 1.5,
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
    color: "#1a1710",
    fontFamily: "var(--font-body)",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.2s",
    letterSpacing: "0.02em",
    marginTop: 4,
  },
  linkBtn: {
    background: "none",
    border: "none",
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--gold)",
    cursor: "pointer",
    fontWeight: 500,
    textAlign: "center" as const,
    padding: 0,
    marginTop: 4,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "24px 0 20px",
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
