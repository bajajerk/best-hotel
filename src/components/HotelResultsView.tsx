"use client";

// =============================================================================
//  HotelResultsView — unified hotel search results component (dark luxe).
//
//  Replaces the old split layout (curated 4×2 image grid + separate list)
//  on /city/[slug] and /search with a single view that toggles between
//  Grid and List modes. Owns:
//    • Paginated fetch from /api/hotels/search (via searchHotelsPaginated).
//    • Live batch-rate fetch (/api/hotels/rates/batch) merged into rows.
//    • Client-side stars + perks filters synced to URL query params.
//    • View mode persisted to localStorage (`voyagr_view_pref`).
//    • "Show 6, then show all" pagination — no page reload.
//
//  Designed to render inside a `.luxe` parent (dark scope). Uses literal
//  hex colors per the spec rather than the flipping --ink/--cream tokens
//  so the component looks identical regardless of scope.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  searchHotelsPaginated,
  fetchBatchRates,
  type BatchRatesResponse,
} from "@/lib/api";
import { hotelUrl } from "@/lib/urls";
import { FALLBACK_CITY_IMAGE } from "@/lib/constants";
import { useBooking } from "@/context/BookingContext";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VIEW_PREF_KEY = "voyagr_view_pref";
const INITIAL_VISIBLE = 6;
const FETCH_PER_PAGE = 50;

type ViewMode = "grid" | "list";
type StarsFilter = "any" | "4plus" | "5";
type Perk = "free-cancel" | "breakfast" | "upgrade";

// ---------------------------------------------------------------------------
// Result row shape
// ---------------------------------------------------------------------------
interface ApiHotelRow {
  id?: string;
  short_id?: string | null;
  slug?: string | null;
  name?: string;
  hotel_name?: string;
  city_name?: string;
  city?: string;
  country?: string;
  star_rating?: number | null;
  rating_average?: number | null;
  rates_from?: number | null;
  rates_currency?: string | null;
  image_url?: string | null;
  photo1?: string | null;
  neighbourhood?: string | null;
  has_refundable?: boolean;
  has_breakfast?: boolean;
  has_upgrade?: boolean;
  /** Live discount %, populated from batch rates response. */
  savings_pct?: number | null;
}

const getName = (h: ApiHotelRow): string => h.name || h.hotel_name || "Hotel";
const getCity = (h: ApiHotelRow): string => h.city_name || h.city || "";
const getNeighbourhood = (h: ApiHotelRow): string =>
  (h.neighbourhood && h.neighbourhood.trim()) || getCity(h);

function safeImageSrc(url: string | null | undefined): string {
  if (!url || !url.trim()) return FALLBACK_CITY_IMAGE;
  let u = url;
  if (u.startsWith("http://")) u = u.replace("http://", "https://");
  if (!u.startsWith("http")) u = `https://photos.hotelbeds.com/giata/${u}`;
  return u;
}

function formatPrice(amount: number, currency: string | null | undefined): string {
  const sym = currency === "INR" ? "₹" : "$";
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return `${sym}${Math.round(amount).toLocaleString(locale)}`;
}

// ---------------------------------------------------------------------------
// URL filter sync helpers
// ---------------------------------------------------------------------------
function parseStars(value: string | null): StarsFilter {
  if (value === "5") return "5";
  if (value === "4") return "4plus";
  return "any";
}
function parsePerks(value: string | null): Set<Perk> {
  const set = new Set<Perk>();
  if (!value) return set;
  for (const raw of value.split(",")) {
    const v = raw.trim();
    if (v === "free-cancel" || v === "breakfast" || v === "upgrade") set.add(v);
  }
  return set;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const btn = (mode: ViewMode, icon: React.ReactNode, label: string) => {
    const active = view === mode;
    return (
      <button
        type="button"
        onClick={() => onChange(mode)}
        aria-label={label}
        aria-pressed={active}
        style={{
          width: 30,
          height: 26,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: active ? "rgba(184,149,106,0.2)" : "transparent",
          color: active ? "#b8956a" : "#6b665e",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          transition: "background 0.18s, color 0.18s",
        }}
      >
        {icon}
      </button>
    );
  };

  return (
    <div
      style={{
        display: "inline-flex",
        gap: 2,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 6,
        padding: 2,
      }}
    >
      {btn(
        "grid",
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>,
        "Grid view",
      )}
      {btn(
        "list",
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>,
        "List view",
      )}
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: "4px 10px",
        fontSize: 11,
        fontFamily: "var(--font-body)",
        background: active ? "rgba(184,149,106,0.15)" : "transparent",
        border: `0.5px solid ${active ? "rgba(184,149,106,0.4)" : "rgba(255,255,255,0.12)"}`,
        color: active ? "#b8956a" : "#a09a91",
        borderRadius: 20,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "background 0.18s, border-color 0.18s, color 0.18s",
      }}
    >
      {label}
    </button>
  );
}

