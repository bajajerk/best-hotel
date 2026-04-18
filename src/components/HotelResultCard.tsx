"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { CuratedHotel } from "@/lib/api";
import { AmenityChips } from "@/components/AmenityIcons";
import { PriceProofCompact, TrustBadgesCompact } from "@/components/PriceProof";

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

function starDots(count: number | null): string {
  if (!count || count <= 0) return "";
  return Array.from({ length: Math.round(count) }, () => "\u2022").join(" ");
}

// ---------------------------------------------------------------------------
// Horizontal Hotel Result Card (Voyagr style)
// Used on city pages to display curated hotel listings
// ---------------------------------------------------------------------------
export default function HotelResultCard({
  hotel,
  index,
  valueScore,
}: {
  hotel: CuratedHotel;
  index: number;
  valueScore?: number;
}) {
  const photo = sanitizePhoto(hotel.photo1);
  const marketRate = hotel.rates_from ? Math.round(hotel.rates_from * 1.25) : null;
  const savePercent =
    hotel.rates_from && marketRate
      ? Math.round(((marketRate - hotel.rates_from) / marketRate) * 100)
      : null;

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
        {/* Desktop: horizontal 3-column card */}
        <div
          className="hidden md:grid city-hotel-card card-hover"
          style={{
            background: "var(--white)",
            border: "1px solid var(--cream-border)",
            gridTemplateColumns: "240px 1fr auto",
            gap: "0 20px",
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          {/* Left: Image */}
          <div style={{ position: "relative", overflow: "hidden", height: 180 }}>
            <img
              src={photo}
              alt={hotel.hotel_name}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "saturate(0.88)",
              }}
              className="card-img group-hover:scale-105"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.src !== PLACEHOLDER_IMG) img.src = PLACEHOLDER_IMG;
              }}
            />
            {index === 0 && (
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
            {valueScore != null && valueScore >= 60 && (
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: valueScore >= 85 ? "#2d6a4f" : valueScore >= 75 ? "#40916c" : "rgba(26,23,16,0.75)",
                  backdropFilter: "blur(4px)",
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
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {valueScore >= 85 ? "Top Pick" : valueScore >= 75 ? "Great Value" : "Good Value"}
              </div>
            )}
          </div>

          {/* Middle: Details */}
          <div style={{ padding: "20px 24px" }}>
            {hotel.star_rating && hotel.star_rating > 0 && (
              <div
                style={{
                  color: "var(--gold)",
                  fontSize: 11,
                  letterSpacing: 2,
                  marginBottom: 6,
                }}
              >
                {starDots(hotel.star_rating)}
              </div>
            )}

            <h3
              className="type-heading-3"
              style={{ color: "var(--ink)", marginBottom: 4 }}
            >
              {hotel.hotel_name}
            </h3>

            {hotel.addressline1 && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--ink-light)",
                  marginBottom: 12,
                }}
              >
                {hotel.addressline1}
              </p>
            )}

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {hotel.rating_average && hotel.rating_average > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "3px 10px",
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
                  {hotel.rating_average.toFixed(1)} rating
                </span>
              )}
              {hotel.number_of_reviews && hotel.number_of_reviews > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "3px 10px",
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
            {hotel.overview && (
              <div style={{ marginTop: 8 }}>
                <AmenityChips overview={hotel.overview} max={4} />
              </div>
            )}
            <div style={{ marginTop: 10 }}>
              <TrustBadgesCompact />
            </div>
          </div>

          {/* Right: Pricing */}
          <div
            style={{
              padding: 20,
              borderLeft: "1px solid var(--cream-border)",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "space-between",
              minWidth: 180,
            }}
          >
            {marketRate && hotel.rates_from ? (
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--ink-light)",
                    letterSpacing: "0.08em",
                  }}
                >
                  Market rate
                </div>
                <div
                  style={{
                    fontSize: 13,
                    textDecoration: "line-through",
                    color: "var(--market-rate)",
                  }}
                >
                  {formatCurrency(marketRate, hotel.rates_currency)}
                </div>
              </div>
            ) : (
              <div />
            )}

            {hotel.rates_from ? (
              <div
                style={{
                  textAlign: "right",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div className="type-label" style={{ color: "var(--gold)" }}>
                  Voyagr Rate
                </div>
                <div className="type-price" style={{ color: "var(--our-rate)" }}>
                  {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-light)" }}>
                  per night
                </div>
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
                }}
              >
                Call for rates
              </div>
            )}

            {savePercent && savePercent > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div
                  style={{
                    background: "var(--gold-pale)",
                    color: "var(--success)",
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "4px 10px",
                    textAlign: "center",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Save {savePercent}%
                </div>
                <PriceProofCompact savePercent={savePercent} />
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* Mobile: stacked card */}
        <div
          className="md:hidden card-hover"
          style={{
            background: "var(--white)",
            border: "1px solid var(--cream-border)",
            overflow: "hidden",
          }}
        >
          {/* Image */}
          <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
            <img
              src={photo}
              alt={hotel.hotel_name}
              loading="lazy"
              className="card-img"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "saturate(0.88)",
              }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.src !== PLACEHOLDER_IMG) img.src = PLACEHOLDER_IMG;
              }}
            />
            {index === 0 && (
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
                  background: "var(--gold-pale)",
                  color: "var(--success)",
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "4px 10px",
                  fontFamily: "var(--font-body)",
                }}
              >
                Save {savePercent}%
              </div>
            )}
            {valueScore != null && valueScore >= 60 && (
              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  background: valueScore >= 85 ? "#2d6a4f" : valueScore >= 75 ? "#40916c" : "rgba(26,23,16,0.75)",
                  backdropFilter: "blur(4px)",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "4px 8px",
                  fontFamily: "var(--font-body)",
                }}
              >
                {valueScore >= 85 ? "Top Pick" : valueScore >= 75 ? "Great Value" : "Good Value"}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ padding: 16 }}>
            {hotel.star_rating && hotel.star_rating > 0 && (
              <div
                style={{
                  color: "var(--gold)",
                  fontSize: 11,
                  letterSpacing: 2,
                  marginBottom: 4,
                }}
              >
                {starDots(hotel.star_rating)}
              </div>
            )}
            <h3
              className="type-heading-3"
              style={{ color: "var(--ink)", marginBottom: 4 }}
            >
              {hotel.hotel_name}
            </h3>
            {hotel.addressline1 && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--ink-light)",
                  marginBottom: 8,
                }}
              >
                {hotel.addressline1}
              </p>
            )}
            {hotel.overview && (
              <div style={{ marginBottom: 8 }}>
                <AmenityChips overview={hotel.overview} max={3} />
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <TrustBadgesCompact />
            </div>

            {/* Price row */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              {hotel.rates_from ? (
                <div>
                  <div
                    style={{
                      fontSize: 10,
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 24,
                        fontWeight: 500,
                        color: "var(--our-rate)",
                      }}
                    >
                      {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--ink-light)" }}>
                      per night
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
              {marketRate && hotel.rates_from && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span
                    style={{
                      fontSize: 12,
                      textDecoration: "line-through",
                      color: "var(--market-rate)",
                    }}
                  >
                    {formatCurrency(marketRate, hotel.rates_currency)}
                  </span>
                  {savePercent && savePercent > 0 && (
                    <PriceProofCompact savePercent={savePercent} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
