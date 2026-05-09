"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchCuratedCities,
  CuratedCity,
} from "@/lib/api";
import { SAMPLE_CITIES, getCityImage, FALLBACK_CITY_IMAGE } from "@/lib/constants";
import { trackSearch } from "@/lib/analytics";
import Header from "@/components/Header";
import DateBar, { DateBarHandle } from "@/components/DateBar";
import DestinationSearch from "@/components/DestinationSearch";
import RegionFilterTabs from "@/components/RegionFilterTabs";
import HotelGrid from "@/components/HotelGrid";
import { useBooking } from "@/context/BookingContext";

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
  { label: "Rishikesh", slug: "rishikesh" },
];

// Hotel result rows + the row card + pagination now live in HotelGrid.

// ---------------------------------------------------------------------------
// Recent searches (localStorage)
// ---------------------------------------------------------------------------
const RECENT_SEARCHES_KEY = "voyagr_recent_searches";
const MAX_RECENT = 6;

interface RecentSearch {
  q: string;
  checkIn?: string;
  checkOut?: string;
}

function getRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (typeof entry === "string") return { q: entry };
        if (entry && typeof entry === "object" && typeof entry.q === "string") {
          return { q: entry.q, checkIn: entry.checkIn, checkOut: entry.checkOut };
        }
        return null;
      })
      .filter((e): e is RecentSearch => !!e);
  } catch {
    return [];
  }
}

