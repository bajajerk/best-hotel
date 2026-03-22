"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { CuratedHotel } from "@/lib/api";

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
// Scoring: weighted combination of bookings (reviews) + savings
// ---------------------------------------------------------------------------
// Weights: 60% bookings (reviews), 40% savings
const BOOKING_WEIGHT = 0.6;
const SAVINGS_WEIGHT = 0.4;

export function computeTopSellers(hotels: CuratedHotel[], limit = 8): TopSellerHotel[] {
  const eligible = hotels.filter(
    (h) => h.rates_from && h.rates_from > 0 && h.number_of_reviews && h.number_of_reviews > 0
  );

  if (eligible.length === 0) return [];

  // Normalize values to 0–1 range
  const maxReviews = Math.max(...eligible.map((h) => h.number_of_reviews || 0));
  const maxSavePercent = 40; // cap at 40% since savings are typically 20-40%

  const scored = eligible.map((h) => {
    const reviews = h.number_of_reviews || 0;
    const marketRate = Math.round((h.rates_from || 0) * 1.25);
    const savePercent =
      h.rates_from && marketRate
        ? Math.round(((marketRate - h.rates_from) / marketRate) * 100)
        : 20;

    const normalizedBookings = reviews / maxReviews;
    const normalizedSavings = Math.min(savePercent, maxSavePercent) / maxSavePercent;
    const score = BOOKING_WEIGHT * normalizedBookings + SAVINGS_WEIGHT * normalizedSavings;

    return {
      hotel: h,
      score,
      reviews,
      savePercent,
      marketRate,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item, idx) => ({
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
  1: { bg: "#b8955a", text: "#fdfaf5", label: "Best Seller" },
  2: { bg: "#8a8a8a", text: "#fdfaf5", label: "Runner Up" },
  3: { bg: "#a0714f", text: "#fdfaf5", label: "Top Pick" },
};

// ---------------------------------------------------------------------------
// Chevron icons
// ---------------------------------------------------------------------------
function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

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

          {/* Savings badge */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              background: "var(--success)",
              color: "var(--cream)",
              fontSize: "10px",
              fontWeight: 500,
              padding: "4px 10px",
              letterSpacing: "0.04em",
            }}
          >
            Save up to {hotel.savePercent}%
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

          {/* Price */}
          <div
            style={{
              borderTop: "1px solid var(--cream-border)",
              paddingTop: "14px",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--ink-light)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                From
              </span>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "22px",
                  fontWeight: 500,
                  color: "var(--our-rate)",
                  lineHeight: 1.2,
                }}
              >
                &#8377;{hotel.priceFrom.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "var(--ink-light)" }}>
                per night
              </span>
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
// Carousel hook
// ---------------------------------------------------------------------------
function useCarousel(itemCount: number, visibleCount: number = 4) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const maxIdx = Math.max(0, itemCount - visibleCount);

  const scrollTo = useCallback((idx: number) => {
    const track = trackRef.current;
    if (!track || !track.children[0]) return;
    const child = track.children[0] as HTMLElement;
    const gap = 20;
    const cardWidth = child.offsetWidth + gap;
    track.scrollTo({ left: cardWidth * idx, behavior: "smooth" });
    setActiveIdx(idx);
  }, []);

  const prev = useCallback(() => {
    scrollTo(Math.max(0, activeIdx - 1));
  }, [activeIdx, scrollTo]);

  const next = useCallback(() => {
    scrollTo(Math.min(maxIdx, activeIdx + 1));
  }, [activeIdx, maxIdx, scrollTo]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          if (!track.children[0]) { ticking = false; return; }
          const child = track.children[0] as HTMLElement;
          const gap = 20;
          const cardWidth = child.offsetWidth + gap;
          const newIdx = Math.round(track.scrollLeft / cardWidth);
          setActiveIdx(Math.min(newIdx, maxIdx));
          ticking = false;
        });
      }
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [maxIdx]);

  const dotCount = maxIdx + 1;
  return { trackRef, activeIdx, dotCount, prev, next, scrollTo, maxIdx };
}

// ---------------------------------------------------------------------------
// TopSellers Section
// ---------------------------------------------------------------------------
export default function TopSellers({ hotels }: { hotels: TopSellerHotel[] }) {
  const { trackRef, activeIdx, dotCount, prev, next, scrollTo, maxIdx } =
    useCarousel(hotels.length, 4);

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
              Top Sellers
            </div>
            <h2 className="type-display-2" style={{ color: "var(--ink)" }}>
              Most{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>booked</em>
            </h2>
            <p
              className="type-body-sm"
              style={{
                color: "var(--ink-light)",
                marginTop: "12px",
                maxWidth: "480px",
              }}
            >
              Ranked by bookings and savings — the hotels our travellers choose again and again.
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
            Weighted by bookings &amp; savings
          </div>
        </motion.div>

        {/* Carousel */}
        <motion.div
          className="carousel-container"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <button className="carousel-btn carousel-btn-prev" onClick={prev} disabled={activeIdx === 0} aria-label="Previous">
            <ChevronLeft />
          </button>
          <button className="carousel-btn carousel-btn-next" onClick={next} disabled={activeIdx >= maxIdx} aria-label="Next">
            <ChevronRight />
          </button>

          <div className="carousel-track" ref={trackRef}>
            {hotels.map((hotel) => (
              <div key={`${hotel.name}-${hotel.citySlug}`} style={{ width: "calc(25% - 15px)" }}>
                <TopSellerCard hotel={hotel} />
              </div>
            ))}
          </div>

          {dotCount > 1 && (
            <div className="carousel-dots">
              {Array.from({ length: dotCount }).map((_, i) => (
                <button
                  key={i}
                  className={`carousel-dot${i === activeIdx ? " active" : ""}`}
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
