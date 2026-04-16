"use client";

import React, { useRef, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Rate Reveal — the highest-stakes product moment
// Member rate starts blurred/muted, reveals via IntersectionObserver once
// per session with a choreographed 3-step animation sequence.
// ---------------------------------------------------------------------------

const SESSION_KEY = "voyagr_rate_revealed";

export default function RateReveal() {
  const cardRef = useRef<HTMLDivElement>(null);
  const memberRateRef = useRef<HTMLSpanElement>(null);
  const savingsBadgeRef = useRef<HTMLDivElement>(null);
  const [alreadyRevealed, setAlreadyRevealed] = useState(false);

  useEffect(() => {
    // Check sessionStorage on mount (client only)
    if (sessionStorage.getItem(SESSION_KEY)) {
      setAlreadyRevealed(true);
      return;
    }

    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;

        // Fire once — disconnect immediately
        observer.disconnect();
        sessionStorage.setItem(SESSION_KEY, "1");

        const rate = memberRateRef.current;
        const badge = savingsBadgeRef.current;

        // Step 1 (0s): blur 6px → 0px, duration 0.5s, ease-out
        if (rate) {
          rate.style.transition = "filter 0.5s ease-out";
          rate.style.filter = "blur(0px)";
        }

        // Step 2 (0.3s delay): opacity 0.4 → 1, duration 0.3s
        setTimeout(() => {
          if (rate) {
            rate.style.transition = "filter 0.5s ease-out, opacity 0.3s ease-out";
            rate.style.opacity = "1";
          }
        }, 300);

        // Step 3 (0.6s): savings badge slides up from 8px below, opacity 0 → 1, duration 0.3s
        setTimeout(() => {
          if (badge) {
            badge.style.transition =
              "transform 0.3s ease-out, opacity 0.3s ease-out";
            badge.style.transform = "translateY(0)";
            badge.style.opacity = "1";
          }
          setAlreadyRevealed(true);
        }, 600);
      },
      { threshold: 0.3 }
    );

    observer.observe(card);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      style={{
        background: "#0B1B2B",
        padding: "80px 60px",
      }}
      className="rate-reveal-section"
    >
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        {/* Section eyebrow */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "#C9A84C",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          Member Pricing
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "32px",
            fontWeight: 300,
            color: "#F5F1E8",
            margin: "0 0 40px 0",
            lineHeight: 1.15,
            textAlign: "center",
          }}
          className="rate-reveal-heading"
        >
          Your Rate, <em style={{ fontStyle: "italic" }}>Revealed</em>
        </h2>

        {/* Rate card */}
        <div
          ref={cardRef}
          style={{
            background: "#132338",
            border: "1px solid rgba(201,168,76,0.08)",
            borderRadius: "4px",
            padding: "32px",
          }}
        >
          {/* Public rate — visible from start, crossed out, muted */}
          <div style={{ marginBottom: "8px" }}>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "10px",
                color: "rgba(245,241,232,0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Public Rate
            </span>
          </div>
          <div style={{ marginBottom: "24px" }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "28px",
                fontWeight: 400,
                color: "rgba(245,241,232,0.35)",
                textDecoration: "line-through",
                lineHeight: 1,
              }}
            >
              ₹18,500
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "rgba(245,241,232,0.3)",
                marginLeft: "8px",
              }}
            >
              per night
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              background: "rgba(201,168,76,0.12)",
              marginBottom: "24px",
            }}
          />

          {/* Member rate — blurred initially, reveals on scroll */}
          <div style={{ marginBottom: "6px" }}>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "10px",
                color: "#C9A84C",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 500,
              }}
            >
              Member Rate
            </span>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <span
              ref={memberRateRef}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "36px",
                fontWeight: 500,
                color: "#C9A84C",
                lineHeight: 1,
                filter: alreadyRevealed ? "blur(0px)" : "blur(6px)",
                opacity: alreadyRevealed ? 1 : 0.4,
                display: "inline-block",
              }}
            >
              ₹12,000
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "rgba(245,241,232,0.45)",
                marginLeft: "8px",
              }}
            >
              per night
            </span>
          </div>

          {/* Savings badge — appears after reveal (step 3) */}
          <div
            ref={savingsBadgeRef}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#4A5E52",
              color: "#F5F1E8",
              borderRadius: "20px",
              padding: "6px 16px",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.02em",
              transform: alreadyRevealed ? "translateY(0)" : "translateY(8px)",
              opacity: alreadyRevealed ? 1 : 0,
              marginBottom: "20px",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F5F1E8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            You save ₹6,500 per night
          </div>

          {/* Footnote — always visible, 40% opacity */}
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "rgba(245,241,232,0.4)",
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            Rate based on Voyagr Club negotiated pricing. Subject to
            availability.
          </div>
        </div>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 767px) {
          .rate-reveal-section {
            padding: 60px 20px !important;
          }
          .rate-reveal-heading {
            font-size: 26px !important;
          }
        }
      `}</style>
    </section>
  );
}
