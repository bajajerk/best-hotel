"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import UnlockRateModal from "@/components/UnlockRateModal";
import RoomSelectLoginModal from "@/components/RoomSelectLoginModal";
import HotelPageWhatsAppTrigger from "@/components/HotelPageWhatsAppTrigger";
import { trackHotelViewed, trackHotelGalleryOpened, trackHotelTabClicked } from "@/lib/analytics";
import { useBooking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/* ────────────────────────── Types ────────────────────────── */

interface NearbyLandmark {
  name: string;
  distance_km: number;
}

type GalleryCategory =
  | "Hotel View"
  | "Guest Rooms"
  | "Suites"
  | "Pool & Spa"
  | "Amenities";

interface HotelDetail {
  hotel_id: number;
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
  nearby?: NearbyLandmark[] | null;
}

interface RoomDef {
  id: string;
  name: string;
  beds: string;
  guests: number;
  size: string;
  priceMult: number;
  inclusions: string[];
  tier: "preferred" | "standard";
  photos?: string[];
}

type PackageKey = "room-only" | "breakfast";

interface RoomPackage {
  key: PackageKey;
  name: "Room Only" | "Stay + Breakfast";
  inclusions: string[];
  rateMult: number;
  refundable: boolean;
}

/* ────────────────────────── Helpers ────────────────────────── */

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=70";

function safePhotoUrl(raw: string): string {
  if (raw.startsWith("http://")) return raw.replace("http://", "https://");
  if (raw.startsWith("https://")) return raw;
  return `https://photos.hotelbeds.com/giata/${raw}`;
}

/** Approximate FX rates to INR. Used so every price on the hotel page
 *  renders in ₹ regardless of what currency the backend returns. */
const INR_PER: Record<string, number> = {
  INR: 1, USD: 83, EUR: 90, GBP: 105, AUD: 55, SGD: 62,
  AED: 23, THB: 2.4, JPY: 0.56, MYR: 19, IDR: 0.0053, KRW: 0.063,
};

function toInr(amount: number, currency?: string): number {
  const code = (currency || "USD").toUpperCase();
  const rate = INR_PER[code] ?? 83;
  return amount * rate;
}

function formatInr(amount: number): string {
  return `\u20B9${Math.round(amount).toLocaleString("en-IN")}`;
}

/* ── Urgency / Social Proof generators (deterministic per hotel_id) ── */

function getUrgencyData(hotelId: number) {
  const seed = hotelId % 100;
  const roomsLeft = (seed % 4) + 2; // 2–5
  return { roomsLeft };
}

function getMemberCount(hotelId: number) {
  return 12400 + (hotelId % 3000);
}

/* ────────────────────────── Room Generation ────────────────────────── */

function generateRooms(hotel: HotelDetail): RoomDef[] {
  const stars = hotel.star_rating || 3;

  if (stars >= 5) return [
    { id: "r1", name: "Deluxe Room", beds: "1 King Bed", guests: 2, size: "35 m\u00B2", priceMult: 1.0, inclusions: ["Free breakfast", "Free Wi-Fi", "Late checkout", "Club lounge access"], tier: "preferred" },
    { id: "r2", name: "Deluxe Twin", beds: "2 Single Beds", guests: 2, size: "35 m\u00B2", priceMult: 1.0, inclusions: ["Free breakfast", "Free Wi-Fi", "Late checkout"], tier: "preferred" },
    { id: "r3", name: "Premier Suite", beds: "1 King Bed + Living Area", guests: 3, size: "55 m\u00B2", priceMult: 1.65, inclusions: ["Free breakfast", "Free Wi-Fi", "Butler service", "Club lounge access", "Airport transfer"], tier: "preferred" },
    { id: "r4", name: "Family Room", beds: "1 King + 2 Single Beds", guests: 4, size: "50 m\u00B2", priceMult: 1.45, inclusions: ["Free breakfast", "Free Wi-Fi", "Kids amenities"], tier: "preferred" },
    { id: "r5", name: "Standard Room", beds: "1 Queen Bed", guests: 2, size: "28 m\u00B2", priceMult: 0.85, inclusions: ["Free Wi-Fi"], tier: "standard" },
    { id: "r6", name: "Standard Twin", beds: "2 Single Beds", guests: 2, size: "28 m\u00B2", priceMult: 0.85, inclusions: ["Free Wi-Fi"], tier: "standard" },
    { id: "r7", name: "Presidential Suite", beds: "1 King Bed + Lounge", guests: 2, size: "80 m\u00B2", priceMult: 2.8, inclusions: ["Free breakfast", "Free Wi-Fi", "Butler service", "Club lounge access", "Airport transfer", "Spa credit"], tier: "preferred" },
  ];

  if (stars >= 4) return [
    { id: "r1", name: "Superior Room", beds: "1 King Bed", guests: 2, size: "30 m\u00B2", priceMult: 1.0, inclusions: ["Free breakfast", "Free Wi-Fi", "Late checkout"], tier: "preferred" },
    { id: "r2", name: "Superior Twin", beds: "2 Single Beds", guests: 2, size: "30 m\u00B2", priceMult: 1.0, inclusions: ["Free breakfast", "Free Wi-Fi"], tier: "preferred" },
    { id: "r3", name: "Deluxe Room", beds: "1 King Bed", guests: 2, size: "38 m\u00B2", priceMult: 1.35, inclusions: ["Free breakfast", "Free Wi-Fi", "Late checkout", "Minibar"], tier: "preferred" },
    { id: "r4", name: "Standard Room", beds: "1 Queen Bed", guests: 2, size: "24 m\u00B2", priceMult: 0.8, inclusions: ["Free Wi-Fi"], tier: "standard" },
    { id: "r5", name: "Standard Twin", beds: "2 Single Beds", guests: 2, size: "24 m\u00B2", priceMult: 0.8, inclusions: ["Free Wi-Fi"], tier: "standard" },
    { id: "r6", name: "Family Suite", beds: "1 King + 2 Single Beds", guests: 4, size: "45 m\u00B2", priceMult: 1.55, inclusions: ["Free breakfast", "Free Wi-Fi", "Kids amenities"], tier: "preferred" },
  ];

  return [
    { id: "r1", name: "Standard Room", beds: "1 Queen Bed", guests: 2, size: "22 m\u00B2", priceMult: 1.0, inclusions: ["Free Wi-Fi"], tier: "standard" },
    { id: "r2", name: "Standard Twin", beds: "2 Single Beds", guests: 2, size: "22 m\u00B2", priceMult: 1.0, inclusions: ["Free Wi-Fi"], tier: "standard" },
    { id: "r3", name: "Superior Room", beds: "1 Queen Bed", guests: 2, size: "26 m\u00B2", priceMult: 1.2, inclusions: ["Free breakfast", "Free Wi-Fi"], tier: "preferred" },
    { id: "r4", name: "Triple Room", beds: "1 Queen + 1 Single Bed", guests: 3, size: "28 m\u00B2", priceMult: 1.25, inclusions: ["Free Wi-Fi"], tier: "standard" },
  ];
}

/* ────────────────────────── Package Generation ────────────────────────── */

function isBreakfastInclusion(s: string): boolean {
  return s.toLowerCase().includes("breakfast");
}

function generatePackages(room: RoomDef): RoomPackage[] {
  const hasBreakfast = room.inclusions.some(isBreakfastInclusion);
  const nonMealInclusions = room.inclusions.filter((i) => !isBreakfastInclusion(i));

  const roomOnly: RoomPackage = {
    key: "room-only",
    name: "Room Only",
    inclusions: nonMealInclusions,
    rateMult: 1.0,
    refundable: room.tier === "preferred",
  };

  if (!hasBreakfast) return [roomOnly];

  const breakfast: RoomPackage = {
    key: "breakfast",
    name: "Stay + Breakfast",
    inclusions: ["Free breakfast daily", ...nonMealInclusions],
    rateMult: 1.08,
    refundable: true,
  };

  return [roomOnly, breakfast];
}

function packageId(roomId: string, key: PackageKey): string {
  return `${roomId}:${key}`;
}

function parsePackageId(id: string): { roomId: string; key: PackageKey } {
  const [roomId, key] = id.split(":");
  return { roomId, key: key as PackageKey };
}

/* ────────────────────────── Filters ────────────────────────── */

type BedTypeFilter = "all" | "king" | "twin" | "double" | "single";
type MealPlanFilter = "all" | "room-only" | "breakfast" | "half-board" | "full-board";

function roomMatchesBedType(room: RoomDef, filter: BedTypeFilter): boolean {
  if (filter === "all") return true;
  const b = room.beds.toLowerCase();
  if (filter === "king") return b.includes("king");
  if (filter === "twin") return b.includes("twin") || b.includes("2 single");
  if (filter === "double") return b.includes("double");
  if (filter === "single") return b.includes("single") && !b.includes("2 single");
  return true;
}

function roomMatchesMealPlan(room: RoomDef, filter: MealPlanFilter): boolean {
  if (filter === "all") return true;
  const hasBreakfast = room.inclusions.some(isBreakfastInclusion);
  if (filter === "room-only") return true;
  if (filter === "breakfast") return hasBreakfast;
  return false;
}

function packageMatchesFilters(
  pkg: RoomPackage,
  filters: { freeCancellation: boolean; mealPlan: MealPlanFilter }
): boolean {
  if (filters.freeCancellation && !pkg.refundable) return false;
  if (filters.mealPlan === "room-only" && pkg.key !== "room-only") return false;
  if (filters.mealPlan === "breakfast" && pkg.key !== "breakfast") return false;
  if (filters.mealPlan === "half-board" || filters.mealPlan === "full-board") return false;
  return true;
}

/* ────────────────────────── Tabs ────────────────────────── */

const TABS = ["Rooms", "Overview", "Gallery", "Reviews"] as const;
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
      style={{ background: "rgba(26,23,16,0.96)", backdropFilter: "blur(32px)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-xl"
        style={{ color: "var(--cream)", background: "none", border: "none", cursor: "pointer" }}
        aria-label="Close"
      >
        &times;
      </button>
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 md:left-8 w-12 h-12 flex items-center justify-center text-2xl"
          style={{ color: "var(--cream)", background: "none", border: "none", cursor: "pointer" }}
          aria-label="Previous"
        >
          &#8249;
        </button>
      )}
      <motion.img
        key={index}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        src={safePhotoUrl(photos[index])}
        alt=""
        className="max-h-[85vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
      />
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 md:right-8 w-12 h-12 flex items-center justify-center text-2xl"
          style={{ color: "var(--cream)", background: "none", border: "none", cursor: "pointer" }}
          aria-label="Next"
        >
          &#8250;
        </button>
      )}
      <span
        className="absolute bottom-6 text-xs tracking-[0.2em]"
        style={{ color: "var(--cream-border)", fontFamily: "var(--font-mono)" }}
      >
        {index + 1} / {photos.length}
      </span>
    </motion.div>
  );
}

