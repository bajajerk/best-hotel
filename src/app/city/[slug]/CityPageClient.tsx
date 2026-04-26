"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  fetchCityCurations,
  fetchBatchRates,
  defaultBookingDates,
  CuratedHotel,
} from "@/lib/api";
import type { BatchRatesResponse } from "@/lib/api";
import { rankHotels, sortRankedHotels, type SortStrategy } from "@/lib/ranking";
import { useBooking } from "@/context/BookingContext";
import Header from "@/components/Header";
import { trackCityViewed } from "@/lib/analytics";
import Breadcrumbs from "@/components/Breadcrumbs";
import DateBar from "@/components/DateBar";
import GuestRoomPicker from "@/components/GuestRoomPicker";
import HotelResultCard from "@/components/HotelResultCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Category = "singles" | "couples" | "families";

// ---------------------------------------------------------------------------
// CSS Variables — Voyagr Light Theme
// ---------------------------------------------------------------------------
const cssVars: Record<string, string> = {
  "--cream": "#f5f0e8",
  "--cream-deep": "#ede7d9",
  "--cream-border": "#ddd5c3",
  "--ink": "#1a1710",
  "--ink-mid": "#3d3929",
  "--ink-light": "#7a7465",
  "--gold": "#C9A84C",
  "--gold-light": "#D9BC72",
  "--gold-pale": "#F2EBDA",
  "--white": "#fdfaf5",
  "--success": "#4a7c59",
  "--navy": "#0B1B2B",
  "--serif": "'Cormorant Garamond', Georgia, serif",
  "--sans": "'DM Sans', sans-serif",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(amount: number, currency?: string | null): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "\u20AC", GBP: "\u00A3", INR: "\u20B9",
    JPY: "\u00A5", AUD: "A$", SGD: "S$", THB: "\u0E3F",
    AED: "AED ", MYR: "RM ", IDR: "Rp ", KRW: "\u20A9",
  };
  const sym = currency ? (symbols[currency.toUpperCase()] || `${currency} `) : "$";
  const rounded = Math.round(amount);
  const formatted =
    currency?.toUpperCase() === "INR"
      ? rounded.toLocaleString("en-IN")
      : rounded.toLocaleString("en-US");
  return `${sym}${formatted}`;
}

