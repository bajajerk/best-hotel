"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

/** Convert Agoda http URLs to https; resolve relative hotelbeds paths. */
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

function ratingColor(r: number): string {
  if (r >= 8.5) return "var(--green)";
  if (r >= 7) return "var(--gold)";
  return "var(--white-50)";
}

/* ────────────────────────── Sub-components ────────────────────────── */

function StarDisplay({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-[3px]">
      {Array.from({ length: Math.round(count) }).map((_, i) => (
        <svg
          key={i}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="var(--gold)"
          stroke="none"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

/* ── Lightbox ── */

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
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(24px)" }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-xl"
        style={{ background: "var(--white-08)", color: "var(--white-80)" }}
        aria-label="Close"
      >
        &times;
      </button>

      {/* Prev */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 md:left-8 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ background: "var(--white-08)", color: "var(--white-80)" }}
          aria-label="Previous"
        >
          &#8249;
        </button>
      )}

      {/* Image */}
      <img
        src={safePhotoUrl(photos[index])}
        alt=""
        className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
      />

      {/* Next */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 md:right-8 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ background: "var(--white-08)", color: "var(--white-80)" }}
          aria-label="Next"
        >
          &#8250;
        </button>
      )}

      {/* Counter */}
      <span
        className="absolute bottom-6 text-xs tracking-widest"
        style={{ color: "var(--white-30)", fontFamily: "var(--font-mono)" }}
      >
        {index + 1} / {photos.length}
      </span>
    </div>
  );
}

/* ── Review Card ── */

function ReviewCard({ review }: { review: Review }) {
  const tripLabels: Record<string, string> = {
    solo: "Solo traveller",
    couple: "Couple",
    family: "Family",
    business: "Business",
    friends: "Group of friends",
  };

  return (
    <article
      className="rounded-2xl p-6 transition-all duration-300"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--white-15)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border)")
      }
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={
              review.reviewer_avatar_url ||
              `https://i.pravatar.cc/48?u=${review.id}`
            }
            alt=""
            className="w-11 h-11 rounded-full object-cover ring-2"
            style={{ ringColor: "var(--white-08)" } as React.CSSProperties}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://i.pravatar.cc/48?u=${review.id}`;
            }}
          />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--white)" }}>
              {review.reviewer_name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--white-30)" }}>
              {[
                review.reviewer_country,
                review.trip_type
                  ? tripLabels[review.trip_type] || review.trip_type
                  : null,
              ]
                .filter(Boolean)
                .join(" \u00b7 ")}
            </p>
          </div>
        </div>
        <span
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            background:
              review.rating >= 8.5 ? "var(--green-soft)" : "var(--gold-soft)",
            color: review.rating >= 8.5 ? "var(--green)" : "var(--gold)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {review.rating.toFixed(1)}
        </span>
      </div>

      {/* Title */}
      {review.title && (
        <h4
          className="text-[15px] font-semibold mb-3 leading-snug"
          style={{ color: "var(--white)" }}
        >
          {review.title}
        </h4>
      )}

      {/* Positive */}
      {review.positive && (
        <div className="flex gap-3 mb-3">
          <span
            className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--green-soft)", color: "var(--green)" }}
          >
            +
          </span>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--white-50)" }}
          >
            {review.positive}
          </p>
        </div>
      )}

      {/* Negative */}
      {review.negative && (
        <div className="flex gap-3 mb-3">
          <span
            className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--red-soft)", color: "var(--red)" }}
          >
            &minus;
          </span>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--white-30)" }}
          >
            {review.negative}
          </p>
        </div>
      )}

      {/* Date */}
      {review.stay_date && (
        <p
          className="text-[11px] mt-4 pt-3"
          style={{
            color: "var(--white-15)",
            fontFamily: "var(--font-mono)",
            borderTop: "1px solid var(--border)",
          }}
        >
          Stayed {review.stay_date}
        </p>
      )}
    </article>
  );
}

/* ── Quick Fact Card ── */

function FactCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <span
        className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base"
        style={{ background: "var(--white-04)", color: "var(--white-30)" }}
      >
        {icon}
      </span>
      <div>
        <p
          className="text-[11px] uppercase tracking-widest mb-1"
          style={{ color: "var(--white-30)", fontFamily: "var(--font-mono)" }}
        >
          {label}
        </p>
        <p className="text-sm font-medium" style={{ color: "var(--white-80)" }}>
          {value}
        </p>
      </div>
    </div>
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

  /* Gallery state */
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);

  /* Sticky header visibility */
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

  /* ── Lightbox nav ── */
  const photos = hotel
    ? ([hotel.photo1, hotel.photo2, hotel.photo3, hotel.photo4, hotel.photo5].filter(
        Boolean
      ) as string[])
    : [];

  const openLightbox = useCallback(
    (idx: number) => {
      setLightboxIdx(idx);
      setLightboxOpen(true);
    },
    []
  );
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const prevLightbox = useCallback(
    () => setLightboxIdx((i) => (i - 1 + photos.length) % photos.length),
    [photos.length]
  );
  const nextLightbox = useCallback(
    () => setLightboxIdx((i) => (i + 1) % photos.length),
    [photos.length]
  );

  /* ── Loading state ── */
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-black)" }}
      >
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-6">
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                border: "2px solid var(--white-08)",
                borderTopColor: "var(--gold)",
              }}
            />
            <div
              className="absolute inset-2 rounded-full animate-spin"
              style={{
                border: "2px solid var(--white-04)",
                borderTopColor: "var(--gold)",
                animationDirection: "reverse",
                animationDuration: "0.8s",
              }}
            />
          </div>
          <p
            className="text-sm tracking-widest uppercase"
            style={{ color: "var(--white-30)", fontFamily: "var(--font-mono)" }}
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
        style={{ background: "var(--bg-black)" }}
      >
        <div className="text-center max-w-md px-6">
          <div
            className="text-6xl mb-6"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: "var(--white-15)",
            }}
          >
            404
          </div>
          <p className="text-lg mb-2" style={{ color: "var(--white)" }}>
            Hotel not found
          </p>
          <p className="text-sm mb-8" style={{ color: "var(--white-30)" }}>
            This property may have been removed or the link is invalid.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--gold)", color: "#0A0A0A" }}
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

  const quickFacts = [
    hotel.checkin
      ? {
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3v4a1 1 0 001 1h4" /><path d="M18 17h-7a2 2 0 01-2-2V2" /><path d="M9 12l3 3-3 3" />
            </svg>
          ),
          label: "Check-in",
          value: hotel.checkin,
        }
      : null,
    hotel.checkout
      ? {
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3v4a1 1 0 001 1h4" /><path d="M18 17h-7a2 2 0 01-2-2V2" /><path d="M15 12l-3 3 3 3" />
            </svg>
          ),
          label: "Check-out",
          value: hotel.checkout,
        }
      : null,
    hotel.numberrooms
      ? {
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          ),
          label: "Rooms",
          value: `${hotel.numberrooms} rooms`,
        }
      : null,
    hotel.yearrenovated
      ? {
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
            </svg>
          ),
          label: "Renovated",
          value: `${hotel.yearrenovated}`,
        }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-black)", color: "var(--white)" }}>
      {/* ═══════════════════ Lightbox ═══════════════════ */}
      {lightboxOpen && photos.length > 0 && (
        <Lightbox
          photos={photos}
          index={lightboxIdx}
          onClose={closeLightbox}
          onPrev={prevLightbox}
          onNext={nextLightbox}
        />
      )}

      {/* ═══════════════════ Sticky Header ═══════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 px-5 md:px-10 lg:px-20 py-3.5 flex items-center justify-between transition-all duration-500"
        style={{
          background: headerVisible ? "rgba(10,10,10,0.92)" : "transparent",
          backdropFilter: headerVisible ? "blur(24px) saturate(180%)" : "none",
          borderBottom: headerVisible
            ? "1px solid var(--border)"
            : "1px solid transparent",
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
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--gold)",
              }}
            >
              beatmyrate
            </span>
          </Link>
          <span style={{ color: "var(--white-15)" }}>/</span>
          <span
            className="text-sm truncate"
            style={{ color: "var(--white-50)" }}
          >
            {hotel.hotel_name}
          </span>
        </div>
        <a
          href="tel:+919876543210"
          className="shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{ background: "var(--gold)", color: "#0A0A0A" }}
        >
          Book Now
        </a>
      </header>

      {/* ═══════════════════ Photo Gallery ═══════════════════ */}
      <section ref={heroRef} className="px-4 md:px-10 lg:px-20 pt-5">
        <div className="max-w-[1400px] mx-auto">
          {photos.length > 0 ? (
            <>
              {/* Desktop: main + grid of 4 */}
              <div
                className="hidden md:grid gap-2 rounded-2xl overflow-hidden"
                style={{
                  gridTemplateColumns: "3fr 2fr",
                  height: "500px",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                }}
              >
                {/* Main photo */}
                <div
                  className="relative cursor-pointer overflow-hidden group"
                  onClick={() => openLightbox(0)}
                >
                  <img
                    src={safePhotoUrl(photos[0])}
                    alt={hotel.hotel_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)",
                    }}
                  />
                </div>

                {/* Side grid */}
                <div className="grid grid-cols-2 grid-rows-2 gap-2">
                  {[1, 2, 3, 4].map((i) => {
                    const photo = photos[i];
                    if (!photo) return <div key={i} style={{ background: "var(--bg-card)" }} />;
                    return (
                      <div
                        key={i}
                        className="relative cursor-pointer overflow-hidden group"
                        onClick={() => openLightbox(i)}
                      >
                        <img
                          src={safePhotoUrl(photo)}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_IMG;
                          }}
                        />
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: "rgba(0,0,0,0.25)" }}
                        />
                        {/* "View all" overlay on last photo */}
                        {i === 4 && photos.length > 5 && (
                          <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ background: "rgba(0,0,0,0.55)" }}
                          >
                            <span
                              className="text-sm font-medium"
                              style={{ color: "var(--white)" }}
                            >
                              +{photos.length - 5} more
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile: single carousel */}
              <div className="md:hidden">
                <div
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    height: "280px",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                  }}
                >
                  <img
                    src={safePhotoUrl(photos[carouselIdx])}
                    alt={hotel.hotel_name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => openLightbox(carouselIdx)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                  />

                  {/* Nav arrows */}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCarouselIdx(
                            (i) => (i - 1 + photos.length) % photos.length
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-lg"
                        style={{
                          background: "rgba(0,0,0,0.5)",
                          color: "var(--white-80)",
                        }}
                        aria-label="Previous photo"
                      >
                        &#8249;
                      </button>
                      <button
                        onClick={() =>
                          setCarouselIdx((i) => (i + 1) % photos.length)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-lg"
                        style={{
                          background: "rgba(0,0,0,0.5)",
                          color: "var(--white-80)",
                        }}
                        aria-label="Next photo"
                      >
                        &#8250;
                      </button>
                    </>
                  )}

                  {/* Dots */}
                  {photos.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCarouselIdx(i)}
                          className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                          style={{
                            background:
                              i === carouselIdx
                                ? "var(--white)"
                                : "var(--white-30)",
                            transform:
                              i === carouselIdx ? "scale(1.4)" : "scale(1)",
                          }}
                          aria-label={`Photo ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* No photos placeholder */
            <div
              className="rounded-2xl flex items-center justify-center"
              style={{
                height: "320px",
                background:
                  "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="text-center">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "var(--white-15)", margin: "0 auto 12px" }}
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p className="text-sm" style={{ color: "var(--white-15)" }}>
                  No photos available
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ Hotel Info — 2-Column ═══════════════════ */}
      <section className="px-4 md:px-10 lg:px-20 py-10 md:py-14">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
          {/* ─── Left Column (2/3) ─── */}
          <div className="lg:col-span-2 min-w-0">
            {/* Stars + type badge */}
            <div className="flex items-center gap-3 mb-3">
              {hotel.star_rating > 0 && <StarDisplay count={hotel.star_rating} />}
              {hotel.accommodation_type && (
                <span
                  className="text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider font-medium"
                  style={{
                    background: "var(--gold-soft)",
                    color: "var(--gold)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {hotel.accommodation_type}
                </span>
              )}
            </div>

            {/* Hotel name */}
            <h1
              className="text-3xl md:text-5xl leading-tight mb-3"
              style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
            >
              {hotel.hotel_name}
            </h1>

            {/* Address */}
            {address && (
              <p className="flex items-center gap-2 text-sm mb-5" style={{ color: "var(--white-50)" }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                  style={{ color: "var(--white-30)" }}
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {address}
              </p>
            )}

            {/* Rating badge */}
            {hotel.rating_average > 0 && (
              <div className="flex items-center gap-3 mb-1">
                <span
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-base font-bold"
                  style={{
                    background: ratingColor(hotel.rating_average),
                    color: "#0A0A0A",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {hotel.rating_average.toFixed(1)}
                </span>
                <div>
                  <p
                    className="text-base font-semibold"
                    style={{ color: ratingColor(hotel.rating_average) }}
                  >
                    {ratingLabel(hotel.rating_average)}
                  </p>
                  {(hotel.number_of_reviews > 0 || reviewCount > 0) && (
                    <p
                      className="text-xs mt-0.5"
                      style={{
                        color: "var(--white-30)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {(hotel.number_of_reviews || reviewCount).toLocaleString()}{" "}
                      verified reviews
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Divider ── */}
            <div
              className="my-8"
              style={{
                height: "1px",
                background:
                  "linear-gradient(to right, var(--border), transparent)",
              }}
            />

            {/* ── About ── */}
            {hotel.overview && (
              <div className="mb-10">
                <h2
                  className="text-xl md:text-2xl mb-4"
                  style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
                >
                  About this hotel
                </h2>
                <div
                  className="text-sm leading-[1.8] max-w-prose"
                  style={{ color: "var(--white-50)" }}
                  dangerouslySetInnerHTML={{ __html: hotel.overview }}
                />
              </div>
            )}

            {/* ── Quick Facts Grid ── */}
            {quickFacts.length > 0 && (
              <div className="mb-10">
                <h2
                  className="text-xl md:text-2xl mb-4"
                  style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
                >
                  Quick facts
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {quickFacts.map((fact) => (
                    <FactCard
                      key={fact.label}
                      icon={fact.icon}
                      label={fact.label}
                      value={fact.value}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Divider ── */}
            <div
              className="my-8"
              style={{
                height: "1px",
                background:
                  "linear-gradient(to right, var(--border), transparent)",
              }}
            />

            {/* ── Guest Reviews ── */}
            {reviews.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-6">
                  <h2
                    className="text-xl md:text-2xl"
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontStyle: "italic",
                    }}
                  >
                    Guest reviews
                  </h2>
                  {reviewCount > reviews.length && (
                    <span
                      className="text-xs"
                      style={{
                        color: "var(--white-30)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Showing {reviews.length} of {reviewCount}
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── Right Column (1/3) — Sticky Booking Card ─── */}
          <div className="lg:col-span-1">
            <div
              className="sticky top-24 rounded-2xl overflow-hidden"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--gold-border)",
                boxShadow: "0 4px 40px rgba(201,169,98,0.06)",
              }}
            >
              {/* Gold accent bar */}
              <div
                style={{
                  height: "3px",
                  background:
                    "linear-gradient(to right, var(--gold), transparent)",
                }}
              />

              <div className="p-6">
                {/* B2B label */}
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="text-[11px] tracking-[0.25em] uppercase font-medium"
                    style={{
                      color: "var(--gold)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    B2B Rate
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--green-soft)",
                      color: "var(--green)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Best Price
                  </span>
                </div>

                {/* Price */}
                {hotel.rates_from ? (
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-4xl"
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontStyle: "italic",
                          color: "var(--green)",
                        }}
                      >
                        ${Math.round(hotel.rates_from)}
                      </span>
                      <span
                        className="text-sm"
                        style={{ color: "var(--white-30)" }}
                      >
                        / night
                      </span>
                    </div>
                    <p
                      className="text-xs mt-2 leading-relaxed"
                      style={{ color: "var(--white-30)" }}
                    >
                      Prices vary by date. Call for exact quote.
                    </p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <p
                      className="text-lg"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontStyle: "italic",
                        color: "var(--white-50)",
                      }}
                    >
                      Request a quote
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--white-30)" }}
                    >
                      Call us for the best available rate
                    </p>
                  </div>
                )}

                {/* CTA Buttons */}
                <a
                  href="tel:+919876543210"
                  className="group flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "var(--gold)", color: "#0A0A0A" }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  Call to Book
                </a>

                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-medium mt-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    border: "1px solid var(--gold-border)",
                    color: "var(--gold)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp Us
                </a>

                {/* Trust text */}
                <div
                  className="mt-6 pt-5 text-center"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--white-30)" }}
                  >
                    No markup, no hidden fees.
                    <br />
                    Same hotel, better rate.
                  </p>
                  <p
                    className="text-[10px] mt-3 tracking-wide uppercase"
                    style={{
                      color: "var(--white-15)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Our team confirms availability on call
                  </p>
                </div>

                {/* Chain / Brand info */}
                {(hotel.chain_name || hotel.brand_name) && (
                  <div
                    className="mt-5 pt-5"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <p
                      className="text-[10px] tracking-widest uppercase mb-2"
                      style={{
                        color: "var(--white-15)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Property Group
                    </p>
                    {hotel.chain_name && (
                      <p className="text-xs mb-1" style={{ color: "var(--white-30)" }}>
                        Chain:{" "}
                        <span style={{ color: "var(--white-50)" }}>
                          {hotel.chain_name}
                        </span>
                      </p>
                    )}
                    {hotel.brand_name && (
                      <p className="text-xs" style={{ color: "var(--white-30)" }}>
                        Brand:{" "}
                        <span style={{ color: "var(--white-50)" }}>
                          {hotel.brand_name}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ Footer spacer ═══════════════════ */}
      <div style={{ height: "80px" }} />
    </div>
  );
}
