"use client";

// =============================================================================
//  HotelGrid — shared paginated hotel list (search row card + pagination).
//
//  Used by:
//    • /search — full-text search results.
//    • /city/[slug] — "All hotels in {City}" section below curated picks.
//
//  Owns:
//    • Paginated fetch from /api/hotels/search (via searchHotelsPaginated).
//    • Live batch-rate fetch (POST /api/hotels/rates/batch) merged into rows.
//      P0 RULE: rates are NEVER cached — fetchBatchRates passes cache:'no-store'.
//    • Optional region (continent) filter for the search page's region tabs.
//    • De-dup via excludeIds — caller passes the master_ids already shown
//      above (e.g. curated picks on the city page) and we hide them here.
//
//  Theming: every inline style uses the legacy design tokens (--cream / --ink
//  / --gold / --white). On the city page these auto-remap to dark luxe via
//  the .luxe scope in globals.css, so the same markup renders on both pages.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  searchHotelsPaginated,
  fetchBatchRates,
  type BatchRatesResponse,
} from "@/lib/api";
import { hotelUrl } from "@/lib/urls";
import { FALLBACK_CITY_IMAGE } from "@/lib/constants";
import { useBooking } from "@/context/BookingContext";
import SearchResultsSkeleton from "@/components/skeletons/SearchResultsSkeleton";

const FALLBACK_IMAGE = FALLBACK_CITY_IMAGE;

