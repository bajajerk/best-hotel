"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { useBooking } from "@/context/BookingContext";
import {
  PERK_OPTIONS,
  PRICE_DEFAULT_MAX,
  PRICE_DEFAULT_MIN,
  PRICE_STEP,
  SORT_LABELS,
  fetchVoyagrSearch,
  readFiltersFromURL,
  writeFiltersToURL,
  type PerkLabel,
  type SearchFacets,
  type SearchHotel,
  type SortKey,
} from "@/lib/voyagrSearch";
import {
  trackEmptyStateShown,
  trackFilterApplied,
  trackFilterCleared,
  trackResultClicked,
  trackSortChanged,
} from "@/lib/analytics";
import PriceBlock from "@/components/PriceBlock";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FONT_DISPLAY = "'Cormorant Garamond', 'Cormorant', Georgia, serif";
const FONT_LABEL =
  "'Montserrat', system-ui, -apple-system, 'Helvetica Neue', sans-serif";

const GOLD = "#c9a96e";
const PAGE_LIMIT = 20;
const FETCH_DEBOUNCE_MS = 300;
const SLOW_FETCH_THRESHOLD_MS = 5000;
const FETCH_TIMEOUT_MS = 10000;

const STAR_PILLS: Array<{ label: string; value: number }> = [
  { label: "Any", value: 0 },
  { label: "★ 3+", value: 3 },
  { label: "★ 4+", value: 4 },
  { label: "★ 5", value: 5 },
];