function PerkTag({
  text,
  variant,
}: {
  text: string;
  variant: "gold" | "green" | "muted";
}) {
  const map = {
    gold: { bg: "rgba(184,149,106,0.1)", color: "#b8956a" },
    green: { bg: "rgba(93,157,106,0.1)", color: "#5d9d6a" },
    muted: { bg: "rgba(255,255,255,0.04)", color: "#a09a91" },
  };
  const s = map[variant];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 10,
        padding: "2px 6px",
        borderRadius: 4,
        fontFamily: "var(--font-body)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        background: "rgba(0,0,0,0.6)",
        padding: "2px 6px",
        borderRadius: 4,
        fontSize: 11,
        color: "#c9a66b",
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        zIndex: 1,
      }}
    >
      {rating.toFixed(1)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card — Grid view
// ---------------------------------------------------------------------------
function GridCard({ hotel }: { hotel: ApiHotelRow }) {
  const name = getName(hotel);
  const neighbourhood = getNeighbourhood(hotel);
  const photo = safeImageSrc(hotel.image_url ?? hotel.photo1);
  const rating = hotel.rating_average;
  const price = hotel.rates_from;
  const discount = hotel.savings_pct ?? 0;

  const tags: { text: string; variant: "gold" | "green" }[] = [];
  if (hotel.has_refundable) tags.push({ text: "Free cancel", variant: "green" });
  if (hotel.has_breakfast) tags.push({ text: "Breakfast", variant: "gold" });
  if (hotel.has_upgrade) tags.push({ text: "Upgrade", variant: "gold" });

  const visibleTags = tags.slice(0, 3);
  const overflowCount = Math.max(0, tags.length - 3);

  return (
    <Link
      href={hotelUrl({
        slug: hotel.slug ?? null,
        short_id: hotel.short_id ?? null,
        id: hotel.id ?? null,
      })}
      className="hrv-card hrv-card--grid"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "transparent",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        overflow: "hidden",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.18s",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 100,
          overflow: "hidden",
          background: "#0c0c0c",
        }}
        className="hrv-card-img"
      >
        {rating != null && rating > 0 && <RatingBadge rating={rating} />}
        <img
          src={photo}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_CITY_IMAGE;
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 40,
            background: "linear-gradient(0deg, #0c0c0c, transparent)",
          }}
        />
      </div>
      <div
        style={{
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display), 'Cormorant Garamond', Georgia, serif",
            fontSize: 15,
            fontWeight: 500,
            color: "#f0ece4",
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            color: "#6b665e",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {neighbourhood}
        </div>
        {visibleTags.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {visibleTags.map((t) => (
              <PerkTag key={t.text} text={t.text} variant={t.variant} />
            ))}
            {overflowCount > 0 && (
              <PerkTag text={`+${overflowCount} more`} variant="muted" />
            )}
          </div>
        )}
        <div
          style={{
            borderTop: "0.5px solid rgba(255,255,255,0.06)",
            paddingTop: 8,
            marginTop: 2,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          {price != null && price > 0 ? (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "#f0ece4",
                fontWeight: 500,
              }}
            >
              {formatPrice(price, hotel.rates_currency)}
              <span style={{ fontSize: 10, color: "#6b665e", marginLeft: 2 }}>
                /night
              </span>
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "#6b665e" }}>—</span>
          )}
          {discount > 0 && (
            <span style={{ fontSize: 11, color: "#4a8c5c", fontWeight: 500 }}>
              ↓ {discount}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Row — List view
// ---------------------------------------------------------------------------
function ListRow({ hotel }: { hotel: ApiHotelRow }) {
  const name = getName(hotel);
  const neighbourhood = getNeighbourhood(hotel);
  const photo = safeImageSrc(hotel.image_url ?? hotel.photo1);
  const rating = hotel.rating_average;
  const price = hotel.rates_from;
  const discount = hotel.savings_pct ?? 0;

  const tags: { text: string; variant: "gold" | "green" }[] = [];
  if (hotel.has_refundable) tags.push({ text: "Free cancel", variant: "green" });
  if (hotel.has_breakfast) tags.push({ text: "Breakfast", variant: "gold" });
  if (hotel.has_upgrade) tags.push({ text: "Upgrade", variant: "gold" });

  const visibleTags = tags.slice(0, 3);
  const overflowCount = Math.max(0, tags.length - 3);

  return (
    <Link
      href={hotelUrl({
        slug: hotel.slug ?? null,
        short_id: hotel.short_id ?? null,
        id: hotel.id ?? null,
      })}
      className="hrv-card hrv-card--list"
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr auto",
        alignItems: "stretch",
        background: "transparent",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        overflow: "hidden",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.18s",
        minHeight: 110,
      }}
    >
      <div
        className="hrv-list-img"
        style={{
          position: "relative",
          width: 140,
          minHeight: 110,
          overflow: "hidden",
          background: "#0c0c0c",
        }}
      >
        {rating != null && rating > 0 && <RatingBadge rating={rating} />}
        <img
          src={photo}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_CITY_IMAGE;
          }}
        />
      </div>
      <div
        className="hrv-list-mid"
        style={{
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display), 'Cormorant Garamond', Georgia, serif",
            fontSize: 17,
            fontWeight: 500,
            color: "#f0ece4",
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "#6b665e",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {neighbourhood}
        </div>
        {visibleTags.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {visibleTags.map((t) => (
              <PerkTag key={t.text} text={t.text} variant={t.variant} />
            ))}
            {overflowCount > 0 && (
              <PerkTag text={`+${overflowCount} more`} variant="muted" />
            )}
          </div>
        )}
      </div>
      <div
        className="hrv-list-right"
        style={{
          minWidth: 120,
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-end",
          borderLeft: "0.5px solid rgba(255,255,255,0.05)",
          gap: 4,
        }}
      >
        {price != null && price > 0 ? (
          <>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 17,
                fontWeight: 500,
                color: "#f0ece4",
                lineHeight: 1.1,
              }}
            >
              {formatPrice(price, hotel.rates_currency)}
            </span>
            <span style={{ fontSize: 10, color: "#6b665e" }}>/night</span>
            {discount > 0 && (
              <span style={{ fontSize: 10, color: "#4a8c5c", fontWeight: 500 }}>
                ↓ {discount}%
              </span>
            )}
          </>
        ) : (
          <span style={{ fontSize: 11, color: "#6b665e" }}>—</span>
        )}
        <span
          style={{
            marginTop: 6,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontFamily: "var(--font-body)",
            color: "#b8956a",
            border: "0.5px solid rgba(184,149,106,0.3)",
            padding: "5px 14px",
            borderRadius: 6,
            background: "transparent",
            whiteSpace: "nowrap",
          }}
        >
          View rates →
        </span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------