function slugToName(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDateLabel(iso: string, fallback: string): string {
  if (!iso) return fallback;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ---------------------------------------------------------------------------
// Skeleton — Card shimmer
// ---------------------------------------------------------------------------
function CardSkeletonMobile() {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        overflow: "hidden",
      }}
    >
      <div className="shimmer" style={{ height: 200, width: "100%" }} />
      <div style={{ padding: 16 }}>
        <div className="shimmer" style={{ height: 18, width: "70%", marginBottom: 8 }} />
        <div className="shimmer" style={{ height: 12, width: "40%", marginBottom: 16 }} />
        <div className="shimmer" style={{ height: 28, width: "50%" }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search Summary Bar — tappable, shows destination + dates + guests
// ---------------------------------------------------------------------------
function SearchSummaryBar({
  destination,
  onOpen,
  onBack,
}: {
  destination: string;
  onOpen: () => void;
  onBack: () => void;
}) {
  const { checkIn, checkOut, rooms, totalGuests } = useBooking();

  const datesLabel =
    checkIn && checkOut
      ? `${formatDateLabel(checkIn, "")} – ${formatDateLabel(checkOut, "")}`
      : "Add dates";
  const guestsLabel = `${rooms.length} Room${rooms.length > 1 ? "s" : ""}, ${totalGuests} Guest${totalGuests !== 1 ? "s" : ""}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        borderRadius: 14,
        padding: "10px 14px",
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--gold)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--cream-border)";
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onBack(); }}
        aria-label="Go back"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 10,
          border: "none",
          background: "transparent",
          color: "var(--ink)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3L5 8L10 13" />
        </svg>
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--ink)",
            fontFamily: "var(--font-body)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {destination}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-light)",
            fontFamily: "var(--font-body)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {datesLabel} · {guestsLabel}
        </div>
      </div>

      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 10,
          color: "var(--gold)",
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search Edit Modal — bottom sheet with destination, dates, guests
// ---------------------------------------------------------------------------
function SearchEditModal({
  open,
  onClose,
  defaultDestination,
}: {
  open: boolean;
  onClose: () => void;
  defaultDestination: string;
}) {
  const router = useRouter();
  const [destInput, setDestInput] = useState(defaultDestination);

  useEffect(() => {
    if (open) setDestInput(defaultDestination);
  }, [open, defaultDestination]);

  if (!open) return null;

  const handleApply = () => {
    const trimmed = destInput.trim();
    const currentSlug = defaultDestination.toLowerCase();
    const newSlug = trimmed.toLowerCase().replace(/\s+/g, "-");
    if (trimmed && newSlug !== currentSlug) {
      router.push(`/city/${newSlug}`);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(26,23,16,0.45)",
          zIndex: 1200,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <motion.div
          key="sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--white)",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            width: "100%",
            maxWidth: 560,
            maxHeight: "88vh",
            overflowY: "auto",
            padding: "20px 20px 28px",
            boxShadow: "0 -10px 40px rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-light)",
                fontFamily: "var(--font-body)",
              }}
            >
              Edit search
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--ink-mid)",
                padding: 6,
                display: "inline-flex",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <label
            style={{
              display: "block",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-light)",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Destination
          </label>
          <input
            value={destInput}
            onChange={(e) => setDestInput(e.target.value)}
            placeholder="Where to?"
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1px solid var(--cream-border)",
              borderRadius: 10,
              fontSize: 14,
              fontFamily: "var(--font-body)",
              color: "var(--ink)",
              background: "var(--white)",
              marginBottom: 16,
              outline: "none",
            }}
          />

          <div style={{ marginBottom: 12 }}>
            <span
              style={{
                display: "block",
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-light)",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              When
            </span>
            <DateBar variant="light" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <span
              style={{
                display: "block",
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-light)",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Guests
            </span>
            <GuestRoomPicker variant="light" compact />
          </div>

          <button
            onClick={handleApply}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "var(--gold)",
              color: "var(--ink)",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "var(--font-body)",
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// FilterPill — reusable pill button for the filter row
// ---------------------------------------------------------------------------
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
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 16px",
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "0.04em",
        fontFamily: "var(--font-body)",
        border: `1px solid ${active ? "var(--gold)" : "var(--cream-border)"}`,
        borderRadius: 999,
        background: active ? "var(--gold-pale)" : "var(--white)",
        color: active ? "var(--gold)" : "var(--ink-mid)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.15s",
      }}
    >
      {label}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Floating Map Button
// ---------------------------------------------------------------------------
function FloatingMapButton({ destination }: { destination: string }) {
  const handleClick = () => {
    const q = encodeURIComponent(`${destination} hotels`);
    window.open(`https://www.google.com/maps/search/${q}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Open map view"
      style={{
        position: "fixed",
        bottom: 92,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--ink)",
        color: "var(--cream)",
        border: "none",
        borderRadius: 20,
        padding: "10px 20px",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.03em",
        fontFamily: "var(--font-body)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
        cursor: "pointer",
        zIndex: 900,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
      Map
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function CityPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { checkIn, checkOut, totalAdults, totalChildren } = useBooking();
  const [curations, setCurations] = useState<Record<Category, CuratedHotel[]>>({
    singles: [],
    couples: [],
    families: [],
  });
  const [cityName, setCityName] = useState("");
  const [cityCountry, setCityCountry] = useState("");
  const [tagline, setTagline] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [batchRates, setBatchRates] = useState<BatchRatesResponse | null>(null);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [filterMin, setFilterMin] = useState(0);
  const [filterMax, setFilterMax] = useState(0);
  const [sortBy, setSortBy] = useState<SortStrategy>("rating_desc");
  const [minStars, setMinStars] = useState<number>(0);

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);

  const citySortOptions: { label: string; value: SortStrategy }[] = [
    // "Saving: Highest" intentionally removed — savings curation now lives in
    // the admin tool. Default sort is now Rating: Highest.
    { label: "Rating: Highest", value: "rating_desc" },
    { label: "Recommended", value: "recommended" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
  ];

  useEffect(() => {
    fetchCityCurations(slug)
      .then((data) => {
        setCurations(data.curations as Record<Category, CuratedHotel[]>);
        setCityName(data.city.city_name);
        setCityCountry(data.city.country);
        setTagline(data.city.tagline);
        trackCityViewed({
          city_slug: slug,
          city_name: data.city.city_name,
          country: data.city.country,
          continent: data.city.continent || '',
        });
      })
      .catch((err) => {
        console.error("[Voyagr] Failed to load city curations:", err);
        setFetchError(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Batch-fetch live rates for all hotels on this city page. Unmatched IDs are
  // hidden from the list; matched IDs get their `rates_from` overridden.
  useEffect(() => {
    const all = [
      ...(curations.couples ?? []),
      ...(curations.singles ?? []),
      ...(curations.families ?? []),
    ];
    const ids = Array.from(new Set(all.map((h) => h.hotel_id))).filter(Boolean);
    if (ids.length === 0) return;

    const { checkin: defIn, checkout: defOut } = defaultBookingDates();
    const ci = checkIn || defIn;
    const co = checkOut || defOut;
    const adults = totalAdults > 0 ? totalAdults : 2;
    const children = totalChildren;

    let cancelled = false;
    fetchBatchRates(ids, ci, co, adults, children)
      .then((data) => {
        if (!cancelled) setBatchRates(data);
      })
      .catch((err) => {
        console.error("[Voyagr] Batch rates failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [curations, checkIn, checkOut, totalAdults, totalChildren]);

  useEffect(() => {
    const allHotels = [
      ...curations.couples,
      ...curations.singles,
      ...curations.families,
    ];
    const prices = allHotels
      .map((h) => h.rates_from)
      .filter((p): p is number => p !== null && p > 0);
    if (prices.length > 0) {
      const min = Math.floor(Math.min(...prices));
      const max = Math.ceil(Math.max(...prices));
      setPriceMin(min);
      setPriceMax(max);
      setFilterMin(min);
      setFilterMax(max);
    } else {
      setPriceMin(0);
      setPriceMax(0);
      setFilterMin(0);
      setFilterMax(0);
    }
  }, [curations]);

  // Close popovers on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
      if (priceRef.current && !priceRef.current.contains(e.target as Node)) {
        setPriceOpen(false);
      }
    }
    if (sortOpen || priceOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortOpen, priceOpen]);

  const rawAllHotels = Array.from(
    new Map(
      [...curations.couples, ...curations.singles, ...curations.families].map(
        (h) => [h.hotel_id, h]
      )
    ).values()
  );

  // When live batch rates are available, hide unmatched hotels and override the
  // stale curated `rates_from`/currency with live `from_price` / mrp currency.
  const allHotels: CuratedHotel[] = batchRates
    ? rawAllHotels
        .filter((h) => !batchRates.unmatched_ids.includes(h.hotel_id))
        .map((h) => {
          const rate = batchRates.results[String(h.hotel_id)];
          if (!rate) return h;
          return {
            ...h,
            rates_from: rate.from_price,
            rates_currency: rate.mrp?.currency || h.rates_currency || "INR",
          };
        })
        .filter((h) => batchRates.results[String(h.hotel_id)])
    : rawAllHotels;

  const rankedAll = rankHotels(allHotels);
  const rankedFiltered = rankedAll.filter((r) => {
    if (minStars > 0) {
      if (!r.hotel.star_rating || r.hotel.star_rating < minStars) return false;
    }
    if (priceMin === 0 && priceMax === 0) return true;
    if (!r.hotel.rates_from) return true;
    return r.hotel.rates_from >= filterMin && r.hotel.rates_from <= filterMax;
  });
  const sortedRanked = sortRankedHotels(rankedFiltered, sortBy);
  const hotels = sortedRanked.map((r) => r.hotel);

  const displayName = cityName || slugToName(slug);
  const isPriceFilterActive = priceMax > priceMin && (filterMin > priceMin || filterMax < priceMax);
  const isStarFilterActive = minStars > 0;
  const currency = allHotels.find((h) => h.rates_currency)?.rates_currency || null;

  const currentSortLabel = citySortOptions.find((o) => o.value === sortBy)?.label || "Rating: Highest";

  return (
    <div
      style={{
        ...cssVars,
        background: "var(--cream)",
        color: "var(--ink)",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        lineHeight: 1.6,
        minHeight: "100vh",
        overflowX: "hidden",
      } as React.CSSProperties}
    >
      <Header />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Destinations" },
          { label: displayName },
        ]}
      />

      {/* ════════ Search summary bar ════════ */}
      <div
        style={{
          paddingTop: 96,
          paddingLeft: 20,
          paddingRight: 20,
          background: "var(--white)",
          borderBottom: "1px solid var(--cream-border)",
        }}
        className="md:!px-[60px]"
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 16 }}>
          <SearchSummaryBar
            destination={displayName}
            onOpen={() => setSearchOpen(true)}
            onBack={() => router.back()}
          />
        </div>
      </div>

      {/* ================================================================
          CITY HERO — large italic serif name, tagline
          ================================================================ */}
      <header
        style={{
          paddingTop: 20,
          paddingBottom: 0,
          paddingLeft: 60,
          paddingRight: 60,
          background: "var(--white)",
          borderBottom: "1px solid var(--cream-border)",
        }}
        className="!px-5 md:!px-[60px]"
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 300,
                fontStyle: "italic",
                lineHeight: 1.1,
                color: "var(--ink)",
                marginBottom: 8,
              }}
            >
              {displayName}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {cityCountry && (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--ink-light)",
                    letterSpacing: "0.06em",
                    marginBottom: 4,
                  }}
                >
                  {cityCountry}
                </p>
              )}
              {tagline && (
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--ink-light)",
                    fontWeight: 300,
                    lineHeight: 1.7,
                    maxWidth: 480,
                  }}
                >
                  {tagline}
                </p>
              )}
              <p
                style={{
                  fontSize: 13,
                  color: "var(--ink-light)",
                  fontWeight: 400,
                  lineHeight: 1.6,
                  marginTop: 8,
                  maxWidth: 520,
                }}
              >
                <span style={{ color: "var(--gold)", fontWeight: 500 }}>Preferred rates</span>
                {" \u00B7 Voyagr Club members save on every stay."}
              </p>
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{
                width: 40,
                height: 1,
                background: "var(--gold)",
                marginTop: 24,
                transformOrigin: "left",
              }}
            />
          </motion.div>
        </div>
      </header>

      {/* ================================================================
          HOTEL LIST
          ================================================================ */}
      <section
        style={{
          padding: "20px 60px 120px",
          background: "var(--cream)",
        }}
        className="!px-4 md:!px-[60px]"
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Filter pill row */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "nowrap",
              overflowX: "auto",
              marginBottom: 14,
              paddingBottom: 4,
            }}
            className="city-pill-row"
          >
            <FilterPill
              label="Filter"
              active={isStarFilterActive}
              onClick={() => setFilterOpen(true)}
            />
            <div ref={sortRef} style={{ position: "relative" }}>
              <FilterPill
                label={currentSortLabel}
                active
                onClick={() => { setSortOpen((v) => !v); setPriceOpen(false); }}
              />
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      zIndex: 50,
                      background: "var(--white)",
                      border: "1px solid var(--cream-border)",
                      borderRadius: 12,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      minWidth: 220,
                      padding: 6,
                    }}
                  >
                    {citySortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                          padding: "9px 12px",
                          fontSize: 13,
                          fontFamily: "var(--font-body)",
                          color: sortBy === opt.value ? "var(--ink)" : "var(--ink-mid)",
                          fontWeight: sortBy === opt.value ? 500 : 400,
                          background: sortBy === opt.value ? "var(--gold-pale)" : "transparent",
                          border: "none",
                          borderRadius: 8,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: sortBy === opt.value ? "var(--gold)" : "transparent",
                            border: sortBy === opt.value ? "none" : "1px solid var(--cream-border)",
                            flexShrink: 0,
                          }}
                        />
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div ref={priceRef} style={{ position: "relative" }}>
              <FilterPill
                label={
                  isPriceFilterActive
                    ? `Price: ${formatCurrency(filterMin, currency)}–${formatCurrency(filterMax, currency)}`
                    : "Price"
                }
                active={isPriceFilterActive}
                onClick={() => { setPriceOpen((v) => !v); setSortOpen(false); }}
              />
              <AnimatePresence>
                {priceOpen && priceMax > priceMin && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      zIndex: 50,
                      background: "var(--white)",
                      border: "1px solid var(--cream-border)",
                      borderRadius: 12,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      width: 300,
                      padding: 18,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--ink-light)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        Price range
                      </span>
                      {isPriceFilterActive && (
                        <button
                          onClick={() => { setFilterMin(priceMin); setFilterMax(priceMax); }}
                          style={{ fontSize: 11, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500 }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--ink)" }}>
                        {formatCurrency(filterMin, currency)}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ink-light)" }}>—</span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--ink)" }}>
                        {formatCurrency(filterMax, currency)}
                      </span>
                    </div>
                    <div style={{ position: "relative", height: 32, marginBottom: 4 }}>
                      <div style={{ position: "absolute", top: 14, left: 0, right: 0, height: 4, background: "var(--cream-deep)", borderRadius: 2 }} />
                      <div
                        style={{
                          position: "absolute",
                          top: 14,
                          left: `${((filterMin - priceMin) / (priceMax - priceMin)) * 100}%`,
                          right: `${100 - ((filterMax - priceMin) / (priceMax - priceMin)) * 100}%`,
                          height: 4,
                          background: "var(--gold)",
                          borderRadius: 2,
                        }}
                      />
                      <input
                        type="range"
                        min={priceMin}
                        max={priceMax}
                        value={filterMin}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (v <= filterMax) setFilterMin(v);
                        }}
                        style={{
                          position: "absolute",
                          top: 4,
                          left: 0,
                          width: "100%",
                          height: 24,
                          WebkitAppearance: "none",
                          appearance: "none" as never,
                          background: "transparent",
                          pointerEvents: "none",
                          zIndex: 3,
                        }}
                        className="price-range-input"
                      />
                      <input
                        type="range"
                        min={priceMin}
                        max={priceMax}
                        value={filterMax}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (v >= filterMin) setFilterMax(v);
                        }}
                        style={{
                          position: "absolute",
                          top: 4,
                          left: 0,
                          width: "100%",
                          height: 24,
                          WebkitAppearance: "none",
                          appearance: "none" as never,
                          background: "transparent",
                          pointerEvents: "none",
                          zIndex: 4,
                        }}
                        className="price-range-input"
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: "var(--ink-light)" }}>{formatCurrency(priceMin, currency)}</span>
                      <span style={{ fontSize: 10, color: "var(--ink-light)" }}>{formatCurrency(priceMax, currency)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Result count */}
          {!loading && (
            <p
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-light)",
                marginBottom: 16,
              }}
            >
              {hotels.length} {hotels.length === 1 ? "hotel" : "hotels"} in {displayName}
            </p>
          )}

          {/* Hotel cards */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <CardSkeletonMobile key={i} />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="hotels"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {hotels.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {hotels.map((hotel, i) => {
                      const rate = batchRates?.results[String(hotel.hotel_id)];
                      return (
                        <HotelResultCard
                          key={hotel.hotel_id}
                          hotel={hotel}
                          index={i}
                          liveMrp={rate?.mrp ?? null}
                          liveSavingsPct={rate?.savings_pct ?? null}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ textAlign: "center", paddingTop: 60, paddingBottom: 60 }}
                  >
                    {isPriceFilterActive || isStarFilterActive ? (
                      <>
                        <p style={{ fontFamily: "var(--font-display)", fontSize: 24, fontStyle: "italic", fontWeight: 300, color: "var(--ink-mid)", marginBottom: 12 }}>
                          No matches
                        </p>
                        <p style={{ fontSize: 14, color: "var(--ink-light)", marginBottom: 20 }}>
                          Try widening your filters.
                        </p>
                        <button
                          onClick={() => { setFilterMin(priceMin); setFilterMax(priceMax); setMinStars(0); }}
                          style={{
                            background: "none",
                            border: "1px solid var(--cream-border)",
                            padding: "10px 24px",
                            fontSize: 12,
                            fontWeight: 500,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "var(--ink-mid)",
                            cursor: "pointer",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          Clear filters
                        </button>
                      </>
                    ) : fetchError ? (
                      <>
                        <p style={{ fontFamily: "var(--font-display)", fontSize: 24, fontStyle: "italic", fontWeight: 300, color: "var(--ink-mid)", marginBottom: 12 }}>
                          Unable to load hotels
                        </p>
                        <p style={{ fontSize: 14, color: "var(--ink-light)", marginBottom: 20 }}>
                          Something went wrong while loading stays for {displayName}. Please try again.
                        </p>
                        <button
                          onClick={() => window.location.reload()}
                          style={{
                            background: "none",
                            border: "1px solid var(--cream-border)",
                            padding: "10px 24px",
                            fontSize: 12,
                            fontWeight: 500,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "var(--ink-mid)",
                            cursor: "pointer",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          Try again
                        </button>
                      </>
                    ) : (
                      <>
                        <p style={{ fontFamily: "var(--font-display)", fontSize: 24, fontStyle: "italic", fontWeight: 300, color: "var(--ink-mid)", marginBottom: 12 }}>
                          Coming soon
                        </p>
                        <p style={{ fontSize: 14, color: "var(--ink-light)" }}>
                          We are preparing stays in {displayName}.
                        </p>
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* ════════ Filter bottom sheet ════════ */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            key="filter-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFilterOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(26,23,16,0.45)",
              zIndex: 1100,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--white)",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                width: "100%",
                maxWidth: 560,
                maxHeight: "80vh",
                overflowY: "auto",
                padding: "20px 20px 28px",
                boxShadow: "0 -10px 40px rgba(0,0,0,0.18)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--ink-light)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Filters
                </span>
                <button
                  onClick={() => setFilterOpen(false)}
                  aria-label="Close"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--ink-mid)",
                    padding: 6,
                    display: "inline-flex",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--ink-mid)",
                    fontFamily: "var(--font-body)",
                    marginBottom: 10,
                  }}
                >
                  Star rating
                </span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[0, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      onClick={() => setMinStars(stars)}
                      style={{
                        padding: "9px 14px",
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: "var(--font-body)",
                        border: `1px solid ${minStars === stars ? "var(--gold)" : "var(--cream-border)"}`,
                        borderRadius: 999,
                        background: minStars === stars ? "var(--gold-pale)" : "var(--white)",
                        color: minStars === stars ? "var(--gold)" : "var(--ink-mid)",
                        cursor: "pointer",
                      }}
                    >
                      {stars === 0 ? "Any" : `${stars}★ & up`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--ink-light)",
                    fontFamily: "var(--font-body)",
                    marginBottom: 6,
                  }}
                >
                  Amenities · Property type
                </span>
                <p style={{ fontSize: 12, color: "var(--ink-light)", fontFamily: "var(--font-body)" }}>
                  More filters coming soon.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setMinStars(0); setFilterMin(priceMin); setFilterMax(priceMax); }}
                  style={{
                    flex: 1,
                    padding: "13px 16px",
                    background: "var(--white)",
                    color: "var(--ink-mid)",
                    border: "1px solid var(--cream-border)",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
                <button
                  onClick={() => setFilterOpen(false)}
                  style={{
                    flex: 1,
                    padding: "13px 16px",
                    background: "var(--gold)",
                    color: "var(--ink)",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                  }}
                >
                  Show {hotels.length}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search edit modal */}
      <SearchEditModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        defaultDestination={displayName}
      />

      {/* Floating map button */}
      <FloatingMapButton destination={displayName} />

      {/* ================================================================
          CTA SECTION
          ================================================================ */}
      <section
        style={{
          padding: "80px 60px",
          background: "var(--ink)",
          color: "var(--cream)",
        }}
        className="!px-6 md:!px-[60px]"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          style={{
            maxWidth: 600,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <p
            className="type-eyebrow"
            style={{
              marginBottom: 16,
            }}
          >
            Ready to save?
          </p>
          <h3
            className="type-display-2"
            style={{
              fontStyle: "italic",
              color: "var(--cream)",
              marginBottom: 16,
            }}
          >
            Preferred rates for{" "}
            <em style={{ color: "var(--gold)" }}>{displayName}</em>
          </h3>
          <p
            style={{
              fontSize: 14,
              color: "rgba(245,240,232,0.6)",
              fontWeight: 300,
              lineHeight: 1.7,
              marginBottom: 36,
            }}
          >
            B2B rates. No markup. No hidden fees. Contact us and we will beat any publicly listed rate.
          </p>

          <div
            className="city-cta-buttons"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <a
              href="tel:+919876543210"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "var(--gold)",
                color: "var(--ink)",
                border: "none",
                padding: "12px 28px",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.25s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--cream)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--gold)";
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
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              Call Us
            </a>

            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "transparent",
                color: "var(--cream)",
                border: "1px solid rgba(245,240,232,0.3)",
                padding: "11px 28px",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.25s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--cream)";
                (e.currentTarget as HTMLElement).style.color = "var(--ink)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--cream)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--cream)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,240,232,0.3)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </motion.div>
      </section>

      {/* ================================================================
          EXPLORE OTHER CITIES
          ================================================================ */}
      <section
        style={{
          padding: "56px 60px",
          background: "var(--cream)",
          borderTop: "1px solid var(--cream-border)",
        }}
        className="!px-6 md:!px-[60px]"
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p
            className="type-eyebrow"
            style={{
              marginBottom: 8,
            }}
          >
            Explore
          </p>
          <h3
            className="type-display-2"
            style={{
              fontSize: "clamp(24px, 3vw, 36px)",
              color: "var(--ink)",
              marginBottom: 32,
            }}
          >
            Other <em style={{ fontStyle: "italic", color: "var(--gold)" }}>destinations</em>
          </h3>
          <div
            className="city-destination-pills"
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {[
              "bangkok", "tokyo", "paris", "london", "dubai", "bali",
              "singapore", "rome", "barcelona", "seoul", "maldives",
              "phuket", "new-york", "kyoto",
            ]
              .filter((s) => s !== slug)
              .slice(0, 10)
              .map((citySlug) => (
                <Link
                  key={citySlug}
                  href={`/city/${citySlug}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "10px 18px",
                    border: "1px solid var(--cream-border)",
                    fontSize: 13,
                    fontWeight: 400,
                    color: "var(--ink-mid)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: "var(--white)",
                    textDecoration: "none",
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--ink)";
                    (e.currentTarget as HTMLElement).style.color = "var(--cream)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--ink)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--white)";
                    (e.currentTarget as HTMLElement).style.color = "var(--ink-mid)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--cream-border)";
                  }}
                >
                  {slugToName(citySlug)}
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer
        style={{
          padding: "48px 60px",
          background: "var(--cream-deep)",
          borderTop: "1px solid var(--cream-border)",
        }}
        className="!px-6 md:!px-[60px]"
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <span
              className="type-logo"
              style={{
                letterSpacing: "0.08em",
                color: "var(--ink)",
              }}
            >
              <span style={{ color: "var(--gold)" }}>V</span>oyagr
            </span>
          </Link>
          <p
            style={{
              fontSize: 12,
              color: "var(--ink-light)",
              fontFamily: "var(--font-body)",
            }}
          >
            Preferred hotel rates for everyone.
          </p>
          <div
            style={{
              display: "flex",
              gap: 24,
            }}
          >
            {["Privacy", "Terms", "Contact"].map((label) => (
              <span
                key={label}
                style={{
                  fontSize: 11,
                  color: "var(--ink-light)",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.06em",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--gold)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--ink-light)";
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
