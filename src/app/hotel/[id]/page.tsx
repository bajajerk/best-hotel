"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
      style={{ background: "rgba(12,10,9,0.96)", backdropFilter: "blur(32px)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-xl"
        style={{ color: "var(--text-tertiary)" }}
        aria-label="Close"
      >
        &times;
      </button>

      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 md:left-8 w-12 h-12 flex items-center justify-center text-2xl"
          style={{ color: "var(--text-tertiary)" }}
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
          style={{ color: "var(--text-tertiary)" }}
          aria-label="Next"
        >
          &#8250;
        </button>
      )}

      <span
        className="absolute bottom-6 text-xs tracking-[0.2em]"
        style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
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
    <article style={{ borderBottom: "1px solid var(--border)" }} className="pb-8 mb-8 last:border-0 last:pb-0 last:mb-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-full overflow-hidden shrink-0"
          style={{ background: "var(--bg-elevated)" }}
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
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            {review.reviewer_name}
          </span>
          {review.reviewer_country && (
            <span className="text-xs ml-2" style={{ color: "var(--text-tertiary)" }}>
              {review.reviewer_country}
            </span>
          )}
        </div>
        <span
          className="shrink-0 px-2.5 py-1 text-xs font-medium"
          style={{
            background: review.rating >= 8.5 ? "var(--success-soft)" : "var(--accent-soft)",
            color: review.rating >= 8.5 ? "var(--success)" : "var(--accent)",
            fontFamily: "var(--font-mono)",
            borderRadius: "4px",
          }}
        >
          {review.rating.toFixed(1)}
        </span>
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="text-[15px] font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          {review.title}
        </h4>
      )}

      {/* Positive */}
      {review.positive && (
        <div
          className="pl-4 mb-3"
          style={{ borderLeft: "3px solid var(--success)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
            {review.positive}
          </p>
        </div>
      )}

      {/* Negative */}
      {review.negative && (
        <div
          className="pl-4 mb-3"
          style={{ borderLeft: "3px solid var(--danger)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)", lineHeight: 1.8 }}>
            {review.negative}
          </p>
        </div>
      )}

      {/* Stay date */}
      {review.stay_date && (
        <p
          className="text-[11px] mt-4"
          style={{ color: "var(--text-ghost)", fontFamily: "var(--font-mono)" }}
        >
          Stayed {review.stay_date}
          {review.trip_type && ` \u00b7 ${tripLabels[review.trip_type] || review.trip_type}`}
        </p>
      )}
    </article>
  );
}

/* ────────────────────────── Section Label ────────────────────────── */

function SectionLabel({ children }: { children: string }) {
  return (
    <h3
      className="text-[11px] uppercase mb-6"
      style={{
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.15em",
        color: "var(--text-tertiary)",
      }}
    >
      {children}
    </h3>
  );
}

/* ────────────────────────── Main Page ────────────────────────── */

