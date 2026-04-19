"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingFlow, RoomGuest } from "@/context/BookingFlowContext";

const GOLD = "#C9A84C";
const HOLD_SECONDS = 300;

function formatTimer(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function blankGuest(): RoomGuest {
  return { firstName: "", lastName: "", specialRequests: "" };
}

export default function GuestDetailsPage() {
  const router = useRouter();
  const flow = useBookingFlow();

  const totalRooms = flow.totalRoomCount || 1;

  const [guests, setGuests] = useState<RoomGuest[]>(() => {
    const seed = flow.roomGuests.slice(0, totalRooms);
    while (seed.length < totalRooms) seed.push(blankGuest());
    return seed;
  });
  const [errors, setErrors] = useState<Record<number, { firstName?: string; lastName?: string }>>({});
  const [gstOpen, setGstOpen] = useState(!!flow.identity.gstin);
  const [gstin, setGstin] = useState(flow.identity.gstin);
  const [pan, setPan] = useState(flow.identity.pan);
  const [panError, setPanError] = useState<string | null>(null);

  const [seconds, setSeconds] = useState(HOLD_SECONDS);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Bounce back to room selection if state is missing.
  useEffect(() => {
    if (flow.selectedRooms.length === 0) {
      router.replace("/book/rooms");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize the per-room form list if the user changed room counts upstream.
  useEffect(() => {
    setGuests((prev) => {
      if (prev.length === totalRooms) return prev;
      const next = prev.slice(0, totalRooms);
      while (next.length < totalRooms) next.push(blankGuest());
      return next;
    });
  }, [totalRooms]);

  // Drive the same countdown the Review page started.
  useEffect(() => {
    if (!flow.holdStartedAt) {
      // Direct navigation — no hold yet — start one so the timer is meaningful.
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

  const updateGuest = (idx: number, field: keyof RoomGuest, value: string) => {
    setGuests((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    if (field === "firstName" || field === "lastName") {
      setErrors((prev) => {
        if (!prev[idx]?.[field]) return prev;
        const next = { ...prev };
        next[idx] = { ...next[idx], [field]: undefined };
        return next;
      });
    }
  };

  const isPanValid = (val: string) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val.trim().toUpperCase());

  const validate = () => {
    const errs: Record<number, { firstName?: string; lastName?: string }> = {};
    guests.forEach((g, i) => {
      const e: { firstName?: string; lastName?: string } = {};
      if (!g.firstName.trim()) e.firstName = "First name required";
      if (!g.lastName.trim()) e.lastName = "Last name required";
      if (e.firstName || e.lastName) errs[i] = e;
    });
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
    flow.setRoomGuests(guests);
    flow.setIdentity({ pan: pan.trim().toUpperCase(), gstin: gstin.trim().toUpperCase() });
    // Mirror primary guest into legacy guestInfo for downstream code.
    const primary = guests[0];
    if (primary) {
      flow.setGuestInfo({
        firstName: primary.firstName,
        lastName: primary.lastName,
        email: flow.guestInfo?.email ?? "",
        phone: flow.guestInfo?.phone ?? "",
        specialRequests: primary.specialRequests,
      });
    }
    router.push("/book/payment");
  };

  const handleSearchAgain = () => router.push("/search");

  const inputStyle = (hasError: boolean) => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid ${hasError ? "var(--error)" : "var(--cream-border)"}`,
    background: "var(--white)",
    fontFamily: "var(--sans)",
    fontSize: "var(--text-body)",
    color: "var(--ink)",
    outline: "none",
    boxSizing: "border-box" as const,
  });

  const labelStyle = {
    fontFamily: "var(--sans)",
    fontSize: "var(--text-body-sm)",
    fontWeight: 500 as const,
    color: "var(--ink-mid)",
    marginBottom: 6,
    display: "block" as const,
  };

  const errorTextStyle = {
    fontFamily: "var(--sans)",
    fontSize: "var(--text-caption)",
    color: "var(--error)",
    marginTop: 4,
    display: "block" as const,
  };

  const sectionTitle = useMemo(
    () => ({
      fontFamily: "var(--serif)",
      fontSize: "var(--text-heading-3)",
      fontWeight: 600,
      color: "var(--ink)",
      margin: 0,
    }),
    []
  );

  return (
    <div>
      {/* Carry-over urgency timer */}
      <div
        role="status"
        aria-live="polite"
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 999,
            background: "rgba(201,168,76,0.10)",
            border: `1px solid ${GOLD}`,
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body-sm)",
            fontWeight: 600,
            color: GOLD,
          }}
        >
          <span aria-hidden>⏱</span>
          <span>Rate held for {formatTimer(seconds)}</span>
        </div>
      </div>

      {/* Per-room guest forms */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {guests.map((g, i) => (
          <div
            key={i}
            style={{
              background: "var(--white)",
              borderRadius: 16,
              border: "1px solid var(--cream-border)",
              padding: "20px 20px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--sans)",
                fontSize: "var(--text-body)",
                fontWeight: 700,
                color: "var(--ink)",
                marginBottom: 14,
                letterSpacing: "0.02em",
              }}
            >
              Room {String(i + 1).padStart(2, "0")}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div>
                <label style={labelStyle}>First Name *</label>
                <input
                  type="text"
                  value={g.firstName}
                  onChange={(e) => updateGuest(i, "firstName", e.target.value)}
                  placeholder="John"
                  autoComplete="given-name"
                  style={inputStyle(!!errors[i]?.firstName)}
                />
                {errors[i]?.firstName && <span style={errorTextStyle}>{errors[i]!.firstName}</span>}
              </div>
              <div>
                <label style={labelStyle}>Last Name *</label>
                <input
                  type="text"
                  value={g.lastName}
                  onChange={(e) => updateGuest(i, "lastName", e.target.value)}
                  placeholder="Smith"
                  autoComplete="family-name"
                  style={inputStyle(!!errors[i]?.lastName)}
                />
                {errors[i]?.lastName && <span style={errorTextStyle}>{errors[i]!.lastName}</span>}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Special Requests (optional)</label>
              <textarea
                value={g.specialRequests}
                onChange={(e) => updateGuest(i, "specialRequests", e.target.value)}
                placeholder={"Room preferences, dietary needs, celebrations..."}
                rows={3}
                style={{
                  ...inputStyle(false),
                  resize: "vertical" as const,
                  fontFamily: "var(--sans)",
                  lineHeight: 1.5,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* GST Details — collapsed optional section */}
      <div
        style={{
          background: "var(--white)",
          borderRadius: 16,
          border: "1px solid var(--cream-border)",
          padding: "18px 20px",
          marginTop: 16,
        }}
      >
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
                fontFamily: "var(--sans)",
                fontSize: "var(--text-body-sm)",
                color: "var(--ink-light)",
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
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body-sm)",
              fontWeight: 600,
              color: GOLD,
              cursor: "pointer",
              whiteSpace: "nowrap",
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

      {/* Identity Verification (was PAN Details) */}
      <div
        style={{
          background: "var(--white)",
          borderRadius: 16,
          border: "1px solid var(--cream-border)",
          padding: "18px 20px",
          marginTop: 16,
        }}
      >
        <h3 style={sectionTitle}>Identity Verification</h3>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body-sm)",
            color: "var(--ink-light)",
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
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--white)",
          borderTop: "1px solid var(--cream-border)",
          padding: "14px 16px",
          zIndex: 110,
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <button
            onClick={handleContinue}
            disabled={expired}
            style={{
              width: "100%",
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body)",
              fontWeight: 600,
              padding: "16px 24px",
              borderRadius: 12,
              border: "none",
              background: GOLD,
              color: "var(--ink)",
              cursor: expired ? "not-allowed" : "pointer",
              opacity: expired ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            Continue to payment →
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
            background: "rgba(26,23,16,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--white)",
              borderRadius: 16,
              padding: "28px 24px",
              maxWidth: 360,
              width: "100%",
              textAlign: "center",
            }}
          >
            <h2
              id="rate-expired-title"
              style={{
                fontFamily: "var(--serif)",
                fontSize: "var(--text-heading-2)",
                fontWeight: 600,
                color: "var(--ink)",
                margin: "0 0 8px",
              }}
            >
              Your rate has been released.
            </h2>
            <p
              style={{
                fontFamily: "var(--sans)",
                fontSize: "var(--text-body-sm)",
                color: "var(--ink-light)",
                margin: "0 0 20px",
                lineHeight: 1.5,
              }}
            >
              The 5-minute hold has expired. Search again to see live availability.
            </p>
            <button
              onClick={handleSearchAgain}
              style={{
                width: "100%",
                fontFamily: "var(--sans)",
                fontSize: "var(--text-body)",
                fontWeight: 600,
                padding: "14px 24px",
                borderRadius: 12,
                border: "none",
                background: GOLD,
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              Search Again →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
