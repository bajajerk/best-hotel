"use client";

import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
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
// Results Page — dark luxe re-theme
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
  // Desktop sort dropdown — replaces the old 6-pill row
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

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

  // Close the desktop sort dropdown on outside click / Esc
  useEffect(() => {
    if (!sortMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setSortMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSortMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [sortMenuOpen]);

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

  const eyebrowText = cityInfo
    ? cityInfo.country.toUpperCase()
    : queryParam
    ? "SEARCH RESULTS"
    : "THE VOYAGR INDEX";

  // ---------------------------------------------------------------------------
  // Filter Sidebar (shared between desktop and mobile)
  // ---------------------------------------------------------------------------
  const filterContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Price Range */}
      <FilterSection title="Price Range">
        <div style={{ padding: "0 4px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "var(--luxe-soft-white-70)",
              marginBottom: 12,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em",
              fontVariantNumeric: "tabular-nums",
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
            style={{ width: "100%", accentColor: "var(--luxe-champagne)", height: 24, background: "transparent" }}
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
            style={{ width: "100%", accentColor: "var(--luxe-champagne)", marginTop: -4, height: 24, background: "transparent" }}
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
                color: starFilter === opt.value ? "var(--luxe-soft-white)" : "var(--luxe-soft-white-70)",
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
                style={{ accentColor: "var(--luxe-champagne)", width: 18, height: 18 }}
              />
              {opt.value > 0 && <StarRow count={opt.value} />}
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
                color: selectedAmenities.includes(amenity) ? "var(--luxe-soft-white)" : "var(--luxe-soft-white-70)",
                fontWeight: selectedAmenities.includes(amenity) ? 500 : 400,
                padding: "10px 4px",
                minHeight: 44,
              }}
            >
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                style={{ accentColor: "var(--luxe-champagne)", width: 18, height: 18 }}
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
                color: selectedPerks.includes(perk) ? "var(--luxe-soft-white)" : "var(--luxe-soft-white-70)",
                fontWeight: selectedPerks.includes(perk) ? 500 : 400,
                padding: "10px 4px",
                minHeight: 44,
              }}
            >
              <input
                type="checkbox"
                checked={selectedPerks.includes(perk)}
                onChange={() => togglePerk(perk)}
                style={{ accentColor: "var(--luxe-champagne)", width: 18, height: 18 }}
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
            background: "var(--luxe-black-2)",
            border: "1px solid var(--luxe-hairline-strong)",
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
              color: "var(--luxe-soft-white-70)",
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
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
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
            border: "1px solid var(--luxe-hairline-strong)",
            color: "var(--luxe-soft-white-70)",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
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
    <div className="luxe">
      <Header />
      <main className="results-main">
        {/* Editorial page header */}
        <div className="results-page-header">
          <div className="results-page-header-inner">
            {/* Breadcrumb */}
            <nav className="results-breadcrumb">
              <Link href="/" style={{ color: "var(--luxe-champagne)", textDecoration: "none" }}>
                Search
              </Link>
              <span>&rsaquo;</span>
              {cityInfo ? (
                <>
                  <Link
                    href={`/city/${cityInfo.city_slug}`}
                    style={{ color: "var(--luxe-champagne)", textDecoration: "none" }}
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

            {/* Champagne mono-caps eyebrow */}
            <div className="results-eyebrow">{eyebrowText}</div>

            <h1 className="results-title">{pageTitle}</h1>

            {/* Stay summary: destination, date range, nights */}
            {(destination || checkIn || checkOut) && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                {(checkIn || checkOut) && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 500,
                      padding: "5px 12px",
                      background: "var(--luxe-champagne-soft)",
                      color: "var(--luxe-champagne)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      border: "1px solid var(--luxe-champagne-line)",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 500,
                      padding: "5px 12px",
                      background: "transparent",
                      color: "var(--luxe-soft-white-70)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      border: "1px solid var(--luxe-hairline-strong)",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    {nights} night{nights !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}

            {!loading && (
              <p className="results-count">
                {filteredAndRanked.length} hotel{filteredAndRanked.length !== 1 ? "s" : ""} found
                {activeFilterCount > 0 &&
                  ` · ${activeFilterCount} filter${activeFilterCount !== 1 ? "s" : ""} applied`}
              </p>
            )}
          </div>
        </div>

        {/* ── Sticky control bar ──
            Desktop: star chips + perk chips on the left, single Sort dropdown at right.
            Mobile : horizontally scrolling chips only (filter/sort live in
                     the floating bottom bar). Edge mask gives a soft fade. */}
        <div className="results-controlbar">
          <div className="results-controlbar-inner">
            {/* Desktop chip row — stars + perks, then divider, then sort trigger on the right */}
            <div className="results-sortrow-desktop">
              {/* Star filter chips */}
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
                    className={`results-chip${active ? " is-active" : ""}`}
                  >
                    {opt.value > 0 ? `${opt.value}-STAR` : "ALL STARS"}
                  </button>
                );
              })}

              {/* Hairline divider */}
              <div className="results-chip-sep" aria-hidden />

              {/* Perk chips */}
              {PERK_OPTIONS.map((perk) => {
                const active = selectedPerks.includes(perk);
                return (
                  <button
                    key={`perk-${perk}`}
                    onClick={() => togglePerk(perk)}
                    className={`results-chip${active ? " is-active" : ""}`}
                  >
                    {perk.toUpperCase()}
                  </button>
                );
              })}
            </div>

            {/* Mobile pill strip — star + perks momentum-scroll */}
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
                      className={`results-pill${active ? " is-active" : ""}`}
                    >
                      {opt.value > 0 ? `${opt.value}-STAR` : "ALL STARS"}
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
                      className={`results-pill${active ? " is-active" : ""}`}
                    >
                      {perk.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop right cluster: Sort dropdown + view toggle */}
            <div className="results-rightcluster">
              {/* Sort dropdown — collapses 6 pills to one trigger */}
              <div className="results-sort-dropdown" ref={sortMenuRef}>
                <button
                  type="button"
                  className="results-sort-trigger"
                  onClick={() => setSortMenuOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={sortMenuOpen}
                >
                  <span className="results-sort-trigger-eyebrow">SORT</span>
                  <span className="results-sort-trigger-value">{activeSortLabel}</span>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      marginLeft: 4,
                      transform: sortMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                <AnimatePresence>
                  {sortMenuOpen && (
                    <motion.div
                      role="listbox"
                      aria-label="Sort options"
                      className="results-sort-menu"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.14 }}
                    >
                      {SORT_OPTIONS.map((opt) => {
                        const active = sortBy === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="option"
                            aria-selected={active}
                            onClick={() => {
                              handleSortChange(opt.value);
                              setSortMenuOpen(false);
                            }}
                            className={`results-sort-menu-item${active ? " is-active" : ""}`}
                          >
                            <span>{opt.label}</span>
                            {active && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--luxe-champagne)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* View toggle */}
              <div className="results-viewtoggle-desktop">
                <button
                  onClick={() => setShowMap(false)}
                  className={`results-viewbtn${!showMap ? " is-active" : ""}`}
                  aria-label="Grid view"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowMap(true)}
                  className={`results-viewbtn${showMap ? " is-active" : ""}`}
                  aria-label="Map view"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                    <line x1="8" y1="2" x2="8" y2="18" />
                    <line x1="16" y1="6" x2="16" y2="22" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content: sidebar + grid */}
        <div className="results-shell">
          {/* Desktop sidebar */}
          <aside className="results-sidebar-desktop">
            <div className="results-sidebar-eyebrow">Refine</div>
            {filterContent}
          </aside>

          {/* Results area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Loading state — champagne pulse */}
            {loading && (
              <div className="results-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="results-skeleton" />
                ))}
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="results-emptywrap">
                <div className="results-empty-eyebrow">UNEXPECTED</div>
                <p className="results-empty-headline">
                  Our concierge couldn&rsquo;t reach the wire.
                </p>
                <p className="results-empty-sub">{error}</p>
                <Link href="/" className="results-empty-cta">
                  Return to home
                </Link>
              </div>
            )}

            {/* Map view */}
            {showMap && !loading && (
              <div style={{ marginBottom: 28 }}>
                <Suspense
                  fallback={
                    <div
                      style={{
                        height: 500,
                        background: "var(--luxe-black-2)",
                        border: "1px solid var(--luxe-hairline-strong)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--luxe-soft-white-70)",
                        fontSize: 12,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Loading map…
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

            {/* Empty state — editorial */}
            {!loading && !error && filteredAndRanked.length === 0 && (
              <div className="results-emptywrap">
                <div className="results-empty-eyebrow">NOTHING TO SHOW · YET</div>
                <p className="results-empty-headline">
                  No stays match the brief.
                </p>
                <p className="results-empty-sub">
                  Loosen a filter, or let our concierge curate a shortlist for you.
                </p>
                <div className="results-empty-actions">
                  <button onClick={clearAllFilters} className="results-empty-cta">
                    Clear all filters
                  </button>
                  <Link href="/concierge" className="results-empty-cta-ghost">
                    Speak with the concierge
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phone-only floating action bar — Sort · Filter
            Sits on dark luxe ground now; hairline border tunes to brand. */}
        <div className="results-mobile-actionbar" aria-hidden={mobileFiltersOpen || mobileSortOpen}>
          <button
            type="button"
            onClick={() => setMobileSortOpen(true)}
            className="results-mobile-actionbtn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                            color: active ? "var(--luxe-soft-white)" : "var(--luxe-soft-white-70)",
                            fontWeight: active ? 600 : 400,
                          }}
                        >
                          <span>{opt.label}</span>
                          {active && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--luxe-champagne)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* ── Inline styles: dark luxe re-skin + responsive layout ── */}
      <style>{`
        @keyframes resultsPulse {
          0%, 100% { opacity: 0.32; }
          50% { opacity: 0.62; }
        }
        @keyframes resultsShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* Main shell */
        .results-main {
          background: var(--luxe-black);
          color: var(--luxe-soft-white);
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

        /* Editorial page header */
        .results-page-header {
          background: var(--luxe-black);
          border-bottom: 1px solid var(--luxe-hairline);
          padding: 28px 0 22px;
        }
        @media (min-width: 768px) {
          .results-page-header {
            padding: 48px 0 32px;
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
          color: var(--luxe-soft-white-50);
          margin-bottom: 14px;
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .results-eyebrow {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.28em;
          color: var(--luxe-champagne);
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        @media (min-width: 768px) {
          .results-eyebrow {
            font-size: 11px;
            margin-bottom: 14px;
          }
        }

        .results-title {
          color: var(--luxe-soft-white);
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 400;
          font-size: clamp(28px, 7.4vw, 48px);
          line-height: 1.05;
          letter-spacing: -0.01em;
          margin: 0 0 14px;
        }

        .results-count {
          font-size: 12px;
          color: var(--luxe-soft-white-50);
          letter-spacing: 0.04em;
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
          margin: 0;
        }

        /* Sticky control bar */
        .results-controlbar {
          background: var(--luxe-black);
          border-bottom: 1px solid var(--luxe-hairline);
          position: sticky;
          top: 60px;
          z-index: 20;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        @media (min-width: 768px) {
          .results-controlbar {
            top: 72px;
          }
        }
        .results-controlbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .results-controlbar-inner {
            padding: 14px 24px;
            gap: 18px;
          }
        }

        /* Desktop chip row */
        .results-sortrow-desktop {
          display: none;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          flex: 1;
          align-items: center;
          min-width: 0;
        }
        .results-sortrow-desktop::-webkit-scrollbar { display: none; }
        @media (min-width: 768px) {
          .results-sortrow-desktop { display: flex; }
        }

        /* Hairline-bordered chip — used on desktop strip */
        .results-chip {
          padding: 7px 14px;
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          white-space: nowrap;
          border: 1px solid var(--luxe-hairline-strong);
          background: transparent;
          color: var(--luxe-soft-white-70);
          cursor: pointer;
          font-family: var(--font-mono);
          transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
          border-radius: 999px;
          flex-shrink: 0;
        }
        .results-chip:hover {
          border-color: var(--luxe-champagne-line);
          color: var(--luxe-soft-white);
        }
        .results-chip.is-active {
          background: var(--luxe-champagne);
          border-color: var(--luxe-champagne);
          color: var(--luxe-black);
          font-weight: 600;
        }

        .results-chip-sep {
          width: 1px;
          height: 18px;
          background: var(--luxe-hairline-strong);
          flex-shrink: 0;
        }

        /* Mobile pill strip — full-bleed, momentum scroll, edge fade */
        .results-pillstrip-mobile {
          flex: 1;
          min-width: 0;
          position: relative;
          margin: 0 -16px;
          padding: 0;
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
          height: 18px;
          background: var(--luxe-hairline-strong);
          flex-shrink: 0;
          align-self: center;
        }
        .results-pill {
          padding: 8px 14px;
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          white-space: nowrap;
          cursor: pointer;
          font-family: var(--font-mono);
          transition: all 0.15s ease;
          border-radius: 999px;
          flex-shrink: 0;
          scroll-snap-align: start;
          min-height: 34px;
          border: 1px solid var(--luxe-hairline-strong);
          background: transparent;
          color: var(--luxe-soft-white-70);
        }
        .results-pill.is-active {
          background: var(--luxe-champagne);
          border-color: var(--luxe-champagne);
          color: var(--luxe-black);
          font-weight: 600;
        }

        /* Right cluster — sort dropdown + view toggle (desktop only) */
        .results-rightcluster {
          display: none;
          gap: 10px;
          align-items: center;
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .results-rightcluster { display: flex; }
        }

        /* Sort dropdown */
        .results-sort-dropdown {
          position: relative;
        }
        .results-sort-trigger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--luxe-soft-white);
          background: transparent;
          border: 1px solid var(--luxe-hairline-strong);
          border-radius: 999px;
          cursor: pointer;
          transition: border-color 0.15s ease;
          min-height: 36px;
        }
        .results-sort-trigger:hover {
          border-color: var(--luxe-champagne-line);
        }
        .results-sort-trigger-eyebrow {
          color: var(--luxe-soft-white-50);
          font-size: 10px;
          letter-spacing: 0.18em;
        }
        .results-sort-trigger-value {
          color: var(--luxe-champagne);
          font-weight: 500;
          text-transform: none;
          letter-spacing: 0.02em;
          font-family: var(--font-body);
          font-size: 12px;
        }
        .results-sort-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          min-width: 240px;
          background: var(--luxe-black-2);
          border: 1px solid var(--luxe-hairline-strong);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
          z-index: 50;
          padding: 6px;
          border-radius: 4px;
        }
        .results-sort-menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          color: var(--luxe-soft-white-70);
          font-family: var(--font-body);
          font-size: 13px;
          letter-spacing: 0.01em;
          cursor: pointer;
          text-align: left;
          border-radius: 2px;
          min-height: 40px;
        }
        .results-sort-menu-item:hover {
          background: var(--luxe-hairline);
          color: var(--luxe-soft-white);
        }
        .results-sort-menu-item.is-active {
          color: var(--luxe-soft-white);
          background: var(--luxe-champagne-soft);
          font-weight: 500;
        }

        .results-viewtoggle-desktop {
          display: flex;
          gap: 4px;
        }
        .results-viewbtn {
          padding: 8px 10px;
          border: 1px solid var(--luxe-hairline-strong);
          background: transparent;
          color: var(--luxe-soft-white-50);
          cursor: pointer;
          display: flex;
          align-items: center;
          border-radius: 2px;
          transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
        }
        .results-viewbtn:hover {
          border-color: var(--luxe-champagne-line);
          color: var(--luxe-soft-white);
        }
        .results-viewbtn.is-active {
          background: var(--luxe-champagne);
          border-color: var(--luxe-champagne);
          color: var(--luxe-black);
        }

        /* Layout shell — extra breathing room */
        .results-shell {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: stretch;
        }
        @media (min-width: 768px) {
          .results-shell {
            padding: 40px 24px;
            flex-direction: row;
            gap: 36px;
            align-items: flex-start;
          }
        }

        /* Sidebar — hairline panel */
        .results-sidebar-desktop {
          display: none;
        }
        @media (min-width: 768px) {
          .results-sidebar-desktop {
            display: block;
            width: 268px;
            flex-shrink: 0;
            position: sticky;
            top: 140px;
            max-height: calc(100vh - 160px);
            overflow-y: auto;
            scrollbar-width: thin;
            background: var(--luxe-black-2);
            border: 1px solid var(--luxe-hairline-strong);
            padding: 24px;
            border-radius: 2px;
          }
        }
        .results-sidebar-eyebrow {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--luxe-champagne);
          margin-bottom: 22px;
        }

        /* Hotel grid — 1 col phone, 2 col tablet, auto-fill desktop, more gap */
        .results-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 560px) {
          .results-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
        }
        @media (min-width: 1024px) {
          .results-grid {
            grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
            gap: 28px;
          }
        }

        /* Skeleton — champagne pulse on luxe-black-2 */
        .results-skeleton {
          height: 360px;
          background: linear-gradient(
            90deg,
            var(--luxe-black-2) 0%,
            rgba(200, 170, 118, 0.06) 40%,
            rgba(200, 170, 118, 0.10) 50%,
            rgba(200, 170, 118, 0.06) 60%,
            var(--luxe-black-2) 100%
          );
          background-size: 200% 100%;
          border: 1px solid var(--luxe-hairline);
          border-radius: 2px;
          animation: resultsShimmer 2.4s ease-in-out infinite, resultsPulse 1.8s ease-in-out infinite;
        }
        @media (min-width: 768px) {
          .results-skeleton { height: 400px; }
        }

        /* Empty / error wrap — editorial */
        .results-emptywrap {
          text-align: center;
          padding: 72px 24px;
          max-width: 540px;
          margin: 0 auto;
        }
        .results-empty-eyebrow {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.28em;
          color: var(--luxe-champagne);
          margin-bottom: 16px;
          text-transform: uppercase;
        }
        .results-empty-headline {
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 400;
          font-size: clamp(22px, 4.6vw, 30px);
          line-height: 1.15;
          color: var(--luxe-soft-white);
          margin: 0 0 12px;
        }
        .results-empty-sub {
          font-size: 13px;
          line-height: 1.6;
          color: var(--luxe-soft-white-70);
          margin: 0 0 24px;
        }
        .results-empty-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }
        @media (min-width: 480px) {
          .results-empty-actions {
            flex-direction: row;
            justify-content: center;
          }
        }
        .results-empty-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          border: 1px solid var(--luxe-champagne);
          background: var(--luxe-champagne);
          color: var(--luxe-black);
          cursor: pointer;
          font-family: var(--font-mono);
          min-height: 44px;
          text-decoration: none;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .results-empty-cta:hover {
          background: transparent;
          color: var(--luxe-champagne);
        }
        .results-empty-cta-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          border: 1px solid var(--luxe-hairline-strong);
          background: transparent;
          color: var(--luxe-soft-white-70);
          cursor: pointer;
          font-family: var(--font-mono);
          min-height: 44px;
          text-decoration: none;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .results-empty-cta-ghost:hover {
          border-color: var(--luxe-champagne-line);
          color: var(--luxe-soft-white);
        }

        /* Load-more button — full width on phone */
        .results-loadmore-wrap {
          text-align: center;
          margin-top: 32px;
        }
        @media (min-width: 768px) {
          .results-loadmore-wrap { margin-top: 44px; }
        }
        .results-loadmore-btn {
          width: 100%;
          max-width: 100%;
          padding: 14px 24px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          border: 1px solid var(--luxe-champagne);
          background: transparent;
          color: var(--luxe-champagne);
          cursor: pointer;
          font-family: var(--font-mono);
          transition: all 0.15s ease;
          min-height: 48px;
        }
        @media (min-width: 768px) {
          .results-loadmore-btn {
            width: auto;
            padding: 13px 36px;
            min-height: 46px;
          }
        }
        @media (hover: hover) {
          .results-loadmore-btn:hover {
            background: var(--luxe-champagne);
            color: var(--luxe-black);
          }
        }

        /* Mobile floating action bar — already dark; just retune borders to luxe hairline */
        .results-mobile-actionbar {
          display: none;
          position: fixed;
          left: 12px;
          right: 12px;
          bottom: calc(12px + env(safe-area-inset-bottom, 0));
          z-index: 90;
          background: var(--luxe-black-2);
          color: var(--luxe-soft-white);
          border: 1px solid var(--luxe-champagne-line);
          border-radius: 14px;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
          padding: 6px;
          gap: 4px;
          align-items: stretch;
        }
        @media (max-width: 767px) {
          .results-mobile-actionbar { display: flex; }
        }
        /* Lift above the global bottom tab bar on phones */
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
          color: var(--luxe-soft-white);
          cursor: pointer;
          font-family: var(--font-body);
          text-align: left;
          min-height: 48px;
          border-radius: 10px;
          transition: background 0.15s ease;
        }
        .results-mobile-actionbtn:active {
          background: var(--luxe-hairline);
        }
        .results-mobile-actionbtn-label {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
          min-width: 0;
        }
        .results-mobile-actionbtn-title {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-family: var(--font-mono);
          color: var(--luxe-soft-white);
        }
        .results-mobile-actionbtn-sub {
          font-size: 11px;
          color: var(--luxe-champagne);
          letter-spacing: 0.01em;
          margin-top: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 40vw;
          font-family: var(--font-body);
        }
        .results-mobile-actionbar-sep {
          width: 1px;
          background: var(--luxe-hairline-strong);
          margin: 8px 0;
        }

        /* Bottom sheet — dark luxe */
        .results-sheet-scrim {
          position: fixed;
          inset: 0;
          background: var(--luxe-scrim, rgba(8, 7, 6, 0.72));
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 199;
        }
        .results-sheet {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 200;
          background: var(--luxe-black-2);
          color: var(--luxe-soft-white);
          border-top: 1px solid var(--luxe-champagne-line);
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.6);
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
          background: var(--luxe-hairline-strong);
          border-radius: 2px;
          margin: 10px auto 4px;
          flex-shrink: 0;
        }
        .results-sheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 20px 14px;
          border-bottom: 1px solid var(--luxe-hairline);
          flex-shrink: 0;
        }
        .results-sheet-title {
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 400;
          font-size: 24px;
          color: var(--luxe-soft-white);
        }
        .results-sheet-close {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          color: var(--luxe-soft-white-70);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
        }
        .results-sheet-close:active {
          background: var(--luxe-hairline);
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
          border-top: 1px solid var(--luxe-hairline);
          background: var(--luxe-black-2);
          flex-shrink: 0;
        }
        .results-sheet-footer-clear {
          flex: 1;
          padding: 14px 18px;
          background: transparent;
          color: var(--luxe-soft-white-70);
          border: 1px solid var(--luxe-hairline-strong);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: var(--font-mono);
          min-height: 48px;
          border-radius: 2px;
        }
        .results-sheet-footer-apply {
          flex: 2;
          padding: 14px 18px;
          background: var(--luxe-champagne);
          color: var(--luxe-black);
          border: 1px solid var(--luxe-champagne);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: var(--font-mono);
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
          border-bottom: 1px solid var(--luxe-hairline);
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterSection component — dark luxe re-skin
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
          borderBottom: "1px solid var(--luxe-hairline-strong)",
          cursor: "pointer",
          marginBottom: 14,
          minHeight: 32,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--luxe-soft-white)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {title}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--luxe-soft-white-50)"
          strokeWidth="1.5"
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
// Inline-SVG star row — replaces Unicode "★" glyphs in the filter list.
// 1.5-stroke Lucide style, filled champagne.
// ---------------------------------------------------------------------------
function StarRow({ count }: { count: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, alignItems: "center" }} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="var(--luxe-champagne)"
          stroke="var(--luxe-champagne)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrencyShort(amount: number): string {
  if (amount >= 10000) return `$${Math.round(amount / 1000)}k`;
  return `$${Math.round(amount).toLocaleString()}`;
}
