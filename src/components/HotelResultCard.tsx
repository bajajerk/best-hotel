"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { CuratedHotel } from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=70";

function sanitizePhoto(url: string | null): string {
  if (!url) return PLACEHOLDER_IMG;
  let src = url.startsWith("http://") ? url.replace("http://", "https://") : url;
  if (!src.startsWith("https://"))
    src = `https://photos.hotelbeds.com/giata/${src}`;
  return src;
}

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

function StarRating({ count }: { count: number }) {
  const rounded = Math.round(count);
  const filled = Math.max(0, Math.min(5, rounded));
  const empty = 5 - filled;
  return (
    <span
      aria-label={`${filled} star hotel`}
      style={{
        color: "var(--gold)",
        fontSize: 13,
        letterSpacing: 1,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {"\u2605".repeat(filled)}
      <span style={{ color: "var(--cream-border)" }}>{"\u2606".repeat(empty)}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Hotel Result Card — clean OTA-style (Booking/Airbnb inspired)
// Full-bleed image on top, minimal content below
// ---------------------------------------------------------------------------
export default function HotelResultCard({
  hotel,
  index,
}: {
  hotel: CuratedHotel;
  index: number;
}) {
  const photo = sanitizePhoto(hotel.photo1);
  const marketRate = hotel.rates_from ? Math.round(hotel.rates_from * 1.25) : null;
  const savePercent =
    hotel.rates_from && marketRate
      ? Math.round(((marketRate - hotel.rates_from) / marketRate) * 100)
      : null;
  const saveAmount =
    hotel.rates_from && marketRate ? marketRate - hotel.rates_from : null;

  const isPreferred = index === 0;
  const location = [hotel.city_name, hotel.country].filter(Boolean).join(" \u00B7 ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.08 + index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Link href={`/hotel/${hotel.hotel_id}`} className="block group">
        <div
          className="city-result-card-flat"
          style={{
            background: "var(--white)",
            border: "1px solid var(--cream-border)",
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          {/* Full-bleed image */}
          <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
            <img
              src={photo}
              alt={hotel.hotel_name}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "saturate(0.9)",
              }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.src !== PLACEHOLDER_IMG) img.src = PLACEHOLDER_IMG;
              }}
            />
            {isPreferred && (
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  background: "var(--gold)",
                  color: "var(--ink)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  fontFamily: "var(--font-body)",
                }}
              >
                Preferred
              </div>
            )}
            {savePercent && savePercent > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "var(--success)",
                  color: "var(--white)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  fontFamily: "var(--font-body)",
                }}
              >
                Save {savePercent}%
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: "18px 20px 16px" }}>
            {/* Row 1: name + stars inline */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 4,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  fontWeight: 500,
                  color: "var(--ink)",
                  lineHeight: 1.2,
                  margin: 0,
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {hotel.hotel_name}
              </h3>
              {hotel.star_rating && hotel.star_rating > 0 && (
                <StarRating count={hotel.star_rating} />
              )}
            </div>

            {/* Row 2: Location — city + country only */}
            {location && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--ink-light)",
                  margin: 0,
                  marginBottom: 14,
                  fontFamily: "var(--font-body)",
                }}
              >
                {location}
              </p>
            )}

            {/* Row 3: Rate display */}
            {hotel.rates_from ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                {/* Left: member rate */}
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--gold)",
                      fontFamily: "var(--font-body)",
                      marginBottom: 2,
                    }}
                  >
                    Member Rate
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 24,
                        fontWeight: 500,
                        color: "var(--gold)",
                        lineHeight: 1,
                      }}
                    >
                      {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--ink-light)" }}>
                      /night
                    </span>
                  </div>
                </div>

                {/* Right: struck-through market + save */}
                {marketRate && saveAmount && saveAmount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        textDecoration: "line-through",
                        color: "var(--ink-light)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {formatCurrency(marketRate, hotel.rates_currency)}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--success)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      Save {formatCurrency(saveAmount, hotel.rates_currency)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  fontFamily: "var(--font-body)",
                  marginBottom: 10,
                }}
              >
                Call for rates
              </div>
            )}

            {/* Row 4: small meta + CTA */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                borderTop: "1px solid var(--cream-border)",
                paddingTop: 10,
              }}
            >
              <span
                title="Free cancellation up to 48 hours before check-in"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "var(--ink-light)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-label="Free cancellation"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                All inclusive
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  color: "var(--gold)",
                  fontFamily: "var(--font-body)",
                  whiteSpace: "nowrap",
                }}
                className="group-hover:underline"
              >
                View Hotel &rarr;
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
