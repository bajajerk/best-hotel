"use client";

/* ──────────────────────────────────────────────────────────────────────────
   /book/payment/processing — confirming-payment screen.

   Reachable from two places:
     1. UPI flow — after the user's UPI app deep-links back into the browser
     2. Card / NB flow — set as `return_url` in the create-order call

   Three terminal states the screen resolves to:
     · SUCCESS  → /book/confirmation (booking already flipped to confirmed)
     · FAILED   → soft retry CTA, back to /book/payment
     · PENDING  → keep polling; offer "Reopen UPI app" + "Tried already? Check status"

   The polling is a soft-exponential interval: 2s → 3s → 4s up to 10s, capped
   at ~3 minutes. After that the user gets a "Still processing" surface with
   a manual retry button.
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingFlow } from "@/context/BookingFlowContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPaymentStatus, PaymentRow } from "@/lib/api";

const GOLD = "var(--luxe-champagne)";
const SURFACE = "rgba(255,255,255,0.04)";
const SURFACE_BORDER = "rgba(255,255,255,0.08)";
const TEXT_PRIMARY = "var(--luxe-soft-white)";
const TEXT_MUTED = "rgba(247, 245, 242, 0.65)";
const TEXT_SOFT = "rgba(247, 245, 242, 0.45)";
const ERROR = "#e08585";

const POLL_LADDER_MS = [2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000];
const POLL_DEADLINE_MS = 3 * 60 * 1000; // 3 minutes; webhook usually beats this

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const formatInr = (n: number) => inrFormatter.format(Math.round(n || 0));

type Screen = "polling" | "success" | "failed" | "stale";

export default function PaymentProcessingPage() {
  const router = useRouter();
  const flow = useBookingFlow();
  const { getIdToken } = useAuth();

  const [screen, setScreen] = useState<Screen>("polling");
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const cancelledRef = useRef<boolean>(false);

  // No active payment context? Send the user back to start.
  useEffect(() => {
    if (!flow.paymentTxnid) {
      router.replace("/book/payment");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll loop. Self-schedules with the next ladder step until terminal.
  useEffect(() => {
    if (!flow.paymentTxnid) return;
    cancelledRef.current = false;
    let attempt = 0;

    const tick = async () => {
      if (cancelledRef.current) return;
      try {
        const idToken = await getIdToken().catch(() => null);
        const result = await fetchPaymentStatus(flow.paymentTxnid!, idToken);
        if (cancelledRef.current) return;
        setPayment(result.payment);
        flow.setPaymentStatus(result.payment.status);

        if (result.payment.status === "SUCCESS") {
          setScreen("success");
          // Smooth hand-off to the confirmation screen so the user sees the
          // success tick instead of an abrupt swap.
          setTimeout(() => {
            if (!cancelledRef.current) router.replace("/book/confirmation");
          }, 1200);
          return;
        }
        if (
          result.payment.status === "FAILED" ||
          result.payment.status === "EXCEPTION"
        ) {
          setScreen("failed");
          return;
        }
      } catch (err) {
        // Soft-fail the poll — keep trying. Only surface the error if every
        // attempt has failed for >30s.
        const msg = err instanceof Error ? err.message : "Status check failed.";
        if (Date.now() - startedAtRef.current > 30_000) {
          setErrorMsg(msg);
        }
      }

      // Schedule next poll.
      const elapsed = Date.now() - startedAtRef.current;
      if (elapsed > POLL_DEADLINE_MS) {
        if (!cancelledRef.current) setScreen("stale");
        return;
      }
      const delay = POLL_LADDER_MS[Math.min(attempt, POLL_LADDER_MS.length - 1)];
      attempt += 1;
      setTimeout(tick, delay);
    };

    tick();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.paymentTxnid]);

  const handleReopenUpi = () => {
    if (flow.paymentIntentUrl) {
      window.location.href = flow.paymentIntentUrl;
    }
  };

  const handleRetry = () => {
    flow.resetPaymentAttempt();
    router.replace("/book/payment");
  };

  if (!flow.paymentTxnid) return null;

  const refLine = `${flow.hotelName}${flow.hotelCity ? ` · ${flow.hotelCity.split(",")[0].trim()}` : ""}`;

  if (screen === "success") {
    return <SuccessSurface refLine={refLine} amount={flow.totalPrice} />;
  }
  if (screen === "failed") {
    return (
      <FailureSurface
        refLine={refLine}
        amount={flow.totalPrice}
        message={
          payment?.status === "FAILED"
            ? "Your bank declined the payment, or you cancelled in your UPI app."
            : "We couldn't verify the payment with the gateway."
        }
        onRetry={handleRetry}
      />
    );
  }
  if (screen === "stale") {
    return (
      <StaleSurface
        refLine={refLine}
        amount={flow.totalPrice}
        onRetry={handleRetry}
      />
    );
  }

  // Default — polling state
  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 24, marginBottom: 28 }}>
        <Spinner />
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-display-3)",
          fontWeight: 500,
          color: TEXT_PRIMARY,
          textAlign: "center",
          margin: "0 0 8px",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        Confirming your payment
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          color: TEXT_MUTED,
          textAlign: "center",
          margin: "0 auto 24px",
          maxWidth: 420,
          lineHeight: 1.6,
        }}
      >
        Please don&rsquo;t close this tab. We&rsquo;ll auto-confirm as soon as
        your bank notifies us — usually within 30 seconds.
      </p>

      {/* Hotel + amount summary card */}
      <div
        style={{
          background: SURFACE,
          borderRadius: 16,
          border: `1px solid ${SURFACE_BORDER}`,
          padding: "20px 22px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10,
            fontWeight: 700,
            color: GOLD,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Awaiting Confirmation
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-display-3)",
            fontWeight: 500,
            color: TEXT_PRIMARY,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          {formatInr(flow.totalPrice)}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body-sm)",
            color: TEXT_MUTED,
            textAlign: "center",
          }}
        >
          {refLine}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10,
            color: TEXT_SOFT,
            letterSpacing: "0.18em",
            textAlign: "center",
            marginTop: 14,
            wordBreak: "break-all",
          }}
        >
          Ref · {flow.paymentTxnid}
        </div>
      </div>

      {/* Reopen UPI app — only shown when an INTENT URL is available */}
      {flow.paymentIntentUrl && (
        <button
          type="button"
          onClick={handleReopenUpi}
          className="luxe-btn-secondary"
          style={{
            width: "100%",
            padding: "14px 24px",
            marginBottom: 12,
          }}
        >
          Re-open UPI app
        </button>
      )}

      <button
        type="button"
        onClick={handleRetry}
        style={{
          display: "block",
          margin: "0 auto",
          background: "none",
          border: "none",
          padding: "8px 14px",
          color: TEXT_SOFT,
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          textDecoration: "underline",
          textUnderlineOffset: 3,
          cursor: "pointer",
        }}
      >
        Cancel and choose another payment method
      </button>

      {errorMsg && (
        <div
          role="alert"
          style={{
            marginTop: 20,
            background: "rgba(224,133,133,0.08)",
            border: `1px solid ${ERROR}`,
            color: ERROR,
            borderRadius: 12,
            padding: "12px 14px",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body-sm)",
          }}
        >
          {errorMsg}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        border: `3px solid rgba(200,170,118,0.18)`,
        borderTopColor: GOLD,
        animation: "voyagrSpin 1.1s linear infinite",
      }}
    >
      <style jsx>{`
        @keyframes voyagrSpin {
          to {
            transform: rotate(360deg);
          }
        }
        div {
          animation: voyagrSpin 1.1s linear infinite;
        }
      `}</style>
    </div>
  );
}

