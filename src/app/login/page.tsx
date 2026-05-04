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

  /* ── Google handler ── */

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
      <div className="luxe luxe-login-page" style={styles.page}>
        {/* Brand mark above card stays even in loading state so the page
            doesn't look like a blank crash. */}
        <div className="luxe-login-mark" style={styles.brandAbove}>VOYAGR</div>
        <div style={styles.card}>
          <div style={styles.spinner} />
        </div>
        <div className="luxe-login-mono" style={styles.brandBelow}>EST · MMXXV · BY INVITATION</div>
      </div>
    );
  }

  return (
    <div className="luxe luxe-login-page" style={styles.page}>
      {/* Faint champagne horizon hairline at 50% viewport — the single
          decorative gesture on this page. Behind the card, full width. */}
      <div aria-hidden style={styles.horizon} />

      <div className="luxe-login-mark" style={styles.brandAbove}>VOYAGR</div>

      <div style={styles.card}>
        {/* Invisible reCAPTCHA target — always mounted so Firebase's iframe
            survives form-state changes (phone <-> OTP <-> change number). */}
        <div id={RECAPTCHA_CONTAINER_ID} style={{ display: "none" }} aria-hidden="true" />

        {/* Logo lockup */}
        <div style={styles.logoSection}>
          <Link href="/" style={styles.logo}>Voyagr</Link>
          <p style={styles.tagline}>PREFERRED HOTEL RATES</p>
        </div>

        {/* ── Phone OTP form ── */}
        {!otpSent ? (
          <div style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>MOBILE NUMBER</label>
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
            {error && (
              <div style={styles.errorPill} role="alert">
                {error}
              </div>
            )}
            <button
              id="send-otp-btn"
              onClick={handleSendOtp}
              disabled={submitting}
              style={{
                ...styles.primaryBtn,
                opacity: submitting ? 0.45 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? (
                <span style={styles.btnSpinner} aria-label="Sending" />
              ) : (
                <>SEND OTP</>
              )}
            </button>
          </div>
        ) : (
          <div style={styles.form}>
            <p style={styles.otpHint}>
              Code sent to <strong>+91 {phone.replace(/^\+?91/, "")}</strong>
            </p>
            <div style={styles.field}>
              <label style={styles.label}>ENTER 6-DIGIT OTP</label>
              <div style={styles.otpRow}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  style={styles.otpInput}
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
            </div>
            {error && (
              <div style={styles.errorPill} role="alert">
                {error}
              </div>
            )}
            <button
              onClick={handleVerifyOtp}
              disabled={submitting}
              style={{
                ...styles.primaryBtn,
                opacity: submitting ? 0.45 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? (
                <span style={styles.btnSpinner} aria-label="Verifying" />
              ) : (
                <>VERIFY &amp; LOG IN</>
              )}
            </button>
            <button
              onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
              style={styles.linkBtn}
            >
              CHANGE NUMBER
            </button>
          </div>
        )}

        {/* OR divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>OR</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Google button — outline style on lifted dark surface */}
        <button
          onClick={handleGoogle}
          disabled={submitting}
          style={{
            ...styles.googleBtn,
            opacity: submitting ? 0.45 : 1,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>

      <div className="luxe-login-mono" style={styles.brandBelow}>EST · MMXXV · BY INVITATION</div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Inline styles — all values reference canonical --luxe-* tokens.
   The page is wrapped in `.luxe`, but we deliberately do NOT depend
   on the legacy --cream / --white remap (that's what produced the
   ghost-card bug in v1). Per the design spec: solid surfaces, sharp
   2px corners, one champagne accent per surface, hairline language.
   ──────────────────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--luxe-black)",
    padding: "48px 20px",
    position: "relative",
    overflow: "hidden",
  },
  horizon: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 1,
    background: "var(--luxe-champagne-line)",
    opacity: 0.4,
    pointerEvents: "none",
    zIndex: 0,
  },
  brandAbove: {
    position: "relative",
    zIndex: 1,
    fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
    fontStyle: "italic",
    fontSize: 18,
    fontWeight: 400,
    letterSpacing: "0.32em",
    color: "var(--luxe-soft-white-50)",
    marginBottom: 40,
    userSelect: "none",
  },
  brandBelow: {
    position: "relative",
    zIndex: 1,
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
    fontSize: 9,
    fontWeight: 500,
    letterSpacing: "0.4em",
    textTransform: "uppercase",
    color: "var(--luxe-champagne)",
    marginTop: 32,
    userSelect: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 420,
    background: "var(--luxe-black-2)",
    borderRadius: 2,
    border: "1px solid var(--luxe-hairline-strong)",
    padding: "48px 40px",
    // Foil-edge: 1px champagne hairline inset from the top of the card,
    // plus a long-throw shadow with no halo bloom. This is the signature
    // detail mirrored on the MobileNav drawer's left edge.
    boxShadow: [
      "inset 0 1px 0 var(--luxe-champagne-line)",
      "0 24px 60px -20px rgba(0,0,0,0.7)",
      "0 1px 0 rgba(0,0,0,0.4)",
    ].join(", "),
  },
  logoSection: {
    textAlign: "center" as const,
    marginBottom: 32,
  },
  logo: {
    fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
    fontStyle: "italic",
    fontSize: 36,
    fontWeight: 400,
    letterSpacing: "0.04em",
    color: "var(--luxe-soft-white)",
    textDecoration: "none",
    display: "inline-block",
  },
  tagline: {
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
    fontSize: 10,
    color: "var(--luxe-champagne)",
    marginTop: 10,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    fontWeight: 500,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 18,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  label: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 11,
    fontWeight: 500,
    color: "var(--luxe-soft-white-70)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  phoneRow: {
    display: "flex",
    alignItems: "stretch",
    height: 52,
    background: "var(--luxe-input-bg)",
    border: "1px solid var(--luxe-hairline-strong)",
    borderRadius: 2,
    overflow: "hidden",
    transition: "border-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 160ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
  countryCode: {
    width: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--luxe-soft-white)",
    background: "transparent",
    borderRight: "1px solid var(--luxe-hairline-strong)",
    userSelect: "none" as const,
    flexShrink: 0,
  },
  phoneInput: {
    flex: 1,
    minWidth: 0,
    padding: "0 16px",
    border: "none",
    background: "transparent",
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 16,
    color: "var(--luxe-soft-white)",
    outline: "none",
    letterSpacing: "0.06em",
  },
  otpRow: {
    display: "flex",
    height: 56,
    background: "var(--luxe-input-bg)",
    border: "1px solid var(--luxe-hairline-strong)",
    borderRadius: 2,
    overflow: "hidden",
    transition: "border-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 160ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
  otpInput: {
    flex: 1,
    minWidth: 0,
    padding: "0 16px",
    border: "none",
    background: "transparent",
    fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
    fontSize: 24,
    fontWeight: 400,
    color: "var(--luxe-soft-white)",
    outline: "none",
    letterSpacing: "0.4em",
    textAlign: "center" as const,
  },
  otpHint: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 13,
    color: "var(--luxe-soft-white-70)",
    textAlign: "center" as const,
    margin: 0,
    lineHeight: 1.5,
  },
  errorPill: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 13,
    color: "var(--luxe-error)",
    background: "var(--luxe-error-soft)",
    borderLeft: "2px solid var(--luxe-error)",
    padding: "10px 14px",
    borderRadius: 2,
    margin: 0,
    lineHeight: 1.4,
  },
  primaryBtn: {
    position: "relative",
    width: "100%",
    height: 52,
    border: "none",
    borderRadius: 2,
    background: "var(--luxe-champagne)",
    color: "var(--luxe-black)",
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
    transition: "background 220ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 80ms ease-out, filter 80ms ease-out",
    marginTop: 4,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnSpinner: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: "2px solid rgba(12,11,10,0.25)",
    borderTopColor: "var(--luxe-black)",
    animation: "voyagr-spin 0.9s linear infinite",
    display: "inline-block",
  },
  linkBtn: {
    background: "none",
    border: "none",
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 12,
    color: "var(--luxe-soft-white-50)",
    cursor: "pointer",
    fontWeight: 500,
    textAlign: "center" as const,
    padding: "8px 0 0",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    transition: "color 180ms ease-out",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    margin: "28px 0 20px",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "var(--luxe-hairline-strong)",
  },
  dividerText: {
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
    fontSize: 9,
    color: "var(--luxe-soft-white-50)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.4em",
    fontWeight: 500,
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 48,
    border: "1px solid var(--luxe-hairline-strong)",
    borderRadius: 2,
    background: "var(--luxe-black-3)",
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--luxe-soft-white)",
    cursor: "pointer",
    transition: "border-color 200ms cubic-bezier(0.2, 0.8, 0.2, 1), background 200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
  spinner: {
    width: 28,
    height: 28,
    border: "2px solid var(--luxe-hairline-strong)",
    borderTopColor: "var(--luxe-champagne)",
    borderRadius: "50%",
    margin: "96px auto",
    animation: "voyagr-spin 0.9s linear infinite",
  },
};
