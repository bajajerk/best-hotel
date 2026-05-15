"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingFlow } from "@/context/BookingFlowContext";
import { useAuth } from "@/context/AuthContext";

const GOLD = "var(--luxe-champagne)";
const SURFACE = "rgba(255,255,255,0.04)";
const SURFACE_BORDER = "rgba(255,255,255,0.08)";
const INPUT_BG = "rgba(255,255,255,0.03)";
const INPUT_BORDER = "rgba(255,255,255,0.14)";
const ERROR = "#e08585";
const TEXT_PRIMARY = "var(--luxe-soft-white)";
const TEXT_MUTED = "rgba(247, 245, 242, 0.65)";
const TEXT_SOFT = "rgba(247, 245, 242, 0.45)";

const HOLD_SECONDS = 300;
const SPECIAL_REQUESTS_MAX = 500;

function formatTimer(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function GuestDetailsPage() {
  const router = useRouter();
  const flow = useBookingFlow();
  const { user } = useAuth();

  // Prefill from auth + previously-saved context
  const [name, setName] = useState(flow.guestName || "");
  const [email, setEmail] = useState(flow.guestEmail || "");
  const [phone, setPhone] = useState(flow.guestPhone || "");
  const [specialRequests, setSpecialRequests] = useState(flow.specialRequests || "");

  const [gstOpen, setGstOpen] = useState(!!flow.identity.gstin);
  const [gstin, setGstin] = useState(flow.identity.gstin);
  const [pan, setPan] = useState(flow.identity.pan);
  const [panError, setPanError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  const [seconds, setSeconds] = useState(HOLD_SECONDS);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Bounce back to home if essential rate plan data is missing.
  useEffect(() => {
    if (!flow.hotelMasterId || !flow.optionId) {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill from Firebase auth (only if fields are still empty)
  useEffect(() => {
    if (!user) return;
    setName((prev) => prev || user.displayName || "");
    setEmail((prev) => prev || user.email || "");
    setPhone((prev) => prev || user.phoneNumber || "");
  }, [user]);

  // Drive the same countdown the Review page started.
  useEffect(() => {
    if (!flow.holdStartedAt) {
      flow.startHold();
      return;
    }
    const tick = () => {
      const elapsed = Math.floor((Date.now() - (flow.holdStartedAt ?? Date.now())) / 1000);
      const remaining = HOLD_SECONDS - elapsed;
      if (remaining <= 0) {
        setSeconds(0);
        setExpired(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setSeconds(remaining);
      }
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [flow.holdStartedAt]);

  const isPanValid = (val: string) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val.trim().toUpperCase());

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) errs.email = "Enter a valid email";
    setErrors(errs);

    let panOk = true;
    if (!pan.trim()) {
      setPanError("PAN is required as per RBI guidelines");
      panOk = false;
    } else if (!isPanValid(pan)) {
      setPanError("Enter a valid 10-character PAN (e.g. ABCDE1234F)");
      panOk = false;
    } else {
      setPanError(null);
    }

    return Object.keys(errs).length === 0 && panOk;
  };

  const handleContinue = () => {
    if (expired) return;
    if (!validate()) return;
    flow.setGuestDetails({
      guestName: name.trim(),
      guestEmail: email.trim(),
      guestPhone: phone.trim(),
      specialRequests: specialRequests.trim(),
    });
    flow.setIdentity({ pan: pan.trim().toUpperCase(), gstin: gstin.trim().toUpperCase() });
    // Mirror primary guest into legacy guestInfo for downstream code.
    const [firstName, ...rest] = name.trim().split(/\s+/);
    flow.setGuestInfo({
      firstName: firstName || name.trim(),
      lastName: rest.join(" "),
      email: email.trim(),
      phone: phone.trim(),
      specialRequests: specialRequests.trim(),
    });
    router.push("/book/payment");
  };

  const handleSearchAgain = () => router.push("/search");

  const inputStyle = (hasError: boolean) => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid ${hasError ? ERROR : INPUT_BORDER}`,
    background: INPUT_BG,
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-body)",
    color: TEXT_PRIMARY,
    outline: "none",
    boxSizing: "border-box" as const,
  });

  const labelStyle = {
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
    fontSize: 10,
    fontWeight: 700,
    color: GOLD,
    letterSpacing: "0.32em",
    textTransform: "uppercase" as const,
    marginBottom: 8,
    display: "block" as const,
  };

  const errorTextStyle = {
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-caption)",
    color: ERROR,
    marginTop: 4,
    display: "block" as const,
  };

  const sectionTitle = useMemo(
    () => ({
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-heading-3)",
      fontWeight: 500,
      color: TEXT_PRIMARY,
      letterSpacing: "-0.01em",
      margin: 0,
    }),
    []
  );

  const cardStyle = {
    background: SURFACE,
    borderRadius: 16,
    border: `1px solid ${SURFACE_BORDER}`,
    padding: "20px 22px",
    marginBottom: 16,
  };

  return (
    <div>
      {/* Carry-over urgency timer */}
      <div
        role="status"
        aria-live="polite"
        style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 999,
            background: "rgba(200,170,118,0.10)",
            border: `1px solid rgba(200,170,118,0.45)`,
            fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: GOLD,
          }}
        >
          <span aria-hidden>⏱</span>
          <span>Rate held · {formatTimer(seconds)}</span>
        </div>
      </div>

      {/* Primary guest card */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Primary guest</h3>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body-sm)",
            color: TEXT_MUTED,
            marginTop: 4,
            marginBottom: 14,
          }}
        >
          Used for booking confirmation
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Full name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            placeholder="Jane Doe"
            autoComplete="name"
            style={inputStyle(!!errors.name)}
          />
          {errors.name && <span style={errorTextStyle}>{errors.name}</span>}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <div>
            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="jane@example.com"
              autoComplete="email"
              style={inputStyle(!!errors.email)}
            />
            {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98335 34627"
              autoComplete="tel"
              style={inputStyle(false)}
            />
          </div>
        </div>
      </div>

      {/* Special requests */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Special requests / preferences</h3>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body-sm)",
            color: TEXT_MUTED,
            marginTop: 4,
            marginBottom: 14,
          }}
        >
          Anything we should know? Bed type, dietary needs, celebrations…
        </div>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value.slice(0, SPECIAL_REQUESTS_MAX))}
          placeholder="High floor with city view, late check-in around 11 PM…"
          rows={4}
          maxLength={SPECIAL_REQUESTS_MAX}
          style={{
            ...inputStyle(false),
            resize: "vertical" as const,
            fontFamily: "var(--font-body)",
            lineHeight: 1.5,
          }}
        />
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-caption)",
            color: TEXT_SOFT,
            textAlign: "right",
            marginTop: 6,
          }}
        >
          {specialRequests.length} / {SPECIAL_REQUESTS_MAX}
        </div>
      </div>

      {/* GST Details — collapsed optional section */}
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h3 style={sectionTitle}>GST Details</h3>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body-sm)",
                color: TEXT_MUTED,
                marginTop: 4,
              }}
            >
              Optional — for business travellers
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGstOpen((v) => !v)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body-sm)",
              fontWeight: 600,
              color: GOLD,
              cursor: "pointer",
              whiteSpace: "nowrap",
              letterSpacing: "0.04em",
            }}
            aria-expanded={gstOpen}
          >
            {gstOpen ? "Hide" : "Add GST"}
          </button>
        </div>

        {gstOpen && (
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>GSTIN</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="22ABCDE1234F1Z5"
              maxLength={15}
              style={inputStyle(false)}
            />
          </div>
        )}
      </div>

      {/* Identity Verification (PAN) */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Identity Verification</h3>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body-sm)",
            color: TEXT_MUTED,
            marginTop: 4,
            marginBottom: 14,
          }}
        >
          Required as per RBI
        </div>

        <label style={labelStyle}>PAN Number *</label>
        <input
          type="text"
          value={pan}
          onChange={(e) => {
            setPan(e.target.value.toUpperCase());
            if (panError) setPanError(null);
          }}
          placeholder="ABCDE1234F"
          maxLength={10}
          style={inputStyle(!!panError)}
        />
        {panError && <span style={errorTextStyle}>{panError}</span>}
      </div>

      {/* Sticky bottom bar */}
      <div
        className="book-bottom-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(12, 11, 10, 0.92)",
          backdropFilter: "blur(18px) saturate(120%)",
          WebkitBackdropFilter: "blur(18px) saturate(120%)",
          borderTop: `1px solid ${SURFACE_BORDER}`,
          padding: "14px 16px",
          paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0))",
          zIndex: 110,
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <button
            onClick={handleContinue}
            disabled={expired}
            className="luxe-btn-gold"
            style={{
              width: "100%",
              padding: "16px 24px",
              cursor: expired ? "not-allowed" : "pointer",
              opacity: expired ? 0.45 : 1,
            }}
          >
            Continue to payment
          </button>
        </div>
      </div>

      {/* Rate expired modal */}
      {expired && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rate-expired-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#16140f",
              border: `1px solid ${SURFACE_BORDER}`,
              borderRadius: 16,
              padding: "32px 28px",
              maxWidth: 380,
              width: "100%",
              textAlign: "center",
            }}
          >
            <h2
              id="rate-expired-title"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-heading-2)",
                fontWeight: 500,
                color: TEXT_PRIMARY,
                margin: "0 0 8px",
                letterSpacing: "-0.01em",
              }}
            >
              Your rate has been released.
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body-sm)",
                color: TEXT_MUTED,
                margin: "0 0 24px",
                lineHeight: 1.6,
              }}
            >
              The 5-minute hold has expired. Search again to see live availability.
            </p>
            <button
              onClick={handleSearchAgain}
              className="luxe-btn-gold"
              style={{ width: "100%", padding: "14px 24px" }}
            >
              Search Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
