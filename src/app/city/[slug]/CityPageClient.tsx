"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { fetchCityCurations, CuratedHotel } from "@/lib/api";
import { rankHotels, sortRankedHotels, SORT_STRATEGY_LABELS, type SortStrategy, type RankedHotel } from "@/lib/ranking";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { trackCityViewed } from "@/lib/analytics";
import Breadcrumbs from "@/components/Breadcrumbs";
import DateBar from "@/components/DateBar";
import HotelResultCard from "@/components/HotelResultCard";

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
  "--gold": "#C9A84C",
  "--gold-light": "#D9BC72",
  "--gold-pale": "#F2EBDA",
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
// Skeleton — Horizontal card shimmer
// ---------------------------------------------------------------------------
function CardSkeleton() {
  return (
    <div
      className="city-hotel-card"
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
// Main Page
// ---------------------------------------------------------------------------
export default function CityPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [curations, setCurations] = useState<Record<Category, CuratedHotel[]>>({
    singles: [],
    couples: [],
    families: [],
  });
  const [cityName, setCityName] = useState("");
  const [cityCountry, setCityCountry] = useState("");
  const [tagline, setTagline] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [filterMin, setFilterMin] = useState(0);
  const [filterMax, setFilterMax] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortStrategy>("recommended");

  // Subset of sort strategies relevant for city pages
  const citySortOptions = SORT_STRATEGY_LABELS.filter((s) =>
    ["recommended", "price_asc", "price_desc", "rating_desc", "popularity_desc", "deal_desc", "stars_desc"].includes(s.value)
  );

  useEffect(() => {
    fetchCityCurations(slug)
      .then((data) => {
        setCurations(data.curations as Record<Category, CuratedHotel[]>);
        setCityName(data.city.city_name);
        setCityCountry(data.city.country);
        setTagline(data.city.tagline);
        trackCityViewed({
          city_slug: slug,
          city_name: data.city.city_name,
          country: data.city.country,
          continent: data.city.continent || '',
        });
      })
      .catch((err) => {
        console.error("[Voyagr] Failed to load city curations:", err);
        setFetchError(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Compute price bounds whenever curations change
  useEffect(() => {
    const allHotels = [
      ...curations.couples,
      ...curations.singles,
      ...curations.families,
    ];
    const prices = allHotels
      .map((h) => h.rates_from)
      .filter((p): p is number => p !== null && p > 0);
    if (prices.length > 0) {
      const min = Math.floor(Math.min(...prices));
      const max = Math.ceil(Math.max(...prices));
      setPriceMin(min);
      setPriceMax(max);
      setFilterMin(min);
      setFilterMax(max);
    } else {
      setPriceMin(0);
      setPriceMax(0);
      setFilterMin(0);
      setFilterMax(0);
    }
  }, [curations]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Combine all categories and deduplicate by hotel_id
  const allHotels = Array.from(
    new Map(
      [...curations.couples, ...curations.singles, ...curations.families].map(
        (h) => [h.hotel_id, h]
      )
    ).values()
  );

  // Rank all hotels, then filter by price, then sort by chosen strategy
  const rankedAll = rankHotels(allHotels);
  const rankedFiltered = rankedAll.filter((r) => {
    if (priceMin === 0 && priceMax === 0) return true;
    if (!r.hotel.rates_from) return true;
    return r.hotel.rates_from >= filterMin && r.hotel.rates_from <= filterMax;
  });
  const sortedRanked = sortRankedHotels(rankedFiltered, sortBy);
  const hotels = sortedRanked.map((r) => r.hotel);

  // Build a lookup for value scores (used by HotelResultCard badges)
  const valueScoreMap = new Map<number, number>();
  for (const r of sortedRanked) valueScoreMap.set(r.hotel.hotel_id, r.valueScore);

  const displayName = cityName || slugToName(slug);
  const isFilterActive = filterMin > priceMin || filterMax < priceMax;
  const isSortActive = sortBy !== "recommended";
  const currency = allHotels.find((h) => h.rates_currency)?.rates_currency || null;

  return (
    <div
      style={{
        ...cssVars,
        background: "var(--cream)",
        color: "var(--ink)",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        lineHeight: 1.6,
        minHeight: "100vh",
        overflowX: "hidden",
      } as React.CSSProperties}
    >
      <Header />

      {/* ════════ Breadcrumbs below navbar ════════ */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Destinations" },
          { label: displayName },
        ]}
      />

      {/* ════════ Check-in / Check-out date bar ════════ */}
      <div style={{ paddingTop: 96 }}>
        <DateBar variant="light" />
      </div>

      {/* ================================================================
          CITY HERO — large italic serif name, tagline
          ================================================================ */}
      <header
        style={{
          paddingTop: 24,
          paddingBottom: 0,
          paddingLeft: 60,
          paddingRight: 60,
          background: "var(--white)",
          borderBottom: "1px solid var(--cream-border)",
        }}
        className="!px-5 md:!px-[60px]"
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <BackButton />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* City name */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                fontFamily: "var(--font-display)",
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

          </motion.div>
        </div>
      </header>

      {/* ================================================================
          HOTEL LIST — sidebar + horizontal result cards
          ================================================================ */}
      <section
        style={{
          padding: "32px 60px 60px",
          background: "var(--cream)",
        }}
        className="!px-4 md:!px-[60px]"
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Mobile filter + sort controls */}
          {!loading && (
            <div className="md:hidden" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {/* Mobile sort dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortStrategy)}
                style={{
                  padding: "10px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  fontFamily: "var(--font-body)",
                  border: "1px solid var(--cream-border)",
                  borderColor: isSortActive ? "var(--gold)" : "var(--cream-border)",
                  background: isSortActive ? "var(--gold-pale)" : "var(--white)",
                  color: "var(--ink-mid)",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {citySortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Mobile price filter toggle */}
              {priceMax > priceMin && (<>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: isFilterActive ? "var(--ink)" : "var(--white)",
                  color: isFilterActive ? "var(--cream)" : "var(--ink-mid)",
                  border: "1px solid var(--cream-border)",
                  borderColor: isFilterActive ? "var(--ink)" : "var(--cream-border)",
                  padding: "10px 16px",
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                {isFilterActive ? `Filtered: ${formatCurrency(filterMin, currency)} – ${formatCurrency(filterMax, currency)}` : "Price Filter"}
              </button>

              {/* Mobile filter panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      style={{
                        marginTop: 12,
                        padding: 20,
                        background: "var(--white)",
                        border: "1px solid var(--cream-border)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-light)", fontFamily: "var(--font-body)" }}>
                          Price Range
                        </span>
                        {isFilterActive && (
                          <button
                            onClick={() => { setFilterMin(priceMin); setFilterMax(priceMax); }}
                            style={{ fontSize: 11, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500 }}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--ink)" }}>
                          {formatCurrency(filterMin, currency)}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--ink-light)" }}>—</span>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--ink)" }}>
                          {formatCurrency(filterMax, currency)}
                        </span>
                      </div>
                      {/* Dual range */}
                      <div style={{ position: "relative", height: 32, marginBottom: 4 }}>
                        <div style={{ position: "absolute", top: 14, left: 0, right: 0, height: 4, background: "var(--cream-deep)", borderRadius: 2 }} />
                        <div
                          style={{
                            position: "absolute",
                            top: 14,
                            left: `${((filterMin - priceMin) / (priceMax - priceMin)) * 100}%`,
                            right: `${100 - ((filterMax - priceMin) / (priceMax - priceMin)) * 100}%`,
                            height: 4,
                            background: "var(--gold)",
                            borderRadius: 2,
                          }}
                        />
                        <input
                          type="range"
                          min={priceMin}
                          max={priceMax}
                          value={filterMin}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (v <= filterMax) setFilterMin(v);
                          }}
                          style={{
                            position: "absolute",
                            top: 4,
                            left: 0,
                            width: "100%",
                            height: 24,
                            WebkitAppearance: "none",
                            appearance: "none" as never,
                            background: "transparent",
                            pointerEvents: "none",
                            zIndex: 3,
                          }}
                          className="price-range-input"
                        />
                        <input
                          type="range"
                          min={priceMin}
                          max={priceMax}
                          value={filterMax}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (v >= filterMin) setFilterMax(v);
                          }}
                          style={{
                            position: "absolute",
                            top: 4,
                            left: 0,
                            width: "100%",
                            height: 24,
                            WebkitAppearance: "none",
                            appearance: "none" as never,
                            background: "transparent",
                            pointerEvents: "none",
                            zIndex: 4,
                          }}
                          className="price-range-input"
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 10, color: "var(--ink-light)" }}>{formatCurrency(priceMin, currency)}</span>
                        <span style={{ fontSize: 10, color: "var(--ink-light)" }}>{formatCurrency(priceMax, currency)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </>)}
            </div>
          )}

          {/* Desktop: sidebar + cards layout */}
          <div
            className="hidden md:flex"
            style={{ gap: 32, alignItems: "flex-start" }}
          >
            {/* Sidebar — price filter */}
            {priceMax > priceMin && !loading && (
              <motion.aside
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                style={{
                  width: 240,
                  flexShrink: 0,
                  position: "sticky",
                  top: 108,
                }}
              >
                <div
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--cream-border)",
                    padding: 24,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--ink-light)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      Filters
                    </span>
                    {isFilterActive && (
                      <button
                        onClick={() => { setFilterMin(priceMin); setFilterMax(priceMax); }}
                        style={{
                          fontSize: 11,
                          color: "var(--gold)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          fontWeight: 500,
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--ink)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--gold)"; }}
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Price range label */}
                  <div style={{ marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--ink-mid)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      Price Range
                    </span>
                  </div>

                  {/* Price display */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--ink)" }}>
                        {formatCurrency(filterMin, currency)}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ink-light)" }}>—</span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--ink)" }}>
                        {formatCurrency(filterMax, currency)}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--ink-light)" }}>per night</span>
                  </div>

                  {/* Dual range slider */}
                  <div style={{ position: "relative", height: 32, marginBottom: 8 }}>
                    {/* Track background */}
                    <div style={{ position: "absolute", top: 14, left: 0, right: 0, height: 4, background: "var(--cream-deep)", borderRadius: 2 }} />
                    {/* Active track */}
                    <div
                      style={{
                        position: "absolute",
                        top: 14,
                        left: `${((filterMin - priceMin) / (priceMax - priceMin)) * 100}%`,
                        right: `${100 - ((filterMax - priceMin) / (priceMax - priceMin)) * 100}%`,
                        height: 4,
                        background: "var(--gold)",
                        borderRadius: 2,
                      }}
                    />
                    {/* Min handle */}
                    <input
                      type="range"
                      min={priceMin}
                      max={priceMax}
                      value={filterMin}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v <= filterMax) setFilterMin(v);
                      }}
                      style={{
                        position: "absolute",
                        top: 4,
                        left: 0,
                        width: "100%",
                        height: 24,
                        WebkitAppearance: "none",
                        appearance: "none" as never,
                        background: "transparent",
                        pointerEvents: "none",
                        zIndex: 3,
                      }}
                      className="price-range-input"
                    />
                    {/* Max handle */}
                    <input
                      type="range"
                      min={priceMin}
                      max={priceMax}
                      value={filterMax}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v >= filterMin) setFilterMax(v);
                      }}
                      style={{
                        position: "absolute",
                        top: 4,
                        left: 0,
                        width: "100%",
                        height: 24,
                        WebkitAppearance: "none",
                        appearance: "none" as never,
                        background: "transparent",
                        pointerEvents: "none",
                        zIndex: 4,
                      }}
                      className="price-range-input"
                    />
                  </div>

                  {/* Min/Max labels */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                    <span style={{ fontSize: 10, color: "var(--ink-light)" }}>{formatCurrency(priceMin, currency)}</span>
                    <span style={{ fontSize: 10, color: "var(--ink-light)" }}>{formatCurrency(priceMax, currency)}</span>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: "var(--cream-border)", margin: "0 0 16px" }} />

                  {/* Sort by */}
                  <div style={{ marginBottom: 20 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--ink-mid)",
                        fontFamily: "var(--font-body)",
                        display: "block",
                        marginBottom: 10,
                      }}
                    >
                      Sort By
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {citySortOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSortBy(opt.value)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "7px 10px",
                            fontSize: 12,
                            fontFamily: "var(--font-body)",
                            color: sortBy === opt.value ? "var(--ink)" : "var(--ink-light)",
                            fontWeight: sortBy === opt.value ? 500 : 400,
                            background: sortBy === opt.value ? "var(--cream)" : "transparent",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.15s",
                            letterSpacing: "0.02em",
                          }}
                        >
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: sortBy === opt.value ? "var(--gold)" : "transparent",
                            border: sortBy === opt.value ? "none" : "1px solid var(--cream-border)",
                            flexShrink: 0,
                          }} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: "var(--cream-border)", margin: "0 0 16px" }} />

                  {/* Showing count */}
                  <p style={{ fontSize: 12, color: "var(--ink-light)" }}>
                    Showing <strong style={{ color: "var(--ink-mid)", fontWeight: 500 }}>{hotels.length}</strong> of {allHotels.length} stays
                  </p>
                </div>
              </motion.aside>
            )}

            {/* Hotel cards */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key="hotels"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 20,
                      }}
                    >
                      <p style={{ fontSize: 13, color: "var(--ink-light)" }}>
                        {hotels.length} curated {hotels.length === 1 ? "stay" : "stays"}
                        {isFilterActive && (
                          <span style={{ color: "var(--gold)" }}> &middot; price filtered</span>
                        )}
                        {isSortActive && (
                          <span style={{ color: "var(--gold)" }}> &middot; sorted by {citySortOptions.find((o) => o.value === sortBy)?.label?.toLowerCase()}</span>
                        )}
                      </p>
                    </div>

                    {hotels.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {hotels.map((hotel, i) => (
                          <HotelResultCard key={hotel.hotel_id} hotel={hotel} index={i} valueScore={valueScoreMap.get(hotel.hotel_id)} />
                        ))}
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ textAlign: "center", paddingTop: 80, paddingBottom: 80 }}
                      >
                        {isFilterActive ? (
                          <>
                            <p
                              style={{
                                fontFamily: "var(--font-display)",
                                fontSize: 28,
                                fontStyle: "italic",
                                fontWeight: 300,
                                color: "var(--ink-mid)",
                                marginBottom: 12,
                              }}
                            >
                              No matches
                            </p>
                            <p style={{ fontSize: 14, color: "var(--ink-light)", marginBottom: 20 }}>
                              No stays found in the {formatCurrency(filterMin, currency)} – {formatCurrency(filterMax, currency)} range.
                            </p>
                            <button
                              onClick={() => { setFilterMin(priceMin); setFilterMax(priceMax); }}
                              style={{
                                background: "none",
                                border: "1px solid var(--cream-border)",
                                padding: "10px 24px",
                                fontSize: 12,
                                fontWeight: 500,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                color: "var(--ink-mid)",
                                cursor: "pointer",
                                fontFamily: "var(--font-body)",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "var(--ink)";
                                (e.currentTarget as HTMLElement).style.color = "var(--cream)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                                (e.currentTarget as HTMLElement).style.color = "var(--ink-mid)";
                              }}
                            >
                              Clear filter
                            </button>
                          </>
                        ) : fetchError ? (
                          <>
                            <p
                              style={{
                                fontFamily: "var(--font-display)",
                                fontSize: 28,
                                fontStyle: "italic",
                                fontWeight: 300,
                                color: "var(--ink-mid)",
                                marginBottom: 12,
                              }}
                            >
                              Unable to load hotels
                            </p>
                            <p style={{ fontSize: 14, color: "var(--ink-light)", marginBottom: 20 }}>
                              Something went wrong while loading stays for {displayName}. Please try again.
                            </p>
                            <button
                              onClick={() => window.location.reload()}
                              style={{
                                background: "none",
                                border: "1px solid var(--cream-border)",
                                padding: "10px 24px",
                                fontSize: 12,
                                fontWeight: 500,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                color: "var(--ink-mid)",
                                cursor: "pointer",
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              Try again
                            </button>
                          </>
                        ) : (
                          <>
                            <p
                              style={{
                                fontFamily: "var(--font-display)",
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
                              We are curating stays in {displayName}.
                            </p>
                          </>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Mobile: cards only (sidebar is the toggle panel above) */}
          <div className="md:hidden">
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeletonMobile key={i} />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key="hotels"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: "var(--ink-light)" }}>
                      {hotels.length} curated {hotels.length === 1 ? "stay" : "stays"}
                      {isFilterActive && (
                        <span style={{ color: "var(--gold)" }}> &middot; price filtered</span>
                      )}
                      {isSortActive && (
                        <span style={{ color: "var(--gold)" }}> &middot; sorted</span>
                      )}
                    </p>
                  </div>

                  {hotels.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {hotels.map((hotel, i) => (
                        <HotelResultCard key={hotel.hotel_id} hotel={hotel} index={i} valueScore={valueScoreMap.get(hotel.hotel_id)} />
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ textAlign: "center", paddingTop: 60, paddingBottom: 60 }}
                    >
                      {isFilterActive ? (
                        <>
                          <p style={{ fontFamily: "var(--font-display)", fontSize: 24, fontStyle: "italic", fontWeight: 300, color: "var(--ink-mid)", marginBottom: 12 }}>
                            No matches
                          </p>
                          <p style={{ fontSize: 14, color: "var(--ink-light)", marginBottom: 20 }}>
                            No stays in this price range.
                          </p>
                          <button
                            onClick={() => { setFilterMin(priceMin); setFilterMax(priceMax); }}
                            style={{
                              background: "none",
                              border: "1px solid var(--cream-border)",
                              padding: "10px 24px",
                              fontSize: 12,
                              fontWeight: 500,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              color: "var(--ink-mid)",
                              cursor: "pointer",
                              fontFamily: "var(--font-body)",
                            }}
                          >
                            Clear filter
                          </button>
                        </>
                      ) : (
                        <>
                          <p style={{ fontFamily: "var(--font-display)", fontSize: 24, fontStyle: "italic", fontWeight: 300, color: "var(--ink-mid)", marginBottom: 12 }}>
                            Coming soon
                          </p>
                          <p style={{ fontSize: 14, color: "var(--ink-light)" }}>
                            We are curating stays in {displayName}.
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
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
            className="type-eyebrow"
            style={{
              marginBottom: 16,
            }}
          >
            Ready to save?
          </p>
          <h3
            className="type-display-2"
            style={{
              fontStyle: "italic",
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
            className="city-cta-buttons"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
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
                fontFamily: "var(--font-body)",
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
                fontFamily: "var(--font-body)",
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
            className="type-eyebrow"
            style={{
              marginBottom: 8,
            }}
          >
            Explore
          </p>
          <h3
            className="type-display-2"
            style={{
              fontSize: "clamp(24px, 3vw, 36px)",
              color: "var(--ink)",
              marginBottom: 32,
            }}
          >
            Other <em style={{ fontStyle: "italic", color: "var(--gold)" }}>destinations</em>
          </h3>
          <div
            className="city-destination-pills"
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
                    padding: "10px 18px",
                    border: "1px solid var(--cream-border)",
                    fontSize: 13,
                    fontWeight: 400,
                    color: "var(--ink-mid)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: "var(--white)",
                    textDecoration: "none",
                    fontFamily: "var(--font-display)",
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
          padding: "48px 60px",
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
              className="type-logo"
              style={{
                letterSpacing: "0.08em",
                color: "var(--ink)",
              }}
            >
              <span style={{ color: "var(--gold)" }}>V</span>oyagr
            </span>
          </Link>
          <p
            style={{
              fontSize: 12,
              color: "var(--ink-light)",
              fontFamily: "var(--font-body)",
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
                  fontFamily: "var(--font-body)",
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
