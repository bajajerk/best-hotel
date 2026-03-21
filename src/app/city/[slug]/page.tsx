"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { fetchCityCurations, CuratedHotel } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Category = "singles" | "couples" | "families";

// ---------------------------------------------------------------------------
// CSS Variables — Voyagr Light Theme
// ---------------------------------------------------------------------------
const cssVars: Record<string, string> = {
  "--cream": "#f5f0e8",
  "--cream-deep": "#ede7d9",
  "--cream-border": "#ddd5c3",
  "--ink": "#1a1710",
  "--ink-mid": "#3d3929",
  "--ink-light": "#7a7465",
  "--gold": "#b8955a",
  "--gold-light": "#d4ae78",
  "--gold-pale": "#f0e6d0",
  "--white": "#fdfaf5",
  "--success": "#4a7c59",
  "--serif": "'Cormorant Garamond', Georgia, serif",
  "--sans": "'DM Sans', sans-serif",
};

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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
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

function slugToName(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Category labels
// ---------------------------------------------------------------------------
const CATEGORY_LABELS: Record<Category, string> = {
  singles: "for singles",
  couples: "for couples",
  families: "for families",
};

// ---------------------------------------------------------------------------
// Skeleton — Horizontal card shimmer
// ---------------------------------------------------------------------------
function CardSkeleton() {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        display: "grid",
        gridTemplateColumns: "240px 1fr auto",
        overflow: "hidden",
        height: 180,
      }}
    >
      <div className="shimmer" style={{ height: "100%" }} />
      <div style={{ padding: "20px 24px" }}>
        <div className="shimmer" style={{ height: 12, width: 60, marginBottom: 10 }} />
        <div className="shimmer" style={{ height: 20, width: "70%", marginBottom: 8 }} />
        <div className="shimmer" style={{ height: 12, width: "40%", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 6 }}>
          <div className="shimmer" style={{ height: 20, width: 60 }} />
          <div className="shimmer" style={{ height: 20, width: 80 }} />
        </div>
      </div>
      <div
        style={{
          padding: 20,
          borderLeft: "1px solid var(--cream-border)",
          minWidth: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div className="shimmer" style={{ height: 12, width: 80 }} />
        <div className="shimmer" style={{ height: 28, width: 100 }} />
        <div className="shimmer" style={{ height: 24, width: 60 }} />
      </div>
    </div>
  );
}

