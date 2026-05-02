"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface SignupGateModalProps {
  open: boolean;
  onClose: () => void;
  hotelName: string;
}

// ---------------------------------------------------------------------------
// Google SVG icon (official multi-color "G")
// ---------------------------------------------------------------------------
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// SignupGateModal
// ---------------------------------------------------------------------------
export default function SignupGateModal({ open, onClose, hotelName }: SignupGateModalProps) {
  const [phone, setPhone] = useState("");

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Reset phone on open
  useEffect(() => {
    if (open) setPhone("");
  }, [open]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(26,23,16,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Modal box */}
      <div
        style={{
          background: "var(--white)",
          border: "1px solid rgba(201,168,76,0.15)",
          padding: "48px",
          maxWidth: "420px",
          width: "100%",
          margin: "0 20px",
          borderRadius: 0,
          position: "relative",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            color: "var(--gold)",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          One Step Away
        </div>

        {/* H2 — hotel name in italic gold */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "30px",
            fontWeight: 300,
            color: "var(--ink)",
            lineHeight: 1.25,
            margin: "0 0 16px 0",
          }}
        >
          Your member rate for{" "}
          <em style={{ fontStyle: "italic", color: "var(--gold)" }}>{hotelName}</em>
        </h2>

        {/* Subtext */}
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--ink-mid)",
            lineHeight: 1.6,
            margin: "0 0 32px 0",
          }}
        >
          Free to join. No credit card.
          <br />
          2,847 Indian travellers already members.
        </p>

        {/* Google OAuth button */}
        <button
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid var(--cream-border)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
            marginBottom: "24px",
          }}
        >
          <GoogleIcon />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--ink)",
              fontWeight: 400,
            }}
          >
            Continue with Google
          </span>
        </button>

        {/* Divider — "or" with lines */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "var(--cream-border)",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: "var(--ink-light)",
              textTransform: "lowercase",
            }}
          >
            or
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "var(--cream-border)",
            }}
          />
        </div>

        {/* Phone row: +91 prefix + number input */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          {/* +91 prefix box */}
          <div
            style={{
              width: "64px",
              flexShrink: 0,
              background: "var(--cream-deep)",
              border: "1px solid var(--cream-border)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--ink)",
            }}
          >
            +91
          </div>

          {/* Phone number input */}
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            style={{
              flex: 1,
              background: "var(--cream-deep)",
              border: "1px solid var(--cream-border)",
              padding: "12px 16px",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--ink)",
              outline: "none",
            }}
          />
        </div>

        {/* CTA button */}
        <button
          style={{
            width: "100%",
            background: "var(--gold)",
            border: "1px solid var(--gold)",
            padding: "14px 16px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--ink)",
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            See Member Rate &rarr;
          </span>
        </button>

        {/* Trust line */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            color: "var(--ink-light)",
            textAlign: "center",
            letterSpacing: "0.02em",
          }}
        >
          Free to join &middot; Rates visible instantly &middot; Cancel anytime
        </div>
      </div>
    </div>
  );
}
