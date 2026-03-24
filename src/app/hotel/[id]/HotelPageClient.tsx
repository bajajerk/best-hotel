"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { trackHotelViewed, trackHotelGalleryOpened } from "@/lib/analytics";
import { useBooking } from "@/context/BookingContext";

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

function formatCurrency(amount: number, currency?: string): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "\u20AC", GBP: "\u00A3", INR: "\u20B9",
    JPY: "\u00A5", AUD: "A$", SGD: "S$", THB: "\u0E3F",
    AED: "AED ", MYR: "RM ", IDR: "Rp ", KRW: "\u20A9",
  };
  const sym = currency
    ? symbols[currency.toUpperCase()] || `${currency} `
    : "$";
  const rounded = Math.round(amount);
  const formatted =
    currency?.toUpperCase() === "INR"
      ? rounded.toLocaleString("en-IN")
      : rounded.toLocaleString("en-US");
  return `${sym}${formatted}`;
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
      className="fixed inset-0 z-[100] flex items-center justify-center"
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
  currency,
  isSelected,
  onSelect,
}: {
  room: RoomDef;
  voyagrRate: number;
  marketRate: number;
  currency: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const saving = marketRate - voyagrRate;

  return (
    <motion.div
      layout
      onClick={onSelect}
      style={{
        background: "var(--white)",
        border: isSelected ? "2px solid #d4a24c" : "1px solid var(--cream-border)",
        padding: isSelected ? "19px" : "20px",
        cursor: "pointer",
        transition: "border-color 0.25s, box-shadow 0.25s",
        boxShadow: isSelected ? "0 0 0 3px rgba(212,162,76,0.15)" : "none",
      }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
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

      {/* Inclusions */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {room.inclusions.map((inc) => (
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
              {formatCurrency(marketRate, currency)}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "var(--success)",
                fontWeight: 600,
              }}
            >
              Save {formatCurrency(saving, currency)}
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
            {formatCurrency(voyagrRate, currency)}
            <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--ink-light)", marginLeft: 4 }}>/night</span>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
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
          {isSelected ? "Selected" : "Select"}
        </button>
      </div>
    </motion.div>
  );
}

/* ────────────────────────── Main Page ────────────────────────── */

export default function HotelPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params.id as string;
  const booking = useBooking();

  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [loading, setLoading] = useState(true);

  /* Gallery */
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  /* Tabs */
  const [activeTab, setActiveTab] = useState<TabName>("Rooms");

  /* Room selection */
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  /* Section refs */
  const roomsRef = useRef<HTMLDivElement>(null);

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

  /* ── Pricing ── */
  const baseRate = hotel?.rates_from || 100;
  const currency = hotel?.rates_currency || "USD";
  const getVoyagrRate = (room: RoomDef) => Math.round(baseRate * room.priceMult);
  const getMarketRate = (room: RoomDef) => Math.round(baseRate * room.priceMult * 1.3);

  const nights = booking.nights || 1;
  const selectedVoyagrRate = selectedRoom ? getVoyagrRate(selectedRoom) : 0;
  const selectedMarketRate = selectedRoom ? getMarketRate(selectedRoom) : 0;
  const selectedSaving = selectedMarketRate - selectedVoyagrRate;
  const totalPrice = selectedVoyagrRate * nights;

  /* ── Savings for hero badge ── */
  const heroSaveAmount = hotel?.rates_from ? Math.round(hotel.rates_from * 0.3) : 0;

  /* ── Star display ── */
  const starDisplay = hotel && hotel.star_rating > 0
    ? "\u2605".repeat(Math.round(hotel.star_rating))
    : "";

  /* ── Tab click handler ── */
  const handleTabClick = useCallback((tab: TabName) => {
    setActiveTab(tab);
    if (tab === "Rooms" && roomsRef.current) {
      roomsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

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
            style={{ filter: "brightness(0.75) saturate(0.9)" }}
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

          {/* You save badge */}
          {heroSaveAmount > 0 && (
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
                You save
              </div>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 500,
                  fontFamily: "var(--font-display)",
                  lineHeight: 1.2,
                }}
              >
                {formatCurrency(heroSaveAmount, currency)}
              </div>
              <div style={{ fontSize: "10px", opacity: 0.7 }}>per night</div>
            </motion.div>
          )}
        </div>

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

      {/* ═══════════════════ Tab Bar below hero ═══════════════════ */}
      <div
        className="flex gap-0 sticky top-[60px] z-40 overflow-x-auto"
        style={{
          background: "var(--white)",
          borderBottom: "1px solid var(--cream-border)",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
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
        ref={roomsRef}
        className="flex flex-col lg:grid mx-auto"
        style={{
          maxWidth: 1200,
          gridTemplateColumns: "1fr 380px",
          gap: 0,
          scrollMarginTop: "120px",
          padding: "0 24px",
        }}
      >
        {/* ─── Left: Scrollable Room List ─── */}
        <div style={{ padding: "32px 0 120px 0" }} className="lg:pr-10">
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
                Exclusive wholesale rates with premium inclusions, available only to Voyagr Club members.
              </p>

              <div className="flex flex-col gap-4">
                {preferredRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    voyagrRate={getVoyagrRate(room)}
                    marketRate={getMarketRate(room)}
                    currency={currency}
                    isSelected={selectedRoomId === room.id}
                    onSelect={() => setSelectedRoomId(selectedRoomId === room.id ? null : room.id)}
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
                    currency={currency}
                    isSelected={selectedRoomId === room.id}
                    onSelect={() => setSelectedRoomId(selectedRoomId === room.id ? null : room.id)}
                  />
                ))}
              </div>
            </div>
          )}
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
                    Select a room to see pricing
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
                    <span style={{ fontSize: "13px", color: "var(--ink-mid)" }}>Price per night</span>
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: 500,
                        fontFamily: "var(--font-display)",
                        color: "var(--ink)",
                      }}
                    >
                      {formatCurrency(selectedVoyagrRate, currency)}
                    </span>
                  </div>

                  {/* Market rate */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span style={{ fontSize: "12px", color: "var(--ink-light)" }}>Market rate</span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "var(--ink-light)",
                        textDecoration: "line-through",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {formatCurrency(selectedMarketRate, currency)}
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
                      {formatCurrency(selectedSaving, currency)}
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
                      {nights} night{nights > 1 ? "s" : ""} &times; {formatCurrency(selectedVoyagrRate, currency)}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "var(--ink-mid)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {formatCurrency(totalPrice, currency)}
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
                      {formatCurrency(totalPrice, currency)}
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
                    Total saving: {formatCurrency(selectedSaving * nights, currency)}
                  </p>
                </motion.div>
              )}

              {/* Reserve button */}
              <button
                disabled={!selectedRoom}
                onClick={() => {
                  if (selectedRoom) {
                    router.push(`/book/rooms?hotel=${hotelId}`);
                  }
                }}
                className={selectedRoom ? "reserve-btn-pulse" : ""}
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
                }}
              >
                {selectedRoom ? "Reserve Now" : "Select a Room"}
              </button>

              {/* Trust note */}
              <p
                className="text-center"
                style={{
                  fontSize: "11px",
                  color: "var(--ink-light)",
                  marginTop: 12,
                }}
              >
                No payment required now &middot; Free cancellation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ Floating Action Bar (Bottom) ═══════════════════ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(26,23,16,0.97)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(184,149,90,0.2)",
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
                {formatCurrency(selectedVoyagrRate, currency)}/night &middot; {formatCurrency(totalPrice, currency)} total
              </p>
            ) : (
              <p style={{ fontSize: "12px", color: "var(--ink-light)", marginTop: 2 }}>
                From {formatCurrency(baseRate, currency)}/night
              </p>
            )}
          </div>

          {/* Back to results */}
          <button
            onClick={() => router.back()}
            style={{
              padding: "8px 16px",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "transparent",
              color: "var(--cream)",
              border: "1px solid rgba(253,250,245,0.2)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.borderColor = "rgba(253,250,245,0.5)"; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.borderColor = "rgba(253,250,245,0.2)"; }}
          >
            Back
          </button>

          {/* Reserve button */}
          <button
            disabled={!selectedRoom}
            onClick={() => {
              if (selectedRoom) {
                router.push(`/book/rooms?hotel=${hotelId}`);
              }
            }}
            className={selectedRoom ? "reserve-btn-pulse" : ""}
            style={{
              padding: "10px 28px",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: selectedRoom ? "var(--gold)" : "rgba(253,250,245,0.1)",
              color: selectedRoom ? "var(--ink)" : "var(--ink-light)",
              border: "none",
              cursor: selectedRoom ? "pointer" : "not-allowed",
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap",
              transition: "all 0.3s",
              opacity: selectedRoom ? 1 : 0.5,
            }}
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
}
