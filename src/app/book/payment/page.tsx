"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useBookingFlow } from "@/context/BookingFlowContext";
import { useAuth } from "@/context/AuthContext";
import { createBooking } from "@/lib/api";

const GOLD = "#c8aa76";
const SURFACE = "rgba(255,255,255,0.04)";
const SURFACE_BORDER = "rgba(255,255,255,0.08)";
const TEXT_PRIMARY = "#f7f5f2";
const TEXT_MUTED = "rgba(247, 245, 242, 0.65)";
const TEXT_SOFT = "rgba(247, 245, 242, 0.45)";
const ERROR = "#e08585";
const SUCCESS = "#86c79b";

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
    if (!flow.hotelMasterId || !flow.optionId) {
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
    if (!flow.hotelMasterId) {
      setErrorMsg("Missing hotel context. Please go back and re-select.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const idToken = await getIdToken().catch(() => null);
      const result = await createBooking(
        {
          hotel_master_id: flow.hotelMasterId,
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

      // Build WhatsApp message with full booking context — opens immediately
      // so the concierge can act without the user clicking another button.
      const ref = `VG-${String(result.id).padStart(5, "0")}`;
      const whatsappNumber =
        process.env.NEXT_PUBLIC_CONCIERGE_WHATSAPP || "919833534627";
      const checkinPretty = formatShortDate(flow.checkIn);
      const checkoutPretty = formatShortDate(flow.checkOut);
      const nights = (() => {
        try {
          const d1 = new Date(flow.checkIn + "T00:00:00").getTime();
          const d2 = new Date(flow.checkOut + "T00:00:00").getTime();
          return Math.max(1, Math.round((d2 - d1) / 86400000));
        } catch {
          return 1;
        }
      })();
      const guests = `${flow.adults || 2} adult${(flow.adults || 2) > 1 ? "s" : ""}${(flow.children || 0) > 0 ? ` + ${flow.children} child${flow.children === 1 ? "" : "ren"}` : ""}`;
      const cancelLine = flow.refundable && flow.freeCancelUntil
        ? ` (free cancellation until ${formatShortDate(flow.freeCancelUntil.slice(0, 10))})`
        : "";
      const message = [
        "Hi Voyagr Concierge!",
        "",
        `Booking request: ${ref}`,
        "",
        `🏨 ${flow.hotelName || "Hotel"}${flow.hotelCity ? `, ${flow.hotelCity}` : ""}`,
        `🛏️ ${flow.roomName || "Room"}${flow.mealBasis ? ` (${flow.mealBasis})` : ""}`,
        `📅 ${checkinPretty} → ${checkoutPretty} (${nights} night${nights > 1 ? "s" : ""})`,
        `👥 ${guests}`,
        `💰 ${formatInr(flow.totalPrice)}${cancelLine}`,
        flow.specialRequests ? `\n📝 ${flow.specialRequests}` : "",
        "",
        "Please confirm and send payment details. Thanks!",
      ]
        .filter(Boolean)
        .join("\n");
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

      // Open WhatsApp in a new tab; navigate to confirmation in the current tab.
      // Some browsers block window.open from non-user-gesture handlers; this is
      // inside the click handler, so we're fine.
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
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

      {/* Compact hotel summary */}
      <div
        style={{
          ...cardStyle,
          padding: "14px 16px",
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
            background: "rgba(255,255,255,0.06)",
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
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-heading-3)",
              fontWeight: 500,
              color: TEXT_PRIMARY,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {flow.hotelName}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body-sm)",
              color: TEXT_MUTED,
              marginTop: 4,
            }}
          >
            {city}
            {country ? ` · ${country}` : ""} · {datesLabel}
          </div>
        </div>
      </div>

      {/* Total Due */}
      <div style={{ ...cardStyle, textAlign: "center", padding: "24px 22px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10,
            fontWeight: 700,
            color: GOLD,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Total
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-display-3)",
            fontWeight: 500,
            color: TEXT_PRIMARY,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          {formatInr(grandTotalInr)}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body-sm)",
            color: SUCCESS,
            fontWeight: 500,
            marginTop: 10,
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
            background: "rgba(224,133,133,0.08)",
            border: `1px solid ${ERROR}`,
            color: ERROR,
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 16,
            fontFamily: "var(--font-body)",
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
          ...cardStyle,
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
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-heading-3)",
                fontWeight: 500,
                color: TEXT_PRIMARY,
                letterSpacing: "-0.01em",
              }}
            >
              Pay now via card / UPI
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body-sm)",
                color: TEXT_MUTED,
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
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: TEXT_SOFT,
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
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
            cursor: "not-allowed",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              padding: "8px 14px",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body-sm)",
              fontWeight: 500,
              color: TEXT_MUTED,
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
          background: "rgba(200,170,118,0.06)",
          borderRadius: 16,
          border: `1px solid ${GOLD}`,
          padding: "20px 22px",
          marginBottom: 12,
          cursor: expired || submitting ? "not-allowed" : "pointer",
          opacity: expired ? 0.5 : 1,
          fontFamily: "var(--font-body)",
          boxShadow: "0 8px 32px rgba(200,170,118,0.10)",
          color: TEXT_PRIMARY,
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
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-heading-3)",
                fontWeight: 500,
                color: TEXT_PRIMARY,
                letterSpacing: "-0.01em",
              }}
            >
              Confirm with concierge
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body-sm)",
                color: TEXT_MUTED,
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
              fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0a0a0a",
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
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          color: TEXT_SOFT,
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
          background: "rgba(12, 11, 10, 0.92)",
          backdropFilter: "blur(18px) saturate(120%)",
          WebkitBackdropFilter: "blur(18px) saturate(120%)",
          borderTop: `1px solid ${SURFACE_BORDER}`,
          padding: "12px 16px",
          zIndex: 110,
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body-sm)",
              color: TEXT_MUTED,
              fontWeight: 500,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Total ·{" "}
            <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>
              {formatInr(grandTotalInr)}
            </span>
          </div>
          <button
            onClick={handleConfirmConcierge}
            disabled={expired || submitting}
            className="luxe-btn-gold"
            style={{
              width: "100%",
              padding: "16px 24px",
              cursor: expired || submitting ? "not-allowed" : "pointer",
              opacity: expired ? 0.45 : 1,
            }}
          >
            {submitting ? "Submitting…" : "Confirm with concierge"}
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
