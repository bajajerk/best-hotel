"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCityImage, FALLBACK_CITY_IMAGE } from "@/lib/constants";
import type { CuratedCity } from "@/lib/api";
import RegionFilterTabs from "./RegionFilterTabs";

const INITIAL_CITY_LIMIT = 8;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type DestinationTab = "region" | "popular" | "seasonal";

const TABS: { key: DestinationTab; label: string }[] = [
  { key: "region", label: "By Region" },
  { key: "popular", label: "Popular" },
  { key: "seasonal", label: "Seasonal Picks" },
];

// ---------------------------------------------------------------------------
// Seasonal grouping data
// ---------------------------------------------------------------------------
const SEASON_META: {
  key: string;
  label: string;
  months: string;
  description: string;
  slugs: string[];
}[] = [
  {
    key: "summer",
    label: "Summer Escapes",
    months: "Jun – Aug",
    description: "Escape the heat with mountain retreats and coastal breezes.",
    slugs: ["santorini", "bali", "cape-town", "barcelona", "dubrovnik", "phuket", "nice", "sydney"],
  },
  {
    key: "autumn",
    label: "Autumn Retreats",
    months: "Sep – Nov",
    description: "Golden foliage, harvest festivals, and shoulder-season savings.",
    slugs: ["kyoto", "prague", "budapest", "rome", "lisbon", "marrakech", "new-york", "seoul"],
  },
  {
    key: "winter",
    label: "Winter Warmth",
    months: "Dec – Feb",
    description: "Festive cities, alpine luxury, and tropical winter sun.",
    slugs: ["dubai", "maldives", "vienna", "bangkok", "singapore", "goa", "hong-kong", "cancun"],
  },
  {
    key: "spring",
    label: "Spring Blooms",
    months: "Mar – May",
    description: "Cherry blossoms, mild weather, and vibrant cityscapes.",
    slugs: ["tokyo", "amsterdam", "london", "paris", "jaipur", "istanbul", "florence", "delhi"],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function safeImageSrc(url: string): string {
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

// ---------------------------------------------------------------------------
// Mini destination card (shared across tabs)
// ---------------------------------------------------------------------------
function MiniDestCard({ city, index }: { city: CuratedCity; index: number }) {
  return (
    <Link href={`/city/${city.city_slug}`} style={{ textDecoration: "none", display: "block" }}>
      <motion.div
        className="card-hover"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.04 }}
        style={{
          background: "var(--white)",
          border: "1px solid var(--cream-border)",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <div style={{ height: "220px", overflow: "hidden", position: "relative" }}>
          <img
            className="card-img"
            src={safeImageSrc(getCityImage(city.city_slug))}
            alt={city.city_name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: "saturate(0.88)",
            }}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_CITY_IMAGE;
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "rgba(26,23,16,0.65)",
              backdropFilter: "blur(4px)",
              padding: "4px 10px",
              fontSize: "10px",
              color: "rgba(245,240,232,0.7)",
              letterSpacing: "0.06em",
            }}
          >
            {city.continent}
          </div>
        </div>
        <div style={{ padding: "20px 24px 28px" }}>
          <h3
            className="type-display-3"
            style={{ fontStyle: "italic", color: "var(--ink)", marginBottom: "4px" }}
          >
            {city.city_name}
          </h3>
          <p style={{ fontSize: "12px", color: "var(--ink-light)", letterSpacing: "0.06em", marginBottom: "4px" }}>
            {city.country}
          </p>
          {city.tagline && (
            <p
              style={{
                fontSize: "12px",
                color: "var(--ink-mid)",
                fontStyle: "italic",
                marginBottom: "12px",
                lineHeight: 1.5,
              }}
            >
              {city.tagline}
            </p>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid var(--cream-border)",
              paddingTop: "12px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "var(--ink-light)",
                fontWeight: 400,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
              </svg>
              {city.hotel_count > 0 ? `${city.hotel_count}+ hotels` : "Explore stays"}
            </span>
            <span
              className="card-arrow"
              style={{ fontSize: "11px", color: "var(--gold)", fontWeight: 500, letterSpacing: "0.06em" }}
            >
              View &rarr;
            </span>
          </div>
          <div style={{ width: "40px", height: "1px", background: "var(--gold)", marginTop: "12px" }} />
        </div>
      </motion.div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// View More button — redirects to search page
// ---------------------------------------------------------------------------
function ViewMoreButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      style={{ textAlign: "center", marginTop: "36px" }}
    >
      <button
        onClick={onClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 32px",
          fontSize: "13px",
          fontWeight: 500,
          letterSpacing: "0.06em",
          color: "var(--gold)",
          background: "none",
          border: "1px solid var(--gold)",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          transition: "all 0.25s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--gold)";
          e.currentTarget.style.color = "var(--white)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = "var(--gold)";
        }}
      >
        View More
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// DestinationTabs Component
// ---------------------------------------------------------------------------
interface DestinationTabsProps {
  cities: CuratedCity[];
  loading: boolean;
}

export default function DestinationTabs({ cities, loading }: DestinationTabsProps) {
  const [activeTab, setActiveTab] = useState<DestinationTab>("region");
  const [activeContinent, setActiveContinent] = useState<string>("All");

  const totalCities = cities.length;

  const router = useRouter();

  // Region-filtered cities (limited to 8 initially)
  const allFilteredCities = useMemo(
    () => (activeContinent === "All" ? cities : cities.filter((c) => c.continent === activeContinent)),
    [cities, activeContinent]
  );
  const filteredCities = useMemo(
    () => allFilteredCities.slice(0, INITIAL_CITY_LIMIT),
    [allFilteredCities]
  );
  const hasMoreRegionCities = allFilteredCities.length > INITIAL_CITY_LIMIT;

  // Group by continent (from the limited set)
  const continentGroups = useMemo(
    () =>
      filteredCities.reduce<Record<string, CuratedCity[]>>((acc, city) => {
        const cont = city.continent || "Other";
        if (!acc[cont]) acc[cont] = [];
        acc[cont].push(city);
        return acc;
      }, {}),
    [filteredCities]
  );

  const continentOrder = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania", "Other"];
  const sortedContinents = continentOrder.filter((c) => continentGroups[c]);

  // Popular: sorted by hotel count, limited to 8
  const allPopularCities = useMemo(
    () => [...cities].sort((a, b) => (b.hotel_count || 0) - (a.hotel_count || 0)),
    [cities]
  );
  const popularCities = useMemo(
    () => allPopularCities.slice(0, INITIAL_CITY_LIMIT),
    [allPopularCities]
  );
  const hasMorePopularCities = allPopularCities.length > INITIAL_CITY_LIMIT;

  // Seasonal: group cities by season
  const seasonalGroups = useMemo(() => {
    const slugSet = new Set(cities.map((c) => c.city_slug));
    return SEASON_META.map((season) => ({
      ...season,
      cities: season.slugs
        .map((slug) => cities.find((c) => c.city_slug === slug))
        .filter((c): c is CuratedCity => c !== undefined),
    }));
  }, [cities]);

  return (
    <section id="destinations" className="section-destinations" style={{ padding: "80px 60px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "48px" }}
        >
          <div>
            <div className="type-eyebrow" style={{ marginBottom: "8px" }}>
              Destinations
            </div>
            <h2 className="type-display-2" style={{ color: "var(--ink)" }}>
              Explore{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                {totalCities > 0 ? totalCities : 50}
              </em>{" "}
              curated cities
            </h2>
          </div>

          {/* Tab navigation */}
          <div
            style={{
              display: "flex",
              gap: "0",
              borderBottom: "1px solid var(--cream-border)",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "12px 28px",
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: "0.04em",
                    color: isActive ? "var(--gold)" : "var(--ink-light)",
                    background: "none",
                    border: "none",
                    borderBottom: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    marginBottom: "-1px",
                    fontFamily: "var(--font-body)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Continent pills — only visible on "By Region" tab */}
          {activeTab === "region" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RegionFilterTabs
                active={activeContinent}
                onChange={setActiveContinent}
                variant="pills"
                showIcons
              />
            </motion.div>
          )}
        </motion.div>

        {/* Tab content */}
        {loading ? (
          <div
            className="destinations-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shimmer" style={{ height: "320px", background: "var(--cream-deep)" }} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── By Region ── */}
            {activeTab === "region" && (
              <motion.div
                key={`region-${activeContinent}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                style={{ display: "flex", flexDirection: "column", gap: "56px" }}
              >
                {sortedContinents.map((continent) => (
                  <div key={continent}>
                    {activeContinent === "All" && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          marginBottom: "24px",
                        }}
                      >
                        <h3
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "22px",
                            fontWeight: 400,
                            fontStyle: "italic",
                            color: "var(--ink)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {continent}
                        </h3>
                        <div style={{ flex: 1, height: "1px", background: "var(--cream-border)" }} />
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--ink-light)",
                            letterSpacing: "0.06em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {continentGroups[continent].length}{" "}
                          {continentGroups[continent].length === 1 ? "city" : "cities"}
                        </span>
                      </div>
                    )}
                    <div
                      className="destinations-grid"
                      style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}
                    >
                      {continentGroups[continent].map((city, i) => (
                        <MiniDestCard key={city.city_slug} city={city} index={i} />
                      ))}
                    </div>
                  </div>
                ))}
                {hasMoreRegionCities && (
                  <ViewMoreButton onClick={() => router.push("/search")} />
                )}
              </motion.div>
            )}

            {/* ── Popular ── */}
            {activeTab === "popular" && (
              <motion.div
                key="popular"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--ink-light)",
                    fontStyle: "italic",
                    marginBottom: "32px",
                  }}
                >
                  Most sought-after destinations by hotel availability
                </p>
                <div
                  className="destinations-grid"
                  style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}
                >
                  {popularCities.map((city, i) => (
                    <MiniDestCard key={city.city_slug} city={city} index={i} />
                  ))}
                </div>
                {hasMorePopularCities && (
                  <ViewMoreButton onClick={() => router.push("/search")} />
                )}
              </motion.div>
            )}

            {/* ── Seasonal Picks ── */}
            {activeTab === "seasonal" && (
              <motion.div
                key="seasonal"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                style={{ display: "flex", flexDirection: "column", gap: "56px" }}
              >
                {seasonalGroups.map((season) => (
                  <div key={season.key}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        marginBottom: "8px",
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "22px",
                          fontWeight: 400,
                          fontStyle: "italic",
                          color: "var(--ink)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {season.label}
                      </h3>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--gold)",
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {season.months}
                      </span>
                      <div style={{ flex: 1, height: "1px", background: "var(--cream-border)" }} />
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--ink-light)",
                        fontStyle: "italic",
                        marginBottom: "24px",
                      }}
                    >
                      {season.description}
                    </p>
                    {season.cities.length > 0 ? (
                      <div
                        className="destinations-grid"
                        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}
                      >
                        {season.cities.map((city, i) => (
                          <MiniDestCard key={city.city_slug} city={city} index={i} />
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "13px", color: "var(--ink-light)", padding: "20px 0" }}>
                        Coming soon...
                      </p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginTop: "48px" }}
        >
          <Link
            href="/search"
            className="btn-outline"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
            }}
          >
            View all destinations
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
