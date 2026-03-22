"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCompare } from "@/context/CompareContext";
import { extractAmenities } from "@/components/AmenityIcons";
import Header from "@/components/Header";

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

function starLabel(count: number | null): string {
  if (!count || count <= 0) return "—";
  return `${count}-star`;
}

function ratingLabel(avg: number | null): string {
  if (!avg || avg <= 0) return "—";
  if (avg >= 9) return "Exceptional";
  if (avg >= 8) return "Excellent";
  if (avg >= 7) return "Very Good";
  if (avg >= 6) return "Good";
  return "Pleasant";
}

// ---------------------------------------------------------------------------
// Compare Page
// ---------------------------------------------------------------------------
export default function ComparePage() {
  const { hotels, remove } = useCompare();
  const router = useRouter();

  // Not enough hotels to compare
  if (hotels.length < 2) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
        <Header />
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            padding: "120px 24px 60px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 48,
              color: "var(--cream-border)",
              marginBottom: 24,
            }}
          >
            <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
          <h1
            className="type-display-3"
            style={{ color: "var(--ink)", marginBottom: 12 }}
          >
            Compare Hotels
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--ink-light)",
              fontFamily: "var(--font-body)",
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            Select at least 2 hotels from any city page to compare them
            side by side. You can compare up to 4 hotels at once.
          </p>
          <Link
            href="/locations"
            style={{
              display: "inline-block",
              background: "var(--ink)",
              color: "var(--white)",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "12px 32px",
              textDecoration: "none",
            }}
          >
            Browse Destinations
          </Link>
        </div>
      </div>
    );
  }

  // Compute which hotel has the best value for highlighting
  const prices = hotels.map((h) => h.rates_from ?? Infinity);
  const lowestPrice = Math.min(...prices);
  const ratings = hotels.map((h) => h.rating_average ?? 0);
  const highestRating = Math.max(...ratings);
  const reviews = hotels.map((h) => h.number_of_reviews ?? 0);
  const mostReviews = Math.max(...reviews);

  // All unique amenities across all hotels
  const allAmenityKeys = new Set<string>();
  const hotelAmenities = hotels.map((h) => {
    const amenities = extractAmenities(h.overview);
    amenities.forEach((a) => allAmenityKeys.add(a.key));
    return amenities;
  });
  const amenityKeyList = Array.from(allAmenityKeys);
  // Get label for a key from the first hotel that has it
  const amenityLabels: Record<string, string> = {};
  hotelAmenities.forEach((list) =>
    list.forEach((a) => {
      amenityLabels[a.key] = a.label;
    })
  );

  const colWidth = `${Math.floor(100 / hotels.length)}%`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Header />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px 80px" }}>
        {/* Back link */}
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            color: "var(--ink-light)",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            cursor: "pointer",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to results
        </button>

        {/* Page title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="type-display-3"
          style={{ color: "var(--ink)", marginBottom: 8 }}
        >
          Compare Hotels
        </motion.h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--ink-light)",
            fontFamily: "var(--font-body)",
            marginBottom: 32,
          }}
        >
          {hotels.length} hotels selected for comparison
        </p>

        {/* ── Comparison Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            background: "var(--white)",
            border: "1px solid var(--cream-border)",
            overflow: "hidden",
          }}
        >
          {/* ── Hotel Photos + Names ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${hotels.length}, 1fr)`,
            }}
          >
            {hotels.map((hotel, i) => (
              <div
                key={hotel.hotel_id}
                style={{
                  borderRight:
                    i < hotels.length - 1
                      ? "1px solid var(--cream-border)"
                      : "none",
                  textAlign: "center",
                  padding: 0,
                }}
              >
                {/* Photo */}
                <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                  <img
                    src={sanitizePhoto(hotel.photo1)}
                    alt={hotel.hotel_name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      filter: "saturate(0.88)",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
                    }}
                  />
                  {/* Remove button */}
                  <button
                    onClick={() => remove(hotel.hotel_id)}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 28,
                      height: 28,
                      background: "rgba(26, 23, 16, 0.6)",
                      border: "none",
                      color: "#fff",
                      fontSize: 16,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                    aria-label={`Remove ${hotel.hotel_name}`}
                  >
                    &times;
                  </button>
                </div>
                {/* Name + location */}
                <div style={{ padding: "16px 16px 12px" }}>
                  <Link
                    href={`/hotel/${hotel.hotel_id}`}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 18,
                      fontWeight: 500,
                      color: "var(--ink)",
                      textDecoration: "none",
                      lineHeight: 1.3,
                    }}
                  >
                    {hotel.hotel_name}
                  </Link>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-light)",
                      fontFamily: "var(--font-body)",
                      marginTop: 4,
                    }}
                  >
                    {hotel.city_name}, {hotel.country}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Comparison Rows ── */}
          <CompareRow label="Star Rating" hotels={hotels}>
            {(hotel) => (
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)" }}>
                {hotel.star_rating && hotel.star_rating > 0 ? (
                  <>
                    <span style={{ color: "var(--gold)", letterSpacing: 2 }}>
                      {"★".repeat(Math.round(hotel.star_rating))}
                    </span>
                    <span style={{ marginLeft: 6, fontSize: 12, color: "var(--ink-light)" }}>
                      {starLabel(hotel.star_rating)}
                    </span>
                  </>
                ) : (
                  <span style={{ color: "var(--ink-light)" }}>—</span>
                )}
              </span>
            )}
          </CompareRow>

          <CompareRow label="Guest Rating" hotels={hotels}>
            {(hotel) => {
              const isBest =
                hotel.rating_average !== null &&
                hotel.rating_average === highestRating &&
                highestRating > 0;
              return (
                <div>
                  {hotel.rating_average && hotel.rating_average > 0 ? (
                    <>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          background: isBest ? "var(--gold-pale)" : "var(--cream)",
                          color: isBest ? "var(--gold)" : "var(--ink)",
                          fontFamily: "var(--font-mono)",
                          fontSize: 14,
                          fontWeight: 500,
                          border: isBest
                            ? "1px solid var(--gold)"
                            : "1px solid var(--cream-border)",
                        }}
                      >
                        {hotel.rating_average.toFixed(1)}
                      </span>
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          color: "var(--ink-light)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {ratingLabel(hotel.rating_average)}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: "var(--ink-light)", fontSize: 13 }}>—</span>
                  )}
                </div>
              );
            }}
          </CompareRow>

          <CompareRow label="Reviews" hotels={hotels}>
            {(hotel) => {
              const isBest =
                hotel.number_of_reviews !== null &&
                hotel.number_of_reviews === mostReviews &&
                mostReviews > 0;
              return (
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "var(--ink)",
                    fontWeight: isBest ? 500 : 400,
                  }}
                >
                  {hotel.number_of_reviews && hotel.number_of_reviews > 0
                    ? hotel.number_of_reviews.toLocaleString()
                    : "—"}
                </span>
              );
            }}
          </CompareRow>

          <CompareRow label="Location" hotels={hotels}>
            {(hotel) => (
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--ink-mid)",
                  lineHeight: 1.5,
                }}
              >
                {hotel.addressline1 || `${hotel.city_name}, ${hotel.country}`}
              </span>
            )}
          </CompareRow>

          <CompareRow label="Voyagr Rate" hotels={hotels} highlight>
            {(hotel) => {
              const isCheapest =
                hotel.rates_from !== null &&
                hotel.rates_from === lowestPrice &&
                lowestPrice < Infinity;
              const marketRate = hotel.rates_from
                ? Math.round(hotel.rates_from * 1.25)
                : null;
              return (
                <div>
                  {hotel.rates_from ? (
                    <>
                      {marketRate && (
                        <div
                          style={{
                            fontSize: 12,
                            textDecoration: "line-through",
                            color: "var(--market-rate)",
                            marginBottom: 4,
                          }}
                        >
                          {formatCurrency(marketRate, hotel.rates_currency)}
                        </div>
                      )}
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 22,
                          fontWeight: 500,
                          color: isCheapest ? "var(--our-rate)" : "var(--ink)",
                        }}
                      >
                        {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--ink-light)",
                          marginLeft: 4,
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        / night
                      </span>
                      {isCheapest && (
                        <div
                          style={{
                            marginTop: 6,
                            display: "inline-block",
                            background: "var(--success-soft)",
                            color: "var(--success)",
                            fontSize: 10,
                            fontWeight: 500,
                            padding: "3px 10px",
                            fontFamily: "var(--font-body)",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          Best Price
                        </div>
                      )}
                    </>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
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
                </div>
              );
            }}
          </CompareRow>

          <CompareRow label="Savings" hotels={hotels}>
            {(hotel) => {
              if (!hotel.rates_from) return <span style={{ color: "var(--ink-light)", fontSize: 13 }}>—</span>;
              const marketRate = Math.round(hotel.rates_from * 1.25);
              const savePercent = Math.round(
                ((marketRate - hotel.rates_from) / marketRate) * 100
              );
              return (
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--success)",
                  }}
                >
                  Save {savePercent}%
                </span>
              );
            }}
          </CompareRow>

          {/* ── Amenities ── */}
          {amenityKeyList.length > 0 && (
            <>
              <div
                style={{
                  padding: "12px 20px",
                  background: "var(--cream)",
                  borderTop: "1px solid var(--cream-border)",
                  borderBottom: "1px solid var(--cream-border)",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--ink-mid)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Amenities
                </span>
              </div>
              {amenityKeyList.map((key) => (
                <CompareRow key={key} label={amenityLabels[key]} hotels={hotels}>
                  {(hotel) => {
                    const hasIt = hotelAmenities[hotels.indexOf(hotel)].some(
                      (a) => a.key === key
                    );
                    return hasIt ? (
                      <svg
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--success)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--cream-border)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    );
                  }}
                </CompareRow>
              ))}
            </>
          )}

          {/* ── View Details CTA ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${hotels.length}, 1fr)`,
              borderTop: "1px solid var(--cream-border)",
            }}
          >
            {hotels.map((hotel, i) => (
              <div
                key={hotel.hotel_id}
                style={{
                  padding: "20px 16px",
                  textAlign: "center",
                  borderRight:
                    i < hotels.length - 1
                      ? "1px solid var(--cream-border)"
                      : "none",
                }}
              >
                <Link
                  href={`/hotel/${hotel.hotel_id}`}
                  style={{
                    display: "inline-block",
                    background: "var(--ink)",
                    color: "var(--white)",
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "10px 24px",
                    textDecoration: "none",
                    transition: "background 0.2s ease",
                  }}
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CompareRow — a single row in the comparison table
// ---------------------------------------------------------------------------
import type { CuratedHotel } from "@/lib/api";

function CompareRow({
  label,
  hotels,
  highlight,
  children,
}: {
  label: string;
  hotels: CuratedHotel[];
  highlight?: boolean;
  children: (hotel: CuratedHotel) => React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `140px repeat(${hotels.length}, 1fr)`,
        borderTop: "1px solid var(--cream-border)",
        background: highlight ? "var(--cream)" : "transparent",
      }}
    >
      {/* Label */}
      <div
        style={{
          padding: "14px 20px",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-light)",
          fontFamily: "var(--font-body)",
          display: "flex",
          alignItems: "center",
          borderRight: "1px solid var(--cream-border)",
        }}
      >
        {label}
      </div>
      {/* Values */}
      {hotels.map((hotel, i) => (
        <div
          key={hotel.hotel_id}
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            borderRight:
              i < hotels.length - 1
                ? "1px solid var(--cream-border)"
                : "none",
          }}
        >
          {children(hotel)}
        </div>
      ))}
    </div>
  );
}
