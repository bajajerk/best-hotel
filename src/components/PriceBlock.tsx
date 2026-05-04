"use client";

// =============================================================================
//  PriceBlock — single source of truth for hotel-card price rendering.
//
//  Three display cases driven by `nights`:
//    A. nights === 0  → per-night only
//    B. nights === 1  → per-night (+ optional strikethrough)
//    C. nights >  1   → per-night + divider + "Total for N nights"
//
//  Tokens (--ink / --ink-light / --cream-border / --gold) auto-flip to dark
//  values inside `.luxe` scope (see globals.css), so the same component works
//  on both the cream listing pages and the dark Voyagr filter page.
// =============================================================================

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  AUD: "A$",
  SGD: "S$",
  THB: "฿",
  AED: "AED ",
  MYR: "RM ",
  IDR: "Rp ",
  KRW: "₩",
};

function formatPrice(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  const sym = CURRENCY_SYMBOLS[code] || `${currency} `;
  const rounded = Math.round(amount);
  const formatted =
    code === "INR"
      ? rounded.toLocaleString("en-IN")
      : rounded.toLocaleString("en-US");
  return `${sym}${formatted}`;
}

export interface PriceBlockProps {
  /** Per-night member rate. */
  memberRate: number;
  /** Per-night list/MRP rate. Strikethrough only renders when > memberRate. */
  originalRate?: number | null;
  /** Required: nights from search context. 0 = no dates selected. */
  nights: number;
  /** ISO 4217 currency code. Defaults to INR. */
  currency?: string;
  /** Visual size — default for cards, large for hero, compact for sticky bars. */
  size?: "default" | "large" | "compact";
  /** Horizontal alignment of all internal content. Defaults to left. */
  align?: "left" | "right";
  /** Optional eyebrow override. Defaults to "From". Pass null to hide. */
  eyebrow?: string | null;
}

const SIZE_PRESETS = {
  default: { eyebrow: 9, strike: 12, member: 24, caption: 10, totalLabel: 9, total: 22, totalCaption: 10, gap: 2, divider: 12 },
  large:   { eyebrow: 10, strike: 13, member: 36, caption: 11, totalLabel: 10, total: 28, totalCaption: 11, gap: 3, divider: 14 },
  compact: { eyebrow: 9, strike: 11, member: 18, caption: 10, totalLabel: 9, total: 16, totalCaption: 10, gap: 2, divider: 10 },
} as const;

export default function PriceBlock({
  memberRate,
  originalRate,
  nights,
  currency = "INR",
  size = "default",
  align = "left",
  eyebrow = "From",
}: PriceBlockProps) {
  const safeNights = Number.isFinite(nights) && nights > 0 ? Math.round(nights) : 0;
  const px = SIZE_PRESETS[size];

  // No / invalid member rate → "Rates on request"
  if (!memberRate || memberRate <= 0) {
    return (
      <div
        style={{
          textAlign: align,
          fontSize: px.eyebrow + 1,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--gold)",
          fontFamily: "var(--font-body)",
        }}
      >
        Rates on request
      </div>
    );
  }

  const showStrikethrough =
    originalRate != null && originalRate > memberRate && safeNights >= 1;
  const showTotal = safeNights > 1;
  const totalAmount = memberRate * safeNights;

  return (
    <div style={{ textAlign: align, fontFamily: "var(--font-body)" }}>
      {eyebrow && (
        <div
          style={{
            fontSize: px.eyebrow,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--ink-light)",
          }}
        >
          {eyebrow}
        </div>
      )}

      {showStrikethrough && (
        <div
          style={{
            fontSize: px.strike,
            color: "var(--ink-light)",
            textDecoration: "line-through",
            marginTop: px.gap + 2,
          }}
        >
          {formatPrice(originalRate as number, currency)}
        </div>
      )}

      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: px.member,
          fontWeight: 500,
          color: "var(--ink)",
          lineHeight: 1.05,
          marginTop: px.gap,
        }}
      >
        {formatPrice(memberRate, currency)}
      </div>

      <div
        style={{
          fontSize: px.caption,
          color: "var(--ink-light)",
          marginTop: px.gap + 2,
          letterSpacing: "0.02em",
        }}
      >
        per night &middot; taxes incl.
      </div>

      {showTotal && (
        <>
          <div
            style={{
              borderTop: "1px solid var(--cream-border)",
              margin: `${px.divider}px 0`,
            }}
          />
          <div
            style={{
              fontSize: px.totalLabel,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--ink-light)",
            }}
          >
            Total for {safeNights} {safeNights === 1 ? "night" : "nights"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: px.total,
              fontWeight: 500,
              color: "var(--ink)",
              lineHeight: 1.05,
              marginTop: px.gap,
            }}
          >
            {formatPrice(totalAmount, currency)}
          </div>
          <div
            style={{
              fontSize: px.totalCaption,
              color: "var(--ink-light)",
              marginTop: px.gap + 2,
              letterSpacing: "0.02em",
            }}
          >
            taxes incl.
          </div>
        </>
      )}
    </div>
  );
}
