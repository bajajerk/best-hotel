"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCompare } from "@/context/CompareContext";
import { hotelUrl } from "@/lib/urls";
import { extractAmenities } from "@/components/AmenityIcons";
import Header from "@/components/Header";
import { trackCompareViewed } from "@/lib/analytics";
import type { CuratedHotel } from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=70";

function sanitizePhoto(url: string | null): string {
  if (!url) return PLACEHOLDER_IMG;
  let src = url.startsWith("http://") ? url.replace("http://", "https://") : url;
  if (!src.startsWith("https://"))
    src = `https://photos.hotelbeds.com/giata/${src}`;
  return src;
}

function formatCurrency(amount: number, currency?: string | null): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", INR: "₹",
    JPY: "¥", AUD: "A$", SGD: "S$", THB: "฿",
    AED: "AED ", MYR: "RM ", IDR: "Rp ", KRW: "₩",
  };
  const sym = currency ? (symbols[currency.toUpperCase()] || `${currency} `) : "$";
  const rounded = Math.round(amount);
  const formatted =
    currency?.toUpperCase() === "INR"
      ? rounded.toLocaleString("en-IN")
      : rounded.toLocaleString("en-US");
  return `${sym}${formatted}`;
}

function ratingLabel(avg: number | null): string {
  if (!avg || avg <= 0) return "";
  if (avg >= 9) return "Exceptional";
  if (avg >= 8) return "Excellent";
  if (avg >= 7) return "Very Good";
  if (avg >= 6) return "Good";
  return "Pleasant";
}

// ---------------------------------------------------------------------------
// Visual tokens reused from the .luxe palette
// ---------------------------------------------------------------------------
const SOFT_WHITE = "var(--luxe-soft-white)";
const SOFT_WHITE_50 = "var(--luxe-soft-white-50)";
const SOFT_WHITE_70 = "var(--luxe-soft-white-70)";
const CHAMPAGNE = "var(--luxe-champagne)";
const CHAMPAGNE_LINE = "var(--luxe-champagne-line)";
const HAIRLINE = "var(--luxe-hairline-strong)";
const BLACK_2 = "var(--luxe-black-2)";
const BLACK_3 = "var(--luxe-black-3)";

const FONT_DISPLAY = "var(--font-display), 'Playfair Display', Georgia, serif";
const FONT_BODY = "var(--font-body), 'Manrope', system-ui, sans-serif";
const FONT_MONO = "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace";

