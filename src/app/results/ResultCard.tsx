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
// Inline SVG star — Lucide-style 1.5-stroke, champagne fill.
// Replaces the Unicode "★" glyphs used previously on the image overlay.
// ---------------------------------------------------------------------------
function StarIcon({ size = 11 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ResultCard — Dark luxe vertical card.
// Solid luxe-black-2 background, champagne hairline top edge (foil line),
// italic Playfair hotel name, inline-SVG stars, champagne tabular-nums price.
// Preserves the responsive 5/4 cinematic image and 44px CTA from the
// mobile pass.
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
  // No fake MRP. Earlier this card synthesised a 25% markup as the "market
  // rate" and rendered a Save 20% badge on every card — the exact drip-
  // pricing pattern /about disavows ("No drip-pricing tricks at checkout").
  // Until backend wiring surfaces a real Agoda-B2C MRP on /api/hotels/search,
  // we render only the rates_from price with no comparison. When real MRP
  // lands, re-introduce the savings UI here keyed off `hotel.mrp.agoda_rate`.

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
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
        <div className="result-card">
          {/* Champagne foil hairline on the top edge */}
          <span className="result-card-foil" aria-hidden />

          {/* Image — cinematic 5/4 on phone, fixed height on desktop */}
          <div className="result-card-image">
            <img
              src={photo}
              alt={hotel.hotel_name}
              loading="lazy"
              className="result-card-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
              }}
            />

            {/* Soft bottom vignette to seat the star overlay on dark ground */}
            <span className="result-card-image-vignette" aria-hidden />

            {/* Value badge */}
            {ranked.valueScore >= 75 && (
              <div className="result-card-value-badge">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {ranked.valueScore >= 85 ? "Top Pick" : "Great Value"}
              </div>
            )}

            {/* Save badge intentionally removed — we don't fabricate savings. */}

            {/* Star rating overlay — inline SVG stars on a blurred dark plate */}
            {hotel.star_rating && hotel.star_rating > 0 && (
              <div
                className="result-card-stars"
                style={{ color: "var(--luxe-champagne)" }}
                aria-label={`${hotel.star_rating} star hotel`}
              >
                {Array.from({ length: hotel.star_rating }).map((_, i) => (
                  <StarIcon key={i} size={10} />
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="result-card-content">
            <h3 className="result-card-title">{hotel.hotel_name}</h3>

            <p className="result-card-location">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, opacity: 0.7 }}
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {hotel.city_name}, {hotel.country}
              </span>
            </p>

            {/* Rating + reviews */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {hotel.rating_average && hotel.rating_average > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "3px 8px",
                    background:
                      hotel.rating_average >= 8.5
                        ? "var(--luxe-champagne-soft)"
                        : "transparent",
                    color:
                      hotel.rating_average >= 8.5
                        ? "var(--luxe-champagne)"
                        : "var(--luxe-soft-white-70)",
                    border:
                      hotel.rating_average >= 8.5
                        ? "1px solid var(--luxe-champagne-line)"
                        : "1px solid var(--luxe-hairline-strong)",
                    fontFamily: "var(--font-mono)",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "0.04em",
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
                    padding: "3px 8px",
                    background: "transparent",
                    color: "var(--luxe-soft-white-50)",
                    border: "1px solid var(--luxe-hairline-strong)",
                    fontFamily: "var(--font-mono)",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "0.04em",
                  }}
                >
                  {hotel.number_of_reviews.toLocaleString()} reviews
                </span>
              )}
            </div>

            {/* Amenities */}
            {hotel.overview && (
              <div style={{ marginBottom: 12 }}>
                <AmenityChips overview={hotel.overview} max={3} />
              </div>
            )}

            {/* Instant confirmation badge — desaturated, dark-luxe friendly */}
            <div className="result-card-instant">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
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
            <div className="result-card-price-row">
              {hotel.rates_from ? (
                <div style={{ minWidth: 0 }}>
                  <div className="result-card-price-eyebrow">Voyagr Rate</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                    <span className="result-card-price">
                      {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                    </span>
                    <span className="result-card-price-pernight">/night</span>
                  </div>
                </div>
              ) : (
                <span className="result-card-price-eyebrow">Call for rates</span>
              )}
            </div>

            {/* Bottom action — champagne outline, 44px touch target on phone */}
            <div className="result-card-cta">
              View details &rarr;
            </div>
          </div>
        </div>
      </Link>

      {/* Responsive + dark luxe styles */}
      <style jsx>{`
        :global(.result-card-link) {
          display: block;
          height: 100%;
        }
        :global(.result-card) {
          position: relative;
          background: var(--luxe-black-2);
          border: 1px solid var(--luxe-hairline);
          overflow: hidden;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          height: 100%;
          border-radius: 2px;
          transition: border-color 0.2s ease, transform 0.3s ease, box-shadow 0.3s ease;
        }
        @media (hover: hover) {
          :global(.result-card-link:hover .result-card) {
            border-color: var(--luxe-champagne-line);
            transform: translateY(-2px);
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.4);
          }
          :global(.result-card-link:hover .result-card-img) {
            transform: scale(1.04);
          }
        }

        /* Champagne foil hairline on the top edge */
        :global(.result-card-foil) {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--luxe-champagne) 18%,
            var(--luxe-champagne) 82%,
            transparent 100%
          );
          opacity: 0.85;
          z-index: 2;
          pointer-events: none;
        }

        /* Image — cinematic 5/4 on phone */
        :global(.result-card-image) {
          position: relative;
          overflow: hidden;
          background: #0a0907;
          aspect-ratio: 5 / 4;
        }
        @media (min-width: 768px) {
          :global(.result-card-image) {
            aspect-ratio: auto;
            height: 220px;
          }
        }
        :global(.result-card-img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(0.92) brightness(0.96);
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        :global(.result-card-image-vignette) {
          position: absolute;
          inset: auto 0 0 0;
          height: 38%;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(12, 11, 10, 0.55) 100%
          );
          pointer-events: none;
        }

        /* Value badge — dark plate w/ champagne accent */
        :global(.result-card-value-badge) {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(12, 11, 10, 0.78);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          color: var(--luxe-champagne);
          border: 1px solid var(--luxe-champagne-line);
          font-size: 9.5px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 5px 9px;
          font-family: var(--font-mono);
          display: flex;
          align-items: center;
          gap: 5px;
          z-index: 2;
        }

        /* Star overlay — inline SVGs on a glass plate */
        :global(.result-card-stars) {
          position: absolute;
          bottom: 12px;
          left: 12px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 4px 8px;
          background: rgba(12, 11, 10, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid var(--luxe-champagne-line);
          z-index: 2;
        }

        /* Card content */
        :global(.result-card-content) {
          padding: 18px 18px 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        @media (min-width: 768px) {
          :global(.result-card-content) {
            padding: 20px 20px 20px;
          }
        }

        :global(.result-card-title) {
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 400;
          color: var(--luxe-soft-white);
          line-height: 1.18;
          margin: 0 0 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          font-size: clamp(17px, 4.4vw, 19px);
          letter-spacing: -0.005em;
        }
        @media (min-width: 768px) {
          :global(.result-card-title) {
            font-size: 18px;
          }
        }

        :global(.result-card-location) {
          color: var(--luxe-soft-white-70);
          margin: 0 0 12px;
          display: flex;
          align-items: center;
          gap: 5px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          font-family: var(--font-body);
          letter-spacing: 0.01em;
        }
        @media (min-width: 768px) {
          :global(.result-card-location) {
            font-size: 11.5px;
          }
        }

        :global(.result-card-instant) {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 500;
          color: var(--luxe-champagne);
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 14px;
          opacity: 0.85;
        }

        /* Price row */
        :global(.result-card-price-row) {
          border-top: 1px solid var(--luxe-hairline-strong);
          padding-top: 14px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
        }
        :global(.result-card-price-eyebrow) {
          font-size: 9.5px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--luxe-champagne);
          font-family: var(--font-mono);
          margin-bottom: 4px;
        }
        :global(.result-card-price) {
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 400;
          color: var(--luxe-champagne);
          line-height: 1;
          font-variant-numeric: tabular-nums;
          font-size: clamp(24px, 6.4vw, 28px);
          letter-spacing: -0.01em;
        }
        @media (min-width: 768px) {
          :global(.result-card-price) {
            font-size: 24px;
          }
        }
        :global(.result-card-price-pernight) {
          font-size: 10.5px;
          color: var(--luxe-soft-white-50);
          letter-spacing: 0.04em;
          font-family: var(--font-mono);
        }

        /* CTA */
        :global(.result-card-cta) {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 11px 14px;
          border: 1px solid var(--luxe-champagne);
          color: var(--luxe-champagne);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-family: var(--font-mono);
          background: transparent;
          min-height: 44px;
          transition: background 0.18s ease, color 0.18s ease;
        }
        @media (hover: hover) {
          :global(.result-card-link:hover .result-card-cta) {
            background: var(--luxe-champagne);
            color: var(--luxe-black);
          }
        }
      `}</style>
    </motion.div>
  );
}
