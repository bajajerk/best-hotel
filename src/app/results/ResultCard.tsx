"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { RankedHotel } from "@/lib/ranking";
import { AmenityChips } from "@/components/AmenityIcons";
import { useCompare } from "@/context/CompareContext";

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

// ---------------------------------------------------------------------------
// Compare Toggle
// ---------------------------------------------------------------------------
function CompareToggle({ hotel }: { hotel: RankedHotel["hotel"] }) {
  const { add, remove, has, isFull } = useCompare();
  const selected = has(hotel.hotel_id);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (selected) remove(hotel.hotel_id);
        else add(hotel);
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 9,
        fontWeight: 500,
        fontFamily: "var(--font-body)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "4px 10px",
        cursor: selected || !isFull ? "pointer" : "not-allowed",
        border: selected ? "1px solid var(--gold)" : "1px solid var(--cream-border)",
        background: selected ? "var(--gold-pale)" : "var(--white)",
        color: selected ? "var(--gold)" : "var(--ink-light)",
        opacity: !selected && isFull ? 0.5 : 1,
        transition: "all 0.15s ease",
      }}
      aria-label={selected ? "Remove from compare" : "Add to compare"}
    >
      <svg
        width={10}
        height={10}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {selected ? (
          <polyline points="20 6 9 17 4 12" />
        ) : (
          <>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </>
        )}
      </svg>
      {selected ? "Comparing" : "Compare"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ResultCard — Vertical grid card for the browse/results page
// ---------------------------------------------------------------------------
export default function ResultCard({
  ranked,
  index,
}: {
  ranked: RankedHotel;
  index: number;
}) {
  const hotel = ranked.hotel;
  const photo = sanitizePhoto(hotel.photo1);
  const marketRate = hotel.rates_from ? Math.round(hotel.rates_from * 1.25) : null;
  const savePercent =
    hotel.rates_from && marketRate
      ? Math.round(((marketRate - hotel.rates_from) / marketRate) * 100)
      : null;
  const savingsAmount =
    hotel.rates_from && marketRate ? marketRate - hotel.rates_from : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: 0.04 + (index % 12) * 0.03,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Link
        href={`/hotel/${hotel.hotel_id}`}
        className="block group"
        style={{ textDecoration: "none" }}
      >
        <div
          className="card-hover"
          style={{
            background: "var(--white)",
            border: "1px solid var(--cream-border)",
            overflow: "hidden",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Image */}
          <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
            <img
              src={photo}
              alt={hotel.hotel_name}
              loading="lazy"
              className="card-img group-hover:scale-105"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "saturate(0.88)",
                transition: "transform 0.4s ease",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
              }}
            />

            {/* Value badge */}
            {ranked.valueScore >= 75 && (
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  background:
                    ranked.valueScore >= 85 ? "#2d6a4f" : "#40916c",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "4px 8px",
                  fontFamily: "var(--font-body)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
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
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {ranked.valueScore >= 85 ? "Top Pick" : "Great Value"}
              </div>
            )}

            {/* Save badge */}
            {savePercent && savePercent > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "var(--gold-pale)",
                  color: "var(--success)",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "4px 10px",
                  fontFamily: "var(--font-body)",
                }}
              >
                Save {savePercent}%
              </div>
            )}

            {/* Star rating overlay */}
            {hotel.star_rating && hotel.star_rating > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 10,
                  background: "rgba(26, 23, 16, 0.7)",
                  backdropFilter: "blur(4px)",
                  color: "var(--gold-light)",
                  fontSize: 10,
                  letterSpacing: 1,
                  padding: "3px 8px",
                }}
              >
                {"★".repeat(hotel.star_rating)}
              </div>
            )}
          </div>

          {/* Content */}
          <div
            style={{
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 17,
                fontWeight: 500,
                fontStyle: "italic",
                color: "var(--ink)",
                lineHeight: 1.25,
                marginBottom: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {hotel.hotel_name}
            </h3>

            <p
              style={{
                fontSize: 11,
                color: "var(--ink-light)",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {hotel.city_name}, {hotel.country}
            </p>

            {/* Rating + reviews */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {hotel.rating_average && hotel.rating_average > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    background:
                      hotel.rating_average >= 8.5
                        ? "var(--gold-pale)"
                        : "var(--cream)",
                    color:
                      hotel.rating_average >= 8.5
                        ? "var(--gold)"
                        : "var(--ink-mid)",
                    border: "1px solid var(--cream-border)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                  }}
                >
                  {hotel.rating_average.toFixed(1)}
                </span>
              )}
              {hotel.number_of_reviews && hotel.number_of_reviews > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    background: "var(--cream)",
                    color: "var(--ink-mid)",
                    border: "1px solid var(--cream-border)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {hotel.number_of_reviews.toLocaleString()} reviews
                </span>
              )}
            </div>

            {/* Amenities */}
            {hotel.overview && (
              <div style={{ marginBottom: 10 }}>
                <AmenityChips overview={hotel.overview} max={3} />
              </div>
            )}

            {/* Instant confirmation badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 9,
                fontWeight: 500,
                color: "var(--success)",
                fontFamily: "var(--font-body)",
                letterSpacing: "0.02em",
                marginBottom: 12,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Instant confirmation via concierge
            </div>

            {/* Spacer to push price to bottom */}
            <div style={{ flex: 1 }} />

            {/* Price section */}
            <div
              style={{
                borderTop: "1px solid var(--cream-border)",
                paddingTop: 12,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
              }}
            >
              {hotel.rates_from ? (
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--gold)",
                      fontFamily: "var(--font-body)",
                      marginBottom: 2,
                    }}
                  >
                    Voyagr Rate
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 22,
                        fontWeight: 500,
                        color: "var(--our-rate)",
                      }}
                    >
                      {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--ink-light)" }}>
                      /night
                    </span>
                  </div>
                </div>
              ) : (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Call for rates
                </span>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 4,
                }}
              >
                {marketRate && hotel.rates_from && (
                  <span
                    style={{
                      fontSize: 11,
                      textDecoration: "line-through",
                      color: "var(--market-rate)",
                    }}
                  >
                    {formatCurrency(marketRate, hotel.rates_currency)}
                  </span>
                )}
                {savingsAmount && savingsAmount > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--success)",
                      fontFamily: "var(--font-mono)",
                      background: "var(--gold-pale)",
                      padding: "2px 8px",
                    }}
                  >
                    You save {formatCurrency(savingsAmount, hotel.rates_currency)}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              <CompareToggle hotel={hotel} />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--gold)",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                }}
              >
                View details &rarr;
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