function CardSkeletonMobile() {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        overflow: "hidden",
      }}
    >
      <div className="shimmer" style={{ height: 200, width: "100%" }} />
      <div style={{ padding: 16 }}>
        <div className="shimmer" style={{ height: 18, width: "70%", marginBottom: 8 }} />
        <div className="shimmer" style={{ height: 12, width: "40%", marginBottom: 16 }} />
        <div className="shimmer" style={{ height: 28, width: "50%" }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal Hotel Result Card (Voyagr style)
// ---------------------------------------------------------------------------
function HotelResultCard({ hotel, index }: { hotel: CuratedHotel; index: number }) {
  const photo = sanitizePhoto(hotel.photo1);
  const marketRate = hotel.rates_from ? Math.round(hotel.rates_from * 1.25) : null;
  const savePercent = hotel.rates_from && marketRate ? Math.round(((marketRate - hotel.rates_from) / marketRate) * 100) : null;

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
          className="hidden md:grid"
          style={{
            background: "var(--white)",
            border: "1px solid var(--cream-border)",
            gridTemplateColumns: "240px 1fr auto",
            overflow: "hidden",
            transition: "box-shadow 0.2s",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(26,23,16,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
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
                transition: "transform 0.6s ease",
              }}
              className="group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
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
                  fontFamily: "var(--sans)",
                }}
              >
                Preferred
              </div>
            )}
          </div>

          {/* Middle: Details */}
          <div style={{ padding: "20px 24px" }}>
            {/* Star dots */}
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

            {/* Hotel name */}
            <h3
              style={{
                fontFamily: "var(--serif)",
                fontSize: 20,
                fontWeight: 400,
                color: "var(--ink)",
                marginBottom: 4,
                lineHeight: 1.2,
              }}
            >
              {hotel.hotel_name}
            </h3>

            {/* Location */}
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

            {/* Tags */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {hotel.rating_average && hotel.rating_average > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "3px 10px",
                    background: hotel.rating_average >= 8.5 ? "var(--gold-pale)" : "var(--cream)",
                    color: hotel.rating_average >= 8.5 ? "var(--gold)" : "var(--ink-mid)",
                    border: "1px solid var(--cream-border)",
                    fontFamily: "var(--sans)",
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
                    fontFamily: "var(--sans)",
                  }}
                >
                  {hotel.number_of_reviews.toLocaleString()} reviews
                </span>
              )}
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
            {/* Market rate */}
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
                    color: "var(--ink-light)",
                  }}
                >
                  {formatCurrency(marketRate, hotel.rates_currency)}
                </div>
              </div>
            ) : (
              <div />
            )}

            {/* Voyagr rate */}
            {hotel.rates_from ? (
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                    fontFamily: "var(--sans)",
                  }}
                >
                  Voyagr Rate
                </div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 28,
                    fontWeight: 500,
                    color: "var(--ink)",
                    lineHeight: 1.1,
                  }}
                >
                  {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-light)",
                  }}
                >
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
                  fontFamily: "var(--sans)",
                }}
              >
                Call for rates
              </div>
            )}

            {/* Save badge */}
            {savePercent && savePercent > 0 ? (
              <div
                style={{
                  background: "var(--gold-pale)",
                  color: "var(--success)",
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "4px 10px",
                  textAlign: "center",
                  fontFamily: "var(--sans)",
                }}
              >
                Save {savePercent}%
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* Mobile: stacked card */}
        <div
          className="md:hidden"
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
                  fontFamily: "var(--sans)",
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
                  fontFamily: "var(--sans)",
                }}
              >
                Save {savePercent}%
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
              style={{
                fontFamily: "var(--serif)",
                fontSize: 18,
                fontWeight: 400,
                color: "var(--ink)",
                marginBottom: 4,
              }}
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

            {/* Price row */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              {hotel.rates_from ? (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--gold)",
                      fontFamily: "var(--sans)",
                      marginBottom: 2,
                    }}
                  >
                    Voyagr Rate
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: 24,
                        fontWeight: 500,
                        color: "var(--ink)",
                      }}
                    >
                      {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--ink-light)" }}>per night</span>
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
                    fontFamily: "var(--sans)",
                  }}
                >
                  Call for rates
                </span>
              )}
              {marketRate && hotel.rates_from && (
                <span
                  style={{
                    fontSize: 12,
                    textDecoration: "line-through",
                    color: "var(--ink-light)",
                  }}
                >
                  {formatCurrency(marketRate, hotel.rates_currency)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function CityPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [activeCategory, setActiveCategory] = useState<Category>("couples");
  const [curations, setCurations] = useState<Record<Category, CuratedHotel[]>>({
    singles: [],
    couples: [],
    families: [],
  });
  const [cityName, setCityName] = useState("");
  const [cityCountry, setCityCountry] = useState("");
  const [tagline, setTagline] = useState("");
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchCityCurations(slug)
      .then((data) => {
        setCurations(data.curations as Record<Category, CuratedHotel[]>);
        setCityName(data.city.city_name);
        setCityCountry(data.city.country);
        setTagline(data.city.tagline);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const hotels = curations[activeCategory] || [];
  const displayName = cityName || slugToName(slug);
  const categoryKeys: Category[] = ["singles", "couples", "families"];

  return (
    <div
      style={{
        ...cssVars,
        background: "var(--cream)",
        color: "var(--ink)",
        fontFamily: "var(--sans)",
        fontSize: 14,
        lineHeight: 1.6,
        minHeight: "100vh",
        overflowX: "hidden",
      } as React.CSSProperties}
    >
      {/* ================================================================
          STICKY NAV — frosted cream glass
          ================================================================ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrolled ? "rgba(245, 240, 232, 0.92)" : "rgba(245, 240, 232, 0.7)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: scrolled ? "1px solid var(--cream-border)" : "1px solid transparent",
          height: 60,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          justifyContent: "space-between",
          transition: "all 0.3s ease",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontFamily: "var(--serif)",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: "var(--ink)",
              fontStyle: "italic",
            }}
          >
            <span style={{ color: "var(--gold)" }}>V</span>oyagr
          </span>
        </Link>

        {/* Nav links */}
        <div
          className="hidden md:flex"
          style={{
            gap: 32,
            alignItems: "center",
          }}
        >
          {["Destinations", "Rates", "About"].map((label) => (
            <span
              key={label}
              style={{
                fontFamily: "var(--sans)",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-mid)",
                cursor: "pointer",
                transition: "color 0.2s",
                paddingBottom: 2,
                borderBottom: "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--gold)";
                (e.currentTarget as HTMLElement).style.borderBottomColor = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--ink-mid)";
                (e.currentTarget as HTMLElement).style.borderBottomColor = "transparent";
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Right: CTA */}
        <a
          href="tel:+919876543210"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "var(--ink)",
            color: "var(--cream)",
            border: "none",
            padding: "10px 24px",
            fontFamily: "var(--sans)",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.25s",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--gold)";
            (e.currentTarget as HTMLElement).style.color = "var(--ink)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--ink)";
            (e.currentTarget as HTMLElement).style.color = "var(--cream)";
          }}
        >
          Book Now
        </a>
      </nav>

      {/* ================================================================
          CITY HERO — breadcrumb, large italic serif name, tagline
          ================================================================ */}
      <header
        style={{
          paddingTop: 100,
          paddingBottom: 0,
          paddingLeft: 60,
          paddingRight: 60,
          background: "var(--white)",
          borderBottom: "1px solid var(--cream-border)",
        }}
        className="!px-6 md:!px-[60px]"
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Breadcrumb */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{
                fontSize: 12,
                color: "var(--ink-light)",
                marginBottom: 16,
              }}
            >
              <Link
                href="/"
                style={{
                  color: "var(--ink)",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--gold)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--ink)";
                }}
              >
                Home
              </Link>
              <span style={{ margin: "0 8px", color: "var(--ink-light)" }}>/</span>
              <span>Destinations</span>
              <span style={{ margin: "0 8px", color: "var(--ink-light)" }}>/</span>
              <span style={{ color: "var(--ink)" }}>{displayName}</span>
            </motion.div>

            {/* City name */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                fontFamily: "var(--serif)",
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 300,
                fontStyle: "italic",
                lineHeight: 1.1,
                color: "var(--ink)",
                marginBottom: 8,
              }}
            >
              {displayName}
            </motion.h1>

            {/* Country + tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {cityCountry && (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--ink-light)",
                    letterSpacing: "0.06em",
                    marginBottom: 4,
                  }}
                >
                  {cityCountry}
                </p>
              )}
              {tagline && (
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--ink-light)",
                    fontWeight: 300,
                    lineHeight: 1.7,
                    maxWidth: 480,
                  }}
                >
                  {tagline}
                </p>
              )}
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{
                width: 40,
                height: 1,
                background: "var(--gold)",
                marginTop: 24,
                transformOrigin: "left",
              }}
            />

            {/* Category selector tabs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginTop: 24,
                paddingBottom: 0,
              }}
            >
              {categoryKeys.map((key, i) => {
                const isActive = activeCategory === key;
                return (
                  <span key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {i > 0 && (
                      <span
                        style={{
                          fontSize: 14,
                          color: "var(--cream-border)",
                          userSelect: "none",
                          margin: "0 8px",
                        }}
                      >
                        &middot;
                      </span>
                    )}
                    <button
                      onClick={() => setActiveCategory(key)}
                      style={{
                        position: "relative",
                        fontSize: 13,
                        fontFamily: "var(--sans)",
                        fontWeight: isActive ? 500 : 400,
                        color: isActive ? "var(--ink)" : "var(--ink-light)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        paddingBottom: 16,
                        borderBottom: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                        transition: "all 0.2s",
                        letterSpacing: "0.02em",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.color = "var(--gold)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.color = "var(--ink-light)";
                        }
                      }}
                    >
                      {CATEGORY_LABELS[key]}
                    </button>
                  </span>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ================================================================
          HOTEL LIST — horizontal result cards
          ================================================================ */}
      <section
        style={{
          padding: "32px 60px 60px",
          background: "var(--cream)",
        }}
        className="!px-4 md:!px-[60px]"
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {loading ? (
            <>
              {/* Desktop skeletons */}
              <div className="hidden md:flex" style={{ flexDirection: "column", gap: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
              {/* Mobile skeletons */}
              <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeletonMobile key={i} />
                ))}
              </div>
            </>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* Results count */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--ink-light)",
                    }}
                  >
                    {hotels.length} curated {hotels.length === 1 ? "stay" : "stays"}{" "}
                    {CATEGORY_LABELS[activeCategory]}
                  </p>
                </div>

                {hotels.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {hotels.map((hotel, i) => (
                      <HotelResultCard
                        key={hotel.hotel_id}
                        hotel={hotel}
                        index={i}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      textAlign: "center",
                      paddingTop: 80,
                      paddingBottom: 80,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: 28,
                        fontStyle: "italic",
                        fontWeight: 300,
                        color: "var(--ink-mid)",
                        marginBottom: 12,
                      }}
                    >
                      Coming soon
                    </p>
                    <p style={{ fontSize: 14, color: "var(--ink-light)" }}>
                      We are curating {CATEGORIES[activeCategory].label.toLowerCase()} stays
                      in {displayName}.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* ================================================================
          CTA SECTION
          ================================================================ */}
      <section
        style={{
          padding: "80px 60px",
          background: "var(--ink)",
          color: "var(--cream)",
        }}
        className="!px-6 md:!px-[60px]"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          style={{
            maxWidth: 600,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--gold)",
              marginBottom: 16,
              fontFamily: "var(--sans)",
            }}
          >
            Ready to save?
          </p>
          <h3
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(28px, 3vw, 40px)",
              fontWeight: 300,
              fontStyle: "italic",
              lineHeight: 1.15,
              color: "var(--cream)",
              marginBottom: 16,
            }}
          >
            Preferred rates for{" "}
            <em style={{ color: "var(--gold)" }}>{displayName}</em>
          </h3>
          <p
            style={{
              fontSize: 14,
              color: "rgba(245,240,232,0.6)",
              fontWeight: 300,
              lineHeight: 1.7,
              marginBottom: 36,
            }}
          >
            B2B rates. No markup. No hidden fees. Contact us and we will beat any publicly listed rate.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <a
              href="tel:+919876543210"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "var(--gold)",
                color: "var(--ink)",
                border: "none",
                padding: "12px 28px",
                fontFamily: "var(--sans)",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.25s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--cream)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--gold)";
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              Call Us
            </a>

            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "transparent",
                color: "var(--cream)",
                border: "1px solid rgba(245,240,232,0.3)",
                padding: "11px 28px",
                fontFamily: "var(--sans)",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.25s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--cream)";
                (e.currentTarget as HTMLElement).style.color = "var(--ink)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--cream)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--cream)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,240,232,0.3)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </motion.div>
      </section>

      {/* ================================================================
          EXPLORE OTHER CITIES
          ================================================================ */}
      <section
        style={{
          padding: "56px 60px",
          background: "var(--cream)",
          borderTop: "1px solid var(--cream-border)",
        }}
        className="!px-6 md:!px-[60px]"
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--gold)",
              marginBottom: 8,
              fontFamily: "var(--sans)",
            }}
          >
            Explore
          </p>
          <h3
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 400,
              lineHeight: 1.15,
              color: "var(--ink)",
              marginBottom: 32,
            }}
          >
            Other <em style={{ fontStyle: "italic", color: "var(--gold)" }}>destinations</em>
          </h3>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {[
              "bangkok", "tokyo", "paris", "london", "dubai", "bali",
              "singapore", "rome", "barcelona", "seoul", "maldives",
              "phuket", "new-york", "kyoto",
            ]
              .filter((s) => s !== slug)
              .slice(0, 10)
              .map((citySlug) => (
                <Link
                  key={citySlug}
                  href={`/city/${citySlug}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "8px 18px",
                    border: "1px solid var(--cream-border)",
                    fontSize: 13,
                    fontWeight: 400,
                    color: "var(--ink-mid)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: "var(--white)",
                    textDecoration: "none",
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--ink)";
                    (e.currentTarget as HTMLElement).style.color = "var(--cream)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--ink)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--white)";
                    (e.currentTarget as HTMLElement).style.color = "var(--ink-mid)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--cream-border)";
                  }}
                >
                  {slugToName(citySlug)}
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer
        style={{
          padding: "40px 60px",
          background: "var(--cream-deep)",
          borderTop: "1px solid var(--cream-border)",
        }}
        className="!px-6 md:!px-[60px]"
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <span
              style={{
                fontFamily: "var(--serif)",
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "0.08em",
                color: "var(--ink)",
                fontStyle: "italic",
              }}
            >
              <span style={{ color: "var(--gold)" }}>V</span>oyagr
            </span>
          </Link>
          <p
            style={{
              fontSize: 12,
              color: "var(--ink-light)",
              fontFamily: "var(--sans)",
            }}
          >
            Preferred hotel rates for everyone.
          </p>
          <div
            style={{
              display: "flex",
              gap: 24,
            }}
          >
            {["Privacy", "Terms", "Contact"].map((label) => (
              <span
                key={label}
                style={{
                  fontSize: 11,
                  color: "var(--ink-light)",
                  cursor: "pointer",
                  fontFamily: "var(--sans)",
                  letterSpacing: "0.06em",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--gold)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--ink-light)";
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