function SuccessSurface({ refLine, amount }: { refLine: string; amount: number }) {
  return (
    <div style={{ paddingTop: 32, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <svg width="84" height="84" viewBox="0 0 52 52" aria-hidden>
          <circle cx="26" cy="26" r="24" fill="none" stroke={GOLD} strokeWidth="2" />
          <path
            d="M15 27l7 7 15-15"
            fill="none"
            stroke={GOLD}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-display-3)",
          fontWeight: 500,
          color: TEXT_PRIMARY,
          margin: "0 0 8px",
          letterSpacing: "-0.02em",
        }}
      >
        Payment received
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          color: TEXT_MUTED,
          margin: "0 auto 4px",
          maxWidth: 360,
        }}
      >
        {formatInr(amount)} · {refLine}
      </p>
      <p style={{ fontSize: "var(--text-caption)", color: TEXT_SOFT }}>
        Loading your booking…
      </p>
    </div>
  );
}

function FailureSurface({
  refLine,
  amount,
  message,
  onRetry,
}: {
  refLine: string;
  amount: number;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div style={{ paddingTop: 32, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <svg width="80" height="80" viewBox="0 0 52 52" aria-hidden>
          <circle cx="26" cy="26" r="24" fill="none" stroke={ERROR} strokeWidth="2" />
          <path
            d="M18 18l16 16M34 18L18 34"
            stroke={ERROR}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-display-3)",
          fontWeight: 500,
          color: TEXT_PRIMARY,
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        Payment didn&rsquo;t go through
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          color: TEXT_MUTED,
          margin: "0 auto 8px",
          maxWidth: 420,
          lineHeight: 1.6,
        }}
      >
        {message} No money has left your account.
      </p>
      <p style={{ fontSize: "var(--text-caption)", color: TEXT_SOFT, marginBottom: 32 }}>
        {formatInr(amount)} · {refLine}
      </p>
      <button
        onClick={onRetry}
        className="luxe-btn-gold"
        style={{ minWidth: 240, padding: "14px 28px" }}
      >
        Try again
      </button>
    </div>
  );
}

function StaleSurface({
  refLine,
  amount,
  onRetry,
}: {
  refLine: string;
  amount: number;
  onRetry: () => void;
}) {
  return (
    <div style={{ paddingTop: 32, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <svg width="80" height="80" viewBox="0 0 52 52" aria-hidden>
          <circle cx="26" cy="26" r="24" fill="none" stroke={GOLD} strokeWidth="2" />
          <path
            d="M26 14v12l8 5"
            stroke={GOLD}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-display-3)",
          fontWeight: 500,
          color: TEXT_PRIMARY,
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        Still confirming
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          color: TEXT_MUTED,
          margin: "0 auto 8px",
          maxWidth: 440,
          lineHeight: 1.6,
        }}
      >
        Your bank is taking longer than usual. If you completed the payment,
        your booking will appear in <strong>My bookings</strong> as soon as it
        lands. We&rsquo;ll also email a confirmation.
      </p>
      <p style={{ fontSize: "var(--text-caption)", color: TEXT_SOFT, marginBottom: 32 }}>
        {formatInr(amount)} · {refLine}
      </p>
      <button
        onClick={onRetry}
        className="luxe-btn-secondary"
        style={{ minWidth: 240, padding: "14px 28px" }}
      >
        Back to payment options
      </button>
    </div>
  );
}
