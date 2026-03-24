"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const STEPS = [
  { key: "rooms", label: "Select Room", path: "/book/rooms" },
  { key: "guest-details", label: "Guest Details", path: "/book/guest-details" },
  { key: "payment", label: "Payment", path: "/book/payment" },
  { key: "confirmation", label: "Confirmation", path: "/book/confirmation" },
];

function StepIndicator() {
  const pathname = usePathname();
  const currentIdx = STEPS.findIndex((s) => pathname.includes(s.key));

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 0,
      padding: "24px 16px 0",
      maxWidth: 640,
      margin: "0 auto",
    }}>
      {STEPS.map((step, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 60 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--sans)",
                background: isDone ? "var(--gold)" : isActive ? "var(--ink)" : "var(--cream-deep)",
                color: isDone || isActive ? "var(--white)" : "var(--ink-light)",
                transition: "all 0.3s ease",
              }}>
                {isDone ? (
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
                ) : (
                  i + 1
                )}
              </div>
              <span style={{
                fontSize: "var(--text-caption)",
                fontFamily: "var(--sans)",
                color: isActive ? "var(--ink)" : "var(--ink-light)",
                fontWeight: isActive ? 500 : 400,
                marginTop: 6,
                whiteSpace: "nowrap",
              }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                background: isDone ? "var(--gold)" : "var(--cream-border)",
                marginBottom: 20,
                marginLeft: 4,
                marginRight: 4,
                transition: "background 0.3s ease",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BookLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      {/* Top bar */}
      <header style={{
        background: "var(--white)",
        borderBottom: "1px solid var(--cream-border)",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/" style={{
          fontFamily: "var(--serif)",
          fontSize: 22,
          fontWeight: 600,
          color: "var(--ink)",
          textDecoration: "none",
          letterSpacing: "-0.02em",
        }}>
          Voyagr
        </Link>
        <Link href="/" style={{
          fontFamily: "var(--sans)",
          fontSize: "var(--text-body-sm)",
          color: "var(--ink-light)",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          Cancel
        </Link>
      </header>

      <StepIndicator />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 100px" }}>
        {children}
      </main>
    </div>
  );
}
