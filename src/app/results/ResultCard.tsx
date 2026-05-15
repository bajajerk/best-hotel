"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { RankedHotel } from "@/lib/ranking";
import { AmenityChips } from "@/components/AmenityIcons";
import { useBookingFlow } from "@/context/BookingFlowContext";
import { hotelUrl } from "@/lib/urls";

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

// ---------------------------------------------------------------------------
// ResultCard — Vertical grid card for the browse/results page
// Phone-first responsive: image goes full-width on top, info stacks, price
// row at bottom, CTA stretches as a 44px touch target on small screens.
// ---------------------------------------------------------------------------
export default function ResultCard({
  ranked,
  index,
}: {
  ranked: RankedHotel;
  index: number;
}) {
  const hotel = ranked.hotel;
  const router = useRouter();
  const { setHotel } = useBookingFlow();
  const photo = sanitizePhoto(hotel.photo1);
  const marketRate = hotel.rates_from ? Math.round(hotel.rates_from * 1.25) : null;
  const savePercent =
    hotel.rates_from && marketRate
      ? Math.round(((marketRate - hotel.rates_from) / marketRate) * 100)
      : null;
  const savingsAmount =
    hotel.rates_from && marketRate ? marketRate - hotel.rates_from : null;

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Store selected hotel in booking flow state
    setHotel(
      hotel.hotel_name,
      sanitizePhoto(hotel.photo1),
      hotel.city_name,
      hotel.star_rating || 0,
    );
    router.push(hotelUrl(hotel));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: 0.04 + (index % 12) * 0.03,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="result-card-wrap"
    >
      <Link
        href={hotelUrl(hotel)}
        className="block group result-card-link"
        style={{ textDecoration: "none" }}
        onClick={handleCardClick}
      >
        <div
          className="card-hover result-card"
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
          {/* Image — full-width on phone, fills aspect-ratio container */}
          <div
            className="result-card-image"
            style={{ position: "relative", overflow: "hidden" }}
          >
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
            className="result-card-content"
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <h3
              className="result-card-title"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontStyle: "italic",
                color: "var(--ink)",
                lineHeight: 1.2,
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
              className="result-card-location"
              style={{
                color: "var(--ink-light)",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
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
                style={{ flexShrink: 0 }}
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {hotel.city_name}, {hotel.country}
              </span>
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
                style={{ flexShrink: 0 }}
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
              className="result-card-price-row"
              style={{
                borderTop: "1px solid var(--cream-border)",
                paddingTop: 12,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              {hotel.rates_from ? (
                <div style={{ minWidth: 0 }}>
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
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                    <span
                      className="result-card-price"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 500,
                        color: "var(--our-rate)",
                        lineHeight: 1,
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
                  flexShrink: 0,
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
                      whiteSpace: "nowrap",
                    }}
                  >
                    Save {formatCurrency(savingsAmount, hotel.rates_currency)}/night
                  </span>
                )}
              </div>
            </div>

            {/* Bottom action — full-width, 44px touch target on phone */}
            <div
              className="result-card-cta"
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "11px 14px",
                border: "1px solid var(--gold)",
                color: "var(--gold)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: "var(--font-body)",
                background: "transparent",
                minHeight: 44,
                transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              View details &rarr;
            </div>
          </div>
        </div>
      </Link>

      {/* Responsive rules — phone-first */}
      <style jsx>{`
        :global(.result-card-link) {
          display: block;
          height: 100%;
        }
        :global(.result-card) {
          border-radius: 2px;
        }

        /* Image: aspect-ratio so it scales fluidly; taller on phone for cinematic feel */
        :global(.result-card-image) {
          aspect-ratio: 5 / 4;
        }
        @media (min-width: 768px) {
          :global(.result-card-image) {
            aspect-ratio: auto;
            height: 200px;
          }
        }

        :global(.result-card-content) {
          padding: 16px 16px 16px;
        }
        @media (min-width: 768px) {
          :global(.result-card-content) {
            padding: 16px 18px;
          }
        }

        :global(.result-card-title) {
          font-size: clamp(17px, 4.4vw, 18px);
        }
        @media (min-width: 768px) {
          :global(.result-card-title) {
            font-size: 17px;
          }
        }

        :global(.result-card-location) {
          font-size: 12px;
        }
        @media (min-width: 768px) {
          :global(.result-card-location) {
            font-size: 11px;
          }
        }

        /* Price typography — bigger on phone where the card commands the screen */
        :global(.result-card-price) {
          font-size: clamp(22px, 6vw, 26px);
        }
        @media (min-width: 768px) {
          :global(.result-card-price) {
            font-size: 22px;
          }
        }

        /* Hover affordance only where pointer is precise */
        @media (hover: hover) {
          :global(.result-card-cta:hover) {
            background: var(--gold);
            color: var(--white);
          }
        }
      `}</style>
    </motion.div>
  );
}