function addRecentSearch(q: string, checkIn?: string, checkOut?: string) {
  if (typeof window === "undefined" || !q.trim()) return;
  try {
    const trimmed = q.trim();
    const existing = getRecentSearches().filter(
      (s) => s.q.toLowerCase() !== trimmed.toLowerCase()
    );
    const updated: RecentSearch[] = [
      { q: trimmed, checkIn: checkIn || undefined, checkOut: checkOut || undefined },
      ...existing,
    ].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/** Format ISO date pair as compact label, e.g. "May 25–30" or "May 25 – Jun 1". */
function formatDateRange(checkIn?: string, checkOut?: string): string {
  if (!checkIn) return "";
  const a = new Date(checkIn + "T00:00:00");
  if (Number.isNaN(a.getTime())) return "";
  const month = (d: Date) => d.toLocaleString("en-US", { month: "short" });
  if (!checkOut) {
    return `${month(a)} ${a.getDate()}`;
  }
  const b = new Date(checkOut + "T00:00:00");
  if (Number.isNaN(b.getTime())) return `${month(a)} ${a.getDate()}`;
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${month(a)} ${a.getDate()}\u2013${b.getDate()}`;
  }
  return `${month(a)} ${a.getDate()} \u2013 ${month(b)} ${b.getDate()}`;
}

// ---------------------------------------------------------------------------
// Pill strip + pill subcomponents
// ---------------------------------------------------------------------------
function PillStrip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pill-strip" style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <span
        style={{
          fontSize: 12,
          color: "var(--ink-light)",
          fontFamily: "var(--font-body)",
          fontWeight: 500,
          letterSpacing: "0.02em",
          flexShrink: 0,
          minWidth: 56,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function RecentPill({ entry, onClick }: { entry: RecentSearch; onClick: () => void }) {
  const dateLabel = formatDateRange(entry.checkIn, entry.checkOut);
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        borderRadius: 999,
        padding: "8px 14px",
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0,
        transition: "border-color 0.2s, background 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--gold)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--cream-border)";
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-light)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.15 }}>
        <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, whiteSpace: "nowrap" }}>
          {entry.q}
        </span>
        {dateLabel && (
          <span style={{ fontSize: 11, color: "var(--ink-light)", marginTop: 2, whiteSpace: "nowrap" }}>
            {dateLabel}
          </span>
        )}
      </span>
    </button>
  );
}

function DestinationPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        borderRadius: 999,
        padding: "8px 16px",
        textDecoration: "none",
        fontSize: 13,
        color: "var(--ink)",
        fontFamily: "var(--font-body)",
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
        whiteSpace: "nowrap",
        transition: "border-color 0.2s, color 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--gold)";
        e.currentTarget.style.color = "var(--gold)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--cream-border)";
        e.currentTarget.style.color = "var(--ink)";
      }}
    >
      {label}
    </Link>
  );
}


// ============================================================================
// Search Page
// ============================================================================
export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  // Pagination from URL — page is 1-indexed, per_page is bounded server-side.
  const initialPage = (() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return Number.isFinite(p) && p >= 1 ? p : 1;
  })();
  const initialPerPage = (() => {
    const p = parseInt(searchParams.get("per_page") || "20", 10);
    return Number.isFinite(p) && p >= 1 && p <= 50 ? p : 20;
  })();

  const { checkIn, checkOut } = useBooking();
  const [query, setQuery] = useState(initialQuery);
  const [cities, setCities] = useState<CuratedCity[]>([]);
  const [page, setPage] = useState<number>(initialPage);
  const [perPage] = useState<number>(initialPerPage);
  // Result counts surfaced by HotelGrid via onResults — used only for the
  // toolbar copy on this page. The list itself is owned by HotelGrid.
  const [resultInfo, setResultInfo] = useState<{ totalCount: number; visibleCount: number }>({
    totalCount: 0,
    visibleCount: 0,
  });
  const [hasSearched, setHasSearched] = useState<boolean>(!!initialQuery);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [regionFilter, setRegionFilter] = useState<string>("All");
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
            hotel_count: 0,
            display_order: i + 1,
          }))
        );
      });
  }, []);

  // Load recent searches
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Search is now driven entirely by `query`/`page`/`perPage` — HotelGrid
  // owns the fetch + batch-rates effect. We just persist the recent search,
  // update the URL, and bump `hasSearched`.
  const commitQuery = useCallback(
    (q: string, options?: { persist?: boolean }) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setQuery("");
        setHasSearched(false);
        setResultInfo({ totalCount: 0, visibleCount: 0 });
        return;
      }
      setQuery(trimmed);
      setPage(1);
      setHasSearched(true);
      if (options?.persist) {
        addRecentSearch(trimmed, checkIn, checkOut);
        setRecentSearches(getRecentSearches());
      }
      const params = new URLSearchParams();
      params.set("q", trimmed);
      router.replace(`/search?${params.toString()}`);
    },
    [checkIn, checkOut, router],
  );

  const handleGridResults = useCallback(
    ({ totalCount, visibleCount }: { totalCount: number; visibleCount: number; query: string }) => {
      setResultInfo({ totalCount, visibleCount });
    },
    [],
  );

  const handleGridSearch = useCallback(
    (info: { query: string; page: number; resultCount: number }) => {
      trackSearch({
        query: info.query,
        result_count: info.resultCount,
        source: "search_page",
        filters: { region: regionFilter },
      });
    },
    [regionFilter],
  );

  const handleRecentClick = (term: string) => {
    commitQuery(term, { persist: true });
  };

  // Pagination handler — bump page state, replace URL with the new page
  // (so deep links work and back-button paginates), and smooth-scroll the
  // results into view so the user lands at the top of the freshly-rendered
  // list. HotelGrid re-fetches on the new page automatically.
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === page) return;
    setPage(newPage);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (newPage > 1) params.set("page", String(newPage));
    if (perPage !== 20) params.set("per_page", String(perPage));
    router.replace(`/search${params.toString() ? `?${params.toString()}` : ""}`);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page, query, perPage, router]);

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

  // Hotel results — counts surface from HotelGrid via onResults / handleGridResults.
  const totalCount = resultInfo.totalCount;
  const totalResults = resultInfo.visibleCount;

  return (
    <div className="luxe" style={{ minHeight: "100vh", background: "var(--cream)", color: "var(--ink)" }}>
      <Header />

      {/* ── Unified search card + destination pills (single section, no dark hero) ── */}
      <section
        className="search-unified"
        style={{
          paddingTop: 84,
          paddingBottom: 32,
          background: "var(--cream)",
        }}
      >
        <div
          className="search-unified-inner"
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 32px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Unified search card */}
            <div
              className="usc-card"
              style={{
                background: "var(--white)",
                border: "1px solid var(--cream-border)",
                borderRadius: 14,
                boxShadow: "0 8px 28px rgba(26,23,16,0.06)",
                overflow: "visible",
              }}
            >
              {/* Field row (destination + dates + guests) */}
              <div className="usc-fields" style={{ display: "flex", alignItems: "stretch" }}>
                {/* Destination cell */}
                <div className="usc-cell usc-cell--destination" style={{ flex: 1.4, minWidth: 0, padding: "14px 18px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-body), sans-serif",
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--ink-light)",
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    Destination
                  </div>
                  <DestinationSearch
                    variant="dark"
                    placeholder="Where are you going?"
                    defaultValue={initialQuery}
                    onValueChange={(val) => {
                      setQuery(val);
                      if (debounceRef.current) clearTimeout(debounceRef.current);
                      debounceRef.current = setTimeout(() => {
                        commitQuery(val);
                      }, 400);
                    }}
                    onSelect={(_type, _value, label) => {
                      const filled = label ?? _value;
                      if (debounceRef.current) clearTimeout(debounceRef.current);
                      commitQuery(filled, { persist: true });
                      requestAnimationFrame(() => dateBarRef.current?.openCheckIn());
                    }}
                  />
                </div>
                {/* Dates + Guests (inline composable). The page is wrapped in
                    `.luxe` (dark theme), so DateBar must render its calendar
                    panel + cells with the dark variant — otherwise the picker
                    pops a light panel on a dark page. */}
                <DateBar variant="dark" inline ref={dateBarRef} />
              </div>
              {/* Search submit */}
              <button
                type="button"
                onClick={() => {
                  if (!query.trim()) return;
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  commitQuery(query, { persist: true });
                }}
                disabled={!query.trim()}
                style={{
                  width: "100%",
                  height: 52,
                  background: "var(--gold)",
                  color: "var(--ink)",
                  border: "none",
                  borderTop: "1px solid var(--cream-border)",
                  borderRadius: "0 0 14px 14px",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  fontFamily: "var(--font-body)",
                  cursor: query.trim() ? "pointer" : "not-allowed",
                  opacity: query.trim() ? 1 : 0.5,
                  transition: "opacity 0.2s, background 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                Search Hotels
                <span aria-hidden style={{ fontSize: 16 }}>&rarr;</span>
              </button>
            </div>

            {/* ── Destination pill strips ── */}
            {!query.trim() && (
              <div className="usc-pills" style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
                {recentSearches.length > 0 && (
                  <PillStrip label="Recent">
                    <div
                      className="pill-row"
                      style={{
                        display: "flex",
                        gap: 10,
                        overflowX: "auto",
                        scrollbarWidth: "thin",
                        paddingBottom: 4,
                      }}
                    >
                      {recentSearches.slice(0, 4).map((entry) => (
                        <RecentPill
                          key={entry.q}
                          entry={entry}
                          onClick={() => handleRecentClick(entry.q)}
                        />
                      ))}
                      <button
                        onClick={clearRecentSearches}
                        style={{
                          fontSize: 11,
                          color: "var(--ink-light)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          padding: "4px 10px",
                          alignSelf: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </PillStrip>
                )}

                <PillStrip label="India">
                  <div
                    className="pill-row"
                    style={{
                      display: "flex",
                      gap: 10,
                      overflowX: "auto",
                      scrollbarWidth: "thin",
                      paddingBottom: 4,
                    }}
                  >
                    {INDIA_SEARCHES.map((s) => (
                      <DestinationPill key={s.slug} href={`/city/${s.slug}`} label={s.label} />
                    ))}
                  </div>
                </PillStrip>

                <PillStrip label="Popular">
                  <div
                    className="pill-row"
                    style={{
                      display: "flex",
                      gap: 10,
                      overflowX: "auto",
                      scrollbarWidth: "thin",
                      paddingBottom: 4,
                    }}
                  >
                    {POPULAR_SEARCHES.map((s) => (
                      <DestinationPill key={s.slug} href={`/city/${s.slug}`} label={s.label} />
                    ))}
                  </div>
                </PillStrip>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Results area ── */}
      <section className="search-results-section" style={{ padding: "60px 60px 100px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* Results count */}
        {hasSearched && (regionFilteredCities.length > 0 || totalResults > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: "32px" }}
          >
            <span style={{
              fontSize: "13px",
              color: "var(--ink)",
              fontWeight: 500,
            }}>
              {(totalCount > 0 ? totalCount : totalResults).toLocaleString()}{" "}
              {(totalCount > 0 ? totalCount : totalResults) === 1 ? "hotel" : "hotels"}{" "}
              for &ldquo;{query.trim()}&rdquo;
            </span>
          </motion.div>
        )}

        {/* ── Hotel results — paginated cards + live batch-rates (HotelGrid) ── */}
        {hasSearched && (
          <HotelGrid
            query={query.trim()}
            page={page}
            perPage={perPage}
            onPageChange={handlePageChange}
            regionFilter={regionFilter}
            cityToContinentMap={cityToContinentMap}
            heading={<div className="type-eyebrow">Hotels Found</div>}
            onResults={handleGridResults}
            onSearch={handleGridSearch}
          />
        )}

        {/* ── Curated favourites in {city} — small horizontal scroller below results ── */}
        {hasSearched && totalResults > 0 && regionFilteredCities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ marginTop: 56 }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
              <div className="type-eyebrow">
                Curated favourites{regionFilteredCities[0] ? ` in ${regionFilteredCities[0].city_name}` : ""}
              </div>
              <span style={{ fontSize: 11, color: "var(--ink-light)", letterSpacing: "0.04em" }}>
                Editor&rsquo;s picks
              </span>
            </div>
            <div
              className="curated-scroller"
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                paddingBottom: 8,
                scrollbarWidth: "thin",
              }}
            >
              {regionFilteredCities.slice(0, 8).map((city) => (
                <Link
                  key={city.city_slug}
                  href={`/city/${city.city_slug}`}
                  style={{ textDecoration: "none", flex: "0 0 220px" }}
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: "var(--white)",
                      border: "1px solid var(--cream-border)",
                      borderRadius: 8,
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ height: 110, overflow: "hidden", position: "relative" }}>
                      <img
                        src={safeImageSrc(getCityImage(city.city_slug))}
                        alt={city.city_name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          filter: "saturate(0.9)",
                        }}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                      />
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, transparent 50%, rgba(20,18,15,0.55) 100%)",
                      }} />
                      <div style={{ position: "absolute", left: 12, bottom: 10 }}>
                        <div style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          fontSize: 16,
                          color: "var(--cream)",
                          lineHeight: 1.1,
                        }}>
                          {city.city_name}
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(245,240,232,0.75)", marginTop: 2, letterSpacing: "0.04em" }}>
                          {city.country}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <span style={{ fontSize: 10, color: "var(--ink-light)" }}>
                        {city.hotel_count > 0 ? `${city.hotel_count}+ hotels` : "Explore"}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--gold)", fontWeight: 600, letterSpacing: "0.04em" }}>
                        View &rarr;
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {hasSearched && totalResults === 0 && regionFilteredCities.length === 0 && (
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
