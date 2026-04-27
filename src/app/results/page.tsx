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
  const [visibleCount, setVisibleCount] = useState(RESULTS_PER_PAGE);

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
          // Deduplicate by tj_hotel_id (TEXT, post Phase 1 migration)
          const seen = new Set<string>();
          const unique = allHotels.filter((h) => {
            if (seen.has(h.tj_hotel_id)) return false;
            seen.add(h.tj_hotel_id);
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
            if (seen.has(h.tj_hotel_id)) return false;
            seen.add(h.tj_hotel_id);
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
            if (seen.has(h.tj_hotel_id)) return false;
            seen.add(h.tj_hotel_id);
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
            style={{ width: "100%", accentColor: "var(--gold)" }}
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
            style={{ width: "100%", accentColor: "var(--gold)", marginTop: -4 }}
          />
        </div>
      </FilterSection>

      {/* Star Rating */}
      <FilterSection title="Star Rating">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STAR_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 13,
                color: starFilter === opt.value ? "var(--ink)" : "var(--ink-mid)",
                fontWeight: starFilter === opt.value ? 500 : 400,
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
                style={{ accentColor: "var(--gold)" }}
              />
              {opt.value > 0 && (
                <span style={{ color: "var(--gold)", fontSize: 12, letterSpacing: 1 }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {AMENITY_FILTER_OPTIONS.map((amenity) => (
            <label
              key={amenity}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 13,
                color: selectedAmenities.includes(amenity) ? "var(--ink)" : "var(--ink-mid)",
                fontWeight: selectedAmenities.includes(amenity) ? 500 : 400,
              }}
            >
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                style={{ accentColor: "var(--gold)" }}
              />
              {amenity}
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Perks */}
      <FilterSection title="Perks">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {PERK_OPTIONS.map((perk) => (
            <label
              key={perk}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 13,
                color: selectedPerks.includes(perk) ? "var(--ink)" : "var(--ink-mid)",
                fontWeight: selectedPerks.includes(perk) ? 500 : 400,
              }}
            >
              <input
                type="checkbox"
                checked={selectedPerks.includes(perk)}
                onChange={() => togglePerk(perk)}
                style={{ accentColor: "var(--gold)" }}
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
            padding: "10px 16px",
            background: "transparent",
            border: "1px solid var(--cream-border)",
            color: "var(--ink-mid)",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.06em",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            transition: "all 0.15s ease",
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
      <main
        style={{
          background: "var(--cream)",
          minHeight: "100vh",
          paddingTop: 80,
        }}
      >
        {/* Page Header */}
        <div
          style={{
            background: "var(--white)",
            borderBottom: "1px solid var(--cream-border)",
            padding: "32px 0 24px",
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "0 24px",
            }}
          >
            {/* Breadcrumb */}
            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "var(--ink-light)",
                marginBottom: 12,
                fontFamily: "var(--font-body)",
              }}
            >
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
              className="type-display-2"
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

        {/* Sorting bar + mobile filter toggle */}
        <div
          style={{
            background: "var(--white)",
            borderBottom: "1px solid var(--cream-border)",
            position: "sticky",
            top: 64,
            zIndex: 20,
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            {/* Filter + sort pills */}
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                scrollbarWidth: "none",
                flex: 1,
                alignItems: "center",
              }}
            >
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

            {/* Mobile filter toggle */}
            <button
              className="md:hidden"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                fontSize: 11,
                fontWeight: 500,
                border: "1px solid var(--cream-border)",
                background:
                  activeFilterCount > 0 ? "var(--gold-pale)" : "var(--white)",
                color: activeFilterCount > 0 ? "var(--gold)" : "var(--ink-mid)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                whiteSpace: "nowrap",
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
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="20" y2="12" />
                <line x1="12" y1="18" x2="20" y2="18" />
              </svg>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>

            {/* Desktop view toggle */}
            <div className="hidden md:flex" style={{ gap: 4 }}>
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

        {/* Mobile filters drawer */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <motion.div
              className="md:hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                overflow: "hidden",
                background: "var(--white)",
                borderBottom: "1px solid var(--cream-border)",
              }}
            >
              <div style={{ padding: "20px 24px" }}>{filterContent}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content: sidebar + grid */}
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "24px",
            display: "flex",
            gap: 28,
            alignItems: "flex-start",
          }}
        >
          {/* Desktop sidebar */}
          <aside
            className="hidden md:block"
            style={{
              width: 260,
              flexShrink: 0,
              position: "sticky",
              top: 130,
              maxHeight: "calc(100vh - 150px)",
              overflowY: "auto",
              scrollbarWidth: "thin",
              background: "var(--white)",
              border: "1px solid var(--cream-border)",
              padding: 20,
            }}
          >
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 20,
                }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--white)",
                      border: "1px solid var(--cream-border)",
                      height: 380,
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
                      hotel_id: r.hotel.tj_hotel_id,
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 20,
                  }}
                >
                  {visibleHotels.map((ranked, index) => (
                    <ResultCard
                      key={ranked.hotel.tj_hotel_id}
                      ranked={ranked}
                      index={index}
                    />
                  ))}
                </div>

                {/* Load more */}
                {visibleCount < filteredAndRanked.length && (
                  <div style={{ textAlign: "center", marginTop: 32 }}>
                    <button
                      onClick={() => setVisibleCount((c) => c + RESULTS_PER_PAGE)}
                      style={{
                        padding: "12px 32px",
                        fontSize: 12,
                        fontWeight: 500,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        border: "1px solid var(--gold)",
                        background: "transparent",
                        color: "var(--gold)",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        transition: "all 0.15s ease",
                      }}
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
                    padding: "10px 24px",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    border: "1px solid var(--gold)",
                    background: "transparent",
                    color: "var(--gold)",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Skeleton pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
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
