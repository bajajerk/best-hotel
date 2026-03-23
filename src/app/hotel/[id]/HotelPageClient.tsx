"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { trackHotelViewed, trackHotelTabClicked, trackHotelGalleryOpened } from "@/lib/analytics";
import Breadcrumbs from "@/components/Breadcrumbs";
import DateBar from "@/components/DateBar";
import { extractAmenities } from "@/components/AmenityIcons";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import { PriceComparisonBars, BestPriceGuarantee, PriceProofTrustRow, TrustBadgesRow, TrustBadgesCompact } from "@/components/PriceProof";
import PriceTrendChart from "@/components/PriceTrendChart";

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

interface Review {
  id: number;
  reviewer_name: string;
  reviewer_country: string | null;
  reviewer_avatar_url: string | null;
  rating: number;
  title: string | null;
  positive: string | null;
  negative: string | null;
  trip_type: string | null;
  stay_date: string | null;
}

/* ────────────────────────── Helpers ────────────────────────── */

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=70";

function safePhotoUrl(raw: string): string {
  if (raw.startsWith("http://")) return raw.replace("http://", "https://");
  if (raw.startsWith("https://")) return raw;
  return `https://photos.hotelbeds.com/giata/${raw}`;
}

function ratingLabel(r: number): string {
  if (r >= 9) return "Exceptional";
  if (r >= 8.5) return "Excellent";
  if (r >= 8) return "Very Good";
  if (r >= 7) return "Good";
  return "Fair";
}

function sanitizeHtml(html: string): string {
  const ALLOWED_TAGS = [
    "p", "br", "b", "strong", "i", "em", "ul", "ol", "li",
    "a", "span", "div", "h1", "h2", "h3", "h4", "h5", "h6",
  ];
  let clean = html.replace(
    /<(script|style|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );
  clean = clean.replace(
    /\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi,
    ""
  );
  clean = clean.replace(
    /href\s*=\s*["']javascript:[^"']*["']/gi,
    'href="#"'
  );
  clean = clean.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    if (ALLOWED_TAGS.includes(tag.toLowerCase())) return match;
    return "";
  });
  return clean;
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

/* ────────────────────────── Placeholder Reviews ────────────────────────── */

const PLACEHOLDER_REVIEWS: Review[] = [
  {
    id: 90001,
    reviewer_name: "Sarah M.",
    reviewer_country: "United States",
    reviewer_avatar_url: null,
    rating: 9.2,
    title: "Absolutely stunning property",
    positive: "The room was immaculate and the view was breathtaking. Staff went above and beyond to make our anniversary special. The concierge arranged a surprise dinner that was unforgettable.",
    negative: null,
    trip_type: "couple",
    stay_date: "February 2026",
  },
  {
    id: 90002,
    reviewer_name: "James T.",
    reviewer_country: "United Kingdom",
    reviewer_avatar_url: null,
    rating: 8.8,
    title: "Great location and service",
    positive: "Perfect location for exploring the city. The breakfast spread was excellent with both local and international options. The pool area was a great place to unwind after a day out.",
    negative: "Check-in took a bit longer than expected during peak hours.",
    trip_type: "family",
    stay_date: "January 2026",
  },
  {
    id: 90003,
    reviewer_name: "Priya K.",
    reviewer_country: "India",
    reviewer_avatar_url: null,
    rating: 9.5,
    title: "Best hotel experience we've had",
    positive: "From the moment we arrived, the hospitality was exceptional. The spa treatment was world-class. The rooms are spacious and beautifully appointed with all modern amenities.",
    negative: null,
    trip_type: "couple",
    stay_date: "December 2025",
  },
  {
    id: 90004,
    reviewer_name: "Michael R.",
    reviewer_country: "Australia",
    reviewer_avatar_url: null,
    rating: 8.6,
    title: "Exceeded expectations",
    positive: "The hotel exceeded all our expectations. Beautiful architecture, comfortable beds, and the restaurant serves amazing food. The gym was well-equipped too.",
    negative: "Wi-Fi could be faster in the rooms, though it was fine in the lobby.",
    trip_type: "business",
    stay_date: "January 2026",
  },
  {
    id: 90005,
    reviewer_name: "Elena D.",
    reviewer_country: "Germany",
    reviewer_avatar_url: null,
    rating: 9.0,
    title: "A gem of a hotel",
    positive: "Wonderful boutique feel with all the amenities of a luxury property. The attention to detail in the room design was impressive. Staff remembered our names from day one.",
    negative: null,
    trip_type: "solo",
    stay_date: "November 2025",
  },
  {
    id: 90006,
    reviewer_name: "David L.",
    reviewer_country: "Canada",
    reviewer_avatar_url: null,
    rating: 8.9,
    title: "Perfect family getaway",
    positive: "Kids loved the pool and the kids' club activities. The family room was spacious enough for all four of us. Great dining options — something for everyone including picky eaters.",
    negative: "Parking was a bit limited on weekends.",
    trip_type: "family",
    stay_date: "December 2025",
  },
  {
    id: 90007,
    reviewer_name: "Aisha F.",
    reviewer_country: "UAE",
    reviewer_avatar_url: null,
    rating: 9.4,
    title: "Luxury at its finest",
    positive: "The suite was absolutely gorgeous. Turn-down service with chocolates was a lovely touch. The bar had an incredible cocktail menu and the rooftop views were spectacular.",
    negative: null,
    trip_type: "couple",
    stay_date: "February 2026",
  },
  {
    id: 90008,
    reviewer_name: "Tom H.",
    reviewer_country: "Singapore",
    reviewer_avatar_url: null,
    rating: 8.7,
    title: "Reliable and well-maintained",
    positive: "Everything worked perfectly — clean rooms, fast check-in, great location near public transport. The business centre was well-equipped for my meetings.",
    negative: "Restaurant closes a bit early for late-night dining.",
    trip_type: "business",
    stay_date: "January 2026",
  },
  {
    id: 90009,
    reviewer_name: "Sophie B.",
    reviewer_country: "France",
    reviewer_avatar_url: null,
    rating: 9.1,
    title: "Charming and elegant",
    positive: "The decor is tasteful and the ambiance is relaxing. I especially enjoyed the garden area and the afternoon tea service. The staff were professional yet warm.",
    negative: null,
    trip_type: "solo",
    stay_date: "October 2025",
  },
  {
    id: 90010,
    reviewer_name: "Carlos M.",
    reviewer_country: "Spain",
    reviewer_avatar_url: null,
    rating: 8.5,
    title: "Solid choice for the price",
    positive: "Great value for money. The room was modern and clean. Breakfast had plenty of variety. We appreciated the free shuttle service to the city centre.",
    negative: "The gym was on the small side but had the basics covered.",
    trip_type: "friends",
    stay_date: "November 2025",
  },
];

/* ────────────────────────── Full Amenities Data ────────────────────────── */

interface FullAmenity {
  key: string;
  label: string;
  icon: string;
  category: string;
}

