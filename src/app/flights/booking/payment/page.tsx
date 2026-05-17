"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFlightBooking, PaymentMethodKind } from "@/context/FlightBookingContext";
import { createFlightUpiPayment, createFlightCardPayment } from "@/lib/api";

const GOLD = "#C9A84C";
const HOLD_SECONDS = 600; // 10-minute window for flight fare

function formatTimer(secs: number) {
  const safe = Math.max(0, secs);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtPrice(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function UpiIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="6" fill="#fff" stroke="#e0d8c8" />
      <path d="M14 7l-5 9h4l-3 9 9-12h-5z" fill="#FF6F00" />
      <path d="M21 7l-3 9h2.5L18 25l7-12h-3l1-6z" fill="#388E3C" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" stroke="#1a1710" strokeWidth="1.5" />
      <path d="M2.5 10h19" stroke="#1a1710" strokeWidth="1.5" />
      <path d="M6 15h4" stroke="#1a1710" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M3 10l9-5 9 5" stroke="#1a1710" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 10v8M9 10v8M15 10v8M19 10v8" stroke="#1a1710" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 19h18" stroke="#1a1710" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const PAYMENT_METHODS: { kind: PaymentMethodKind; name: string; sub: string; icon: React.ReactNode }[] = [
  { kind: "upi", name: "UPI", sub: "GPay, PhonePe, Paytm & more", icon: <UpiIcon /> },
  { kind: "credit-card", name: "Credit Card", sub: "Visa, Mastercard, Amex, RuPay", icon: <CardIcon /> },
  { kind: "debit-card", name: "Debit Card", sub: "Visa, Mastercard, RuPay & more", icon: <CardIcon /> },
  { kind: "net-banking", name: "Net Banking", sub: "40+ Banks supported", icon: <BankIcon /> },
];

export default function FlightPaymentPage() {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const flow = useFlightBooking();

  const [seconds, setSeconds] = useState(HOLD_SECONDS);
  const [expired, setExpired] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodKind | null>(null);
  const [mobileNumber, setMobileNumber] = useState(flow.contactPhone ?? "");
  const [upiId, setUpiId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const holdStartRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Guard — redirect if context is empty
  useEffect(() => {
    if (!flow.flightBookingId) {
      router.replace("/flights");
    }
    holdStartRef.current = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - holdStartRef.current) / 1000);
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  async function handlePay() {
    if (!selectedMethod || !flow.flightBookingId || expired || processing) return;
    if (!mobileNumber || mobileNumber.replace(/\D/g, "").length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError(null);
    setProcessing(true);
    flow.setPaymentMethod(selectedMethod);

    const mobile = mobileNumber.replace(/\D/g, "").slice(-10);
    const isUpi = selectedMethod === "upi";

    try {
      const token = await getIdToken();

      if (isUpi) {
        const channel = /Android|iPhone/i.test(typeof navigator !== "undefined" ? navigator.userAgent : "")
          ? "INTENT"
          : upiId ? "COLLECT" : "INTENT";
        const resp = await createFlightUpiPayment({
          flightBookingId: flow.flightBookingId!,
          amount: flow.totalFare,
          channel,
          customerVpa: channel === "COLLECT" ? upiId : undefined,
          customerMobile: mobile,
          customerName: flow.contactName,
          customerEmail: flow.contactEmail,
          token,
        });
        flow.setPaymentResult(
          resp.payment.merchant_txnid,
          resp.payment.id,
          resp.intent_url ?? null,
          null,
          resp.gateway_txnid ?? null,
        );
      } else {
        const returnUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/flights/booking/payment/processing`;
        const resp = await createFlightCardPayment({
          flightBookingId: flow.flightBookingId!,
          amount: flow.totalFare,
          payMode: selectedMethod === "net-banking" ? "NB" : "CARD",
          returnUrl,
          customerMobile: mobile,
          customerName: flow.contactName,
          customerEmail: flow.contactEmail,
          token,
        });
        flow.setPaymentResult(
          resp.payment.merchant_txnid,
          resp.payment.id,
          null,
          resp.payment_link ?? null,
          resp.gateway_txnid ?? null,
        );
        if (resp.payment_link) {
          window.location.href = resp.payment_link;
          return;
        }
      }

      router.push("/flights/booking/payment/processing");
    } catch (e: any) {
      setError(e?.message ?? "Payment initiation failed. Please try again.");
      setProcessing(false);
    }
  }

  const total = flow.totalFare;

  return (
    <div>
      {/* Timer */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "7px 16px", borderRadius: 999,
          background: "rgba(201,168,76,0.1)",
          border: `1px solid ${GOLD}`,
          fontFamily: "var(--font-body, sans-serif)",
          fontSize: 13, fontWeight: 600, color: GOLD,
        }}>
          ⏱ Fare held for {formatTimer(seconds)}
        </div>
      </div>

      {/* Flight summary */}
      <div style={{
        background: "#fdfaf5", borderRadius: 12, border: "1.5px solid #ece6dc",
        padding: "14px 16px", marginBottom: 16,
      }}>
        <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 14, fontWeight: 600, color: "#1a1710", marginBottom: 4 }}>
          {flow.originCity || flow.origin} → {flow.destinationCity || flow.destination}
        </div>
        <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 12, color: "#7a7465" }}>
          {flow.travelDate ? new Date(flow.travelDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
          {flow.passengers.length > 0 && ` · ${flow.passengers.length} ${flow.passengers.length === 1 ? "passenger" : "passengers"}`}
          {flow.fareIdentifier && ` · ${flow.fareIdentifier}`}
        </div>
      </div>

      {/* Amount */}
      <div style={{
        background: "#fdfaf5", borderRadius: 12, border: "1.5px solid #ece6dc",
        padding: "18px 20px", marginBottom: 16, textAlign: "center",
      }}>
        <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 11, color: "#7a7465", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
          Total Due
        </div>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 32, fontWeight: 700, color: "#1a1710", lineHeight: 1.1 }}>
          {fmtPrice(total)}
        </div>
        <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 12, color: "#10B981", fontWeight: 500, marginTop: 6 }}>
          Taxes &amp; fees included
        </div>
      </div>

      {/* Mobile number */}
      <div style={{
        background: "#fdfaf5", borderRadius: 12, border: "1.5px solid #ece6dc",
        padding: "16px 16px", marginBottom: 16,
      }}>
        <label style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 11, color: "#7a7465", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 8 }}>
          Mobile Number for Payment
        </label>
        <input
          type="tel"
          placeholder="10-digit mobile"
          value={mobileNumber}
          onChange={e => setMobileNumber(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1.5px solid #ece6dc",
            borderRadius: 8,
            fontFamily: "var(--font-body, sans-serif)",
            fontSize: 14,
            color: "#1a1710",
            background: "#fdfaf5",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Payment methods */}
      <div style={{ background: "#fdfaf5", borderRadius: 12, border: "1.5px solid #ece6dc", overflow: "hidden", marginBottom: 16 }}>
        {PAYMENT_METHODS.map((m, idx) => (
          <button
            key={m.kind}
            type="button"
            onClick={() => setSelectedMethod(m.kind)}
            disabled={expired || processing}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              width: "100%", padding: "15px 16px",
              background: selectedMethod === m.kind ? "rgba(201,168,76,0.08)" : "#fdfaf5",
              border: "none",
              borderTop: idx === 0 ? "none" : "1px solid #ece6dc",
              cursor: expired || processing ? "not-allowed" : "pointer",
              textAlign: "left",
              opacity: expired ? 0.5 : 1,
            }}
          >
            <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center" }}>{m.icon}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontFamily: "var(--font-body, sans-serif)", fontSize: 14, fontWeight: 600, color: "#1a1710" }}>{m.name}</span>
              <span style={{ display: "block", fontFamily: "var(--font-body, sans-serif)", fontSize: 12, color: "#7a7465", marginTop: 2 }}>{m.sub}</span>
            </span>
            <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selectedMethod === m.kind ? GOLD : "#c8c2b8"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {selectedMethod === m.kind && <span style={{ width: 9, height: 9, background: GOLD, borderRadius: "50%" }} />}
            </span>
          </button>
        ))}
      </div>

      {/* UPI ID field for COLLECT */}
      {selectedMethod === "upi" && (
        <div style={{
          background: "#fdfaf5", borderRadius: 12, border: "1.5px solid #ece6dc",
          padding: "14px 16px", marginBottom: 16,
        }}>
          <label style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 11, color: "#7a7465", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 8 }}>
            UPI ID (optional — leave blank for QR/intent)
          </label>
          <input
            type="text"
            placeholder="yourname@upi"
            value={upiId}
            onChange={e => setUpiId(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px",
              border: "1.5px solid #ece6dc", borderRadius: 8,
              fontFamily: "var(--font-body, sans-serif)", fontSize: 14, color: "#1a1710",
              background: "#fdfaf5", outline: "none", boxSizing: "border-box" as const,
            }}
          />
        </div>
      )}

      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8,
          padding: "12px 14px", marginBottom: 16,
          fontFamily: "var(--font-body, sans-serif)", fontSize: 13, color: "#b91c1c",
        }}>
          {error}
        </div>
      )}

      {/* Trust badges */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
        marginBottom: 24, fontFamily: "var(--font-body, sans-serif)",
        fontSize: 11, color: "#a09585",
      }}>
        <span>🔒 SSL Encrypted</span>
        <span style={{ color: "#ece6dc" }}>·</span>
        <span>🛡 100% Safe Transactions</span>
      </div>

      <div style={{ height: 90 }} />

      {/* Sticky CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(253,250,245,0.97)",
        backdropFilter: "blur(14px)",
        borderTop: "1px solid #ece6dc",
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 12, color: "#7a7465", textAlign: "center", marginBottom: 8 }}>
            Total Due · <span style={{ fontWeight: 700, color: "#1a1710" }}>{fmtPrice(total)}</span>
          </div>
          <button
            onClick={handlePay}
            disabled={!selectedMethod || expired || processing}
            style={{
              width: "100%", padding: "15px 24px",
              background: (!selectedMethod || expired || processing) ? "#e0d8c8" : GOLD,
              border: "none", borderRadius: 10,
              fontFamily: "var(--font-body, sans-serif)", fontSize: 14, fontWeight: 700,
              color: (!selectedMethod || expired || processing) ? "#aaa" : "#0B1B2B",
              cursor: (!selectedMethod || expired || processing) ? "not-allowed" : "pointer",
              letterSpacing: "0.04em",
            }}
          >
            {processing ? "Processing…" : `Pay ${fmtPrice(total)} Securely →`}
          </button>
        </div>
      </div>

      {/* Expired modal */}
      {expired && (
        <div role="dialog" aria-modal style={{
          position: "fixed", inset: 0,
          background: "rgba(26,23,16,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, padding: 16,
        }}>
          <div style={{
            background: "#fdfaf5", borderRadius: 16, padding: "28px 24px",
            maxWidth: 360, width: "100%", textAlign: "center",
          }}>
            <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: 20, fontWeight: 600, color: "#1a1710", margin: "0 0 8px" }}>
              Fare has expired.
            </h2>
            <p style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 13, color: "#7a7465", margin: "0 0 20px", lineHeight: 1.6 }}>
              The fare hold has expired. Search again to see live prices.
            </p>
            <button
              onClick={() => router.push("/flights")}
              style={{
                width: "100%", padding: "13px 24px",
                background: GOLD, border: "none", borderRadius: 10,
                fontFamily: "var(--font-body, sans-serif)", fontSize: 14, fontWeight: 700,
                color: "#0B1B2B", cursor: "pointer",
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
