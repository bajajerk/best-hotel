"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useBookingFlow } from "@/context/BookingFlowContext";
import { useAuth } from "@/context/AuthContext";
import { createBooking } from "@/lib/api";

const GOLD = "#C9A84C";
const HOLD_SECONDS = 300;

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const formatInr = (n: number) => inrFormatter.format(Math.round(n || 0));

function formatTimer(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatShortDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function PaymentPage() {
  const router = useRouter();
  const flow = useBookingFlow();
  const { getIdToken } = useAuth();

  const [seconds, setSeconds] = useState(HOLD_SECONDS);
  const [expired, setExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!flow.hotelId || !flow.optionId) {
      router.replace("/");
    }
    // eslint-disable-next-line core/exhaustive-deps,react-hooks/exhaustive-deps
  }, []);

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

  const grandTotalInr = flow.totalPrice;

  const handleConfirmConcierge = async () => {
    if (expired || submitting) return;
    if (!flow.hotelId) {
      setErrorMsg("Missing hotel context. Please go back and re-select.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const idToken = await getIdToken().catch(() => null);
      const result = await createBooking(
        {
          hotel_id: flow.hotelId,
          provider: "tripjack",
          checkin: flow.checkIn,
          checkout: flow.checkOut,
          currency: flow.currency || "INR",
          booked_rate: Math.round(flow.totalPrice),
          best_market_rate: flow.bestMarketRate ?? undefined,
          adults: flow.adults || 2,
          children: flow.children || 0,
          status: "pending",
          guest_name: flow.guestName || undefined,
          guest_email: flow.guestEmail || undefined,
          special_requests: flow.specialRequests || undefined,
        },
        idToken
      );
      flow.setBookingId(result.id);
      router.push("/book/confirmation");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchAgain = () => router.push("/search");

  const [city, country] = (flow.hotelCity || "").split(",").map((s) => s.trim());
  const datesLabel = `${formatShortDate(flow.checkIn)} – ${formatShortDate(flow.checkOut)}`;

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

      {/* Compact hotel summary */}
      <div
        style={{
          background: "var(--white)",
          borderRadius: 16,
          border: "1px solid var(--cream-border)",
          padding: "14px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 56,
            height: 56,
            borderRadius: 12,
            overflow: "hidden",
            flexShrink: 0,
            background: "var(--cream-deep)",
          }}
        >
          {flow.hotelPhoto && (
            <Image
              src={flow.hotelPhoto}
              alt={flow.hotelName}
              fill
              style={{ objectFit: "cover" }}
              sizes="56px"
              unoptimized
            />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: "var(--text-heading-3)",
              fontWeight: 600,
              color: "var(--ink)",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {flow.hotelName}
          </div>
          <div
            style={{
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body-sm)",
              color: "var(--ink-light)",
              marginTop: 4,
            }}
          >
            {city}
            {country ? ` · ${country}` : ""} · {datesLabel}
          </div>
        </div>
      </div>

      {/* Total Due */}
      <div
        style={{
          background: "var(--white)",
          borderRadius: 16,
          border: "1px solid var(--cream-border)",
          padding: "20px 20px",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body-sm)",
            color: "var(--ink-light)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Total
        </div>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: "var(--text-display-3)",
            fontWeight: 600,
            color: "var(--ink)",
            lineHeight: 1.1,
          }}
        >
          {formatInr(grandTotalInr)}
        </div>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body-sm)",
            color: "var(--success)",
            fontWeight: 500,
            marginTop: 8,
          }}
        >
          Taxes &amp; fees included
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div
          role="alert"
          style={{
            background: "rgba(192,53,53,0.08)",
            border: "1px solid var(--error)",
            color: "var(--error)",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 16,
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body-sm)",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Option 1 — Pay now (disabled) */}
      <div
        style={{
          position: "relative",
          background: "var(--white)",
          borderRadius: 16,
          border: "1px solid var(--cream-border)",
          padding: "18px 20px",
          marginBottom: 16,
          opacity: 0.85,
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
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: "var(--text-heading-3)",
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              Pay now via card / UPI
            </div>
            <div
              style={{
                fontFamily: "var(--sans)",
                fontSize: "var(--text-body-sm)",
                color: "var(--ink-light)",
                marginTop: 4,
              }}
            >
              Visa, Mastercard, RuPay, GPay, PhonePe, Paytm
            </div>
          </div>
          <span
            aria-hidden
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: "var(--cream-deep)",
              fontFamily: "var(--sans)",
              fontSize: "var(--text-caption)",
              fontWeight: 600,
              color: "var(--ink-light)",
            }}
          >
            Soon
          </span>
        </div>

        {/* Disabled overlay */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            background: "rgba(245,241,232,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
            cursor: "not-allowed",
          }}
        >
          <div
            style={{
              background: "var(--white)",
              borderRadius: 999,
              border: "1px solid var(--cream-border)",
              padding: "8px 14px",
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body-sm)",
              fontWeight: 600,
              color: "var(--ink-mid)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              textAlign: "center",
            }}
          >
            Coming soon — secure gateway integration in progress
          </div>
        </div>
      </div>

      {/* Option 2 — Concierge (primary) */}
      <button
        type="button"
        onClick={handleConfirmConcierge}
        disabled={expired || submitting}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          background: "var(--white)",
          borderRadius: 16,
          border: `2px solid ${GOLD}`,
          padding: "18px 20px",
          marginBottom: 12,
          cursor: expired || submitting ? "not-allowed" : "pointer",
          opacity: expired ? 0.5 : 1,
          fontFamily: "var(--sans)",
          boxShadow: "0 2px 12px rgba(201,168,76,0.10)",
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
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: "var(--text-heading-3)",
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              Confirm with concierge
            </div>
            <div
              style={{
                fontFamily: "var(--sans)",
                fontSize: "var(--text-body-sm)",
                color: "var(--ink-light)",
                marginTop: 4,
              }}
            >
              No payment now — we&rsquo;ll WhatsApp you to confirm
            </div>
          </div>
          <span
            aria-hidden
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              background: GOLD,
              fontFamily: "var(--sans)",
              fontSize: "var(--text-caption)",
              fontWeight: 700,
              color: "var(--ink)",
              whiteSpace: "nowrap",
            }}
          >
            {submitting ? "Submitting…" : "Recommended"}
          </span>
        </div>
      </button>

      {/* Trust line */}
      <div
        style={{
          textAlign: "center",
          fontFamily: "var(--sans)",
          fontSize: "var(--text-body-sm)",
          color: "var(--ink-light)",
          margin: "12px 0 24px",
          lineHeight: 1.6,
        }}
      >
        Voyagr concierge will WhatsApp you within 15 minutes to confirm rate and collect payment securely. No charges until you confirm.
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
          padding: "12px 16px",
          zIndex: 110,
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body-sm)",
              color: "var(--ink-mid)",
              fontWeight: 500,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Total ·{" "}
            <span style={{ color: "var(--ink)", fontWeight: 700 }}>
              {formatInr(grandTotalInr)}
            </span>
          </div>
          <button
            onClick={handleConfirmConcierge}
            disabled={expired || submitting}
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
              cursor: expired || submitting ? "not-allowed" : "pointer",
              opacity: expired ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {submitting ? "Submitting…" : "Confirm with concierge →"}
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
