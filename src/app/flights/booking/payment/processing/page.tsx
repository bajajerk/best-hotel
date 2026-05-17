"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFlightBooking, type PaymentStatus } from "@/context/FlightBookingContext";
import { fetchPaymentStatus } from "@/lib/api";

const GOLD = "#C9A84C";
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 60; // 3 min

export default function FlightPaymentProcessingPage() {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const flow = useFlightBooking();

  const [dots, setDots] = useState(".");
  const [message, setMessage] = useState("Processing your payment…");
  const pollCount = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!flow.paymentTxnid) {
      router.replace("/flights/booking/payment");
      return;
    }

    const dotInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? "." : d + ".");
    }, 500);

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      clearInterval(dotInterval);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function poll() {
    if (pollCount.current >= MAX_POLLS) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setMessage("Payment is taking longer than expected. Please check your booking history.");
      return;
    }
    pollCount.current++;

    try {
      const token = await getIdToken();
      const result = await fetchPaymentStatus(flow.paymentTxnid!, token);
      const status = result.payment?.status as PaymentStatus | undefined;

      flow.setPaymentStatus(status ?? null);

      if (status === "SUCCESS") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        flow.setBookingStatus("CONFIRMED");
        router.push("/flights/booking/confirmation");
      } else if (status === "FAILED" || status === "EXCEPTION" || status === "CHARGEBACK") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setMessage(`Payment ${status.toLowerCase()}. Please try again.`);
        setTimeout(() => router.push("/flights/booking/payment"), 2500);
      }
    } catch {
      // Network error — keep polling
    }
  }

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      textAlign: "center",
    }}>
      {/* Spinner */}
      <div style={{ marginBottom: 28 }}>
        <svg
          width="56" height="56" viewBox="0 0 56 56"
          style={{ animation: "spin 1s linear infinite" }}
          aria-hidden
        >
          <circle cx="28" cy="28" r="24" fill="none" stroke="#ece6dc" strokeWidth="4" />
          <path
            d="M28 4 a24 24 0 0 1 24 24"
            fill="none" stroke={GOLD} strokeWidth="4" strokeLinecap="round"
          />
        </svg>
      </div>

      <h2 style={{
        fontFamily: "var(--font-display, serif)",
        fontSize: 22,
        fontWeight: 600,
        color: "#1a1710",
        margin: "0 0 10px",
      }}>
        {message}{dots}
      </h2>

      <p style={{
        fontFamily: "var(--font-body, sans-serif)",
        fontSize: 13,
        color: "#7a7465",
        margin: 0,
        lineHeight: 1.6,
        maxWidth: 300,
      }}>
        Do not close this tab. We are confirming your booking with the airline.
      </p>

      {flow.paymentIntentUrl && (
        <a
          href={flow.paymentIntentUrl}
          style={{
            display: "inline-block",
            marginTop: 24,
            padding: "12px 28px",
            background: GOLD,
            borderRadius: 10,
            fontFamily: "var(--font-body, sans-serif)",
            fontSize: 14,
            fontWeight: 700,
            color: "#0B1B2B",
            textDecoration: "none",
          }}
        >
          Open UPI App →
        </a>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
