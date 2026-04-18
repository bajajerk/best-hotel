"use client";

import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { searchHotels, fetchCuratedCities, CuratedCity } from "@/lib/api";
import { SAMPLE_CITIES, getCityImage, FALLBACK_CITY_IMAGE, CONTINENTS } from "@/lib/constants";
import { trackSearch, trackSearchFilterApplied } from "@/lib/analytics";
import Header from "@/components/Header";
import DateBar, { DateBarHandle } from "@/components/DateBar";
import DestinationSearch from "@/components/DestinationSearch";
import RegionFilterTabs from "@/components/RegionFilterTabs";

const SearchMapView = lazy(() => import("@/components/SearchMapView"));

const FALLBACK_IMAGE = FALLBACK_CITY_IMAGE;

function safeImageSrc(url: string): string {
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

// ---------------------------------------------------------------------------
// Popular search suggestions (ordered for Indian audience)
// ---------------------------------------------------------------------------
const POPULAR_SEARCHES = [
  { label: "Dubai", slug: "dubai", type: "city" as const },
  { label: "Bali", slug: "bali", type: "city" as const },
  { label: "Maldives", slug: "maldives", type: "city" as const },
  { label: "Bangkok", slug: "bangkok", type: "city" as const },
  { label: "Singapore", slug: "singapore", type: "city" as const },
  { label: "Tokyo", slug: "tokyo", type: "city" as const },
  { label: "London", slug: "london", type: "city" as const },
  { label: "Paris", slug: "paris", type: "city" as const },
  { label: "Santorini", slug: "santorini", type: "city" as const },
  { label: "Rome", slug: "rome", type: "city" as const },
];

// ---------------------------------------------------------------------------
// India destinations (most searched for Indian travellers)
// ---------------------------------------------------------------------------
const INDIA_SEARCHES = [
  { label: "Mumbai", slug: "mumbai" },
  { label: "Goa", slug: "goa" },
  { label: "Udaipur", slug: "udaipur" },
  { label: "Jaipur", slug: "jaipur" },
  { label: "Delhi", slug: "delhi" },
];

// ---------------------------------------------------------------------------
// Search result type
// ---------------------------------------------------------------------------
interface HotelResult {
  hotel_id: number;
  hotel_name: string;
  city: string;
  country: string;
  star_rating: number | null;
  rating_average?: number | null;
  number_of_reviews?: number | null;
  rates_from?: number | null;
  rates_currency?: string | null;
  photo1: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

// ---------------------------------------------------------------------------
// View mode
// ---------------------------------------------------------------------------
type ViewMode = "list" | "map";

// ---------------------------------------------------------------------------
// Recent searches (localStorage)
// ---------------------------------------------------------------------------
const RECENT_SEARCHES_KEY = "voyagr_recent_searches";
const MAX_RECENT = 6;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(q: string) {
  if (typeof window === "undefined" || !q.trim()) return;
  try {
    const existing = getRecentSearches().filter(
      (s) => s.toLowerCase() !== q.trim().toLowerCase()
    );
    const updated = [q.trim(), ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Star rating filter options
// ---------------------------------------------------------------------------
const STAR_FILTERS = [
  { label: "All Stars", value: 0 },
  { label: "3+", value: 3 },
  { label: "4+", value: 4 },
  { label: "5", value: 5 },
];

// ---------------------------------------------------------------------------
// Sort options — extended with rating, reviews, price
// ---------------------------------------------------------------------------
type SortOption = "relevance" | "name_asc" | "name_desc" | "stars_desc" | "rating_desc" | "reviews_desc" | "price_asc" | "price_desc";
const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Guest Rating", value: "rating_desc" },
  { label: "Most Reviewed", value: "reviews_desc" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Stars: High to Low", value: "stars_desc" },
  { label: "Name A–Z", value: "name_asc" },
  { label: "Name Z–A", value: "name_desc" },
];

// ============================================================================
// Search Page
// ============================================================================
export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [cities, setCities] = useState<CuratedCity[]>([]);
  const [hotelResults, setHotelResults] = useState<HotelResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [starFilter, setStarFilter] = useState(0);
  const [regionFilter, setRegionFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dateBarRef = useRef<DateBarHandle | null>(null);

  // Load cities for matching
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
      });
  }, []);

  // Load recent searches
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Run search if initial query exists
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performSearch = useCallback(async (q: string, options?: { persist?: boolean }) => {
    if (!q.trim()) {
      setHotelResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);
    if (options?.persist) {
      addRecentSearch(q);
      setRecentSearches(getRecentSearches());
    }
    try {
      const results = await searchHotels(q, 30);
      setHotelResults(results || []);
      trackSearch({
        query: q,
        result_count: results?.length || 0,
        source: 'search_page',
        filters: { star_rating: starFilter, sort_by: sortBy, region: regionFilter },
      });
    } catch {
      setHotelResults([]);
    } finally {
      setSearching(false);
    }
  }, [starFilter, sortBy, regionFilter]);

  const handleInputChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    performSearch(query, { persist: true });
    // Update URL
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.replace(`/search?${params.toString()}`);
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    performSearch(term, { persist: true });
    router.replace(`/search?q=${encodeURIComponent(term)}`);
  };

  const clearRecentSearches = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    }
  };

  // Filter matching cities based on query
  const matchingCities = query.trim().length >= 2
    ? cities.filter(
        (c) =>
          c.city_name.toLowerCase().includes(query.toLowerCase()) ||
          c.country.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  // Build a lookup: city name → continent (for region filtering hotel results)
  const cityToContinentMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of cities) {
      map[c.city_name.toLowerCase()] = c.continent;
    }
    return map;
  }, [cities]);

  // Filter matching cities by region too
  const regionFilteredCities = regionFilter === "All"
    ? matchingCities
    : matchingCities.filter((c) => c.continent === regionFilter);

  // Apply star filter + region filter + sort to hotel results
  const filteredHotels = hotelResults
    .filter((h) => {
      if (starFilter > 0) {
        if (starFilter === 5 && h.star_rating !== 5) return false;
        if (starFilter !== 5 && (h.star_rating || 0) < starFilter) return false;
      }
      if (regionFilter !== "All") {
        const continent = cityToContinentMap[h.city?.toLowerCase() || ""];
        if (continent && continent !== regionFilter) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.hotel_name.localeCompare(b.hotel_name);
        case "name_desc":
          return b.hotel_name.localeCompare(a.hotel_name);
        case "stars_desc":
          return (b.star_rating || 0) - (a.star_rating || 0);
        case "rating_desc":
          return (b.rating_average || 0) - (a.rating_average || 0);
        case "reviews_desc":
          return (b.number_of_reviews || 0) - (a.number_of_reviews || 0);
        case "price_asc":
          return (a.rates_from || Infinity) - (b.rates_from || Infinity);
        case "price_desc":
          return (b.rates_from || 0) - (a.rates_from || 0);
        default:
          return 0;
      }
    });

  // Total city results + hotel results for stats
  const totalResults = regionFilteredCities.length + filteredHotels.length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", color: "var(--ink)" }}>
      <Header />

      {/* ── Booking bar (destination + dates + guests) ── */}
      <div style={{ paddingTop: 60, background: "rgba(0,0,0,0.03)", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        {/* Destination row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px 0" }}>
          <div
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 10,
              padding: "8px 12px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-body), sans-serif",
                fontSize: 9,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#7a7465",
                marginBottom: 2,
              }}
            >
              DESTINATION
            </div>
            <DestinationSearch
              variant="light"
              placeholder="City, hotel, or country..."
              defaultValue={initialQuery}
              onValueChange={(val) => {
                setQuery(val);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => {
                  performSearch(val);
                }, 400);
              }}
              onSelect={(_type, _value, label) => {
                const filled = label ?? _value;
                setQuery(filled);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                performSearch(filled, { persist: true });
                // Move focus to CHECK-IN without navigating away
                requestAnimationFrame(() => dateBarRef.current?.openCheckIn());
              }}
            />
          </div>
        </div>
        <DateBar variant="light" ref={dateBarRef} />
        {/* Search submit button */}
        <div style={{ padding: "0 16px 14px" }}>
          <button
            type="button"
            onClick={() => {
              if (!query.trim()) return;
              if (debounceRef.current) clearTimeout(debounceRef.current);
              performSearch(query, { persist: true });
              const params = new URLSearchParams();
              params.set("q", query.trim());
              router.replace(`/search?${params.toString()}`);
            }}
            disabled={!query.trim()}
            style={{
              width: "100%",
              padding: "14px 20px",
              background: "#C9A84C",
              color: "var(--ink)",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.04em",
              fontFamily: "var(--font-body)",
              cursor: query.trim() ? "pointer" : "not-allowed",
              opacity: query.trim() ? 1 : 0.5,
              transition: "opacity 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            Search Hotels
            <span aria-hidden style={{ fontSize: 16 }}>&rarr;</span>
          </button>
        </div>
      </div>

      {/* ── Hero search area ── */}
      <section
        className="search-hero"
        style={{
          paddingTop: "0px",
          background: "var(--ink)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--cream) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="search-hero-inner" style={{ position: "relative", padding: "80px 60px 72px", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="type-eyebrow" style={{ marginBottom: "16px", color: "var(--gold)" }}>
              Search Hotels
            </div>
            <h1
              className="type-display-2"
              style={{ color: "var(--cream)", marginBottom: "12px" }}
            >
              Where are you{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>going?</em>
            </h1>
            <p className="type-body-lg" style={{ color: "rgba(245,240,232,0.5)", marginBottom: "40px" }}>
              Member rates on 1,500+ hotels. Never on MakeMyTrip or Booking.com.
            </p>
          </motion.div>

          {/* Popular searches + recent searches */}
          {!query.trim() && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ marginTop: "28px" }}
            >
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "16px",
                }}>
                  <span style={{ fontSize: "11px", color: "rgba(245,240,232,0.35)", letterSpacing: "0.08em" }}>
                    RECENT:
                  </span>
                  {recentSearches.slice(0, 4).map((term) => (
                    <button
                      key={term}
                      onClick={() => handleRecentClick(term)}
                      style={{
                        fontSize: "12px",
                        color: "rgba(245,240,232,0.7)",
                        background: "rgba(245,240,232,0.08)",
                        border: "1px solid rgba(245,240,232,0.12)",
                        padding: "4px 14px",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget).style.borderColor = "var(--gold)";
                        (e.currentTarget).style.color = "var(--gold)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget).style.borderColor = "rgba(245,240,232,0.12)";
                        (e.currentTarget).style.color = "rgba(245,240,232,0.7)";
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                      {term}
                    </button>
                  ))}
                  <button
                    onClick={clearRecentSearches}
                    style={{
                      fontSize: "10px",
                      color: "rgba(245,240,232,0.25)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      padding: "4px 8px",
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* India destinations */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "16px",
              }}>
                <span style={{ fontSize: "11px", color: "rgba(245,240,232,0.35)", letterSpacing: "0.08em" }}>
                  INDIA:
                </span>
                {INDIA_SEARCHES.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/city/${s.slug}`}
                    style={{
                      fontSize: "12px",
                      color: "rgba(245,240,232,0.6)",
                      textDecoration: "none",
                      padding: "4px 14px",
                      border: "1px solid rgba(245,240,232,0.12)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget).style.borderColor = "var(--gold)";
                      (e.currentTarget).style.color = "var(--gold)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget).style.borderColor = "rgba(245,240,232,0.12)";
                      (e.currentTarget).style.color = "rgba(245,240,232,0.6)";
                    }}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>

              {/* Popular searches */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}>
                <span style={{ fontSize: "11px", color: "rgba(245,240,232,0.35)", letterSpacing: "0.08em" }}>
                  POPULAR:
                </span>
                {POPULAR_SEARCHES.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/city/${s.slug}`}
                    style={{
                      fontSize: "12px",
                      color: "rgba(245,240,232,0.6)",
                      textDecoration: "none",
                      padding: "4px 14px",
                      border: "1px solid rgba(245,240,232,0.12)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget).style.borderColor = "var(--gold)";
                      (e.currentTarget).style.color = "var(--gold)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget).style.borderColor = "rgba(245,240,232,0.12)";
                      (e.currentTarget).style.color = "rgba(245,240,232,0.6)";
                    }}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Results area ── */}
      <section className="search-results-section" style={{ padding: "60px 60px 100px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* Results toolbar — filters + sort (only when we have results) */}
        {hasSearched && (regionFilteredCities.length > 0 || hotelResults.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: "32px" }}
          >
            {/* Results count + toggle */}
            <div className="search-toolbar" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{
                  fontSize: "13px",
                  color: "var(--ink)",
                  fontWeight: 500,
                }}>
                  {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{query.trim()}&rdquo;
                </span>
                {regionFilteredCities.length > 0 && (
                  <span style={{
                    fontSize: "11px",
                    color: "var(--ink-light)",
                    padding: "2px 10px",
                    background: "var(--cream-deep)",
                    borderRadius: "2px",
                  }}>
                    {regionFilteredCities.length} {regionFilteredCities.length === 1 ? "city" : "cities"}
                  </span>
                )}
                {filteredHotels.length > 0 && (
                  <span style={{
                    fontSize: "11px",
                    color: "var(--ink-light)",
                    padding: "2px 10px",
                    background: "var(--cream-deep)",
                    borderRadius: "2px",
                  }}>
                    {filteredHotels.length} {filteredHotels.length === 1 ? "hotel" : "hotels"}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* View mode toggle */}
                <div style={{
                  display: "flex",
                  border: "1px solid var(--cream-border)",
                  overflow: "hidden",
                }}>
                  <button
                    onClick={() => { setViewMode("list"); trackSearchFilterApplied({ filter_type: 'view_mode', filter_value: 'list', result_count: hotelResults.length }); }}
                    aria-label="List view"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "8px 14px",
                      fontSize: "12px",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      border: "none",
                      background: viewMode === "list" ? "var(--ink)" : "transparent",
                      color: viewMode === "list" ? "var(--cream)" : "var(--ink-mid)",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      transition: "all 0.2s",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    List
                  </button>
                  <button
                    onClick={() => { setViewMode("map"); trackSearchFilterApplied({ filter_type: 'view_mode', filter_value: 'map', result_count: hotelResults.length }); }}
                    aria-label="Map view"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "8px 14px",
                      fontSize: "12px",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      border: "none",
                      borderLeft: "1px solid var(--cream-border)",
                      background: viewMode === "map" ? "var(--ink)" : "transparent",
                      color: viewMode === "map" ? "var(--cream)" : "var(--ink-mid)",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      transition: "all 0.2s",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                      <line x1="8" y1="2" x2="8" y2="18" />
                      <line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                    Map
                  </button>
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    border: showFilters ? "1px solid var(--gold)" : "1px solid var(--cream-border)",
                    background: showFilters ? "var(--gold)" : "transparent",
                    color: showFilters ? "var(--white)" : "var(--ink-mid)",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    transition: "all 0.2s",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="8" y1="12" x2="20" y2="12" />
                    <line x1="12" y1="18" x2="20" y2="18" />
                  </svg>
                  Filters
                  {(starFilter > 0 || regionFilter !== "All") && (
                    <span style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: showFilters ? "var(--white)" : "var(--gold)",
                    }} />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded filter bar */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="search-filters" style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    padding: "20px 24px",
                    background: "var(--white)",
                    border: "1px solid var(--cream-border)",
                    marginBottom: "8px",
                  }}>
                    {/* Region filter tabs */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "11px", color: "var(--ink-light)", letterSpacing: "0.06em", fontWeight: 500, whiteSpace: "nowrap" }}>
                        REGION
                      </span>
                      <RegionFilterTabs
                        active={regionFilter}
                        onChange={(v: string) => { setRegionFilter(v); trackSearchFilterApplied({ filter_type: 'region', filter_value: v, result_count: hotelResults.length }); }}
                        variant="pills"
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
                    {/* Star rating filter */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "11px", color: "var(--ink-light)", letterSpacing: "0.06em", fontWeight: 500 }}>
                        STARS
                      </span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {STAR_FILTERS.map((sf) => (
                          <button
                            key={sf.value}
                            onClick={() => { setStarFilter(sf.value); trackSearchFilterApplied({ filter_type: 'star_rating', filter_value: sf.value, result_count: hotelResults.length }); }}
                            style={{
                              padding: "6px 14px",
                              fontSize: "12px",
                              border: "1px solid",
                              borderColor: starFilter === sf.value ? "var(--gold)" : "var(--cream-border)",
                              background: starFilter === sf.value ? "var(--gold)" : "transparent",
                              color: starFilter === sf.value ? "var(--white)" : "var(--ink-mid)",
                              cursor: "pointer",
                              fontFamily: "var(--font-body)",
                              transition: "all 0.2s",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {sf.value > 0 && <span style={{ color: starFilter === sf.value ? "var(--white)" : "var(--gold)", fontSize: "11px" }}>★</span>}
                            {sf.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "11px", color: "var(--ink-light)", letterSpacing: "0.06em", fontWeight: 500 }}>
                        SORT
                      </span>
                      <select
                        value={sortBy}
                        onChange={(e) => { const v = e.target.value as SortOption; setSortBy(v); trackSearchFilterApplied({ filter_type: 'sort_by', filter_value: v, result_count: hotelResults.length }); }}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          border: "1px solid var(--cream-border)",
                          background: "var(--cream)",
                          color: "var(--ink)",
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          outline: "none",
                        }}
                      >
                        {SORT_OPTIONS.map((so) => (
                          <option key={so.value} value={so.value}>{so.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Clear filters */}
                    {(starFilter > 0 || sortBy !== "relevance" || regionFilter !== "All") && (
                      <button
                        onClick={() => { setStarFilter(0); setSortBy("relevance"); setRegionFilter("All"); }}
                        style={{
                          fontSize: "11px",
                          color: "var(--gold)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          textDecoration: "underline",
                        }}
                      >
                        Clear filters
                      </button>
                    )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* City matches */}
        {regionFilteredCities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: "56px" }}
          >
            <div className="type-eyebrow" style={{ marginBottom: "20px" }}>
              Matching Destinations
            </div>
            <div className="search-city-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}>
              {regionFilteredCities.slice(0, 8).map((city) => (
                <Link
                  key={city.city_slug}
                  href={`/city/${city.city_slug}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <motion.div
                    className="card-hover"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: "var(--white)",
                      border: "1px solid var(--cream-border)",
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ height: "140px", overflow: "hidden" }}>
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
                    <div style={{ padding: "14px 16px 16px" }}>
                      <div className="type-heading-3" style={{ color: "var(--ink)", fontStyle: "italic", fontSize: "17px", marginBottom: "2px" }}>
                        {city.city_name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--ink-light)", letterSpacing: "0.04em" }}>
                        {city.country}
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "10px",
                        paddingTop: "10px",
                        borderTop: "1px solid var(--cream-border)",
                      }}>
                        <span style={{ fontSize: "10px", color: "var(--ink-light)" }}>
                          {city.hotel_count > 0 ? `${city.hotel_count}+ hotels` : "Explore"}
                        </span>
                        <span className="card-arrow" style={{ fontSize: "11px", color: "var(--gold)", fontWeight: 500 }}>
                          View &rarr;
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Hotel results */}
        {searching && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px", margin: "0 auto" }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="shimmer" style={{
                  height: "140px",
                  background: "var(--cream-deep)",
                  borderRadius: "0",
                }} />
              ))}
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-light)", marginTop: "16px" }}>Searching hotels...</p>
          </div>
        )}

        {!searching && hasSearched && filteredHotels.length > 0 && viewMode === "map" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "24px" }}>
              <div className="type-eyebrow">
                Hotels on Map
              </div>
              <span style={{ fontSize: "12px", color: "var(--ink-light)" }}>
                {filteredHotels.length} result{filteredHotels.length !== 1 ? "s" : ""}
              </span>
            </div>
            <Suspense fallback={
              <div style={{ height: "600px", background: "var(--cream-deep)", border: "1px solid var(--cream-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: "13px", color: "var(--ink-light)" }}>Loading map...</p>
              </div>
            }>
              <SearchMapView hotels={filteredHotels} />
            </Suspense>
          </motion.div>
        )}

        {!searching && hasSearched && filteredHotels.length > 0 && viewMode === "list" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "24px" }}>
              <div className="type-eyebrow">
                Hotels Found
              </div>
              <span style={{ fontSize: "12px", color: "var(--ink-light)" }}>
                {filteredHotels.length} result{filteredHotels.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="search-hotel-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filteredHotels.map((hotel, i) => (
                <motion.div
                  key={hotel.hotel_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                >
                  <Link
                    href={`/hotel/${hotel.hotel_id}`}
                    style={{ textDecoration: "none", display: "block" }}
                  >
                    <div
                      className="card-hover search-hotel-card"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "220px 1fr",
                        background: "var(--white)",
                        border: "1px solid var(--cream-border)",
                        overflow: "hidden",
                        cursor: "pointer",
                      }}
                    >
                      {/* Image */}
                      <div className="search-hotel-card-img" style={{ height: "160px", overflow: "hidden", position: "relative" }}>
                        <img
                          className="card-img"
                          src={hotel.photo1 ? safeImageSrc(hotel.photo1.startsWith("http") ? hotel.photo1 : `https://photos.hotelbeds.com/giata/${hotel.photo1}`) : FALLBACK_IMAGE}
                          alt={hotel.hotel_name}
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
                        {hotel.star_rating && hotel.star_rating >= 4 && (
                          <div style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            background: "rgba(26,23,16,0.75)",
                            backdropFilter: "blur(4px)",
                            padding: "3px 8px",
                            fontSize: "10px",
                            color: "var(--gold)",
                            letterSpacing: "1px",
                            fontWeight: 500,
                          }}>
                            {"★".repeat(hotel.star_rating)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="search-hotel-card-content" style={{ padding: "20px 28px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          {hotel.star_rating && hotel.star_rating < 4 && (
                            <span style={{ color: "var(--gold)", fontSize: "10px", letterSpacing: "1px" }}>
                              {"★".repeat(hotel.star_rating)}
                            </span>
                          )}
                        </div>
                        <div className="type-heading-3" style={{
                          color: "var(--ink)",
                          fontStyle: "italic",
                          marginBottom: "6px",
                          fontSize: "18px",
                        }}>
                          {hotel.hotel_name}
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          color: "var(--ink-light)",
                          letterSpacing: "0.04em",
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {hotel.city}, {hotel.country}
                        </div>
                        {/* Rating / reviews / price chips */}
                        {(hotel.rating_average || hotel.number_of_reviews || hotel.rates_from) && (
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                            {hotel.rating_average != null && hotel.rating_average > 0 && (
                              <span style={{
                                fontSize: "10px",
                                padding: "2px 8px",
                                background: hotel.rating_average >= 8.5 ? "var(--gold-pale)" : "var(--cream)",
                                color: hotel.rating_average >= 8.5 ? "var(--gold)" : "var(--ink-mid)",
                                border: "1px solid var(--cream-border)",
                                fontWeight: 500,
                              }}>
                                {hotel.rating_average.toFixed(1)} rating
                              </span>
                            )}
                            {hotel.number_of_reviews != null && hotel.number_of_reviews > 0 && (
                              <span style={{
                                fontSize: "10px",
                                padding: "2px 8px",
                                background: "var(--cream)",
                                color: "var(--ink-mid)",
                                border: "1px solid var(--cream-border)",
                              }}>
                                {hotel.number_of_reviews.toLocaleString()} reviews
                              </span>
                            )}
                            {hotel.rates_from != null && hotel.rates_from > 0 && (
                              <span style={{
                                fontSize: "10px",
                                padding: "2px 8px",
                                background: "var(--cream)",
                                color: "var(--ink-mid)",
                                border: "1px solid var(--cream-border)",
                                fontWeight: 500,
                              }}>
                                From ${Math.round(hotel.rates_from)}
                              </span>
                            )}
                          </div>
                        )}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: "1px solid var(--cream-border)",
                        }}>
                          <span style={{
                            fontSize: "11px",
                            color: "var(--success)",
                            fontWeight: 500,
                            letterSpacing: "0.04em",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            Exclusive rate available
                          </span>
                          <span className="card-arrow" style={{ fontSize: "11px", color: "var(--gold)", fontWeight: 500, letterSpacing: "0.04em" }}>
                            View details &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* No results after filtering */}
        {!searching && hasSearched && hotelResults.length > 0 && filteredHotels.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "60px 0" }}
          >
            <p style={{ fontSize: "14px", color: "var(--ink-light)", marginBottom: "12px" }}>
              No hotels match your current filters.
            </p>
            <button
              onClick={() => { setStarFilter(0); setSortBy("relevance"); setRegionFilter("All"); }}
              style={{
                fontSize: "13px",
                color: "var(--gold)",
                background: "transparent",
                border: "1px solid var(--gold)",
                padding: "10px 24px",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              Clear filters
            </button>
          </motion.div>
        )}

        {!searching && hasSearched && filteredHotels.length === 0 && regionFilteredCities.length === 0 && (
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
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="type-display-3" style={{ color: "var(--ink)", fontStyle: "italic", marginBottom: "8px" }}>
              No results found
            </h3>
            <p className="type-body" style={{ color: "var(--ink-light)", maxWidth: "400px", margin: "0 auto 24px" }}>
              Try searching with a different city name, hotel, or country.
            </p>
            <Link
              href="/search"
              style={{
                fontSize: "12px",
                color: "var(--gold)",
                textDecoration: "none",
                fontWeight: 500,
                letterSpacing: "0.06em",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                border: "1px solid var(--gold)",
                padding: "10px 24px",
                transition: "all 0.2s",
              }}
            >
              Browse all locations
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </motion.div>
        )}

        {/* Empty state — no search yet */}
        {!hasSearched && !query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
              <div className="type-eyebrow">
                Trending Destinations
              </div>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <RegionFilterTabs
                active={regionFilter}
                onChange={setRegionFilter}
                variant="underline"
                showIcons
              />
            </div>
            <div className="search-trending-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}>
              {(regionFilter === "All" ? cities : cities.filter((c) => c.continent === regionFilter)).slice(0, 12).map((city, i) => (
                <Link
                  key={city.city_slug}
                  href={`/city/${city.city_slug}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <motion.div
                    className="card-hover"
                    initial={{ opacity: 0, y: 16 }}
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
                    <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
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
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(26,23,16,0.5) 0%, transparent 50%)",
                        pointerEvents: "none",
                      }} />
                      <div style={{
                        position: "absolute",
                        bottom: "12px",
                        left: "14px",
                      }}>
                        <div style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "18px",
                          fontWeight: 400,
                          fontStyle: "italic",
                          color: "var(--cream)",
                        }}>
                          {city.city_name}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(245,240,232,0.7)", marginTop: "2px" }}>
                          {city.country}
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}>
                        <span style={{ fontSize: "10px", color: "var(--ink-light)" }}>
                          {city.hotel_count > 0 ? `${city.hotel_count}+ hotels` : "Explore stays"}
                        </span>
                        <span className="card-arrow" style={{ fontSize: "11px", color: "var(--gold)", fontWeight: 500 }}>
                          View &rarr;
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* Browse all locations CTA */}
            <div style={{ textAlign: "center", marginTop: "48px" }}>
              <Link
                href="/search"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 32px",
                  border: "1px solid var(--cream-border)",
                  background: "var(--white)",
                  color: "var(--ink)",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.2s",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Browse all 50+ destinations
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </motion.div>
        )}
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
              { label: "Search", href: "/search" },
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
            &copy; 2026 Voyagr Club
          </p>
        </div>
      </footer>
    </div>
  );
}
