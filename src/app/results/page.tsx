"use client";

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  fetchCityCurations,
  fetchCuratedCities,
  type CuratedHotel,
  type CuratedCity,
} from "@/lib/api";
import { SAMPLE_CITIES } from "@/lib/constants";
import { rankHotels, sortRankedHotels, type RankedHotel, type SortStrategy } from "@/lib/ranking";
import { trackSearch, trackSearchFilterApplied } from "@/lib/analytics";
import { extractAmenities } from "@/components/AmenityIcons";
import { useBooking } from "@/context/BookingContext";
import Header from "@/components/Header";
import ResultCard from "./ResultCard";

const SearchMapView = lazy(() => import("@/components/SearchMapView"));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RESULTS_PER_PAGE = 24;

const SORT_OPTIONS: { label: string; value: SortStrategy }[] = [
  { label: "Lowest Voyagr Rate", value: "price_asc" },
  { label: "Best Value", value: "deal_desc" },
  { label: "Traveller Favourites", value: "popularity_desc" },
  { label: "Recommended", value: "recommended" },
  { label: "Guest Rating", value: "rating_desc" },
  { label: "Stars: High to Low", value: "stars_desc" },
];

const STAR_OPTIONS = [
  { label: "All", value: 0 },
  { label: "3-star", value: 3 },
  { label: "4-star", value: 4 },
  { label: "5-star", value: 5 },
];

const AMENITY_FILTER_OPTIONS = [
  "Pool",
  "Spa",
  "Wi-Fi",
  "Restaurant",
  "Fitness",
  "Parking",
  "Bar",
  "Breakfast",
  "Beach",
  "Concierge",
  "Room Service",
  "Pet Friendly",
];

const PERK_OPTIONS = [
  "Free Cancellation",
  "Instant Confirmation",
  "Pay at Hotel",
  "Best Price Guarantee",
];

// ---------------------------------------------------------------------------
// Price range helpers
// ---------------------------------------------------------------------------
function getPriceRange(hotels: CuratedHotel[]): [number, number] {
  const prices = hotels
    .map((h) => h.rates_from)
    .filter((p): p is number => p != null && p > 0);
  if (prices.length === 0) return [0, 50000];
  return [Math.min(...prices), Math.max(...prices)];
}