const FULL_AMENITIES: FullAmenity[] = [
  // Room amenities
  { key: "ac", label: "Air Conditioning", icon: "M12 2v20M2 12h20M12 2a5 5 0 0 1 5 5M12 2a5 5 0 0 0-5 5M12 22a5 5 0 0 0 5-5M12 22a5 5 0 0 1-5-5M17 12a5 5 0 0 1-5 5M7 12a5 5 0 0 1 5-5", category: "Room" },
  { key: "wifi", label: "Free Wi-Fi", icon: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01", category: "Room" },
  { key: "tv", label: "Flat-screen TV", icon: "M2 7h20v10H2zM7 21h10M12 17v4", category: "Room" },
  { key: "minibar", label: "Minibar", icon: "M3 3h18v18H3zM3 9h18M9 9v12", category: "Room" },
  { key: "safe", label: "In-room Safe", icon: "M3 5h18v14H3zM7 5V3h10v2M12 12v2M10 12h4", category: "Room" },
  { key: "roomservice", label: "Room Service", icon: "M4 18h16M12 4C7 4 3 8 3 13h18c0-5-4-9-9-9zM12 4V2", category: "Room" },
  // Dining
  { key: "restaurant", label: "Restaurant", icon: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7", category: "Dining" },
  { key: "bar", label: "Bar / Lounge", icon: "M8 22h8M12 18v4M12 2L4 10h16L12 2zM7.5 10C7.5 14 12 18 12 18s4.5-4 4.5-8", category: "Dining" },
  { key: "breakfast", label: "Breakfast", icon: "M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3", category: "Dining" },
  // Wellness
  { key: "pool", label: "Swimming Pool", icon: "M2 18c.6.5 1.2 1 2.5 1C6.5 19 6.5 17 9 17s2.5 2 4.5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1M2 14c.6.5 1.2 1 2.5 1C6.5 15 6.5 13 9 13s2.5 2 4.5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1M8 9V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3M16 9V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3", category: "Wellness" },
  { key: "spa", label: "Spa & Wellness", icon: "M12 22c-4.97 0-9-2.24-9-5v-1c0-2.76 4.03-5 9-5s9 2.24 9 5v1c0 2.76-4.03 5-9 5zM7 11.5c0-2.5 2-5 5-7.5 3 2.5 5 5 5 7.5", category: "Wellness" },
  { key: "gym", label: "Fitness Centre", icon: "M6.5 6.5h11M6.5 17.5h11M2 12h3M19 12h3M6.5 6.5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2M17.5 6.5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2M4 10v4M20 10v4", category: "Wellness" },
  // Services
  { key: "concierge", label: "24h Concierge", icon: "M2 18h20M12 4v2M6.34 7.34l1.42 1.42M17.66 7.34l-1.42 1.42M4 14h16a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z", category: "Services" },
  { key: "parking", label: "Parking", icon: "M9 17V7h4a3 3 0 0 1 0 6H9M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", category: "Services" },
  { key: "laundry", label: "Laundry Service", icon: "M3 3h18v18H3zM12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M6 6h.01M10 6h.01", category: "Services" },
  { key: "shuttle", label: "Airport Shuttle", icon: "M5 17h14M3 9h18l-2 8H5L3 9zM7 17v2M17 17v2M8 9V5h8v4", category: "Services" },
  // Other
  { key: "beach", label: "Beach Access", icon: "M17.5 19H6.5l-.447-2.236A1 1 0 0 1 7.031 15.5h9.938a1 1 0 0 1 .978 1.264L17.5 19zM2 22h20M12 2L8 15M12 2l4 13M12 2l-7 8h14l-7-8", category: "Other" },
  { key: "petfriendly", label: "Pet Friendly", icon: "M10 5.172C10 3.782 8.884 2.5 7.5 2.5S5 3.782 5 5.172c0 1.39 2.5 4.328 2.5 4.328S10 6.562 10 5.172zM19 5.172C19 3.782 17.884 2.5 16.5 2.5S14 3.782 14 5.172c0 1.39 2.5 4.328 2.5 4.328S19 6.562 19 5.172zM7.5 14.5c0-1.38-1.12-2.5-2.5-2.5S2.5 13.12 2.5 14.5 3.62 17 5 17s2.5-1.12 2.5-2.5zM21.5 14.5c0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5S17.62 17 19 17s2.5-1.12 2.5-2.5zM8 18c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-2-4-2-4-.21-4 2z", category: "Other" },
  { key: "nosmoking", label: "Non-Smoking", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM4.93 4.93l14.14 14.14M8 12h8M8 16h8", category: "Other" },
];

/** Match amenities from overview text + always include standard hotel amenities */
function getHotelAmenities(overview: string | null, starRating: number): FullAmenity[] {
  const detected = new Set<string>();
  if (overview) {
    const text = overview.replace(/<[^>]*>/g, " ");
    for (const a of FULL_AMENITIES) {
      const patterns: Record<string, RegExp[]> = {
        pool: [/\bpool\b/i, /\bswimming\b/i],
        spa: [/\bspa\b/i, /\bwellness\b/i, /\bsauna\b/i],
        wifi: [/\bwi-?fi\b/i, /\binternet\b/i],
        restaurant: [/\brestaurant\b/i, /\bdining\b/i],
        gym: [/\bgym\b/i, /\bfitness\b/i],
        parking: [/\bparking\b/i, /\bvalet\b/i],
        bar: [/\bbar\b/i, /\blounge\b/i, /\bcocktail\b/i],
        breakfast: [/\bbreakfast\b/i],
        beach: [/\bbeach\b/i, /\bseaside\b/i, /\boceanfront\b/i],
        concierge: [/\bconcierge\b/i, /\bbutler\b/i, /\b24.?hour\b/i],
        roomservice: [/\broom service\b/i],
        petfriendly: [/\bpet.?friendly\b/i],
        ac: [/\bair.?condition/i],
        laundry: [/\blaundry\b/i, /\bdry clean/i],
        shuttle: [/\bshuttle\b/i, /\btransfer\b/i],
      };
      if (patterns[a.key]?.some((p) => p.test(text))) {
        detected.add(a.key);
      }
    }
  }

  // Standard amenities based on star rating
  const standard = new Set(["ac", "wifi", "tv", "nosmoking"]);
  if (starRating >= 3) { standard.add("restaurant"); standard.add("safe"); }
  if (starRating >= 4) { standard.add("roomservice"); standard.add("gym"); standard.add("concierge"); standard.add("parking"); standard.add("minibar"); }
  if (starRating >= 5) { standard.add("spa"); standard.add("bar"); standard.add("laundry"); standard.add("breakfast"); }

  const allKeys = new Set([...detected, ...standard]);
  return FULL_AMENITIES.filter((a) => allKeys.has(a.key));
}

/* ────────────────────────── Animation variants ────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

/* ────────────────────────── Tabs ────────────────────────── */

const TABS = ["Overview", "Gallery", "Reviews", "Location"] as const;
type TabName = (typeof TABS)[number];

/* ────────────────────────── Photo Carousel ────────────────────────── */

function PhotoCarousel({
  photos,
  hotelName,
  onOpenLightbox,
}: {
  photos: string[];
  hotelName: string;
  onOpenLightbox: (idx: number) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isAutoPlaying && photos.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIdx((prev) => (prev + 1) % photos.length);
      }, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoPlaying, photos.length]);

  const goTo = useCallback((idx: number) => {
    setCurrentIdx(idx);
    setIsAutoPlaying(false);
  }, []);

  const prev = useCallback(() => {
    setCurrentIdx((i) => (i - 1 + photos.length) % photos.length);
    setIsAutoPlaying(false);
  }, [photos.length]);

  const next = useCallback(() => {
    setCurrentIdx((i) => (i + 1) % photos.length);
    setIsAutoPlaying(false);
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <div
        className="w-full hotel-hero flex items-center justify-center"
        style={{ background: "var(--cream-deep)" }}
      >
        <p className="text-sm" style={{ color: "var(--ink-light)" }}>No photos available</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden hotel-hero group">
      {/* Main Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIdx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          src={safePhotoUrl(photos[currentIdx])}
          alt={`${hotelName} - Photo ${currentIdx + 1}`}
          loading={currentIdx === 0 ? "eager" : "lazy"}
          className="w-full h-full object-cover cursor-pointer"
          style={{ filter: "brightness(0.88) saturate(0.85)" }}
          onClick={() => onOpenLightbox(currentIdx)}
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
        />
      </AnimatePresence>

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(26,23,16,0.7) 0%, transparent 40%)",
        }}
      />

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: "rgba(26,23,16,0.6)",
              backdropFilter: "blur(8px)",
              color: "var(--cream)",
              fontSize: "20px",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="Previous photo"
          >
            &#8249;
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: "rgba(26,23,16,0.6)",
              backdropFilter: "blur(8px)",
              color: "var(--cream)",
              fontSize: "20px",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="Next photo"
          >
            &#8250;
          </button>
        </>
      )}

      {/* Thumbnail Strip */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-0 left-0 right-0 flex items-end gap-2 px-6 pb-5 pt-10 overflow-x-auto"
          style={{
            background: "linear-gradient(to top, rgba(26,23,16,0.8) 0%, transparent 100%)",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="shrink-0 overflow-hidden transition-all duration-200"
              style={{
                width: 64,
                height: 44,
                border: currentIdx === i ? "2px solid var(--gold)" : "2px solid transparent",
                opacity: currentIdx === i ? 1 : 0.6,
                cursor: "pointer",
                padding: 0,
                background: "none",
              }}
            >
              <img
                src={safePhotoUrl(photo)}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
              />
            </button>
          ))}

          {/* View all button */}
          <button
            onClick={() => onOpenLightbox(0)}
            className="shrink-0 flex items-center justify-center transition-opacity hover:opacity-80"
            style={{
              width: 64,
              height: 44,
              background: "rgba(184,149,90,0.8)",
              border: "none",
              color: "var(--white)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            View All
          </button>
        </div>
      )}

      {/* Photo counter */}
      {photos.length > 1 && (
        <div
          className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-1.5 px-3 py-1.5 z-10"
          style={{
            background: "rgba(26,23,16,0.6)",
            backdropFilter: "blur(8px)",
            color: "var(--cream)",
            fontSize: "11px",
            letterSpacing: "0.06em",
            fontFamily: "var(--font-mono)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          {currentIdx + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}

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
        style={{ color: "var(--cream)" }}
        aria-label="Close"
      >
        &times;
      </button>

      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 md:left-8 w-12 h-12 flex items-center justify-center text-2xl"
          style={{ color: "var(--cream)" }}
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
          style={{ color: "var(--cream)" }}
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

/* ────────────────────────── Review Item ────────────────────────── */

function ReviewItem({ review }: { review: Review }) {
  const tripLabels: Record<string, string> = {
    solo: "Solo traveller",
    couple: "Couple",
    family: "Family",
    business: "Business",
    friends: "Group of friends",
  };

  return (
    <article
      className="pb-10 mb-10 last:border-0 last:pb-0 last:mb-0"
      style={{ borderBottom: "1px solid var(--cream-border)" }}
    >
      <div className="flex items-center gap-4 mb-5">
        <div
          className="w-9 h-9 rounded-full overflow-hidden shrink-0"
          style={{ background: "var(--cream-deep)" }}
        >
          <img
            src={review.reviewer_avatar_url || `https://i.pravatar.cc/48?u=${review.id}`}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://i.pravatar.cc/48?u=${review.id}`;
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
            {review.reviewer_name}
          </span>
          {review.reviewer_country && (
            <span className="text-xs ml-2" style={{ color: "var(--ink-light)" }}>
              {review.reviewer_country}
            </span>
          )}
        </div>
        <span
          className="shrink-0 px-2.5 py-1 text-xs font-medium"
          style={{
            background: review.rating >= 8.5 ? "rgba(74,124,89,0.1)" : "var(--gold-pale)",
            color: review.rating >= 8.5 ? "var(--success)" : "var(--gold)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {review.rating.toFixed(1)}
        </span>
      </div>

      {review.title && (
        <h4
          className="text-[15px] font-medium mb-3"
          style={{ color: "var(--ink)", fontFamily: "var(--font-display)", fontSize: "17px" }}
        >
          {review.title}
        </h4>
      )}

      {review.positive && (
        <div className="pl-4 mb-3" style={{ borderLeft: "3px solid var(--success)" }}>
          <p className="text-sm" style={{ color: "var(--ink-mid)", lineHeight: 1.8 }}>
            {review.positive}
          </p>
        </div>
      )}

      {review.negative && (
        <div className="pl-4 mb-3" style={{ borderLeft: "3px solid var(--error)" }}>
          <p className="text-sm" style={{ color: "var(--ink-light)", lineHeight: 1.8 }}>
            {review.negative}
          </p>
        </div>
      )}

      {review.stay_date && (
        <p
          className="text-[11px] mt-4"
          style={{ color: "var(--ink-light)", fontFamily: "var(--font-mono)" }}
        >
          Stayed {review.stay_date}
          {review.trip_type && ` \u00b7 ${tripLabels[review.trip_type] || review.trip_type}`}
        </p>
      )}
    </article>
  );
}

/* ────────────────────────── Rating Distribution ────────────────────────── */

function RatingDistribution({ reviews }: { reviews: Review[] }) {
  const buckets = useMemo(() => {
    const b = [
      { label: "Exceptional (9+)", min: 9, max: 10, count: 0 },
      { label: "Excellent (8-9)", min: 8, max: 9, count: 0 },
      { label: "Very Good (7-8)", min: 7, max: 8, count: 0 },
      { label: "Good (6-7)", min: 6, max: 7, count: 0 },
      { label: "Fair (<6)", min: 0, max: 6, count: 0 },
    ];
    for (const r of reviews) {
      for (const bucket of b) {
        if (r.rating >= bucket.min && (r.rating < bucket.max || (bucket.max === 10 && r.rating <= 10))) {
          bucket.count++;
          break;
        }
      }
    }
    return b;
  }, [reviews]);

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="flex flex-col gap-2">
      {buckets.map((b) => (
        <div key={b.label} className="flex items-center gap-3">
          <span
            className="shrink-0 text-[11px]"
            style={{ color: "var(--ink-light)", width: "120px", fontFamily: "var(--font-body)" }}
          >
            {b.label}
          </span>
          <div className="flex-1 h-2" style={{ background: "var(--cream)" }}>
            <div
              style={{
                width: `${(b.count / maxCount) * 100}%`,
                height: "100%",
                background: b.min >= 8 ? "var(--success)" : b.min >= 7 ? "var(--gold)" : "var(--cream-border)",
                transition: "width 0.6s ease",
              }}
            />
          </div>
          <span
            className="shrink-0 text-[11px]"
            style={{ color: "var(--ink-light)", fontFamily: "var(--font-mono)", width: "20px", textAlign: "right" }}
          >
            {b.count}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────── Section Label ────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="type-label mb-6"
      style={{
        fontWeight: 600,
        letterSpacing: "0.18em",
        color: "var(--gold)",
      }}
    >
      {children}
    </h3>
  );
}

/* ────────────────────────── Wishlist hook ────────────────────────── */

function useWishlist() {
  const [wishlist, setWishlist] = useState<number[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("voyagr_wishlist");
      if (stored) setWishlist(JSON.parse(stored));
    } catch {}
  }, []);

  const toggle = useCallback((hotelId: number) => {
    setWishlist((prev) => {
      const next = prev.includes(hotelId)
        ? prev.filter((id) => id !== hotelId)
        : [...prev, hotelId];
      try { localStorage.setItem("voyagr_wishlist", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const isSaved = useCallback((hotelId: number) => wishlist.includes(hotelId), [wishlist]);

  return { toggle, isSaved };
}

/* ────────────────────────── Main Page ────────────────────────── */

export default function HotelPage() {
  const params = useParams();
  const hotelId = params.id as string;

  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [similarHotels, setSimilarHotels] = useState<HotelDetail[]>([]);
  const [loading, setLoading] = useState(true);

  /* Gallery */
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  /* Tabs */
  const [activeTab, setActiveTab] = useState<TabName>("Overview");

  /* Wishlist */
  const { toggle: toggleWishlist, isSaved } = useWishlist();

  /* Amenities expand */
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);

  /* Sticky header */
  const [headerVisible, setHeaderVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  /* Section refs */
  const overviewRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  /* ── Fetch data ── */
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/hotels/${hotelId}`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`${API_BASE}/api/hotels/${hotelId}/reviews?limit=10`)
        .then((r) => (r.ok ? r.json() : { count: 0, reviews: [] }))
        .catch(() => ({ count: 0, reviews: [] })),
    ])
      .then(([hotelData, reviewData]) => {
        setHotel(hotelData);
        setReviews(reviewData.reviews || []);
        setReviewCount(reviewData.count || 0);
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

  /* ── Fetch similar hotels from same city ── */
  useEffect(() => {
    if (!hotel?.city) return;
    const citySlug = hotel.city.toLowerCase().replace(/\s+/g, "-");
    fetch(`${API_BASE}/api/curations/${citySlug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.curations) return;
        const all = [
          ...(data.curations.singles || []),
          ...(data.curations.couples || []),
          ...(data.curations.families || []),
        ];
        // Deduplicate and exclude current hotel
        const seen = new Set<number>();
        const unique = all.filter((h: { hotel_id: number }) => {
          if (h.hotel_id === hotel.hotel_id || seen.has(h.hotel_id)) return false;
          seen.add(h.hotel_id);
          return true;
        });
        setSimilarHotels(unique.slice(0, 4));
      })
      .catch(() => {});
  }, [hotel?.city, hotel?.hotel_id]);

  /* ── Scroll observer for sticky header ── */
  useEffect(() => {
    if (!heroRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [hotel]);

  /* ── Photos ── */
  const photos = hotel
    ? ([hotel.photo1, hotel.photo2, hotel.photo3, hotel.photo4, hotel.photo5].filter(
        Boolean
      ) as string[])
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

  /* ── Reviews with fallback placeholders ── */
  const displayReviews = useMemo(() => {
    if (reviews.length >= 5) return reviews;
    // Merge API reviews with placeholders to ensure at least 5-10
    const needed = Math.max(0, 10 - reviews.length);
    const placeholders = PLACEHOLDER_REVIEWS.slice(0, needed);
    return [...reviews, ...placeholders];
  }, [reviews]);

  const displayReviewCount = useMemo(() => {
    return Math.max(reviewCount, displayReviews.length);
  }, [reviewCount, displayReviews.length]);

  /* ── Average rating from displayed reviews ── */
  const avgRating = useMemo(() => {
    if (hotel?.rating_average && hotel.rating_average > 0) return hotel.rating_average;
    if (displayReviews.length === 0) return 0;
    return displayReviews.reduce((sum, r) => sum + r.rating, 0) / displayReviews.length;
  }, [hotel?.rating_average, displayReviews]);

  /* ── Tab click handler ── */
  const handleTabClick = useCallback((tab: TabName) => {
    setActiveTab(tab);
    if (hotel) {
      trackHotelTabClicked({ hotel_id: hotel.hotel_id, hotel_name: hotel.hotel_name, tab_name: tab });
    }
    const refMap: Record<TabName, React.RefObject<HTMLDivElement | null>> = {
      Overview: overviewRef,
      Gallery: galleryRef,
      Reviews: reviewsRef,
      Location: locationRef,
    };
    const ref = refMap[tab];
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
          <p className="text-lg mb-2" style={{ color: "var(--ink)" }}>
            Hotel not found
          </p>
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

  const address = [hotel.addressline1, hotel.city, hotel.country]
    .filter(Boolean)
    .join(", ");

  const otaPrice = hotel.rates_from ? Math.round(hotel.rates_from * 1.3) : null;
  const savePct = otaPrice && hotel.rates_from
    ? Math.round(((otaPrice - hotel.rates_from) / otaPrice) * 100)
    : null;
  const saveAmount = otaPrice && hotel.rates_from ? otaPrice - hotel.rates_from : null;

  const quickFacts = [
    hotel.checkin ? { label: "Check-in", value: hotel.checkin } : null,
    hotel.checkout ? { label: "Check-out", value: hotel.checkout } : null,
    hotel.numberrooms ? { label: "Rooms", value: `${hotel.numberrooms}` } : null,
    hotel.yearrenovated ? { label: "Renovated", value: `${hotel.yearrenovated}` } : null,
    hotel.yearopened ? { label: "Opened", value: `${hotel.yearopened}` } : null,
    hotel.accommodation_type ? { label: "Type", value: hotel.accommodation_type } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const starDisplay = hotel.star_rating > 0
    ? "\u2605".repeat(Math.round(hotel.star_rating))
    : "";

  const amenities = getHotelAmenities(hotel.overview, hotel.star_rating);
  const amenityCategories = [...new Set(amenities.map((a) => a.category))];
  const visibleAmenities = amenitiesExpanded ? amenities : amenities.slice(0, 8);

  // Room types with Voyagr pricing
  const roomTypes = (() => {
    const stars = hotel.star_rating || 3;
    const base = hotel.rates_from || 100;
    if (stars >= 5) return [
      { name: "Deluxe Room", beds: "1 King Bed", bedIcon: "M2 17V9a1 1 0 011-1h18a1 1 0 011 1v8 M2 13h20 M6 13V9 M18 13V9 M2 17h20", guests: 2, size: "35 m\u00B2", priceMult: 1.0 },
      { name: "Deluxe Twin", beds: "2 Single Beds", bedIcon: "M2 17V9a1 1 0 011-1h7v5h4V8h7a1 1 0 011 1v8 M2 13h20 M2 17h20", guests: 2, size: "35 m\u00B2", priceMult: 1.0 },
      { name: "Premier Suite", beds: "1 King Bed + Living Area", bedIcon: "M2 17V9a1 1 0 011-1h18a1 1 0 011 1v8 M2 13h20 M6 13V9 M18 13V9 M2 17h20", guests: 3, size: "55 m\u00B2", priceMult: 1.65 },
      { name: "Family Room", beds: "1 King + 2 Single Beds", bedIcon: "M2 17V9a1 1 0 011-1h7v5h4V8h7a1 1 0 011 1v8 M2 13h20 M2 17h20", guests: 4, size: "50 m\u00B2", priceMult: 1.45 },
      { name: "Presidential Suite", beds: "1 King Bed + Lounge", bedIcon: "M2 17V9a1 1 0 011-1h18a1 1 0 011 1v8 M2 13h20 M6 13V9 M18 13V9 M2 17h20", guests: 2, size: "80 m\u00B2", priceMult: 2.8 },
    ];
    if (stars >= 4) return [
      { name: "Superior Room", beds: "1 King Bed", bedIcon: "M2 17V9a1 1 0 011-1h18a1 1 0 011 1v8 M2 13h20 M6 13V9 M18 13V9 M2 17h20", guests: 2, size: "30 m\u00B2", priceMult: 1.0 },
      { name: "Superior Twin", beds: "2 Single Beds", bedIcon: "M2 17V9a1 1 0 011-1h7v5h4V8h7a1 1 0 011 1v8 M2 13h20 M2 17h20", guests: 2, size: "30 m\u00B2", priceMult: 1.0 },
      { name: "Deluxe Room", beds: "1 King Bed", bedIcon: "M2 17V9a1 1 0 011-1h18a1 1 0 011 1v8 M2 13h20 M6 13V9 M18 13V9 M2 17h20", guests: 2, size: "38 m\u00B2", priceMult: 1.35 },
      { name: "Family Suite", beds: "1 King + 2 Single Beds", bedIcon: "M2 17V9a1 1 0 011-1h7v5h4V8h7a1 1 0 011 1v8 M2 13h20 M2 17h20", guests: 4, size: "45 m\u00B2", priceMult: 1.55 },
    ];
    return [
      { name: "Standard Room", beds: "1 Queen Bed", bedIcon: "M2 17V9a1 1 0 011-1h18a1 1 0 011 1v8 M2 13h20 M6 13V9 M18 13V9 M2 17h20", guests: 2, size: "22 m\u00B2", priceMult: 1.0 },
      { name: "Standard Twin", beds: "2 Single Beds", bedIcon: "M2 17V9a1 1 0 011-1h7v5h4V8h7a1 1 0 011 1v8 M2 13h20 M2 17h20", guests: 2, size: "22 m\u00B2", priceMult: 1.0 },
      { name: "Triple Room", beds: "1 Queen + 1 Single Bed", bedIcon: "M2 17V9a1 1 0 011-1h7v5h4V8h7a1 1 0 011 1v8 M2 13h20 M2 17h20", guests: 3, size: "28 m\u00B2", priceMult: 1.25 },
    ];
  })();

  const isWishlisted = isSaved(hotel.hotel_id);

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

      {/* ═══════════════════ Breadcrumbs ═══════════════════ */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: hotel.city, href: `/city/${hotel.city.toLowerCase().replace(/\s+/g, "-")}` },
          { label: hotel.hotel_name },
        ]}
      />

      {/* ═══════════════════ Check-in / Check-out ═══════════════════ */}
      <div style={{ paddingTop: 96 }}>
        <DateBar variant="light" />
      </div>

      {/* ═══════════════════ Back Button ═══════════════════ */}
      <div
        style={{
          paddingTop: 12,
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 0,
          background: "var(--white)",
        }}
        className="md:!pl-[60px]"
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <BackButton />
        </div>
      </div>

      {/* ═══════════════════ Photo Carousel ═══════════════════ */}
      <section ref={heroRef} className="relative">
        <PhotoCarousel
          photos={photos}
          hotelName={hotel.hotel_name}
          onOpenLightbox={openLightbox}
        />

        {/* Hotel name + save badge overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-end justify-between hotel-hero-overlay pointer-events-none"
          style={{ color: "var(--cream)", zIndex: 5 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {starDisplay && (
              <div
                className="mb-2 type-label"
                style={{
                  color: "var(--gold)",
                }}
              >
                {starDisplay} {hotel.city}
                {hotel.country ? `, ${hotel.country}` : ""}
              </div>
            )}
            <h1
              className="hotel-hero-title"
              style={{
                fontFamily: "var(--font-display)",
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
                className="mt-1.5"
                style={{
                  fontSize: "13px",
                  opacity: 0.7,
                  letterSpacing: "0.08em",
                }}
              >
                {address}
              </p>
            )}
          </motion.div>

          {/* Save badge */}
          {saveAmount && saveAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="shrink-0 text-center hidden md:block"
              style={{
                background: "var(--gold)",
                color: "var(--ink)",
                padding: "10px 20px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                You save
              </div>
              <div
                className="type-price"
                style={{
                  fontSize: "28px",
                  fontWeight: 500,
                }}
              >
                {formatCurrency(saveAmount, hotel.rates_currency)}
              </div>
              <div style={{ fontSize: "10px", opacity: 0.7 }}>per night</div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══════════════════ Tabs Bar ═══════════════════ */}
      <div
        className="flex gap-0 md:gap-2 sticky top-[60px] z-40 hotel-tabs-bar overflow-x-auto"
        style={{
          background: "var(--white)",
          borderBottom: "1px solid var(--cream-border)",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className="type-nav shrink-0"
            style={{
              padding: "14px 18px",
              color: activeTab === tab ? "var(--ink)" : "var(--ink-light)",
              cursor: "pointer",
              background: "transparent",
              border: "none",
              borderBottomWidth: "2px",
              borderBottomStyle: "solid",
              borderBottomColor: activeTab === tab ? "var(--ink)" : "transparent",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) (e.target as HTMLButtonElement).style.color = "var(--ink)";
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) (e.target as HTMLButtonElement).style.color = "var(--ink-light)";
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ═══════════════════ Two-Column Content ═══════════════════ */}
      <div
        className="flex flex-col lg:grid"
        style={{
          gridTemplateColumns: "1fr 380px",
          gap: 0,
          flex: 1,
        }}
      >
        {/* ─── Left: Main Content ─── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          style={{ padding: "40px 24px" }}
          className="lg:!px-[60px]"
        >
          {/* ── OVERVIEW Section ── */}
          <div ref={overviewRef} className="mt-8" style={{ scrollMarginTop: "120px" }}>
            {/* Rating */}
            {avgRating > 0 && (
              <motion.div variants={fadeUp} custom={0} className="flex items-center gap-4 mb-6">
                <span
                  className="text-3xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    color: "var(--ink)",
                  }}
                >
                  {avgRating.toFixed(1)}
                </span>
                <div>
                  <span className="text-base font-medium" style={{ color: "var(--ink)" }}>
                    {ratingLabel(avgRating)}
                  </span>
                  {displayReviewCount > 0 && (
                    <span
                      className="text-xs ml-3"
                      style={{ color: "var(--ink-light)", fontFamily: "var(--font-mono)" }}
                    >
                      {displayReviewCount.toLocaleString()} reviews
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Divider */}
            <motion.div
              variants={fadeUp}
              custom={1}
              className="mb-8"
              style={{ height: "1px", background: "var(--cream-border)" }}
            />

            {/* Property Highlights — visual amenity icons */}
            {hotel.overview && (() => {
              const detected = extractAmenities(hotel.overview);
              if (detected.length === 0) return null;
              return (
                <motion.div variants={fadeUp} custom={2} className="mb-10">
                  <SectionLabel>Property Highlights</SectionLabel>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                      gap: "2px",
                      background: "var(--cream-border)",
                      border: "1px solid var(--cream-border)",
                    }}
                  >
                    {detected.map((a) => (
                      <div
                        key={a.key}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "20px 12px",
                          background: "var(--white)",
                        }}
                      >
                        <svg
                          width={28}
                          height={28}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: "var(--gold)" }}
                        >
                          <path d={a.icon} />
                        </svg>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "var(--ink-mid)",
                            letterSpacing: "0.04em",
                            textAlign: "center",
                            lineHeight: 1.3,
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {a.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })()}

            {/* ── Full Amenities List ── */}
            <motion.div variants={fadeUp} custom={2.5} className="mb-10">
              <SectionLabel>Amenities</SectionLabel>
              <div
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--cream-border)",
                  padding: "24px",
                }}
              >
                {amenityCategories.map((cat) => {
                  const catAmenities = visibleAmenities.filter((a) => a.category === cat);
                  if (catAmenities.length === 0) return null;
                  return (
                    <div key={cat} className="mb-5 last:mb-0">
                      <div
                        className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-3"
                        style={{ color: "var(--ink-light)" }}
                      >
                        {cat}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {catAmenities.map((a) => (
                          <div
                            key={a.key}
                            className="flex items-center gap-3 py-2"
                          >
                            <svg
                              width={18}
                              height={18}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.4}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ color: "var(--gold)", flexShrink: 0 }}
                            >
                              <path d={a.icon} />
                            </svg>
                            <span
                              className="text-sm"
                              style={{ color: "var(--ink-mid)", fontFamily: "var(--font-body)" }}
                            >
                              {a.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {amenities.length > 8 && (
                  <button
                    onClick={() => setAmenitiesExpanded(!amenitiesExpanded)}
                    className="mt-4 text-xs font-medium uppercase tracking-[0.08em] transition-opacity hover:opacity-80"
                    style={{
                      color: "var(--gold)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {amenitiesExpanded ? "Show less" : `Show all ${amenities.length} amenities`}
                  </button>
                )}
              </div>
            </motion.div>

            {/* ── Quick Facts ── */}
            {quickFacts.length > 0 && (
              <motion.div variants={fadeUp} custom={3} className="mb-10">
                <SectionLabel>Hotel Details</SectionLabel>
                <div style={{ border: "1px solid var(--cream-border)", background: "var(--white)" }}>
                  {quickFacts.map((fact, i) => (
                    <div
                      key={fact.label}
                      className="grid grid-cols-2 py-4 px-5 text-sm hotel-detail-row"
                      style={{
                        borderBottom: i < quickFacts.length - 1 ? "1px solid var(--cream-border)" : "none",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--ink-light)",
                          fontSize: "12px",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {fact.label}
                      </span>
                      <span style={{ color: "var(--ink-mid)" }}>
                        {fact.value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Room Types with Voyagr Pricing ── */}
            <motion.div variants={fadeUp} custom={3.5} className="mb-10">
              <SectionLabel>Room Types &amp; Rates</SectionLabel>
              <div className="flex flex-col gap-px" style={{ background: "var(--cream-border)", border: "1px solid var(--cream-border)" }}>
                {roomTypes.map((room) => {
                  const roomPrice = hotel.rates_from ? Math.round(hotel.rates_from * room.priceMult) : null;
                  const marketPrice = roomPrice ? Math.round(roomPrice * 1.3) : null;

                  return (
                    <div
                      key={room.name}
                      className="flex items-center gap-4 p-5"
                      style={{ background: "var(--white)" }}
                    >
                      {/* Bed icon */}
                      <div
                        className="shrink-0 w-10 h-10 flex items-center justify-center"
                        style={{ background: "var(--gold-pale)", borderRadius: "6px" }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--gold)" }}>
                          <path d={room.bedIcon} />
                        </svg>
                      </div>

                      {/* Room details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span
                            className="text-sm font-medium"
                            style={{ color: "var(--ink)" }}
                          >
                            {room.name}
                          </span>
                          <span
                            className="text-[11px]"
                            style={{ color: "var(--ink-light)", fontFamily: "var(--font-mono)" }}
                          >
                            {room.size}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs" style={{ color: "var(--ink-mid)" }}>
                            {room.beds}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--ink-light)" }}>
                              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span className="text-[11px]" style={{ color: "var(--ink-light)", fontFamily: "var(--font-mono)" }}>
                              {room.guests}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Voyagr Pricing */}
                      <div className="shrink-0 text-right">
                        {roomPrice ? (
                          <>
                            {marketPrice && (
                              <div
                                className="text-[11px] line-through"
                                style={{ color: "var(--market-rate)" }}
                              >
                                {formatCurrency(marketPrice, hotel.rates_currency)}
                              </div>
                            )}
                            <div
                              className="text-base font-medium"
                              style={{ color: "var(--our-rate)", fontFamily: "var(--font-display)" }}
                            >
                              {formatCurrency(roomPrice, hotel.rates_currency)}
                            </div>
                            <div className="text-[10px]" style={{ color: "var(--ink-light)" }}>
                              per night
                            </div>
                          </>
                        ) : (
                          <span className="text-xs italic" style={{ color: "var(--ink-light)" }}>
                            On request
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px]" style={{ color: "var(--ink-light)" }}>
                Voyagr preferred rates shown. Room availability varies by date.
              </p>
            </motion.div>

            {/* ── Availability Calendar ── */}
            <motion.div variants={fadeUp} custom={3.8} className="mb-10">
              <SectionLabel>Availability</SectionLabel>
              <div
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--cream-border)",
                  padding: "24px",
                }}
              >
                <AvailabilityCalendar
                  ratesFrom={hotel.rates_from}
                  currency={hotel.rates_currency}
                />
              </div>
            </motion.div>

            {/* ── Price Trend Chart ── */}
            {hotel.rates_from && (
              <motion.div variants={fadeUp} custom={3.9} className="mb-10">
                <SectionLabel>Price Trends</SectionLabel>
                <div
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--cream-border)",
                    padding: "24px",
                  }}
                >
                  <PriceTrendChart
                    ratesFrom={hotel.rates_from}
                    currency={hotel.rates_currency}
                    hotelId={hotel.hotel_id}
                  />
                </div>
              </motion.div>
            )}

            {/* ── Policies ── */}
            {(hotel.checkin || hotel.checkout) && (
              <motion.div variants={fadeUp} custom={4} className="mb-10">
                <SectionLabel>Policies</SectionLabel>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-px"
                  style={{ background: "var(--cream-border)" }}
                >
                  {hotel.checkin && (
                    <div className="p-5" style={{ background: "var(--white)" }}>
                      <div
                        className="type-micro"
                        style={{
                          fontWeight: 600,
                          color: "var(--ink-light)",
                          marginBottom: "6px",
                        }}
                      >
                        Check-in
                      </div>
                      <div
                        className="type-heading-3"
                        style={{
                          color: "var(--ink)",
                        }}
                      >
                        {hotel.checkin}
                      </div>
                    </div>
                  )}
                  {hotel.checkout && (
                    <div className="p-5" style={{ background: "var(--white)" }}>
                      <div
                        className="type-micro"
                        style={{
                          fontWeight: 600,
                          color: "var(--ink-light)",
                          marginBottom: "6px",
                        }}
                      >
                        Check-out
                      </div>
                      <div
                        className="type-heading-3"
                        style={{
                          color: "var(--ink)",
                        }}
                      >
                        {hotel.checkout}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Chain / Brand ── */}
            {(hotel.chain_name || hotel.brand_name) && (
              <motion.div variants={fadeUp} custom={4.5} className="mb-10">
                <p className="text-xs" style={{ color: "var(--ink-light)" }}>
                  {[hotel.chain_name, hotel.brand_name].filter(Boolean).join(" \u00b7 ")}
                </p>
              </motion.div>
            )}

            {/* ── GALLERY Section ── */}
            <div ref={galleryRef} style={{ scrollMarginTop: "120px" }}>
              {photos.length > 1 && (
                <motion.div variants={fadeUp} custom={5} className="mb-10">
                  <SectionLabel>Gallery</SectionLabel>
                  <div
                    className="hotel-gallery-grid"
                  >
                    {photos.map((photo, i) => (
                      <div
                        key={i}
                        className="relative cursor-pointer overflow-hidden group hotel-gallery-item"
                        onClick={() => openLightbox(i)}
                      >
                        <img
                          src={safePhotoUrl(photo)}
                          alt={`${hotel.hotel_name} photo ${i + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          style={{ filter: "saturate(0.88)" }}
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                        />
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: "rgba(26,23,16,0.2)" }}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Mobile Booking Section ── */}
            <motion.div variants={fadeUp} custom={6} className="lg:hidden mt-8 mb-10">
              <SectionLabel>Pricing</SectionLabel>
              <div
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--cream-border)",
                  padding: "24px",
                }}
              >
                {hotel.rates_from ? (
                  <div className="mb-5">
                    <div
                      className="type-eyebrow"
                      style={{
                        marginBottom: "8px",
                      }}
                    >
                      Preferred Rate
                    </div>
                    {otaPrice && (
                      <div
                        className="mb-1"
                        style={{
                          fontSize: "13px",
                          color: "var(--market-rate)",
                          textDecoration: "line-through",
                        }}
                      >
                        Market rate: {formatCurrency(otaPrice, hotel.rates_currency)}/night
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span
                        className="type-price-lg"
                        style={{
                          color: "var(--our-rate)",
                        }}
                      >
                        {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--ink-light)" }}>
                        per night
                      </span>
                    </div>
                    {savePct && savePct > 0 && (
                      <div
                        className="mt-2 inline-block"
                        style={{
                          fontSize: "12px",
                          color: "var(--success)",
                          fontWeight: 500,
                        }}
                      >
                        You save {savePct}% ({saveAmount ? formatCurrency(saveAmount, hotel.rates_currency) : ""}/night)
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-5">
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "22px",
                        fontWeight: 400,
                        fontStyle: "italic",
                        color: "var(--ink-mid)",
                      }}
                    >
                      Request a quote
                    </span>
                  </div>
                )}

                {/* Book Now — Green CTA */}
                <button
                  onClick={() => window.open("https://wa.me/919876543210", "_blank")}
                  className="flex items-center justify-center gap-2 w-full py-4 text-sm font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: "#3b7a4a",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="2" />
                    <path d="M16 8h4a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-4" />
                  </svg>
                  Book Now
                </button>

                {/* Save to Wishlist */}
                <button
                  onClick={() => toggleWishlist(hotel.hotel_id)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 text-xs font-medium uppercase tracking-[0.1em] mt-3 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    border: `1px solid ${isWishlisted ? "var(--gold)" : "var(--cream-border)"}`,
                    color: isWishlisted ? "var(--gold)" : "var(--ink-mid)",
                    background: isWishlisted ? "var(--gold-pale)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isWishlisted ? "var(--gold)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  {isWishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
                </button>

                <div className="mt-4 flex justify-center">
                  <TrustBadgesCompact />
                </div>
              </div>
            </motion.div>

            {/* ── REVIEWS Section ── */}
            <div ref={reviewsRef} style={{ scrollMarginTop: "120px" }}>
              {displayReviews.length > 0 && (
                <motion.div variants={fadeUp} custom={7}>
                  <div className="flex items-end justify-between mb-6">
                    <SectionLabel>Guest Reviews</SectionLabel>
                    <span
                      className="text-xs mb-6"
                      style={{ color: "var(--ink-light)", fontFamily: "var(--font-mono)" }}
                    >
                      {displayReviewCount} reviews
                    </span>
                  </div>

                  {/* Rating Distribution */}
                  <div
                    className="mb-6"
                    style={{
                      background: "var(--white)",
                      border: "1px solid var(--cream-border)",
                      padding: "20px 24px",
                    }}
                  >
                    <div className="flex items-center gap-6 mb-4">
                      <div className="text-center">
                        <div
                          className="text-4xl"
                          style={{ fontFamily: "var(--font-display)", fontWeight: 400, color: "var(--ink)" }}
                        >
                          {avgRating.toFixed(1)}
                        </div>
                        <div className="text-xs" style={{ color: "var(--ink-light)" }}>
                          {ratingLabel(avgRating)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <RatingDistribution reviews={displayReviews} />
                      </div>
                    </div>
                  </div>

                  <div
                    className="hotel-reviews-card"
                    style={{
                      background: "var(--white)",
                      border: "1px solid var(--cream-border)",
                    }}
                  >
                    {displayReviews.map((review) => (
                      <ReviewItem key={review.id} review={review} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── LOCATION Section ── */}
            <div ref={locationRef} style={{ scrollMarginTop: "120px" }}>
              {hotel.latitude && hotel.longitude && (
                <motion.div variants={fadeUp} custom={8} className="mt-10">
                  <SectionLabel>Location</SectionLabel>
                  <div
                    style={{
                      border: "1px solid var(--cream-border)",
                      background: "var(--white)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Static map image from OpenStreetMap */}
                    <a
                      href={`https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative group"
                      style={{ height: "220px", background: "var(--cream-deep)" }}
                    >
                      <img
                        src={`https://staticmap.openstreetmap.de/staticmap.php?center=${hotel.latitude},${hotel.longitude}&zoom=14&size=800x300&markers=${hotel.latitude},${hotel.longitude},red-pushpin`}
                        alt={`Map of ${hotel.hotel_name}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        style={{ filter: "saturate(0.8) contrast(0.95)" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: "rgba(26,23,16,0.3)" }}
                      >
                        <span
                          className="px-4 py-2 text-xs font-medium uppercase tracking-[0.1em]"
                          style={{ background: "var(--cream)", color: "var(--ink)" }}
                        >
                          Open in Google Maps
                        </span>
                      </div>
                    </a>

                    <div style={{ padding: "20px 24px" }}>
                      <p className="text-sm mb-1" style={{ color: "var(--ink-mid)" }}>
                        {address}
                      </p>
                      {hotel.addressline2 && (
                        <p className="text-xs" style={{ color: "var(--ink-light)" }}>
                          {hotel.addressline2}
                        </p>
                      )}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium uppercase tracking-[0.08em] transition-opacity hover:opacity-80"
                        style={{ color: "var(--gold)", textDecoration: "none" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 11l19-9-9 19-2-8-8-2z" />
                        </svg>
                        Get Directions
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── Right Column: Sticky Booking Card ─── */}
        <div className="hidden lg:block" style={{ borderLeft: "1px solid var(--cream-border)", background: "var(--cream)" }}>
          <div style={{ padding: "32px 28px" }}>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="sticky"
              style={{ top: "140px" }}
            >
              <div
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--cream-border)",
                  padding: "28px",
                }}
              >
                {hotel.rates_from ? (
                  <>
                    <div
                      className="type-eyebrow"
                      style={{
                        marginBottom: "16px",
                      }}
                    >
                      Preferred Rate
                    </div>

                    <div
                      className="type-price-lg"
                      style={{
                        color: "var(--our-rate)",
                      }}
                    >
                      {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--ink-light)", marginTop: "6px" }}>
                      per night
                    </div>

                    {otaPrice && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--market-rate)",
                          textDecoration: "line-through",
                          marginTop: "10px",
                        }}
                      >
                        Market rate: {formatCurrency(otaPrice, hotel.rates_currency)}/night
                      </div>
                    )}

                    {savePct && savePct > 0 && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--success)",
                          fontWeight: 500,
                          marginBottom: "20px",
                        }}
                      >
                        You save {formatCurrency(saveAmount!, hotel.rates_currency)}/night ({savePct}%)
                      </div>
                    )}

                    {/* Save badge */}
                    {saveAmount && saveAmount > 0 && (
                      <div
                        className="text-center mb-4"
                        style={{
                          background: "var(--gold-pale)",
                          border: "1px solid var(--gold-light)",
                          padding: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "18px",
                            color: "var(--success)",
                          }}
                        >
                          Save {formatCurrency(saveAmount, hotel.rates_currency)} per night
                        </span>
                      </div>
                    )}

                    {/* Price Comparison Bars */}
                    <div style={{ marginBottom: "20px" }}>
                      <PriceComparisonBars
                        ratesFrom={hotel.rates_from}
                        currency={hotel.rates_currency}
                      />
                    </div>

                    {/* Trust Signals Row */}
                    <PriceProofTrustRow />

                    {/* Best Price Guarantee */}
                    <div style={{ marginBottom: "16px" }}>
                      <BestPriceGuarantee />
                    </div>

                    {/* Trust Badges: Free cancellation + Pay tax at hotel */}
                    <div style={{ marginBottom: "16px" }}>
                      <TrustBadgesRow />
                    </div>

                    <p
                      className="mb-4"
                      style={{ fontSize: "11px", color: "var(--ink-light)" }}
                    >
                      Prices vary by date. Call for exact quote.
                    </p>
                  </>
                ) : (
                  <div className="mb-5">
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "24px",
                        fontWeight: 400,
                        fontStyle: "italic",
                        color: "var(--ink-mid)",
                      }}
                    >
                      Request a quote
                    </span>
                    <p className="text-xs mt-2" style={{ color: "var(--ink-light)" }}>
                      Call us for the best available rate
                    </p>
                  </div>
                )}

                {/* Book Now — Big Green CTA */}
                <button
                  onClick={() => window.open("https://wa.me/919876543210", "_blank")}
                  className="flex items-center justify-center gap-2.5 w-full py-4 text-sm font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: "#3b7a4a",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="2" />
                    <path d="M16 8h4a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-4" />
                  </svg>
                  Book Now
                </button>

                {/* Save to Wishlist */}
                <button
                  onClick={() => toggleWishlist(hotel.hotel_id)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 text-xs font-medium uppercase tracking-[0.1em] mt-3 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    border: `1px solid ${isWishlisted ? "var(--gold)" : "var(--cream-border)"}`,
                    color: isWishlisted ? "var(--gold)" : "var(--ink-mid)",
                    background: isWishlisted ? "var(--gold-pale)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isWishlisted ? "var(--gold)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  {isWishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
                </button>

                {/* Trust */}
                <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--cream-border)" }}>
                  <div className="flex justify-center">
                    <TrustBadgesCompact />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ Similar Hotels ═══════════════════ */}
      {similarHotels.length > 0 && (
        <section
          style={{
            padding: "48px 24px",
            borderTop: "1px solid var(--cream-border)",
            background: "var(--cream)",
          }}
          className="lg:!px-[60px]"
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <SectionLabel>More Hotels in {hotel.city}</SectionLabel>
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {similarHotels.map((sh: any) => (
                <Link
                  key={sh.hotel_id}
                  href={`/hotel/${sh.hotel_id}`}
                  className="group block overflow-hidden no-underline"
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--cream-border)",
                    textDecoration: "none",
                  }}
                >
                  <div className="relative overflow-hidden" style={{ height: "140px" }}>
                    <img
                      src={sh.photo1 ? safePhotoUrl(sh.photo1) : FALLBACK_IMG}
                      alt={sh.hotel_name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      style={{ filter: "saturate(0.85)" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                    />
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    {sh.star_rating > 0 && (
                      <div style={{ fontSize: "10px", color: "var(--gold)", marginBottom: "4px" }}>
                        {"\u2605".repeat(Math.round(sh.star_rating))}
                      </div>
                    )}
                    <h4
                      className="text-sm leading-tight line-clamp-2"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 500,
                        color: "var(--ink)",
                        marginBottom: "6px",
                      }}
                    >
                      {sh.hotel_name}
                    </h4>
                    {sh.rates_from && (
                      <p style={{ fontSize: "12px", color: "var(--our-rate)", fontWeight: 500 }}>
                        From {formatCurrency(sh.rates_from, sh.rates_currency || hotel.rates_currency)}
                      </p>
                    )}
                    {sh.rating_average > 0 && (
                      <span
                        className="inline-block mt-1.5 px-1.5 py-0.5 text-[10px]"
                        style={{
                          background: sh.rating_average >= 8.5 ? "rgba(74,124,89,0.1)" : "var(--gold-pale)",
                          color: sh.rating_average >= 8.5 ? "var(--success)" : "var(--gold)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {sh.rating_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ Footer ═══════════════════ */}
      <footer
        className="hotel-footer"
        style={{
          borderTop: "1px solid var(--cream-border)",
          background: "var(--white)",
        }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span
            className="type-logo"
            style={{
              fontSize: "18px",
              color: "var(--ink)",
              letterSpacing: "0.08em",
            }}
          >
            Voyag<span style={{ color: "var(--gold)" }}>r</span>
          </span>
          <p style={{ fontSize: "11px", color: "var(--ink-light)", letterSpacing: "0.06em" }}>
            Preferred hotel rates, negotiated for you.
          </p>
          <div className="flex gap-6">
            <Link
              href="/"
              className="text-xs uppercase tracking-[0.08em] transition-colors hover:opacity-80"
              style={{ color: "var(--ink-light)", textDecoration: "none" }}
            >
              Home
            </Link>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs uppercase tracking-[0.08em] transition-colors hover:opacity-80"
              style={{ color: "var(--ink-light)", textDecoration: "none" }}
            >
              Contact
            </a>
          </div>
        </div>
      </footer>

      {/* ═══════════════════ Mobile Fixed Bottom Bar ═══════════════════ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden px-5 py-3.5 flex items-center justify-between hotel-bottom-bar"
        style={{
          background: "rgba(245, 240, 232, 0.95)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid var(--cream-border)",
        }}
      >
        <div>
          {hotel.rates_from ? (
            <>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "22px",
                  fontWeight: 400,
                  color: "var(--ink)",
                  lineHeight: 1,
                }}
              >
                {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                <span className="text-xs font-normal ml-1" style={{ color: "var(--ink-light)", fontFamily: "var(--font-body)" }}>
                  /night
                </span>
              </p>
              {savePct && savePct > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontSize: "11px", color: "var(--success)", fontWeight: 500, margin: 0 }}>
                    Save {savePct}%
                  </p>
                  <span style={{ fontSize: "9px", color: "var(--ink-light)", display: "flex", alignItems: "center", gap: 3 }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    Best price
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--ink-mid)" }}>Request quote</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Wishlist icon on mobile bar */}
          <button
            onClick={() => toggleWishlist(hotel.hotel_id)}
            className="w-10 h-10 flex items-center justify-center transition-all active:scale-[0.95]"
            style={{
              border: "1px solid var(--cream-border)",
              background: isWishlisted ? "var(--gold-pale)" : "var(--white)",
              cursor: "pointer",
            }}
            aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? "var(--gold)" : "none"} stroke={isWishlisted ? "var(--gold)" : "var(--ink-mid)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>
          {/* Book Now green button */}
          <button
            onClick={() => window.open("https://wa.me/919876543210", "_blank")}
            className="text-xs font-semibold uppercase tracking-[0.1em] transition-all active:scale-[0.97]"
            style={{
              background: "#3b7a4a",
              color: "#ffffff",
              padding: "11px 20px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Footer spacer for mobile bottom bar */}
      <div className="h-16 lg:h-0" />
    </div>
  );
}
