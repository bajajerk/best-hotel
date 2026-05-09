"use client";

// =============================================================================
//  /hotel/[id] — Voyagr Club hotel detail page (DARK LUXE EDITORIAL)
//
//  Visual language mirrors HomePageClient.tsx and CityPageClient.tsx — full-
//  bleed cinematic hero, champagne mono-caps eyebrow, italic Playfair display
//  headline, editorial overview, bento gallery, member-benefit chip strip,
//  rate cards as the climax, location, reviews and a closing concierge CTA.
//
//  EVERYTHING in the booking flow is preserved verbatim:
//    – fetch /api/hotels/<id>
//    – fetch /api/hotels/<id>/rates via fetchHotelRates()
//    – proceedToBooking() pushes /book/review with the exact same querystring
//    – RoomSelectLoginModal gate before booking
//    – UnlockRateModal for "Unlock Preferred Rate"
//    – Saved-hotels heart + login-after-save flow
//    – Lightbox gallery, photo categories, scroll-spy tab observer
//    – HotelPageWhatsAppTrigger (40s delay)
//    – Sticky bottom bar with Select Room CTA
//
//  The whole page renders inside a <div className="luxe">, so legacy inline
//  vars (var(--cream), var(--ink), var(--gold), var(--white)) auto-remap to
//  the dark luxe palette via globals.css. We additionally lean on the new
//  --luxe-* tokens (champagne / soft-white / hairline) for editorial chrome.
// =============================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UnlockRateModal from "@/components/UnlockRateModal";
import RoomSelectLoginModal from "@/components/RoomSelectLoginModal";
import HotelPageWhatsAppTrigger from "@/components/HotelPageWhatsAppTrigger";
import { trackHotelViewed, trackHotelGalleryOpened, trackHotelTabClicked } from "@/lib/analytics";
import { useBooking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { fetchHotelRates, type RatePlan, type RatesResponse } from "@/lib/api";
import { conciergeWhatsappLink } from "@/lib/concierge";
import { sanitizeOtaProse } from "@/lib/sanitizeOtaProse";
import { groupRatePlans, type RoomCategory } from "@/lib/roomCategories";
import HotelFactGrid from "@/components/HotelFactGrid";
import LuxeDatePicker from "@/components/LuxeDatePicker";
import GuestRoomPicker from "@/components/GuestRoomPicker";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/* ────────────────────────── Types ────────────────────────── */

type GalleryCategory =
  | "Hotel View"
  | "Guest Rooms"
  | "Suites"
  | "Pool & Spa"
  | "Amenities";

interface HotelDetail {
  /** Hotel master UUID — canonical id used for booking + analytics. */
  id: string;
  /** Backwards-compat alias for `id` (same UUID). Backend sends both. */
  master_id?: string;
  /** 8-hex short id (used in pretty URLs). */
  short_id?: string;
  /** SEO slug. */
  slug?: string;
  hotel_name: string;
  city: string;
  country: string;
  star_rating: number;
  rating_average: number;
  number_of_reviews: number;
  rates_from: number | null;
  rates_currency: string;
  photo1: string | null;
  photo2: string | null;
  photo3: string | null;
  photo4: string | null;
  photo5: string | null;
  overview: string | null;
  addressline1: string | null;
  addressline2: string | null;
  latitude: number | null;
  longitude: number | null;
  chain_name: string | null;
  brand_name: string | null;
  accommodation_type: string | null;
  numberrooms: number | null;
  yearopened: number | null;
  yearrenovated: number | null;
  checkin: string | null;
  checkout: string | null;
  /* Optional extended fields — rendered only if present on the payload */
  rating_value?: number | null;
  rating_service?: number | null;
  rating_location?: number | null;
  photo_categories?: Partial<Record<GalleryCategory, string[]>> | null;
  /* Editorial overlay fields — populated by CMS team, nullable */
  editorial_headline?: string | null;
  editorial_intro?: string | null;
  concierge_note?: string | null;
  neighbourhood?: string | null;
  /* Raw OTA prose fields used for fallback intro derivation */
  location?: string | null;
  amenities?: string | null;
  /* TripJack structured description — keys: rooms, dining, amenities, location,
     attractions, business_amenities, headline, spoken_languages, onsite_payments.
     `raw` is a single editorial block when the source string wasn't structured JSON. */
  tj_description?: {
    rooms?: string;
    dining?: string;
    amenities?: string;
    location?: string;
    attractions?: string;
    business_amenities?: string;
    headline?: string;
    spoken_languages?: string;
    onsite_payments?: string;
    raw?: string;
  } | null;
  /* Fact grid fields — new structured API fields, all optional */
  airport_iata?: string | null;
  airport_distance_min?: number | null;
  attraction_nearest?: string | null;
  rooms_description?: string | null;
  restaurants_count?: number | null;
  room_service_24h?: boolean | null;
  signature_restaurant?: string | null;
  parking_type?: string | null;
  shuttle_type?: string | null;
  languages?: string[] | null;
}

/* ────────────────────────── Helpers ────────────────────────── */

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=70";

function safePhotoUrl(raw: string): string {
  if (raw.startsWith("http://")) return raw.replace("http://", "https://");
  if (raw.startsWith("https://")) return raw;
  return `https://photos.hotelbeds.com/giata/${raw}`;
}

function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function firstSentence(text: string | null | undefined): string {
  if (!text) return "";
  const idx = text.search(/[.!?]/);
  return idx === -1 ? text.trim() : text.slice(0, idx + 1).trim();
}

function formatPrice(amount: number, currency: string): string {
  const code = (currency || "INR").toUpperCase();
  if (code === "INR") return formatInr(amount);
  const rounded = Math.round(amount);
  return `${code} ${rounded.toLocaleString("en-IN")}`;
}

function formatFreeCancelDate(raw?: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatDateLabel(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Hotel meal-plan jargon → luxe-friendly copy. Keep the original label in
// parentheses so power users still recognise the term.
function formatMealBasis(raw?: string): string {
  const mb = (raw || "").trim();
  if (!mb) return "Room Only";
  const lower = mb.toLowerCase();
  if (lower === "half board") return "Breakfast & Dinner (Half Board)";
  if (lower === "full board") return "All Meals Included (Full Board)";
  if (lower === "all inclusive") return "All Inclusive";
  if (lower === "bed and breakfast" || lower === "bed & breakfast") return "Breakfast";
  return mb;
}

/* ────────────────────────── Filters ────────────────────────── */

type MealPlanFilter = "all" | "room-only" | "breakfast" | "half-board" | "full-board";

function mealBasisMatchesFilter(mealBasis: string, filter: MealPlanFilter): boolean {
  if (filter === "all") return true;
  const mb = (mealBasis || "").toLowerCase();
  if (filter === "room-only") return mb.includes("room only") || mb.includes("room-only") || mb === "" || mb.includes("no meal");
  if (filter === "breakfast") return mb.includes("breakfast");
  if (filter === "half-board") return mb.includes("half");
  if (filter === "full-board") return mb.includes("full");
  return true;
}

/* ────────────────────────── Tabs ────────────────────────── */

const TABS = ["Rates", "The Stay", "Reviews"] as const;
type TabName = (typeof TABS)[number];

/* ────────────────────────── Lightbox ────────────────────────── */

function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[10002] flex items-center justify-center"
      style={{ background: "rgba(8,7,6,0.97)", backdropFilter: "blur(32px)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-xl"
        style={{ color: "var(--luxe-soft-white)", background: "none", border: "none", cursor: "pointer" }}
        aria-label="Close"
      >
        &times;
      </button>
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 md:left-8 w-12 h-12 flex items-center justify-center text-2xl"
          style={{ color: "var(--luxe-soft-white)", background: "none", border: "none", cursor: "pointer" }}
          aria-label="Previous"
        >
          &#8249;
        </button>
      )}
      <motion.img
        key={index}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        src={safePhotoUrl(photos[index])}
        alt=""
        className="max-h-[85vh] max-w-[92vw] object-contain"
        onClick={(e) => e.stopPropagation()}
        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
      />
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 md:right-8 w-12 h-12 flex items-center justify-center text-2xl"
          style={{ color: "var(--luxe-soft-white)", background: "none", border: "none", cursor: "pointer" }}
          aria-label="Next"
        >
          &#8250;
        </button>
      )}
      <span
        className="absolute bottom-6 text-xs tracking-[0.32em]"
        style={{ color: "var(--luxe-champagne)", fontFamily: "var(--font-mono)", fontWeight: 600 }}
      >
        {String(index + 1).padStart(2, "0")} &nbsp;/&nbsp; {String(photos.length).padStart(2, "0")}
      </span>
    </motion.div>
  );
}

/* ────────────────────────── Filter Pill ────────────────────────── */

function FilterPillShell({
  active,
  children,
  onClick,
  as = "button",
}: {
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  as?: "button" | "label";
}) {
  const Component = as;
  return (
    <Component
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 16px",
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "0.04em",
        background: active ? "var(--luxe-champagne-soft)" : "rgba(255,255,255,0.04)",
        border: active
          ? "1px solid var(--luxe-champagne-line)"
          : "1px solid var(--luxe-hairline-strong)",
        color: active ? "var(--luxe-champagne)" : "var(--luxe-soft-white-70)",
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        transition: "border-color 0.15s, color 0.15s, background 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Component>
  );
}

function RateFilterBar({
  freeCancellation,
  onToggleFreeCancellation,
  mealPlan,
  onChangeMealPlan,
}: {
  freeCancellation: boolean;
  onToggleFreeCancellation: () => void;
  mealPlan: MealPlanFilter;
  onChangeMealPlan: (v: MealPlanFilter) => void;
}) {
  const mealLabel: Record<MealPlanFilter, string> = {
    all: "Meal Plan",
    "room-only": "Room Only",
    breakfast: "With Breakfast",
    "half-board": "Breakfast & Dinner (Half Board)",
    "full-board": "All Meals Included (Full Board)",
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6" style={{ alignItems: "center" }}>
      <FilterPillShell active={freeCancellation} onClick={onToggleFreeCancellation}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14,
            borderRadius: 3,
            border: freeCancellation ? "1.5px solid var(--luxe-champagne)" : "1.5px solid var(--luxe-hairline-strong)",
            background: freeCancellation ? "var(--luxe-champagne)" : "transparent",
            transition: "all 0.15s",
          }}
        >
          {freeCancellation && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0c0b0a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        Free Cancellation
      </FilterPillShell>

      <div style={{ position: "relative" }}>
        <FilterPillShell active={mealPlan !== "all"} as="label">
          <span style={{ pointerEvents: "none" }}>{mealLabel[mealPlan]}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: "none" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <select
            value={mealPlan}
            onChange={(e) => onChangeMealPlan(e.target.value as MealPlanFilter)}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
              fontSize: 12,
              width: "100%",
              height: "100%",
            }}
            aria-label="Meal plan filter"
          >
            <option value="all">All Meal Plans</option>
            <option value="room-only">Room Only</option>
            <option value="breakfast">With Breakfast</option>
            <option value="half-board">Breakfast & Dinner (Half Board)</option>
            <option value="full-board">All Meals Included (Full Board)</option>
          </select>
        </FilterPillShell>
      </div>
    </div>
  );
}

/* ────────────────────────── Hotel Date Editor ──────────────────────────
   Inline date + guests editor designed for the rates section. Reads/writes
   useBooking() so the live-rates effect refetches automatically on change.
   Dark luxe theme to match the page (DateBar's inline branch is light-only).
*/

function HotelDateEditor({ compact = false }: { compact?: boolean }) {
  const { checkIn, checkOut, setDates, formatDate } = useBooking();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleChange = useCallback(
    ({ checkIn: ci, checkOut: co }: { checkIn: string | null; checkOut: string | null }) => {
      setDates(ci ?? "", co ?? "");
    },
    [setDates],
  );

  const cellPadding = compact ? "10px 14px" : "14px 18px";
  const labelSize = compact ? 9 : 10;
  const valueSize = compact ? 13 : 14;

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: labelSize,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--luxe-soft-white-50)",
    marginBottom: 4,
    fontWeight: 600,
  };
  const valueStyle = (filled: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-display)",
    fontSize: valueSize + 1,
    fontWeight: 500,
    fontStyle: filled ? "italic" : "normal",
    color: filled ? "var(--luxe-soft-white)" : "var(--luxe-soft-white-50)",
    lineHeight: 1.25,
    fontVariantNumeric: "tabular-nums",
  });
  const cellBase: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: cellPadding,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 160ms ease",
    color: "inherit",
  };
  const dividerStyle: React.CSSProperties = {
    width: 1,
    background: "var(--luxe-hairline)",
    flexShrink: 0,
    margin: "10px 0",
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        className="hotel-date-editor"
        style={{
          display: "flex",
          alignItems: "stretch",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--luxe-hairline)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={cellBase}
          aria-label="Edit check-in date"
        >
          <div style={labelStyle}>Check-in</div>
          <div style={valueStyle(!!checkIn)}>{formatDate(checkIn, "Add date")}</div>
        </button>
        <div style={dividerStyle} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={cellBase}
          aria-label="Edit check-out date"
        >
          <div style={labelStyle}>Check-out</div>
          <div style={valueStyle(!!checkOut)}>{formatDate(checkOut, "Add date")}</div>
        </button>
        <div style={dividerStyle} />
        <div style={{ flex: 1, minWidth: 0, padding: cellPadding, display: "flex", alignItems: "center" }}>
          <GuestRoomPicker variant="dark" compact />
        </div>
      </div>

      <LuxeDatePicker
        mode="range"
        variant="dark"
        checkIn={checkIn || null}
        checkOut={checkOut || null}
        onChange={handleChange}
        open={open}
        onClose={() => setOpen(false)}
        showTrigger={false}
        anchorRef={containerRef}
      />
    </div>
  );
}

