"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useBookingFlow, PaymentMethodKind } from "@/context/BookingFlowContext";

const GOLD = "#C9A84C";
const HOLD_SECONDS = 300;
const USD_TO_INR = 83;

const toInr = (usd: number) => Math.round(usd * USD_TO_INR);
const formatInrAmount = (inr: number) =>
  `\u20B9${Math.round(inr).toLocaleString("en-IN")}`;

function formatTimer(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatShortDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

interface PaymentMethodOption {
  kind: PaymentMethodKind;
  name: string;
  subLabel: string;
  icon: React.ReactNode;
}

function UpiIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="6" fill="#fff" stroke="#e0d8c8" />
      <path d="M14 7l-5 9h4l-3 9 9-12h-5z" fill="#FF6F00" />
      <path d="M21 7l-3 9h2.5L18 25l7-12h-3l1-6z" fill="#388E3C" />
    </svg>
  );
}

function CardIcon({ stroke = "#1a1710" }: { stroke?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" stroke={stroke} strokeWidth="1.5" />
      <path d="M2.5 10h19" stroke={stroke} strokeWidth="1.5" />
      <path d="M6 15h4" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EmiIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" stroke="#1a1710" strokeWidth="1.5" />
      <path d="M6 12h12" stroke="#1a1710" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 15.5h6" stroke="#1a1710" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M3 10l9-5 9 5" stroke="#1a1710" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 10v8M9 10v8M15 10v8M19 10v8" stroke="#1a1710" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 19h18" stroke="#1a1710" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    kind: "upi",
    name: "UPI",
    subLabel: "GPay, PhonePe, Paytm & more",
    icon: <UpiIcon />,
  },
  {
    kind: "credit-card",
    name: "Credit Card",
    subLabel: "Visa, Mastercard, Amex, RuPay",
    icon: <CardIcon />,
  },
  {
    kind: "debit-card",
    name: "Debit Card",
    subLabel: "Visa, Mastercard, RuPay & more",
    icon: <CardIcon />,
  },
  {
    kind: "emi",
    name: "EMI",
    subLabel: "Credit/Debit Card & Cardless EMI available",
    icon: <EmiIcon />,
  },
  {
    kind: "net-banking",
    name: "Net Banking",
    subLabel: "40+ Banks Available",
    icon: <BankIcon />,
  },
];

export default function PaymentPage() {
  const router = useRouter();
  const flow = useBookingFlow();

  const [seconds, setSeconds] = useState(HOLD_SECONDS);
  const [expired, setExpired] = useState(false);
  const [processing, setProcessing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (flow.selectedRooms.length === 0) {
      router.replace("/book/rooms");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Total — taxes & fees included per booking flow
  const grandTotalInr = toInr(flow.totalPrice);

  const handleSelect = async (method: PaymentMethodKind) => {
    if (expired || processing) return;
    flow.setPaymentMethod(method);
    setProcessing(true);
    // Simulate handing off to the payment provider
    await new Promise((r) => setTimeout(r, 1200));
    flow.confirmBooking();
    router.push("/book/confirmation");
  };

  const handlePay = () => {
    const method = flow.paymentMethod ?? "upi";
    handleSelect(method);
  };

  const handleSearchAgain = () => router.push("/search");

  const [city, country] = (flow.hotelCity || "").split(",").map((s) => s.trim());
  const datesLabel = `${formatShortDate(flow.checkIn)} – ${formatShortDate(flow.checkOut)}`;
  const roomsLabel = `${flow.totalRoomCount} Room${flow.totalRoomCount !== 1 ? "s" : ""}`;

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
          {flow.hotelImage && (
            <Image
              src={flow.hotelImage}
              alt={flow.hotelName}
              fill
              style={{ objectFit: "cover" }}
              sizes="56px"
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
            {country ? ` · ${country}` : ""} · {datesLabel} · {roomsLabel}
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
          Total Due
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
          {formatInrAmount(grandTotalInr)}
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

      {/* Payment methods list */}
      <div
        style={{
          background: "var(--white)",
          borderRadius: 16,
          border: "1px solid var(--cream-border)",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {PAYMENT_METHODS.map((method, idx) => (
          <button
            key={method.kind}
            type="button"
            onClick={() => handleSelect(method.kind)}
            disabled={expired || processing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: "100%",
              padding: "16px 18px",
              background: flow.paymentMethod === method.kind ? "rgba(201,168,76,0.08)" : "var(--white)",
              border: "none",
              borderTop: idx === 0 ? "none" : "1px solid var(--cream-border)",
              cursor: expired || processing ? "not-allowed" : "pointer",
              textAlign: "left",
              fontFamily: "var(--sans)",
              opacity: expired ? 0.5 : 1,
            }}
          >
            <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center" }}>
              {method.icon}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--sans)",
                  fontSize: "var(--text-body)",
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                {method.name}
              </span>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--sans)",
                  fontSize: "var(--text-body-sm)",
                  color: "var(--ink-light)",
                  marginTop: 2,
                }}
              >
                {method.subLabel}
              </span>
            </span>
            <span
              aria-hidden
              style={{
                color: "var(--ink-light)",
                fontSize: 22,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ›
            </span>
          </button>
        ))}
      </div>

      {/* Trust badges */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          marginBottom: 24,
          fontFamily: "var(--sans)",
          fontSize: "var(--text-caption)",
          color: "var(--ink-light)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span aria-hidden>🔒</span> SSL Encrypted
        </span>
        <span aria-hidden style={{ color: "var(--cream-border)" }}>·</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span aria-hidden>🛡</span> 100% Safe Transactions
        </span>
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
            Total Due · <span style={{ color: "var(--ink)", fontWeight: 700 }}>{formatInrAmount(grandTotalInr)}</span>
          </div>
          <button
            onClick={handlePay}
            disabled={expired || processing}
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
              cursor: expired || processing ? "not-allowed" : "pointer",
              opacity: expired ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {processing ? "Processing…" : `Pay ${formatInrAmount(grandTotalInr)} Securely →`}
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