function safeImageSrc(url: string): string {
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

// ---------------------------------------------------------------------------
// Result row shape — backend `/api/hotels/search` returns canonical
// hotels_master rows. Legacy aliases are kept optional for resilience.
// ---------------------------------------------------------------------------
export interface HotelGridResult {
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
  /** TripJack property classifier — Hotel / Resort / Villa / Apartment / Hostel. */
  property_type?: string | null;
  /** Live rate-plan flags merged from /api/hotels/rates/batch. */
  has_refundable?: boolean;
  has_breakfast?: boolean;
  // Legacy aliases (older /search responses).
  hotel_id?: number | string;
  hotel_name?: string;
  city?: string;
  photo1?: string | null;
}

const getName = (h: HotelGridResult): string => h.name || h.hotel_name || "";
const getCity = (h: HotelGridResult): string => h.city_name || h.city || "";

// ---------------------------------------------------------------------------
// Pagination
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
        color: active ? "var(--ink)" : disabled ? "var(--ink-light)" : "var(--ink)",
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

  const SIBLINGS = 1;
  const set = new Set<number>([1, totalPages, page]);
  for (let i = 1; i <= SIBLINGS; i++) {
    if (page - i >= 1) set.add(page - i);
    if (page + i <= totalPages) set.add(page + i);
  }
  set.add(2);
  set.add(totalPages - 1);
  const pages = Array.from(set)
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  const items: (number | "ellipsis")[] = [];
  for (let i = 0; i < pages.length; i++) {
    if (i > 0 && pages[i] - pages[i - 1] > 1) items.push("ellipsis");
    items.push(pages[i]);
  }

  const firstOnPage = (page - 1) * perPage + 1;
  const lastOnPage = Math.min(page * perPage, totalCount);

  return (
    <nav
      aria-label="Hotel results pagination"
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

// ---------------------------------------------------------------------------
// Property-type normalizer. TripJack sends mixed-case freeform strings
// ("Hotel", "Apart-Hotel", "Bed and Breakfast", "Backpackers Hostel", etc.).
// We canonicalize to the 5 user-facing buckets used in the filter strip;
// anything outside the buckets returns null (won't appear as a chip).
// ---------------------------------------------------------------------------
const PROPERTY_BUCKETS = ["Hotel", "Resort", "Villa", "Apartment", "Hostel"] as const;
type PropertyBucket = (typeof PROPERTY_BUCKETS)[number];

function normalizePropertyType(t: string | null | undefined): PropertyBucket | null {
  if (!t) return null;
  const s = t.toLowerCase();
  if (s.includes("resort")) return "Resort";
  if (s.includes("villa")) return "Villa";
  if (s.includes("apart")) return "Apartment";
  if (s.includes("hostel") || s.includes("backpack")) return "Hostel";
  if (s.includes("hotel") || s.includes("inn") || s.includes("lodge") || s.includes("bed")) {
    return "Hotel";
  }
  return null;
}

// ---------------------------------------------------------------------------
// FilterChip — pill primitive used by the strip below. Theme-token-driven so
// it auto-adapts under .luxe (dark) on the city page.
// ---------------------------------------------------------------------------
function FilterChip({
  label,
  active,
  onClick,
  disabled = false,
}: {
  label: React.ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 14px",
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "var(--font-body)",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        border: `1px solid ${active ? "var(--gold)" : "var(--cream-border)"}`,
        borderRadius: 999,
        background: active ? "var(--gold)" : "var(--white)",
        color: active ? "var(--ink)" : disabled ? "var(--ink-light)" : "var(--ink)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "border-color 0.18s, background 0.18s, color 0.18s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) e.currentTarget.style.borderColor = "var(--gold)";
      }}
      onMouseLeave={(e) => {
        if (!disabled && !active) e.currentTarget.style.borderColor = "var(--cream-border)";
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// HotelGrid (controlled — parent owns `page` state and URL sync)
// ---------------------------------------------------------------------------
export interface HotelGridProps {
  query: string;
  page: number;
  perPage?: number;
  onPageChange: (n: number) => void;
  /** Master ids to filter out (de-dupe vs hotels shown above). */
  excludeIds?: Set<string>;
  /** Optional region filter — "All" disables the filter. */
  regionFilter?: string;
  /** Lookup (lowercase city name → continent) used when regionFilter !== "All". */
  cityToContinentMap?: Record<string, string>;
  /** Optional heading rendered above the count line. */
  heading?: React.ReactNode;
  /** Override the default empty state. Renders only when there are 0 results. */
  emptyState?: React.ReactNode;
  /** Fired after each successful fetch — lets the parent display its own counts. */
  onResults?: (info: { totalCount: number; visibleCount: number; query: string }) => void;
  /** Show the "Showing X hotels for "Q"" count line. Default true. */
  showResultCount?: boolean;
  /** Fired when a search request actually fires — useful for analytics. */
  onSearch?: (info: { query: string; page: number; resultCount: number }) => void;
}

export default function HotelGrid({
  query,
  page,
  perPage = 20,
  onPageChange,
  excludeIds,
  regionFilter = "All",
  cityToContinentMap,
  heading,
  emptyState,
  onResults,
  showResultCount = true,
  onSearch,
}: HotelGridProps) {
  const { checkIn, checkOut, totalAdults, totalChildren, rooms } = useBooking();
  const roomsCount = rooms.length;

  const [hotelResults, setHotelResults] = useState<HotelGridResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searching, setSearching] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [batchRates, setBatchRates] = useState<BatchRatesResponse | null>(null);
  const [batchRatesLoading, setBatchRatesLoading] = useState(false);

  // ── Filter state ────────────────────────────────────────────────────
  // All client-side, applied on top of the current page's results. The
  // backend search endpoint doesn't take filter params yet, so a "5★"
  // filter on page 1 won't pull 5★ hotels from page 5 — that's by design
  // for now (see KNOWLEDGE.md, search-filter-scope note).
  const [minStars, setMinStars] = useState<number>(0);
  const [propertyFilter, setPropertyFilter] = useState<PropertyBucket | null>(null);
  const [freeCancelOnly, setFreeCancelOnly] = useState(false);
  const [breakfastOnly, setBreakfastOnly] = useState(false);

  // Reset filters when query or page changes — otherwise a 4★ filter on
  // Bangkok page 1 silently carries to Mumbai page 1 and confuses the user.
  useEffect(() => {
    setMinStars(0);
    setPropertyFilter(null);
    setFreeCancelOnly(false);
    setBreakfastOnly(false);
  }, [query, page]);

  // Fetch search results whenever query/page/perPage changes.
  useEffect(() => {
    if (!query.trim()) {
      setHotelResults([]);
      setTotalCount(0);
      setTotalPages(1);
      setHasFetched(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchHotelsPaginated<HotelGridResult>(query, Math.max(page, 1), perPage)
      .then((resp) => {
        if (cancelled) return;
        const hotels = resp.hotels || [];
        setHotelResults(hotels);
        setTotalCount(resp.count);
        setTotalPages(Math.max(resp.total_pages, 1));
        setHasFetched(true);
        onSearch?.({ query, page: Math.max(page, 1), resultCount: resp.count });
      })
      .catch(() => {
        if (cancelled) return;
        setHotelResults([]);
        setTotalCount(0);
        setTotalPages(1);
        setHasFetched(true);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => { cancelled = true; };
    // onSearch is stable from the parent; we deliberately don't include it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, page, perPage]);

  // Live batch rates for the current page. Each page change re-fetches.
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
        if (!cancelled) setBatchRates(null);
      })
      .finally(() => {
        if (!cancelled) setBatchRatesLoading(false);
      });
    return () => { cancelled = true; };
  }, [hotelResults, checkIn, checkOut, totalAdults, totalChildren, roomsCount]);

  // Merge live rates + rate-plan flags into rows.
  const livePricedResults = useMemo<HotelGridResult[]>(() => {
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
        has_refundable: r.has_refundable ?? h.has_refundable,
        has_breakfast: r.has_breakfast ?? h.has_breakfast,
      };
    });
  }, [hotelResults, batchRates]);

  // baseRows = page results after de-dupe + region filter (parent-driven
  // constraints), but BEFORE user filter chips. Used for both visibleHotels
  // and the property-bucket chip set.
  const baseRows = useMemo<HotelGridResult[]>(() => {
    let rows = livePricedResults;
    if (excludeIds && excludeIds.size > 0) {
      rows = rows.filter((h) => {
        const key = h.id ? String(h.id) : "";
        return !key || !excludeIds.has(key);
      });
    }
    if (regionFilter !== "All" && cityToContinentMap) {
      rows = rows.filter((h) => {
        const continent = cityToContinentMap[getCity(h).toLowerCase()];
        return !continent || continent === regionFilter;
      });
    }
    return rows;
  }, [livePricedResults, excludeIds, regionFilter, cityToContinentMap]);

  // visibleHotels = baseRows + user filter chips.
  const visibleHotels = useMemo<HotelGridResult[]>(() => {
    let rows = baseRows;
    if (minStars > 0) {
      rows = rows.filter((h) => (h.star_rating ?? 0) >= minStars);
    }
    if (propertyFilter) {
      rows = rows.filter(
        (h) => normalizePropertyType(h.property_type) === propertyFilter,
      );
    }
    if (freeCancelOnly) {
      rows = rows.filter((h) => h.has_refundable === true);
    }
    if (breakfastOnly) {
      rows = rows.filter((h) => h.has_breakfast === true);
    }
    return rows;
  }, [baseRows, minStars, propertyFilter, freeCancelOnly, breakfastOnly]);

  // Property-type chips are derived from baseRows — only show buckets
  // that have at least one hotel before user filters apply, so toggling
  // the property filter is always reversible.
  const propertyBucketsOnPage = useMemo<PropertyBucket[]>(() => {
    const present = new Set<PropertyBucket>();
    for (const h of baseRows) {
      const b = normalizePropertyType(h.property_type);
      if (b) present.add(b);
    }
    return PROPERTY_BUCKETS.filter((b) => present.has(b));
  }, [baseRows]);

  const filtersActive =
    minStars > 0 || propertyFilter !== null || freeCancelOnly || breakfastOnly;
  const clearFilters = () => {
    setMinStars(0);
    setPropertyFilter(null);
    setFreeCancelOnly(false);
    setBreakfastOnly(false);
  };

  // Tell the parent about counts so it can render its own toolbar copy.
  useEffect(() => {
    if (!onResults) return;
    onResults({ totalCount, visibleCount: visibleHotels.length, query });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount, visibleHotels.length, query]);

  // ── Render ─────────────────────────────────────────────────────────────
  if (searching && !hasFetched) {
    return (
      <div style={{ padding: "8px 0 24px" }}>
        <SearchResultsSkeleton count={Math.min(perPage, 8)} />
      </div>
    );
  }

  // Server returned 0 results for this query/page — defer to the parent's
  // empty state (search page renders "No results found" with a CTA).
  if (hasFetched && baseRows.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  if (!hasFetched) return null;

  // ── Filter strip ───────────────────────────────────────────────────
  const filterStrip = (
    <div
      className="hotel-grid-filters"
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
        marginBottom: 18,
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "var(--ink-light)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 600,
          fontFamily: "var(--font-body)",
          marginRight: 4,
        }}
      >
        Stars
      </span>
      {[0, 3, 4, 5].map((s) => (
        <FilterChip
          key={`star-${s}`}
          label={s === 0 ? "Any" : s === 5 ? "5★" : `${s}+ ★`}
          active={minStars === s}
          onClick={() => setMinStars(s)}
        />
      ))}

      {propertyBucketsOnPage.length > 0 && (
        <>
          <span
            style={{
              fontSize: 10,
              color: "var(--ink-light)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              margin: "0 4px 0 12px",
            }}
          >
            Type
          </span>
          <FilterChip
            label="All"
            active={propertyFilter === null}
            onClick={() => setPropertyFilter(null)}
          />
          {propertyBucketsOnPage.map((bucket) => (
            <FilterChip
              key={bucket}
              label={bucket}
              active={propertyFilter === bucket}
              onClick={() =>
                setPropertyFilter(propertyFilter === bucket ? null : bucket)
              }
            />
          ))}
        </>
      )}

      <span
        style={{
          fontSize: 10,
          color: "var(--ink-light)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 600,
          fontFamily: "var(--font-body)",
          margin: "0 4px 0 12px",
        }}
      >
        Perks
      </span>
      <FilterChip
        label={
          batchRatesLoading && !batchRates ? "Free cancel · loading…" : "Free cancellation"
        }
        active={freeCancelOnly}
        disabled={batchRatesLoading && !batchRates}
        onClick={() => setFreeCancelOnly((v) => !v)}
      />
      <FilterChip
        label={
          batchRatesLoading && !batchRates ? "Breakfast · loading…" : "Breakfast included"
        }
        active={breakfastOnly}
        disabled={batchRatesLoading && !batchRates}
        onClick={() => setBreakfastOnly((v) => !v)}
      />

      {filtersActive && (
        <button
          type="button"
          onClick={clearFilters}
          style={{
            fontSize: 11,
            color: "var(--gold)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            letterSpacing: "0.04em",
            padding: "4px 8px",
            marginLeft: 4,
          }}
        >
          Clear ×
        </button>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {(heading || showResultCount) && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 16,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          {heading ?? <span />}
          {showResultCount && (
            <span style={{ fontSize: 12, color: "var(--ink-light)" }}>
              {totalCount > visibleHotels.length
                ? `${visibleHotels.length} of ${totalCount.toLocaleString()} result${totalCount !== 1 ? "s" : ""}`
                : `${visibleHotels.length} result${visibleHotels.length !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>
      )}

      {filterStrip}

      {/* Filtered to nothing on this page — give the user an out instead of
          a silent empty grid (server still has results, just none here). */}
      {visibleHotels.length === 0 && (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            border: "1px dashed var(--cream-border)",
            borderRadius: 10,
            color: "var(--ink-light)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          No hotels on this page match your filters.{" "}
          <button
            type="button"
            onClick={clearFilters}
            style={{
              color: "var(--gold)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              padding: 0,
              fontSize: 13,
            }}
          >
            Clear filters
          </button>
          {totalPages > 1 && " or try another page."}
        </div>
      )}

      <div className="search-hotel-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visibleHotels.map((hotel, i) => {
          const displayName = getName(hotel) || "Hotel";
          const displayCity = getCity(hotel);
          const displayCountry = hotel.country || "";
          const photoSrc = hotel.image_url ?? hotel.photo1 ?? null;
          const cardKey = String(
            hotel.id || hotel.short_id || hotel.slug || hotel.hotel_id || `idx-${i}`,
          );

          // Member rate vs. MRP — same heuristic the search page used pre-extract.
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
                  id:
                    (hotel.id as string | undefined) ??
                    (hotel.hotel_id != null ? String(hotel.hotel_id) : null),
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

                  <div className="search-hotel-card-content" style={{
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 6,
                    minWidth: 0,
                  }}>
                    {hotel.star_rating && hotel.star_rating > 0 && (
                      <div style={{ color: "var(--gold)", fontSize: 11, letterSpacing: "1.5px", lineHeight: 1 }}>
                        {"★".repeat(hotel.star_rating)}
                      </div>
                    )}
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
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
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
        onChange={onPageChange}
      />
    </motion.div>
  );
}
