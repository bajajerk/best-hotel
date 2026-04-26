"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const STEPS = [
  { key: "review", label: "Review", path: "/book/review" },
  { key: "guest-details", label: "Guest Details", path: "/book/guest-details" },
  { key: "payment", label: "Payment", path: "/book/payment" },
  { key: "confirmation", label: "Confirmation", path: "/book/confirmation" },
];

function StepIndicator() {
  const pathname = usePathname();
  // Find the longest-matching step key to avoid prefix collisions
  // (e.g. "rooms" sitting inside "/book/rooms" but also matching elsewhere).
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
      padding: "24px 16px 0",
      maxWidth: 720,
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
                background: isActive || isDone ? "var(--gold)" : "var(--cream-deep)",
                color: isActive ? "var(--ink)" : isDone ? "var(--white)" : "var(--ink-light)",
                border: isActive ? "2px solid var(--gold)" : "none",
                boxShadow: isActive ? "0 0 0 4px rgba(201,168,76,0.18)" : "none",
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
                fontWeight: isActive ? 600 : 400,
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

function BookHeader() {
  const pathname = usePathname();

  let centerTitle: string | null = null;
  if (pathname.includes("review")) centerTitle = "Review your booking";
  else if (pathname.includes("guest-details")) centerTitle = "Who's checking in?";
  else if (pathname.includes("payment")) centerTitle = "Payment";

  if (centerTitle) {
    return (
      <header style={{
        background: "var(--ink)",
        borderBottom: "1px solid var(--ink)",
        padding: "16px 24px",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
      }}>
        <Link href="/" style={{
          fontFamily: "var(--serif)",
          fontSize: 22,
          fontWeight: 600,
          color: "var(--white)",
          textDecoration: "none",
          letterSpacing: "-0.02em",
          justifySelf: "start",
        }}>
          Voyagr
        </Link>
        <h1 style={{
          fontFamily: "var(--serif)",
          fontSize: 22,
          fontWeight: 500,
          color: "var(--white)",
          margin: 0,
          textAlign: "center",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}>
          {centerTitle}
        </h1>
        <Link href="/" style={{
          fontFamily: "var(--sans)",
          fontSize: "var(--text-body-sm)",
          color: "var(--white)",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 4,
          justifySelf: "end",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          Cancel
        </Link>
      </header>
    );
  }

  return (
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
  );
}

export default function BookLayout({ children }: { children: ReactNode }) {
  return (
    <div className="luxe" style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <BookHeader />

      <StepIndicator />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 140px" }}>
        {children}
      </main>
    </div>
  );
}
