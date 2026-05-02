"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  searchHotelsPaginated,
  fetchCuratedCities,
  fetchBatchRates,
  CuratedCity,
} from "@/lib/api";
import type { BatchRatesResponse } from "@/lib/api";
import { hotelUrl } from "@/lib/urls";
import { SAMPLE_CITIES, getCityImage, FALLBACK_CITY_IMAGE } from "@/lib/constants";
import { useBooking } from "@/context/BookingContext";
import { trackSearch } from "@/lib/analytics";
import Header from "@/components/Header";
import DateBar, { DateBarHandle } from "@/components/DateBar";
import DestinationSearch from "@/components/DestinationSearch";
import RegionFilterTabs from "@/components/RegionFilterTabs";
import SearchResultsSkeleton from "@/components/skeletons/SearchResultsSkeleton";

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

// ---------------------------------------------------------------------------
// Search result type
//
// Phase E: backend `/api/hotels/search` now returns canonical hotels_master
// rows with `id` (master UUID), `short_id`, `slug`, `name`, `city_name`,
// `country`, `star_rating`, `image_url`. The legacy numeric Agoda
// `hotel_id` / `hotel_name` / `city` / `photo1` fields are GONE — we keep
// them as optional aliases for resilience but read the new names first.
//
// Bug fix (search-cards-empty): the inline render was reading the legacy
// names exclusively, so every card rendered "" / null / null → 30 blank
// "5★ India / Call for rates" tiles.
// ---------------------------------------------------------------------------
interface HotelResult {
  // Phase E canonical fields (backend source of truth).
  id?: string;
  short_id?: string | null;
  slug?: string | null;
  name?: string;
  city_name?: string;
  country?: string;
  country_code?: string;
  star_rating: number | null;
  rating_average?: number | null;
  number_of_reviews?: number | null;
  rates_from?: number | null;
  rates_currency?: string | null;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // Legacy aliases — kept optional for any caller still emitting the
  // old shape. Renderer reads canonical first, falls back to these.
  hotel_id?: number | string;
  hotel_name?: string;
  city?: string;
  photo1?: string | null;
}

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

