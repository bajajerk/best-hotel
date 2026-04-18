"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface RoomSelectLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = "choose" | "phone" | "otp";

export default function RoomSelectLoginModal({
  onClose,
  onSuccess,
}: RoomSelectLoginModalProps) {
  const { signInWithGoogle, sendPhoneOtp, verifyPhoneOtp } = useAuth();

  const [mode, setMode] = useState<Mode>("choose");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handleGoogle = async () => {
    setError("");
    setSubmitting(true);
    const { error } = await signInWithGoogle();
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    onSuccess();
  };

  const handleSendOtp = async () => {
    setError("");
    const cleaned = phone.replace(/[\s\-()]/g, "");
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
    const { error } = await sendPhoneOtp(formatted, "room-select-send-otp-btn");
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    setMode("otp");
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
    onSuccess();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleOverlayClick}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(11,27,43,0.92)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            style={{
              background: "var(--white)",
              border: "1px solid var(--cream-border)",
              padding: "40px 32px",
              maxWidth: 420,
              width: "100%",
              borderRadius: 16,
              position: "relative",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              aria-label="Close"
              onClick={onClose}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--ink-light)",
                fontSize: 22,
                lineHeight: 1,
              }}
            >
              &times;
            </button>

            {/* Eyebrow */}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--gold)",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Members Only
            </div>

            {/* Heading */}
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 400,
                color: "var(--ink)",
                lineHeight: 1.25,
                margin: "0 0 10px 0",
              }}
            >
              Join free to book this hotel
            </h2>

            {/* Subtext */}
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "var(--ink-mid)",
                lineHeight: 1.55,
                margin: "0 0 24px 0",
              }}
            >
              See member rates and book in minutes. Free forever.
            </p>

            {mode === "choose" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Google */}
                <button
                  onClick={handleGoogle}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "13px 16px",
                    border: "1px solid var(--cream-border)",
                    borderRadius: 10,
                    background: "var(--white)",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--ink)",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{submitting ? "Signing in\u2026" : "Continue with Google"}</span>
                </button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
                  <div style={{ flex: 1, height: 1, background: "var(--cream-border)" }} />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--ink-light)",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                    }}
                  >
                    or
                  </span>
                  <div style={{ flex: 1, height: 1, background: "var(--cream-border)" }} />
                </div>

                {/* Phone OTP option */}
                <button
                  onClick={() => setMode("phone")}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "13px 16px",
                    border: "1px solid var(--ink)",
                    borderRadius: 10,
                    background: "var(--ink)",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--cream)",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>Continue with phone</span>
                </button>
              </div>
            )}

            {mode === "phone" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--ink-mid)",
                    letterSpacing: "0.03em",
                  }}
                >
                  Mobile number
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid var(--cream-border)",
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "var(--white)",
                  }}
                >
                  <span
                    style={{
                      padding: "12px 12px 12px 14px",
                      fontFamily: "var(--font-body)",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--ink)",
                      background: "var(--cream)",
                      borderRight: "1px solid var(--cream-border)",
                    }}
                  >
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s\-()]/g, ""))}
                    placeholder="98765 43210"
                    autoComplete="tel"
                    maxLength={15}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      border: "none",
                      background: "transparent",
                      fontFamily: "var(--font-body)",
                      fontSize: 16,
                      color: "var(--ink)",
                      outline: "none",
                      letterSpacing: "0.04em",
                    }}
                  />
                </div>

                {error && (
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: "var(--error)",
                      background: "var(--danger-soft)",
                      padding: "10px 14px",
                      borderRadius: 8,
                      margin: 0,
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  id="room-select-send-otp-btn"
                  onClick={handleSendOtp}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    border: "none",
                    borderRadius: 10,
                    background: "var(--gold)",
                    color: "var(--ink)",
                    fontFamily: "var(--font-body)",
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? "Sending\u2026" : "Send OTP"}
                </button>

                <button
                  onClick={() => {
                    setMode("choose");
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "var(--ink-light)",
                    cursor: "pointer",
                    padding: 0,
                    textAlign: "center",
                  }}
                >
                  Back
                </button>
              </div>
            )}

            {mode === "otp" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "var(--ink-light)",
                    textAlign: "center",
                    margin: 0,
                  }}
                >
                  Code sent to <strong>+91 {phone.replace(/^\+?91/, "")}</strong>
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  autoFocus
                  style={{
                    padding: "14px 16px",
                    border: "1px solid var(--cream-border)",
                    borderRadius: 10,
                    background: "var(--white)",
                    fontFamily: "var(--font-body)",
                    fontSize: 20,
                    color: "var(--ink)",
                    textAlign: "center",
                    letterSpacing: "0.3em",
                    outline: "none",
                  }}
                />

                {error && (
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: "var(--error)",
                      background: "var(--danger-soft)",
                      padding: "10px 14px",
                      borderRadius: 8,
                      margin: 0,
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    border: "none",
                    borderRadius: 10,
                    background: "var(--gold)",
                    color: "var(--ink)",
                    fontFamily: "var(--font-body)",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? "Verifying\u2026" : "Verify & continue"}
                </button>

                <button
                  onClick={() => {
                    setMode("phone");
                    setOtp("");
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "var(--ink-light)",
                    cursor: "pointer",
                    padding: 0,
                    textAlign: "center",
                  }}
                >
                  Change number
                </button>
              </div>
            )}

            {/* Trust footer */}
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ink-light)",
                textAlign: "center",
                letterSpacing: "0.05em",
                marginTop: 20,
                marginBottom: 0,
              }}
            >
              Free to join &middot; Cancel anytime
            </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