/* ────────────────────────── Filter Bar ────────────────────────── */

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
        padding: "8px 14px",
        fontSize: "12px",
        fontWeight: 500,
        letterSpacing: "0.02em",
        background: "var(--white)",
        border: active ? "1px solid var(--gold)" : "1px solid var(--cream-border)",
        color: active ? "var(--gold)" : "var(--ink-mid)",
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        transition: "border-color 0.15s, color 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Component>
  );
}

function RoomFilterBar({
  freeCancellation,
  onToggleFreeCancellation,
  bedType,
  onChangeBedType,
  mealPlan,
  onChangeMealPlan,
}: {
  freeCancellation: boolean;
  onToggleFreeCancellation: () => void;
  bedType: BedTypeFilter;
  onChangeBedType: (v: BedTypeFilter) => void;
  mealPlan: MealPlanFilter;
  onChangeMealPlan: (v: MealPlanFilter) => void;
}) {
  const bedLabel: Record<BedTypeFilter, string> = {
    all: "Bed Type",
    king: "King Bed",
    twin: "Twin Beds",
    double: "Double Bed",
    single: "Single Bed",
  };
  const mealLabel: Record<MealPlanFilter, string> = {
    all: "Meal Plan",
    "room-only": "Room Only",
    breakfast: "With Breakfast",
    "half-board": "Half Board",
    "full-board": "Full Board",
  };

  return (
    <div
      className="flex flex-wrap gap-2 mb-6"
      style={{ alignItems: "center" }}
    >
      {/* Free Cancellation toggle pill */}
      <FilterPillShell active={freeCancellation} onClick={onToggleFreeCancellation}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14,
            border: freeCancellation ? "1.5px solid var(--gold)" : "1.5px solid var(--cream-border)",
            background: freeCancellation ? "var(--gold)" : "transparent",
            transition: "all 0.15s",
          }}
        >
          {freeCancellation && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        Free Cancellation
      </FilterPillShell>

      {/* Bed Type dropdown */}
      <div style={{ position: "relative" }}>
        <FilterPillShell active={bedType !== "all"} as="label">
          <span style={{ pointerEvents: "none" }}>{bedLabel[bedType]}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: "none" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <select
            value={bedType}
            onChange={(e) => onChangeBedType(e.target.value as BedTypeFilter)}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
              fontSize: "12px",
              width: "100%",
              height: "100%",
            }}
            aria-label="Bed type filter"
          >
            <option value="all">All Bed Types</option>
            <option value="king">King Bed</option>
            <option value="twin">Twin Beds</option>
            <option value="double">Double Bed</option>
            <option value="single">Single Bed</option>
          </select>
        </FilterPillShell>
      </div>

      {/* Meal Plan dropdown */}
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
              fontSize: "12px",
              width: "100%",
              height: "100%",
            }}
            aria-label="Meal plan filter"
          >
            <option value="all">All Meal Plans</option>
            <option value="room-only">Room Only</option>
            <option value="breakfast">With Breakfast</option>
            <option value="half-board">Half Board</option>
            <option value="full-board">Full Board</option>
          </select>
        </FilterPillShell>
      </div>
    </div>
  );
}

/* ────────────────────────── Package Card ────────────────────────── */