function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="hrv-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 100,
              background: "rgba(255,255,255,0.04)",
              animation: "hrv-pulse 1.4s ease-in-out infinite",
            }}
          />
          <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                height: 14,
                width: "70%",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 3,
                animation: "hrv-pulse 1.4s ease-in-out infinite",
              }}
            />
            <div
              style={{
                height: 10,
                width: "45%",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 3,
                animation: "hrv-pulse 1.4s ease-in-out infinite",
              }}
            />
            <div
              style={{
                height: 10,
                width: "55%",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 3,
                marginTop: 4,
                animation: "hrv-pulse 1.4s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr auto",
            border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            overflow: "hidden",
            minHeight: 110,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              animation: "hrv-pulse 1.4s ease-in-out infinite",
            }}
          />
          <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
            <div style={{ height: 16, width: "55%", background: "rgba(255,255,255,0.05)", borderRadius: 3, animation: "hrv-pulse 1.4s ease-in-out infinite" }} />
            <div style={{ height: 10, width: "35%", background: "rgba(255,255,255,0.04)", borderRadius: 3, animation: "hrv-pulse 1.4s ease-in-out infinite" }} />
          </div>
          <div style={{ width: 130, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", justifyContent: "center", borderLeft: "0.5px solid rgba(255,255,255,0.05)" }}>
            <div style={{ height: 16, width: 70, background: "rgba(255,255,255,0.05)", borderRadius: 3, animation: "hrv-pulse 1.4s ease-in-out infinite" }} />
            <div style={{ height: 24, width: 100, background: "rgba(255,255,255,0.04)", borderRadius: 6, animation: "hrv-pulse 1.4s ease-in-out infinite" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export interface HotelResultsViewProps {
  /** Query passed to /api/hotels/search (city display name, free text, etc.). */
  query: string;
  /** Display name for the header — defaults to query. */
  cityName?: string;
  /** Master ids to filter out (de-dupe vs hotels shown above). */
  excludeIds?: Set<string>;
  /** Optional region filter — "All" disables the filter. */
  regionFilter?: string;
  /** Lookup (lowercase city name → continent) used when regionFilter !== "All". */
  cityToContinentMap?: Record<string, string>;
}

export default function HotelResultsView({
  query,
  cityName,
  excludeIds,
  regionFilter = "All",
  cityToContinentMap,
}: HotelResultsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { checkIn, checkOut, totalAdults, totalChildren, rooms } = useBooking();
  const roomsCount = rooms.length;

  // ── View mode ──────────────────────────────────────────────────────────
  const [view, setView] = useState<ViewMode>("grid");
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(VIEW_PREF_KEY);
      if (stored === "grid" || stored === "list") setView(stored);
    } catch {
      /* ignore */
    }
  }, []);
  const handleViewChange = useCallback((v: ViewMode) => {
    setView(v);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(VIEW_PREF_KEY, v);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ── Filters (URL-synced) ───────────────────────────────────────────────
  const [stars, setStars] = useState<StarsFilter>(() =>
    parseStars(searchParams.get("stars")),
  );
  const [perks, setPerks] = useState<Set<Perk>>(() =>
    parsePerks(searchParams.get("perks")),
  );

  // Re-read from URL when navigating (back/forward, deep link).
  useEffect(() => {
    setStars(parseStars(searchParams.get("stars")));
    setPerks(parsePerks(searchParams.get("perks")));
  }, [searchParams]);

  const writeFiltersToUrl = useCallback(
    (nextStars: StarsFilter, nextPerks: Set<Perk>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextStars === "5") params.set("stars", "5");
      else if (nextStars === "4plus") params.set("stars", "4");
      else params.delete("stars");

      if (nextPerks.size > 0) {
        params.set("perks", Array.from(nextPerks).join(","));
      } else {
        params.delete("perks");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setStarsFilter = useCallback(
    (next: StarsFilter) => {
      setStars(next);
      writeFiltersToUrl(next, perks);
    },
    [perks, writeFiltersToUrl],
  );

  const togglePerk = useCallback(
    (perk: Perk) => {
      const next = new Set(perks);
      if (next.has(perk)) next.delete(perk);
      else next.add(perk);
      setPerks(next);
      writeFiltersToUrl(stars, next);
    },
    [perks, stars, writeFiltersToUrl],
  );

  const clearFilters = useCallback(() => {
    setStars("any");
    setPerks(new Set());
    writeFiltersToUrl("any", new Set());
  }, [writeFiltersToUrl]);

  // ── Visible count ("Show all" pagination) ─────────────────────────────
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE);
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [query, stars, perks]);

  // ── Fetch results ──────────────────────────────────────────────────────
  const [hotels, setHotels] = useState<ApiHotelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [batchRates, setBatchRates] = useState<BatchRatesResponse | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setHotels([]);
      setHasFetched(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchHotelsPaginated<ApiHotelRow>(query, 1, FETCH_PER_PAGE)
      .then((resp) => {
        if (cancelled) return;
        setHotels(resp.hotels || []);
        setHasFetched(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHotels([]);
        setHasFetched(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  // ── Live batch rates ───────────────────────────────────────────────────
  useEffect(() => {
    if (!hotels.length || !checkIn || !checkOut) {
      setBatchRates(null);
      return;
    }
    const masterIds = hotels
      .map((h) => (h.id ? String(h.id) : null))
      .filter((x): x is string => !!x);
    if (!masterIds.length) {
      setBatchRates(null);
      return;
    }
    let cancelled = false;
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
        if (!cancelled) setBatchRates(resp);
      })
      .catch(() => {
        if (!cancelled) setBatchRates(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hotels, checkIn, checkOut, totalAdults, totalChildren, roomsCount]);

  // Merge live rates into rows.
  const livePricedHotels = useMemo<ApiHotelRow[]>(() => {
    if (!batchRates || !batchRates.results) return hotels;
    return hotels.map((h) => {
      const key = h.id ? String(h.id) : "";
      const r = key ? batchRates.results[key] : undefined;
      if (!r) return h;
      return {
        ...h,
        rates_from: typeof r.from_price === "number" ? r.from_price : h.rates_from,
        rates_currency: r.currency ?? h.rates_currency ?? "INR",
        has_refundable: r.has_refundable ?? h.has_refundable,
        has_breakfast: r.has_breakfast ?? h.has_breakfast,
        savings_pct: typeof r.savings_pct === "number" ? r.savings_pct : null,
      };
    });
  }, [hotels, batchRates]);

  // Apply de-dupe and region filter (parent constraints, before user filters).
  const baseRows = useMemo<ApiHotelRow[]>(() => {
    let rows = livePricedHotels;
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
  }, [livePricedHotels, excludeIds, regionFilter, cityToContinentMap]);

  // Apply user filters.
  const filteredRows = useMemo<ApiHotelRow[]>(() => {
    let rows = baseRows;
    if (stars === "5") rows = rows.filter((h) => (h.star_rating ?? 0) >= 5);
    else if (stars === "4plus")
      rows = rows.filter((h) => (h.star_rating ?? 0) >= 4);

    if (perks.has("free-cancel")) {
      rows = rows.filter((h) => h.has_refundable === true);
    }
    if (perks.has("breakfast")) {
      rows = rows.filter((h) => h.has_breakfast === true);
    }
    if (perks.has("upgrade")) {
      rows = rows.filter((h) => h.has_upgrade === true);
    }
    return rows;
  }, [baseRows, stars, perks]);

  const totalAvailable = filteredRows.length;
  const totalAllProperties = baseRows.length;
  const visibleHotels = filteredRows.slice(0, visibleCount);
  const filtersActive = stars !== "any" || perks.size > 0;
  const displayName = (cityName || query || "").trim();

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="hrv-root">
      <style jsx global>{`
        @keyframes hrv-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        .hrv-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .hrv-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hrv-card:hover {
          border-color: rgba(184,149,106,0.3) !important;
        }
        @media (max-width: 768px) {
          .hrv-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .hrv-card--list {
            grid-template-columns: 1fr !important;
          }
          .hrv-card--list .hrv-list-img {
            width: 100% !important;
            height: 120px !important;
          }
          .hrv-card--list .hrv-list-right {
            border-left: none !important;
            border-top: 0.5px solid rgba(255,255,255,0.05);
            align-items: stretch !important;
            min-width: 0 !important;
          }
        }
        @media (max-width: 480px) {
          .hrv-grid {
            grid-template-columns: 1fr;
          }
          .hrv-card--grid .hrv-card-img {
            height: 140px !important;
          }
        }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-display), 'Cormorant Garamond', Georgia, serif",
              fontSize: 22,
              fontWeight: 400,
              color: "#f0ece4",
              lineHeight: 1.2,
            }}
          >
            Hotels in {displayName}
          </h2>
          {hasFetched && (
            <span
              style={{
                fontFamily: "var(--font-body), Inter, sans-serif",
                fontSize: 12,
                color: "#6b665e",
              }}
            >
              {totalAllProperties.toLocaleString()} {totalAllProperties === 1 ? "property" : "properties"}
            </span>
          )}
        </div>
        <ViewToggle view={view} onChange={handleViewChange} />
      </div>

      {/* ── Filter strip ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "#6b665e",
            fontFamily: "var(--font-body)",
          }}
        >
          Stars
        </span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <FilterPill label="Any" active={stars === "any"} onClick={() => setStarsFilter("any")} />
          <FilterPill label="4★+" active={stars === "4plus"} onClick={() => setStarsFilter("4plus")} />
          <FilterPill label="5★" active={stars === "5"} onClick={() => setStarsFilter("5")} />
        </div>

        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 1,
            height: 14,
            background: "rgba(255,255,255,0.08)",
          }}
        />

        <span
          style={{
            fontSize: 11,
            color: "#6b665e",
            fontFamily: "var(--font-body)",
          }}
        >
          Perks
        </span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <FilterPill
            label="Free cancel"
            active={perks.has("free-cancel")}
            onClick={() => togglePerk("free-cancel")}
          />
          <FilterPill
            label="Breakfast"
            active={perks.has("breakfast")}
            onClick={() => togglePerk("breakfast")}
          />
          <FilterPill
            label="Upgrade"
            active={perks.has("upgrade")}
            onClick={() => togglePerk("upgrade")}
          />
        </div>
      </div>

      {/* ── Body ── */}
      {loading && !hasFetched ? (
        view === "grid" ? <SkeletonGrid /> : <SkeletonList />
      ) : !hasFetched ? null : totalAllProperties === 0 ? (
        <EmptyCity displayName={displayName} />
      ) : totalAvailable === 0 ? (
        <EmptyFilter onClear={clearFilters} />
      ) : view === "grid" ? (
        <motion.div
          key="grid"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="hrv-grid"
        >
          {visibleHotels.map((h) => (
            <GridCard key={String(h.id || h.short_id || h.slug || getName(h))} hotel={h} />
          ))}
        </motion.div>
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="hrv-list"
        >
          {visibleHotels.map((h) => (
            <ListRow key={String(h.id || h.short_id || h.slug || getName(h))} hotel={h} />
          ))}
        </motion.div>
      )}

      {/* ── Footer pagination ── */}
      {hasFetched && totalAvailable > INITIAL_VISIBLE && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, color: "#6b665e", fontFamily: "var(--font-body)" }}>
            Showing {Math.min(visibleCount, totalAvailable)} of {totalAvailable}{" "}
            {totalAvailable === 1 ? "property" : "properties"}
            {filtersActive && totalAllProperties > totalAvailable
              ? ` (filtered from ${totalAllProperties})`
              : ""}
          </span>
          {visibleCount < totalAvailable && (
            <button
              type="button"
              onClick={() => setVisibleCount(totalAvailable)}
              style={{
                fontSize: 12,
                color: "#b8956a",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                padding: 0,
              }}
            >
              Show all →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyCity({ displayName }: { displayName: string }) {
  return (
    <div
      style={{
        padding: "48px 20px",
        textAlign: "center",
        border: "0.5px dashed rgba(255,255,255,0.12)",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "#a09a91",
          marginBottom: 10,
        }}
      >
        No properties available in {displayName} yet.
      </div>
      <Link
        href="/search"
        style={{
          fontSize: 12,
          color: "#b8956a",
          fontFamily: "var(--font-body)",
          textDecoration: "none",
        }}
      >
        Browse our top cities →
      </Link>
    </div>
  );
}

function EmptyFilter({ onClear }: { onClear: () => void }) {
  return (
    <div
      style={{
        padding: "40px 20px",
        textAlign: "center",
        border: "0.5px dashed rgba(255,255,255,0.12)",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "#a09a91",
          marginBottom: 10,
        }}
      >
        No properties match your filters.
      </div>
      <button
        type="button"
        onClick={onClear}
        style={{
          fontSize: 12,
          color: "#b8956a",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          padding: 0,
        }}
      >
        Clear filters
      </button>
    </div>
  );
}