// ---------------------------------------------------------------------------
// Hook: stable booking context with safe defaults
// ---------------------------------------------------------------------------
function useBookingContext() {
  const ctx = useBooking();
  const checkIn = ctx.checkIn || "2026-06-12";
  const checkOut = ctx.checkOut || "2026-06-15";
  const guests = ctx.totalGuests || 2;
  const nights = ctx.nights || 3;
  const destination = ctx.destination || "Mumbai";
  return { checkIn, checkOut, guests, nights, destination };
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
const formatINR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

function shortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateRange(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return "Dates";
  return `${shortDate(checkIn)}–${shortDate(checkOut).split(" ")[1] || ""}`;
}

// ---------------------------------------------------------------------------
// Top-level component
// ---------------------------------------------------------------------------
export default function VoyagrFilterResults() {
  const { checkIn, checkOut, guests, destination } = useBookingContext();
  const city = destination || "Mumbai";

  // ── Hydrate APPLIED state from URL on mount ─────────────────────────────
  const [hydrated, setHydrated] = useState(false);
  const [stars, setStars] = useState<number>(0);
  const [perks, setPerks] = useState<PerkLabel[]>([]);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [priceMin, setPriceMin] = useState<number>(PRICE_DEFAULT_MIN);
  const [priceMax, setPriceMax] = useState<number>(PRICE_DEFAULT_MAX);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const parsed = readFiltersFromURL(sp);
    setStars(parsed.stars);
    setPerks(parsed.perks);
    setPriceMin(parsed.minPrice);
    setPriceMax(parsed.maxPrice);
    setSort(parsed.sort);
    setHydrated(true);
  }, []);

  // ── Sync APPLIED filter state → URL (replaceState) ──────────────────────
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const current = new URLSearchParams(window.location.search);
    const next = writeFiltersToURL(
      {
        stars,
        perks,
        minPrice: priceMin,
        maxPrice: priceMax,
        sort,
      },
      current
    );
    const search = next.toString();
    const url = `${window.location.pathname}${search ? `?${search}` : ""}`;
    window.history.replaceState(window.history.state, "", url);
  }, [hydrated, stars, perks, priceMin, priceMax, sort]);

  // ── Fetch state ─────────────────────────────────────────────────────────
  const [hotels, setHotels] = useState<SearchHotel[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [facets, setFacets] = useState<SearchFacets | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [paginating, setPaginating] = useState<boolean>(false);
  const [slow, setSlow] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Bumping this triggers a refetch via the effect's dep array — used by the
  // error-banner Retry button.
  const [retryToken, setRetryToken] = useState(0);

  // Used to distinguish "first load" (full-screen spinner) from "filter
  // refetch" (dim list, do NOT blank).
  const isInitialLoad = hotels.length === 0 && !error;

  // ── Reset page when any filter changes ──────────────────────────────────
  // (Note: when `page` itself changes via "Load more", we don't reset.)
  useEffect(() => {
    if (!hydrated) return;
    setPage(1);
  }, [hydrated, stars, perks, sort, priceMin, priceMax, city, checkIn, checkOut, guests]);

  // ── Debounced fetch with AbortController ────────────────────────────────
  // The debounce avoids a fetch storm when the user toggles 5 perks rapidly;
  // the AbortController prevents a slow earlier response from overwriting a
  // newer one if the filters change again before it lands.
  useEffect(() => {
    if (!hydrated) return;

    const ctrl = new AbortController();
    const isAppending = page > 1;
    if (isAppending) setPaginating(true);
    else setLoading(true);
    setSlow(false);

    const slowTimer = setTimeout(() => setSlow(true), SLOW_FETCH_THRESHOLD_MS);
    const timeoutTimer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

    const debounce = setTimeout(async () => {
      try {
        const data = await fetchVoyagrSearch(
          {
            city,
            checkIn,
            checkOut,
            guests,
            minStars: stars,
            perks,
            minPrice: priceMin,
            maxPrice: priceMax,
            sort,
            page,
            limit: PAGE_LIMIT,
          },
          ctrl.signal
        );

        setError(null);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setFacets(data.facets);
        setHotels((prev) =>
          isAppending ? [...prev, ...data.hotels] : data.hotels
        );

        if (data.total === 0 && !isAppending) {
          const active: string[] = [];
          if (stars > 0) active.push(`stars:${stars}`);
          if (perks.length) active.push(`perks:${perks.length}`);
          if (priceMin !== PRICE_DEFAULT_MIN || priceMax !== PRICE_DEFAULT_MAX) {
            active.push(`price`);
          }
          trackEmptyStateShown({ activeFilters: active });
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        // Per spec: keep previous results visible behind the error banner.
        setError("Couldn't load stays. Tap to retry.");
      } finally {
        clearTimeout(slowTimer);
        clearTimeout(timeoutTimer);
        if (isAppending) setPaginating(false);
        else setLoading(false);
      }
    }, FETCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(debounce);
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hydrated,
    city,
    checkIn,
    checkOut,
    guests,
    stars,
    JSON.stringify(perks),
    sort,
    priceMin,
    priceMax,
    page,
    retryToken,
  ]);

  // ── Sheet TEMP state ────────────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tStars, setTStars] = useState<number>(0);
  const [tPerks, setTPerks] = useState<PerkLabel[]>([]);
  const [tSort, setTSort] = useState<SortKey>("recommended");
  const [tPriceMin, setTPriceMin] = useState<number>(PRICE_DEFAULT_MIN);
  const [tPriceMax, setTPriceMax] = useState<number>(PRICE_DEFAULT_MAX);

  function openSheet() {
    setTStars(stars);
    setTPerks(perks);
    setTSort(sort);
    setTPriceMin(priceMin);
    setTPriceMax(priceMax);
    setSheetOpen(true);
  }
  function closeSheet() {
    // Discards temp state per spec.
    setSheetOpen(false);
  }
  function applySheet() {
    if (sort !== tSort) trackSortChanged({ from: sort, to: tSort });
    if (stars !== tStars) {
      trackFilterApplied({ filterType: "stars", filterValue: tStars, resultsCount: total });
    }
    if (JSON.stringify(perks) !== JSON.stringify(tPerks)) {
      trackFilterApplied({
        filterType: "perks",
        filterValue: tPerks.join(","),
        resultsCount: total,
      });
    }
    if (priceMin !== tPriceMin || priceMax !== tPriceMax) {
      trackFilterApplied({
        filterType: "price",
        filterValue: `${tPriceMin}-${tPriceMax}`,
        resultsCount: total,
      });
    }
    setStars(tStars);
    setPerks(tPerks);
    setSort(tSort);
    setPriceMin(tPriceMin);
    setPriceMax(tPriceMax);
    setSheetOpen(false);
  }
  function clearSheetTemp() {
    setTStars(0);
    setTPerks([]);
    setTSort("recommended");
    setTPriceMin(PRICE_DEFAULT_MIN);
    setTPriceMax(PRICE_DEFAULT_MAX);
  }

  function toggleTempPerk(p: PerkLabel) {
    setTPerks((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  // ── Direct-to-applied actions (no temp) ─────────────────────────────────
  function applyStarsDirect(value: number) {
    if (value === stars) return;
    setStars(value);
    trackFilterApplied({ filterType: "stars", filterValue: value, resultsCount: total });
  }
  function applySortDirect(value: SortKey) {
    if (value === sort) return;
    trackSortChanged({ from: sort, to: value });
    setSort(value);
  }
  function removePerkDirect(p: PerkLabel) {
    setPerks((prev) => prev.filter((x) => x !== p));
    trackFilterCleared({ whichFilter: "perks" });
  }
  function clearAllApplied() {
    setStars(0);
    setPerks([]);
    setSort("recommended");
    setPriceMin(PRICE_DEFAULT_MIN);
    setPriceMax(PRICE_DEFAULT_MAX);
    trackFilterCleared({ whichFilter: "all" });
  }

  // ── Derived ─────────────────────────────────────────────────────────────
  const priceChanged =
    priceMin !== PRICE_DEFAULT_MIN || priceMax !== PRICE_DEFAULT_MAX;
  const activeCount =
    (stars > 0 ? 1 : 0) + perks.length + (priceChanged ? 1 : 0);
  const filtersActive = activeCount > 0;

  const tempPriceChanged =
    tPriceMin !== PRICE_DEFAULT_MIN || tPriceMax !== PRICE_DEFAULT_MAX;
  const tempActiveCount =
    (tStars > 0 ? 1 : 0) + tPerks.length + (tempPriceChanged ? 1 : 0);

  // Filter summary text below chips.
  const summaryParts: string[] = [];
  if (stars > 0) summaryParts.push(stars === 5 ? "5★" : `${stars}+★`);
  for (const p of perks) summaryParts.push(p);
  if (priceChanged) summaryParts.push(`${formatINR(priceMin)}–${formatINR(priceMax)}`);

  const retry = useCallback(() => {
    setError(null);
    setRetryToken((n) => n + 1);
  }, []);

  return (
    <div
      className="luxe"
      style={{
        background: "#0a0a0a",
        minHeight: "100vh",
        color: "#fff",
        fontFamily: FONT_LABEL,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <GlobalStyles />

      <div
        style={{
          maxWidth: 430,
          margin: "0 auto",
          paddingBottom: 60,
          position: "relative",
        }}
      >
        <TopNav />

        <SearchBarPill
          city={city}
          guests={guests}
          checkIn={checkIn}
          checkOut={checkOut}
        />

        <ResultsMetaRow
          total={total}
          shown={hotels.length}
          loading={loading && isInitialLoad}
        />

        <FilterBar
          stars={stars}
          perks={perks}
          sort={sort}
          activeCount={activeCount}
          summaryParts={summaryParts}
          onStarsChange={applyStarsDirect}
          onSortChange={applySortDirect}
          onOpenSheet={openSheet}
          onClearAll={clearAllApplied}
          onRemovePerk={removePerkDirect}
          filtersActive={filtersActive}
        />

        <ResultsList
          hotels={hotels}
          loading={loading}
          isInitialLoad={isInitialLoad}
          paginating={paginating}
          error={error}
          slow={slow}
          totalPages={totalPages}
          page={page}
          activeCount={activeCount}
          onLoadMore={() => setPage((p) => p + 1)}
          onClearAll={clearAllApplied}
          onRetry={retry}
        />
      </div>

      {sheetOpen && (
        <FilterSheet
          tStars={tStars}
          tPerks={tPerks}
          tSort={tSort}
          tPriceMin={tPriceMin}
          tPriceMax={tPriceMax}
          activeCount={tempActiveCount}
          facets={facets}
          onChangeStars={setTStars}
          onTogglePerk={toggleTempPerk}
          onChangeSort={setTSort}
          onChangePriceMin={setTPriceMin}
          onChangePriceMax={setTPriceMax}
          onClear={clearSheetTemp}
          onClose={closeSheet}
          onApply={applySheet}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Global animation/shimmer styles
// ---------------------------------------------------------------------------
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,500&family=Montserrat:wght@400;500;600;700&display=swap');
      .vf-scroll-x::-webkit-scrollbar { display: none; }
      .vf-sheet-scroll::-webkit-scrollbar { width: 0; }
      @keyframes vf-fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes vf-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
      @keyframes vf-shimmer {
        0% { background-position: -400px 0; }
        100% { background-position: 400px 0; }
      }
      @keyframes vf-spin { to { transform: rotate(360deg); } }
      .vf-shimmer {
        background: linear-gradient(90deg, #1a1a1a 25%, #252525 50%, #1a1a1a 75%);
        background-size: 800px 100%;
        animation: vf-shimmer 1.5s linear infinite;
      }
      .vf-spinner {
        width: 28px; height: 28px; border-radius: 50%;
        border: 2px solid rgba(201,169,110,0.2);
        border-top-color: ${GOLD};
        animation: vf-spin 0.7s linear infinite;
      }
      .vf-spinner-sm {
        width: 16px; height: 16px; border-radius: 50%;
        border: 2px solid rgba(201,169,110,0.2);
        border-top-color: ${GOLD};
        animation: vf-spin 0.7s linear infinite;
      }
      .vf-range {
        -webkit-appearance: none; appearance: none;
        width: 100%; height: 24px; background: transparent; pointer-events: none;
        position: absolute; left: 0; top: 0;
      }
      .vf-range::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 18px; height: 18px; border-radius: 50%;
        background: ${GOLD};
        border: 2px solid #0a0a0a;
        cursor: pointer; pointer-events: auto;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      }
      .vf-range::-moz-range-thumb {
        width: 18px; height: 18px; border-radius: 50%;
        background: ${GOLD};
        border: 2px solid #0a0a0a;
        cursor: pointer; pointer-events: auto;
      }
      .vf-range::-webkit-slider-runnable-track { background: transparent; }
      .vf-range::-moz-range-track { background: transparent; }
    `}</style>
  );
}

// ---------------------------------------------------------------------------
// Top nav (unchanged)
// ---------------------------------------------------------------------------
function TopNav() {
  return (
    <div
      style={{
        padding: "18px 20px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <button
        aria-label="Back"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          color: "rgba(255,255,255,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        ←
      </button>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontFamily: FONT_LABEL,
            fontWeight: 700,
            color: "#fff",
            fontSize: 14,
            letterSpacing: 2,
          }}
        >
          VOYAGR
        </span>
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            color: GOLD,
            fontSize: 16,
          }}
        >
          Club
        </span>
      </div>
      <div style={{ width: 36 }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search bar pill
// ---------------------------------------------------------------------------
function SearchBarPill({
  city,
  guests,
  checkIn,
  checkOut,
}: {
  city: string;
  guests: number;
  checkIn: string;
  checkOut: string;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "#0a0a0a",
        padding: "8px 20px 14px",
      }}
    >
      <button
        style={{
          width: "100%",
          background: GOLD,
          borderRadius: 100,
          padding: "13px 20px",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontFamily: FONT_LABEL,
            fontSize: 13,
            fontWeight: 500,
            color: "#000",
          }}
        >
          {city} · {guests} guest{guests !== 1 ? "s" : ""} · {formatDateRange(checkIn, checkOut)}
        </span>
        <span style={{ color: "#000", fontSize: 16, fontWeight: 600 }}>→</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results meta row
// ---------------------------------------------------------------------------
function ResultsMetaRow({
  total,
  shown,
  loading,
}: {
  total: number;
  shown: number;
  loading: boolean;
}) {
  return (
    <div
      style={{
        padding: "18px 20px 12px",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 22,
          fontWeight: 300,
          color: "#fff",
          lineHeight: 1.1,
        }}
      >
        <span style={{ fontStyle: "italic", color: GOLD }}>
          {loading ? "—" : total.toLocaleString("en-IN")}
        </span>{" "}
        <span style={{ fontStyle: "normal" }}>hotels found</span>
      </div>
      <div
        style={{
          fontFamily: FONT_LABEL,
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
          whiteSpace: "nowrap",
        }}
      >
        showing {shown} of {total.toLocaleString("en-IN")}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter bar (3 rows)
// ---------------------------------------------------------------------------
function FilterBar({
  stars,
  perks,
  sort,
  activeCount,
  summaryParts,
  onStarsChange,
  onSortChange,
  onOpenSheet,
  onClearAll,
  onRemovePerk,
  filtersActive,
}: {
  stars: number;
  perks: PerkLabel[];
  sort: SortKey;
  activeCount: number;
  summaryParts: string[];
  onStarsChange: (v: number) => void;
  onSortChange: (v: SortKey) => void;
  onOpenSheet: () => void;
  onClearAll: () => void;
  onRemovePerk: (p: PerkLabel) => void;
  filtersActive: boolean;
}) {
  return (
    <div
      style={{
        padding: "0 20px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Row 1: Sort + Filters + Clear */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <SortPill sort={sort} onChange={onSortChange} />

        <button
          onClick={onOpenSheet}
          style={{
            flexShrink: 0,
            border: filtersActive
              ? `1px solid ${GOLD}`
              : "1px solid rgba(255,255,255,0.12)",
            background: filtersActive
              ? "rgba(201,169,110,0.08)"
              : "rgba(255,255,255,0.04)",
            borderRadius: 100,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontFamily: FONT_LABEL,
            color: filtersActive ? GOLD : "rgba(255,255,255,0.7)",
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Filters
          </span>
          {activeCount > 0 && (
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: GOLD,
                color: "#0a0a0a",
                fontSize: 9,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_LABEL,
              }}
            >
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            onClick={onClearAll}
            style={{
              background: "none",
              border: "none",
              color: GOLD,
              fontFamily: FONT_LABEL,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
              cursor: "pointer",
              padding: "8px 4px",
              flexShrink: 0,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Row 2: Stars pills */}
      <div
        className="vf-scroll-x"
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <span
          style={{
            fontFamily: FONT_LABEL,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: 2,
            color: "rgba(255,255,255,0.3)",
            flexShrink: 0,
            textTransform: "uppercase",
          }}
        >
          STARS
        </span>
        {STAR_PILLS.map((opt) => {
          const active = stars === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onStarsChange(opt.value)}
              style={{
                flexShrink: 0,
                padding: "6px 14px",
                borderRadius: 100,
                border: active
                  ? `1px solid ${GOLD}`
                  : "1px solid rgba(255,255,255,0.1)",
                background: active ? GOLD : "rgba(255,255,255,0.03)",
                color: active ? "#0a0a0a" : "rgba(255,255,255,0.55)",
                fontFamily: FONT_LABEL,
                fontSize: 10,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Row 3: Active perk chips */}
      {perks.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {perks.map((p) => (
            <span
              key={p}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 8px 6px 12px",
                background: "rgba(201,169,110,0.1)",
                border: "1px solid rgba(201,169,110,0.3)",
                borderRadius: 100,
                color: GOLD,
                fontFamily: FONT_LABEL,
                fontSize: 10,
                fontWeight: 500,
              }}
            >
              {p}
              <button
                onClick={() => onRemovePerk(p)}
                aria-label={`Remove ${p} filter`}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(201,169,110,0.18)",
                  color: GOLD,
                  fontSize: 11,
                  lineHeight: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Filter summary line */}
      {summaryParts.length > 0 && (
        <div
          style={{
            fontFamily: FONT_LABEL,
            fontSize: 9,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          Filtered: {summaryParts.join(" · ")}
        </div>
      )}
    </div>
  );
}

function SortPill({
  sort,
  onChange,
}: {
  sort: SortKey;
  onChange: (v: SortKey) => void;
}) {
  return (
    <label
      style={{
        flex: 1,
        position: "relative",
        display: "flex",
        alignItems: "center",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 100,
        padding: "8px 14px",
        cursor: "pointer",
        fontFamily: FONT_LABEL,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: "rgba(255,255,255,0.7)",
          flex: 1,
        }}
      >
        ↕ {SORT_LABELS[sort]}
      </span>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>▾</span>
      <select
        aria-label="Sort by"
        value={sort}
        onChange={(e) => onChange(e.target.value as SortKey)}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          cursor: "pointer",
        }}
      >
        {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
          <option key={k} value={k}>
            {SORT_LABELS[k]}
          </option>
        ))}
      </select>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Results list — handles loading/error/empty/pagination
// ---------------------------------------------------------------------------
function ResultsList({
  hotels,
  loading,
  isInitialLoad,
  paginating,
  error,
  slow,
  totalPages,
  page,
  activeCount,
  onLoadMore,
  onClearAll,
  onRetry,
}: {
  hotels: SearchHotel[];
  loading: boolean;
  isInitialLoad: boolean;
  paginating: boolean;
  error: string | null;
  slow: boolean;
  totalPages: number;
  page: number;
  activeCount: number;
  onLoadMore: () => void;
  onClearAll: () => void;
  onRetry: () => void;
}) {
  // Initial load — full-screen gold spinner with no list yet.
  if (loading && isInitialLoad) {
    return (
      <div
        style={{
          minHeight: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: 32,
        }}
      >
        <div className="vf-spinner" />
        {slow && (
          <div
            style={{
              fontFamily: FONT_LABEL,
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Taking longer than usual…
          </div>
        )}
      </div>
    );
  }

  // Empty state (zero results, not loading, no error)
  if (!loading && !error && hotels.length === 0) {
    return (
      <div
        style={{
          margin: "40px 20px",
          padding: "32px 20px",
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          background: "#111",
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 26,
            fontStyle: "italic",
            fontWeight: 300,
            color: "#fff",
            marginBottom: 6,
          }}
        >
          No stays match these filters
        </div>
        <div
          style={{
            fontFamily: FONT_LABEL,
            fontSize: 11,
            color: "rgba(255,255,255,0.45)",
            marginBottom: 18,
          }}
        >
          Try adjusting your stars or removing a perk filter.
        </div>
        {activeCount > 0 && (
          <button
            onClick={onClearAll}
            style={{
              background: "transparent",
              border: `1px solid ${GOLD}`,
              color: GOLD,
              fontFamily: FONT_LABEL,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              borderRadius: 100,
              padding: "10px 24px",
              cursor: "pointer",
            }}
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Filter refetch overlay — dims list to 0.4, never blanks */}
      {loading && !isInitialLoad && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            pointerEvents: "none",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 32,
          }}
        >
          <div className="vf-spinner-sm" />
        </div>
      )}

      {/* Error banner — keeps previous results visible behind */}
      {error && (
        <div
          style={{
            margin: "16px 20px 0",
            padding: "12px 16px",
            border: `1px solid ${GOLD}`,
            borderRadius: 14,
            background: "rgba(201,169,110,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: FONT_LABEL,
              fontSize: 11,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {error}
          </div>
          <button
            onClick={onRetry}
            style={{
              background: GOLD,
              color: "#0a0a0a",
              border: "none",
              padding: "8px 16px",
              borderRadius: 100,
              fontFamily: FONT_LABEL,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div
        style={{
          opacity: loading && !isInitialLoad ? 0.4 : 1,
          transition: "opacity 0.18s ease",
        }}
      >
        {hotels.map((h, i) => (
          <HotelResultCard key={h.id} hotel={h} position={i + 1} />
        ))}
      </div>

      {/* Load more / pagination */}
      {hotels.length > 0 && page < totalPages && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "24px 20px 32px",
          }}
        >
          {paginating ? (
            <div className="vf-spinner-sm" />
          ) : (
            <button
              onClick={onLoadMore}
              style={{
                background: "transparent",
                border: `1px solid ${GOLD}`,
                color: GOLD,
                fontFamily: FONT_LABEL,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                borderRadius: 100,
                padding: "12px 32px",
                cursor: "pointer",
              }}
            >
              Load more
            </button>
          )}
        </div>
      )}

      {slow && loading && !isInitialLoad && (
        <div
          style={{
            textAlign: "center",
            padding: "8px 20px",
            fontFamily: FONT_LABEL,
            fontSize: 10,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          Taking longer than usual…
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hotel result card with shimmer placeholder + initial-letter image fallback
// ---------------------------------------------------------------------------
function HotelResultCard({
  hotel,
  position,
}: {
  hotel: SearchHotel;
  position: number;
}) {
  const { nights } = useBookingContext();
  const memberPrice = hotel.memberRate;
  const originalPrice = hotel.originalRate;

  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">("loading");

  function handleClick() {
    trackResultClicked({ hotelId: hotel.id, position });
  }

  return (
    <article
      onClick={handleClick}
      style={{
        margin: "16px 20px 0",
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#111",
        cursor: "pointer",
      }}
    >
      <div style={{ position: "relative", height: 200, background: "#1a1a1a" }}>
        {imgState === "loading" && (
          <div
            className="vf-shimmer"
            style={{ position: "absolute", inset: 0 }}
            aria-hidden
          />
        )}
        {imgState === "error" ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#1a1a1a",
              color: "rgba(255,255,255,0.1)",
              fontFamily: FONT_DISPLAY,
              fontSize: 56,
              fontStyle: "italic",
            }}
            aria-hidden
          >
            {hotel.name.charAt(0)}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hotel.image}
            alt={hotel.name}
            loading="lazy"
            onLoad={() => setImgState("loaded")}
            onError={() => setImgState("error")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              opacity: imgState === "loaded" ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />
        )}
        <span
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            padding: "5px 12px",
            background: "rgba(201,169,110,0.92)",
            color: "#0a0a0a",
            fontFamily: FONT_LABEL,
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            borderRadius: 100,
          }}
        >
          Member · 20% off
        </span>
      </div>

      <div style={{ padding: "14px 16px" }}>
        <div
          style={{
            color: GOLD,
            fontSize: 11,
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          {"★".repeat(hotel.stars)}
        </div>
        <h3
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 22,
            fontStyle: "italic",
            fontWeight: 300,
            color: "#fff",
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {hotel.name}
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 6,
            color: "rgba(255,255,255,0.38)",
            fontFamily: FONT_LABEL,
            fontSize: 10,
          }}
        >
          <span aria-hidden>📍</span>
          <span>{hotel.location}</span>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <MetaPill>{hotel.rating.toFixed(1)} ★</MetaPill>
          {hotel.perks.slice(0, 2).map((p) => (
            <MetaPill key={p}>{p}</MetaPill>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <PriceBlock
            memberRate={memberPrice}
            originalRate={originalPrice}
            nights={nights}
            currency="INR"
            size="large"
          />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          style={{
            flexShrink: 0,
            background: "transparent",
            border: `1px solid ${GOLD}`,
            color: GOLD,
            fontFamily: FONT_LABEL,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            borderRadius: 100,
            padding: "10px 14px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          View rates →
        </button>
      </div>
    </article>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        padding: "4px 10px",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 100,
        color: "rgba(255,255,255,0.55)",
        fontFamily: FONT_LABEL,
        fontSize: 9,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Filter bottom sheet
// ---------------------------------------------------------------------------
function FilterSheet({
  tStars,
  tPerks,
  tSort,
  tPriceMin,
  tPriceMax,
  activeCount,
  facets,
  onChangeStars,
  onTogglePerk,
  onChangeSort,
  onChangePriceMin,
  onChangePriceMax,
  onClear,
  onClose,
  onApply,
}: {
  tStars: number;
  tPerks: PerkLabel[];
  tSort: SortKey;
  tPriceMin: number;
  tPriceMax: number;
  activeCount: number;
  facets: SearchFacets | null;
  onChangeStars: (v: number) => void;
  onTogglePerk: (p: PerkLabel) => void;
  onChangeSort: (v: SortKey) => void;
  onChangePriceMin: (v: number) => void;
  onChangePriceMax: (v: number) => void;
  onClear: () => void;
  onClose: () => void;
  onApply: () => void;
}) {
  const sliderMin = facets?.priceRange.min ?? PRICE_DEFAULT_MIN;
  const sliderMax = facets?.priceRange.max ?? PRICE_DEFAULT_MAX;

  return (
    <div role="dialog" aria-modal="true" aria-label="Filter stays" style={{ position: "fixed", inset: 0, zIndex: 50 }}>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
          animation: "vf-fade-in 0.25s ease",
          zIndex: 50,
        }}
      />
      <div
        className="vf-sheet-scroll"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 0,
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 430,
          background: "#141414",
          borderRadius: "24px 24px 0 0",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          zIndex: 51,
          animation: "vf-slide-up 0.4s cubic-bezier(0.25,0.46,0.45,0.94) both",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: "rgba(255,255,255,0.14)",
            borderRadius: 2,
            margin: "10px auto 0",
            flexShrink: 0,
          }}
        />

        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 24,
              fontWeight: 300,
              color: "#fff",
            }}
          >
            Filter stays
          </div>
          <button
            onClick={onClear}
            style={{
              background: "none",
              border: "none",
              color: GOLD,
              fontFamily: FONT_LABEL,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Clear all
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          <SheetSection label="Star rating">
            <PillGrid>
              {STAR_PILLS.map((opt) => {
                const active = tStars === opt.value;
                const count = facets?.stars[String(opt.value)];
                const showCount =
                  opt.value > 0 && count !== undefined && count >= 0;
                return (
                  <SheetPill
                    key={opt.value}
                    active={active}
                    onClick={() => onChangeStars(opt.value)}
                  >
                    {opt.label}
                    {showCount && (
                      <span style={{ opacity: 0.6, marginLeft: 6 }}>
                        ({count})
                      </span>
                    )}
                  </SheetPill>
                );
              })}
            </PillGrid>
          </SheetSection>

          <SectionDivider />

          <SheetSection label="Price per night">
            <DualPriceSlider
              min={sliderMin}
              max={sliderMax}
              valueMin={tPriceMin}
              valueMax={tPriceMax}
              onChangeMin={onChangePriceMin}
              onChangeMax={onChangePriceMax}
            />
          </SheetSection>

          <SectionDivider />

          <SheetSection label="Perks & amenities">
            <PillGrid>
              {PERK_OPTIONS.map((p) => {
                const active = tPerks.includes(p);
                const count = facets?.perks[p];
                const disabled = !active && count === 0;
                return (
                  <SheetPill
                    key={p}
                    active={active}
                    onClick={() => !disabled && onTogglePerk(p)}
                    disabled={disabled}
                  >
                    {p}
                    {count !== undefined && (
                      <span style={{ opacity: 0.6, marginLeft: 6 }}>
                        ({count})
                      </span>
                    )}
                  </SheetPill>
                );
              })}
            </PillGrid>
          </SheetSection>

          <SectionDivider />

          <SheetSection label="Sort by">
            <PillGrid>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <SheetPill
                  key={key}
                  active={tSort === key}
                  onClick={() => onChangeSort(key)}
                >
                  {SORT_LABELS[key]}
                </SheetPill>
              ))}
            </PillGrid>
          </SheetSection>

          <div style={{ height: 24 }} />
        </div>

        {/* Sticky footer */}
        <div
          style={{
            padding: "14px 22px 22px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "#141414",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: FONT_LABEL,
              fontSize: 10,
              color: "rgba(255,255,255,0.55)",
              flexShrink: 0,
            }}
          >
            {activeCount} {activeCount === 1 ? "filter" : "filters"} active
          </div>
          <button
            onClick={onApply}
            style={{
              flex: 1,
              background: GOLD,
              color: "#0a0a0a",
              fontFamily: FONT_LABEL,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              borderRadius: 100,
              padding: 14,
              border: "none",
              cursor: "pointer",
            }}
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dual native range slider (price)
// ---------------------------------------------------------------------------
function DualPriceSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
}: {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
}) {
  // Clamp slider bounds to a sensible default if facets give weird numbers.
  const lo = Math.min(min, valueMin);
  const hi = Math.max(max, valueMax);
  const safeMin = Math.max(lo, 0);
  const safeMax = Math.max(hi, safeMin + PRICE_STEP);
  const span = safeMax - safeMin;
  const minPct = ((valueMin - safeMin) / span) * 100;
  const maxPct = ((valueMax - safeMin) / span) * 100;

  const handleMin = (v: number) => {
    // Stop min from crossing max — leave at least one step gap.
    if (v >= valueMax - PRICE_STEP) v = valueMax - PRICE_STEP;
    if (v < safeMin) v = safeMin;
    onChangeMin(v);
  };
  const handleMax = (v: number) => {
    if (v <= valueMin + PRICE_STEP) v = valueMin + PRICE_STEP;
    if (v > safeMax) v = safeMax;
    onChangeMax(v);
  };

  return (
    <div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 22,
          fontWeight: 300,
          color: "#fff",
          marginBottom: 14,
        }}
      >
        {formatINR(valueMin)} – {formatINR(valueMax)}
      </div>

      <div style={{ position: "relative", height: 24, marginBottom: 4 }}>
        {/* Track */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 11,
            height: 2,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 1,
          }}
        />
        {/* Selected range */}
        <div
          style={{
            position: "absolute",
            top: 11,
            height: 2,
            left: `${minPct}%`,
            right: `${100 - maxPct}%`,
            background: GOLD,
            borderRadius: 1,
          }}
        />

        <input
          className="vf-range"
          aria-label="Minimum price"
          type="range"
          min={safeMin}
          max={safeMax}
          step={PRICE_STEP}
          value={valueMin}
          onChange={(e) => handleMin(Number(e.target.value))}
          style={
            {
              accentColor: GOLD,
              zIndex: valueMin > safeMax - PRICE_STEP * 2 ? 4 : 3,
            } as CSSProperties
          }
        />
        <input
          className="vf-range"
          aria-label="Maximum price"
          type="range"
          min={safeMin}
          max={safeMax}
          step={PRICE_STEP}
          value={valueMax}
          onChange={(e) => handleMax(Number(e.target.value))}
          style={{ accentColor: GOLD, zIndex: 4 } as CSSProperties}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: FONT_LABEL,
          fontSize: 9,
          color: "rgba(255,255,255,0.35)",
          marginTop: 6,
        }}
      >
        <span>{formatINR(safeMin)}</span>
        <span>{formatINR(safeMax)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sheet primitives
// ---------------------------------------------------------------------------
function SheetSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ padding: "20px 22px 4px" }}>
      <div
        style={{
          fontFamily: FONT_LABEL,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.35)",
          marginBottom: 14,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function SectionDivider() {
  return (
    <div
      style={{
        height: 1,
        background: "rgba(255,255,255,0.06)",
        margin: "10px 22px 0",
      }}
    />
  );
}

function PillGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
  );
}

function SheetPill({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "9px 18px",
        borderRadius: 100,
        border: active
          ? `1px solid ${GOLD}`
          : "1px solid rgba(255,255,255,0.1)",
        background: active
          ? "rgba(201,169,110,0.12)"
          : "rgba(255,255,255,0.03)",
        color: active ? GOLD : disabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.55)",
        fontFamily: FONT_LABEL,
        fontSize: 11,
        fontWeight: active ? 600 : 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "all 0.2s ease",
      }}
    >
      {children}
    </button>
  );
}