function PackageCard({
  pkg,
  voyagrRate,
  marketRate,
  isSelected,
  cancellation,
  onSelect,
  onProceed,
}: {
  pkg: RoomPackage;
  voyagrRate: number;
  marketRate: number;
  isSelected: boolean;
  cancellation: { refundable: boolean; freeUntil?: string };
  onSelect: () => void;
  onProceed: () => void;
}) {
  const saving = marketRate - voyagrRate;
  const [expanded, setExpanded] = useState(false);
  const MAX_INCLUSIONS = 3;
  const hasMore = pkg.inclusions.length > MAX_INCLUSIONS;
  const hiddenCount = pkg.inclusions.length - MAX_INCLUSIONS;
  const shown = expanded || !hasMore ? pkg.inclusions : pkg.inclusions.slice(0, MAX_INCLUSIONS);

  return (
    <div
      onClick={onSelect}
      style={{
        background: "var(--white)",
        border: isSelected ? "2px solid #d4a24c" : "1px solid var(--cream-border)",
        padding: isSelected ? "15px" : "16px",
        cursor: "pointer",
        transition: "border-color 0.25s, box-shadow 0.25s",
        boxShadow: isSelected ? "0 0 0 3px rgba(212,162,76,0.15)" : "none",
      }}
    >
      {/* Package name */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h5
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "0.01em",
          }}
        >
          {pkg.name}
        </h5>
        {isSelected && (
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </div>

      {/* Cancellation line */}
      <div
        style={{
          fontSize: "11px",
          fontFamily: "var(--font-body)",
          marginBottom: 10,
          color: cancellation.refundable ? "var(--success)" : "var(--ink-light)",
          fontWeight: cancellation.refundable ? 500 : 400,
        }}
      >
        {cancellation.refundable
          ? `\u2713 Free cancellation until ${cancellation.freeUntil}`
          : "Non-refundable"}
      </div>

      {/* Inclusions list (clean list with checkmarks) */}
      {shown.length > 0 && (
        <div className="flex flex-col gap-1" style={{ marginBottom: 12 }}>
          {shown.map((inc) => (
            <div key={inc} className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--ink-mid)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {inc}
              </span>
            </div>
          ))}
          {hasMore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              style={{
                alignSelf: "flex-start",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--gold)",
                background: "none",
                border: "none",
                padding: "2px 0",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              {expanded ? "Show less" : `+ ${hiddenCount} more`}
            </button>
          )}
        </div>
      )}

      {/* Rate block + CTA */}
      <div className="flex items-end justify-between">
        <div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--ink-light)",
              textDecoration: "line-through",
              fontFamily: "var(--font-mono)",
            }}
          >
            {formatInr(marketRate)}
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "var(--gold)",
              fontFamily: "var(--font-display)",
              lineHeight: 1.2,
              marginTop: 1,
            }}
          >
            {formatInr(voyagrRate)}
            <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--ink-light)", marginLeft: 4 }}>/night</span>
          </div>
          {saving > 0 && (
            <div
              style={{
                fontSize: "11px",
                color: "var(--success)",
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              Save {formatInr(saving)}/night
            </div>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onProceed(); }}
          style={{
            padding: "8px 20px",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            background: "var(--gold)",
            color: "var(--ink)",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "var(--font-body)",
          }}
        >
          Select
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────── Room Card ────────────────────────── */

function RoomCard({
  room,
  baseRateInr,
  selectedPackageId,
  isHighlighted,
  cancellation,
  mealPlanFilter,
  freeCancellationFilter,
  cardRef,
  onSelectPackage,
  onProceedPackage,
  onOpenRoomGallery,
}: {
  room: RoomDef;
  baseRateInr: number;
  selectedPackageId: string | null;
  isHighlighted: boolean;
  cancellation: { refundable: boolean; freeUntil?: string };
  mealPlanFilter: MealPlanFilter;
  freeCancellationFilter: boolean;
  cardRef: (el: HTMLDivElement | null) => void;
  onSelectPackage: (pid: string) => void;
  onProceedPackage: (room: RoomDef, pkg: RoomPackage) => void;
  onOpenRoomGallery: (photos: string[], startIdx: number) => void;
}) {
  const allPackages = generatePackages(room);
  const visiblePackages = allPackages.filter((p) =>
    packageMatchesFilters(p, { freeCancellation: freeCancellationFilter, mealPlan: mealPlanFilter })
  );

  if (visiblePackages.length === 0) return null;

  const hasImages = !!(room.photos && room.photos.length > 0);

  const packageCancellation = (pkg: RoomPackage) => ({
    refundable: pkg.refundable && cancellation.refundable,
    freeUntil: cancellation.freeUntil,
  });

  const basePrice = baseRateInr * room.priceMult;
  const voyagrRate = (pkg: RoomPackage) => Math.round(basePrice * pkg.rateMult);
  const marketRate = (pkg: RoomPackage) => Math.round(basePrice * pkg.rateMult * 1.3);

  return (
    <motion.div
      layout
      ref={cardRef}
      className={isHighlighted ? "room-card-highlight-pulse" : undefined}
      style={{
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        padding: 0,
        overflow: "hidden",
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Room image (only if room-level photos exist) */}
      {hasImages && (
        <button
          onClick={() => onOpenRoomGallery(room.photos as string[], 0)}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16/9",
            overflow: "hidden",
            background: "var(--cream-deep)",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "block",
          }}
          aria-label={`Open ${room.name} gallery`}
        >
          <img
            src={safePhotoUrl((room.photos as string[])[0])}
            alt={room.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
          />
          <span
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
              background: "rgba(26,23,16,0.7)",
              color: "var(--cream)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              padding: "4px 8px",
              letterSpacing: "0.04em",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span aria-hidden>📷</span>
            {(room.photos as string[]).length}
          </span>
        </button>
      )}

      <div style={{ padding: 20 }}>
        {/* Room Name + beds + size + guests */}
        <div className="mb-4">
          <h4
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 500,
              color: "var(--ink)",
              lineHeight: 1.2,
            }}
          >
            {room.name}
          </h4>
          <p
            style={{
              fontSize: "12px",
              color: "var(--ink-light)",
              marginTop: 4,
              fontFamily: "var(--font-body)",
            }}
          >
            {room.beds} &middot; {room.size} &middot; Up to {room.guests} guests
          </p>
        </div>

        {/* Packages */}
        <div className="flex flex-col gap-3">
          {visiblePackages.map((pkg) => {
            const pid = packageId(room.id, pkg.key);
            return (
              <PackageCard
                key={pid}
                pkg={pkg}
                voyagrRate={voyagrRate(pkg)}
                marketRate={marketRate(pkg)}
                isSelected={selectedPackageId === pid}
                cancellation={packageCancellation(pkg)}
                onSelect={() => onSelectPackage(pid)}
                onProceed={() => onProceedPackage(room, pkg)}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────── Trust Signals Bar ────────────────────────── */

function TrustSignals({ hotelId, rating, reviewCount }: { hotelId: number; rating: number; reviewCount: number }) {
  const memberCount = getMemberCount(hotelId);

  return (
    <div
      className="flex flex-wrap gap-4 items-center"
      style={{
        padding: "14px 20px",
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        fontSize: "12px",
        fontFamily: "var(--font-body)",
        color: "var(--ink-mid)",
      }}
    >
      {/* Rating */}
      {rating > 0 && (
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
          </svg>
          <span style={{ fontWeight: 600, color: "var(--ink)" }}>{rating.toFixed(1)}</span>
          {reviewCount > 0 && (
            <span style={{ color: "var(--ink-light)" }}>({reviewCount.toLocaleString()} reviews)</span>
          )}
        </div>
      )}

      <span style={{ color: "var(--cream-border)" }}>|</span>

      {/* Member count */}
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span>{memberCount.toLocaleString()}+ members trust Voyagr</span>
      </div>

      <span style={{ color: "var(--cream-border)" }}>|</span>

      {/* Verified rates */}
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
        <span>Verified preferred rates</span>
      </div>
    </div>
  );
}

/* ────────────────────────── Urgency Banner ────────────────────────── */

function UrgencyBanner({ hotelId }: { hotelId: number }) {
  const { roomsLeft } = getUrgencyData(hotelId);

  return (
    <div
      className="flex flex-wrap gap-2 items-center justify-center"
      style={{
        padding: "10px 20px",
        background: "rgba(201, 168, 76, 0.08)",
        border: "1px solid rgba(201, 168, 76, 0.22)",
        fontSize: "12px",
        fontFamily: "var(--font-body)",
        fontWeight: 600,
      }}
    >
      <span style={{ color: "#C9A84C" }}>
        Only {roomsLeft} rooms left at this rate
      </span>
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

  /* Gallery */
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [activeGalleryCategory, setActiveGalleryCategory] = useState<GalleryCategory | null>(null);

  /* Tabs */
  const [activeTab, setActiveTab] = useState<TabName>("Rooms");

  /* Room + package selection */
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null);
  const roomCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* Filter bar state */
  const [filterFreeCancellation, setFilterFreeCancellation] = useState(false);
  const [filterBedType, setFilterBedType] = useState<BedTypeFilter>("all");
  const [filterMealPlan, setFilterMealPlan] = useState<MealPlanFilter>("all");

  /* Unlock Rate modal */
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);

  /* Overview expanded state (show first 3 sentences by default) */
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  /* Login gate modal (SELECT button on a room card, user not signed in) */
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);
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
  const isSaved = hotel ? savedHotelIds.includes(String(hotel.hotel_id)) : false;

  /* Section refs for scroll-based tabs */
  const roomsRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  /* ── Fetch data ── */
  useEffect(() => {
    fetch(`${API_BASE}/api/hotels/${hotelId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((hotelData) => {
        setHotel(hotelData);
        if (hotelData) {
          trackHotelViewed({
            hotel_id: hotelData.hotel_id,
            hotel_name: hotelData.hotel_name,
            city: hotelData.city,
            country: hotelData.country,
            star_rating: hotelData.star_rating,
            price_from: hotelData.rates_from,
            currency: hotelData.rates_currency,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hotelId]);

  /* ── Photos ── */
  const photos = useMemo<string[]>(
    () =>
      hotel
        ? ([hotel.photo1, hotel.photo2, hotel.photo3, hotel.photo4, hotel.photo5].filter(Boolean) as string[])
        : [],
    [hotel]
  );

  /* ── Photo categories (only if backend provides photo_categories metadata) ── */
  const GALLERY_CATEGORIES: GalleryCategory[] = useMemo(
    () => ["Hotel View", "Guest Rooms", "Suites", "Pool & Spa", "Amenities"],
    []
  );
  const photosByCategory = hotel?.photo_categories || null;
  const availableCategories = useMemo<GalleryCategory[]>(() => {
    if (!photosByCategory) return [];
    return GALLERY_CATEGORIES.filter(
      (c) => Array.isArray(photosByCategory[c]) && (photosByCategory[c] as string[]).length > 0
    );
  }, [photosByCategory, GALLERY_CATEGORIES]);
  const hasCategorisedPhotos = availableCategories.length > 0;

  const visibleGalleryPhotos = useMemo(() => {
    if (!hasCategorisedPhotos || !photosByCategory) return photos;
    if (activeGalleryCategory && photosByCategory[activeGalleryCategory]) {
      return photosByCategory[activeGalleryCategory] as string[];
    }
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const cat of availableCategories) {
      for (const p of photosByCategory[cat] as string[]) {
        if (!seen.has(p)) { seen.add(p); merged.push(p); }
      }
    }
    return merged.length ? merged : photos;
  }, [hasCategorisedPhotos, photosByCategory, activeGalleryCategory, availableCategories, photos]);

  const openLightbox = useCallback((idx: number, overridePhotos?: string[]) => {
    setLightboxPhotos(overridePhotos && overridePhotos.length > 0 ? overridePhotos : photos);
    setLightboxIdx(idx);
    setLightboxOpen(true);
    if (hotel && !overridePhotos) {
      trackHotelGalleryOpened({ hotel_id: hotel.hotel_id, hotel_name: hotel.hotel_name, photo_index: idx });
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

  /* ── Room data ── */
  const rooms = useMemo(() => (hotel ? generateRooms(hotel) : []), [hotel]);

  /* Apply room-level filters (Bed Type; Free Cancellation + Meal Plan are applied per-package) */
  const applyRoomFilters = useCallback(
    (list: RoomDef[]) => {
      return list.filter((room) => {
        if (!roomMatchesBedType(room, filterBedType)) return false;
        if (!roomMatchesMealPlan(room, filterMealPlan)) return false;
        if (filterFreeCancellation) {
          const pkgs = generatePackages(room);
          const hasRefundable = pkgs.some((p) => p.refundable) && room.tier === "preferred";
          if (!hasRefundable) return false;
        }
        return true;
      });
    },
    [filterBedType, filterMealPlan, filterFreeCancellation]
  );

  const preferredRooms = useMemo(
    () => applyRoomFilters(rooms.filter((r) => r.tier === "preferred")),
    [rooms, applyRoomFilters]
  );
  const standardRooms = useMemo(
    () => applyRoomFilters(rooms.filter((r) => r.tier === "standard")),
    [rooms, applyRoomFilters]
  );

  /* Derive selected room + package from selectedPackageId */
  const selectedRoom = useMemo(() => {
    if (!selectedPackageId) return null;
    const { roomId } = parsePackageId(selectedPackageId);
    return rooms.find((r) => r.id === roomId) || null;
  }, [rooms, selectedPackageId]);

  const selectedPackage = useMemo<RoomPackage | null>(() => {
    if (!selectedPackageId || !selectedRoom) return null;
    const { key } = parsePackageId(selectedPackageId);
    return generatePackages(selectedRoom).find((p) => p.key === key) || null;
  }, [selectedPackageId, selectedRoom]);

  const selectedRoomId = selectedRoom?.id ?? null;

  /* ── Pricing (all values displayed in INR) ── */
  const baseRate = hotel?.rates_from || 100;
  const sourceCurrency = hotel?.rates_currency || "USD";
  const baseRateInr = toInr(baseRate, sourceCurrency);

  const nights = booking.nights || 1;
  const selectedVoyagrRate =
    selectedRoom && selectedPackage
      ? Math.round(baseRateInr * selectedRoom.priceMult * selectedPackage.rateMult)
      : 0;
  const selectedMarketRate =
    selectedRoom && selectedPackage
      ? Math.round(baseRateInr * selectedRoom.priceMult * selectedPackage.rateMult * 1.3)
      : 0;
  const selectedSaving = selectedMarketRate - selectedVoyagrRate;
  const totalPrice = selectedVoyagrRate * nights;

  /* ── Per-room cancellation policy (deterministic, refundable for preferred tier) ── */
  const cancellationFor = useCallback((room: RoomDef) => {
    const refundable = room.tier === "preferred";
    if (!refundable) return { refundable: false };
    const checkIn = booking.checkIn ? new Date(booking.checkIn) : null;
    const cutoff = checkIn && !isNaN(checkIn.getTime())
      ? new Date(checkIn.getTime() - 2 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const freeUntil = cutoff.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return { refundable: true, freeUntil };
  }, [booking.checkIn]);

  /* ── Proceed to booking from a package SELECT button ── */
  const proceedToBooking = useCallback(
    (room: RoomDef, pkg: RoomPackage) => {
      if (!hotel) return;
      const rate = Math.round(baseRateInr * room.priceMult * pkg.rateMult);
      const totalGuests = booking.rooms.reduce((s, r) => s + r.adults + r.children, 0);
      const qs = new URLSearchParams({
        hotelId: String(hotel.hotel_id),
        roomType: room.id,
        package: pkg.key,
        rate: String(rate),
        currency: "INR",
        checkIn: booking.checkIn || "",
        checkOut: booking.checkOut || "",
        guests: String(totalGuests),
        rooms: String(booking.rooms.length),
      });
      router.push(`/book?${qs.toString()}`);
    },
    [hotel, booking, router, baseRateInr]
  );

  const handlePackageSelectCTA = useCallback(
    (room: RoomDef, pkg: RoomPackage) => {
      const pid = packageId(room.id, pkg.key);
      setSelectedPackageId(pid);
      if (!user) {
        setPendingPackageId(pid);
        setLoginIntent("room-select");
        setLoginModalOpen(true);
        return;
      }
      proceedToBooking(room, pkg);
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
    const hotelIdStr = String(hotel.hotel_id);
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
    const hotelIdStr = String(hotel.hotel_id);
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
    const pid = pendingPackageId;
    if (pid) {
      const { roomId } = parsePackageId(pid);
      setSelectedPackageId(pid);
      setHighlightedRoomId(roomId);
      setTimeout(() => {
        roomCardRefs.current[roomId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
      setTimeout(() => setHighlightedRoomId(null), 2400);
    } else {
      setTimeout(() => {
        document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }
    setPendingPackageId(null);
  }, [pendingPackageId, pendingSaveAfterLogin, saveHotelToStorage]);

  /* ── Savings for hero badge ── */
  const heroSavePercent = 23; // Fixed "up to" percentage for hero

  /* ── Star display ── */
  const starDisplay = hotel && hotel.star_rating > 0
    ? "\u2605".repeat(Math.round(hotel.star_rating))
    : "";

  /* ── Tab click handler — scrolls to section ── */
  const handleTabClick = useCallback((tab: TabName) => {
    setActiveTab(tab);
    if (hotel) {
      trackHotelTabClicked({ hotel_id: hotel.hotel_id, hotel_name: hotel.hotel_name, tab_name: tab });
    }
    const refMap: Record<TabName, React.RefObject<HTMLDivElement | null>> = {
      Rooms: roomsRef,
      Overview: overviewRef,
      Gallery: galleryRef,
      Reviews: reviewsRef,
    };
    const ref = refMap[tab];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hotel]);

  /* ── Scroll-based active tab detection ── */
  useEffect(() => {
    const sections = [
      { ref: roomsRef, tab: "Rooms" as TabName },
      { ref: overviewRef, tab: "Overview" as TabName },
      { ref: galleryRef, tab: "Gallery" as TabName },
      { ref: reviewsRef, tab: "Reviews" as TabName },
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
      { rootMargin: "-120px 0px -60% 0px", threshold: 0.1 }
    );

    sections.forEach((s) => {
      if (s.ref.current) observer.observe(s.ref.current);
    });

    return () => observer.disconnect();
  }, [hotel]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--cream)" }}
      >
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-6">
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                border: "2px solid var(--cream-border)",
                borderTopColor: "var(--gold)",
              }}
            />
          </div>
          <p
            className="text-xs tracking-[0.15em] uppercase"
            style={{ color: "var(--ink-light)", fontFamily: "var(--font-mono)" }}
          >
            Loading hotel
          </p>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!hotel) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--cream)" }}
      >
        <div className="text-center max-w-md px-6">
          <div
            className="text-7xl mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              color: "var(--cream-border)",
            }}
          >
            404
          </div>
          <p className="text-lg mb-2" style={{ color: "var(--ink)" }}>Hotel not found</p>
          <p className="text-sm mb-8" style={{ color: "var(--ink-light)" }}>
            This property may have been removed or the link is invalid.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-xs font-medium uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
            style={{ background: "var(--gold)", color: "var(--ink)" }}
          >
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  const address = [hotel.addressline1, hotel.city, hotel.country].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)", color: "var(--ink)" }}>
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

      {/* ═══════════════════ Full-Width Hero Image ═══════════════════ */}
      <section className="relative w-full" style={{ height: "clamp(320px, 50vh, 520px)", marginTop: 60 }}>
        {photos.length > 0 ? (
          <img
            src={safePhotoUrl(photos[0])}
            alt={hotel.hotel_name}
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.75) saturate(0.9)", cursor: "pointer" }}
            onClick={() => openLightbox(0)}
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--cream-deep)" }} />
        )}

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(26,23,16,0.8) 0%, rgba(26,23,16,0.2) 50%, transparent 100%)",
          }}
        />

        {/* Hotel name + badge overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-6 pb-8 md:px-12 lg:px-16"
          style={{ color: "var(--cream)", zIndex: 5 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {starDisplay && (
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  color: "var(--gold)",
                  marginBottom: 8,
                }}
              >
                {starDisplay} {hotel.city}{hotel.country ? `, ${hotel.country}` : ""}
              </div>
            )}
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 300,
                fontStyle: "italic",
                lineHeight: 1.1,
                color: "var(--cream)",
              }}
            >
              {hotel.hotel_name}
            </h1>
          </motion.div>

          {/* Save up to badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="shrink-0 text-center hidden sm:block"
            style={{
              background: "var(--gold)",
              color: "var(--ink)",
              padding: "12px 24px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Save up to
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: 500,
                fontFamily: "var(--font-display)",
                lineHeight: 1.2,
              }}
            >
              {heroSavePercent}%
            </div>
            <div style={{ fontSize: "10px", opacity: 0.7 }}>vs. public rates</div>
          </motion.div>
        </div>

        {/* Save / Heart button */}
        <button
          onClick={handleHeartClick}
          aria-label={isSaved ? "Remove from saved hotels" : "Save this hotel"}
          aria-pressed={isSaved}
          className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center justify-center z-10"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(26,23,16,0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "none",
            cursor: "pointer",
            transition: "transform 0.15s ease, background 0.15s ease",
            color: isSaved ? "var(--gold)" : "var(--cream)",
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isSaved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Photo counter */}
        {photos.length > 1 && (
          <button
            onClick={() => openLightbox(0)}
            className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-1.5 px-3 py-1.5 z-10"
            style={{
              background: "rgba(26,23,16,0.6)",
              backdropFilter: "blur(8px)",
              color: "var(--cream)",
              fontSize: "11px",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-mono)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            {photos.length} photos
          </button>
        )}
      </section>

      {/* ═══════════════════ Trust Signals ═══════════════════ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <TrustSignals hotelId={hotel.hotel_id} rating={hotel.rating_average} reviewCount={hotel.number_of_reviews} />
      </div>

      {/* ═══════════════════ Urgency Banner ═══════════════════ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <UrgencyBanner hotelId={hotel.hotel_id} />
      </div>

      {/* ═══════════════════ Tab Bar (Sticky) ═══════════════════ */}
      <div
        className="tab-navigation flex gap-0 sticky top-[60px] overflow-x-auto"
        style={{
          background: "#ffffff",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          marginTop: 16,
          zIndex: 50,
        }}
      >
        <div className="flex gap-0 md:gap-2 mx-auto max-w-[1200px] w-full px-6 md:px-12 lg:px-16">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              style={{
                padding: "14px 20px",
                color: activeTab === tab ? "var(--ink)" : "var(--ink-light)",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid var(--ink)" : "2px solid transparent",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                fontFamily: "var(--font-body)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════ Two-Column Layout ═══════════════════ */}
      <div
        className="flex flex-col lg:grid mx-auto"
        style={{
          maxWidth: 1200,
          gridTemplateColumns: "1fr 380px",
          gap: 0,
          padding: "0 24px",
        }}
      >
        {/* ─── Left: Scrollable Content ─── */}
        <div style={{ padding: "32px 0 120px 0" }} className="lg:pr-10">

          {/* ══════ ROOMS SECTION ══════ */}
          <div id="rooms" ref={roomsRef} style={{ scrollMarginTop: "120px" }}>
            {/* Stay summary header */}
            <div
              className="flex items-center flex-wrap gap-2 mb-6"
              style={{
                fontSize: "13px",
                color: "var(--ink-light)",
                fontFamily: "var(--font-body)",
              }}
            >
              <span style={{ fontWeight: 500, color: "var(--ink)" }}>
                {booking.nights > 0 ? `${booking.nights} night${booking.nights > 1 ? "s" : ""}` : "1 night"}
              </span>
              {booking.checkIn && booking.checkOut && (
                <>
                  <span>&middot;</span>
                  <span>{booking.formatDate(booking.checkIn)} &ndash; {booking.formatDate(booking.checkOut)}</span>
                </>
              )}
              <span>&middot;</span>
              <span>{booking.guestSummary}</span>
            </div>

            {/* "Member rates" callout */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "var(--gold-pale)",
                border: "1px solid var(--gold-light)",
                marginBottom: 24,
                fontSize: "13px",
                fontFamily: "var(--font-body)",
                color: "var(--ink-mid)",
                flexWrap: "wrap",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ color: "var(--ink)" }}>Member rates</strong> — not available on MakeMyTrip, Booking.com, or any public platform. Join free to see your rate.
              </span>
              {!user && (
                <button
                  onClick={() => {
                    setPendingPackageId(null);
                    setLoginIntent("room-select");
                    setLoginModalOpen(true);
                  }}
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "8px 18px",
                    border: "1px solid var(--gold)",
                    background: "transparent",
                    color: "var(--gold)",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Join Free →
                </button>
              )}
            </div>

            {/* ── Room filter bar ── */}
            <RoomFilterBar
              freeCancellation={filterFreeCancellation}
              onToggleFreeCancellation={() => setFilterFreeCancellation((v) => !v)}
              bedType={filterBedType}
              onChangeBedType={setFilterBedType}
              mealPlan={filterMealPlan}
              onChangeMealPlan={setFilterMealPlan}
            />

            {/* ── Empty filter state ── */}
            {preferredRooms.length === 0 && standardRooms.length === 0 && (
              <div
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--cream-border)",
                  padding: "24px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "var(--ink-light)",
                  fontFamily: "var(--font-body)",
                  marginBottom: 24,
                }}
              >
                No rooms match the current filters. Try clearing a filter to see more options.
              </div>
            )}

            {/* ── Preferred Rates Section ── */}
            {preferredRooms.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    style={{
                      width: 4,
                      height: 24,
                      background: "var(--gold)",
                      flexShrink: 0,
                    }}
                  />
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "20px",
                      fontWeight: 500,
                      color: "var(--ink)",
                    }}
                  >
                    Preferred Rates
                  </h3>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--gold)",
                      background: "var(--gold-pale)",
                      padding: "3px 8px",
                    }}
                  >
                    Voyagr Club
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--ink-light)",
                    marginBottom: 16,
                    lineHeight: 1.6,
                  }}
                >
                  The same rates travel agents pay. Never listed publicly.
                </p>

                <div className="flex flex-col gap-4">
                  {preferredRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      baseRateInr={baseRateInr}
                      selectedPackageId={selectedPackageId}
                      isHighlighted={highlightedRoomId === room.id}
                      cancellation={cancellationFor(room)}
                      mealPlanFilter={filterMealPlan}
                      freeCancellationFilter={filterFreeCancellation}
                      cardRef={(el) => { roomCardRefs.current[room.id] = el; }}
                      onSelectPackage={(pid) => setSelectedPackageId(selectedPackageId === pid ? null : pid)}
                      onProceedPackage={(r, pkg) => handlePackageSelectCTA(r, pkg)}
                      onOpenRoomGallery={(roomPhotos, startIdx) => openLightbox(startIdx, roomPhotos)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Standard Rates Section ── */}
            {standardRooms.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    style={{
                      width: 4,
                      height: 24,
                      background: "var(--cream-border)",
                      flexShrink: 0,
                    }}
                  />
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "20px",
                      fontWeight: 500,
                      color: "var(--ink)",
                    }}
                  >
                    Standard Rates
                  </h3>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--ink-light)",
                    marginBottom: 16,
                    lineHeight: 1.6,
                  }}
                >
                  Room-only rates at discounted prices.
                </p>

                <div className="flex flex-col gap-4">
                  {standardRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      baseRateInr={baseRateInr}
                      selectedPackageId={selectedPackageId}
                      isHighlighted={highlightedRoomId === room.id}
                      cancellation={cancellationFor(room)}
                      mealPlanFilter={filterMealPlan}
                      freeCancellationFilter={filterFreeCancellation}
                      cardRef={(el) => { roomCardRefs.current[room.id] = el; }}
                      onSelectPackage={(pid) => setSelectedPackageId(selectedPackageId === pid ? null : pid)}
                      onProceedPackage={(r, pkg) => handlePackageSelectCTA(r, pkg)}
                      onOpenRoomGallery={(roomPhotos, startIdx) => openLightbox(startIdx, roomPhotos)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══════ OVERVIEW SECTION ══════ */}
          <div ref={overviewRef} style={{ scrollMarginTop: "120px", paddingTop: 32 }}>
            <div className="flex items-center gap-3 mb-5">
              <div style={{ width: 4, height: 24, background: "var(--ink)", flexShrink: 0 }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 500, color: "var(--ink)" }}>
                Overview
              </h3>
            </div>

            {hotel.overview && (() => {
              const plain = hotel.overview.replace(/<[^>]*>/g, "").trim();
              const sentenceMatches = plain.match(/[^.!?]+[.!?]+(\s|$)/g);
              const sentences = sentenceMatches ? sentenceMatches.map((s) => s.trim()) : [plain];
              const hasMore = sentences.length > 3;
              const shown = overviewExpanded || !hasMore
                ? plain
                : sentences.slice(0, 3).join(" ");
              return (
                <p style={{ fontSize: "14px", color: "var(--ink-mid)", lineHeight: 1.8, marginBottom: 24 }}>
                  {shown}
                  {hasMore && (
                    <>
                      {" "}
                      <button
                        onClick={() => setOverviewExpanded((v) => !v)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          color: "var(--gold)",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          fontSize: "14px",
                        }}
                      >
                        {overviewExpanded ? "Read less" : "Read more \u2192"}
                      </button>
                    </>
                  )}
                </p>
              );
            })()}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {hotel.checkin && (
                <div style={{ background: "var(--white)", padding: "14px 16px", border: "1px solid var(--cream-border)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 4 }}>Check-in</div>
                  <div style={{ fontSize: "14px", color: "var(--ink)", fontWeight: 500 }}>{hotel.checkin}</div>
                </div>
              )}
              {hotel.checkout && (
                <div style={{ background: "var(--white)", padding: "14px 16px", border: "1px solid var(--cream-border)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 4 }}>Check-out</div>
                  <div style={{ fontSize: "14px", color: "var(--ink)", fontWeight: 500 }}>{hotel.checkout}</div>
                </div>
              )}
              {hotel.numberrooms && (
                <div style={{ background: "var(--white)", padding: "14px 16px", border: "1px solid var(--cream-border)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 4 }}>Total Rooms</div>
                  <div style={{ fontSize: "14px", color: "var(--ink)", fontWeight: 500 }}>{hotel.numberrooms}</div>
                </div>
              )}
              {hotel.yearrenovated && (
                <div style={{ background: "var(--white)", padding: "14px 16px", border: "1px solid var(--cream-border)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 4 }}>Last Renovated</div>
                  <div style={{ fontSize: "14px", color: "var(--ink)", fontWeight: 500 }}>{hotel.yearrenovated}</div>
                </div>
              )}
              {hotel.accommodation_type && (
                <div style={{ background: "var(--white)", padding: "14px 16px", border: "1px solid var(--cream-border)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 4 }}>Type</div>
                  <div style={{ fontSize: "14px", color: "var(--ink)", fontWeight: 500 }}>{hotel.accommodation_type}</div>
                </div>
              )}
            </div>
          </div>

          {/* ══════ GALLERY SECTION ══════ */}
          <div ref={galleryRef} style={{ scrollMarginTop: "120px", paddingTop: 32 }}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div style={{ width: 4, height: 24, background: "var(--ink)", flexShrink: 0 }} />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 500, color: "var(--ink)" }}>
                  Gallery
                </h3>
              </div>
              {photos.length > 0 && (
                <button
                  onClick={() => openLightbox(0)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "var(--gold)",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  View All →
                </button>
              )}
            </div>

            {photos.length > 0 ? (
              <>
                {hasCategorisedPhotos && photosByCategory && (
                  <div
                    className="flex gap-3 mb-5"
                    style={{
                      overflowX: "auto",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                      paddingBottom: 4,
                    }}
                  >
                    {availableCategories.map((cat) => {
                      const catPhotos = (photosByCategory[cat] as string[]) || [];
                      const thumb = catPhotos[0];
                      const isActive = activeGalleryCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() =>
                            setActiveGalleryCategory((prev) => (prev === cat ? null : cat))
                          }
                          style={{
                            flexShrink: 0,
                            width: 120,
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            fontFamily: "var(--font-body)",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              aspectRatio: "4/3",
                              overflow: "hidden",
                              background: "var(--cream-deep)",
                              border: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                              transition: "border-color 0.2s",
                            }}
                          >
                            {thumb ? (
                              <img
                                src={safePhotoUrl(thumb)}
                                alt={cat}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                              />
                            ) : null}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: isActive ? "var(--ink)" : "var(--ink-light)",
                              fontWeight: isActive ? 600 : 500,
                              marginTop: 6,
                              letterSpacing: "0.02em",
                            }}
                          >
                            {cat}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 8,
                  }}
                >
                  {visibleGalleryPhotos.map((photo, i) => (
                    <div
                      key={`${photo}-${i}`}
                      onClick={() => {
                        const idx = photos.indexOf(photo);
                        openLightbox(idx >= 0 ? idx : 0);
                      }}
                      style={{
                        cursor: "pointer",
                        aspectRatio: "4/3",
                        overflow: "hidden",
                        background: "var(--cream-deep)",
                      }}
                    >
                      <img
                        src={safePhotoUrl(photo)}
                        alt={`${hotel.hotel_name} photo ${i + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                        onMouseEnter={(e) => { (e.target as HTMLImageElement).style.transform = "scale(1.05)"; }}
                        onMouseLeave={(e) => { (e.target as HTMLImageElement).style.transform = "scale(1)"; }}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--ink-light)" }}>No photos available for this property.</p>
            )}
          </div>

          {/* ══════ LOCATION SECTION ══════ */}
          {(address || (hotel.latitude != null && hotel.longitude != null)) && (() => {
            const mapsQuery = encodeURIComponent(address || `${hotel.latitude},${hotel.longitude}`);
            const mapsHref = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
            return (
              <div style={{ scrollMarginTop: "120px", paddingTop: 32 }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                    fontFamily: "var(--font-body)",
                    marginBottom: 10,
                  }}
                >
                  Location
                </div>
                {address && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--ink-mid)",
                      lineHeight: 1.6,
                      marginBottom: 12,
                    }}
                  >
                    {address}
                  </p>
                )}
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--gold)",
                    textDecoration: "none",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  View on Google Maps →
                </a>
              </div>
            );
          })()}

          {/* ══════ WHAT'S NEARBY SECTION ══════ */}
          {hotel.nearby && hotel.nearby.length > 0 && (
            <div style={{ scrollMarginTop: "120px", paddingTop: 32 }}>
              <div className="flex items-center gap-3 mb-5">
                <div style={{ width: 4, height: 24, background: "var(--ink)", flexShrink: 0 }} />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 500, color: "var(--ink)" }}>
                  What&apos;s nearby
                </h3>
              </div>
              <div style={{ background: "var(--white)", border: "1px solid var(--cream-border)" }}>
                {hotel.nearby.slice(0, 5).map((item, i, arr) => (
                  <div
                    key={`${item.name}-${i}`}
                    className="flex items-center justify-between"
                    style={{
                      padding: "14px 16px",
                      borderBottom: i < arr.length - 1 ? "1px solid var(--cream-border)" : "none",
                      fontSize: "14px",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <span style={{ color: "var(--ink)" }}>{item.name}</span>
                    <span
                      style={{
                        color: "var(--ink-light)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                      }}
                    >
                      {item.distance_km.toFixed(1)} km
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════ REVIEWS SECTION ══════ */}
          <div ref={reviewsRef} style={{ scrollMarginTop: "120px", paddingTop: 32 }}>
            <div className="flex items-center gap-3 mb-5">
              <div style={{ width: 4, height: 24, background: "var(--ink)", flexShrink: 0 }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 500, color: "var(--ink)" }}>
                Reviews
              </h3>
            </div>

            {hotel.rating_average > 0 ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "var(--gold-pale)",
                      border: "2px solid var(--gold)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-display)",
                      fontSize: "24px",
                      fontWeight: 500,
                      color: "var(--ink)",
                    }}
                  >
                    {hotel.rating_average.toFixed(1)}
                  </div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 500, color: "var(--ink)" }}>
                      {hotel.rating_average >= 9 ? "Exceptional" : hotel.rating_average >= 8 ? "Excellent" : hotel.rating_average >= 7 ? "Very Good" : "Good"}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--ink-light)" }}>
                      Based on {hotel.number_of_reviews.toLocaleString()} verified reviews
                    </div>
                  </div>
                </div>

                {(hotel.rating_value != null || hotel.rating_service != null || hotel.rating_location != null) && (() => {
                  const subScores: { label: string; value: number | null | undefined }[] = [
                    { label: "Value", value: hotel.rating_value },
                    { label: "Service", value: hotel.rating_service },
                    { label: "Location", value: hotel.rating_location },
                  ].filter((s) => s.value != null) as { label: string; value: number }[];
                  if (subScores.length === 0) return null;
                  return (
                    <div
                      className="flex items-stretch"
                      style={{
                        background: "var(--white)",
                        border: "1px solid var(--cream-border)",
                        marginBottom: 20,
                      }}
                    >
                      {subScores.map((s, i) => (
                        <div
                          key={s.label}
                          className="flex-1 text-center"
                          style={{
                            padding: "14px 12px",
                            borderLeft: i === 0 ? "none" : "1px solid var(--cream-border)",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "20px",
                              fontWeight: 500,
                              color: "var(--ink)",
                              lineHeight: 1.2,
                            }}
                          >
                            {(s.value as number).toFixed(1)}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              color: "var(--ink-light)",
                              marginTop: 4,
                              fontFamily: "var(--font-body)",
                            }}
                          >
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--ink-light)" }}>
                No reviews available yet for this property.
              </p>
            )}
          </div>
        </div>

        {/* ─── Right: Sticky Booking Sidebar ─── */}
        <div className="hidden lg:block" style={{ paddingTop: 32 }}>
          <div
            className="sticky"
            style={{
              top: 120,
              background: "var(--white)",
              border: "1px solid var(--cream-border)",
              padding: 0,
              overflow: "hidden",
            }}
          >
            {/* Sidebar header */}
            <div
              style={{
                background: "var(--ink)",
                color: "var(--cream)",
                padding: "20px 24px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: 6,
                }}
              >
                Your selection
              </p>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "20px",
                  fontWeight: 400,
                  fontStyle: "italic",
                  lineHeight: 1.2,
                }}
              >
                {hotel.hotel_name}
              </h3>
            </div>

            <div style={{ padding: "24px" }}>
              {!selectedRoom ? (
                /* Empty state */
                <div className="text-center" style={{ padding: "20px 0" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--cream-border)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px" }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <p style={{ fontSize: "13px", color: "var(--ink-light)" }}>
                    Select a room to unlock your rate
                  </p>
                </div>
              ) : (
                /* Room selected */
                <motion.div
                  key={selectedPackageId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Selected room name + package */}
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "var(--ink)",
                      marginBottom: 4,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {selectedRoom.name}
                  </p>
                  {selectedPackage && (
                    <p
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--gold)",
                        marginBottom: 16,
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {selectedPackage.name}
                    </p>
                  )}

                  {/* Price per night */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span style={{ fontSize: "13px", color: "var(--ink-mid)" }}>Preferred rate</span>
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: 500,
                        fontFamily: "var(--font-display)",
                        color: "var(--ink)",
                      }}
                    >
                      {formatInr(selectedVoyagrRate)}
                    </span>
                  </div>

                  {/* Market rate */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span style={{ fontSize: "12px", color: "var(--ink-light)" }}>Public rate</span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "var(--ink-light)",
                        textDecoration: "line-through",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {formatInr(selectedMarketRate)}
                    </span>
                  </div>

                  {/* Saving */}
                  <div
                    className="flex items-baseline justify-between mb-4"
                    style={{
                      paddingBottom: 16,
                      borderBottom: "1px solid var(--cream-border)",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 600 }}>
                      You save per night
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "var(--success)",
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {formatInr(selectedSaving)}
                    </span>
                  </div>

                  {/* Perks */}
                  {selectedPackage && selectedPackage.inclusions.length > 0 && (
                    <div className="mb-4" style={{ paddingBottom: 16, borderBottom: "1px solid var(--cream-border)" }}>
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--ink-light)",
                          marginBottom: 8,
                        }}
                      >
                        Included perks
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {selectedPackage.inclusions.map((inc) => (
                          <div key={inc} className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span style={{ fontSize: "13px", color: "var(--ink-mid)" }}>{inc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nights x rate breakdown */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span style={{ fontSize: "13px", color: "var(--ink-mid)" }}>
                      {nights} night{nights > 1 ? "s" : ""} &times; {formatInr(selectedVoyagrRate)}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "var(--ink-mid)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {formatInr(totalPrice)}
                    </span>
                  </div>

                  {/* Total */}
                  <div
                    className="flex items-baseline justify-between"
                    style={{
                      paddingTop: 12,
                      borderTop: "1px solid var(--cream-border)",
                      marginTop: 8,
                    }}
                  >
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
                      Total
                    </span>
                    <span
                      style={{
                        fontSize: "24px",
                        fontWeight: 500,
                        fontFamily: "var(--font-display)",
                        color: "var(--ink)",
                      }}
                    >
                      {formatInr(totalPrice)}
                    </span>
                  </div>

                  {/* Total saving */}
                  <p
                    className="text-right"
                    style={{
                      fontSize: "12px",
                      color: "var(--success)",
                      fontWeight: 500,
                      marginTop: 4,
                    }}
                  >
                    Total saving: {formatInr(selectedSaving * nights)}
                  </p>
                </motion.div>
              )}

              {/* Unlock Preferred Rate button */}
              <button
                disabled={!selectedRoom}
                onClick={() => {
                  if (selectedRoom) {
                    setUnlockModalOpen(true);
                  }
                }}
                className={selectedRoom ? "unlock-rate-btn-pulse" : ""}
                style={{
                  width: "100%",
                  marginTop: 24,
                  padding: "14px 0",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background: selectedRoom ? "var(--gold)" : "var(--cream-border)",
                  color: selectedRoom ? "var(--ink)" : "var(--ink-light)",
                  border: "none",
                  cursor: selectedRoom ? "pointer" : "not-allowed",
                  transition: "all 0.3s",
                  fontFamily: "var(--font-body)",
                  opacity: selectedRoom ? 1 : 0.6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {selectedRoom ? "Unlock Preferred Rate" : "Select a Room"}
              </button>

              {/* Trust note */}
              <p
                className="text-center"
                style={{
                  fontSize: "11px",
                  color: "var(--ink-light)",
                  marginTop: 12,
                  lineHeight: 1.5,
                }}
              >
                No payment required &middot; Our concierge will confirm your rate on WhatsApp within 15 mins
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ Sticky Bottom Bar (Mobile + Desktop) ═══════════════════ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(26,23,16,0.97)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(201,168,76,0.2)",
          padding: "0 24px",
        }}
      >
        <div
          className="flex items-center justify-between mx-auto gap-4"
          style={{
            maxWidth: 1200,
            height: 64,
          }}
        >
          {/* Left: Hotel name + selected price */}
          <div className="flex-1 min-w-0">
            <p
              className="truncate"
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--cream)",
                fontFamily: "var(--font-display)",
                lineHeight: 1.2,
              }}
            >
              {hotel.hotel_name}
            </p>
            {selectedRoom && selectedPackage ? (
              <p style={{ fontSize: "12px", color: "var(--gold)", marginTop: 2 }}>
                {selectedPackage.name} &middot; Total {formatInr(totalPrice)} ({nights} night{nights > 1 ? "s" : ""})
              </p>
            ) : (
              <p style={{ fontSize: "12px", color: "var(--gold)", marginTop: 2 }}>
                Member rate from {formatInr(baseRateInr)}/night
              </p>
            )}
          </div>

          {/* Select Room CTA — scrolls to Rooms (gated on login) */}
          <button
            onClick={() => {
              if (!user) {
                setPendingPackageId(null);
                setLoginModalOpen(true);
                return;
              }
              document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              padding: "10px 24px",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "var(--gold)",
              color: "var(--ink)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap",
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Select Room →
          </button>
        </div>
      </div>

      {/* ═══════════════════ Unlock Rate Modal ═══════════════════ */}
      {selectedRoom && selectedPackage && hotel && (
        <UnlockRateModal
          open={unlockModalOpen}
          onClose={() => setUnlockModalOpen(false)}
          hotelId={hotel.hotel_id}
          hotelName={hotel.hotel_name}
          roomName={`${selectedRoom.name} \u2022 ${selectedPackage.name}`}
          rateType={selectedRoom.tier}
          checkIn={booking.checkIn}
          checkOut={booking.checkOut}
          nights={nights}
          guests={booking.guestSummary}
          nightlyRate={selectedVoyagrRate}
          marketRate={selectedMarketRate}
          currency="INR"
          perks={selectedPackage.inclusions}
        />
      )}

      {/* ═══════════════════ Login Gate Modal ═══════════════════ */}
      {loginModalOpen && (
        <RoomSelectLoginModal
          onClose={() => {
            setLoginModalOpen(false);
            setPendingPackageId(null);
            setPendingSaveAfterLogin(false);
          }}
          onSuccess={handleLoginSuccess}
          heading={
            loginIntent === "save-hotel"
              ? "Join free to save this hotel"
              : "Join free to book this room"
          }
          subtext={
            loginIntent === "save-hotel"
              ? "Join free to save hotels and access them anytime"
              : "See member rates and book in minutes. Free forever."
          }
        />
      )}

      {/* ═══════════════════ WhatsApp Concierge Trigger (40s delay) ═══════════════════ */}
      {hotel && <HotelPageWhatsAppTrigger hotelName={hotel.hotel_name} />}

      <style jsx global>{`
        @keyframes roomCardHighlightPulse {
          0% { box-shadow: 0 0 0 0 rgba(212,162,76,0.45); }
          60% { box-shadow: 0 0 0 12px rgba(212,162,76,0); }
          100% { box-shadow: 0 0 0 0 rgba(212,162,76,0); }
        }
        .room-card-highlight-pulse {
          animation: roomCardHighlightPulse 1.2s ease-out 2;
        }
      `}</style>
    </div>
  );
}
