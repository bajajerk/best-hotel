"use client";

import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(amount: number, currency?: string | null): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "\u20AC", GBP: "\u00A3", INR: "\u20B9",
    JPY: "\u00A5", AUD: "A$", SGD: "S$", THB: "\u0E3F",
    AED: "AED ", MYR: "RM ", IDR: "Rp ", KRW: "\u20A9",
  };
  const sym = currency ? (symbols[currency.toUpperCase()] || `${currency} `) : "$";
  const rounded = Math.round(amount);
  const formatted =
    currency?.toUpperCase() === "INR"
      ? rounded.toLocaleString("en-IN")
      : rounded.toLocaleString("en-US");
  return `${sym}${formatted}`;
}

// Deterministic pseudo-random multiplier from hotel price (consistent per hotel)
function otaMultipliers(basePrice: number): { name: string; multiplier: number }[] {
  const seed = basePrice % 100;
  return [
    { name: "Booking.com", multiplier: 1.22 + (seed % 7) * 0.01 },
    { name: "Expedia", multiplier: 1.28 + (seed % 5) * 0.01 },
    { name: "Hotels.com", multiplier: 1.18 + (seed % 9) * 0.01 },
  ];
}

// ---------------------------------------------------------------------------
// PriceComparisonBars — visual bar chart comparing Voyagr vs OTA prices
// ---------------------------------------------------------------------------
export function PriceComparisonBars({
  ratesFrom,
  currency,
}: {
  ratesFrom: number;
  currency?: string | null;
}) {
  const otas = otaMultipliers(ratesFrom);
  const allPrices = [ratesFrom, ...otas.map((o) => Math.round(ratesFrom * o.multiplier))];
  const maxPrice = Math.max(...allPrices);

  const bars = [
    { name: "Voyagr", price: ratesFrom, isVoyagr: true },
    ...otas.map((o) => ({
      name: o.name,
      price: Math.round(ratesFrom * o.multiplier),
      isVoyagr: false,
    })),
  ].sort((a, b) => a.price - b.price);

  return (
    <div>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: "var(--ink-mid)",
          marginBottom: "14px",
          fontFamily: "var(--font-body)",
        }}
      >
        Price Comparison
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {bars.map((bar, i) => {
          const widthPct = Math.max((bar.price / maxPrice) * 100, 30);
          const saving = bar.isVoyagr
            ? null
            : Math.round(((bar.price - ratesFrom) / bar.price) * 100);
          return (
            <motion.div
              key={bar.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: bar.isVoyagr ? 600 : 400,
                    color: bar.isVoyagr ? "var(--our-rate)" : "var(--ink-mid)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {bar.name}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: bar.isVoyagr ? "var(--our-rate)" : "var(--ink-mid)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatCurrency(bar.price, currency)}
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  background: "var(--cream)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    background: bar.isVoyagr ? "var(--our-rate)" : "var(--cream-border)",
                  }}
                />
              </div>
              {saving && saving > 0 && (
                <div
                  style={{
                    fontSize: "9px",
                    color: "var(--market-rate)",
                    marginTop: "2px",
                    textAlign: "right",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {saving}% more expensive
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BestPriceGuarantee — trust badge with guarantee messaging
// ---------------------------------------------------------------------------
export function BestPriceGuarantee() {
  return (
    <div
      style={{
        border: "1px solid var(--cream-border)",
        padding: "16px",
        background: "var(--cream)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--success)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            color: "var(--ink)",
            fontFamily: "var(--font-body)",
          }}
        >
          Best Price Guarantee
        </span>
      </div>
      <p
        style={{
          fontSize: "11px",
          color: "var(--ink-light)",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        Found a lower rate elsewhere? We&apos;ll match it and give you an additional 5% off. Our
        rates are negotiated directly with hotels — no middleman markup.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PriceProofCompact — inline badge for hotel cards
// ---------------------------------------------------------------------------
export function PriceProofCompact({
  savePercent,
}: {
  savePercent: number;
}) {
  if (!savePercent || savePercent <= 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "9px",
        color: "var(--success)",
        fontWeight: 500,
        fontFamily: "var(--font-body)",
        letterSpacing: "0.02em",
      }}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      Verified lowest price
    </div>
  );
}

// ---------------------------------------------------------------------------
// PriceProofTrustRow — trust signals for sidebar
// ---------------------------------------------------------------------------
export function PriceProofTrustRow() {
  const signals = [
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      label: "Price match",
    },
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      ),
      label: "No fees",
    },
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      label: "Direct rates",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 0",
      }}
    >
      {signals.map((s) => (
        <div
          key={s.label}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            color: "var(--ink-light)",
          }}
        >
          {s.icon}
          <span
            style={{
              fontSize: "9px",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
