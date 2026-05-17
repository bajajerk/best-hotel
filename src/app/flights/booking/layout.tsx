"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FlightBookingProvider } from "@/context/FlightBookingContext";

const STEPS = [
  { key: "fare-select",  label: "Select Fare",  path: "/flights/booking/fare-select" },
  { key: "passengers",   label: "Passengers",    path: "/flights/booking/passengers" },
  { key: "payment",      label: "Payment",       path: "/flights/booking/payment" },
  { key: "confirmation", label: "Confirmation",  path: "/flights/booking/confirmation" },
];

function StepIndicator() {
  const pathname = usePathname();
  const currentIdx = STEPS.reduce((best, s, i) => {
    if (pathname.includes(s.key) && (best === -1 || s.key.length > STEPS[best].key.length)) {
      return i;
    }
    return best;
  }, -1);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 0,
      padding: "20px 16px 0",
      maxWidth: 640,
      margin: "0 auto",
    }}>
      {STEPS.map((step, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 54 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--font-body)",
                background: isActive || isDone ? "#C9A84C" : "#ece6dc",
                color: isActive || isDone ? "#0B1B2B" : "#a09585",
                boxShadow: isActive ? "0 0 0 4px rgba(201,168,76,0.18)" : "none",
                transition: "all 0.25s ease",
              }}>
                {isDone ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 10,
                fontFamily: "var(--font-body)",
                color: isActive ? "#1a1710" : "#a09585",
                fontWeight: isActive ? 700 : 400,
                marginTop: 5,
                whiteSpace: "nowrap",
                textAlign: "center",
              }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                background: isDone ? "#C9A84C" : "#ece6dc",
                marginBottom: 20,
                marginLeft: 3,
                marginRight: 3,
                transition: "background 0.25s ease",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FlightBookHeader() {
  const pathname = usePathname();

  let centerTitle = "Book your flight";
  if (pathname.includes("fare-select")) centerTitle = "Choose a fare";
  else if (pathname.includes("passengers")) centerTitle = "Passenger details";
  else if (pathname.includes("payment")) centerTitle = "Payment";
  else if (pathname.includes("confirmation")) centerTitle = "Booking confirmed";

  const isConfirmation = pathname.includes("confirmation");

  return (
    <header style={{
      background: "#0B1B2B",
      borderBottom: "1px solid rgba(201,168,76,0.1)",
      padding: "14px 20px",
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <Link href="/" style={{
        fontFamily: "var(--font-display, serif)",
        fontSize: 20,
        fontWeight: 700,
        color: "#fdfaf5",
        textDecoration: "none",
        letterSpacing: "-0.02em",
        justifySelf: "start",
      }}>
        Voyagr
      </Link>
      <h1 style={{
        fontFamily: "var(--font-display, serif)",
        fontSize: 17,
        fontWeight: 500,
        color: "#fdfaf5",
        margin: 0,
        textAlign: "center",
        letterSpacing: "-0.01em",
      }}>
        {centerTitle}
      </h1>
      {!isConfirmation ? (
        <Link href="/flights" style={{
          fontFamily: "var(--font-body, sans-serif)",
          fontSize: 13,
          color: "rgba(253,250,245,0.6)",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 4,
          justifySelf: "end",
        }}>
          ✕ Cancel
        </Link>
      ) : (
        <div />
      )}
    </header>
  );
}

export default function FlightBookingLayout({ children }: { children: ReactNode }) {
  return (
    <FlightBookingProvider>
      <div style={{ minHeight: "100vh", background: "#f5f0e8" }}>
        <FlightBookHeader />
        <StepIndicator />
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 140px" }}>
          {children}
        </main>
      </div>
    </FlightBookingProvider>
  );
}
