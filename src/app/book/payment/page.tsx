"use client";

/* ──────────────────────────────────────────────────────────────────────────
   /book/payment — pay-now flow (MMADPay).

   Three paths, in order of prominence:
     1. UPI (primary)         — INTENT on mobile (deep-link), QR on desktop
     2. Card / Net Banking    — hosted page redirect
     3. Confirm with concierge (tertiary) — WhatsApp fallback, no payment

   Premium UX bias: one decision per surface, dark-luxe palette continues
   from /book/review and /book/guest-details. Trust strip beneath the fold
   names the gateway + cipher so the user can sanity-check the payment.
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useBookingFlow } from "@/context/BookingFlowContext";
import { useAuth } from "@/context/AuthContext";
import {
  createBooking,
  createUpiPayment,
  createCardPayment,
} from "@/lib/api";

const GOLD = "var(--luxe-champagne)";
const SURFACE = "rgba(255,255,255,0.04)";
const SURFACE_BORDER = "rgba(255,255,255,0.08)";
const TEXT_PRIMARY = "var(--luxe-soft-white)";
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

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

type Method = "upi" | "card" | "concierge";

export default function PaymentPage() {
  const router = useRouter();
  const flow = useBookingFlow();
  const { getIdToken } = useAuth();

  const [seconds, setSeconds] = useState(HOLD_SECONDS);
  const [expired, setExpired] = useState(false);
  const [submitting, setSubmitting] = useState<Method | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Bail back to home if the user navigated here without a context.
  useEffect(() => {
    if (!flow.hotelMasterId || !flow.optionId) {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rate-hold countdown
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

  /** Ensure a booking row exists in 'pending' state. Returns its id. */
  const ensureBookingId = async (): Promise<number> => {
    if (flow.bookingId) return flow.bookingId;
    const idToken = await getIdToken().catch(() => null);
    const result = await createBooking(
      {
        hotel_master_id: flow.hotelMasterId!,
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
    return result.id;
  };

  /** UPI Pay-Now → create payment → deep-link or redirect to processing. */
  const handlePayUpi = async () => {
    if (expired || submitting) return;
    setErrorMsg(null);
    setSubmitting("upi");
    try {
      const bookingId = await ensureBookingId();
      const idToken = await getIdToken().catch(() => null);
      const result = await createUpiPayment(
        {
          booking_id: bookingId,
          amount: Math.round(flow.totalPrice),
          channel: "INTENT",
          customer_name: flow.guestName || undefined,
          customer_mobile: flow.guestPhone || undefined,
          customer_email: flow.guestEmail || undefined,
        },
        idToken
      );
      flow.setPaymentAttempt({
        paymentTxnid: result.payment.merchant_txnid,
        paymentId: result.payment.id,
        paymentStatus: result.payment.status,
        paymentIntentUrl: result.intent_url,
      });

      // Mobile: deep-link to UPI app, then jump the user to the polling
      // screen so we're ready when they return. Desktop: send them to the
      // polling screen directly — that page renders the QR.
      const intent = result.intent_url;
      if (intent && isMobileViewport()) {
        window.location.href = intent;
        // Some Android browsers ignore the location.href if we navigate
        // immediately after, so push the polling page in 600ms.
        setTimeout(() => router.push("/book/payment/processing"), 600);
      } else {
        router.push("/book/payment/processing");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start UPI payment.";
      setErrorMsg(msg);
      setSubmitting(null);
    }
  };

  /** Card / NB Pay-Now → create order → redirect to MMADPay hosted page. */
  const handlePayCard = async (mode: "CARD" | "NB" = "CARD") => {
    if (expired || submitting) return;
    setErrorMsg(null);
    setSubmitting("card");
    try {
      const bookingId = await ensureBookingId();
      const idToken = await getIdToken().catch(() => null);
      const returnUrl = `${window.location.origin}/book/payment/processing`;
      const result = await createCardPayment(
        {
          booking_id: bookingId,
          amount: Math.round(flow.totalPrice),
          pay_mode: mode,
          return_url: returnUrl,
          customer_name: flow.guestName || undefined,
          customer_mobile: flow.guestPhone || undefined,
          customer_email: flow.guestEmail || undefined,
        },
        idToken
      );
      flow.setPaymentAttempt({
        paymentTxnid: result.payment.merchant_txnid,
        paymentId: result.payment.id,
        paymentStatus: result.payment.status,
      });
      if (result.payment_link) {
        window.location.href = result.payment_link;
      } else {
        throw new Error("Payment link missing in response");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start card payment.";
      setErrorMsg(msg);
      setSubmitting(null);
    }
  };

  /** Tertiary path — keeps the WhatsApp concierge flow as a fallback. */
  const handleConfirmConcierge = async () => {
    if (expired || submitting) return;
    setErrorMsg(null);
    setSubmitting("concierge");
    try {
      const bookingId = await ensureBookingId();

      const ref = `VG-${String(bookingId).padStart(5, "0")}`;
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

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      router.push("/book/confirmation");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMsg(msg);
      setSubmitting(null);
    }
  };

  const handleSearchAgain = () => router.push("/search");

  const [city, country] = (flow.hotelCity || "").split(",").map((s) => s.trim());
  const datesLabel = `${formatShortDate(flow.checkIn)} – ${formatShortDate(flow.checkOut)}`;

  const cardStyle = useMemo(
    () => ({
      background: SURFACE,
      borderRadius: 16,
      border: `1px solid ${SURFACE_BORDER}`,
      padding: "20px 22px",
      marginBottom: 16,
    }),
    []
  );

  return (
    <div>
      {/* Rate-hold timer — sticky, signals urgency without panic */}
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

      {/* Hotel summary — single line, photo + name + city + dates */}
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

      {/* Total Due — large, breath, taxes-included reassurance */}
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

      {/* ── Primary: Pay via UPI ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={handlePayUpi}
        disabled={expired || !!submitting}
        aria-label="Pay with UPI"
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          background: "linear-gradient(135deg, rgba(200,170,118,0.10), rgba(200,170,118,0.04))",
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
              Pay with UPI
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body-sm)",
                color: TEXT_MUTED,
                marginTop: 4,
              }}
            >
              GPay · PhonePe · Paytm · BHIM · any UPI app
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
            {submitting === "upi" ? "Opening…" : "Recommended"}
          </span>
        </div>
      </button>

      {/* ── Secondary: Card / Net Banking ─────────────────────────────── */}
      <button
        type="button"
        onClick={() => handlePayCard("CARD")}
        disabled={expired || !!submitting}
        aria-label="Pay with credit or debit card"
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          background: SURFACE,
          borderRadius: 16,
          border: `1px solid ${SURFACE_BORDER}`,
          padding: "20px 22px",
          marginBottom: 12,
          cursor: expired || submitting ? "not-allowed" : "pointer",
          opacity: expired ? 0.5 : 1,
          fontFamily: "var(--font-body)",
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
              Credit or debit card
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body-sm)",
                color: TEXT_MUTED,
                marginTop: 4,
              }}
            >
              Visa · Mastercard · RuPay · Amex
            </div>
          </div>
          <span
            aria-hidden
            style={{
              fontSize: 13,
              color: TEXT_SOFT,
              fontFamily: "var(--font-body)",
            }}
          >
            {submitting === "card" ? "Opening…" : "→"}
          </span>
        </div>
      </button>

      {/* Net Banking — same backend, separate visual to keep options clear */}
      <button
        type="button"
        onClick={() => handlePayCard("NB")}
        disabled={expired || !!submitting}
        aria-label="Pay with net banking"
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          background: SURFACE,
          borderRadius: 16,
          border: `1px solid ${SURFACE_BORDER}`,
          padding: "20px 22px",
          marginBottom: 20,
          cursor: expired || submitting ? "not-allowed" : "pointer",
          opacity: expired ? 0.5 : 1,
          fontFamily: "var(--font-body)",
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
              Net banking
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body-sm)",
                color: TEXT_MUTED,
                marginTop: 4,
              }}
            >
              All major Indian banks
            </div>
          </div>
          <span aria-hidden style={{ fontSize: 13, color: TEXT_SOFT }}>→</span>
        </div>
      </button>

      {/* Trust strip — gateway, encryption, PCI; below the fold on first paint */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          marginBottom: 22,
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-caption)",
          color: TEXT_SOFT,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
          </svg>
          256-bit TLS
        </span>
        <span>Payments by MMADPay</span>
        <span>RBI-licensed</span>
      </div>

      {/* Tertiary: Concierge fallback. Quiet link, not a CTA. */}
      <div
        style={{
          textAlign: "center",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          color: TEXT_SOFT,
          marginBottom: 28,
          lineHeight: 1.6,
        }}
      >
        Prefer to talk to a human?{" "}
        <button
          type="button"
          onClick={handleConfirmConcierge}
          disabled={expired || !!submitting}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: GOLD,
            fontFamily: "inherit",
            fontSize: "inherit",
            textDecoration: "underline",
            cursor: expired || submitting ? "not-allowed" : "pointer",
            textUnderlineOffset: 3,
          }}
        >
          {submitting === "concierge" ? "Opening WhatsApp…" : "Confirm with concierge instead"}
        </button>
      </div>

      {/* Sticky bottom bar shows the total and is the rate-expired safety net */}
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
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0))",
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
            onClick={handlePayUpi}
            disabled={expired || !!submitting}
            className="luxe-btn-gold"
            style={{
              width: "100%",
              padding: "16px 24px",
              cursor: expired || submitting ? "not-allowed" : "pointer",
              opacity: expired ? 0.45 : 1,
            }}
          >
            {submitting === "upi" ? "Opening UPI app…" : `Pay ${formatInr(grandTotalInr)} with UPI`}
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
