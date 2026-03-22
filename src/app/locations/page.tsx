"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { fetchCuratedCities, CuratedCity } from "@/lib/api";
import { CONTINENTS, SAMPLE_CITIES, getCityImage, FALLBACK_CITY_IMAGE } from "@/lib/constants";
import MobileNav from "@/components/MobileNav";
import DateBar from "@/components/DateBar";
import RegionFilterTabs from "@/components/RegionFilterTabs";

const FALLBACK_IMAGE = FALLBACK_CITY_IMAGE;

function safeImageSrc(url: string): string {
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

// ---------------------------------------------------------------------------
// Continent metadata for hero cards
// ---------------------------------------------------------------------------
const CONTINENT_META: Record<string, { tagline: string; img: string; emoji: string }> = {
  Asia: {
    tagline: "Temples, street food & turquoise waters",
    img: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200&q=80",
    emoji: "🏯",
  },
  Europe: {
    tagline: "Cobblestones, culture & café terraces",
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
    emoji: "🏰",
  },
  "North America": {
    tagline: "Skylines, coastlines & canyon sunsets",
    img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80",
    emoji: "🗽",
  },
  "South America": {
    tagline: "Samba, summits & ancient ruins",
    img: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200&q=80",
    emoji: "🌎",
  },
  Africa: {
    tagline: "Saharan sunsets & savanna wildlife",
    img: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=80",
    emoji: "🌍",
  },
  Oceania: {
    tagline: "Golden beaches & harbour cities",
    img: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80",
    emoji: "🏝️",
  },
};

// ---------------------------------------------------------------------------
// View modes
// ---------------------------------------------------------------------------
type ViewMode = "grid" | "list";

// ============================================================================
// Locations Page
// ============================================================================
export default function LocationsPage() {
  const [cities, setCities] = useState<CuratedCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeContinent, setActiveContinent] = useState<string>("All");
  const [searchFilter, setSearchFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Fetch cities
  useEffect(() => {
    fetchCuratedCities()
      .then(setCities)
      .catch(() => {
        setCities(
          SAMPLE_CITIES.map((c, i) => ({
            ...c,
            city_id: null,
            hotel_count: 100 + Math.floor(Math.random() * 900),
            display_order: i + 1,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter cities
  const filteredCities = useMemo(() => cities.filter((c) => {
    const matchesContinent = activeContinent === "All" || c.continent === activeContinent;
    const matchesSearch =
      !searchFilter.trim() ||
      c.city_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.country.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesContinent && matchesSearch;
  }), [cities, activeContinent, searchFilter]);

  // Group by continent
  const continentGroups = useMemo(() => filteredCities.reduce<Record<string, CuratedCity[]>>((acc, city) => {
    const cont = city.continent || "Other";
    if (!acc[cont]) acc[cont] = [];
    acc[cont].push(city);
    return acc;
  }, {}), [filteredCities]);

  const continentOrder = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania", "Other"];
  const sortedContinents = continentOrder.filter((c) => continentGroups[c]);

  // Count by continent
  const continentCounts = useMemo(() => cities.reduce<Record<string, number>>((acc, city) => {
    const cont = city.continent || "Other";
    acc[cont] = (acc[cont] || 0) + 1;
    return acc;
  }, {}), [cities]);

  // Total hotel count
  const totalHotels = useMemo(() => cities.reduce((sum, c) => sum + (c.hotel_count || 0), 0), [cities]);

  // Unique countries
  const uniqueCountries = useMemo(() => new Set(cities.map((c) => c.country)).size, [cities]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", color: "var(--ink)" }}>
      {/* ── Nav ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(245, 240, 232, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--cream-border)",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <span className="type-logo" style={{ letterSpacing: "0.08em", color: "var(--ink)" }}>
            <span style={{ color: "var(--gold)" }}>V</span>oyagr
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div className="nav-links" style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            {[
              { label: "HOME", href: "/" },
              { label: "SEARCH", href: "/search" },
              { label: "LOCATIONS", href: "/locations" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="type-nav"
                style={{
                  color: link.href === "/locations" ? "var(--gold)" : "var(--ink-mid)",
                  textDecoration: "none",
                  paddingBottom: "2px",
                  borderBottom: link.href === "/locations" ? "1px solid var(--gold)" : "1px solid transparent",
                  transition: "color 0.2s, border-color 0.2s",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <MobileNav
            links={[
              { label: "Home", href: "/" },
              { label: "Search", href: "/search" },
              { label: "Locations", href: "/locations" },
            ]}
          />
        </div>
      </nav>

      {/* ── Date bar ── */}
      <div style={{ paddingTop: 60 }}>
        <DateBar variant="dark" />
      </div>

      {/* ── Hero banner ── */}
      <section
        className="locations-hero"
        style={{
          paddingTop: "0px",
          position: "relative",
          overflow: "hidden",
          background: "var(--ink)",
        }}
      >
        {/* Background image */}
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.2,
          backgroundImage: `url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=80)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }} />

        <div className="locations-hero-inner" style={{ position: "relative", padding: "80px 60px 72px", maxWidth: "1400px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="type-eyebrow" style={{ marginBottom: "16px", color: "var(--gold)" }}>
              Destinations
            </div>
            <h1 className="type-display-1" style={{ color: "var(--cream)", marginBottom: "12px", maxWidth: "600px" }}>
              Explore{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                {cities.length > 0 ? cities.length : 50}+
              </em>{" "}
              curated cities
            </h1>
            <p className="type-body-lg" style={{ color: "rgba(245,240,232,0.5)", maxWidth: "500px", marginBottom: "40px" }}>
              Hand-picked destinations with exclusive hotel rates across every continent.
            </p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="locations-stats"
              style={{
                display: "flex",
                gap: "32px",
                marginBottom: "32px",
              }}
            >
              {[
                { value: cities.length || 50, label: "Cities" },
                { value: uniqueCountries || 30, label: "Countries" },
                { value: totalHotels > 0 ? `${Math.round(totalHotels / 100) * 100}+` : "1,500+", label: "Hotels" },
                { value: Object.keys(continentCounts).length || 6, label: "Continents" },
              ].map((stat) => (
                <div key={stat.label} className="locations-stat-item">
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "28px",
                    fontWeight: 300,
                    color: "var(--gold)",
                    lineHeight: 1,
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: "10px",
                    color: "rgba(245,240,232,0.4)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginTop: "4px",
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Quick search */}
            <div className="locations-search-bar" style={{
              display: "flex",
              background: "rgba(245,240,232,0.08)",
              border: "1px solid rgba(245,240,232,0.12)",
              maxWidth: "420px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter destinations..."
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  padding: "14px 14px 14px 0",
                  fontSize: "14px",
                  fontFamily: "var(--font-body)",
                  color: "var(--cream)",
                  outline: "none",
                }}
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "0 14px",
                    cursor: "pointer",
                    color: "rgba(245,240,232,0.4)",
                    fontSize: "16px",
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Continent quick-nav cards ── */}
      <section className="locations-continent-section" style={{ padding: "48px 60px 0", maxWidth: "1400px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="locations-continent-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "12px",
          }}
        >
          {continentOrder.filter((c) => c !== "Other").map((cont) => {
            const meta = CONTINENT_META[cont];
            const count = continentCounts[cont] || 0;
            const isActive = activeContinent === cont;

            return (
              <button
                key={cont}
                onClick={() => setActiveContinent(isActive ? "All" : cont)}
                className="locations-continent-card"
                style={{
                  position: "relative",
                  height: "120px",
                  overflow: "hidden",
                  border: isActive ? "2px solid var(--gold)" : "1px solid var(--cream-border)",
                  background: "var(--cream-deep)",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "left",
                  transition: "border-color 0.2s",
                }}
              >
                {meta && (
                  <img
                    src={safeImageSrc(meta.img)}
                    alt={cont}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: isActive ? "saturate(1) brightness(0.75)" : "saturate(0.6) brightness(0.65)",
                      transition: "filter 0.3s",
                    }}
                    loading="lazy"
                  />
                )}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(26,23,16,0.7) 0%, transparent 100%)",
                }} />
                <div style={{
                  position: "relative",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "14px",
                }}>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "16px",
                    fontWeight: 400,
                    fontStyle: "italic",
                    color: isActive ? "var(--gold)" : "var(--cream)",
                    lineHeight: 1.2,
                  }}>
                    {cont}
                  </div>
                  <div style={{
                    fontSize: "10px",
                    color: "rgba(245,240,232,0.5)",
                    marginTop: "2px",
                    letterSpacing: "0.04em",
                  }}>
                    {count} {count === 1 ? "city" : "cities"}
                  </div>
                </div>
              </button>
            );
          })}
        </motion.div>
      </section>

      {/* ── Filter pills + view toggle ── */}
      <section className="locations-filter-section" style={{ padding: "32px 60px 0", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <RegionFilterTabs
            active={activeContinent}
            onChange={setActiveContinent}
            counts={continentCounts}
            variant="pills"
          />

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* View toggle */}
            <div style={{ display: "flex", border: "1px solid var(--cream-border)" }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  background: viewMode === "grid" ? "var(--ink)" : "transparent",
                  color: viewMode === "grid" ? "var(--cream)" : "var(--ink-light)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Grid view"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderLeft: "1px solid var(--cream-border)",
                  background: viewMode === "list" ? "var(--ink)" : "transparent",
                  color: viewMode === "list" ? "var(--cream)" : "var(--ink-light)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="List view"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ fontSize: "12px", color: "var(--ink-light)" }}>
              {filteredCities.length} {filteredCities.length === 1 ? "destination" : "destinations"}
            </div>
          </div>
        </div>
      </section>

      {/* ── City grid / list ── */}
      <section className="locations-city-section" style={{ padding: "40px 60px 100px", maxWidth: "1400px", margin: "0 auto" }}>
        {loading ? (
          <div className="locations-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
          }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="shimmer"
                style={{ height: "320px", background: "var(--cream-deep)" }}
              />
            ))}
          </div>
        ) : filteredCities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "80px 0" }}
          >
            <div style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 20px",
              background: "var(--cream-deep)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ink-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3 className="type-display-3" style={{ color: "var(--ink)", fontStyle: "italic", marginBottom: "8px" }}>
              No destinations found
            </h3>
            <p className="type-body" style={{ color: "var(--ink-light)", marginBottom: "20px" }}>
              Try adjusting your filter or selecting a different continent.
            </p>
            <button
              onClick={() => { setActiveContinent("All"); setSearchFilter(""); }}
              style={{
                fontSize: "12px",
                color: "var(--gold)",
                background: "transparent",
                border: "1px solid var(--gold)",
                padding: "10px 24px",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                transition: "all 0.2s",
              }}
            >
              Clear all filters
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeContinent}-${searchFilter}-${viewMode}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              style={{ display: "flex", flexDirection: "column", gap: "56px" }}
            >
              {sortedContinents.map((continent) => (
                <div key={continent}>
                  {/* Continent header */}
                  {(activeContinent === "All" || sortedContinents.length > 1) && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      marginBottom: "24px",
                    }}>
                      <h3 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "22px",
                        fontWeight: 400,
                        fontStyle: "italic",
                        color: "var(--ink)",
                        whiteSpace: "nowrap",
                      }}>
                        {continent}
                      </h3>
                      {CONTINENT_META[continent] && (
                        <span style={{
                          fontSize: "12px",
                          color: "var(--ink-light)",
                          fontStyle: "italic",
                          whiteSpace: "nowrap",
                        }}>
                          {CONTINENT_META[continent].tagline}
                        </span>
                      )}
                      <div style={{
                        flex: 1,
                        height: "1px",
                        background: "var(--cream-border)",
                      }} />
                      <span style={{
                        fontSize: "11px",
                        color: "var(--ink-light)",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}>
                        {continentGroups[continent].length} {continentGroups[continent].length === 1 ? "city" : "cities"}
                      </span>
                    </div>
                  )}

                  {/* Grid view */}
                  {viewMode === "grid" ? (
                    <div className="locations-grid" style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "20px",
                    }}>
                      {continentGroups[continent].map((city, i) => (
                        <Link
                          key={city.city_slug}
                          href={`/city/${city.city_slug}`}
                          style={{ textDecoration: "none", display: "block" }}
                        >
                          <motion.div
                            className="card-hover"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.04 }}
                            style={{
                              background: "var(--white)",
                              border: "1px solid var(--cream-border)",
                              overflow: "hidden",
                              cursor: "pointer",
                            }}
                          >
                            {/* Image */}
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
                                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                              />
                              {/* Continent badge */}
                              <div style={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                background: "rgba(26,23,16,0.65)",
                                backdropFilter: "blur(4px)",
                                padding: "4px 10px",
                                fontSize: "10px",
                                color: "rgba(245,240,232,0.7)",
                                letterSpacing: "0.06em",
                              }}>
                                {city.continent}
                              </div>
                            </div>

                            {/* Content */}
                            <div style={{ padding: "20px 24px 28px" }}>
                              <h4 className="type-display-3" style={{
                                fontStyle: "italic",
                                color: "var(--ink)",
                                marginBottom: "4px",
                              }}>
                                {city.city_name}
                              </h4>
                              <p style={{
                                fontSize: "12px",
                                color: "var(--ink-light)",
                                letterSpacing: "0.06em",
                                marginBottom: "4px",
                              }}>
                                {city.country}
                              </p>
                              {city.tagline && (
                                <p style={{
                                  fontSize: "12px",
                                  color: "var(--ink-mid)",
                                  fontStyle: "italic",
                                  marginBottom: "12px",
                                  lineHeight: 1.5,
                                }}>
                                  {city.tagline}
                                </p>
                              )}
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderTop: "1px solid var(--cream-border)",
                                paddingTop: "12px",
                              }}>
                                <span style={{
                                  fontSize: "11px",
                                  color: "var(--ink-light)",
                                  fontWeight: 400,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 21h18" />
                                    <path d="M5 21V7l8-4v18" />
                                    <path d="M19 21V11l-6-4" />
                                  </svg>
                                  {city.hotel_count > 0 ? `${city.hotel_count}+ hotels` : "Explore stays"}
                                </span>
                                <span className="card-arrow" style={{
                                  fontSize: "11px",
                                  color: "var(--gold)",
                                  fontWeight: 500,
                                  letterSpacing: "0.06em",
                                }}>
                                  View &rarr;
                                </span>
                              </div>
                              <div style={{
                                width: "40px",
                                height: "1px",
                                background: "var(--gold)",
                                marginTop: "12px",
                              }} />
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    /* List view */
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {continentGroups[continent].map((city, i) => (
                        <Link
                          key={city.city_slug}
                          href={`/city/${city.city_slug}`}
                          style={{ textDecoration: "none", display: "block" }}
                        >
                          <motion.div
                            className="card-hover locations-list-card"
                            initial={{ opacity: 0, x: -12 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.03 }}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "160px 1fr auto",
                              background: "var(--white)",
                              border: "1px solid var(--cream-border)",
                              overflow: "hidden",
                              cursor: "pointer",
                              alignItems: "center",
                            }}
                          >
                            {/* Image */}
                            <div style={{ height: "100px", overflow: "hidden" }}>
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
                                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                              />
                            </div>

                            {/* Content */}
                            <div style={{ padding: "16px 24px" }}>
                              <h4 style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "18px",
                                fontWeight: 400,
                                fontStyle: "italic",
                                color: "var(--ink)",
                                marginBottom: "4px",
                              }}>
                                {city.city_name}
                              </h4>
                              <p style={{
                                fontSize: "12px",
                                color: "var(--ink-light)",
                                letterSpacing: "0.04em",
                              }}>
                                {city.country} · {city.continent}
                              </p>
                              {city.tagline && (
                                <p style={{
                                  fontSize: "12px",
                                  color: "var(--ink-mid)",
                                  fontStyle: "italic",
                                  marginTop: "4px",
                                }}>
                                  {city.tagline}
                                </p>
                              )}
                            </div>

                            {/* Right side */}
                            <div style={{ padding: "16px 24px", textAlign: "right" }}>
                              <div style={{
                                fontSize: "11px",
                                color: "var(--ink-light)",
                                marginBottom: "8px",
                              }}>
                                {city.hotel_count > 0 ? `${city.hotel_count}+ hotels` : "Explore"}
                              </div>
                              <span className="card-arrow" style={{
                                fontSize: "11px",
                                color: "var(--gold)",
                                fontWeight: 500,
                              }}>
                                View &rarr;
                              </span>
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        padding: "80px 60px",
        background: "var(--ink)",
        textAlign: "center",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: "600px", margin: "0 auto" }}
        >
          <div className="type-eyebrow" style={{ marginBottom: "16px", color: "var(--gold)" }}>
            Ready to save?
          </div>
          <h2 className="type-display-2" style={{ color: "var(--cream)", marginBottom: "16px" }}>
            Can&apos;t find your{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>destination?</em>
          </h2>
          <p className="type-body-lg" style={{ color: "rgba(245,240,232,0.5)", marginBottom: "32px" }}>
            We cover 1,500+ hotels globally. Search for any hotel and let us find you a better rate.
          </p>
          <Link
            href="/search"
            className="btn-primary"
            style={{ textDecoration: "none", display: "inline-flex" }}
          >
            Search Hotels
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: "60px 60px 96px",
          background: "var(--cream)",
          borderTop: "1px solid var(--cream-border)",
        }}
      >
        <div
          className="footer-inner"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="type-logo" style={{ color: "var(--ink)", letterSpacing: "0.08em" }}>
              <span style={{ color: "var(--gold)" }}>V</span>oyagr
            </span>
          </Link>
          <div className="footer-links" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            {[
              { label: "Locations", href: "/locations" },
              { label: "Search", href: "/search" },
              { label: "WhatsApp", href: "https://wa.me/919876543210" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="type-caption"
                style={{
                  fontWeight: 400,
                  letterSpacing: "0.08em",
                  color: "var(--ink-light)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--ink-light)",
            letterSpacing: "0.05em",
          }}>
            &copy; 2026 Voyagr
          </p>
        </div>
      </footer>
    </div>
  );
}
