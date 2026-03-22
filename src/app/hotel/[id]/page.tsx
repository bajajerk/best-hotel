"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import MobileNav from "@/components/MobileNav";
import BackButton from "@/components/BackButton";
import Breadcrumbs from "@/components/Breadcrumbs";

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

/* ────────────────────────── Tabs ────────────────────────── */

const TABS = ["Overview", "Gallery", "Reviews", "Location"] as const;
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

/* ────────────────────────── Section Label ────────────────────────── */

function SectionLabel({ children }: { children: string }) {
  return (
    <h3
      className="text-[10px] uppercase mb-6"
      style={{
        fontFamily: "var(--sans)",
        fontWeight: 600,
        letterSpacing: "0.18em",
        color: "var(--gold)",
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

  /* Tabs */
  const [activeTab, setActiveTab] = useState<TabName>("Overview");

  /* Overview toggle */
  const [overviewExpanded, setOverviewExpanded] = useState(false);

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
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hotelId]);

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

  /* ── Tab click handler ── */
  const handleTabClick = useCallback((tab: TabName) => {
    setActiveTab(tab);
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

      {/* ═══════════════════ Sticky Frosted Cream Nav ═══════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
        style={{
          height: "60px",
          padding: "0 24px",
          background: "rgba(245, 240, 232, 0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--cream-border)",
        }}
      >
        <Link href="/" className="no-underline">
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: "var(--ink)",
              fontStyle: "italic",
            }}
          >
            Voyag<span style={{ color: "var(--gold)" }}>r</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div
          className="nav-links"
          style={{ display: "flex", gap: "24px", alignItems: "center" }}
        >
          {[
            { label: "HOME", href: "/" },
            { label: "SEARCH", href: "#search" },
            { label: "ACCOUNT", href: "#account" },
            { label: "PREFERRED RATES", href: "#preferred-rates" },
            { label: "MATCH MY PRICE", href: "#match-my-price" },
            { label: "BOOKING HISTORY", href: "#booking-history" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: "var(--ink-mid)",
                textDecoration: "none",
                paddingBottom: "2px",
                borderBottom: "1px solid transparent",
                transition: "color 0.2s, border-color 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLAnchorElement).style.color = "var(--gold)";
                (e.target as HTMLAnchorElement).style.borderBottomColor = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLAnchorElement).style.color = "var(--ink-mid)";
                (e.target as HTMLAnchorElement).style.borderBottomColor = "transparent";
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Sticky hotel name + book button appear after scrolling past hero */}
        <div
          className="flex items-center gap-4 transition-all duration-500"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(-8px)",
            pointerEvents: headerVisible ? "auto" : "none",
          }}
        >
          <span
            className="text-sm truncate max-w-[200px] hidden md:block"
            style={{ color: "var(--ink-mid)" }}
          >
            {hotel.hotel_name}
          </span>
          <a
            href="tel:+919876543210"
            className="shrink-0 text-xs font-medium uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
            style={{
              background: "var(--gold)",
              color: "var(--ink)",
              padding: "10px 20px",
            }}
          >
            Book Now
          </a>
          <MobileNav
            links={[
              { label: "Home", href: "/" },
              { label: "Search", href: "#search" },
              { label: "Account", href: "#account" },
              { label: "Preferred Rates", href: "#preferred-rates" },
              { label: "Match My Price", href: "#match-my-price" },
              { label: "Booking History", href: "#booking-history" },
            ]}
          />
        </div>
      </nav>

      {/* ═══════════════════ Breadcrumbs ═══════════════════ */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: hotel.city, href: `/city/${hotel.city.toLowerCase().replace(/\s+/g, "-")}` },
          { label: hotel.hotel_name },
        ]}
      />

      {/* ═══════════════════ Back Button ═══════════════════ */}
      <div
        style={{
          paddingTop: 104,
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

      {/* ═══════════════════ Hero Image (440px) ═══════════════════ */}
      <section ref={heroRef}>
        <div
          className="relative overflow-hidden cursor-pointer hotel-hero"
          onClick={() => photos.length > 0 && openLightbox(0)}
        >
          {photos.length > 0 ? (
            <motion.img
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              src={safePhotoUrl(photos[0])}
              alt={hotel.hotel_name}
              loading="eager"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.88) saturate(0.85)" }}
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "var(--cream-deep)" }}
            >
              <p className="text-sm" style={{ color: "var(--ink-light)" }}>
                No photos available
              </p>
            </div>
          )}

          {/* Dark gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, rgba(26,23,16,0.7) 0%, transparent 60%)",
            }}
          />

          {/* Hotel name + save badge overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-end justify-between hotel-hero-overlay"
            style={{ color: "var(--cream)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {starDisplay && (
                <div
                  className="mb-2"
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
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
                  style={{
                    fontFamily: "var(--font-display)",
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
        </div>
      </section>

      {/* ═══════════════════ Tabs Bar ═══════════════════ */}
      <div
        className="hidden md:flex gap-2 sticky top-[60px] z-40 hotel-tabs-bar"
        style={{
          background: "var(--white)",
          borderBottom: "1px solid var(--cream-border)",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            style={{
              padding: "16px 24px",
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: activeTab === tab ? "var(--ink)" : "var(--ink-light)",
              cursor: "pointer",
              borderBottom: activeTab === tab ? "2px solid var(--ink)" : "2px solid transparent",
              background: "transparent",
              border: "none",
              borderBottomWidth: "2px",
              borderBottomStyle: "solid",
              borderBottomColor: activeTab === tab ? "var(--ink)" : "transparent",
              transition: "all 0.2s",
              fontFamily: "var(--font-body)",
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
          gridTemplateColumns: "1fr 340px",
          gap: 0,
          flex: 1,
        }}
      >
        {/* ─── Left: Main Content (65%) ─── */}
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
            {hotel.rating_average > 0 && (
              <motion.div variants={fadeUp} custom={0} className="flex items-center gap-4 mb-6">
                <span
                  className="text-3xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    color: "var(--ink)",
                  }}
                >
                  {hotel.rating_average.toFixed(1)}
                </span>
                <div>
                  <span className="text-base font-medium" style={{ color: "var(--ink)" }}>
                    {ratingLabel(hotel.rating_average)}
                  </span>
                  {(hotel.number_of_reviews > 0 || reviewCount > 0) && (
                    <span
                      className="text-xs ml-3"
                      style={{ color: "var(--ink-light)", fontFamily: "var(--font-mono)" }}
                    >
                      {(hotel.number_of_reviews || reviewCount).toLocaleString()} reviews
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

            {/* About / Overview */}
            {hotel.overview && (
              <motion.div variants={fadeUp} custom={2} className="mb-10">
                <SectionLabel>About This Property</SectionLabel>
                <div className="relative">
                  <div
                    style={{
                      maxHeight: overviewExpanded ? "none" : "200px",
                      overflow: "hidden",
                      fontSize: "14px",
                      lineHeight: 1.8,
                      color: "var(--ink-mid)",
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
                        background: "linear-gradient(to bottom, transparent, var(--cream))",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
                {hotel.overview.length > 400 && (
                  <button
                    onClick={() => setOverviewExpanded(!overviewExpanded)}
                    className="mt-3 text-xs font-medium uppercase tracking-[0.08em] transition-colors hover:opacity-80"
                    style={{ color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)" }}
                  >
                    {overviewExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </motion.div>
            )}

            {/* ── Amenities / Quick Facts ── */}
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
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "var(--ink-light)",
                          marginBottom: "6px",
                        }}
                      >
                        Check-in
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "20px",
                          fontWeight: 400,
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
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "var(--ink-light)",
                          marginBottom: "6px",
                        }}
                      >
                        Check-out
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "20px",
                          fontWeight: 400,
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
                      style={{
                        fontSize: "10px",
                        color: "var(--gold)",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
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
                          color: "var(--ink-light)",
                          textDecoration: "line-through",
                        }}
                      >
                        Market rate: {formatCurrency(otaPrice, hotel.rates_currency)}/night
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "36px",
                          fontWeight: 400,
                          color: "var(--ink)",
                          lineHeight: 1,
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

                <a
                  href="tel:+919876543210"
                  className="flex items-center justify-center gap-2 w-full py-3.5 text-xs font-medium uppercase tracking-[0.1em] transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: "var(--gold)",
                    color: "var(--ink)",
                    textDecoration: "none",
                  }}
                >
                  Book This Rate
                </a>

                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 text-xs font-medium uppercase tracking-[0.1em] mt-3 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    border: "1px solid var(--cream-border)",
                    color: "var(--ink-mid)",
                    textDecoration: "none",
                  }}
                >
                  WhatsApp
                </a>

                <p className="text-[11px] text-center mt-4" style={{ color: "var(--ink-light)" }}>
                  Free cancellation. No hidden fees.
                </p>
              </div>
            </motion.div>

            {/* ── REVIEWS Section ── */}
            <div ref={reviewsRef} style={{ scrollMarginTop: "120px" }}>
              {reviews.length > 0 && (
                <motion.div variants={fadeUp} custom={7}>
                  <div className="flex items-end justify-between mb-6">
                    <SectionLabel>Guest Reviews</SectionLabel>
                    {reviewCount > reviews.length && (
                      <span
                        className="text-xs mb-6"
                        style={{ color: "var(--ink-light)", fontFamily: "var(--font-mono)" }}
                      >
                        Showing {reviews.length} of {reviewCount}
                      </span>
                    )}
                  </div>
                  <div
                    className="hotel-reviews-card"
                    style={{
                      background: "var(--white)",
                      border: "1px solid var(--cream-border)",
                    }}
                  >
                    {reviews.map((review) => (
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
                      padding: "24px",
                    }}
                  >
                    <p className="text-sm mb-3" style={{ color: "var(--ink-mid)" }}>
                      {address}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-medium uppercase tracking-[0.08em] transition-opacity hover:opacity-80"
                      style={{ color: "var(--gold)", textDecoration: "none" }}
                    >
                      View on Google Maps &rarr;
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── Right Column: Sticky Booking Card (35%) ─── */}
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
                      style={{
                        fontSize: "10px",
                        color: "var(--gold)",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        marginBottom: "16px",
                      }}
                    >
                      Preferred Rate
                    </div>

                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "36px",
                        fontWeight: 400,
                        color: "var(--ink)",
                        lineHeight: 1,
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
                          color: "var(--ink-light)",
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

                {/* Book CTA */}
                <a
                  href="tel:+919876543210"
                  className="flex items-center justify-center gap-2 w-full py-3.5 text-xs font-medium uppercase tracking-[0.1em] transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: "var(--gold)",
                    color: "var(--ink)",
                    textDecoration: "none",
                  }}
                >
                  Book This Rate
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 text-xs font-medium uppercase tracking-[0.1em] mt-3 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    border: "1px solid var(--cream-border)",
                    color: "var(--ink-mid)",
                    textDecoration: "none",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>

                {/* Trust */}
                <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--cream-border)" }}>
                  <p className="text-[11px] text-center" style={{ color: "var(--ink-light)" }}>
                    Free cancellation &middot; No hidden fees
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

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
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 500,
              fontStyle: "italic",
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
                <p style={{ fontSize: "11px", color: "var(--success)", fontWeight: 500 }}>
                  Save {savePct}%
                </p>
              )}
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--ink-mid)" }}>Request quote</p>
          )}
        </div>
        <a
          href="tel:+919876543210"
          className="text-xs font-medium uppercase tracking-[0.1em] transition-all active:scale-[0.97]"
          style={{
            background: "var(--gold)",
            color: "var(--ink)",
            padding: "10px 20px",
            textDecoration: "none",
          }}
        >
          Book
        </a>
      </div>

      {/* Footer spacer for mobile bottom bar */}
      <div className="h-16 lg:h-0" />
    </div>
  );
}
