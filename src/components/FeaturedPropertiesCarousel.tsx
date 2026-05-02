"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { HotelCardData } from "@/components/HotelCard";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80";

function safeImageSrc(url: string): string {
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

// ---------------------------------------------------------------------------
// Auto-play interval (ms)
// ---------------------------------------------------------------------------
const AUTO_PLAY_INTERVAL = 5000;

// ---------------------------------------------------------------------------
// Featured Properties Carousel
// ---------------------------------------------------------------------------
export default function FeaturedPropertiesCarousel({
  properties,
}: {
  properties: HotelCardData[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = properties.length;

  const goTo = useCallback(
    (idx: number) => {
      setActiveIdx(((idx % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => goTo(activeIdx + 1), [activeIdx, goTo]);
  const prev = useCallback(() => goTo(activeIdx - 1), [activeIdx, goTo]);

  // Auto-play
  useEffect(() => {
    if (paused || count <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % count);
    }, AUTO_PLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, count]);

  if (count === 0) return null;

  const current = properties[activeIdx];

  return (
    <div
      className="featured-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: "relative",
        width: "100%",
        height: "520px",
        overflow: "hidden",
        background: "var(--ink)",
      }}
    >
      {/* Background image with crossfade */}
      <AnimatePresence mode="sync">
        <motion.img
          key={`bg-${activeIdx}`}
          src={safeImageSrc(current.img)}
          alt={current.name}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(0.85) brightness(0.65)",
          }}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
        />
      </AnimatePresence>

      {/* Gradient overlays */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(26,23,16,0.85) 0%, rgba(26,23,16,0.2) 50%, rgba(26,23,16,0.4) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Content overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 60px 60px",
          maxWidth: "1400px",
          margin: "0 auto",
          left: 0,
          right: 0,
        }}
      >
        {/* Featured badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${activeIdx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <div
              style={{
                display: "inline-block",
                background: "var(--gold)",
                color: "var(--ink)",
                fontSize: "9px",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "5px 14px",
                marginBottom: "20px",
              }}
            >
              Featured Property
            </div>

            {/* Stars */}
            <div
              style={{
                color: "var(--gold-light)",
                fontSize: "12px",
                letterSpacing: "3px",
                marginBottom: "8px",
              }}
            >
              {"★".repeat(current.stars)}
            </div>

            {/* Hotel name */}
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                fontWeight: 400,
                color: "var(--white)",
                lineHeight: 1.2,
                marginBottom: "6px",
                maxWidth: "600px",
              }}
            >
              {current.name}
            </h3>

            {/* City */}
            <p
              style={{
                fontSize: "14px",
                color: "rgba(245,240,232,0.7)",
                letterSpacing: "0.06em",
                marginBottom: "20px",
              }}
            >
              {current.city}
            </p>

            {/* Tags + pricing row */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              {/* Left: tags */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {current.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "10px",
                      padding: "4px 10px",
                      background: "rgba(245,240,232,0.12)",
                      color: "rgba(245,240,232,0.8)",
                      border: "1px solid rgba(245,240,232,0.15)",
                      letterSpacing: "0.04em",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
                {current.rating >= 8.5 && (
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "4px 10px",
                      background: "var(--gold)",
                      color: "var(--ink)",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                    }}
                  >
                    {current.rating.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Right: pricing + CTA */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "20px",
                }}
              >
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "rgba(245,240,232,0.5)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: "2px",
                    }}
                  >
                    From
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "28px",
                      fontWeight: 500,
                      color: "var(--white)",
                      lineHeight: 1.1,
                    }}
                  >
                    &#8377;{current.priceFrom.toLocaleString("en-IN")}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "rgba(245,240,232,0.5)",
                    }}
                  >
                    per night
                  </div>
                </div>

                {current.savePercent > 0 && (
                  <div
                    style={{
                      background: "var(--success)",
                      color: "var(--cream)",
                      fontSize: "11px",
                      fontWeight: 500,
                      padding: "6px 14px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Save {current.savePercent}%
                  </div>
                )}

                <Link
                  href={`/hotel/${current.hotelId}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 24px",
                    background: "var(--gold)",
                    color: "var(--ink)",
                    textDecoration: "none",
                    fontSize: "11px",
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    transition: "background 0.2s",
                  }}
                >
                  View
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous property"
            className="featured-carousel-arrow"
            style={{
              position: "absolute",
              top: "50%",
              left: "20px",
              transform: "translateY(-50%)",
              width: "44px",
              height: "44px",
              background: "rgba(245,240,232,0.1)",
              border: "1px solid rgba(245,240,232,0.2)",
              color: "rgba(245,240,232,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.25s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(245,240,232,0.2)";
              e.currentTarget.style.borderColor = "rgba(245,240,232,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(245,240,232,0.1)";
              e.currentTarget.style.borderColor = "rgba(245,240,232,0.2)";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next property"
            className="featured-carousel-arrow"
            style={{
              position: "absolute",
              top: "50%",
              right: "20px",
              transform: "translateY(-50%)",
              width: "44px",
              height: "44px",
              background: "rgba(245,240,232,0.1)",
              border: "1px solid rgba(245,240,232,0.2)",
              color: "rgba(245,240,232,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.25s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(245,240,232,0.2)";
              e.currentTarget.style.borderColor = "rgba(245,240,232,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(245,240,232,0.1)";
              e.currentTarget.style.borderColor = "rgba(245,240,232,0.2)";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        </>
      )}

      {/* Progress dots + counter */}
      {count > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            right: "60px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* Counter */}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "rgba(245,240,232,0.5)",
              letterSpacing: "0.05em",
            }}
          >
            {String(activeIdx + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>

          {/* Dots */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {properties.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to property ${i + 1}`}
                style={{
                  width: i === activeIdx ? "24px" : "8px",
                  height: "3px",
                  background:
                    i === activeIdx
                      ? "var(--gold)"
                      : "rgba(245,240,232,0.3)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Auto-play indicator */}
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: paused ? "rgba(245,240,232,0.3)" : "var(--gold)",
              transition: "background 0.3s",
            }}
            title={paused ? "Paused" : "Auto-playing"}
          />
        </div>
      )}

      {/* Thumbnail strip */}
      {count > 1 && (
        <div
          className="featured-carousel-thumbs"
          style={{
            position: "absolute",
            top: "24px",
            right: "60px",
            display: "flex",
            gap: "8px",
          }}
        >
          {properties.map((prop, i) => (
            <button
              key={`thumb-${i}`}
              onClick={() => goTo(i)}
              aria-label={`View ${prop.name}`}
              style={{
                width: "56px",
                height: "40px",
                overflow: "hidden",
                border:
                  i === activeIdx
                    ? "2px solid var(--gold)"
                    : "1px solid rgba(245,240,232,0.2)",
                cursor: "pointer",
                opacity: i === activeIdx ? 1 : 0.5,
                transition: "all 0.3s ease",
                padding: 0,
                background: "none",
              }}
            >
              <img
                src={safeImageSrc(prop.img)}
                alt={prop.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter: "saturate(0.8)",
                }}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