/* ───────── MMT-style Search Utility Bar (Journey 2 revision) ─────────
   Single dark #1A1A1A bar that sits directly above the photo gallery.
   4 segments separated by thin grey vertical dividers:
     Location · Check-in · Check-out · Guests
   plus a small gold "Search" button on the far right that scrolls the
   user to the rates region. Dates open the shared LuxeDatePicker;
   guests reuse the existing dark, compact GuestRoomPicker dropdown.
   ───────────────────────────────────────────────────────────────────── */
function HotelSearchUtilityBar({ city }: { city: string }) {
  const { checkIn, checkOut, setDates, formatDate } = useBooking();
  const [datesOpen, setDatesOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleDateChange = useCallback(
    ({ checkIn: ci, checkOut: co }: { checkIn: string | null; checkOut: string | null }) => {
      setDates(ci ?? "", co ?? "");
    },
    [setDates],
  );

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "var(--luxe-soft-white-50)",
    fontWeight: 600,
    marginBottom: 4,
  };
  const valueStyle = (filled: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-display)",
    fontStyle: filled ? "italic" : "normal",
    fontSize: 14,
    fontWeight: 500,
    color: filled ? "var(--luxe-soft-white)" : "var(--luxe-soft-white-50)",
    lineHeight: 1.2,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  });
  const cellBase: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: "10px 16px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    color: "inherit",
    transition: "background 160ms ease",
  };
  const dividerStyle: React.CSSProperties = {
    width: 1,
    background: "rgba(255,255,255,0.08)",
    flexShrink: 0,
    margin: "10px 0",
  };

  return (
    <div
      ref={anchorRef}
      className="hotel-search-utilbar"
      style={{
        display: "flex",
        alignItems: "stretch",
        background: "#1A1A1A",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* 1. Location */}
      <div
        className="hotel-search-utilbar__cell"
        style={{ ...cellBase, cursor: "default", display: "flex", alignItems: "center", gap: 10 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <div style={{ minWidth: 0 }}>
          <div style={labelStyle}>Location</div>
          <div style={valueStyle(true)}>{city}</div>
        </div>
      </div>
      <div className="hotel-search-utilbar__divider" style={dividerStyle} />

      {/* 2. Check-in */}
      <button
        type="button"
        onClick={() => setDatesOpen(true)}
        className="hotel-search-utilbar__cell"
        style={cellBase}
        aria-label="Edit check-in date"
      >
        <div style={labelStyle}>Check-in</div>
        <div style={valueStyle(!!checkIn)}>{formatDate(checkIn, "Add date")}</div>
      </button>
      <div className="hotel-search-utilbar__divider" style={dividerStyle} />

      {/* 3. Check-out */}
      <button
        type="button"
        onClick={() => setDatesOpen(true)}
        className="hotel-search-utilbar__cell"
        style={cellBase}
        aria-label="Edit check-out date"
      >
        <div style={labelStyle}>Check-out</div>
        <div style={valueStyle(!!checkOut)}>{formatDate(checkOut, "Add date")}</div>
      </button>
      <div className="hotel-search-utilbar__divider" style={dividerStyle} />

      {/* 4. Guests */}
      <div
        className="hotel-search-utilbar__cell"
        style={{ ...cellBase, padding: "8px 16px", display: "flex", alignItems: "center" }}
      >
        <GuestRoomPicker variant="dark" compact />
      </div>

      {/* Search button on the far right */}
      <button
        type="button"
        onClick={() => document.getElementById("rates")?.scrollIntoView({ behavior: "smooth" })}
        className="luxe-btn-gold hotel-search-utilbar__btn"
        style={{
          flexShrink: 0,
          margin: 6,
          padding: "0 22px",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 600,
          whiteSpace: "nowrap",
          border: "none",
          borderRadius: 8,
        }}
        aria-label="Search rates"
      >
        Search
      </button>

      <LuxeDatePicker
        mode="range"
        variant="dark"
        checkIn={checkIn || null}
        checkOut={checkOut || null}
        onChange={handleDateChange}
        open={datesOpen}
        onClose={() => setDatesOpen(false)}
        showTrigger={false}
        anchorRef={anchorRef}
      />
    </div>
  );
}

/* ────────────────────────── Room Category Card ────────────────────────── */

function RoomCategoryCard({
  category,
  photoUrl,
  isExpanded,
  onToggle,
  planCount,
  variantsPreview,
  isFirst,
  children,
}: {
  category: RoomCategory;
  photoUrl: string;
  isExpanded: boolean;
  onToggle: () => void;
  planCount: number;
  variantsPreview: string[];
  nights: number;
  isFirst: boolean;
  children?: React.ReactNode;
}) {
  const cheapest = formatPrice(category.cheapestPrice, category.currency);
  const hasRefundable = category.cheapestRefundablePrice != null;

  // Compact compare-card benefits — keep to 2 high-signal lines.
  const cheapestPlan =
    category.plans.slice().sort((a, b) => a.total_price - b.total_price)[0];
  const benefits: string[] = [];
  if (hasRefundable) benefits.push("Free Cancellation");
  if (cheapestPlan) {
    const meal = formatMealBasis(cheapestPlan.meal_basis);
    if (meal && meal !== "Room Only") benefits.push(`${meal} included`);
  }
  if (benefits.length < 2 && variantsPreview.length > 0) {
    benefits.push(variantsPreview[0]);
  }
  if (benefits.length < 2) {
    benefits.push(`${planCount} rate option${planCount !== 1 ? "s" : ""}`);
  }

  return (
    <div
      style={{
        background: isExpanded ? "#1A1A1A" : "transparent",
        borderTop: isFirst ? "none" : "1px solid rgba(255,255,255,0.06)",
        boxShadow: isExpanded ? "inset 3px 0 0 #C9A961" : "none",
        transition: "background 200ms ease, box-shadow 200ms ease",
      }}
    >
      <div className="room-cat-row">
        {/* Left — small square thumbnail */}
        <div
          style={{
            position: "relative",
            width: 90,
            height: 90,
            borderRadius: 6,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.05)",
            backgroundImage: `url(${photoUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            flexShrink: 0,
          }}
        />

        {/* Middle — room name + 2 key benefits */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minWidth: 0,
          }}
        >
          <h4
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 17,
              fontWeight: 500,
              color: "var(--luxe-soft-white)",
              margin: 0,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
            }}
          >
            {category.name}
          </h4>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {benefits.map((line, i) => {
              const isFreeCancel = i === 0 && hasRefundable;
              return (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "var(--font-body)",
                    fontSize: 12.5,
                    lineHeight: "17px",
                    color: isFreeCancel
                      ? "#C9A961"
                      : "var(--luxe-soft-white-70)",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      flex: "none",
                      color: isFreeCancel
                        ? "#C9A961"
                        : "var(--luxe-soft-white-50)",
                      fontSize: 11,
                      lineHeight: "17px",
                    }}
                  >
                    {isFreeCancel ? "✓" : "•"}
                  </span>
                  {line}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right — price + Select Room button */}
        <div
          className="room-cat-price"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
            minWidth: 128,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--luxe-soft-white-50)",
                marginBottom: 1,
              }}
            >
              From
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 700,
                color: "#C9A961",
                lineHeight: 1.1,
                letterSpacing: "-0.015em",
                whiteSpace: "nowrap",
              }}
            >
              {cheapest}
            </div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            className="luxe-btn-gold"
            style={{ padding: "8px 18px", fontSize: 10.5 }}
          >
            {isExpanded ? "Hide Rates" : "Select Room"}
          </button>
        </div>
      </div>
      {children && <div style={{ padding: "0 14px 14px" }}>{children}</div>}
    </div>
  );
}

/* ────────────────────────── Rate Card ────────────────────────── */

function RateCard({
  plan,
  nights,
  mrpRate,
  mrpCurrency,
  savingsPct,
  isSelected,
  isHighlighted,
  cardRef,
  onSelect,
  onProceed,
}: {
  plan: RatePlan;
  nights: number;
  mrpRate: number | null;
  mrpCurrency: string | null;
  savingsPct: number | null;
  isSelected: boolean;
  isHighlighted: boolean;
  cardRef: (el: HTMLDivElement | null) => void;
  onSelect: () => void;
  onProceed: () => void;
}) {
  const nightsSafe = Math.max(nights, 1);
  const perNight = plan.total_price / nightsSafe;
  const cancelDate = formatFreeCancelDate(plan.free_cancel_until);
  const showSavings = savingsPct != null && savingsPct > 0 && mrpRate != null && mrpRate > plan.total_price;

  return (
    <motion.div
      layout
      ref={cardRef}
      onClick={onSelect}
      className={isHighlighted ? "rate-card-highlight-pulse" : undefined}
      style={{
        position: "relative",
        background: isSelected ? "rgba(200,170,118,0.08)" : "rgba(255,255,255,0.04)",
        border: isSelected
          ? "1px solid var(--luxe-champagne)"
          : "1px solid var(--luxe-hairline-strong)",
        borderRadius: 14,
        padding: "22px 24px",
        cursor: "pointer",
        transition: "border-color 0.25s, background 0.25s, box-shadow 0.25s",
        boxShadow: isSelected ? "0 0 0 1px rgba(200,170,118,0.25), 0 8px 32px rgba(0,0,0,0.3)" : "none",
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Member-rate ribbon */}
      {showSavings && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 16,
            right: 18,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 11px",
            background: "var(--luxe-champagne-soft)",
            border: "1px solid var(--luxe-champagne-line)",
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--luxe-champagne)",
            letterSpacing: "0.06em",
            fontFamily: "var(--font-body)",
            textTransform: "uppercase" as const,
          }}
        >
          <span style={{ fontSize: 9 }}>★</span>
          Member rate · {savingsPct}% off
        </div>
      )}

      {/* Header: room name */}
      <div className="flex items-start justify-between gap-3 mb-2" style={{ paddingRight: showSavings ? 140 : 36 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 500,
              fontStyle: "italic",
              color: "var(--luxe-soft-white)",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            {plan.room_name}
          </h4>
          <p
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.18em",
              textTransform: "uppercase" as const,
              color: "var(--luxe-soft-white-50)",
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            {formatMealBasis(plan.meal_basis)}
          </p>
        </div>
        {isSelected && (
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "var(--luxe-champagne)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              position: "absolute",
              top: 22,
              right: 22,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0c0b0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </div>

      {/* Cancellation line */}
      <div
        style={{
          fontSize: 12.5,
          fontFamily: "var(--font-body)",
          marginTop: 14,
          marginBottom: 18,
          color: plan.refundable ? "var(--luxe-champagne)" : "var(--luxe-soft-white-50)",
          fontWeight: plan.refundable ? 500 : 400,
          letterSpacing: "0.01em",
        }}
      >
        {plan.refundable
          ? cancelDate
            ? `✓ Free cancellation until ${cancelDate}`
            : "✓ Free cancellation"
          : "Non-refundable"}
      </div>

      {/* Rate block + CTA */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          {mrpRate && mrpRate > plan.total_price && (
            <div
              style={{
                fontSize: 11,
                color: "var(--luxe-soft-white-50)",
                textDecoration: "line-through",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
              }}
            >
              {formatPrice(mrpRate, mrpCurrency || plan.currency)}
            </div>
          )}
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "var(--luxe-champagne)",
              fontFamily: "var(--font-display)",
              lineHeight: 1.1,
              marginTop: 2,
              letterSpacing: "-0.015em",
            }}
          >
            {formatPrice(plan.total_price, plan.currency)}
            {nightsSafe > 1 && (
              <span style={{ fontSize: 12, fontWeight: 400, color: "var(--luxe-soft-white-50)", marginLeft: 8, fontStyle: "italic", fontFamily: "var(--font-display)" }}>
                total
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--luxe-soft-white-50)",
              marginTop: 4,
              fontFamily: "var(--font-body)",
            }}
          >
            {formatPrice(perNight, plan.currency)}/night
            {nightsSafe > 1 && <> · {nightsSafe} nights</>}
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onProceed(); }}
          className="luxe-btn-gold"
          style={{ padding: "12px 24px", fontSize: 11 }}
        >
          Select &rarr;
        </button>
      </div>
    </motion.div>
  );
}

/* ────────────────────────── Skeleton Rate Card ────────────────────────── */

function RateCardSkeleton() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--luxe-hairline)",
        borderRadius: 14,
        padding: "22px 24px",
      }}
    >
      <div className="luxe-skeleton luxe-skeleton--dark" style={{ height: 18, width: "55%", marginBottom: 10, borderRadius: 4 }} />
      <div className="luxe-skeleton luxe-skeleton--dark" style={{ height: 10, width: "30%", marginBottom: 18, borderRadius: 3 }} />
      <div className="luxe-skeleton luxe-skeleton--dark" style={{ height: 12, width: "40%", marginBottom: 16, borderRadius: 3 }} />
      <div className="flex items-end justify-between">
        <div>
          <div className="luxe-skeleton luxe-skeleton--dark" style={{ height: 28, width: 140, marginBottom: 8, borderRadius: 4 }} />
          <div className="luxe-skeleton luxe-skeleton--dark" style={{ height: 12, width: 100, borderRadius: 3 }} />
        </div>
        <div className="luxe-skeleton luxe-skeleton--dark" style={{ height: 40, width: 110, borderRadius: 999 }} />
      </div>
    </div>
  );
}

/* ────────────────────────── Section Eyebrow + Heading ────────────────────────── */

function SectionHead({
  eyebrow,
  title,
  italicWord,
  trailingTitle,
  description,
  rightSlot,
}: {
  eyebrow: string;
  title: string;
  italicWord?: string;
  trailingTitle?: string;
  description?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 24,
        flexWrap: "wrap",
        marginBottom: 28,
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <div className="luxe-tech" style={{ marginBottom: 10 }}>
          {eyebrow}
        </div>
        <h2
          className="luxe-display"
          style={{
            fontSize: "clamp(26px, 3vw, 38px)",
            marginBottom: description ? 10 : 0,
          }}
        >
          {title}
          {italicWord && (
            <>
              {" "}
              <em>{italicWord}</em>
            </>
          )}
          {trailingTitle && <> {trailingTitle}</>}
        </h2>
        {description && (
          <p style={{ color: "var(--luxe-soft-white-70)", fontSize: 14.5, lineHeight: 1.7 }}>
            {description}
          </p>
        )}
      </div>
      {rightSlot}
    </div>
  );
}

/* ────────────────────────── Collapsible body text ────────────────────────── */
//
// Clamps a long paragraph to 4 lines with a gold "Read more ↓" link and a
// fade-to-#0a0a0a overlay at the bottom. Each instance manages its own state,
// so expanding one block does not affect siblings. When collapsing, the page
// smoothly scrolls back to the section label (or `scrollTargetRef` when the
// label lives outside the wrapper, e.g. the editorial intro under "The Stay").

function CollapsibleText({
  label,
  text,
  bodyStyle,
  scrollMarginTop = 140,
  scrollTargetRef,
}: {
  label?: React.ReactNode;
  text: string;
  bodyStyle?: React.CSSProperties;
  scrollMarginTop?: number;
  scrollTargetRef?: React.RefObject<HTMLElement | null>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Re-measure when collapsed: scrollHeight > clientHeight means clamped overflow.
    if (!isExpanded) {
      setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
    }
  }, [text, isExpanded]);

  const toggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (!next) {
      requestAnimationFrame(() => {
        const target = scrollTargetRef?.current ?? wrapperRef.current;
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const showLink = isOverflowing || isExpanded;

  return (
    <div ref={wrapperRef} style={{ scrollMarginTop }}>
      {label}
      <div style={{ position: "relative" }}>
        <p
          ref={textRef}
          style={{
            ...bodyStyle,
            ...(isExpanded
              ? {}
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }),
          }}
        >
          {text}
        </p>
        {!isExpanded && isOverflowing && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 48,
              pointerEvents: "none",
              background: "linear-gradient(to bottom, transparent 40%, #0a0a0a 100%)",
            }}
          />
        )}
      </div>
      {showLink && (
        <span
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle();
            }
          }}
          style={{
            display: "inline-block",
            cursor: "pointer",
            marginTop: 8,
            fontFamily: "Montserrat, var(--font-body), system-ui, sans-serif",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#c9a96e",
            userSelect: "none",
          }}
        >
          {isExpanded ? "Read less ↑" : "Read more ↓"}
        </span>
      )}
    </div>
  );
}

/* ────────────────────────── Main Page ────────────────────────── */

export default function HotelPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params.id as string;
  const booking = useBooking();
  const { user } = useAuth();

  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [loading, setLoading] = useState(true);

  /* Live rates */
  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [noMatch, setNoMatch] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [ratesRefreshKey, setRatesRefreshKey] = useState(0);

  /* Gallery */
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);

  /* Tabs */
  const [activeTab, setActiveTab] = useState<TabName>("Rates");

  /* Rate plan selection */
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [highlightedOptionId, setHighlightedOptionId] = useState<string | null>(null);
  const rateCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* Which room category is currently expanded (null = all collapsed) */
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  /* Filter bar state */
  const [filterFreeCancellation, setFilterFreeCancellation] = useState(false);
  const [filterMealPlan, setFilterMealPlan] = useState<MealPlanFilter>("all");

  /* Unlock Rate modal */
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);

  /* Login gate modal (SELECT button on a rate card, user not signed in) */
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);
  const [loginIntent, setLoginIntent] = useState<"room-select" | "save-hotel">("room-select");

  /* Saved (heart) state — hero icon */
  const [savedHotelIds, setSavedHotelIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = JSON.parse(localStorage.getItem("voyagr_saved_hotels") || "[]");
      return Array.isArray(raw) ? raw.map(String) : [];
    } catch {
      return [];
    }
  });
  const [pendingSaveAfterLogin, setPendingSaveAfterLogin] = useState(false);
  const isSaved = hotel ? savedHotelIds.includes(hotel.id) : false;

  /* Section refs for scroll-based tabs */
  const ratesRef = useRef<HTMLDivElement>(null);
  const stayRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  /* Quick-link anchor refs (Overview sub-nav) */
  const roomsAnchorRef = useRef<HTMLDivElement>(null);
  const amenitiesAnchorRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLElement>(null);

  /* ── Fetch hotel detail (static) ──
   * `hotelId` is the URL path token — slug-shortid, short_id, master UUID, or
   * legacy tj id. The backend's `_resolve_tj_from_path_id` normalises any of
   * these to the master record before returning meta. If this endpoint fails
   * (e.g. backend down), the rates effect below will populate `hotel` from
   * the rates response. */
  useEffect(() => {
    fetch(`${API_BASE}/api/hotels/${hotelId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((hotelData) => {
        if (hotelData) {
          // The backend returns master_id / short_id / slug — keep the meta
          // shape canonical so downstream code (booking flow, analytics) has
          // one source of truth.
          setHotel(hotelData as HotelDetail);
          trackHotelViewed({
            hotel_id: hotelData.id ?? hotelId,
            hotel_name: hotelData.hotel_name,
            city: hotelData.city,
            country: hotelData.country,
            star_rating: hotelData.star_rating,
            price_from: hotelData.rates_from,
            currency: hotelData.rates_currency,
          });
        }
      })
      .catch(() => {
        // Silent: handled by rates fallback.
      })
      .finally(() => setLoading(false));
  }, [hotelId]);

  /* ── Guest counts (sum across rooms) ── */
  const adultsCount = booking.totalAdults;
  const childrenCount = booking.totalChildren;

  /* ── Fetch live rates whenever dates / guests / hotel change ── */
  useEffect(() => {
    if (!hotelId || !booking.checkIn || !booking.checkOut) {
      setRates(null);
      setNoMatch(false);
      setRatesError(null);
      setRatesLoading(false);
      return;
    }
    let cancelled = false;
    setRatesLoading(true);
    setRatesError(null);
    fetchHotelRates(hotelId, booking.checkIn, booking.checkOut, adultsCount, childrenCount)
      .then((res) => {
        if (cancelled) return;
        if ("error" in res && res.error === "no_tripjack_match") {
          setNoMatch(true);
          setRates(null);
        } else {
          setNoMatch(false);
          const ratesRes = res as RatesResponse;
          setRates(ratesRes);
          // Fallback: if the static `/api/hotels/{id}` fetch failed (e.g. the
          // backend returned 5xx), build a partial HotelDetail from the rates
          // response so the page still renders name / photos / location.
          setHotel((prev) => {
            if (prev) return prev;
            const h = ratesRes.hotel;
            const fallback: HotelDetail = {
              id: h.id,
              master_id: h.id,
              short_id: h.short_id,
              slug: h.slug,
              hotel_name: h.hotel_name,
              city: h.city,
              country: h.country,
              star_rating: h.star_rating,
              rating_average: 0,
              number_of_reviews: 0,
              rates_from: null,
              rates_currency: ratesRes.rates[0]?.currency || "INR",
              photo1: h.photo1 ?? null,
              photo2: h.photo2 ?? null,
              photo3: h.photo3 ?? null,
              photo4: h.photo4 ?? null,
              photo5: h.photo5 ?? null,
              overview: h.overview ?? null,
              addressline1: h.addressline1 ?? null,
              addressline2: null,
              latitude: h.latitude ?? null,
              longitude: h.longitude ?? null,
              chain_name: null,
              brand_name: null,
              accommodation_type: null,
              numberrooms: null,
              yearopened: null,
              yearrenovated: null,
              checkin: null,
              checkout: null,
            };
            trackHotelViewed({
              hotel_id: fallback.id,
              hotel_name: fallback.hotel_name,
              city: fallback.city,
              country: fallback.country,
              star_rating: fallback.star_rating,
              price_from: fallback.rates_from,
              currency: fallback.rates_currency,
            });
            return fallback;
          });
        }
      })
      .catch((e) => {
        if (!cancelled) setRatesError(e?.message || "Failed to load rates");
      })
      .finally(() => {
        if (!cancelled) setRatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hotelId, booking.checkIn, booking.checkOut, adultsCount, childrenCount, ratesRefreshKey]);

  /* Reset selection when the rate set changes */
  useEffect(() => {
    setSelectedOptionId(null);
  }, [rates]);

  /* ── Photos ── */
  const photos = useMemo<string[]>(
    () =>
      hotel
        ? ([hotel.photo1, hotel.photo2, hotel.photo3, hotel.photo4, hotel.photo5].filter(Boolean) as string[])
        : [],
    [hotel]
  );

  const openLightbox = useCallback((idx: number, overridePhotos?: string[]) => {
    setLightboxPhotos(overridePhotos && overridePhotos.length > 0 ? overridePhotos : photos);
    setLightboxIdx(idx);
    setLightboxOpen(true);
    if (hotel && !overridePhotos) {
      trackHotelGalleryOpened({ hotel_id: hotel.id, hotel_name: hotel.hotel_name, photo_index: idx });
    }
  }, [hotel, photos]);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const prevLightbox = useCallback(
    () => setLightboxIdx((i) => (i - 1 + lightboxPhotos.length) % Math.max(lightboxPhotos.length, 1)),
    [lightboxPhotos.length]
  );
  const nextLightbox = useCallback(
    () => setLightboxIdx((i) => (i + 1) % Math.max(lightboxPhotos.length, 1)),
    [lightboxPhotos.length]
  );

  /* ── Rates: filtered list ── */
  const nights = rates?.nights || booking.nights || 1;

  const filteredRates = useMemo<RatePlan[]>(() => {
    if (!rates) return [];
    return rates.rates.filter((p) => {
      if (filterFreeCancellation && !p.refundable) return false;
      if (!mealBasisMatchesFilter(p.meal_basis, filterMealPlan)) return false;
      return true;
    });
  }, [rates, filterFreeCancellation, filterMealPlan]);

  const selectedPlan = useMemo<RatePlan | null>(() => {
    if (!rates || !selectedOptionId) return null;
    return rates.rates.find((p) => p.option_id === selectedOptionId) || null;
  }, [rates, selectedOptionId]);

  const categories = useMemo<RoomCategory[]>(
    () => groupRatePlans(filteredRates),
    [filteredRates]
  );

  const editorialIntro = useMemo<string | null>(() => {
    if (!hotel) return null;
    if (hotel.editorial_intro) return hotel.editorial_intro;
    // Prefer TripJack's structured location prose — factual, named, concise.
    if (hotel.tj_description?.location) return hotel.tj_description.location;
    // Hotels with non-JSON descriptions get the raw block as a fallback intro.
    if (hotel.tj_description?.raw) return hotel.tj_description.raw;
    const loc = firstSentence(hotel.location);
    const amen = firstSentence(hotel.amenities);
    const combined = [loc, amen].filter(Boolean).join(" ");
    return combined ? sanitizeOtaProse(combined) : null;
  }, [hotel]);

  const mrpRate = rates?.mrp?.agoda_rate ?? null;
  const mrpCurrency = rates?.mrp?.currency ?? null;
  const savingsPct = rates?.savings_pct ?? null;

  /* ── Proceed to booking from a rate SELECT button ── */
  const proceedToBooking = useCallback(
    (plan: RatePlan) => {
      if (!hotel) return;
      const adults = booking.rooms.reduce((s, r) => s + r.adults, 0);
      const children = booking.rooms.reduce((s, r) => s + r.children, 0);
      // `hotelMasterId` is the canonical URL param post-Phase D — a master
      // UUID that the booking flow threads through to POST /api/bookings.
      const qs = new URLSearchParams({
        hotelMasterId: hotel.id,
        optionId: plan.option_id,
        roomName: plan.room_name,
        mealBasis: plan.meal_basis || "",
        refundable: String(!!plan.refundable),
        freeCancelUntil: plan.free_cancel_until || "",
        totalPrice: String(Math.round(plan.total_price)),
        currency: plan.currency,
        checkIn: booking.checkIn || "",
        checkOut: booking.checkOut || "",
        adults: String(adults),
        children: String(children),
        rooms: String(booking.rooms.length),
      });
      router.push(`/book/review?${qs.toString()}`);
    },
    [hotel, booking, router]
  );

  const handlePlanSelectCTA = useCallback(
    (plan: RatePlan) => {
      setSelectedOptionId(plan.option_id);
      if (!user) {
        setPendingOptionId(plan.option_id);
        setLoginIntent("room-select");
        setLoginModalOpen(true);
        return;
      }
      proceedToBooking(plan);
    },
    [user, proceedToBooking]
  );

  /* ── Saved hotels (localStorage) ── */
  const writeSavedHotels = useCallback((list: string[]) => {
    setSavedHotelIds(list);
    if (typeof window !== "undefined") {
      localStorage.setItem("voyagr_saved_hotels", JSON.stringify(list));
    }
  }, []);

  const saveHotelToStorage = useCallback(() => {
    if (!hotel) return;
    const hotelIdStr = hotel.id;
    setSavedHotelIds((prev) => {
      if (prev.includes(hotelIdStr)) return prev;
      const next = [...prev, hotelIdStr];
      if (typeof window !== "undefined") {
        localStorage.setItem("voyagr_saved_hotels", JSON.stringify(next));
      }
      return next;
    });
  }, [hotel]);

  const handleHeartClick = useCallback(() => {
    if (!hotel) return;
    if (!user) {
      setPendingSaveAfterLogin(true);
      setLoginIntent("save-hotel");
      setLoginModalOpen(true);
      return;
    }
    const hotelIdStr = hotel.id;
    if (savedHotelIds.includes(hotelIdStr)) {
      const updated = savedHotelIds.filter((id) => id !== hotelIdStr);
      writeSavedHotels(updated);
    } else {
      writeSavedHotels([...savedHotelIds, hotelIdStr]);
    }
  }, [hotel, user, savedHotelIds, writeSavedHotels]);

  const handleLoginSuccess = useCallback(() => {
    setLoginModalOpen(false);
    if (pendingSaveAfterLogin) {
      saveHotelToStorage();
      setPendingSaveAfterLogin(false);
      return;
    }
    const oid = pendingOptionId;
    if (oid) {
      setSelectedOptionId(oid);
      setHighlightedOptionId(oid);
      setTimeout(() => {
        rateCardRefs.current[oid]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
      setTimeout(() => setHighlightedOptionId(null), 2400);
    } else {
      setTimeout(() => {
        document.getElementById("rates")?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }
    setPendingOptionId(null);
  }, [pendingOptionId, pendingSaveAfterLogin, saveHotelToStorage]);

  /* ── Star display ── */
  const starDisplay = hotel && hotel.star_rating > 0
    ? "★".repeat(Math.round(hotel.star_rating))
    : "";

  /* ── Tab click handler — scrolls to section ── */
  const handleTabClick = useCallback((tab: TabName) => {
    setActiveTab(tab);
    if (hotel) {
      trackHotelTabClicked({ hotel_id: hotel.id, hotel_name: hotel.hotel_name, tab_name: tab });
    }
    const refMap: Record<TabName, React.RefObject<HTMLDivElement | null>> = {
      "Rates": ratesRef,
      "The Stay": stayRef,
      "Reviews": reviewsRef,
    };
    const ref = refMap[tab];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hotel]);

  /* ── Scroll-based active tab detection ── */
  useEffect(() => {
    const sections: { ref: React.RefObject<HTMLDivElement | null>; tab: TabName }[] = [
      { ref: ratesRef, tab: "Rates" },
      { ref: stayRef, tab: "The Stay" },
      { ref: reviewsRef, tab: "Reviews" },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const match = sections.find((s) => s.ref.current === entry.target);
            if (match) setActiveTab(match.tab);
          }
        }
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0.1 }
    );

    sections.forEach((s) => {
      if (s.ref.current) observer.observe(s.ref.current);
    });

    return () => observer.disconnect();
  }, [hotel]);

  /* ── Loading ── full-page luxe skeleton (dark) */
  if (loading) {
    return (
      <div className="luxe min-h-screen" style={{ background: "var(--luxe-black)" }}>
        <Header />
        <div
          aria-busy="true"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "120px 24px 120px",
          }}
        >
          <div className="luxe-skeleton luxe-skeleton--dark" style={{ height: 14, width: 120, marginBottom: 16, borderRadius: 3 }} />
          <div className="luxe-skeleton luxe-skeleton--dark" style={{ height: 56, width: "62%", marginBottom: 12, borderRadius: 6 }} />
          <div className="luxe-skeleton luxe-skeleton--dark" style={{ height: 14, width: "30%", marginBottom: 36, borderRadius: 3 }} />
          <div className="luxe-skeleton luxe-skeleton--dark" style={{ height: 460, width: "100%", borderRadius: 14, marginBottom: 36 }} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 380px",
              gap: 36,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <RateCardSkeleton />
              <RateCardSkeleton />
              <RateCardSkeleton />
            </div>
            <div className="luxe-skeleton luxe-skeleton--dark" style={{ height: 380, width: "100%", borderRadius: 14 }} />
          </div>
          <span className="sr-only">Loading hotel…</span>
        </div>
      </div>
    );
  }

  /* ── Still loading data via the rates fallback? Keep skeleton up. ──
     The detail fetch (`/api/hotels/<id>`) often 404s for the slug-shortid
     URL format and flips `loading=false` immediately. The slower rates
     fetch is the one that actually populates `hotel` via fallback. Only
     declare "not found" once the rates flow has truly resolved (loaded,
     errored, or marked no_match) without giving us a hotel. */
  const ratesResolved =
    !ratesLoading && (rates !== null || noMatch || ratesError !== null);
  if (!hotel && !ratesResolved) {
    return (
      <div
        className="luxe min-h-screen flex items-center justify-center"
        style={{ background: "var(--luxe-black)" }}
      >
        <div className="luxe-skeleton luxe-skeleton--dark" style={{ height: 80, width: 240, borderRadius: 8 }} />
        <span className="sr-only">Loading hotel…</span>
      </div>
    );
  }

  /* ── Not found ── (rates flow finished without a hotel) */
  if (!hotel) {
    return (
      <div
        className="luxe min-h-screen flex items-center justify-center"
        style={{ background: "var(--luxe-black)" }}
      >
        <div className="text-center max-w-md px-6">
          <div
            className="text-7xl mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              color: "var(--luxe-champagne)",
              opacity: 0.4,
            }}
          >
            404
          </div>
          <p className="text-lg mb-2" style={{ color: "var(--luxe-soft-white)" }}>Hotel not found</p>
          <p className="text-sm mb-8" style={{ color: "var(--luxe-soft-white-50)" }}>
            This property may have been removed or the link is invalid.
          </p>
          <Link href="/" className="luxe-btn-gold">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  const address = [hotel.addressline1, hotel.city, hotel.country].filter(Boolean).join(", ");
  const datesSelected = !!(booking.checkIn && booking.checkOut);
  const heroSavePercent = savingsPct != null && savingsPct > 0 ? savingsPct : null;
  const heroImage = photos.length > 0 ? safePhotoUrl(photos[0]) : FALLBACK_IMG;

  /* Sidebar derived values */
  const sidebarNightly = selectedPlan ? selectedPlan.total_price / Math.max(nights, 1) : 0;
  const sidebarTotal = selectedPlan ? selectedPlan.total_price : 0;
  const sidebarMarket = selectedPlan && mrpRate && mrpRate > selectedPlan.total_price ? mrpRate : 0;
  const sidebarSaving = sidebarMarket - sidebarTotal;

  /* Lowest from-rate for sticky bottom bar */
  const lowestFromRate = rates && rates.rates.length > 0
    ? Math.min(...rates.rates.map((r) => r.total_price / Math.max(nights, 1)))
    : null;

  return (
    <div className="luxe min-h-screen" style={{ background: "var(--luxe-black)", color: "var(--luxe-soft-white)", overflowX: "hidden" }}>
      {/* ═══════════════════ Lightbox ═══════════════════ */}
      <AnimatePresence>
        {lightboxOpen && lightboxPhotos.length > 0 && (
          <Lightbox
            photos={lightboxPhotos}
            index={lightboxIdx}
            onClose={closeLightbox}
            onPrev={prevLightbox}
            onNext={nextLightbox}
          />
        )}
      </AnimatePresence>

      <Header />

      {/* ═══════════════════ 1. JOURNEY HEADER — MMT-style search utility bar + 65/35 above-the-fold ═══════════════════
         "Hotel journey 2" revision:
         - top sticky MMT-style Search Utility Bar with 4 explicit segments
           (Location · Check-in · Check-out · Guests) on a single #1A1A1A
           dark-grey bar, separated by thin grey vertical dividers, plus a
           small "Search" CTA on the far right that scrolls to rates.
         - 2-col container (max-w 1280px / Tailwind 7xl) below:
             LEFT 65%: 3-image gallery only (1 large + 2 stacked)
             RIGHT 35%: sticky Booking Card — hotel name, star rating,
                        current price, primary 'Book Now' CTA.
         No full-bleed hero image; #0A0A0A pure-black throughout, gold accents.
         The whole block sits in its own wrapper so the search bar's `position:
         sticky` is bounded by this section — once the user scrolls into the
         trust strip / tab bar / rates region below, the search bar releases
         and the existing tab bar takes over the sticky channel.
      */}
      <div style={{ background: "#0A0A0A", paddingTop: 60 }}>
        {/* ── Sticky MMT-style Search Utility Bar (above the photo gallery) ── */}
        <div
          style={{
            position: "sticky",
            top: 60,
            zIndex: 50,
            background: "#0A0A0A",
            borderBottom: "1px solid var(--luxe-hairline-strong)",
            padding: "12px 24px",
          }}
        >
          <div className="luxe-container hotel-journey-searchbar" style={{ padding: 0 }}>
            <HotelSearchUtilityBar city={hotel.city} />
          </div>
        </div>

        {/* ── 2-col main grid: gallery (65%) | Booking Card (35%) ── */}
        <section
          style={{
            background: "#0A0A0A",
            padding: "32px 24px 64px",
          }}
        >
          <div
            className="luxe-container hotel-journey-grid"
            style={{
              padding: 0,
              display: "grid",
              gridTemplateColumns: "minmax(0, 65fr) minmax(0, 35fr)",
              gap: 32,
              alignItems: "start",
            }}
          >
            {/* ── LEFT 65%: 3-image gallery (1 large + 2 stacked) ── */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ minWidth: 0 }}
            >
              {/* 3-image grid: 1 large left, 2 small stacked right */}
              <div
                className="hotel-journey-gallery"
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gridTemplateRows: "1fr 1fr",
                  gap: 8,
                  height: "min(520px, 60vh)",
                  borderRadius: 14,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Large left photo (spans 2 rows) */}
                <button
                  onClick={() => openLightbox(0)}
                  aria-label="Open gallery"
                  style={{
                    gridRow: "span 2",
                    background: `url(${heroImage}) center/cover no-repeat`,
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    minHeight: 0,
                  }}
                />
                {/* Top-right small */}
                <button
                  onClick={() => openLightbox(Math.min(1, photos.length - 1))}
                  aria-label="Open gallery"
                  style={{
                    background: `url(${photos[1] ? safePhotoUrl(photos[1]) : (photos[0] ? safePhotoUrl(photos[0]) : FALLBACK_IMG)}) center/cover no-repeat`,
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    minHeight: 0,
                  }}
                />
                {/* Bottom-right small with "View all" overlay */}
                <button
                  onClick={() => openLightbox(Math.min(2, photos.length - 1))}
                  aria-label={photos.length > 3 ? `View all ${photos.length} photos` : "Open gallery"}
                  style={{
                    position: "relative",
                    background: `url(${photos[2] ? safePhotoUrl(photos[2]) : (photos[0] ? safePhotoUrl(photos[0]) : FALLBACK_IMG)}) center/cover no-repeat`,
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    minHeight: 0,
                  }}
                >
                  {photos.length > 3 && (
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(10,10,10,0.55)",
                        backdropFilter: "blur(2px)",
                        WebkitBackdropFilter: "blur(2px)",
                        color: "#f7f5f2",
                        fontSize: 12,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                      }}
                    >
                      + {photos.length - 3} photos
                    </span>
                  )}
                </button>

                {/* "View all" pill (bottom-right of gallery) */}
                {photos.length > 1 && (
                  <button
                    onClick={() => openLightbox(0)}
                    style={{
                      position: "absolute",
                      bottom: 12,
                      right: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      background: "rgba(10,10,10,0.75)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      color: "#f7f5f2",
                      fontSize: 11,
                      letterSpacing: "0.18em",
                      fontFamily: "var(--font-mono)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: 999,
                      cursor: "pointer",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                    aria-label="View all photos"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    View all · {photos.length}
                  </button>
                )}
              </div>
            </motion.div>

            {/* ── RIGHT 35%: Sticky Booking Card — name, stars, price, Book Now ── */}
            <motion.aside
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="hotel-journey-quickbook"
              style={{
                position: "sticky",
                top: 144,
                alignSelf: "start",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  background: "#14120f",
                  border: "1px solid var(--luxe-hairline-strong)",
                  borderRadius: 14,
                  padding: 24,
                }}
              >
                {/* Header row: location eyebrow + heart */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    gap: 12,
                  }}
                >
                  <div className="luxe-tech" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {hotel.city.toUpperCase()}
                    {hotel.country && (
                      <>
                        <span style={{ margin: "0 6px", opacity: 0.5 }}>·</span>
                        <span style={{ color: "var(--luxe-soft-white-50)" }}>
                          {hotel.country.toUpperCase()}
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleHeartClick}
                    aria-label={isSaved ? "Remove from saved hotels" : "Save this hotel"}
                    aria-pressed={isSaved}
                    style={{
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--luxe-hairline-strong)",
                      color: isSaved ? "#C9A961" : "var(--luxe-soft-white-70)",
                      cursor: "pointer",
                      transition: "color 0.15s, background 0.15s",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>

                {/* Hotel name (display italic) */}
                <h1
                  className="luxe-display"
                  style={{
                    fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
                    fontSize: "clamp(26px, 2.4vw, 34px)",
                    fontWeight: 300,
                    fontStyle: "italic",
                    lineHeight: 1.1,
                    color: "var(--luxe-soft-white)",
                    margin: "0 0 12px",
                    letterSpacing: "-0.015em",
                  }}
                >
                  {hotel.hotel_name}
                </h1>

                {/* Star rating + review average pills */}
                {(starDisplay || hotel.rating_average > 0) && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 18,
                    }}
                  >
                    {starDisplay && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "var(--luxe-champagne-soft)",
                          border: "1px solid var(--luxe-champagne-line)",
                          color: "#C9A961",
                          fontSize: 10,
                          letterSpacing: "0.14em",
                          fontWeight: 600,
                        }}
                      >
                        {starDisplay}
                      </span>
                    )}
                    {hotel.rating_average > 0 && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid var(--luxe-hairline-strong)",
                          color: "var(--luxe-soft-white)",
                          fontSize: 10,
                          fontWeight: 500,
                        }}
                      >
                        <span style={{ color: "#C9A961" }}>{hotel.rating_average.toFixed(1)}</span>
                        <span style={{ color: "var(--luxe-soft-white-50)" }}>/ 10</span>
                        {hotel.number_of_reviews > 0 && (
                          <span style={{ color: "var(--luxe-soft-white-50)" }}>
                            · {hotel.number_of_reviews.toLocaleString()}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                )}

                {/* Hairline divider before price */}
                <div
                  style={{
                    height: 1,
                    background: "var(--luxe-hairline-strong)",
                    margin: "0 0 18px",
                  }}
                />


                {/* Price block — the most prominent text in the sidebar */}
                {(() => {
                  const fromAmount =
                    lowestFromRate != null
                      ? lowestFromRate
                      : hotel.rates_from != null
                        ? hotel.rates_from
                        : null;
                  const fromCurrency =
                    rates && rates.rates.length > 0
                      ? rates.rates[0].currency
                      : hotel.rates_currency || "INR";

                  if (fromAmount != null) {
                    return (
                      <>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: "var(--luxe-soft-white-50)",
                            fontWeight: 600,
                            marginBottom: 8,
                          }}
                        >
                          Starting From
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
                            fontStyle: "italic",
                            fontWeight: 300,
                            fontSize: 52,
                            lineHeight: 1,
                            letterSpacing: "-0.025em",
                            color: "#FFFFFF",
                          }}
                        >
                          {formatPrice(fromAmount, fromCurrency)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            fontFamily: "var(--font-body)",
                            color: "var(--luxe-soft-white-50)",
                            marginTop: 6,
                          }}
                        >
                          per night, before taxes
                        </div>
                        {heroSavePercent != null && (
                          <div
                            style={{
                              marginTop: 14,
                              display: "inline-flex",
                              padding: "5px 12px",
                              borderRadius: 999,
                              background: "var(--luxe-champagne-soft)",
                              border: "1px solid var(--luxe-champagne-line)",
                              color: "#C9A961",
                              fontSize: 11,
                              fontWeight: 600,
                              letterSpacing: "0.08em",
                            }}
                          >
                            Members save up to {heroSavePercent}%
                          </div>
                        )}
                      </>
                    );
                  }

                  if (datesSelected) {
                    return (
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          fontSize: 18,
                          color: "var(--luxe-soft-white-70)",
                          lineHeight: 1.4,
                        }}
                      >
                        Loading rates…
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontStyle: "italic",
                        fontSize: 18,
                        color: "var(--luxe-soft-white-70)",
                        lineHeight: 1.4,
                      }}
                    >
                      Pick dates to see rates
                    </div>
                  );
                })()}

                {/* Trust factors — small green checkmarks above the CTA.
                   Replaces the page's floating trust icons; keeps the user
                   focused on price + the single primary action below. */}
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "22px 0 0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {[
                    "Free Cancellation",
                    "Member Rate Included",
                    "No Booking Fees",
                  ].map((label) => (
                    <li
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        fontSize: 12,
                        fontFamily: "var(--font-body)",
                        color: "var(--luxe-soft-white-70)",
                        lineHeight: 1.3,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#5FB476"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                        style={{ flexShrink: 0 }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {label}
                    </li>
                  ))}
                </ul>

                {/* Book Now CTA — primary gold, scrolls to rates picker */}
                <button
                  onClick={() => document.getElementById("rates")?.scrollIntoView({ behavior: "smooth" })}
                  className="luxe-btn-gold"
                  style={{
                    width: "100%",
                    marginTop: 14,
                    padding: "14px 20px",
                    fontSize: 12,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                  aria-label="Book Now"
                >
                  Book Now
                </button>
              </div>
            </motion.aside>
          </div>
        </section>
      </div>

      {/* ═══════════════════ 2. STICKY TAB BAR ═══════════════════ */}
      <div
        className="overflow-x-auto"
        style={{
          position: "sticky",
          top: 60,
          zIndex: 40,
          background: "rgba(12,11,10,0.86)",
          borderBottom: "1px solid var(--luxe-hairline)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          padding: "12px 24px",
        }}
      >
        <div
          className="luxe-container"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            padding: 0,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", overflowX: "auto" }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={activeTab === tab ? "luxe-tab is-active" : "luxe-tab"}
                style={{ flexShrink: 0 }}
              >
                {tab}
              </button>
            ))}
          </div>

          {datesSelected && (
            <div
              className="hotel-tab-dates"
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--luxe-soft-white-70)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--luxe-champagne)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>
                {formatDateLabel(booking.checkIn)} – {formatDateLabel(booking.checkOut)} · {booking.guestSummary}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════ 4. OVERVIEW (sub-nav + about + particulars + amenities) ═══════════════════ */}
      <section
        ref={stayRef}
        id="the-stay"
        style={{
          padding: "56px 24px 48px",
          scrollMarginTop: 140,
        }}
      >
        <div className="luxe-container" style={{ padding: 0 }}>
          {/* ── Quick-links sub-nav ── thin in-page anchors */}
          <nav
            aria-label="Section quick links"
            className="hotel-quicklinks no-scrollbar"
            style={{
              display: "flex",
              gap: 4,
              padding: "6px",
              marginBottom: 36,
              borderRadius: 999,
              border: "1px solid var(--luxe-hairline-strong)",
              background: "rgba(255,255,255,0.025)",
              overflowX: "auto",
              width: "fit-content",
              maxWidth: "100%",
            }}
          >
            {[
              { label: "Overview", target: stayRef as React.RefObject<HTMLElement | null> },
              { label: "Rooms", target: roomsAnchorRef as React.RefObject<HTMLElement | null> },
              { label: "Amenities", target: amenitiesAnchorRef as React.RefObject<HTMLElement | null> },
              { label: "Reviews", target: reviewsRef as React.RefObject<HTMLElement | null> },
              { label: "Map", target: mapRef as React.RefObject<HTMLElement | null> },
            ].map(({ label, target }) => (
              <button
                key={label}
                type="button"
                onClick={() => target.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                style={{
                  flexShrink: 0,
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: "transparent",
                  border: "none",
                  color: "var(--luxe-soft-white-70)",
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "color 0.2s ease, background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#C9A961";
                  e.currentTarget.style.background = "rgba(201,169,97,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--luxe-soft-white-70)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* ── 2-column: Left = About the Hotel · Right = compact Hotel Facts ── */}
          <div
            className="hotel-about-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
              gap: 36,
              alignItems: "start",
            }}
          >
            {/* Left column: About the Hotel — description clamped to 4 lines + Read More */}
            <div style={{ minWidth: 0 }}>
              <div className="luxe-tech" style={{ marginBottom: 12 }}>
                About the Hotel
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: "normal",
                  fontSize: 26,
                  lineHeight: "30px",
                  color: "#f5f1e8",
                  margin: "0 0 16px",
                }}
              >
                {hotel.editorial_headline ?? hotel.hotel_name}
              </h2>
              {editorialIntro && (
                <CollapsibleText
                  text={editorialIntro}
                  scrollTargetRef={stayRef}
                  bodyStyle={{
                    fontFamily: "var(--font-body)",
                    fontSize: 16,
                    lineHeight: "26px",
                    color: "rgba(255,255,255,0.78)",
                    margin: 0,
                  }}
                />
              )}
            </div>

            {/* Right column: compact Hotel Facts list */}
            {(hotel.checkin || hotel.checkout || hotel.accommodation_type || hotel.numberrooms || hotel.yearrenovated || hotel.yearopened || (hotel.brand_name && !hotel.chain_name)) && (
              <div
                className="luxe-card"
                style={{
                  padding: 20,
                  borderRadius: 14,
                }}
              >
                <div className="luxe-tech" style={{ marginBottom: 14 }}>
                  Hotel Facts
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {hotel.checkin && (
                    <FactRow label="Check-in" value={hotel.checkin} />
                  )}
                  {hotel.checkout && (
                    <FactRow label="Check-out" value={hotel.checkout} />
                  )}
                  {hotel.accommodation_type && (
                    <FactRow label="Property Type" value={hotel.accommodation_type} />
                  )}
                  {hotel.numberrooms && (
                    <FactRow label="Rooms & Suites" value={String(hotel.numberrooms)} />
                  )}
                  {hotel.yearrenovated && (
                    <FactRow label="Last Renovated" value={String(hotel.yearrenovated)} />
                  )}
                  {hotel.yearopened && (
                    <FactRow label="Year Opened" value={String(hotel.yearopened)} />
                  )}
                  {hotel.brand_name && !hotel.chain_name && (
                    <FactRow label="Brand" value={hotel.brand_name} />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Amenities — 3-per-row monochromatic icon grid (lifted out of About) ── */}
          <div
            ref={amenitiesAnchorRef}
            id="amenities"
            style={{ marginTop: 40, scrollMarginTop: 140 }}
          >
            <div className="luxe-tech" style={{ marginBottom: 16 }}>
              Amenities
            </div>
            <AmenitiesIconGrid
              amenities={hotel.amenities}
              restaurants_count={hotel.restaurants_count}
              room_service_24h={hotel.room_service_24h}
            />
          </div>

          {/* ── At-a-glance facts (kept) ── */}
          <div style={{ marginTop: 40 }}>
            <HotelFactGrid
              neighbourhood={hotel.neighbourhood}
              city={hotel.city}
              airport_iata={hotel.airport_iata}
              airport_distance_min={hotel.airport_distance_min}
              attraction_nearest={hotel.attraction_nearest}
              numberrooms={hotel.numberrooms}
              rooms_description={hotel.rooms_description}
              restaurants_count={hotel.restaurants_count}
              room_service_24h={hotel.room_service_24h}
              signature_restaurant={hotel.signature_restaurant}
              amenities={hotel.amenities}
              parking_type={hotel.parking_type}
              shuttle_type={hotel.shuttle_type}
              languages={hotel.languages}
            />
          </div>

          {/* ── Rooms / Dining / Business prose (anchor target for "Rooms") ── */}
          {hotel.tj_description && (
            hotel.tj_description.rooms ||
            hotel.tj_description.dining ||
            hotel.tj_description.amenities ||
            hotel.tj_description.business_amenities
          ) && (
            <div
              ref={roomsAnchorRef}
              id="rooms-detail"
              style={{
                marginTop: 40,
                scrollMarginTop: 140,
                display: "flex",
                flexDirection: "column",
                gap: 28,
              }}
            >
              {[
                { key: "rooms", label: "The Rooms" },
                { key: "dining", label: "Dining" },
                { key: "amenities", label: "Amenities & Recreation" },
                { key: "business_amenities", label: "For Business" },
              ].map(({ key, label }) => {
                const text = hotel.tj_description?.[key as keyof NonNullable<typeof hotel.tj_description>];
                if (!text) return null;
                return (
                  <CollapsibleText
                    key={key}
                    label={
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 500,
                          fontSize: 11,
                          lineHeight: "14px",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "#C9A961",
                          margin: "0 0 10px",
                        }}
                      >
                        {label}
                      </p>
                    }
                    text={text}
                    bodyStyle={{
                      fontFamily: "var(--font-body)",
                      fontSize: 15,
                      lineHeight: "25px",
                      color: "rgba(255,255,255,0.78)",
                      margin: 0,
                    }}
                  />
                );
              })}
            </div>
          )}

          {hotel.concierge_note && (
            <div style={{ marginTop: 32 }}>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontVariant: "small-caps",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "#C9A961",
                  margin: "0 0 12px",
                }}
              >
                WHY OUR CONCIERGE LOVES IT
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 17,
                  lineHeight: "26px",
                  color: "rgba(255,255,255,0.85)",
                  margin: 0,
                }}
              >
                {hotel.concierge_note}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ 5. RATES (CLIMAX) — two-column with sticky sidebar ═══════════════════ */}
      <section
        ref={ratesRef}
        id="rates"
        style={{
          padding: "72px 24px 96px",
          borderTop: "1px solid var(--luxe-hairline)",
          scrollMarginTop: 140,
          background: "linear-gradient(180deg, rgba(200,170,118,0.03) 0%, transparent 60%)",
        }}
      >
        <div className="luxe-container" style={{ padding: 0 }}>
          <SectionHead
            eyebrow="Live Member Rates"
            title="Your"
            italicWord="preferred"
            trailingTitle="rate"
            description={
              datesSelected
                ? "Negotiated directly with the hotel."
                : "Pick your dates and guests below to unlock live, member-only pricing."
            }
          />

          {/* Plan-your-stay hub — editable dates + guests, always visible */}
          <div
            className="hotel-booking-hub"
            style={{
              marginBottom: 32,
              padding: "22px 26px",
              borderRadius: 16,
              border: "1px solid var(--luxe-hairline-strong)",
              background:
                "linear-gradient(135deg, rgba(201,169,97,0.08) 0%, rgba(20,18,15,0.55) 65%)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "var(--luxe-champagne)",
                    margin: 0,
                    marginBottom: 4,
                    fontWeight: 600,
                  }}
                >
                  Plan your stay
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: 22,
                    fontWeight: 500,
                    lineHeight: 1.2,
                    color: "var(--luxe-soft-white)",
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {datesSelected ? "Your dates" : "When are you visiting?"}
                </h3>
              </div>
              {datesSelected && nights > 0 && (
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--luxe-champagne)",
                    padding: "6px 14px",
                    border: "1px solid var(--luxe-champagne)",
                    borderRadius: 999,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                  }}
                >
                  {nights} night{nights > 1 ? "s" : ""}
                </div>
              )}
            </div>
            <HotelDateEditor />
          </div>

          <div
            className="hotel-rates-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 380px",
              gap: 36,
            }}
          >
            {/* ─── Left: Rate cards ─── */}
            <div>
              {!datesSelected ? (
                <div
                  className="luxe-card"
                  style={{
                    padding: "44px 32px",
                    textAlign: "center",
                    borderRadius: 14,
                    border: "1px dashed var(--luxe-hairline-strong)",
                    background: "rgba(255,255,255,0.015)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "var(--luxe-champagne)",
                      margin: 0,
                      marginBottom: 10,
                      fontWeight: 600,
                    }}
                  >
                    Awaiting dates
                  </p>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 22,
                      fontStyle: "italic",
                      color: "var(--luxe-soft-white)",
                      marginBottom: 8,
                      lineHeight: 1.3,
                    }}
                  >
                    Pick your dates to reveal rates
                  </div>
                  <p style={{ fontSize: 13.5, color: "var(--luxe-soft-white-70)", maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>
                    Use the date picker above. We&rsquo;ll fetch live, member-only pricing for {hotel.hotel_name} the moment you do.
                  </p>
                </div>
              ) : noMatch ? (
                <div
                  className="luxe-card"
                  style={{
                    padding: "32px 28px",
                    borderRadius: 14,
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div style={{ width: 4, height: 26, background: "var(--luxe-champagne)", flexShrink: 0 }} />
                    <h3
                      className="luxe-display"
                      style={{ fontSize: 22, marginBottom: 0 }}
                    >
                      Rates <em>on request</em>
                    </h3>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--luxe-soft-white-70)", lineHeight: 1.75, marginBottom: 22, maxWidth: 600 }}>
                    Our concierge will source the best possible rate for {hotel.hotel_name} and reach you on WhatsApp within 15 minutes.
                  </p>
                  <button
                    onClick={() => setUnlockModalOpen(true)}
                    className="luxe-btn-gold"
                  >
                    Contact concierge
                  </button>
                </div>
              ) : ratesError ? (
                <div className="luxe-card" style={{ padding: 28, textAlign: "center", borderRadius: 14 }}>
                  <p style={{ fontSize: 15, color: "var(--luxe-soft-white)", marginBottom: 8, fontFamily: "var(--font-display)", fontStyle: "italic" }}>
                    Rates unavailable right now
                  </p>
                  <p style={{ fontSize: 12, color: "var(--luxe-soft-white-50)", marginBottom: 18 }}>
                    {ratesError}
                  </p>
                  <button
                    onClick={() => setRatesRefreshKey((k) => k + 1)}
                    className="luxe-btn-secondary"
                  >
                    Retry
                  </button>
                </div>
              ) : ratesLoading ? (
                <div className="flex flex-col gap-4">
                  <RateCardSkeleton />
                  <RateCardSkeleton />
                  <RateCardSkeleton />
                </div>
              ) : rates && rates.rates.length === 0 ? (
                <div
                  className="luxe-card"
                  style={{ padding: 28, textAlign: "center", borderRadius: 14, color: "var(--luxe-soft-white-70)", fontFamily: "var(--font-body)" }}
                >
                  No rates for these dates — try different dates.
                </div>
              ) : rates ? (
                <>
                  <RateFilterBar
                    freeCancellation={filterFreeCancellation}
                    onToggleFreeCancellation={() => setFilterFreeCancellation((v) => !v)}
                    mealPlan={filterMealPlan}
                    onChangeMealPlan={setFilterMealPlan}
                  />

                  {filteredRates.length === 0 ? (
                    <div
                      className="luxe-card"
                      style={{ padding: 28, textAlign: "center", borderRadius: 14, color: "var(--luxe-soft-white-70)", fontFamily: "var(--font-body)" }}
                    >
                      No rates match the current filters. Try clearing a filter to see more options.
                    </div>
                  ) : (
                    <>
                      <p
                        style={{
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "var(--luxe-soft-white-50)",
                          marginBottom: 14,
                        }}
                      >
                        {categories.length} room type{categories.length !== 1 ? "s" : ""}
                        {filteredRates.length > categories.length ? ` · ${filteredRates.length} rate plans` : ""}
                        {rates.nights > 0 ? ` · ${rates.nights} night${rates.nights > 1 ? "s" : ""}` : ""}
                      </p>
                      <div
                        style={{
                          background: "#141312",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 12,
                          overflow: "hidden",
                        }}
                      >
                        {categories.map((category, idx) => {
                          const isExpanded = expandedCategory === category.name;
                          const photo = [hotel.photo1, hotel.photo2, hotel.photo3, hotel.photo4]
                            .filter((p): p is string => Boolean(p))[idx % 4] || hotel.photo1 || FALLBACK_IMG;
                          const planCount = category.plans.length;
                          const variantsPreview = category.variants.slice(0, 3);
                          return (
                            <RoomCategoryCard
                              key={category.name}
                              category={category}
                              photoUrl={safePhotoUrl(photo)}
                              isExpanded={isExpanded}
                              onToggle={() =>
                                setExpandedCategory(isExpanded ? null : category.name)
                              }
                              planCount={planCount}
                              variantsPreview={variantsPreview}
                              nights={rates.nights || nights}
                              isFirst={idx === 0}
                            >
                              {isExpanded && (
                                <div className="flex flex-col gap-3" style={{ marginTop: 16 }}>
                                  {category.plans.map((plan) => (
                                    <RateCard
                                      key={plan.option_id}
                                      plan={plan}
                                      nights={rates.nights || nights}
                                      mrpRate={mrpRate}
                                      mrpCurrency={mrpCurrency}
                                      savingsPct={savingsPct}
                                      isSelected={selectedOptionId === plan.option_id}
                                      isHighlighted={highlightedOptionId === plan.option_id}
                                      cardRef={(el) => { rateCardRefs.current[plan.option_id] = el; }}
                                      onSelect={() =>
                                        setSelectedOptionId(selectedOptionId === plan.option_id ? null : plan.option_id)
                                      }
                                      onProceed={() => handlePlanSelectCTA(plan)}
                                    />
                                  ))}
                                </div>
                              )}
                            </RoomCategoryCard>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              ) : null}
            </div>

            {/* ─── Right: Sticky Booking Sidebar ─── */}
            <aside className="hidden lg:block">
              <div
                className="hotel-booking-sidebar"
                style={{
                  position: "sticky",
                  top: 140,
                  background: "rgba(20,18,15,0.6)",
                  border: "1px solid var(--luxe-hairline-strong)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid var(--luxe-hairline)",
                  }}
                >
                  <div className="luxe-tech" style={{ marginBottom: 8 }}>
                    Your Selection
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 20,
                      fontWeight: 500,
                      fontStyle: "italic",
                      lineHeight: 1.2,
                      color: "var(--luxe-soft-white)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {hotel.hotel_name}
                  </h3>
                </div>

                <div style={{ padding: "22px 24px" }}>
                  {!selectedPlan ? (
                    <div className="text-center" style={{ padding: "12px 0 8px" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--luxe-champagne)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px", opacity: 0.7 }}>
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <p style={{ fontSize: 13, color: "var(--luxe-soft-white-70)", lineHeight: 1.6 }}>
                        {datesSelected ? "Select a room to unlock your rate" : "Select dates to see live rates"}
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      key={selectedPlan.option_id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 16,
                          fontWeight: 500,
                          fontStyle: "italic",
                          color: "var(--luxe-soft-white)",
                          marginBottom: 6,
                          lineHeight: 1.3,
                        }}
                      >
                        {selectedPlan.room_name}
                      </p>
                      <p
                        style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "var(--luxe-champagne)",
                          marginBottom: 18,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {formatMealBasis(selectedPlan.meal_basis)}
                      </p>

                      <div className="flex items-baseline justify-between mb-2">
                        <span style={{ fontSize: 13, color: "var(--luxe-soft-white-70)" }}>Voyagr rate</span>
                        <span
                          style={{
                            fontSize: 22,
                            fontWeight: 500,
                            fontFamily: "var(--font-display)",
                            color: "var(--luxe-champagne)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {formatPrice(sidebarNightly, selectedPlan.currency)}
                        </span>
                      </div>

                      {sidebarMarket > 0 && (
                        <div className="flex items-baseline justify-between mb-2">
                          <span style={{ fontSize: 12, color: "var(--luxe-soft-white-50)" }}>Public rate</span>
                          <span
                            style={{
                              fontSize: 13,
                              color: "var(--luxe-soft-white-50)",
                              textDecoration: "line-through",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {formatPrice(sidebarMarket, mrpCurrency || selectedPlan.currency)}
                          </span>
                        </div>
                      )}

                      <div
                        className="flex items-baseline justify-between mb-4"
                        style={{
                          paddingBottom: 16,
                          borderBottom: "1px solid var(--luxe-hairline)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: selectedPlan.refundable ? "var(--luxe-champagne)" : "var(--luxe-soft-white-50)",
                            fontWeight: selectedPlan.refundable ? 600 : 500,
                          }}
                        >
                          {selectedPlan.refundable ? "✓ Free cancellation" : "Non-refundable"}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between mb-2">
                        <span style={{ fontSize: 13, color: "var(--luxe-soft-white-70)" }}>
                          {nights} night{nights > 1 ? "s" : ""} × {formatPrice(sidebarNightly, selectedPlan.currency)}
                        </span>
                        <span style={{ fontSize: 13, color: "var(--luxe-soft-white-70)", fontFamily: "var(--font-mono)" }}>
                          {formatPrice(sidebarTotal, selectedPlan.currency)}
                        </span>
                      </div>

                      <div
                        className="flex items-baseline justify-between"
                        style={{
                          paddingTop: 14,
                          borderTop: "1px solid var(--luxe-hairline)",
                          marginTop: 8,
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--luxe-soft-white)", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "var(--font-body)" }}>
                          Total
                        </span>
                        <span
                          style={{
                            fontSize: 26,
                            fontWeight: 500,
                            fontFamily: "var(--font-display)",
                            color: "var(--luxe-champagne)",
                            letterSpacing: "-0.015em",
                          }}
                        >
                          {formatPrice(sidebarTotal, selectedPlan.currency)}
                        </span>
                      </div>

                      {sidebarSaving > 0 && (
                        <p
                          className="text-right"
                          style={{
                            fontSize: 12,
                            color: "var(--luxe-champagne)",
                            fontWeight: 500,
                            marginTop: 6,
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          You save {formatPrice(sidebarSaving, mrpCurrency || selectedPlan.currency)}
                        </p>
                      )}
                    </motion.div>
                  )}

                  <button
                    disabled={!selectedPlan}
                    onClick={() => {
                      if (selectedPlan) setUnlockModalOpen(true);
                    }}
                    className={selectedPlan ? "unlock-rate-btn-pulse" : ""}
                    style={{
                      width: "100%",
                      marginTop: 22,
                      padding: "14px 0",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      borderRadius: 999,
                      background: selectedPlan ? "var(--luxe-champagne)" : "rgba(255,255,255,0.05)",
                      color: selectedPlan ? "var(--luxe-black)" : "var(--luxe-soft-white-50)",
                      border: selectedPlan ? "none" : "1px solid var(--luxe-hairline-strong)",
                      cursor: selectedPlan ? "pointer" : "not-allowed",
                      transition: "all 0.3s",
                      fontFamily: "var(--font-body)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    {selectedPlan ? "Unlock Preferred Rate" : "Select a Room"}
                  </button>

                  <p
                    className="text-center"
                    style={{
                      fontSize: 11,
                      color: "var(--luxe-soft-white-50)",
                      marginTop: 12,
                      lineHeight: 1.6,
                      letterSpacing: "0.02em",
                    }}
                  >
                    No payment required &middot; Concierge confirms on WhatsApp in 15 min
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 8. LOCATION CARD — compact 2-col (address+landmarks / small map preview) ═══════════════════ */}
      {(address || (hotel.latitude != null && hotel.longitude != null)) && (() => {
        const mapsQuery = encodeURIComponent(address || `${hotel.latitude},${hotel.longitude}`);
        const mapsHref = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
        const embedSrc =
          hotel.latitude != null && hotel.longitude != null
            ? `https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}&z=14&output=embed`
            : `https://www.google.com/maps?q=${mapsQuery}&z=14&output=embed`;

        const landmarks: { label: string; value: string }[] = [];
        if (hotel.airport_iata && hotel.airport_distance_min != null) {
          landmarks.push({
            label: `${hotel.airport_iata} Airport`,
            value: `${hotel.airport_distance_min} min drive`,
          });
        } else if (hotel.airport_distance_min != null) {
          landmarks.push({ label: "Nearest airport", value: `${hotel.airport_distance_min} min drive` });
        }
        if (hotel.attraction_nearest) {
          landmarks.push({ label: "Nearest landmark", value: hotel.attraction_nearest });
        }
        if (hotel.neighbourhood) {
          landmarks.push({ label: "Neighbourhood", value: hotel.neighbourhood });
        } else if (hotel.city) {
          landmarks.push({ label: "City", value: hotel.city });
        }

        return (
          <section
            ref={mapRef}
            id="map"
            style={{
              padding: "56px 24px 40px",
              borderTop: "1px solid var(--luxe-hairline)",
              scrollMarginTop: 140,
            }}
          >
            <div className="luxe-container" style={{ padding: 0 }}>
              <SectionHead
                eyebrow="Location"
                title="Where you'll"
                italicWord="be"
                rightSlot={
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="luxe-tech"
                    style={{
                      color: "var(--luxe-champagne)",
                      textDecoration: "none",
                    }}
                  >
                    Open in Maps &rarr;
                  </a>
                }
              />

              <div
                className="hotel-location-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                  gap: 20,
                  alignItems: "stretch",
                }}
              >
                {/* Left — address + landmarks */}
                <div
                  className="luxe-card"
                  style={{
                    padding: 24,
                    borderRadius: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div>
                    <div className="luxe-tech" style={{ marginBottom: 8 }}>
                      The Address
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontStyle: "italic",
                        fontSize: 19,
                        lineHeight: 1.4,
                        color: "var(--luxe-soft-white)",
                        letterSpacing: "-0.005em",
                        margin: 0,
                      }}
                    >
                      {address || `${hotel.city}, ${hotel.country}`}
                    </p>
                  </div>

                  {landmarks.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--luxe-hairline)", paddingTop: 14 }}>
                      <div className="luxe-tech" style={{ marginBottom: 10 }}>
                        Distances &amp; Landmarks
                      </div>
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {landmarks.map((l) => (
                          <li
                            key={l.label}
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              justifyContent: "space-between",
                              gap: 12,
                              fontSize: 13,
                            }}
                          >
                            <span style={{ color: "var(--luxe-soft-white-50)" }}>{l.label}</span>
                            <span
                              style={{
                                color: "var(--luxe-soft-white)",
                                fontWeight: 500,
                                textAlign: "right",
                              }}
                            >
                              {l.value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right — small map preview (50% the previous height) */}
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${hotel.hotel_name} location in Google Maps`}
                  className="hotel-location-map"
                  style={{
                    position: "relative",
                    display: "block",
                    height: 190,
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "1px solid var(--luxe-hairline-strong)",
                    background: "var(--luxe-black-2)",
                    textDecoration: "none",
                  }}
                >
                  <iframe
                    title={`${hotel.hotel_name} location`}
                    src={embedSrc}
                    width="100%"
                    height="100%"
                    style={{
                      border: 0,
                      display: "block",
                      filter: "saturate(0.7) brightness(0.9) contrast(0.95)",
                      pointerEvents: "none",
                    }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </a>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ═══════════════════ 9. REVIEWS — 3-col snippet grid ═══════════════════ */}
      <section
        ref={reviewsRef}
        id="reviews"
        style={{
          padding: "72px 24px 80px",
          borderTop: "1px solid var(--luxe-hairline)",
          scrollMarginTop: 140,
        }}
      >
        <div className="luxe-container" style={{ padding: 0 }}>
          {hotel.rating_average > 0 ? (() => {
            const overall = hotel.rating_average;
            const tier =
              overall >= 9
                ? "Exceptional"
                : overall >= 8
                  ? "Excellent"
                  : overall >= 7
                    ? "Very Good"
                    : "Good";

            const verdict = (theme: "service" | "location" | "value", score: number | null) => {
              const s = score ?? overall;
              if (theme === "service") {
                return s >= 9
                  ? "Staff anticipated every need — from the welcome at the door to the last detail before checkout."
                  : s >= 8
                    ? "Warm, attentive service throughout the stay. Requests handled quickly and graciously."
                    : "Friendly team, with thoughtful touches that elevate the everyday moments.";
              }
              if (theme === "location") {
                return s >= 9
                  ? "An address that puts everything within reach — landmarks, dining, and the city's best corners."
                  : s >= 8
                    ? "Well-placed for both leisure and business — easy connections, quiet enough at night."
                    : "A practical base with good access to the parts of the city worth seeing.";
              }
              return s >= 9
                ? "A stay that justifies every rupee — the kind you'd happily book again without hesitation."
                : s >= 8
                  ? "Strong value for the experience, especially when paired with the member rate."
                  : "Honest value — what you'd expect for the category, with the occasional pleasant surprise.";
            };

            const snippets: {
              theme: string;
              score: number | null;
              quote: string;
              attribution: string;
            }[] = [
              {
                theme: "Service",
                score: hotel.rating_service ?? null,
                quote: verdict("service", hotel.rating_service ?? null),
                attribution: "Aggregated from verified guest reviews",
              },
              {
                theme: "Location",
                score: hotel.rating_location ?? null,
                quote: verdict("location", hotel.rating_location ?? null),
                attribution: "Aggregated from verified guest reviews",
              },
              {
                theme: "Value",
                score: hotel.rating_value ?? null,
                quote: verdict("value", hotel.rating_value ?? null),
                attribution: "Voyagr Concierge — member feedback",
              },
            ];

            return (
              <>
                <SectionHead
                  eyebrow="Guest Verdict"
                  title="What guests"
                  italicWord="say"
                  description={`${tier} — based on ${hotel.number_of_reviews.toLocaleString()} verified reviews aggregated from across the web.`}
                  rightSlot={
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "baseline",
                        gap: 8,
                        padding: "10px 16px",
                        borderRadius: 999,
                        border: "1px solid var(--luxe-champagne-line)",
                        background: "rgba(201,169,97,0.06)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          fontSize: 22,
                          color: "var(--luxe-champagne)",
                          letterSpacing: "-0.01em",
                          lineHeight: 1,
                        }}
                      >
                        {overall.toFixed(1)}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--luxe-soft-white-50)",
                          letterSpacing: "0.04em",
                        }}
                      >
                        / 10
                      </span>
                    </div>
                  }
                />

                <div
                  className="hotel-reviews-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 20,
                    alignItems: "stretch",
                  }}
                >
                  {snippets.map((snip) => (
                    <div
                      key={snip.theme}
                      className="luxe-card"
                      style={{
                        padding: 24,
                        borderRadius: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <span className="luxe-tech">{snip.theme}</span>
                        {snip.score != null && (
                          <span
                            style={{
                              fontFamily: "var(--font-display)",
                              fontStyle: "italic",
                              fontSize: 18,
                              color: "var(--luxe-champagne)",
                              letterSpacing: "-0.01em",
                              lineHeight: 1,
                            }}
                          >
                            {snip.score.toFixed(1)}
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--luxe-soft-white-50)",
                                marginLeft: 3,
                              }}
                            >
                              /10
                            </span>
                          </span>
                        )}
                      </div>

                      <div
                        aria-hidden
                        style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          fontSize: 38,
                          color: "var(--luxe-champagne)",
                          opacity: 0.4,
                          lineHeight: 0.4,
                          marginBottom: 2,
                        }}
                      >
                        &ldquo;
                      </div>

                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          fontSize: 16,
                          fontWeight: 300,
                          color: "var(--luxe-soft-white)",
                          lineHeight: 1.55,
                          letterSpacing: "-0.005em",
                          margin: 0,
                          flex: 1,
                        }}
                      >
                        {snip.quote}
                      </p>

                      <div
                        style={{
                          borderTop: "1px solid var(--luxe-hairline)",
                          paddingTop: 12,
                          fontFamily: "var(--font-mono)",
                          fontSize: 10.5,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "var(--luxe-soft-white-50)",
                        }}
                      >
                        — {snip.attribution}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })() : (
            <SectionHead
              eyebrow="Guest Verdict"
              title="Reviews"
              italicWord="coming soon"
              description="No reviews available yet for this property — our concierge can share first-hand notes on request."
            />
          )}
        </div>
      </section>

      {/* ═══════════════════ 10. CLOSING CONCIERGE CTA ═══════════════════ */}
      <section
        style={{
          padding: "80px 24px 100px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
      >
        <div className="luxe-container" style={{ textAlign: "center", maxWidth: 720, padding: 0 }}>
          <div className="luxe-tech" style={{ marginBottom: 12 }}>
            One Message Away
          </div>
          <h2
            className="luxe-display"
            style={{ fontSize: "clamp(28px, 3.4vw, 44px)", marginBottom: 14 }}
          >
            Let our concierge confirm{" "}
            <em style={{ color: "var(--luxe-champagne)" }}>{hotel.hotel_name}</em>
          </h2>
          <p
            style={{
              color: "var(--luxe-soft-white-70)",
              fontSize: 15,
              lineHeight: 1.7,
              maxWidth: 560,
              margin: "0 auto 28px",
            }}
          >
            We&rsquo;ll source the best preferred rate, secure your member benefits, and confirm everything within 15 minutes &mdash; all over WhatsApp.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={conciergeWhatsappLink(`Hi, I'd like to book ${hotel.hotel_name} in ${hotel.city}`)}
              className="luxe-btn-gold"
              target="_blank"
              rel="noreferrer"
            >
              Chat on WhatsApp
            </a>
            <button
              onClick={() => document.getElementById("rates")?.scrollIntoView({ behavior: "smooth" })}
              className="luxe-btn-secondary"
            >
              See Member Rates
            </button>
          </div>
        </div>
      </section>

      <Footer />

      {/* ═══════════════════ Sticky Bottom Bar — preserved ═══════════════════ */}
      <div
        className="hotel-bottom-bar fixed bottom-0 left-0 right-0"
        style={{
          background: "rgba(8,7,6,0.94)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderTop: "1px solid var(--luxe-champagne-line)",
          padding: "0 24px",
          paddingBottom: "env(safe-area-inset-bottom, 0)",
          zIndex: 105,
        }}
      >
        <div
          className="flex items-center justify-between mx-auto gap-4"
          style={{
            maxWidth: 1280,
            height: 68,
          }}
        >
          <div className="flex-1 min-w-0">
            <p
              className="truncate"
              style={{
                fontSize: 13.5,
                fontWeight: 500,
                fontStyle: "italic",
                color: "var(--luxe-soft-white)",
                fontFamily: "var(--font-display)",
                lineHeight: 1.2,
                letterSpacing: "-0.005em",
              }}
            >
              {hotel.hotel_name}
            </p>
            {selectedPlan ? (
              <p style={{ fontSize: 11.5, color: "var(--luxe-champagne)", marginTop: 3, letterSpacing: "0.04em" }}>
                {formatMealBasis(selectedPlan.meal_basis)} &middot; Total {formatPrice(sidebarTotal, selectedPlan.currency)} ({nights} night{nights > 1 ? "s" : ""})
              </p>
            ) : lowestFromRate != null && rates ? (
              <p style={{ fontSize: 11.5, color: "var(--luxe-champagne)", marginTop: 3, letterSpacing: "0.04em" }}>
                From {formatPrice(lowestFromRate, rates.rates[0].currency)}/night
              </p>
            ) : datesSelected ? (
              <div style={{ marginTop: 6 }}>
                <span
                  className="luxe-skeleton luxe-skeleton--dark"
                  aria-hidden
                  style={{ display: "inline-block", height: 11, width: 140, borderRadius: 3 }}
                />
                <span className="sr-only">Loading rates…</span>
              </div>
            ) : (
              <p style={{ fontSize: 11.5, color: "var(--luxe-soft-white-50)", marginTop: 3 }}>
                Select dates to see rates
              </p>
            )}
          </div>

          <button
            onClick={() => {
              if (!user) {
                setPendingOptionId(null);
                setLoginModalOpen(true);
                return;
              }
              document.getElementById("rates")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="luxe-btn-gold"
            style={{ padding: "10px 22px", fontSize: 11, whiteSpace: "nowrap" }}
          >
            Select Room &rarr;
          </button>
        </div>
      </div>

      {/* ═══════════════════ Unlock Rate Modal ═══════════════════ */}
      {selectedPlan && hotel && (
        <UnlockRateModal
          open={unlockModalOpen}
          onClose={() => setUnlockModalOpen(false)}
          hotelId={hotel.id}
          hotelName={hotel.hotel_name}
          roomName={`${selectedPlan.room_name} • ${formatMealBasis(selectedPlan.meal_basis)}`}
          rateType={selectedPlan.refundable ? "preferred" : "standard"}
          checkIn={booking.checkIn}
          checkOut={booking.checkOut}
          nights={nights}
          guests={booking.guestSummary}
          nightlyRate={Math.round(sidebarNightly)}
          marketRate={Math.round(sidebarMarket || sidebarTotal)}
          currency={selectedPlan.currency}
          perks={[]}
        />
      )}

      {/* No-match concierge fallback modal */}
      {!selectedPlan && noMatch && hotel && (
        <UnlockRateModal
          open={unlockModalOpen}
          onClose={() => setUnlockModalOpen(false)}
          hotelId={hotel.id}
          hotelName={hotel.hotel_name}
          roomName="Rates on request"
          rateType="preferred"
          checkIn={booking.checkIn}
          checkOut={booking.checkOut}
          nights={nights}
          guests={booking.guestSummary}
          nightlyRate={0}
          marketRate={0}
          currency="INR"
          perks={[]}
        />
      )}

      {/* ═══════════════════ Login Gate Modal ═══════════════════ */}
      {loginModalOpen && (
        <RoomSelectLoginModal
          onClose={() => {
            setLoginModalOpen(false);
            setPendingOptionId(null);
            setPendingSaveAfterLogin(false);
          }}
          onSuccess={handleLoginSuccess}
          heading={
            loginIntent === "save-hotel"
              ? "Sign in to save this hotel"
              : "Sign in to confirm your rate"
          }
          subtext={
            loginIntent === "save-hotel"
              ? "Save hotels to your shortlist and access them anytime."
              : "Voyagr members get rates negotiated directly with hotels — securely confirmed by our concierge."
          }
        />
      )}

      {/* ═══════════════════ WhatsApp Concierge Trigger (40s delay) ═══════════════════ */}
      {hotel && <HotelPageWhatsAppTrigger hotelName={hotel.hotel_name} />}

      <style jsx global>{`
        /* Bento gallery tile — magazine grid */
        .bento-tile {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--luxe-hairline);
          background: var(--luxe-black-2);
          cursor: pointer;
          padding: 0;
          transition: border-color 0.3s ease, transform 0.3s ease;
          isolation: isolate;
        }
        .bento-tile:hover {
          border-color: var(--luxe-champagne-line);
        }
        .bento-tile img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease;
          filter: saturate(0.92) brightness(0.86);
        }
        .bento-tile:hover img {
          transform: scale(1.06);
          filter: saturate(1) brightness(0.95);
        }
        .bento-tile-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(12,11,10,0.45) 0%, rgba(12,11,10,0.05) 50%, transparent 100%);
          pointer-events: none;
        }

        /* Rate card highlight pulse */
        @keyframes rateCardHighlightPulse {
          0% { box-shadow: 0 0 0 0 rgba(200,170,118,0.5); }
          60% { box-shadow: 0 0 0 14px rgba(200,170,118,0); }
          100% { box-shadow: 0 0 0 0 rgba(200,170,118,0); }
        }
        .rate-card-highlight-pulse {
          animation: rateCardHighlightPulse 1.4s ease-out 2;
        }

        /* Unlock-rate gold pulse */
        @keyframes unlockRatePulse {
          0% { box-shadow: 0 0 0 0 rgba(200,170,118,0.45); }
          70% { box-shadow: 0 0 0 12px rgba(200,170,118,0); }
          100% { box-shadow: 0 0 0 0 rgba(200,170,118,0); }
        }
        .unlock-rate-btn-pulse {
          animation: unlockRatePulse 2.4s ease-out infinite;
        }

        /* No scrollbar utility */
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }

        /* Responsive — collapse multi-column grids on narrow screens */
        @media (max-width: 960px) {
          .hotel-overview-grid { grid-template-columns: minmax(0, 1fr) !important; gap: 28px !important; }
          .hotel-rates-grid { grid-template-columns: minmax(0, 1fr) !important; }
          .hotel-location-grid { grid-template-columns: minmax(0, 1fr) !important; }
          .hotel-reviews-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .hotel-about-grid { grid-template-columns: minmax(0, 1fr) !important; gap: 28px !important; }
          .hotel-amenities-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 640px) {
          .hotel-reviews-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
        @media (max-width: 520px) {
          .hotel-amenities-grid { gap: 8px !important; }
        }
        @media (max-width: 760px) {
          .hotel-bento {
            grid-template-columns: repeat(2, 1fr) !important;
            grid-template-rows: 200px 200px 200px !important;
          }
          .hotel-bento .bento-tile:nth-child(1) {
            grid-column: 1 / 3 !important;
            grid-row: 1 / 2 !important;
          }
          .hotel-bento .bento-tile:nth-child(n+2) {
            grid-column: auto !important;
            grid-row: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────── AmenitiesIconGrid ────────────────────────── */
/* 3×3 icon grid — thin gold-outlined icons (1.25 stroke) with white labels.
   Availability derived from hotel.amenities prose + structured fields;
   unavailable amenities are dimmed. */

interface AmenitiesIconGridProps {
  amenities?: string | null;
  restaurants_count?: number | null;
  room_service_24h?: boolean | null;
}

function AmenitiesIconGrid({
  amenities,
  restaurants_count,
  room_service_24h,
}: AmenitiesIconGridProps) {
  const lower = (amenities || "").toLowerCase();
  const has = (kw: string | string[]) =>
    Array.isArray(kw) ? kw.some((k) => lower.includes(k)) : lower.includes(kw);

  const items: { label: string; available: boolean; icon: React.ReactNode }[] = [
    {
      label: "Wifi",
      available: true,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      ),
    },
    {
      label: "Pool",
      available: has(["pool", "swimming"]),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M2 20c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
          <path d="M2 16c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
          <path d="M7 14V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2" />
          <path d="M17 14V5a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2" />
          <path d="M7 9h10" />
        </svg>
      ),
    },
    {
      label: "Spa",
      available: has(["spa", "massage", "wellness", "sauna", "steam"]),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M12 22c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5" />
          <path d="M4.3 21.3a5.56 5.56 0 0 1 3.8-1.5c1.63.225 2.65 1.213 3.9 2.2" />
          <path d="M8.5 8.5c-.385.39-.74.78-1.05 1.18-1.55 2-2.95 4.32-2.95 7.32 0 1.32 1.5 2 4 2 1.5 0 4-.4 4-2 0-3-1.4-5.32-2.95-7.32C9.24 9.28 8.89 8.89 8.5 8.5Z" />
          <path d="M12 5.5c0-1.5 1-3 3-3 1.5 0 3 1 3 2.5 0 1.5-1 3-3 3" />
        </svg>
      ),
    },
    {
      label: "Gym",
      available: has(["gym", "fitness", "workout"]),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M6.5 6.5 17.5 17.5" />
          <path d="m21 21-1-1" />
          <path d="m3 3 1 1" />
          <path d="m18 22 4-4" />
          <path d="m2 6 4-4" />
          <path d="m3 10 7-7" />
          <path d="m14 21 7-7" />
        </svg>
      ),
    },
    {
      label: "Restaurant",
      available: !!restaurants_count || has(["restaurant", "dining", "café", "cafe"]),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M3 2v7c0 1.1.9 2 2 2s2-.9 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z" />
          <path d="M19 22v-7" />
        </svg>
      ),
    },
    {
      label: "Bar",
      available: has(["bar", "lounge", "cocktail", "wine"]),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M5 3h14l-7 9-7-9Z" />
          <path d="M12 12v8" />
          <path d="M8 20h8" />
        </svg>
      ),
    },
    {
      label: "Parking",
      available: has(["parking", "valet", "garage"]),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
        </svg>
      ),
    },
    {
      label: "Business",
      available: has(["business", "meeting", "conference", "boardroom"]),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M2 13h20" />
        </svg>
      ),
    },
    {
      label: room_service_24h ? "24h Service" : "Concierge",
      available: true,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="hotel-amenities-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 10,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "18px 12px",
            borderRadius: 12,
            border: item.available
              ? "1px solid rgba(201,169,97,0.55)"
              : "1px solid rgba(201,169,97,0.18)",
            background: "transparent",
            color: item.available ? "#C9A961" : "rgba(201,169,97,0.35)",
            opacity: item.available ? 1 : 0.5,
            transition: "border-color 0.2s ease, background 0.2s ease",
          }}
        >
          {item.icon}
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 500,
              color: item.available ? "#ffffff" : "rgba(255,255,255,0.4)",
              textAlign: "center",
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────── FactRow (small helper) ────────────────────────── */

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-baseline justify-between gap-3"
      style={{
        paddingBottom: 12,
        borderBottom: "1px solid var(--luxe-hairline)",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--luxe-soft-white-50)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          color: "var(--luxe-soft-white)",
          fontFamily: "var(--font-body)",
          fontWeight: 500,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}