// ============================================================================
// Results Page
// ============================================================================
export default function ResultsPage() {
  const searchParams = useSearchParams();
  const citySlug = searchParams.get("city") || "";
  const queryParam = searchParams.get("q") || "";
  const { destination, checkIn, checkOut, nights, formatDate } = useBooking();

  // Data state
  const [hotels, setHotels] = useState<CuratedHotel[]>([]);
  const [cityInfo, setCityInfo] = useState<CuratedCity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [sortBy, setSortBy] = useState<SortStrategy>("recommended");
  const [starFilter, setStarFilter] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [minPrice, setMinPrice] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedPerks, setSelectedPerks] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(RESULTS_PER_PAGE);

  // Lock body scroll when a bottom-sheet is open on mobile
  useEffect(() => {
    if (mobileFiltersOpen || mobileSortOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileFiltersOpen, mobileSortOpen]);

  // Fetch data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        if (citySlug) {
          // Fetch hotels for a specific city
          const data = await fetchCityCurations(citySlug);
          if (cancelled) return;

          setCityInfo(data.city);
          const allHotels = [
            ...data.curations.couples,
            ...data.curations.singles,
            ...data.curations.families,
          ];
          // Deduplicate by master_id (UUID, post Phase D migration)
          const seen = new Set<string>();
          const unique = allHotels.filter((h) => {
            if (seen.has(h.id)) return false;
            seen.add(h.id);
            return true;
          });
          setHotels(unique);

          const [lo, hi] = getPriceRange(unique);
          setMinPrice(lo);
          setMaxPrice(hi);
          setPriceRange([lo, hi]);
        } else if (queryParam) {
          // Fetch from multiple cities matching query
          const cities = await fetchCuratedCities().catch(() =>
            SAMPLE_CITIES.map((c, i) => ({ ...c, city_id: null, hotel_count: 0, display_order: i + 1 }))
          );
          if (cancelled) return;

          const matchingCities = cities.filter(
            (c) =>
              c.city_name.toLowerCase().includes(queryParam.toLowerCase()) ||
              c.country.toLowerCase().includes(queryParam.toLowerCase())
          );

          const targetCities = matchingCities.length > 0 ? matchingCities.slice(0, 3) : cities.slice(0, 3);
          if (targetCities.length > 0) {
            setCityInfo(targetCities[0]);
          }

          const results = await Promise.allSettled(
            targetCities.map((c) => fetchCityCurations(c.city_slug))
          );

          if (cancelled) return;

          const allHotels: CuratedHotel[] = [];
          for (const r of results) {
            if (r.status === "fulfilled") {
              allHotels.push(
                ...r.value.curations.couples,
                ...r.value.curations.singles,
                ...r.value.curations.families
              );
            }
          }

          const seen = new Set<string>();
          const unique = allHotels.filter((h) => {
            if (seen.has(h.id)) return false;
            seen.add(h.id);
            return true;
          });
          setHotels(unique);

          const [lo, hi] = getPriceRange(unique);
          setMinPrice(lo);
          setMaxPrice(hi);
          setPriceRange([lo, hi]);
        } else {
          // No city or query — load featured cities
          const cities = await fetchCuratedCities().catch(() =>
            SAMPLE_CITIES.map((c, i) => ({ ...c, city_id: null, hotel_count: 0, display_order: i + 1 }))
          );
          if (cancelled) return;

          const topCities = cities.slice(0, 4);
          const results = await Promise.allSettled(
            topCities.map((c) => fetchCityCurations(c.city_slug))
          );

          if (cancelled) return;

          const allHotels: CuratedHotel[] = [];
          for (const r of results) {
            if (r.status === "fulfilled") {
              allHotels.push(...r.value.curations.couples);
            }
          }

          const seen = new Set<string>();
          const unique = allHotels.filter((h) => {
            if (seen.has(h.id)) return false;
            seen.add(h.id);
            return true;
          });
          setHotels(unique);

          const [lo, hi] = getPriceRange(unique);
          setMinPrice(lo);
          setMaxPrice(hi);
          setPriceRange([lo, hi]);
        }
      } catch {
        if (!cancelled) setError("Unable to load hotels. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [citySlug, queryParam]);

  // Track search
  useEffect(() => {
    if (hotels.length > 0) {
      trackSearch({
        query: citySlug || queryParam || "browse",
        result_count: hotels.length,
        source: "search_page",
        filters: { star_rating: starFilter, sort_by: sortBy },
      });
    }
  }, [hotels.length, citySlug, queryParam, starFilter, sortBy]);

  // ---------------------------------------------------------------------------
  // Filtering + ranking
  // ---------------------------------------------------------------------------
  const filteredAndRanked = useMemo(() => {
    let filtered = [...hotels];

    // Star filter
    if (starFilter > 0) {
      filtered = filtered.filter(
        (h) => h.star_rating != null && h.star_rating >= starFilter
      );
    }

    // Price filter
    filtered = filtered.filter((h) => {
      if (!h.rates_from) return true;
      return h.rates_from >= priceRange[0] && h.rates_from <= priceRange[1];
    });

    // Amenity filter
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter((h) => {
        const hotelAmenities = extractAmenities(h.overview).map((a) => a.label);
        return selectedAmenities.every((a) => hotelAmenities.includes(a));
      });
    }

    // Rank and sort
    const ranked = rankHotels(filtered);
    return sortRankedHotels(ranked, sortBy);
  }, [hotels, starFilter, priceRange, selectedAmenities, sortBy]);

  const visibleHotels = useMemo(
    () => filteredAndRanked.slice(0, visibleCount),
    [filteredAndRanked, visibleCount]
  );

  const handleSortChange = useCallback(
    (value: SortStrategy) => {
      setSortBy(value);
      setVisibleCount(RESULTS_PER_PAGE);
      trackSearchFilterApplied({
        filter_type: "sort_by",
        filter_value: value,
        result_count: filteredAndRanked.length,
      });
    },
    [filteredAndRanked.length]
  );

  const toggleAmenity = useCallback((amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
    setVisibleCount(RESULTS_PER_PAGE);
  }, []);

  const togglePerk = useCallback((perk: string) => {
    setSelectedPerks((prev) =>
      prev.includes(perk) ? prev.filter((p) => p !== perk) : [...prev, perk]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setStarFilter(0);
    setPriceRange([minPrice, maxPrice]);
    setSelectedAmenities([]);
    setSelectedPerks([]);
    setSortBy("recommended");
    setVisibleCount(RESULTS_PER_PAGE);
  }, [minPrice, maxPrice]);

  const activeFilterCount =
    (starFilter > 0 ? 1 : 0) +
    (priceRange[0] > minPrice || priceRange[1] < maxPrice ? 1 : 0) +
    selectedAmenities.length +
    selectedPerks.length;

  const activeSortLabel = useMemo(
    () => SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Recommended",
    [sortBy]
  );

  const pageTitle = cityInfo
    ? `Hotels in ${cityInfo.city_name}, ${cityInfo.country}`
    : queryParam
    ? `Results for "${queryParam}"`
    : "Browse Hotels";

  // ---------------------------------------------------------------------------
  // Filter Sidebar (shared between desktop and mobile)
  // ---------------------------------------------------------------------------
  const filterContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Price Range */}
      <FilterSection title="Price Range">
        <div style={{ padding: "0 4px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--ink-mid)",
              marginBottom: 12,
              fontFamily: "var(--font-mono)",
            }}
          >
            <span>{formatCurrencyShort(priceRange[0])}</span>
            <span>{formatCurrencyShort(priceRange[1])}</span>
          </div>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={priceRange[0]}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPriceRange(([, hi]) => [Math.min(val, hi - 100), hi]);
              setVisibleCount(RESULTS_PER_PAGE);
            }}
            style={{ width: "100%", accentColor: "var(--gold)", height: 24 }}
          />
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={priceRange[1]}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPriceRange(([lo]) => [lo, Math.max(val, lo + 100)]);
              setVisibleCount(RESULTS_PER_PAGE);
            }}
            style={{ width: "100%", accentColor: "var(--gold)", marginTop: -4, height: 24 }}
          />
        </div>
      </FilterSection>

      {/* Star Rating */}
      <FilterSection title="Star Rating">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {STAR_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                fontSize: 14,
                color: starFilter === opt.value ? "var(--ink)" : "var(--ink-mid)",
                fontWeight: starFilter === opt.value ? 500 : 400,
                padding: "10px 4px",
                minHeight: 44,
              }}
            >
              <input
                type="radio"
                name="star-filter"
                checked={starFilter === opt.value}
                onChange={() => {
                  setStarFilter(opt.value);
                  setVisibleCount(RESULTS_PER_PAGE);
                  trackSearchFilterApplied({
                    filter_type: "star_rating",
                    filter_value: opt.value,
                    result_count: filteredAndRanked.length,
                  });
                }}
                style={{ accentColor: "var(--gold)", width: 18, height: 18 }}
              />
              {opt.value > 0 && (
                <span style={{ color: "var(--gold)", fontSize: 13, letterSpacing: 1 }}>
                  {"★".repeat(opt.value)}
                </span>
              )}
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Amenities */}
      <FilterSection title="Amenities">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {AMENITY_FILTER_OPTIONS.map((amenity) => (
            <label
              key={amenity}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                fontSize: 14,
                color: selectedAmenities.includes(amenity) ? "var(--ink)" : "var(--ink-mid)",
                fontWeight: selectedAmenities.includes(amenity) ? 500 : 400,
                padding: "10px 4px",
                minHeight: 44,
              }}
            >
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                style={{ accentColor: "var(--gold)", width: 18, height: 18 }}
              />
              {amenity}
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Perks */}
      <FilterSection title="Perks">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {PERK_OPTIONS.map((perk) => (
            <label
              key={perk}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                fontSize: 14,
                color: selectedPerks.includes(perk) ? "var(--ink)" : "var(--ink-mid)",
                fontWeight: selectedPerks.includes(perk) ? 500 : 400,
                padding: "10px 4px",
                minHeight: 44,
              }}
            >
              <input
                type="checkbox"
                checked={selectedPerks.includes(perk)}
                onChange={() => togglePerk(perk)}
                style={{ accentColor: "var(--gold)", width: 18, height: 18 }}
              />
              {perk}
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Location Map Mini */}
      <FilterSection title="Location">
        <div
          onClick={() => setShowMap(!showMap)}
          style={{
            height: 140,
            background: "var(--cream-deep)",
            border: "1px solid var(--cream-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              color: "var(--ink-light)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 500 }}>
              {showMap ? "Hide map view" : "View on map"}
            </span>
          </div>
        </div>
      </FilterSection>

      {/* Clear filters */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "transparent",
            border: "1px solid var(--cream-border)",
            color: "var(--ink-mid)",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.06em",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            transition: "all 0.15s ease",
            minHeight: 44,
          }}
        >
          Clear all filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      <Header />
      <main className="results-main">
        {/* Page Header */}
        <div className="results-page-header">
          <div className="results-page-header-inner">
            {/* Breadcrumb */}
            <nav className="results-breadcrumb">
              <Link href="/" style={{ color: "var(--gold)", textDecoration: "none" }}>
                Search
              </Link>
              <span>&rsaquo;</span>
              {cityInfo ? (
                <>
                  <Link
                    href={`/city/${cityInfo.city_slug}`}
                    style={{ color: "var(--gold)", textDecoration: "none" }}
                  >
                    {cityInfo.city_name}
                  </Link>
                  <span>&rsaquo;</span>
                  <span>Results</span>
                </>
              ) : (
                <span>Results</span>
              )}
            </nav>

            <h1
              className="results-title"
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                marginBottom: 8,
              }}
            >
              {pageTitle}
            </h1>

            {/* Stay summary: destination, date range, nights */}
            {(destination || checkIn || checkOut) && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                {(checkIn || checkOut) && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "4px 12px",
                      background: "var(--gold-pale)",
                      color: "var(--gold)",
                      fontFamily: "var(--font-body)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDate(checkIn, "Check-in")} &ndash; {formatDate(checkOut, "Check-out")}
                  </span>
                )}
                {nights > 0 && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 12px",
                      background: "var(--cream-deep)",
                      color: "var(--ink-mid)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    {nights} night{nights !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}

            {!loading && (
              <p style={{ fontSize: 13, color: "var(--ink-light)", margin: 0 }}>
                {filteredAndRanked.length} hotel{filteredAndRanked.length !== 1 ? "s" : ""} found
                {activeFilterCount > 0 &&
                  ` (${activeFilterCount} filter${activeFilterCount !== 1 ? "s" : ""} applied)`}
              </p>
            )}
          </div>
        </div>

        {/* ── Sticky control bar ──
            Desktop: sort pills + view toggle in one row.
            Mobile : horizontally scrolling STAR pills only (filter/sort live in
                     the floating bottom bar). Edge mask gives a soft fade. */}
        <div className="results-controlbar">
          <div className="results-controlbar-inner">
            {/* Desktop sort pill row */}
            <div className="results-sortrow-desktop">
              {/* Star filter pills */}
              {STAR_OPTIONS.map((opt) => {
                const active = starFilter === opt.value;
                return (
                  <button
                    key={`star-${opt.value}`}
                    onClick={() => {
                      setStarFilter(active ? 0 : opt.value);
                      setVisibleCount(RESULTS_PER_PAGE);
                      trackSearchFilterApplied({
                        filter_type: "star_rating",
                        filter_value: active ? 0 : opt.value,
                        result_count: filteredAndRanked.length,
                      });
                    }}
                    style={{
                      padding: "6px 14px",
                      fontSize: 11,
                      fontWeight: active ? 600 : 400,
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                      border: active ? "1px solid var(--gold)" : "1px solid var(--cream-border)",
                      background: active ? "var(--gold-pale)" : "var(--white)",
                      color: active ? "var(--gold)" : "var(--ink-mid)",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {opt.value > 0 ? `${opt.value}★` : opt.label}
                  </button>
                );
              })}

              {/* Divider */}
              <div
                style={{
                  width: 1,
                  height: 20,
                  background: "var(--cream-border)",
                  flexShrink: 0,
                }}
              />

              {/* Sort pills */}
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  style={{
                    padding: "6px 14px",
                    fontSize: 11,
                    fontWeight: sortBy === opt.value ? 600 : 400,
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                    border:
                      sortBy === opt.value
                        ? "1px solid var(--gold)"
                        : "1px solid var(--cream-border)",
                    background: sortBy === opt.value ? "var(--gold-pale)" : "var(--white)",
                    color: sortBy === opt.value ? "var(--gold)" : "var(--ink-mid)",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Mobile star pill strip — momentum-scroll with edge fade */}
            <div className="results-pillstrip-mobile">
              <div className="results-pillstrip-track">
                {STAR_OPTIONS.map((opt) => {
                  const active = starFilter === opt.value;
                  return (
                    <button
                      key={`mstar-${opt.value}`}
                      onClick={() => {
                        setStarFilter(active ? 0 : opt.value);
                        setVisibleCount(RESULTS_PER_PAGE);
                        trackSearchFilterApplied({
                          filter_type: "star_rating",
                          filter_value: active ? 0 : opt.value,
                          result_count: filteredAndRanked.length,
                        });
                      }}
                      className="results-pill"
                      style={{
                        border: active ? "1px solid var(--gold)" : "1px solid var(--cream-border)",
                        background: active ? "var(--gold-pale)" : "var(--white)",
                        color: active ? "var(--gold)" : "var(--ink-mid)",
                        fontWeight: active ? 600 : 500,
                      }}
                    >
                      {opt.value > 0 ? `${opt.value}★` : opt.label}
                    </button>
                  );
                })}

                <span className="results-pillstrip-sep" aria-hidden />

                {PERK_OPTIONS.map((perk) => {
                  const active = selectedPerks.includes(perk);
                  return (
                    <button
                      key={`mperk-${perk}`}
                      onClick={() => togglePerk(perk)}
                      className="results-pill"
                      style={{
                        border: active ? "1px solid var(--gold)" : "1px solid var(--cream-border)",
                        background: active ? "var(--gold-pale)" : "var(--white)",
                        color: active ? "var(--gold)" : "var(--ink-mid)",
                        fontWeight: active ? 600 : 500,
                      }}
                    >
                      {perk}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop view toggle */}
            <div className="results-viewtoggle-desktop" style={{ gap: 4 }}>
              <button
                onClick={() => setShowMap(false)}
                style={{
                  padding: "6px 10px",
                  border: "1px solid var(--cream-border)",
                  background: !showMap ? "var(--gold-pale)" : "var(--white)",
                  color: !showMap ? "var(--gold)" : "var(--ink-light)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Grid view"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                onClick={() => setShowMap(true)}
                style={{
                  padding: "6px 10px",
                  border: "1px solid var(--cream-border)",
                  background: showMap ? "var(--gold-pale)" : "var(--white)",
                  color: showMap ? "var(--gold)" : "var(--ink-light)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Map view"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main content: sidebar + grid */}
        <div className="results-shell">
          {/* Desktop sidebar */}
          <aside className="results-sidebar-desktop">
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-mid)",
                marginBottom: 20,
                fontFamily: "var(--font-body)",
              }}
            >
              Filters
            </div>
            {filterContent}
          </aside>

          {/* Results area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Loading state */}
            {loading && (
              <div className="results-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="results-skeleton"
                    style={{
                      background: "var(--white)",
                      border: "1px solid var(--cream-border)",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 24px",
                  color: "var(--ink-light)",
                }}
              >
                <p style={{ fontSize: 15, marginBottom: 12 }}>{error}</p>
                <Link
                  href="/"
                  style={{
                    color: "var(--gold)",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  Return to home
                </Link>
              </div>
            )}

            {/* Map view */}
            {showMap && !loading && (
              <div style={{ marginBottom: 24 }}>
                <Suspense
                  fallback={
                    <div
                      style={{
                        height: 500,
                        background: "var(--cream-deep)",
                        border: "1px solid var(--cream-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--ink-light)",
                        fontSize: 13,
                      }}
                    >
                      Loading map...
                    </div>
                  }
                >
                  <SearchMapView
                    hotels={filteredAndRanked.map((r) => ({
                      id: r.hotel.id,
                      master_id: r.hotel.id,
                      slug: r.hotel.slug,
                      short_id: r.hotel.short_id,
                      hotel_name: r.hotel.hotel_name,
                      city: r.hotel.city_name,
                      country: r.hotel.country,
                      star_rating: r.hotel.star_rating,
                      photo1: r.hotel.photo1,
                      latitude: r.hotel.latitude,
                      longitude: r.hotel.longitude,
                    }))}
                  />
                </Suspense>
              </div>
            )}

            {/* Hotel grid */}
            {!loading && !error && filteredAndRanked.length > 0 && (
              <>
                <div className="results-grid">
                  {visibleHotels.map((ranked, index) => (
                    <ResultCard
                      key={ranked.hotel.id}
                      ranked={ranked}
                      index={index}
                    />
                  ))}
                </div>

                {/* Load more — full-width on phone */}
                {visibleCount < filteredAndRanked.length && (
                  <div className="results-loadmore-wrap">
                    <button
                      onClick={() => setVisibleCount((c) => c + RESULTS_PER_PAGE)}
                      className="results-loadmore-btn"
                    >
                      Show more hotels ({filteredAndRanked.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {!loading && !error && filteredAndRanked.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 24px",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    margin: "0 auto 16px",
                    background: "var(--cream-deep)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--ink-light)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--ink)",
                    fontWeight: 500,
                    marginBottom: 6,
                  }}
                >
                  No hotels match your filters
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--ink-light)",
                    marginBottom: 16,
                  }}
                >
                  Try adjusting your filters or clearing them to see all results.
                </p>
                <button
                  onClick={clearAllFilters}
                  style={{
                    padding: "12px 24px",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    border: "1px solid var(--gold)",
                    background: "transparent",
                    color: "var(--gold)",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    minHeight: 44,
                  }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Phone-only floating action bar — Sort · Filter
            Hidden on desktop, sits above the global mobile tab bar. */}
        <div className="results-mobile-actionbar" aria-hidden={mobileFiltersOpen || mobileSortOpen}>
          <button
            type="button"
            onClick={() => setMobileSortOpen(true)}
            className="results-mobile-actionbtn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h13" />
              <path d="M3 12h9" />
              <path d="M3 18h5" />
              <path d="M17 4v16" />
              <path d="M21 16l-4 4-4-4" />
            </svg>
            <span className="results-mobile-actionbtn-label">
              <span className="results-mobile-actionbtn-title">Sort</span>
              <span className="results-mobile-actionbtn-sub">{activeSortLabel}</span>
            </span>
          </button>
          <div className="results-mobile-actionbar-sep" />
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="results-mobile-actionbtn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="20" y2="12" />
              <line x1="12" y1="18" x2="20" y2="18" />
            </svg>
            <span className="results-mobile-actionbtn-label">
              <span className="results-mobile-actionbtn-title">
                Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
              </span>
              <span className="results-mobile-actionbtn-sub">
                {activeFilterCount > 0 ? "Tap to refine" : "Stars, price, perks"}
              </span>
            </span>
          </button>
        </div>

        {/* Phone bottom sheet — Filters */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <>
              <motion.div
                key="filters-scrim"
                className="results-sheet-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setMobileFiltersOpen(false)}
              />
              <motion.div
                key="filters-sheet"
                className="results-sheet"
                role="dialog"
                aria-label="Filter hotels"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="results-sheet-handle" />
                <div className="results-sheet-header">
                  <span className="results-sheet-title">Filters</span>
                  <button
                    type="button"
                    aria-label="Close filters"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="results-sheet-close"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="results-sheet-body">{filterContent}</div>
                <div className="results-sheet-footer">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="results-sheet-footer-clear"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="results-sheet-footer-apply"
                  >
                    Show {filteredAndRanked.length} stay{filteredAndRanked.length !== 1 ? "s" : ""}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Phone bottom sheet — Sort */}
        <AnimatePresence>
          {mobileSortOpen && (
            <>
              <motion.div
                key="sort-scrim"
                className="results-sheet-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setMobileSortOpen(false)}
              />
              <motion.div
                key="sort-sheet"
                className="results-sheet results-sheet-short"
                role="dialog"
                aria-label="Sort hotels"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="results-sheet-handle" />
                <div className="results-sheet-header">
                  <span className="results-sheet-title">Sort by</span>
                  <button
                    type="button"
                    aria-label="Close sort"
                    onClick={() => setMobileSortOpen(false)}
                    className="results-sheet-close"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="results-sheet-body" style={{ paddingTop: 4 }}>
                  <div role="radiogroup" aria-label="Sort options">
                    {SORT_OPTIONS.map((opt) => {
                      const active = sortBy === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => {
                            handleSortChange(opt.value);
                            setMobileSortOpen(false);
                          }}
                          className="results-sort-option"
                          style={{
                            color: active ? "var(--ink)" : "var(--ink-mid)",
                            fontWeight: active ? 600 : 400,
                          }}
                        >
                          <span>{opt.label}</span>
                          {active && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* ── Inline styles: skeleton + all responsive layout rules ──
          Phone-first. md = 768px breakpoint matches Tailwind defaults. */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }

        /* Main shell */
        .results-main {
          background: var(--cream);
          min-height: 100vh;
          padding-top: 60px;
          padding-bottom: 88px; /* room for floating action bar + tab bar */
        }
        @media (min-width: 768px) {
          .results-main {
            padding-top: 80px;
            padding-bottom: 0;
          }
        }

        /* Page header card */
        .results-page-header {
          background: var(--white);
          border-bottom: 1px solid var(--cream-border);
          padding: 20px 0 16px;
        }
        @media (min-width: 768px) {
          .results-page-header {
            padding: 32px 0 24px;
          }
        }
        .results-page-header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px;
        }
        @media (min-width: 768px) {
          .results-page-header-inner {
            padding: 0 24px;
          }
        }

        .results-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--ink-light);
          margin-bottom: 10px;
          font-family: var(--font-body);
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .results-title {
          font-size: clamp(24px, 7vw, 40px);
          line-height: 1.1;
        }

        /* Sticky control bar */
        .results-controlbar {
          background: var(--white);
          border-bottom: 1px solid var(--cream-border);
          position: sticky;
          top: 60px;
          z-index: 20;
        }
        @media (min-width: 768px) {
          .results-controlbar {
            top: 72px;
          }
        }
        .results-controlbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .results-controlbar-inner {
            padding: 12px 24px;
            gap: 16px;
          }
        }

        /* Desktop sort + star pill row */
        .results-sortrow-desktop {
          display: none;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          flex: 1;
          align-items: center;
        }
        .results-sortrow-desktop::-webkit-scrollbar { display: none; }
        @media (min-width: 768px) {
          .results-sortrow-desktop { display: flex; }
        }

        /* Mobile pill strip — full-bleed, momentum scroll, edge fade */
        .results-pillstrip-mobile {
          flex: 1;
          min-width: 0;
          position: relative;
          margin: 0 -16px;
          padding: 0;
          /* soft fade on left/right edges */
          mask-image: linear-gradient(
            to right,
            transparent 0,
            #000 16px,
            #000 calc(100% - 16px),
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0,
            #000 16px,
            #000 calc(100% - 16px),
            transparent 100%
          );
        }
        @media (min-width: 768px) {
          .results-pillstrip-mobile { display: none; }
        }
        .results-pillstrip-track {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 2px 16px;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .results-pillstrip-track::-webkit-scrollbar { display: none; }
        .results-pillstrip-sep {
          width: 1px;
          height: 20px;
          background: var(--cream-border);
          flex-shrink: 0;
          align-self: center;
        }
        .results-pill {
          padding: 8px 14px;
          font-size: 12px;
          letter-spacing: 0.04em;
          white-space: nowrap;
          cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.15s ease;
          border-radius: 999px;
          flex-shrink: 0;
          scroll-snap-align: start;
          min-height: 32px;
        }

        .results-viewtoggle-desktop {
          display: none;
        }
        @media (min-width: 768px) {
          .results-viewtoggle-desktop { display: flex; }
        }

        /* Layout shell */
        .results-shell {
          max-width: 1280px;
          margin: 0 auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: stretch;
        }
        @media (min-width: 768px) {
          .results-shell {
            padding: 24px;
            flex-direction: row;
            gap: 28px;
            align-items: flex-start;
          }
        }

        /* Sidebar */
        .results-sidebar-desktop {
          display: none;
        }
        @media (min-width: 768px) {
          .results-sidebar-desktop {
            display: block;
            width: 260px;
            flex-shrink: 0;
            position: sticky;
            top: 130px;
            max-height: calc(100vh - 150px);
            overflow-y: auto;
            scrollbar-width: thin;
            background: var(--white);
            border: 1px solid var(--cream-border);
            padding: 20px;
          }
        }

        /* Hotel grid — 1 col phone, 2 col tablet, auto-fill desktop */
        .results-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 560px) {
          .results-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 18px;
          }
        }
        @media (min-width: 1024px) {
          .results-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
          }
        }

        /* Skeleton sizing */
        .results-skeleton {
          height: 320px;
        }
        @media (min-width: 768px) {
          .results-skeleton { height: 380px; }
        }

        /* Load-more button — full width on phone */
        .results-loadmore-wrap {
          text-align: center;
          margin-top: 24px;
        }
        @media (min-width: 768px) {
          .results-loadmore-wrap { margin-top: 32px; }
        }
        .results-loadmore-btn {
          width: 100%;
          max-width: 100%;
          padding: 14px 24px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: 1px solid var(--gold);
          background: transparent;
          color: var(--gold);
          cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.15s ease;
          min-height: 48px;
        }
        @media (min-width: 768px) {
          .results-loadmore-btn {
            width: auto;
            padding: 12px 32px;
            min-height: 44px;
          }
        }
        @media (hover: hover) {
          .results-loadmore-btn:hover {
            background: var(--gold);
            color: var(--white);
          }
        }

        /* Mobile floating action bar — Sort · Filter
           Lives above the global mobile tab bar (56px) and CompareBar. */
        .results-mobile-actionbar {
          display: none;
          position: fixed;
          left: 12px;
          right: 12px;
          bottom: calc(12px + env(safe-area-inset-bottom, 0));
          z-index: 90;
          background: var(--ink);
          color: var(--white);
          border: 1px solid rgba(201, 168, 76, 0.35);
          border-radius: 14px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
          padding: 6px;
          gap: 4px;
          align-items: stretch;
        }
        @media (max-width: 767px) {
          .results-mobile-actionbar { display: flex; }
        }
        /* When the global bottom tab bar is visible (≤639px) lift the action
           bar above it so it doesn't collide. */
        @media (max-width: 639px) {
          .results-mobile-actionbar {
            bottom: calc(68px + env(safe-area-inset-bottom, 0));
          }
        }

        .results-mobile-actionbtn {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: transparent;
          border: none;
          color: var(--white);
          cursor: pointer;
          font-family: var(--font-body);
          text-align: left;
          min-height: 48px;
          border-radius: 10px;
          transition: background 0.15s ease;
        }
        .results-mobile-actionbtn:active {
          background: rgba(255, 255, 255, 0.06);
        }
        .results-mobile-actionbtn-label {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
          min-width: 0;
        }
        .results-mobile-actionbtn-title {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .results-mobile-actionbtn-sub {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 0.02em;
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 40vw;
        }
        .results-mobile-actionbar-sep {
          width: 1px;
          background: rgba(255, 255, 255, 0.12);
          margin: 8px 0;
        }

        /* Bottom sheet — scrim + panel */
        .results-sheet-scrim {
          position: fixed;
          inset: 0;
          background: rgba(15, 12, 6, 0.45);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          z-index: 199;
        }
        .results-sheet {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 200;
          background: var(--white);
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          box-shadow: 0 -16px 48px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          max-height: 92vh;
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        .results-sheet-short {
          max-height: 70vh;
        }
        .results-sheet-handle {
          width: 36px;
          height: 4px;
          background: var(--cream-border);
          border-radius: 2px;
          margin: 8px auto 4px;
          flex-shrink: 0;
        }
        .results-sheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 20px 12px;
          border-bottom: 1px solid var(--cream-border);
          flex-shrink: 0;
        }
        .results-sheet-title {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 22px;
          color: var(--ink);
        }
        .results-sheet-close {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          color: var(--ink-mid);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
        }
        .results-sheet-close:active {
          background: var(--cream-deep);
        }
        .results-sheet-body {
          padding: 16px 20px 20px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          flex: 1;
        }
        .results-sheet-footer {
          display: flex;
          gap: 10px;
          padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0));
          border-top: 1px solid var(--cream-border);
          background: var(--white);
          flex-shrink: 0;
        }
        .results-sheet-footer-clear {
          flex: 1;
          padding: 14px 18px;
          background: transparent;
          color: var(--ink-mid);
          border: 1px solid var(--cream-border);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: var(--font-body);
          min-height: 48px;
          border-radius: 2px;
        }
        .results-sheet-footer-apply {
          flex: 2;
          padding: 14px 18px;
          background: var(--ink);
          color: var(--white);
          border: 1px solid var(--ink);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: var(--font-body);
          min-height: 48px;
          border-radius: 2px;
        }

        /* Sort options in bottom sheet */
        .results-sort-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 14px 4px;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--cream-border);
          font-size: 15px;
          font-family: var(--font-body);
          cursor: pointer;
          text-align: left;
          min-height: 52px;
        }
        .results-sort-option:last-child {
          border-bottom: none;
        }
      `}</style>
    </>
  );
}

// ---------------------------------------------------------------------------
// FilterSection component
// ---------------------------------------------------------------------------
function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "0 0 10px",
          background: "none",
          border: "none",
          borderBottom: "1px solid var(--cream-border)",
          cursor: "pointer",
          marginBottom: 12,
          minHeight: 32,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink)",
            fontFamily: "var(--font-body)",
          }}
        >
          {title}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--ink-light)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrencyShort(amount: number): string {
  if (amount >= 10000) return `$${Math.round(amount / 1000)}k`;
  return `$${Math.round(amount).toLocaleString()}`;
}
