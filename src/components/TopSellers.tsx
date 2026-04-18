"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { CuratedHotel } from "@/lib/api";
import { computeTopSellerScores } from "@/lib/ranking";
import Carousel from "./Carousel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TopSellerHotel {
  name: string;
  city: string;
  citySlug: string;
  stars: number;
  rating: number;
  reviews: number;
  priceFrom: number;
  savePercent: number;
  score: number;
  rank: number;
  img: string;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Compute top sellers using shared ranking algorithm
// ---------------------------------------------------------------------------
export function computeTopSellers(hotels: CuratedHotel[], limit = 8): TopSellerHotel[] {
  const scored = computeTopSellerScores(hotels, limit);

  return scored.map((item, idx) => ({
    name: item.hotel.hotel_name,
    city: `${item.hotel.city_name}, ${item.hotel.country}`,
    citySlug: item.hotel.city_slug,
    stars: item.hotel.star_rating || 4,
    rating: item.hotel.rating_average || 8.0,
    reviews: item.reviews,
    priceFrom: item.hotel.rates_from || 0,
    savePercent: item.savePercent,
    score: Math.round(item.score * 100),
    rank: idx + 1,
    img: sanitizePhoto(item.hotel.photo1),
    tags: extractTags(item.hotel.overview),
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80";

function sanitizePhoto(url: string | null): string {
  if (!url) return FALLBACK_IMAGE;
  let src = url.startsWith("http://") ? url.replace("http://", "https://") : url;
  if (!src.startsWith("https://"))
    src = `https://photos.hotelbeds.com/giata/${src}`;
  return src;
}

function extractTags(overview: string | null): string[] {
  if (!overview) return ["Hotel"];
  const tags: string[] = [];
  const keywords: [string, RegExp][] = [
    ["Pool", /pool/i],
    ["Spa", /spa|massage/i],
    ["Gym", /fitness|gym/i],
    ["Beach", /beach|shoreline/i],
    ["Restaurant", /restaurant|dining/i],
    ["Wi-Fi", /wi-?fi/i],
    ["Bar", /bar|nightclub/i],
    ["Room Service", /room service/i],
  ];
  for (const [tag, regex] of keywords) {
    if (regex.test(overview)) tags.push(tag);
    if (tags.length >= 3) break;
  }
  return tags.length > 0 ? tags : ["Hotel"];
}

function formatReviews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ---------------------------------------------------------------------------
// Medal colors for top 3
// ---------------------------------------------------------------------------
const MEDAL_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "#C9A84C", text: "#fdfaf5", label: "Best Seller" },
  2: { bg: "#8a8a8a", text: "#fdfaf5", label: "Runner Up" },
  3: { bg: "#a0714f", text: "#fdfaf5", label: "Top Pick" },
};

// ---------------------------------------------------------------------------
// Top Seller Card
// ---------------------------------------------------------------------------
function TopSellerCard({ hotel }: { hotel: TopSellerHotel }) {
  const medal = MEDAL_COLORS[hotel.rank];

  return (
    <Link href={`/city/${hotel.citySlug}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        className="card-hover"
        style={{
          background: "var(--white)",
          border: hotel.rank <= 3 ? "1px solid var(--gold-light)" : "1px solid var(--cream-border)",
          overflow: "hidden",
          cursor: "pointer",
          position: "relative",
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
          <img
            className="card-img"
            src={hotel.img}
            alt={hotel.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: "saturate(0.88)",
            }}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />

          {/* Rank badge */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: medal ? medal.bg : "var(--ink)",
              color: medal ? medal.text : "var(--cream)",
              fontSize: "11px",
              fontWeight: 700,
              padding: "5px 12px",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-mono)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "13px" }}>#{hotel.rank}</span>
            {medal && (
              <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.9 }}>
                {medal.label}
              </span>
            )}
          </div>

          {/* Rating badge */}
          {hotel.rating >= 8.5 && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "var(--gold)",
                color: "var(--white)",
                fontSize: "12px",
                fontWeight: 600,
                padding: "4px 10px",
                fontFamily: "var(--font-mono)",
              }}
            >
              {hotel.rating.toFixed(1)}
            </div>
          )}

          {/* Perks badge */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              background: "var(--emerald, #10B981)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 500,
              padding: "4px 10px",
              letterSpacing: "0.04em",
            }}
          >
            Exclusive Perks
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "18px 20px 22px" }}>
          <div
            style={{
              color: "var(--gold)",
              fontSize: "10px",
              letterSpacing: "2px",
              marginBottom: "6px",
            }}
          >
            {"★".repeat(hotel.stars)}
          </div>
          <h3
            className="type-heading-3"
            style={{ color: "var(--ink)", marginBottom: "4px", fontSize: "16px" }}
          >
            {hotel.name}
          </h3>
          <p
            style={{
              fontSize: "12px",
              color: "var(--ink-light)",
              letterSpacing: "0.04em",
              marginBottom: "10px",
            }}
          >
            {hotel.city}
          </p>

          {/* Bookings + Score bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                color: "var(--ink-mid)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {formatReviews(hotel.reviews)} booked
            </div>
            <div
              style={{
                flex: 1,
                height: "4px",
                background: "var(--cream)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${hotel.score}%`,
                  height: "100%",
                  background: "var(--gold)",
                  borderRadius: "2px",
                  transition: "width 0.8s ease",
                }}
              />
            </div>
          </div>

          {/* Tags */}
          <div
            style={{
              display: "flex",
              gap: "5px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            {hotel.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "9px",
                  padding: "3px 8px",
                  background: "var(--cream)",
                  color: "var(--ink-mid)",
                  border: "1px solid var(--cream-border)",
                  letterSpacing: "0.04em",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Preferred access footer */}
          <div
            style={{
              borderTop: "1px solid var(--cream-border)",
              paddingTop: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--emerald, #10B981)",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Preferred Access
            </div>
            <span
              className="card-arrow"
              style={{
                fontSize: "11px",
                color: "var(--gold)",
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              View &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// TopSellers Section
// ---------------------------------------------------------------------------
export default function TopSellers({ hotels }: { hotels: TopSellerHotel[] }) {
  if (hotels.length === 0) return null;

  return (
    <section
      className="section-top-sellers"
      style={{
        padding: "80px 60px",
        background: "var(--cream)",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="section-header"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "48px",
          }}
        >
          <div>
            <div className="type-eyebrow" style={{ marginBottom: "8px" }}>
              Most Loved
            </div>
            <h2 className="type-display-2" style={{ color: "var(--ink)" }}>
              Guest{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>favourites</em>
            </h2>
            <p
              className="type-body-sm"
              style={{
                color: "var(--ink-light)",
                marginTop: "12px",
                maxWidth: "480px",
              }}
            >
              The hotels our members return to again and again — with handpicked perks on every stay.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
              color: "var(--ink-light)",
              letterSpacing: "0.04em",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--gold)",
                display: "inline-block",
              }}
            />
            Ranked by member favourites
          </div>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Carousel ariaLabel="Guest favourites" showProgressBar>
            {hotels.map((hotel) => (
              <TopSellerCard key={`${hotel.name}-${hotel.citySlug}`} hotel={hotel} />
            ))}
          </Carousel>
        </motion.div>
      </div>
    </section>
  );
}
