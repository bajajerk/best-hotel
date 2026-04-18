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

/* ────────────────────────── Room Card ────────────────────────── */

function RoomCard({
  room,
  voyagrRate,
  marketRate,
  isSelected,
  isHighlighted,
  cancellation,
  cardRef,
  onSelect,
  onProceed,
}: {
  room: RoomDef;
  voyagrRate: number;
  marketRate: number;
  isSelected: boolean;
  isHighlighted: boolean;
  cancellation: { refundable: boolean; freeUntil?: string };
  cardRef: (el: HTMLDivElement | null) => void;
  onSelect: () => void;
  onProceed: () => void;
}) {
  const saving = marketRate - voyagrRate;
  const savePercent = Math.round((saving / marketRate) * 100);
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
  const MAX_INCLUSIONS = 3;
  const hasMoreInclusions = room.inclusions.length > MAX_INCLUSIONS;
  const hiddenCount = room.inclusions.length - MAX_INCLUSIONS;
  const shownInclusions =
    amenitiesExpanded || !hasMoreInclusions
      ? room.inclusions
      : room.inclusions.slice(0, MAX_INCLUSIONS);

  return (
    <motion.div
      layout
      ref={cardRef}
      onClick={onSelect}
      className={isHighlighted ? "room-card-highlight-pulse" : undefined}
      style={{
        background: "var(--white)",
        border: isSelected ? "2px solid #d4a24c" : "1px solid var(--cream-border)",
        padding: isSelected ? "19px" : "20px",
        cursor: "pointer",
        transition: "border-color 0.25s, box-shadow 0.25s",
        boxShadow: isSelected ? "0 0 0 3px rgba(212,162,76,0.15)" : "none",
        position: "relative",
      }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Save badge */}
      {savePercent > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 20,
            background: "var(--success)",
            color: "#fff",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            padding: "4px 10px 5px",
            fontFamily: "var(--font-body)",
          }}
        >
          SAVE {savePercent}%
        </div>
      )}

      {/* Room Name + Size */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
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
        {isSelected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.span>
        )}
      </div>

      {/* Inclusions (max 3 shown, rest expandable) */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {shownInclusions.map((inc) => (
          <span
            key={inc}
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--success)",
              background: "var(--success-soft)",
              padding: "3px 8px",
              letterSpacing: "0.02em",
            }}
          >
            {inc}
          </span>
        ))}
        {hasMoreInclusions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAmenitiesExpanded((v) => !v);
            }}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--gold)",
              background: "none",
              border: "none",
              padding: "3px 2px",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.02em",
            }}
          >
            {amenitiesExpanded
              ? "Show less"
              : `+ ${hiddenCount} more amenit${hiddenCount === 1 ? "y" : "ies"}`}
          </button>
        )}
      </div>

      {/* Cancellation policy */}
      <div
        style={{
          fontSize: "11px",
          fontFamily: "var(--font-body)",
          marginBottom: 14,
          color: cancellation.refundable ? "var(--success)" : "var(--ink-light)",
          fontWeight: cancellation.refundable ? 500 : 400,
        }}
      >
        {cancellation.refundable
          ? `\u2713 Free cancellation until ${cancellation.freeUntil}`
          : "Non-refundable"}
      </div>

      {/* Pricing row */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              style={{
                fontSize: "11px",
                color: "var(--ink-light)",
                textDecoration: "line-through",
                fontFamily: "var(--font-mono)",
              }}
            >
              {formatInr(marketRate)}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "var(--success)",
                fontWeight: 600,
              }}
            >
              Save {formatInr(saving)}
            </span>
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 500,
              color: "var(--ink)",
              fontFamily: "var(--font-display)",
              lineHeight: 1.2,
              marginTop: 2,
            }}
          >
            {formatInr(voyagrRate)}
            <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--ink-light)", marginLeft: 4 }}>/night</span>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onProceed(); }}
          style={{
            padding: "8px 20px",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            background: isSelected ? "var(--ink)" : "var(--gold)",
            color: isSelected ? "var(--cream)" : "var(--ink)",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "var(--font-body)",
          }}
        >
          Select
        </button>
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

  /* Tabs */
  const [activeTab, setActiveTab] = useState<TabName>("Rooms");

  /* Room selection */
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null);
  const roomCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* Unlock Rate modal */
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);

  /* Overview expanded state (show first 3 sentences by default) */
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  /* Login gate modal (SELECT button on a room card, user not signed in) */
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
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
  const photos = hotel
    ? ([hotel.photo1, hotel.photo2, hotel.photo3, hotel.photo4, hotel.photo5].filter(Boolean) as string[])
    : [];

  const openLightbox = useCallback((idx: number) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
    if (hotel) {
      trackHotelGalleryOpened({ hotel_id: hotel.hotel_id, hotel_name: hotel.hotel_name, photo_index: idx });
    }
  }, [hotel]);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const prevLightbox = useCallback(
    () => setLightboxIdx((i) => (i - 1 + photos.length) % photos.length),
    [photos.length]
  );
  const nextLightbox = useCallback(
    () => setLightboxIdx((i) => (i + 1) % photos.length),
    [photos.length]
  );

  /* ── Room data ── */
  const rooms = useMemo(() => (hotel ? generateRooms(hotel) : []), [hotel]);
  const preferredRooms = useMemo(() => rooms.filter((r) => r.tier === "preferred"), [rooms]);
  const standardRooms = useMemo(() => rooms.filter((r) => r.tier === "standard"), [rooms]);
  const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedRoomId) || null, [rooms, selectedRoomId]);

  /* ── Pricing (all values displayed in INR) ── */
  const baseRate = hotel?.rates_from || 100;
  const sourceCurrency = hotel?.rates_currency || "USD";
  const baseRateInr = toInr(baseRate, sourceCurrency);
  const getVoyagrRate = (room: RoomDef) => Math.round(baseRateInr * room.priceMult);
  const getMarketRate = (room: RoomDef) => Math.round(baseRateInr * room.priceMult * 1.3);

  const nights = booking.nights || 1;
  const selectedVoyagrRate = selectedRoom ? getVoyagrRate(selectedRoom) : 0;
  const selectedMarketRate = selectedRoom ? getMarketRate(selectedRoom) : 0;
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

  /* ── Proceed to booking from a room card SELECT button ── */
  const proceedToBooking = useCallback(
    (room: RoomDef) => {
      if (!hotel) return;
      const rate = Math.round(baseRateInr * room.priceMult);
      const totalGuests = booking.rooms.reduce((s, r) => s + r.adults + r.children, 0);
      const qs = new URLSearchParams({
        hotelId: String(hotel.hotel_id),
        roomType: room.id,
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

  const handleRoomSelectCTA = useCallback(
    (room: RoomDef) => {
      setSelectedRoomId(room.id);
      if (!user) {
        setPendingRoomId(room.id);
        setLoginIntent("room-select");
        setLoginModalOpen(true);
        return;
      }
      proceedToBooking(room);
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
    const roomId = pendingRoomId;
    if (roomId) {
      setSelectedRoomId(roomId);
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
    setPendingRoomId(null);
  }, [pendingRoomId, pendingSaveAfterLogin, saveHotelToStorage]);

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
        {lightboxOpen && photos.length > 0 && (
          <Lightbox
            photos={photos}
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
            {address && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--cream)",
                  opacity: 0.7,
                  marginTop: 6,
                  letterSpacing: "0.04em",
                }}
              >
                {address}
              </p>
            )}
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
                    setPendingRoomId(null);
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
                      voyagrRate={getVoyagrRate(room)}
                      marketRate={getMarketRate(room)}
                      isSelected={selectedRoomId === room.id}
                      isHighlighted={highlightedRoomId === room.id}
                      cancellation={cancellationFor(room)}
                      cardRef={(el) => { roomCardRefs.current[room.id] = el; }}
                      onSelect={() => setSelectedRoomId(selectedRoomId === room.id ? null : room.id)}
                      onProceed={() => handleRoomSelectCTA(room)}
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
                      voyagrRate={getVoyagrRate(room)}
                      marketRate={getMarketRate(room)}
                      isSelected={selectedRoomId === room.id}
                      isHighlighted={highlightedRoomId === room.id}
                      cancellation={cancellationFor(room)}
                      cardRef={(el) => { roomCardRefs.current[room.id] = el; }}
                      onSelect={() => setSelectedRoomId(selectedRoomId === room.id ? null : room.id)}
                      onProceed={() => handleRoomSelectCTA(room)}
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
              {hotel.chain_name && (
                <div style={{ background: "var(--white)", padding: "14px 16px", border: "1px solid var(--cream-border)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 4 }}>Hotel Chain</div>
                  <div style={{ fontSize: "14px", color: "var(--ink)", fontWeight: 500 }}>{hotel.chain_name}</div>
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
            <div className="flex items-center gap-3 mb-5">
              <div style={{ width: 4, height: 24, background: "var(--ink)", flexShrink: 0 }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 500, color: "var(--ink)" }}>
                Gallery
              </h3>
            </div>

            {photos.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 8,
                }}
              >
                {photos.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => openLightbox(i)}
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
            ) : (
              <p style={{ fontSize: "13px", color: "var(--ink-light)" }}>No photos available for this property.</p>
            )}
          </div>

          {/* ══════ REVIEWS SECTION ══════ */}
          <div ref={reviewsRef} style={{ scrollMarginTop: "120px", paddingTop: 32 }}>
            <div className="flex items-center gap-3 mb-5">
              <div style={{ width: 4, height: 24, background: "var(--ink)", flexShrink: 0 }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 500, color: "var(--ink)" }}>
                Reviews
              </h3>
            </div>

            {hotel.rating_average > 0 ? (
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
                  key={selectedRoomId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Selected room name */}
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "var(--ink)",
                      marginBottom: 16,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {selectedRoom.name}
                  </p>

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
                  {selectedRoom.inclusions.length > 0 && (
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
                        {selectedRoom.inclusions.map((inc) => (
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
            {selectedRoom ? (
              <p style={{ fontSize: "12px", color: "var(--gold)", marginTop: 2 }}>
                Member rate {formatInr(selectedVoyagrRate)}/night &middot; Save {formatInr(selectedSaving)}
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
                setPendingRoomId(null);
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
      {selectedRoom && hotel && (
        <UnlockRateModal
          open={unlockModalOpen}
          onClose={() => setUnlockModalOpen(false)}
          hotelId={hotel.hotel_id}
          hotelName={hotel.hotel_name}
          roomName={selectedRoom.name}
          rateType={selectedRoom.tier}
          checkIn={booking.checkIn}
          checkOut={booking.checkOut}
          nights={nights}
          guests={booking.guestSummary}
          nightlyRate={selectedVoyagrRate}
          marketRate={selectedMarketRate}
          currency="INR"
          perks={selectedRoom.inclusions}
        />
      )}

      {/* ═══════════════════ Login Gate Modal ═══════════════════ */}
      {loginModalOpen && (
        <RoomSelectLoginModal
          onClose={() => {
            setLoginModalOpen(false);
            setPendingRoomId(null);
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