// ---------------------------------------------------------------------------
// Pagination pill (single-button primitive used by the Pagination control
// below). Hoisted out of Pagination so React's static-components rule is
// satisfied — keeps key/ref reconciliation fast across re-renders.
// ---------------------------------------------------------------------------
function PaginationPill({
  children,
  onClick,
  disabled = false,
  active = false,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      style={{
        minWidth: 36,
        height: 36,
        padding: "0 12px",
        border: `1px solid ${active ? "var(--gold)" : "var(--cream-border)"}`,
        background: active ? "var(--gold)" : "var(--white)",
        color: active ? "var(--ink)" : (disabled ? "var(--ink-light)" : "var(--ink)"),
        fontFamily: "var(--font-body)",
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        letterSpacing: "0.02em",
        borderRadius: 999,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "border-color 0.18s, background 0.18s, color 0.18s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.borderColor = "var(--gold)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.borderColor = "var(--cream-border)";
        }
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Pagination control — luxe pills, champagne when active, hairline border.
// Renders `1 2 … current ± 2 … total_pages` on desktop, `Prev / N of M / Next`
// on mobile (driven via CSS so SSR markup stays the same).
// ---------------------------------------------------------------------------
function Pagination({
  page,
  totalPages,
  totalCount,
  perPage,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
  onChange: (newPage: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Build a compact list of page numbers to render: first, last, current ± 2,
  // with "..." gaps between non-contiguous ranges.
  const SIBLINGS = 1;
  const set = new Set<number>([1, totalPages, page]);
  for (let i = 1; i <= SIBLINGS; i++) {
    if (page - i >= 1) set.add(page - i);
    if (page + i <= totalPages) set.add(page + i);
  }
  // Always show 2 around the start/end so "1 2 … 12" looks balanced.
  set.add(2); set.add(totalPages - 1);
  const pages = Array.from(set).filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  const items: (number | "ellipsis")[] = [];
  for (let i = 0; i < pages.length; i++) {
    if (i > 0 && pages[i] - pages[i - 1] > 1) items.push("ellipsis");
    items.push(pages[i]);
  }

  const firstOnPage = (page - 1) * perPage + 1;
  const lastOnPage = Math.min(page * perPage, totalCount);

  return (
    <nav
      aria-label="Search results pagination"
      className="search-pagination"
      style={{
        marginTop: 32,
        paddingTop: 24,
        borderTop: "1px solid var(--cream-border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Desktop: full pill row */}
      <div
        className="search-pagination-desktop"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <PaginationPill
          onClick={() => page > 1 && onChange(page - 1)}
          disabled={page === 1}
          ariaLabel="Previous page"
        >
          &larr; Prev
        </PaginationPill>
        {items.map((it, idx) =>
          it === "ellipsis" ? (
            <span
              key={`gap-${idx}`}
              style={{
                color: "var(--ink-light)",
                fontSize: 13,
                padding: "0 4px",
                userSelect: "none",
              }}
            >
              &hellip;
            </span>
          ) : (
            <PaginationPill
              key={it}
              active={it === page}
              onClick={() => it !== page && onChange(it)}
              ariaLabel={`Page ${it}`}
            >
              {it}
            </PaginationPill>
          ),
        )}
        <PaginationPill
          onClick={() => page < totalPages && onChange(page + 1)}
          disabled={page === totalPages}
          ariaLabel="Next page"
        >
          Next &rarr;
        </PaginationPill>
      </div>

      {/* Mobile: just Prev / N of M / Next — hidden on desktop via CSS */}
      <div
        className="search-pagination-mobile"
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <PaginationPill
          onClick={() => page > 1 && onChange(page - 1)}
          disabled={page === 1}
          ariaLabel="Previous page"
        >
          &larr; Prev
        </PaginationPill>
        <span
          style={{
            fontSize: 13,
            color: "var(--ink-mid)",
            fontFamily: "var(--font-body)",
            minWidth: 100,
            textAlign: "center",
          }}
        >
          Page {page} of {totalPages}
        </span>
        <PaginationPill
          onClick={() => page < totalPages && onChange(page + 1)}
          disabled={page === totalPages}
          ariaLabel="Next page"
        >
          Next &rarr;
        </PaginationPill>
      </div>

      {/* "Showing X–Y of Z" subtle line */}
      {totalCount > 0 && (
        <span
          style={{
            fontSize: 12,
            color: "var(--ink-light)",
            fontFamily: "var(--font-body)",
            letterSpacing: "0.02em",
          }}
        >
          Showing {firstOnPage.toLocaleString()}&ndash;{lastOnPage.toLocaleString()}
          {" of "}
          {totalCount.toLocaleString()}
        </span>
      )}
    </nav>
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

  const { checkIn, checkOut, totalAdults, totalChildren, rooms } = useBooking();
  const roomsCount = rooms.length;
  const [query, setQuery] = useState(initialQuery);
  const [cities, setCities] = useState<CuratedCity[]>([]);
  const [hotelResults, setHotelResults] = useState<HotelResult[]>([]);
  const [page, setPage] = useState<number>(initialPage);
  const [perPage] = useState<number>(initialPerPage);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [batchRates, setBatchRates] = useState<BatchRatesResponse | null>(null);
  const [batchRatesLoading, setBatchRatesLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
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

  // Re-run search whenever the query or page changes. We keep this in a
  // single effect so deep links like `/search?q=Mumbai&page=3` work on
  // first paint, and clicking the pagination control just bumps `page`
  // and the same effect re-fetches.
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, { page });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Batch-fetch live rates for the *current page* of search results.
  // P0 RULE: rates are NEVER cached client-side either — `fetchBatchRates`
  // sends `cache: 'no-store'`. Each page change kicks off a fresh batch.
  // We don't block the list render on this — prices fade in as they arrive
  // (10-30s for 20 hotels). On error, fall through to "Call for rates".
  useEffect(() => {
    if (!hotelResults.length || !checkIn || !checkOut) {
      setBatchRates(null);
      setBatchRatesLoading(false);
      return;
    }
    const masterIds = hotelResults
      .map((h) => (h.id ? String(h.id) : null))
      .filter((x): x is string => !!x);
    if (!masterIds.length) {
      setBatchRates(null);
      setBatchRatesLoading(false);
      return;
    }
    let cancelled = false;
    setBatchRatesLoading(true);
    setBatchRates(null);
    fetchBatchRates(
      masterIds,
      checkIn,
      checkOut,
      Math.max(totalAdults, 1),
      Math.max(totalChildren, 0),
      Math.max(roomsCount, 1),
    )
      .then((resp) => {
        if (cancelled) return;
        setBatchRates(resp);
      })
      .catch(() => {
        if (cancelled) return;
        // Quiet failure — cards fall back to "Call for rates" automatically.
        setBatchRates(null);
      })
      .finally(() => {
        if (cancelled) return;
        setBatchRatesLoading(false);
      });
    return () => { cancelled = true; };
  }, [hotelResults, checkIn, checkOut, totalAdults, totalChildren, roomsCount]);

  const performSearch = useCallback(async (
    q: string,
    options?: { persist?: boolean; page?: number },
  ) => {
    if (!q.trim()) {
      setHotelResults([]);
      setTotalCount(0);
      setTotalPages(1);
      setHasSearched(false);
      return;
    }

    const reqPage = Math.max(options?.page ?? 1, 1);
    setSearching(true);
    setHasSearched(true);
    if (options?.persist) {
      addRecentSearch(q, checkIn, checkOut);
      setRecentSearches(getRecentSearches());
    }
    try {
      const resp = await searchHotelsPaginated<HotelResult>(q, reqPage, perPage);
      setHotelResults(resp.hotels || []);
      setTotalCount(resp.count);
      setTotalPages(Math.max(resp.total_pages, 1));
      trackSearch({
        query: q,
        result_count: resp.count,
        source: 'search_page',
        filters: { region: regionFilter },
      });
    } catch {
      setHotelResults([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setSearching(false);
    }
  }, [regionFilter, checkIn, checkOut, perPage]);

  const handleRecentClick = (term: string) => {
    setQuery(term);
    setPage(1);
    performSearch(term, { persist: true, page: 1 });
    router.replace(`/search?q=${encodeURIComponent(term)}`);
  };

  // Pagination handler — bump page state, replace URL with the new page
  // (so deep links work and back-button paginates), and smooth-scroll the
  // results into view so the user lands at the top of the freshly-rendered
  // list. The page-change effect (above) re-runs `performSearch`.
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

  // Merge live batch rates into each hotel — replace the static `rates_from`
  // (which the search endpoint no longer emits anyway) with the freshly
  // fetched live price keyed by master UUID. Hotels without a returned rate
  // keep null and render "Call for rates" / "Calculating live rates…" based
  // on `batchRatesLoading`.
  const livePricedResults = useMemo<HotelResult[]>(() => {
    if (!batchRates || !batchRates.results) return hotelResults;
    return hotelResults.map((h) => {
      const key = h.id ? String(h.id) : "";
      const r = key ? batchRates.results[key] : undefined;
      if (!r) return h;
      const fromPrice = typeof r.from_price === "number" ? r.from_price : null;
      return {
        ...h,
        rates_from: fromPrice,
        rates_currency: r.currency ?? h.rates_currency ?? "INR",
      };
    });
  }, [hotelResults, batchRates]);

  // Phase E field-name shims: the search endpoint emits `name`/`city_name`/
  // `image_url` but a few code paths still expect the legacy aliases. These
  // helpers read canonical first, fall back to legacy.
  const getName = (h: HotelResult): string => h.name || h.hotel_name || "";
  const getCity = (h: HotelResult): string => h.city_name || h.city || "";

  // Apply region filter (still driven by the trending-destinations region tabs).
  const filteredHotels = regionFilter === "All"
    ? livePricedResults
    : livePricedResults.filter((h) => {
        const continent = cityToContinentMap[getCity(h).toLowerCase()];
        return !continent || continent === regionFilter;
      });

  // Hotel results are the primary count surfaced in the toolbar; matching cities
  // are relocated below the results as a curated scroller and counted separately.
  const totalResults = filteredHotels.length;

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
                    variant="light"
                    placeholder="Where are you going?"
                    defaultValue={initialQuery}
                    onValueChange={(val) => {
                      setQuery(val);
                      if (debounceRef.current) clearTimeout(debounceRef.current);
                      debounceRef.current = setTimeout(() => {
                        // New query -> reset to page 1.
                        setPage(1);
                        performSearch(val, { page: 1 });
                      }, 400);
                    }}
                    onSelect={(_type, _value, label) => {
                      const filled = label ?? _value;
                      setQuery(filled);
                      if (debounceRef.current) clearTimeout(debounceRef.current);
                      setPage(1);
                      performSearch(filled, { persist: true, page: 1 });
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
                  setPage(1);
                  performSearch(query, { persist: true, page: 1 });
                  const params = new URLSearchParams();
                  params.set("q", query.trim());
                  router.replace(`/search?${params.toString()}`);
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
        {hasSearched && (regionFilteredCities.length > 0 || hotelResults.length > 0) && (
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

        {/* Hotel results — luxe shimmer while results stream in */}
        {searching && (
          <div style={{ padding: "8px 0 24px" }}>
            <SearchResultsSkeleton count={8} />
          </div>
        )}

        {!searching && hasSearched && filteredHotels.length > 0 && (
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
                {totalCount > filteredHotels.length
                  ? `${filteredHotels.length} of ${totalCount.toLocaleString()} result${totalCount !== 1 ? "s" : ""}`
                  : `${filteredHotels.length} result${filteredHotels.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            <div className="search-hotel-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredHotels.map((hotel, i) => {
                // Phase E field-name resolution — backend now returns
                // `name` / `city_name` / `image_url` / `id` / `short_id` /
                // `slug`. Read those first, fall back to legacy aliases.
                const displayName = getName(hotel) || "Hotel";
                const displayCity = getCity(hotel);
                const displayCountry = hotel.country || "";
                const photoSrc = hotel.image_url ?? hotel.photo1 ?? null;
                // Stable React key — prefer the master id, then short_id,
                // then slug, then legacy hotel_id, then index. Empty
                // strings would collide so guard with `|| i`.
                const cardKey =
                  String(hotel.id || hotel.short_id || hotel.slug || hotel.hotel_id || `idx-${i}`);

                // Member rate vs. MRP (×1.25 heuristic until search is migrated to live rates)
                const marketRate = hotel.rates_from ? Math.round(hotel.rates_from * 1.25) : null;
                const savePct = hotel.rates_from && marketRate
                  ? Math.round(((marketRate - hotel.rates_from) / marketRate) * 100)
                  : null;
                const sym = hotel.rates_currency === "INR" ? "₹" : "$";
                const formatPrice = (n: number) =>
                  hotel.rates_currency === "INR"
                    ? `${sym}${n.toLocaleString("en-IN")}`
                    : `${sym}${n.toLocaleString("en-US")}`;

                return (
                  <motion.div
                    key={cardKey}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.03 }}
                  >
                    <Link
                      href={hotelUrl({
                        slug: hotel.slug ?? null,
                        short_id: hotel.short_id ?? null,
                        id: (hotel.id as string | undefined) ?? (hotel.hotel_id != null ? String(hotel.hotel_id) : null),
                      })}
                      style={{ textDecoration: "none", display: "block" }}
                    >
                      <div
                        className="card-hover search-hotel-card"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "200px 1fr 220px",
                          background: "var(--white)",
                          border: "1px solid var(--cream-border)",
                          borderRadius: 10,
                          overflow: "hidden",
                          cursor: "pointer",
                          minHeight: 152,
                        }}
                      >
                        {/* Image — left rail */}
                        <div className="search-hotel-card-img" style={{ height: 152, overflow: "hidden", position: "relative" }}>
                          <img
                            className="card-img"
                            src={photoSrc ? safeImageSrc(photoSrc.startsWith("http") ? photoSrc : `https://photos.hotelbeds.com/giata/${photoSrc}`) : FALLBACK_IMAGE}
                            alt={displayName}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                              filter: "saturate(0.9)",
                              transition: "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                            }}
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                          />
                          {savePct != null && savePct > 0 && (
                            <div style={{
                              position: "absolute",
                              top: 10,
                              left: 10,
                              background: "var(--gold)",
                              color: "var(--ink)",
                              padding: "3px 9px",
                              fontSize: 10,
                              fontWeight: 600,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              fontFamily: "var(--font-body)",
                              borderRadius: 2,
                            }}>
                              Member · {savePct}% off
                            </div>
                          )}
                        </div>

                        {/* Center column — name, stars, location, amenity badges */}
                        <div className="search-hotel-card-content" style={{
                          padding: "16px 20px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          gap: 6,
                          minWidth: 0,
                        }}>
                          {/* Star row */}
                          {hotel.star_rating && hotel.star_rating > 0 && (
                            <div style={{
                              color: "var(--gold)",
                              fontSize: 11,
                              letterSpacing: "1.5px",
                              lineHeight: 1,
                            }}>
                              {"★".repeat(hotel.star_rating)}
                            </div>
                          )}
                          {/* Hotel name — Playfair, ~18px */}
                          <h3 style={{
                            fontFamily: "var(--font-display)",
                            fontStyle: "italic",
                            fontSize: 18,
                            fontWeight: 500,
                            color: "var(--ink)",
                            margin: 0,
                            lineHeight: 1.25,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {displayName}
                          </h3>
                          {/* Location chip */}
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            color: "var(--ink-light)",
                            letterSpacing: "0.02em",
                          }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {displayCity}{displayCountry ? `, ${displayCountry}` : ""}
                          </div>
                          {/* Amenity / proof badges (rating, reviews, "All inclusive") */}
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                            {/* Hide the numeric rating chip when it's just an
                                echo of star_rating (TripJack has no review
                                ratings; backend mirrors star into rating_average,
                                producing redundant "5.0" pills next to ★★★★★).
                                Only show this chip if the score is genuinely
                                review-derived AND on the 0–10 scale. */}
                            {hotel.rating_average != null
                              && hotel.rating_average > 0
                              && hotel.rating_average !== hotel.star_rating
                              && hotel.rating_average > 5 && (
                              <span style={{
                                fontSize: 10,
                                padding: "3px 8px",
                                background: hotel.rating_average >= 8.5 ? "var(--gold-pale, rgba(201,168,76,0.15))" : "var(--cream)",
                                color: hotel.rating_average >= 8.5 ? "var(--gold)" : "var(--ink-mid)",
                                border: "1px solid var(--cream-border)",
                                fontWeight: 600,
                                borderRadius: 2,
                                letterSpacing: "0.02em",
                              }}>
                                {hotel.rating_average.toFixed(1)}
                                {hotel.number_of_reviews ? ` · ${hotel.number_of_reviews.toLocaleString()} reviews` : ""}
                              </span>
                            )}
                            <span style={{
                              fontSize: 10,
                              padding: "3px 8px",
                              background: "var(--cream)",
                              color: "var(--success)",
                              border: "1px solid var(--cream-border)",
                              borderRadius: 2,
                              letterSpacing: "0.02em",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                              Free cancellation
                            </span>
                          </div>
                        </div>

                        {/* Right column — price + CTA */}
                        <div style={{
                          padding: "16px 20px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          justifyContent: "center",
                          gap: 4,
                          borderLeft: "1px solid var(--cream-border)",
                          background: "linear-gradient(180deg, transparent 0%, rgba(201,168,76,0.04) 100%)",
                        }}>
                          {hotel.rates_from != null && hotel.rates_from > 0 ? (
                            <>
                              <span style={{
                                fontSize: 10,
                                color: "var(--ink-light)",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                fontFamily: "var(--font-body)",
                              }}>
                                from
                              </span>
                              {marketRate && marketRate > hotel.rates_from && (
                                <span style={{
                                  fontSize: 12,
                                  color: "var(--ink-light)",
                                  textDecoration: "line-through",
                                  lineHeight: 1,
                                }}>
                                  {formatPrice(marketRate)}
                                </span>
                              )}
                              <span style={{
                                fontFamily: "var(--font-display)",
                                fontSize: 24,
                                fontWeight: 500,
                                color: "var(--ink)",
                                lineHeight: 1.1,
                              }}>
                                {formatPrice(Math.round(hotel.rates_from))}
                              </span>
                              <span style={{
                                fontSize: 10,
                                color: "var(--ink-light)",
                                letterSpacing: "0.04em",
                              }}>
                                per night · taxes incl.
                              </span>
                            </>
                          ) : batchRatesLoading ? (
                            <span style={{
                              fontSize: 11,
                              color: "var(--ink-light)",
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              fontWeight: 500,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}>
                              <span
                                aria-hidden
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  border: "1.5px solid var(--cream-border)",
                                  borderTopColor: "var(--gold)",
                                  animation: "voyagr-spin 0.8s linear infinite",
                                }}
                              />
                              Calculating&hellip;
                            </span>
                          ) : (
                            <span style={{
                              fontSize: 11,
                              color: "var(--gold)",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              fontWeight: 500,
                            }}>
                              Call for rates
                            </span>
                          )}
                          <span style={{
                            marginTop: 8,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--gold)",
                            fontFamily: "var(--font-body)",
                            letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                          }}>
                            View rates &rarr;
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              perPage={perPage}
              onChange={handlePageChange}
            />
          </motion.div>
        )}

        {/* ── Curated favourites in {city} — small horizontal scroller below results ── */}
        {!searching && hasSearched && filteredHotels.length > 0 && regionFilteredCities.length > 0 && (
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