// ---------------------------------------------------------------------------
// Compare Page
// ---------------------------------------------------------------------------
export default function ComparePage() {
  const { hotels, remove } = useCompare();
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track compare page view
  useEffect(() => {
    if (hotels.length >= 2) {
      trackCompareViewed({
        hotel_count: hotels.length,
        hotel_names: hotels.map((h) => h.hotel_name),
      });
    }
  }, [hotels]);

  // N-of-M indicator on mobile: track which card is centred in the scroll view
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-compare-card]"));
      if (!cards.length) return;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      cards.forEach((c, i) => {
        const center = c.offsetLeft + c.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });
      setActiveIndex(bestIdx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [hotels.length]);

  // ── Empty / under-stocked state ────────────────────────────────────────
  if (hotels.length < 2) {
    return (
      <div className="luxe" style={{ minHeight: "100vh" }}>
        <Header />
        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            padding: "140px 24px 80px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: CHAMPAGNE,
              marginBottom: 24,
            }}
          >
            THE COMPARISON
          </div>
          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(34px, 5vw, 52px)",
              fontWeight: 400,
              fontStyle: "italic",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: SOFT_WHITE,
              margin: "0 0 18px",
            }}
          >
            Two stays, side by side.
          </h1>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 15,
              lineHeight: 1.7,
              color: SOFT_WHITE_70,
              margin: "0 auto 36px",
              maxWidth: 460,
            }}
          >
            Add a second hotel from any results page and we&rsquo;ll lay them out
            here the way our concierge does it &mdash; image first, prices honest,
            the things that actually differ pulled out.
          </p>
          <Link
            href="/search"
            className="luxe-btn-gold"
            style={{ minHeight: 48 }}
          >
            Start with /search
          </Link>
        </div>
      </div>
    );
  }

  // Best-of helpers
  const prices = hotels.map((h) => h.rates_from ?? Infinity);
  const lowestPrice = Math.min(...prices);

  return (
    <div className="luxe" style={{ minHeight: "100vh" }}>
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "112px 24px 32px" }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            color: SOFT_WHITE_70,
            fontFamily: FONT_BODY,
            fontSize: 12,
            letterSpacing: "0.02em",
            cursor: "pointer",
            padding: 0,
            marginBottom: 28,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            minHeight: 44,
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: CHAMPAGNE,
              marginBottom: 18,
            }}
          >
            THE COMPARISON &middot; {hotels.length} STAYS
          </div>
          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(38px, 5.4vw, 72px)",
              lineHeight: 1.02,
              letterSpacing: "-0.025em",
              color: SOFT_WHITE,
              margin: "0 0 22px",
              maxWidth: 920,
            }}
          >
            Side by side, considered.
          </h1>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 15,
              lineHeight: 1.75,
              color: SOFT_WHITE_70,
              maxWidth: 640,
              margin: 0,
            }}
          >
            Four hotels, one shortlist. We&rsquo;ve laid them out the way our
            concierge does it &mdash; image first, prices honest, the things
            that actually differ pulled out. Scroll across, then pick the one
            that feels right.
          </p>
        </motion.div>
      </div>

      {/* Champagne hairline divider under the hero */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <div style={{ height: 1, background: CHAMPAGNE_LINE, opacity: 0.5 }} />
      </div>

      {/* ── Track layout ─────────────────────────────────────────────── */}
      <CompareTrack
        hotels={hotels}
        trackRef={trackRef}
        activeIndex={activeIndex}
        lowestPrice={lowestPrice}
        onRemove={(id) => remove(id)}
      />

      {/* ── Mobile N-of-M indicator ──────────────────────────────────── */}
      <div
        className="compare-dots"
        aria-hidden="true"
        style={{
          display: "none",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          padding: "8px 0 28px",
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: "0.3em",
            color: CHAMPAGNE,
            marginRight: 6,
          }}
        >
          {String(activeIndex + 1).padStart(2, "0")} / {String(hotels.length).padStart(2, "0")}
        </span>
        {hotels.map((h, i) => (
          <span
            key={h.id}
            style={{
              width: i === activeIndex ? 18 : 6,
              height: 2,
              background: i === activeIndex ? CHAMPAGNE : SOFT_WHITE_50,
              transition: "width 0.25s ease, background 0.25s ease",
              display: "inline-block",
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .compare-dots {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CompareTrack — sticky labels on desktop, scrollable card track
// ---------------------------------------------------------------------------
const ROW_LABELS = [
  { key: "price", label: "PRICE" },
  { key: "amenities", label: "AMENITIES" },
  { key: "cancel", label: "CANCEL POLICY" },
  { key: "save", label: "MEMBER SAVE" },
];

function CompareTrack({
  hotels,
  trackRef,
  activeIndex,
  lowestPrice,
  onRemove,
}: {
  hotels: CuratedHotel[];
  trackRef: React.MutableRefObject<HTMLDivElement | null>;
  activeIndex: number;
  lowestPrice: number;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "32px 0 56px",
        position: "relative",
      }}
    >
      <div className="compare-layout">
        {/* Sticky row-label rail — desktop only */}
        <aside className="compare-rail" aria-hidden="true">
          <div style={{ paddingTop: 460 /* aligns with first comparison row below the image */ }}>
            {ROW_LABELS.map((r) => (
              <div
                key={r.key}
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: CHAMPAGNE,
                  height: 96,
                  display: "flex",
                  alignItems: "flex-start",
                  paddingTop: 6,
                  borderTop: `1px solid ${HAIRLINE}`,
                }}
              >
                {r.label}
              </div>
            ))}
          </div>
        </aside>

        {/* Horizontal scroll track */}
        <div
          ref={trackRef}
          className="compare-track no-scrollbar"
          style={{
            display: "flex",
            gap: 20,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollPaddingLeft: 24,
            padding: "0 24px 8px",
          }}
        >
          {hotels.map((hotel, i) => (
            <TastingNoteCard
              key={hotel.id}
              hotel={hotel}
              index={i}
              activeIndex={activeIndex}
              total={hotels.length}
              isCheapest={
                hotel.rates_from !== null &&
                hotel.rates_from === lowestPrice &&
                lowestPrice < Infinity
              }
              onRemove={() => onRemove(hotel.id)}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .compare-layout {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 0;
        }
        .compare-rail {
          padding-left: 24px;
          padding-right: 16px;
        }
        @media (max-width: 1024px) {
          .compare-layout {
            grid-template-columns: 1fr;
          }
          .compare-rail {
            display: none;
          }
        }
        @media (max-width: 768px) {
          .compare-track {
            scroll-snap-type: x mandatory;
            padding: 0 16px 8px !important;
            gap: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TastingNoteCard — single hotel column
// ---------------------------------------------------------------------------
function TastingNoteCard({
  hotel,
  index,
  activeIndex,
  total,
  isCheapest,
  onRemove,
}: {
  hotel: CuratedHotel;
  index: number;
  activeIndex: number;
  total: number;
  isCheapest: boolean;
  onRemove: () => void;
}) {
  const amenities = extractAmenities(hotel.overview).slice(0, 3);
  const destinationLabel =
    [hotel.city_name, hotel.country].filter(Boolean).join(" · ").toUpperCase();
  const isActive = index === activeIndex;

  return (
    <article
      data-compare-card
      className="compare-card"
      style={{
        flex: "0 0 auto",
        width: "clamp(280px, 28vw, 360px)",
        scrollSnapAlign: "start",
        display: "flex",
        flexDirection: "column",
        background: BLACK_2,
        border: `1px solid ${isActive ? CHAMPAGNE_LINE : HAIRLINE}`,
        transition: "border-color 0.3s ease, transform 0.3s ease",
        position: "relative",
      }}
    >
      {/* Mobile N-of-M chip in the top-right of each card */}
      <div
        className="compare-card-nofm"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          padding: "5px 9px",
          background: "rgba(12, 11, 10, 0.7)",
          border: `1px solid ${CHAMPAGNE_LINE}`,
          fontFamily: FONT_MONO,
          fontSize: 9,
          letterSpacing: "0.3em",
          color: CHAMPAGNE,
          textTransform: "uppercase",
          zIndex: 2,
          display: "none",
        }}
      >
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        aria-label={`Remove ${hotel.hotel_name}`}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 32,
          height: 32,
          background: "rgba(12, 11, 10, 0.7)",
          border: `1px solid ${HAIRLINE}`,
          color: SOFT_WHITE,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          zIndex: 2,
        }}
      >
        &times;
      </button>

      {/* ── 1. Cinematic 4:5 hero ────────────────────────────────────── */}
      <Link
        href={hotelUrl(hotel)}
        style={{
          display: "block",
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 5",
          overflow: "hidden",
          background: BLACK_3,
        }}
      >
        <img
          src={sanitizePhoto(hotel.photo1)}
          alt={hotel.hotel_name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            filter: "saturate(0.92)",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
          }}
        />
        {/* Soft top-to-bottom scrim for legibility of the corner chips */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(12,11,10,0.45) 0%, rgba(12,11,10,0) 25%, rgba(12,11,10,0) 70%, rgba(12,11,10,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
      </Link>

      {/* ── 2-5. Name block ──────────────────────────────────────────── */}
      <div style={{ padding: "20px 20px 16px" }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: CHAMPAGNE,
            marginBottom: 10,
          }}
        >
          {destinationLabel || "DESTINATION"}
        </div>

        <Link
          href={hotelUrl(hotel)}
          style={{
            display: "block",
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(22px, 2.2vw, 28px)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: SOFT_WHITE,
            textDecoration: "none",
            marginBottom: 12,
          }}
        >
          {hotel.hotel_name}
        </Link>

        {/* Star + rating chip row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {hotel.star_rating && hotel.star_rating > 0 ? (
            <span
              style={{
                color: CHAMPAGNE,
                letterSpacing: "0.18em",
                fontSize: 12,
              }}
              aria-label={`${Math.round(hotel.star_rating)} star`}
            >
              {"★".repeat(Math.round(hotel.star_rating))}
            </span>
          ) : null}
          {hotel.rating_average && hotel.rating_average > 0 ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                border: `1px solid ${CHAMPAGNE_LINE}`,
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: SOFT_WHITE,
                letterSpacing: "0.05em",
              }}
            >
              <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {hotel.rating_average.toFixed(1)}
              </span>
              <span
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 10,
                  color: SOFT_WHITE_70,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {ratingLabel(hotel.rating_average)}
              </span>
            </span>
          ) : null}
        </div>

        {/* Champagne hairline divider */}
        <div style={{ height: 1, background: CHAMPAGNE_LINE, opacity: 0.55 }} />
      </div>

      {/* ── 6. Comparison row strip ──────────────────────────────────── */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 0 }}>
        {/* PRICE */}
        <CompareRowStrip label="PRICE">
          {hotel.rates_from ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: 30,
                  lineHeight: 1,
                  color: isCheapest ? CHAMPAGNE : SOFT_WHITE,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.01em",
                }}
              >
                {formatCurrency(hotel.rates_from, hotel.rates_currency)}
              </span>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: SOFT_WHITE_50,
                }}
              >
                /night
              </span>
              {isCheapest && total > 1 ? (
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 9,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: CHAMPAGNE,
                    marginLeft: 4,
                  }}
                >
                  &middot; LOWEST
                </span>
              ) : null}
            </div>
          ) : (
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: CHAMPAGNE,
              }}
            >
              CALL FOR RATES
            </span>
          )}
        </CompareRowStrip>

        {/* AMENITIES */}
        <CompareRowStrip label="AMENITIES">
          {amenities.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {amenities.map((a) => (
                <span
                  key={a.key}
                  style={{
                    padding: "4px 10px",
                    border: `1px solid ${HAIRLINE}`,
                    fontFamily: FONT_BODY,
                    fontSize: 11,
                    color: SOFT_WHITE_70,
                    letterSpacing: "0.02em",
                  }}
                >
                  {a.label}
                </span>
              ))}
            </div>
          ) : (
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                color: SOFT_WHITE_50,
                fontStyle: "italic",
              }}
            >
              Details on the hotel page
            </span>
          )}
        </CompareRowStrip>

        {/* CANCEL POLICY — refundable flag isn't on CuratedHotel; skip rather than fake. */}
        <CompareRowStrip label="CANCEL POLICY">
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: SOFT_WHITE_50,
            }}
          >
            Confirmed at checkout
          </span>
        </CompareRowStrip>

        {/* MEMBER SAVE — skip when we have no honest number (don't fake) */}
      </div>

      {/* ── 7. CTAs ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "16px 20px 20px",
          borderTop: `1px solid ${HAIRLINE}`,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Link
          href={hotelUrl(hotel)}
          className="luxe-btn-gold"
          style={{
            width: "100%",
            minHeight: 44,
            padding: "12px 20px",
            fontSize: 11,
          }}
        >
          Select this stay
        </Link>
        <Link
          href={hotelUrl(hotel)}
          className="luxe-btn-secondary"
          style={{
            width: "100%",
            minHeight: 44,
            padding: "12px 20px",
            fontSize: 11,
          }}
        >
          Open details
        </Link>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .compare-card {
            width: 88vw !important;
            scroll-snap-align: center !important;
          }
          .compare-card-nofm {
            display: block !important;
          }
        }
      `}</style>
    </article>
  );
}

// ---------------------------------------------------------------------------
// CompareRowStrip — one comparison row inside a single card
// ---------------------------------------------------------------------------
function CompareRowStrip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="compare-row-strip"
      style={{
        padding: "16px 0",
        borderTop: `1px solid ${HAIRLINE}`,
        minHeight: 96,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Mobile-only inline eyebrow (desktop uses the sticky rail) */}
      <div
        className="compare-row-strip__eyebrow"
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: CHAMPAGNE,
          marginBottom: 8,
          display: "none",
        }}
      >
        {label}
      </div>
      <div>{children}</div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .compare-row-strip__eyebrow {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
