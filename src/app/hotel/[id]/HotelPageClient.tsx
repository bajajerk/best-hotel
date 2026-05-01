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
  nearby?: NearbyLandmark[] | null;
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

/* Member benefits — same vocabulary as HomePageClient + CityPageClient */
const MEMBER_BENEFITS: { label: string; icon: string }[] = [
  { label: "Preferred member rate", icon: "★" },
  { label: "Daily breakfast for two", icon: "★" },
  { label: "Room upgrade (subject to availability)", icon: "★" },
  { label: "4pm late checkout", icon: "★" },
  { label: "Concierge confirmation in 15 min", icon: "★" },
];

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

const TABS = ["Rates", "The Stay", "Gallery", "Reviews"] as const;
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
    "half-board": "Half Board",
    "full-board": "Full Board",
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
            <option value="half-board">Half Board</option>
            <option value="full-board">Full Board</option>
          </select>
        </FilterPillShell>
      </div>
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
            {plan.meal_basis || "Room Only"}
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

/* ────────────────────────── Trust Strip (champagne) ────────────────────────── */

function TrustStrip() {
  const items = [
    "Free cancellation",
    "No payment now",
    "Concierge confirmation in 15 min",
    "Member rates · live pricing",
  ];
  return (
    <div
      className="flex flex-wrap items-center justify-center"
      style={{
        gap: "10px 22px",
        fontFamily: "var(--font-body)",
        fontSize: 12.5,
        color: "var(--luxe-champagne)",
        letterSpacing: "0.04em",
      }}
    >
      {items.map((item, i) => (
        <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span aria-hidden style={{ fontSize: 10, opacity: 0.85 }}>★</span>
          <span style={{ color: "var(--luxe-soft-white-70)" }}>{item}</span>
          {i < items.length - 1 && (
            <span aria-hidden style={{ color: "var(--luxe-hairline-strong)", marginLeft: 22, opacity: 0.6 }}>·</span>
          )}
        </span>
      ))}
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
  const [activeGalleryCategory, setActiveGalleryCategory] = useState<GalleryCategory | null>(null);

  /* Tabs */
  const [activeTab, setActiveTab] = useState<TabName>("Rates");

  /* Rate plan selection */
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [highlightedOptionId, setHighlightedOptionId] = useState<string | null>(null);
  const rateCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* Filter bar state */
  const [filterFreeCancellation, setFilterFreeCancellation] = useState(false);
  const [filterMealPlan, setFilterMealPlan] = useState<MealPlanFilter>("all");

  /* Unlock Rate modal */
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);

  /* Overview expanded state (show first 3 sentences by default) */
  const [overviewExpanded, setOverviewExpanded] = useState(false);

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
  const galleryRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

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
      "Gallery": galleryRef,
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
      { ref: galleryRef, tab: "Gallery" },
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

  /* Editorial overview parts */
  const overviewPlain = hotel.overview ? hotel.overview.replace(/<[^>]*>/g, "").trim() : "";
  const sentenceMatches = overviewPlain.match(/[^.!?]+[.!?]+(\s|$)/g);
  const sentences = sentenceMatches ? sentenceMatches.map((s) => s.trim()) : [overviewPlain];
  const overviewHasMore = sentences.length > 3;
  const overviewLeadFirst = sentences[0] || "";
  const overviewLeadRest = sentences.slice(1, 3).join(" ");
  const overviewExtra = sentences.slice(3).join(" ");

  /* Bento gallery slots (first 5) */
  const bentoPhotos = photos.slice(0, 5);

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

      {/* ═══════════════════ 1. HERO ═══════════════════ */}
      <header
        style={{
          position: "relative",
          minHeight: "min(720px, 92vh)",
          display: "flex",
          alignItems: "flex-end",
          paddingTop: 96,
          paddingBottom: 56,
          paddingLeft: 24,
          paddingRight: 24,
          overflow: "hidden",
          background: "var(--luxe-black)",
        }}
      >
        {/* Background image — clickable to open gallery */}
        <button
          onClick={() => openLightbox(0)}
          aria-label="Open gallery"
          style={{
            position: "absolute",
            inset: 0,
            background: `url(${heroImage}) center/cover no-repeat`,
            filter: "saturate(0.92) brightness(0.7)",
            border: "none",
            padding: 0,
            cursor: "pointer",
            zIndex: 0,
          }}
        />
        {/* Gradient overlay */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(12,11,10,0.55) 0%, rgba(12,11,10,0.25) 32%, rgba(12,11,10,0.85) 88%, rgba(12,11,10,0.96) 100%)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* Save / Heart button (top-left) */}
        <button
          onClick={handleHeartClick}
          aria-label={isSaved ? "Remove from saved hotels" : "Save this hotel"}
          aria-pressed={isSaved}
          className="absolute top-20 left-4 md:top-24 md:left-8 flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(12,11,10,0.55)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid var(--luxe-hairline-strong)",
            cursor: "pointer",
            transition: "transform 0.15s ease, background 0.15s ease",
            color: isSaved ? "var(--luxe-champagne)" : "var(--luxe-soft-white)",
            zIndex: 5,
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)"; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Photo counter (top-right) */}
        {photos.length > 1 && (
          <button
            onClick={() => openLightbox(0)}
            className="absolute top-20 right-4 md:top-24 md:right-8 flex items-center gap-2 px-4 py-2"
            style={{
              background: "rgba(12,11,10,0.6)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "var(--luxe-soft-white)",
              fontSize: 11,
              letterSpacing: "0.18em",
              fontFamily: "var(--font-mono)",
              border: "1px solid var(--luxe-hairline-strong)",
              borderRadius: 999,
              cursor: "pointer",
              fontWeight: 600,
              textTransform: "uppercase",
              zIndex: 5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            View all · {photos.length}
          </button>
        )}

        {/* Hero content */}
        <div className="luxe-container" style={{ position: "relative", zIndex: 1, width: "100%" }}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="luxe-tech" style={{ marginBottom: 16 }}>
              {hotel.city.toUpperCase()}
              {hotel.country && (
                <>
                  <span style={{ margin: "0 8px", opacity: 0.5 }}>·</span>
                  <span style={{ color: "var(--luxe-soft-white-50)" }}>
                    {hotel.country.toUpperCase()}
                  </span>
                </>
              )}
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="luxe-display"
              style={{
                fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
                fontSize: "clamp(40px, 6.4vw, 84px)",
                fontWeight: 300,
                fontStyle: "italic",
                lineHeight: 1.04,
                color: "var(--luxe-soft-white)",
                marginBottom: 22,
                letterSpacing: "-0.02em",
                maxWidth: 1100,
              }}
            >
              {hotel.hotel_name}
            </motion.h1>

            {/* Star + chain pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
                marginBottom: 24,
              }}
            >
              {starDisplay && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "var(--luxe-champagne-soft)",
                    border: "1px solid var(--luxe-champagne-line)",
                    color: "var(--luxe-champagne)",
                    fontSize: 12,
                    letterSpacing: "0.16em",
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
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid var(--luxe-hairline-strong)",
                    color: "var(--luxe-soft-white)",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                  }}
                >
                  <span style={{ color: "var(--luxe-champagne)" }}>{hotel.rating_average.toFixed(1)}</span>
                  <span style={{ color: "var(--luxe-soft-white-50)" }}>/ 10</span>
                  {hotel.number_of_reviews > 0 && (
                    <span style={{ color: "var(--luxe-soft-white-50)" }}>· {hotel.number_of_reviews.toLocaleString()} reviews</span>
                  )}
                </span>
              )}
              {hotel.chain_name && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid var(--luxe-hairline-strong)",
                    color: "var(--luxe-soft-white-70)",
                    fontSize: 12,
                    letterSpacing: "0.04em",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {hotel.chain_name}
                </span>
              )}
            </motion.div>

            {/* Champagne lead */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.36 }}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--luxe-champagne)",
                letterSpacing: "0.06em",
                marginBottom: 30,
              }}
            >
              <span style={{ fontWeight: 600 }}>Preferred rate</span>
              <span style={{ color: "var(--luxe-soft-white-50)", margin: "0 8px" }}>·</span>
              <span style={{ color: "var(--luxe-soft-white-70)" }}>
                {heroSavePercent != null
                  ? `Voyagr Club members save up to ${heroSavePercent}% vs. public rates`
                  : "Voyagr Club members save on every stay"}
              </span>
            </motion.p>

            {/* Scroll CTA */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.44 }}
              style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}
            >
              <button
                onClick={() => document.getElementById("rates")?.scrollIntoView({ behavior: "smooth" })}
                className="luxe-btn-primary"
                aria-label="See member rates"
              >
                See member rates ↓
              </button>
              <a
                href={conciergeWhatsappLink(`Hi, I'm interested in ${hotel.hotel_name} in ${hotel.city}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="luxe-btn-secondary"
              >
                Ask Concierge
              </a>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ═══════════════════ 2. CHAMPAGNE TRUST STRIP ═══════════════════ */}
      <section
        style={{
          padding: "20px 24px",
          borderTop: "1px solid var(--luxe-hairline)",
          borderBottom: "1px solid var(--luxe-hairline)",
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <div className="luxe-container">
          <TrustStrip />
        </div>
      </section>

      {/* ═══════════════════ 3. STICKY TAB BAR ═══════════════════ */}
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

      {/* ═══════════════════ 4. EDITORIAL OVERVIEW ═══════════════════ */}
      <section
        ref={stayRef}
        id="the-stay"
        style={{
          padding: "80px 24px 48px",
          scrollMarginTop: 140,
        }}
      >
        <div className="luxe-container" style={{ padding: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: 36,
            }}
          >
            <div style={{ maxWidth: 760 }}>
              <div className="luxe-tech" style={{ marginBottom: 12 }}>
                The Stay
              </div>
              <h2
                className="luxe-display"
                style={{
                  fontSize: "clamp(32px, 4vw, 52px)",
                  marginBottom: 24,
                }}
              >
                A property our concierge <em>keeps revisiting</em>
              </h2>
            </div>

            {overviewPlain ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
                  gap: 48,
                }}
                className="hotel-overview-grid"
              >
                {/* Lead column — big italic first sentence */}
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(22px, 2.4vw, 30px)",
                      fontWeight: 300,
                      fontStyle: "italic",
                      color: "var(--luxe-soft-white)",
                      lineHeight: 1.4,
                      letterSpacing: "-0.01em",
                      marginBottom: 24,
                      borderLeft: "1px solid var(--luxe-champagne-line)",
                      paddingLeft: 24,
                    }}
                  >
                    {overviewLeadFirst || hotel.hotel_name}
                  </p>
                  {overviewLeadRest && (
                    <p
                      style={{
                        fontSize: 15,
                        color: "var(--luxe-soft-white-70)",
                        lineHeight: 1.85,
                        paddingLeft: 25,
                        marginBottom: 14,
                      }}
                    >
                      {overviewLeadRest}
                    </p>
                  )}
                  {overviewExpanded && overviewExtra && (
                    <p
                      style={{
                        fontSize: 15,
                        color: "var(--luxe-soft-white-70)",
                        lineHeight: 1.85,
                        paddingLeft: 25,
                        marginBottom: 14,
                      }}
                    >
                      {overviewExtra}
                    </p>
                  )}
                  {overviewHasMore && (
                    <button
                      onClick={() => setOverviewExpanded((v) => !v)}
                      style={{
                        marginLeft: 25,
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: "var(--luxe-champagne)",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {overviewExpanded ? "Read less" : "Read more →"}
                    </button>
                  )}
                </div>

                {/* Stay facts — luxe glass card list */}
                <div>
                  <div
                    className="luxe-card"
                    style={{
                      padding: 24,
                      borderRadius: 14,
                    }}
                  >
                    <div className="luxe-tech" style={{ marginBottom: 16 }}>
                      The Particulars
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {hotel.checkin && (
                        <FactRow label="Check-in" value={hotel.checkin} />
                      )}
                      {hotel.checkout && (
                        <FactRow label="Check-out" value={hotel.checkout} />
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
                      {hotel.accommodation_type && (
                        <FactRow label="Type" value={hotel.accommodation_type} />
                      )}
                      {hotel.brand_name && !hotel.chain_name && (
                        <FactRow label="Brand" value={hotel.brand_name} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--luxe-soft-white-70)", fontSize: 14 }}>
                Editorial coming soon for this property.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 5. BENTO GALLERY ═══════════════════ */}
      <section
        ref={galleryRef}
        id="gallery"
        style={{
          padding: "48px 24px 80px",
          borderTop: "1px solid var(--luxe-hairline)",
          scrollMarginTop: 140,
        }}
      >
        <div className="luxe-container" style={{ padding: 0 }}>
          <SectionHead
            eyebrow="In Frame"
            title="The"
            italicWord="property"
            description={
              hasCategorisedPhotos
                ? `${photos.length} photographs across ${availableCategories.length} categories. Click any image to enter the gallery.`
                : photos.length > 0
                  ? `${photos.length} photographs. Click any image to enter the gallery.`
                  : "Photographs coming soon."
            }
            rightSlot={
              photos.length > 0 ? (
                <button
                  onClick={() => openLightbox(0)}
                  className="luxe-tech"
                  style={{
                    color: "var(--luxe-champagne)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  View All &rarr;
                </button>
              ) : null
            }
          />

          {/* Category chips (if categorised photos available) */}
          {hasCategorisedPhotos && photosByCategory && (
            <div
              className="flex gap-2 mb-6 no-scrollbar"
              style={{
                overflowX: "auto",
                paddingBottom: 4,
              }}
            >
              {availableCategories.map((cat) => {
                const isActive = activeGalleryCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveGalleryCategory((prev) => (prev === cat ? null : cat))}
                    className={isActive ? "luxe-tab is-active" : "luxe-tab"}
                    style={{ flexShrink: 0 }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Bento layout — only when not actively filtering by category */}
          {!activeGalleryCategory && bentoPhotos.length >= 5 ? (
            <div
              className="hotel-bento"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gridTemplateRows: "260px 260px",
                gap: 12,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {/* Big left photo (2x2) */}
              <button
                onClick={() => openLightbox(0)}
                className="bento-tile"
                style={{
                  gridColumn: "1 / 3",
                  gridRow: "1 / 3",
                }}
              >
                <img
                  src={safePhotoUrl(bentoPhotos[0])}
                  alt={`${hotel.hotel_name} 1`}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <div className="bento-tile-overlay" />
              </button>
              {/* Top-right two */}
              <button onClick={() => openLightbox(1)} className="bento-tile">
                <img
                  src={safePhotoUrl(bentoPhotos[1])}
                  alt={`${hotel.hotel_name} 2`}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <div className="bento-tile-overlay" />
              </button>
              <button onClick={() => openLightbox(2)} className="bento-tile">
                <img
                  src={safePhotoUrl(bentoPhotos[2])}
                  alt={`${hotel.hotel_name} 3`}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <div className="bento-tile-overlay" />
              </button>
              {/* Bottom-right two */}
              <button onClick={() => openLightbox(3)} className="bento-tile">
                <img
                  src={safePhotoUrl(bentoPhotos[3])}
                  alt={`${hotel.hotel_name} 4`}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <div className="bento-tile-overlay" />
              </button>
              <button
                onClick={() => openLightbox(4)}
                className="bento-tile"
                style={{ position: "relative" }}
              >
                <img
                  src={safePhotoUrl(bentoPhotos[4])}
                  alt={`${hotel.hotel_name} 5`}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <div className="bento-tile-overlay" />
                {photos.length > 5 && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(12,11,10,0.55)",
                      color: "var(--luxe-soft-white)",
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: 22,
                      letterSpacing: "-0.01em",
                      pointerEvents: "none",
                    }}
                  >
                    + {photos.length - 5} more
                  </div>
                )}
              </button>
            </div>
          ) : (
            /* Fallback grid (mobile, < 5 photos, or category filter active) */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 10,
              }}
            >
              {visibleGalleryPhotos.map((photo, i) => (
                <button
                  key={`${photo}-${i}`}
                  onClick={() => {
                    const idx = photos.indexOf(photo);
                    openLightbox(idx >= 0 ? idx : 0);
                  }}
                  className="bento-tile"
                  style={{ aspectRatio: "4/3", borderRadius: 14 }}
                >
                  <img
                    src={safePhotoUrl(photo)}
                    alt={`${hotel.hotel_name} ${i + 1}`}
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                  />
                  <div className="bento-tile-overlay" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ 6. MEMBER BENEFITS CHIP STRIP ═══════════════════ */}
      <section
        style={{
          padding: "48px 24px 56px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
      >
        <div className="luxe-container" style={{ padding: 0 }}>
          <div className="luxe-tech" style={{ marginBottom: 12 }}>
            Member Benefits
          </div>
          <h3
            className="luxe-display"
            style={{
              fontSize: "clamp(22px, 2.4vw, 30px)",
              marginBottom: 22,
              maxWidth: 720,
            }}
          >
            Quietly negotiated <em>perks</em>, on every stay
          </h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 14,
            }}
          >
            {MEMBER_BENEFITS.map((b) => (
              <span
                key={b.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 999,
                  background: "var(--luxe-champagne-soft)",
                  border: "1px solid var(--luxe-champagne-line)",
                  color: "var(--luxe-champagne)",
                  fontSize: 12.5,
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  fontFamily: "var(--font-body)",
                }}
              >
                <span aria-hidden style={{ fontSize: 11, opacity: 0.85 }}>{b.icon}</span>
                {b.label}
              </span>
            ))}
          </div>
          <p
            style={{
              fontSize: 12,
              color: "var(--luxe-soft-white-50)",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.04em",
            }}
          >
            Subject to availability · admin-curated for preferred properties
          </p>
        </div>
      </section>

      {/* ═══════════════════ 7. RATES (CLIMAX) — two-column with sticky sidebar ═══════════════════ */}
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
                ? "Negotiated directly with the hotel. No payment now — concierge confirms within 15 minutes."
                : "Choose your dates to unlock live, member-only pricing."
            }
          />

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
                    padding: "48px 32px",
                    textAlign: "center",
                    borderRadius: 14,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 24,
                      fontStyle: "italic",
                      color: "var(--luxe-soft-white)",
                      marginBottom: 10,
                    }}
                  >
                    Select your dates to see rates
                  </div>
                  <p style={{ fontSize: 13.5, color: "var(--luxe-soft-white-70)", maxWidth: 480, margin: "0 auto 22px", lineHeight: 1.7 }}>
                    Choose check-in and check-out from the search bar above to unlock live member-only pricing for {hotel.hotel_name}.
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
                        {filteredRates.length} option{filteredRates.length !== 1 ? "s" : ""}
                        {rates.nights > 0 ? ` · ${rates.nights} night${rates.nights > 1 ? "s" : ""}` : ""}
                      </p>
                      <div className="flex flex-col gap-3">
                        {filteredRates.map((plan) => (
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
                        {selectedPlan.meal_basis || "Room Only"}
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
                      color: selectedPlan ? "#0c0b0a" : "var(--luxe-soft-white-50)",
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

      {/* ═══════════════════ 8. LOCATION ═══════════════════ */}
      {(address || (hotel.latitude != null && hotel.longitude != null)) && (() => {
        const mapsQuery = encodeURIComponent(address || `${hotel.latitude},${hotel.longitude}`);
        const mapsHref = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
        const embedSrc =
          hotel.latitude != null && hotel.longitude != null
            ? `https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}&z=14&output=embed`
            : `https://www.google.com/maps?q=${mapsQuery}&z=14&output=embed`;
        return (
          <section
            style={{
              padding: "72px 24px 56px",
              borderTop: "1px solid var(--luxe-hairline)",
            }}
          >
            <div className="luxe-container" style={{ padding: 0 }}>
              <SectionHead
                eyebrow="The Setting"
                title="Where you'll"
                italicWord="be"
                description={address || undefined}
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
                  gridTemplateColumns: hotel.nearby && hotel.nearby.length > 0 ? "minmax(0, 1.6fr) minmax(0, 1fr)" : "minmax(0, 1fr)",
                  gap: 24,
                }}
              >
                <div
                  style={{
                    height: 380,
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "1px solid var(--luxe-hairline-strong)",
                    background: "var(--luxe-black-2)",
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
                    }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                {hotel.nearby && hotel.nearby.length > 0 && (
                  <div className="luxe-card" style={{ padding: 24, borderRadius: 14 }}>
                    <div className="luxe-tech" style={{ marginBottom: 14 }}>
                      What&rsquo;s nearby
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {hotel.nearby.slice(0, 6).map((item, i, arr) => (
                        <div
                          key={`${item.name}-${i}`}
                          className="flex items-center justify-between"
                          style={{
                            padding: "12px 0",
                            borderBottom: i < arr.length - 1 ? "1px solid var(--luxe-hairline)" : "none",
                            fontSize: 14,
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          <span style={{ color: "var(--luxe-soft-white)" }}>{item.name}</span>
                          <span
                            style={{
                              color: "var(--luxe-champagne)",
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              letterSpacing: "0.04em",
                            }}
                          >
                            {item.distance_km.toFixed(1)} km
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ═══════════════════ 9. REVIEWS ═══════════════════ */}
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
          {hotel.rating_average > 0 ? (
            <>
              <SectionHead
                eyebrow="Guest Verdict"
                title="What guests"
                italicWord="say"
                description={`Based on ${hotel.number_of_reviews.toLocaleString()} verified reviews — aggregated from across the web.`}
              />

              <div
                className="hotel-reviews-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
                  gap: 32,
                  alignItems: "stretch",
                }}
              >
                {/* Score panel */}
                <div
                  className="luxe-card"
                  style={{
                    padding: 28,
                    borderRadius: 14,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 64,
                      fontWeight: 400,
                      fontStyle: "italic",
                      color: "var(--luxe-champagne)",
                      lineHeight: 1,
                      marginBottom: 6,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {hotel.rating_average.toFixed(1)}
                    <span style={{ fontSize: 22, color: "var(--luxe-soft-white-50)", fontStyle: "italic", marginLeft: 4 }}>
                      / 10
                    </span>
                  </div>
                  <div
                    className="luxe-tech"
                    style={{ marginBottom: 8 }}
                  >
                    {hotel.rating_average >= 9 ? "Exceptional" : hotel.rating_average >= 8 ? "Excellent" : hotel.rating_average >= 7 ? "Very Good" : "Good"}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--luxe-soft-white-50)", marginTop: 4 }}>
                    {hotel.number_of_reviews.toLocaleString()} verified reviews
                  </div>
                </div>

                {/* Sub-scores or quote */}
                <div
                  className="luxe-card"
                  style={{
                    padding: 28,
                    borderRadius: 14,
                  }}
                >
                  {(hotel.rating_value != null || hotel.rating_service != null || hotel.rating_location != null) ? (() => {
                    const subScores: { label: string; value: number | null | undefined }[] = [
                      { label: "Value", value: hotel.rating_value },
                      { label: "Service", value: hotel.rating_service },
                      { label: "Location", value: hotel.rating_location },
                    ].filter((s) => s.value != null) as { label: string; value: number }[];
                    if (subScores.length === 0) return null;
                    return (
                      <>
                        <div className="luxe-tech" style={{ marginBottom: 18 }}>
                          By the dimension
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {subScores.map((s) => {
                            const pct = Math.max(0, Math.min(100, ((s.value as number) / 10) * 100));
                            return (
                              <div key={s.label}>
                                <div className="flex items-baseline justify-between mb-2">
                                  <span style={{ fontSize: 13, color: "var(--luxe-soft-white)", fontWeight: 500 }}>
                                    {s.label}
                                  </span>
                                  <span style={{ fontSize: 14, color: "var(--luxe-champagne)", fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.01em" }}>
                                    {(s.value as number).toFixed(1)}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    height: 3,
                                    background: "var(--luxe-hairline-strong)",
                                    borderRadius: 2,
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${pct}%`,
                                      height: "100%",
                                      background: "var(--luxe-champagne)",
                                      transition: "width 0.6s ease",
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })() : (
                    <>
                      <div
                        aria-hidden
                        style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          fontSize: 56,
                          color: "var(--luxe-champagne)",
                          opacity: 0.4,
                          lineHeight: 0.5,
                          marginBottom: 12,
                        }}
                      >
                        &ldquo;
                      </div>
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          fontSize: 22,
                          fontWeight: 300,
                          color: "var(--luxe-soft-white)",
                          lineHeight: 1.5,
                          letterSpacing: "-0.005em",
                          marginBottom: 14,
                        }}
                      >
                        {hotel.rating_average >= 9
                          ? "An impeccable property — service, setting, and the smallest details all considered."
                          : hotel.rating_average >= 8
                            ? "Well-loved by our members — a stay that delivers on every promise."
                            : "A solid choice in the city, with thoughtful service and genuine character."}
                      </p>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "var(--luxe-soft-white-50)",
                        }}
                      >
                        — Voyagr Concierge
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
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
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(8,7,6,0.94)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderTop: "1px solid var(--luxe-champagne-line)",
          padding: "0 24px",
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
                {selectedPlan.meal_basis || "Room Only"} &middot; Total {formatPrice(sidebarTotal, selectedPlan.currency)} ({nights} night{nights > 1 ? "s" : ""})
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
          roomName={`${selectedPlan.room_name} • ${selectedPlan.meal_basis || "Room Only"}`}
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
          .hotel-reviews-grid { grid-template-columns: minmax(0, 1fr) !important; }
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