export default function HotelPage() {
  const params = useParams();
  const hotelId = params.id as string;

  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  /* Gallery */
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);

  /* Overview toggle */
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  /* Sticky header */
  const [headerVisible, setHeaderVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

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
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hotelId]);

  /* ── Scroll observer ── */
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
  }, []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const prevLightbox = useCallback(
    () => setLightboxIdx((i) => (i - 1 + photos.length) % photos.length),
    [photos.length]
  );
  const nextLightbox = useCallback(
    () => setLightboxIdx((i) => (i + 1) % photos.length),
    [photos.length]
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-deep)" }}
      >
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-6">
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent)",
              }}
            />
            <div
              className="absolute inset-2 rounded-full animate-spin"
              style={{
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent)",
                animationDirection: "reverse",
                animationDuration: "0.8s",
              }}
            />
          </div>
          <p
            className="text-sm tracking-[0.15em] uppercase"
            style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
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
        style={{ background: "var(--bg-deep)" }}
      >
        <div className="text-center max-w-md px-6">
          <div
            className="text-7xl mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              color: "var(--text-ghost)",
            }}
          >
            404
          </div>
          <p className="text-lg mb-2" style={{ color: "var(--text-primary)" }}>
            Hotel not found
          </p>
          <p className="text-sm mb-8" style={{ color: "var(--text-tertiary)" }}>
            This property may have been removed or the link is invalid.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--accent)", color: "var(--bg-deep)" }}
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

  const quickFacts = [
    hotel.checkin ? { label: "Check-in", value: hotel.checkin } : null,
    hotel.checkout ? { label: "Check-out", value: hotel.checkout } : null,
    hotel.numberrooms ? { label: "Rooms", value: `${hotel.numberrooms}` } : null,
    hotel.yearrenovated ? { label: "Renovated", value: `${hotel.yearrenovated}` } : null,
    hotel.yearopened ? { label: "Opened", value: `${hotel.yearopened}` } : null,
    hotel.accommodation_type ? { label: "Type", value: hotel.accommodation_type } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-deep)", color: "var(--text-primary)" }}>
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

      {/* ═══════════════════ Sticky Header ═══════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 px-5 md:px-10 lg:px-20 py-3.5 flex items-center justify-between transition-all duration-500"
        style={{
          background: headerVisible ? "rgba(12,10,9,0.92)" : "transparent",
          backdropFilter: headerVisible ? "blur(24px) saturate(180%)" : "none",
          borderBottom: headerVisible ? "1px solid var(--border)" : "1px solid transparent",
          transform: headerVisible ? "translateY(0)" : "translateY(-100%)",
          opacity: headerVisible ? 1 : 0,
          pointerEvents: headerVisible ? "auto" : "none",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="shrink-0">
            <span
              className="text-lg"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                color: "var(--accent)",
              }}
            >
              beatmyrate
            </span>
          </Link>
          <span style={{ color: "var(--text-ghost)" }}>/</span>
          <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
            {hotel.hotel_name}
          </span>
        </div>
        <a
          href="tel:+919876543210"
          className="shrink-0 px-5 py-2 text-sm font-medium transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{ background: "var(--accent)", color: "var(--bg-deep)" }}
        >
          Book Now
        </a>
      </header>

      {/* ═══════════════════ Back Link ═══════════════════ */}
      <div className="px-4 md:px-10 lg:px-20 pt-5 pb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs transition-colors hover:opacity-70"
          style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          BACK
        </Link>
      </div>

      {/* ═══════════════════ Photo Gallery ═══════════════════ */}
      <section ref={heroRef}>
        {photos.length > 0 ? (
          <>
            {/* Desktop: hero + 4 thumbnails */}
            <div className="hidden md:block">
              {/* Hero photo — full bleed */}
              <div
                className="relative cursor-pointer overflow-hidden group"
                style={{ maxHeight: "500px" }}
                onClick={() => openLightbox(0)}
              >
                <motion.img
                  initial={{ scale: 1.05, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                  src={safePhotoUrl(photos[0])}
                  alt={hotel.hotel_name}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  style={{ height: "500px" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "linear-gradient(to top, rgba(12,10,9,0.4) 0%, transparent 40%)" }}
                />
              </div>

              {/* Thumbnails row */}
              {photos.length > 1 && (
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(photos.length - 1, 4)}, 1fr)`,
                    gap: "2px",
                    marginTop: "2px",
                  }}
                >
                  {photos.slice(1, 5).map((photo, i) => (
                    <div
                      key={i}
                      className="relative cursor-pointer overflow-hidden group"
                      style={{ height: "140px" }}
                      onClick={() => openLightbox(i + 1)}
                    >
                      <img
                        src={safePhotoUrl(photo)}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                      />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: "rgba(12,10,9,0.3)" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile: single photo with dots */}
            <div className="md:hidden">
              <div className="relative overflow-hidden" style={{ height: "300px", maxHeight: "300px" }}>
                <img
                  src={safePhotoUrl(photos[carouselIdx])}
                  alt={hotel.hotel_name}
                  loading="lazy"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => openLightbox(carouselIdx)}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />

                {/* Dots */}
                {photos.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIdx(i)}
                        className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          background: i === carouselIdx ? "var(--text-primary)" : "var(--text-tertiary)",
                          transform: i === carouselIdx ? "scale(1.5)" : "scale(1)",
                        }}
                        aria-label={`Photo ${i + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Swipe hint arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setCarouselIdx((i) => (i - 1 + photos.length) % photos.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-lg"
                      style={{ background: "rgba(12,10,9,0.5)", color: "var(--text-secondary)" }}
                      aria-label="Previous photo"
                    >
                      &#8249;
                    </button>
                    <button
                      onClick={() => setCarouselIdx((i) => (i + 1) % photos.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-lg"
                      style={{ background: "rgba(12,10,9,0.5)", color: "var(--text-secondary)" }}
                      aria-label="Next photo"
                    >
                      &#8250;
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              height: "320px",
              background: "linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--text-ghost)" }}>
              No photos available
            </p>
          </div>
        )}
      </section>

      {/* ═══════════════════ Hotel Info — 2-Column ═══════════════════ */}
      <section className="px-4 md:px-10 lg:px-20 py-10 md:py-16">
        <div
          className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16"
        >
          {/* ─── Left Column (65%) ─── */}
          <motion.div
            className="lg:col-span-7 xl:col-span-8 min-w-0"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {/* Star rating as accent dots */}
            {hotel.star_rating > 0 && (
              <motion.div variants={fadeUp} custom={0} className="mb-3">
                <span style={{ color: "var(--accent)", letterSpacing: "0.3em", fontSize: "10px" }}>
                  {Array.from({ length: Math.round(hotel.star_rating) })
                    .map(() => "\u2022")
                    .join(" ")}
                </span>
              </motion.div>
            )}

            {/* Hotel name */}
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl md:text-5xl leading-[1.1] mb-4"
              style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
            >
              {hotel.hotel_name}
            </motion.h1>

            {/* Address */}
            {address && (
              <motion.p
                variants={fadeUp}
                custom={2}
                className="flex items-center gap-2 text-sm mb-6"
                style={{ color: "var(--text-tertiary)" }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="shrink-0"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {address}
              </motion.p>
            )}

            {/* Rating */}
            {hotel.rating_average > 0 && (
              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex items-center gap-4 mb-2"
              >
                <span
                  className="text-3xl font-light"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--text-primary)",
                  }}
                >
                  {hotel.rating_average.toFixed(1)}
                </span>
                <div>
                  <span
                    className="text-base"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {ratingLabel(hotel.rating_average)}
                  </span>
                  {(hotel.number_of_reviews > 0 || reviewCount > 0) && (
                    <span
                      className="text-xs ml-3"
                      style={{
                        color: "var(--text-tertiary)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {(hotel.number_of_reviews || reviewCount).toLocaleString()} reviews
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Divider ── */}
            <motion.div
              variants={fadeUp}
              custom={4}
              className="my-10"
              style={{
                height: "1px",
                background: "linear-gradient(to right, var(--accent-border), transparent 70%)",
              }}
            />

            {/* ── About ── */}
            {hotel.overview && (
              <motion.div variants={fadeUp} custom={5} className="mb-12">
                <SectionLabel>About</SectionLabel>
                <div className="relative">
                  <div
                    className="prose-hotel"
                    style={{
                      maxHeight: overviewExpanded ? "none" : "200px",
                      overflow: "hidden",
                    }}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(hotel.overview) }}
                  />
                  {!overviewExpanded && hotel.overview.length > 400 && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "80px",
                        background: "linear-gradient(to bottom, transparent, var(--bg-deep))",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
                {hotel.overview.length > 400 && (
                  <button
                    onClick={() => setOverviewExpanded(!overviewExpanded)}
                    className="mt-3 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: "var(--accent)" }}
                  >
                    {overviewExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </motion.div>
            )}

            {/* ── Quick Facts ── */}
            {quickFacts.length > 0 && (
              <motion.div variants={fadeUp} custom={6} className="mb-12">
                <SectionLabel>Details</SectionLabel>
                <div style={{ border: "1px solid var(--border)", borderRadius: "2px" }}>
                  {quickFacts.map((fact, i) => (
                    <div
                      key={fact.label}
                      className="grid grid-cols-2 py-3.5 px-5 text-sm"
                      style={{
                        borderBottom: i < quickFacts.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text-tertiary)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {fact.label}
                      </span>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {fact.value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Divider ── */}
            <motion.div
              variants={fadeUp}
              custom={7}
              className="mb-12"
              style={{
                height: "1px",
                background: "linear-gradient(to right, var(--border), transparent)",
              }}
            />

            {/* ── Mobile Booking Section ── */}
            <motion.div variants={fadeUp} custom={7} className="lg:hidden mb-12">
              <SectionLabel>Pricing</SectionLabel>
              <div
                className="p-6"
                style={{
                  background: "var(--bg-surface)",
                  borderTop: "2px solid var(--accent)",
                }}
              >
                {hotel.rates_from ? (
                  <div className="mb-5">
                    <span
                      className="text-[11px] uppercase tracking-[0.1em]"
                      style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                    >
                      from
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span
                        className="text-3xl"
                        style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--text-primary)" }}
                      >
                        {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                      </span>
                      <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                        /night
                      </span>
                    </div>
                    {otaPrice && savePct && (
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="text-sm line-through"
                          style={{ color: "var(--danger)" }}
                        >
                          {formatCurrency(otaPrice, hotel.rates_currency)} on MakeMyTrip
                        </span>
                        <span
                          className="text-[11px] px-2 py-0.5 font-medium"
                          style={{
                            background: "var(--success-soft)",
                            color: "var(--success)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          Save {savePct}%
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-5">
                    <span
                      className="text-xl"
                      style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--text-secondary)" }}
                    >
                      Request a quote
                    </span>
                  </div>
                )}

                <a
                  href="tel:+919876543210"
                  className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "var(--accent)", color: "var(--bg-deep)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  Call to Book
                </a>

                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-medium mt-3 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ border: "1px solid var(--accent-border)", color: "var(--accent)" }}
                >
                  WhatsApp
                </a>

                <p className="text-xs text-center mt-4" style={{ color: "var(--text-tertiary)" }}>
                  No hidden fees. We confirm availability on call.
                </p>
              </div>
            </motion.div>

            {/* ── Guest Reviews ── */}
            {reviews.length > 0 && (
              <motion.div variants={fadeUp} custom={8}>
                <div className="flex items-end justify-between mb-6">
                  <SectionLabel>Reviews</SectionLabel>
                  {reviewCount > reviews.length && (
                    <span
                      className="text-xs mb-6"
                      style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                    >
                      Showing {reviews.length} of {reviewCount}
                    </span>
                  )}
                </div>
                <div>
                  {reviews.map((review) => (
                    <ReviewItem key={review.id} review={review} />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ─── Right Column (35%) — Sticky Sidebar ─── */}
          <div className="lg:col-span-5 xl:col-span-4 hidden lg:block">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="sticky top-24"
            >
              <div
                style={{
                  background: "var(--bg-surface)",
                  borderTop: "2px solid var(--accent)",
                }}
              >
                <div className="p-7">
                  {/* Price */}
                  {hotel.rates_from ? (
                    <div className="mb-7">
                      <span
                        className="text-[11px] uppercase tracking-[0.1em]"
                        style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                      >
                        from
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span
                          className="text-4xl"
                          style={{
                            fontFamily: "var(--font-display)",
                            fontStyle: "italic",
                            color: "var(--text-primary)",
                          }}
                        >
                          {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                        </span>
                        <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                          /night
                        </span>
                      </div>

                      {/* OTA comparison */}
                      {otaPrice && savePct && (
                        <div className="flex items-center gap-3 mt-3">
                          <span
                            className="text-sm line-through"
                            style={{ color: "var(--danger)" }}
                          >
                            {formatCurrency(otaPrice, hotel.rates_currency)} on MakeMyTrip
                          </span>
                          <span
                            className="text-[11px] px-2 py-0.5 font-medium"
                            style={{
                              background: "var(--success-soft)",
                              color: "var(--success)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            Save {savePct}%
                          </span>
                        </div>
                      )}

                      <p
                        className="text-xs mt-3"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Prices vary by date. Call for exact quote.
                      </p>
                    </div>
                  ) : (
                    <div className="mb-7">
                      <span
                        className="text-2xl"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Request a quote
                      </span>
                      <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                        Call us for the best available rate
                      </p>
                    </div>
                  )}

                  {/* CTA: Call to Book */}
                  <a
                    href="tel:+919876543210"
                    className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "var(--accent)", color: "var(--bg-deep)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                    Call to Book
                  </a>

                  {/* CTA: WhatsApp */}
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-medium mt-3 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ border: "1px solid var(--accent-border)", color: "var(--accent)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>

                  {/* Trust */}
                  <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
                    <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
                      No hidden fees. We confirm availability on call.
                    </p>
                  </div>

                  {/* Chain / Brand */}
                  {(hotel.chain_name || hotel.brand_name) && (
                    <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                      <p className="text-[11px]" style={{ color: "var(--text-ghost)" }}>
                        {[hotel.chain_name, hotel.brand_name].filter(Boolean).join(" \u00b7 ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ Mobile Fixed Bottom Bar ═══════════════════ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 py-3 flex items-center justify-between"
        style={{
          background: "rgba(12,10,9,0.95)",
          backdropFilter: "blur(24px) saturate(180%)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div>
          {hotel.rates_from ? (
            <>
              <p
                className="text-xl"
                style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--text-primary)" }}
              >
                {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                <span className="text-xs font-normal ml-1" style={{ color: "var(--text-tertiary)" }}>
                  /night
                </span>
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Request quote</p>
          )}
        </div>
        <a
          href="tel:+919876543210"
          className="px-6 py-2.5 text-sm font-semibold transition-all active:scale-[0.97]"
          style={{ background: "var(--accent)", color: "var(--bg-deep)" }}
        >
          Book
        </a>
      </div>

      {/* Footer spacer */}
      <div className="h-20 lg:h-20" />
      <div className="h-16 lg:hidden" />
    </div>
  );
}
