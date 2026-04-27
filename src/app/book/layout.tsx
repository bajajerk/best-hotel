"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";

/* ──────────────────────────────────────────────────────────────────────────
   /book/* shared shell — the global <Header /> (same as homepage) sits at
   top, then a slim dark-luxe step indicator strip beneath it.
   No more "BookHeader" — the user wanted ONE header sitewide.
   ────────────────────────────────────────────────────────────────────────── */

const STEPS = [
  { key: "review", label: "Review", path: "/book/review" },
  { key: "guest-details", label: "Guest Details", path: "/book/guest-details" },
  { key: "payment", label: "Payment", path: "/book/payment" },
  { key: "confirmation", label: "Confirmation", path: "/book/confirmation" },
];

const CHAMPAGNE = "#c8aa76";
const SOFT_WHITE_45 = "rgba(247, 245, 242, 0.45)";
const SOFT_WHITE_85 = "rgba(247, 245, 242, 0.85)";

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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        padding: "20px 16px 16px",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      {STEPS.map((step, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        const dotBg = isActive
          ? CHAMPAGNE
          : isDone
          ? "rgba(200, 170, 118, 0.85)"
          : "rgba(255,255,255,0.06)";
        const dotColor = isActive || isDone ? "#0a0a0a" : SOFT_WHITE_45;
        const dotBorder = isActive
          ? "1px solid rgba(200,170,118,0.9)"
          : isDone
          ? "1px solid rgba(200,170,118,0.6)"
          : "1px solid rgba(255,255,255,0.10)";

        return (
          <div
            key={step.key}
            style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 60 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 12,
                  fontWeight: 600,
                  background: dotBg,
                  color: dotColor,
                  border: dotBorder,
                  boxShadow: isActive ? "0 0 0 4px rgba(200,170,118,0.16)" : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: isActive ? CHAMPAGNE : SOFT_WHITE_85,
                  marginTop: 8,
                  whiteSpace: "nowrap",
                  opacity: isActive || isDone ? 1 : 0.55,
                }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: isDone ? "rgba(200,170,118,0.55)" : "rgba(255,255,255,0.08)",
                  marginBottom: 24,
                  marginLeft: 6,
                  marginRight: 6,
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BookLayout({ children }: { children: ReactNode }) {
  return (
    <div className="luxe" style={{ minHeight: "100vh" }}>
      <Header />

      {/* Spacer — Header is fixed-position, push content below the bar. */}
      <div style={{ height: 72 }} />

      {/* Slim step indicator strip — sits BELOW the global header */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.18)",
        }}
      >
        <StepIndicator />
      </div>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 16px 140px" }}>
        {children}
      </main>
    </div>
  );
}
